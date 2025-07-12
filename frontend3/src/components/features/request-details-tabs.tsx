'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
// Using standard HTML checkbox as @radix-ui/react-checkbox is not installed
// import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from 'lucide-react'; // For delete icon
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
    const [body, setBody] = useState<string>(''); // Keep body as string for Textarea, ensure it's always string

    // Query Params State
    // Adding an 'id' for React key prop when rendering lists of inputs
    const [queryParams, setQueryParams] = useState<Array<{ id: string; key: string; value: string; enabled: boolean }>>([]);

    // Authorization State
    const [auth, setAuth] = useState<IRequest['auth']>({ type: 'none' });

    // State for API response
    const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
    const [apiError, setApiError] = useState<ApiError | null>(null);
    const [isSending, setIsSending] = useState(false); // For loading state of the send action

    useEffect(() => {
        if (selectedRequest) {
            setName(selectedRequest.name || 'New Request');
            setUrl(selectedRequest.url || '');
            setMethod(selectedRequest.method || 'GET');
            // Ensure body is a string for the Textarea. If selectedRequest.body is an object, stringify it.
            if (typeof selectedRequest.body === 'object' && selectedRequest.body !== null) {
                setBody(JSON.stringify(selectedRequest.body, null, 2));
            } else if (typeof selectedRequest.body === 'string') {
                setBody(selectedRequest.body);
            } else {
                setBody('');
            }
            // Initialize queryParams, generating a local unique ID for each for list rendering
            // TODO: Use a proper UUID generator here if available, for more robust unique IDs
            setQueryParams(
                selectedRequest.queryParams?.map((p, index) => ({
                    id: `qp-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Generate a simple unique ID
                    key: p.key,
                    value: p.value,
                    enabled: p.enabled,
                })) || []
            );
            setAuth(selectedRequest.auth || { type: 'none' });

            // Reset response/error state when selected request changes
            setApiResponse(null);
            setApiError(null);
        } else {
            // Reset all fields for a new or deselected request
            setName('New Request');
            setUrl('');
            setMethod('GET');
            setBody('');
            setQueryParams([]);
            setAuth({ type: 'none' });
            setApiResponse(null);
            setApiError(null);
        }
    }, [selectedRequest]);

    // Debounced version of the store update function
    const debouncedUpdateRequest = useCallback(
        debounce(async (updatedData: Partial<Omit<IRequest, 'id' | 'createdAt' | 'updatedAt'>>) => {
            if (!selectedRequest || selectedRequest.id.startsWith('draft-')) {
                // Don't send updates for draft requests or if no request is selected
                return;
            }
            try {
                const payload: UpdateRequestPayload = {
                    id: selectedRequest.id,
                    ...updatedData,
                };
                await storeUpdateRequest(payload, updateRequestMutationFn);
                // toast.success("Request auto-saved!"); // Potentially too noisy
            } catch (error: any) {
                toast.error(`Failed to auto-save request: ${error.message || 'Unknown error'}`);
                console.error("Auto-save request failed:", error);
            }
        }, 1000), // 1000ms debounce delay
        [selectedRequest, storeUpdateRequest, updateRequestMutationFn] // Added selectedRequest to dependencies
    );

    // Centralized function to gather current state and trigger the debounced update
    const triggerDebouncedUpdate = useCallback(() => {
        if (selectedRequest && !selectedRequest.id.startsWith('draft-')) {
            // For auto-save, send the raw string body. Parsing happens only for actual 'Send' action.
            // The IRequest.body type is now string | undefined.
            const queryParamsToSave = queryParams.map(({ id, ...rest }) => rest); // Strip client-side 'id'

            debouncedUpdateRequest({
                name,
                url,
                method,
                body: body, // Send the raw string body
                queryParams: queryParamsToSave,
                auth,
            });
        }
    }, [name, url, method, body, queryParams, auth, selectedRequest, debouncedUpdateRequest]);


    // Handlers for basic fields - these now just update local state.
    // A useEffect will watch these states and call triggerDebouncedUpdate.
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
    };
    const handleMethodChange = (value: string) => {
        setMethod(value);
    };
    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBody(e.target.value);
    };

    // Query Param Handlers
    const handleAddQueryParam = () => {
        // TODO: Use a proper UUID generator for more robust unique IDs if available
        const newId = `qp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        setQueryParams(prevParams => [...prevParams, { id: newId, key: '', value: '', enabled: true }]);
        // The useEffect watching queryParams will trigger the debounced update
    };

    const handleQueryParamChange = (id: string, field: 'key' | 'value', value: string) => {
        setQueryParams(prevParams =>
            prevParams.map(p => (p.id === id ? { ...p, [field]: value } : p))
        );
        // The useEffect watching queryParams will trigger the debounced update
    };

    const handleToggleQueryParam = (id: string) => {
        setQueryParams(prevParams =>
            prevParams.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p))
        );
        // The useEffect watching queryParams will trigger the debounced update
    };

    const handleRemoveQueryParam = (id: string) => {
        setQueryParams(prevParams => prevParams.filter(p => p.id !== id));
        // The useEffect watching queryParams will trigger the debounced update
    };

    // Placeholder for Auth Handler (to be implemented in next step)
    const handleAuthChange = (newAuth: IRequest['auth']) => {
        setAuth(newAuth); // Directly set auth state
        // The useEffect watching auth will trigger the debounced update
    };


    // useEffect to trigger debounced update when relevant form fields change.
    // This ensures that any change to these fields will eventually lead to an auto-save.
    const isInitialMount = React.useRef(true);
    useEffect(() => {
        // Don't trigger update on initial mount/population from selectedRequest.
        // The `useEffect` that populates from `selectedRequest` handles the initial state.
        // This `useEffect` is for changes made by the user *after* initial population.
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        triggerDebouncedUpdate();
    }, [name, url, method, body, queryParams, auth, triggerDebouncedUpdate]);

    // Reset isInitialMount when selectedRequest changes, so the above useEffect
    // correctly triggers for user edits on a newly selected request.
    useEffect(() => {
        isInitialMount.current = true;
    }, [selectedRequest]);


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

            // Filter out the 'id' from queryParams before saving
            const queryParamsToSave = queryParams.map(({ id, ...rest }) => rest);

            // Save the current state of the request (including queryParams and auth) before sending
            // Body is saved as a string, as per user request.
            const currentRequestStatePayload: UpdateRequestPayload = {
                id: selectedRequest.id,
                name,
                url, // Base URL
                method,
                body: body, // Save raw string body
                queryParams: queryParamsToSave,
                auth,
                // TODO: Add actual headers from a Headers tab here eventually
            };

            await storeUpdateRequest(currentRequestStatePayload, updateRequestMutationFn);
            toast.success("Request state saved, now sending...");

            // Prepare body FOR SENDING (parse to JSON)
            let parsedBodyForSendOnly: Record<string, any> | string | undefined = undefined;
            if (body.trim() !== '') {
                try {
                    parsedBodyForSendOnly = JSON.parse(body);
                } catch (e) {
                    // As per original logic, if body is not JSON, it was sent as raw string to proxy.
                    // However, the SendRequestDto on backend expects 'body: any'.
                    // For robust behavior, let's stick to sending JSON or nothing if it's meant to be structured.
                    // If user wants to send plain text, Content-Type header should indicate that.
                    // For now, if it's not JSON, we'll show an error as before the body type change.
                    toast.error("Request body is not valid JSON. Please correct it or ensure Content-Type is appropriate if sending plain text.");
                    setIsSending(false);
                    return;
                }
            }

            // Construct URL with Query Params for sending
            const finalUrl = new URL(url);
            queryParams.forEach(param => {
                if (param.enabled && param.key) {
                    finalUrl.searchParams.append(param.key, param.value);
                }
            });

            // Prepare Headers for sending
            const sendingHeaders: Record<string, string> = {};
            // TODO: Populate from a Headers UI in the future. For now, start empty or with defaults.
            // e.g., if (body) sendingHeaders['Content-Type'] = 'application/json';

            if (auth?.type === 'bearer' && auth.token) {
                sendingHeaders['Authorization'] = `Bearer ${auth.token}`;
            } else if (auth?.type === 'basic' && auth.username) {
                const credentials = btoa(`${auth.username}:${auth.password || ''}`);
                sendingHeaders['Authorization'] = `Basic ${credentials}`;
            }
            // Add other headers from a (future) Headers tab here
            // For example: selectedRequest.headers?.forEach(h => sendingHeaders[h.key] = h.value);


            const sendPayload = {
                url: finalUrl.toString(), // URL with query params
                method,
                body: parsedBodyForSendOnly, // Parsed body of the *target* request (or raw string if not JSON and proxy handles it)
                headers: sendingHeaders, // Headers including Auth
            };

            // TODO: Make the backend URL configurable, perhaps via an environment variable.
            // Assuming NestJS backend runs on port 3001 locally.
            const nestJsBackendUrl = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';
            const endpoint = `${nestJsBackendUrl}/api/v1/requester/send`;

            const response = await fetch(endpoint, {
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
                <TabsContent value="params" className="flex-grow flex flex-col space-y-4 p-1">
                    <div className="flex-grow p-4 border rounded-md h-full overflow-y-auto">
                        {queryParams.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No query parameters defined.</p>
                        )}
                        {queryParams.map((param) => (
                            <div key={param.id} className="flex items-center space-x-2 mb-2">
                                <input
                                    type="checkbox"
                                    id={`param-enabled-${param.id}`}
                                    checked={param.enabled}
                                    onChange={() => handleToggleQueryParam(param.id)}
                                    disabled={isSaving || isSending}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Input
                                    type="text"
                                    placeholder="Key"
                                    value={param.key}
                                    onChange={(e) => handleQueryParamChange(param.id, 'key', e.target.value)}
                                    className="flex-grow"
                                    disabled={isSaving || isSending}
                                />
                                <Input
                                    type="text"
                                    placeholder="Value"
                                    value={param.value}
                                    onChange={(e) => handleQueryParamChange(param.id, 'value', e.target.value)}
                                    className="flex-grow"
                                    disabled={isSaving || isSending}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveQueryParam(param.id)}
                                    disabled={isSaving || isSending}
                                    title="Remove parameter"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleAddQueryParam} disabled={isSaving || isSending} className="shrink-0 self-start">
                        Add Parameter
                    </Button>
                </TabsContent>
                <TabsContent value="headers" className="flex-grow">
                    {/* TODO: Implement Headers Editor similar to Query Params */}
                    <div className="p-4 border rounded-md h-full">
                        <p className="text-sm text-muted-foreground">Headers editor will be here. (To be implemented)</p>
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
                <TabsContent value="auth" className="flex-grow flex flex-col space-y-4 p-1">
                    <div className="p-4 border rounded-md h-full space-y-4">
                        <div>
                            <label htmlFor="auth-type-select" className="block text-sm font-medium text-gray-700 mb-1">Auth Type</label>
                            <Select
                                value={auth?.type || 'none'}
                                onValueChange={(newType: 'none' | 'bearer' | 'basic') => {
                                    if (newType === 'none') {
                                        handleAuthChange({ type: 'none' });
                                    } else if (newType === 'bearer') {
                                        handleAuthChange({ type: 'bearer', token: auth?.type === 'bearer' ? auth.token : '' });
                                    } else if (newType === 'basic') {
                                        handleAuthChange({ type: 'basic', username: auth?.type === 'basic' ? auth.username : '', password: auth?.type === 'basic' ? auth.password : '' });
                                    }
                                }}
                                disabled={isSaving || isSending}
                            >
                                <SelectTrigger id="auth-type-select" className="w-[200px]">
                                    <SelectValue placeholder="Select auth type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="bearer">Bearer Token</SelectItem>
                                    <SelectItem value="basic">Basic Auth</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {auth?.type === 'bearer' && (
                            <div>
                                <label htmlFor="bearer-token-input" className="block text-sm font-medium text-gray-700 mb-1">Bearer Token</label>
                                <Input
                                    id="bearer-token-input"
                                    type="text"
                                    placeholder="Bearer Token"
                                    value={auth.token || ''}
                                    onChange={(e) => handleAuthChange({ type: 'bearer', token: e.target.value })}
                                    className="w-full"
                                    disabled={isSaving || isSending}
                                />
                            </div>
                        )}

                        {auth?.type === 'basic' && (
                            <div className="space-y-2">
                                <div>
                                    <label htmlFor="basic-auth-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <Input
                                        id="basic-auth-username"
                                        type="text"
                                        placeholder="Username"
                                        value={auth.username || ''}
                                        onChange={(e) => handleAuthChange({ ...auth, type: 'basic', username: e.target.value })}
                                        className="w-full"
                                        disabled={isSaving || isSending}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="basic-auth-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <Input
                                        id="basic-auth-password"
                                        type="password" // Use password type for masking
                                        placeholder="Password"
                                        value={auth.password || ''}
                                        onChange={(e) => handleAuthChange({ ...auth, type: 'basic', password: e.target.value })}
                                        className="w-full"
                                        disabled={isSaving || isSending}
                                    />
                                </div>
                            </div>
                        )}
                         {auth?.type === 'none' && (
                            <p className="text-sm text-muted-foreground">No authorization method selected.</p>
                        )}
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
