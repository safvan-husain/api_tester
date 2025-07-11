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

// Define a type for the API response structure
interface ApiResponse {
    data: any;
    status: number;
    headers: Record<string, string>;
}

interface ApiError {
    error: string;
    details?: any;
}

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

interface RequestDetailsTabsProps {
    updateRequestMutationFn: (payload: UpdateRequestPayload) => Promise<IRequest>;
}

const RequestDetailsTabs: React.FC<RequestDetailsTabsProps> = ({ updateRequestMutationFn }) => {
    const { selectedRequest, updateRequest: storeUpdateRequest, isMutating: isSaving } = useRequestStore(); // Renamed isMutating to isSaving for clarity

    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [method, setMethod] = useState('GET');
    const [body, setBody] = useState<string | undefined>(''); // Keep body as string for Textarea

    // State for API response
    const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
    const [apiError, setApiError] = useState<ApiError | null>(null);
    const [isSending, setIsSending] = useState(false); // For loading state of the send action

    useEffect(() => {
        if (selectedRequest) {
            setName(selectedRequest.name || 'New Request');
            setUrl(selectedRequest.url || '');
            setMethod(selectedRequest.method || 'GET');
            setBody(selectedRequest.body ? JSON.stringify(selectedRequest.body, null, 2) : '');
            // Reset response/error state when selected request changes
            setApiResponse(null);
            setApiError(null);
        } else {
            setName('New Request');
            setUrl('');
            setMethod('GET');
            setBody('');
            setApiResponse(null);
            setApiError(null);
        }
    }, [selectedRequest]);

    // Debounced version of the store update function
    const debouncedUpdateRequest = useCallback(
        debounce(async (updatedPayload: UpdateRequestPayload) => {
            try {
                await storeUpdateRequest(updatedPayload, updateRequestMutationFn);
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
            console.log(`field ${field} value ${value}`);
            const updatedPayload: UpdateRequestPayload = {
                id: selectedRequest.id,
                name: field === 'name' ? value : name,
                url: field === 'url' ? value : url,
                method: field === 'method' ? value : method,
                body: field === 'body' ? value : '',
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
        if (!selectedRequest || !url) {
            toast.error("No request selected or URL is empty.");
            return;
        }
        if (selectedRequest.id.startsWith('draft-')) {
            toast.warning("Please save the new request first. 'Send' is for saved requests.");
            return;
        }

        // Reset previous response/error
        setApiResponse(null);
        setApiError(null);
        setIsSending(true);

        // Ensure latest values from local state are used for sending,
        // as debounced update might not have fired yet.
        const payloadForSave: UpdateRequestPayload = {
            id: selectedRequest.id,
            name, url, method, body // body is already a string from local state
        };

        try {
            // Cancel any pending debounced update to avoid race conditions
            debouncedUpdateRequest.cancel();
            // Save the current state of the request before sending
            await storeUpdateRequest(payloadForSave, updateRequestMutationFn);
            toast.success("Request updated, now sending...");

            // Prepare request for the backend proxy
            let parsedBody;
            try {
                // Only parse if body is not empty and is valid JSON
                parsedBody = body && body.trim() !== '' ? JSON.parse(body) : undefined;
            } catch (e) {
                toast.error("Body is not valid JSON. Sending as plain text or empty.");
                // Depending on desired behavior, you might want to send `body` as is,
                // or prevent sending, or indicate it's not JSON.
                // For now, we'll let it be undefined if parsing fails,
                // or send as string if backend handles non-JSON.
                // The backend /api/send-request expects a JSON body for its 'body' field.
                // Let's assume the backend can handle if `body` field within the JSON payload is a string.
                parsedBody = body; // Send raw string if not JSON
            }

            const sendPayload = {
                url,
                method,
                body: parsedBody, // This is the body of the *target* request
                headers: {}, // TODO: Implement headers input and send them
            };

            const response = await fetch('/api/send-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sendPayload),
            });

            const result = await response.json();

            if (!response.ok) {
                // Error from our /api/send-request route itself (e.g., 500 internal error)
                // or if the proxy returned a structured error.
                const errorData = result as ApiError;
                toast.error(`API Proxy Error: ${errorData.error || response.statusText}`);
                setApiError(errorData);
                setApiResponse(null);
            } else {
                 // Success from our /api/send-request route, result contains { data, status, headers }
                const responseData = result as ApiResponse;
                toast.success(`Request sent! Status: ${responseData.status}`);
                setApiResponse(responseData);
                setApiError(null);
            }

        } catch (error: any) {
            console.error("Failed to send request:", error);
            toast.error(`Failed to send request: ${error.message || 'Unknown error'}`);
            setApiError({ error: error.message || 'An unknown error occurred' });
            setApiResponse(null);
        } finally {
            setIsSending(false);
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
                    disabled={isSaving || isSending}
                />
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <Select value={method} onValueChange={handleMethodChange} disabled={isSaving || isSending}>
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
                    disabled={isSaving || isSending}
                />
                <Button
                    onClick={handleSend}
                    disabled={isSaving || isSending || selectedRequest.id.startsWith('draft-') || !url.trim()}
                    title={selectedRequest.id.startsWith('draft-') ? "Save new request first via Sidebar" : (!url.trim() ? "URL cannot be empty" : "Send Request")}
                >
                    {isSending ? 'Sending...' : (isSaving ? 'Saving...' : 'Send')}
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
                        value={body} // body is now always string from local state
                        onChange={handleBodyChange}
                        className='flex-grow resize-none font-mono text-sm' // Added font-mono and text-sm for better code readability
                        disabled={isSaving || isSending}
                    />
                </TabsContent>
                <TabsContent value="auth" className="flex-grow">
                    <div className="p-4 border rounded-md h-full">
                        <p className="text-sm text-muted-foreground">Authorization options will be here (e.g., Bearer Token).</p>
                    </div>
                </TabsContent>
            </Tabs>

            {/* API Response/Error Display Section */}
            {(isSending || apiResponse || apiError) && ( // Show this section if sending, or if there's a response/error
                <div className="mt-6 flex-shrink-0"> {/* Use mt-6 for spacing, flex-shrink-0 to prevent shrinking */}
                    <h3 className="text-lg font-semibold mb-2">Response</h3>
                    {isSending && (
                        <div className="p-4 border rounded-md bg-muted">
                            <p className="text-sm text-muted-foreground">Sending request...</p>
                        </div>
                    )}
                    {apiError && (
                        <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
                            <p className="text-sm font-semibold">Error: {apiError.error}</p>
                            {apiError.details && (
                                <pre className="mt-2 text-xs whitespace-pre-wrap break-all">
                                    {JSON.stringify(apiError.details, null, 2)}
                                </pre>
                            )}
                        </div>
                    )}
                    {apiResponse && (
                        <Tabs defaultValue="response-body" className="border rounded-md">
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="response-body">Body</TabsTrigger>
                                <TabsTrigger value="response-headers">Headers</TabsTrigger>
                                <TabsTrigger value="response-status">Status</TabsTrigger>
                            </TabsList>
                            <TabsContent value="response-body" className="p-0">
                                <pre className="p-4 text-xs whitespace-pre-wrap break-all max-h-96 overflow-y-auto bg-muted/30 rounded-b-md">
                                    {typeof apiResponse.data === 'object'
                                        ? JSON.stringify(apiResponse.data, null, 2)
                                        : String(apiResponse.data)}
                                </pre>
                            </TabsContent>
                            <TabsContent value="response-headers" className="p-0">
                                <pre className="p-4 text-xs whitespace-pre-wrap break-all max-h-96 overflow-y-auto bg-muted/30 rounded-b-md">
                                    {Object.entries(apiResponse.headers)
                                        .map(([key, value]) => `${key}: ${value}`)
                                        .join('\n')}
                                </pre>
                            </TabsContent>
                            <TabsContent value="response-status" className="p-0">
                                <div className="p-4 text-sm bg-muted/30 rounded-b-md">
                                    <p>Status: <span className={`font-semibold ${apiResponse.status >= 200 && apiResponse.status < 300 ? 'text-green-600' : 'text-red-600'}`}>{apiResponse.status}</span></p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            )}
        </div>
    );
};

export default RequestDetailsTabs;
