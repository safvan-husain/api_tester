'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IRequest, UpdateRequestPayload } from '@/lib/api/requests';
import { useRequestStore } from '@/store/request-store';
import { toast } from "sonner"; // For displaying success/error messages
import { debounce } from 'lodash'; // For debouncing updates

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

interface RequestDetailsTabsProps {
    updateRequestMutationFn: (payload: UpdateRequestPayload) => Promise<IRequest>;
}

const RequestDetailsTabs: React.FC<RequestDetailsTabsProps> = ({ updateRequestMutationFn }) => {
    const { selectedRequest, updateRequest: storeUpdateRequest, isMutating } = useRequestStore();

    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [method, setMethod] = useState('GET');
    const [body, setBody] = useState<Record<string, any> | string>('');

    useEffect(() => {
        if (selectedRequest) {
            setName(selectedRequest.name || 'New Request');
            setUrl(selectedRequest.url || '');
            setMethod(selectedRequest.method || 'GET');
            setBody(selectedRequest.body ? JSON.stringify(selectedRequest.body, null, 2) : '');
        } else {
            setName('New Request');
            setUrl('');
            setMethod('GET');
            setBody('');
        }
    }, [selectedRequest]);

    // Debounced version of the store update function
    const debouncedUpdateRequest = useCallback(
        debounce(async (updatedPayload: UpdateRequestPayload) => {
            try {
                await storeUpdateRequest(updatedPayload, updateRequestMutationFn);
                toast.success("Request updated!");
            } catch (error: any) {
                toast.error(`Failed to update request: ${error.message || 'Unknown error'}`);
                console.error("Update request failed:", error);
                // Optionally revert local state if needed, though Zustand handles optimistic updates if designed that way.
                // For now, we're relying on the store's state after the attempt.
            }
        }, 1000), // 1000ms debounce delay
        [storeUpdateRequest, updateRequestMutationFn]
    );


    const handleFieldChange = (field: keyof Omit<IRequest, 'id' | 'createdAt' | 'updatedAt'>, value: string) => {
        if (selectedRequest) {
            // Update local state immediately for responsiveness
            let currentLocalState = { name, url, method, body };
            switch (field) {
                case 'name': setName(value); currentLocalState.name = value; break;
                case 'url': setUrl(value); currentLocalState.url = value; break;
                case 'method': setMethod(value); currentLocalState.method = value; break;
                case 'body': 
                    setBody(value); 
                    try {
                        currentLocalState.body = JSON.parse(value);
                    } catch (e) {
                        // handle invalid json
                    }
                    break;
            }

            // Prepare payload for debounced update
            const updatedPayload: UpdateRequestPayload = {
                id: selectedRequest.id,
                name: field === 'name' ? value : name,
                url: field === 'url' ? value : url,
                method: field === 'method' ? value : method,
                body: field === 'body' ? JSON.parse(value) : body,
            };
            // If it's a new request (ID is a draft ID), don't try to update backend yet.
            // It should be saved first via "Add New Request" which creates it on backend.
            if (!selectedRequest.id.startsWith('draft-')) {
                debouncedUpdateRequest(updatedPayload);
            } else {
                // For draft requests, update the store locally without backend call (if store supports it)
                // Or, simply update local state and rely on the "Save" (which is "Add New" for drafts)
                // For now, local state is updated, and store's `updateRequest` handles backend.
                // The current `storeUpdateRequest` expects a backend call.
                // This part might need refinement if we want pure local drafts before first save.
                // Let's assume for now that `selectedRequest` always has a backend-valid ID after creation.
                console.log("Draft request changed locally, will be saved with next 'Send' or explicit save action if implemented.");
            }
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('name', e.target.value);
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('url', e.target.value);
    const handleMethodChange = (value: string) => handleFieldChange('method', value);
    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('body', e.target.value);

    const handleSend = async () => {
        if (selectedRequest) {
            // Ensure latest values from local state are used for sending,
            // as debounced update might not have fired yet.
            const payloadForSend: UpdateRequestPayload = {
                id: selectedRequest.id,
                name, url, method, body: typeof body === 'string' ? JSON.parse(body) : body
            };

            // If it's a new request that hasn't been saved to backend yet, this 'Send' could trigger its first save.
            // However, current flow: 'Add New' creates it, then subsequent changes update.
            // If it's a draft, it should have been saved by `onAddNewRequest` in sidebar.
            // So, this send should ideally be for an existing request.

            // If the request is not a draft, update it before sending (or ensure it's updated)
            if (!selectedRequest.id.startsWith('draft-')) {
                // Cancel any pending debounced update to avoid race conditions
                debouncedUpdateRequest.cancel();
                try {
                    await storeUpdateRequest(payloadForSend, updateRequestMutationFn);
                    toast.success("Request saved, now sending...");
                    // Actual send logic (calling an API with the request details)
                    console.log('Sending request:', { ...selectedRequest, ...payloadForSend });
                    // TODO: Implement actual API call for sending the request and handling response
                    toast.info("Send functionality not fully implemented yet.");
                } catch (error: any) {
                    toast.error(`Failed to save before sending: ${error.message || 'Unknown error'}`);
                    return; // Don't proceed to send if save failed
                }
            } else {
                // This case (sending a pure local draft) should ideally be handled by a "Save & Send"
                // or by ensuring "Add New Request" properly saves it first.
                toast.warning("Please save the new request first (via 'Add New Request' which now auto-saves). This 'Send' is for saved requests.");
                console.log('Attempting to send a draft request that might not exist on backend:', selectedRequest);
                // For now, we'll log and prevent actual send if it's a local draft.
                return;
            }
        } else {
            console.log('Attempted to send with no selected request.');
            toast.error("No request selected to send.");
        }
    };

    if (!selectedRequest) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="text-center">
                    <p className="text-lg font-semibold mb-2">No Request Selected</p>
                    <p className="text-sm text-muted-foreground">
                        Select a request from the sidebar or create a new one to see its details.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Request Name"
                    value={name}
                    onChange={handleNameChange}
                    className="text-lg font-semibold"
                    disabled={isMutating}
                />
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <Select value={method} onValueChange={handleMethodChange} disabled={isMutating}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                        {httpMethods.map((m) => (
                            <SelectItem key={m} value={m}>
                                {m}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="text"
                    placeholder="Enter request URL"
                    value={url}
                    onChange={handleUrlChange}
                    className="flex-grow"
                    disabled={isMutating}
                />
                <Button onClick={handleSend} disabled={isMutating || selectedRequest.id.startsWith('draft-')} title={selectedRequest.id.startsWith('draft-') ? "Save new request first via Sidebar" : "Send Request"}>
                    {isMutating ? 'Saving...' : 'Send'}
                </Button>
            </div>

            <Tabs defaultValue="body" className="flex-grow flex flex-col">
                <TabsList className="mb-4 shrink-0">
                    <TabsTrigger value="params">Query Params</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="auth">Authorization</TabsTrigger>
                </TabsList>
                <TabsContent value="params" className="flex-grow">
                    <div className="p-4 border rounded-md h-full">
                        <p className="text-sm text-muted-foreground">Query parameters editor will be here.</p>
                    </div>
                </TabsContent>
                <TabsContent value="headers" className="flex-grow">
                    <div className="p-4 border rounded-md h-full">
                        <p className="text-sm text-muted-foreground">Headers editor will be here.</p>
                    </div>
                </TabsContent>
                <TabsContent value="body" className="flex-grow flex flex-col">
                    <Textarea
                        placeholder='Enter request body (e.g., JSON, XML)'
                        value={typeof body === 'string' ? body : JSON.stringify(body, null, 2)}
                        onChange={handleBodyChange}
                        className='flex-grow resize-none'
                        disabled={isMutating}
                    />
                </TabsContent>
                <TabsContent value="auth" className="flex-grow">
                    <div className="p-4 border rounded-md h-full">
                        <p className="text-sm text-muted-foreground">Authorization options will be here (e.g., Bearer Token).</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default RequestDetailsTabs;
