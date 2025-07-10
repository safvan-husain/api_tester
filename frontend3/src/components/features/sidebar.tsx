'use client';

import React from 'react';
import { PlusIcon } from 'lucide-react';
import { useRequestStore } from '../../store/request-store';
import { IRequest } from '@/lib/api/requests';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SidebarProps {
    onAddNewRequest: () => Promise<void>; // Changed from addNewDraftRequest to a more generic name
}

const getMethodClass = (method: string): string => {
    switch (method.toUpperCase()) {
        case 'GET':
            return 'bg-blue-100 text-blue-700';
        case 'POST':
            return 'bg-green-100 text-green-700';
        case 'PUT':
            return 'bg-yellow-100 text-yellow-700';
        case 'DELETE':
            return 'bg-red-100 text-red-700';
        case 'PATCH':
            return 'bg-purple-100 text-purple-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const Sidebar: React.FC<SidebarProps> = ({ onAddNewRequest }) => {
    // `addNewDraftRequest` is removed from here as the action is now passed via props
    // and includes the backend call.
    const { requests, selectedRequest, selectRequest, isLoading, error, isMutating } = useRequestStore();

    if (isLoading && requests.length === 0) {
        return <div className="p-4">Loading requests...</div>;
    }

    if (error && requests.length === 0) {
        return <div className="p-4">Error loading requests: {error.message}</div>;
    }

    return (
        <div className="flex flex-col h-full border-r">
            <div className="p-4 border-b">
                {/*<Button onClick={onAddNewRequest} className="w-full" disabled={isMutating}>*/}
                    <PlusIcon className="mr-2 h-4 w-4" />
                    {isMutating ? 'Adding...' : 'Add New Request'}
                {/*</Button>*/}
            </div>
            <ScrollArea className="flex-grow">
                <div className="p-4 space-y-2">
                    {requests.map((request: IRequest) => (
                        <Card
                            key={request.id}
                            onClick={() => selectRequest(request)}
                            className={`cursor-pointer transition-colors ${
                                selectedRequest?.id === request.id
                                    ? 'border-primary bg-muted'
                                    : 'hover:bg-accent'
                            }`}
                        >
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between space-x-2">
                  <span className="font-semibold truncate flex-1" title={request.name}>
                    {request.name}
                  </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${getMethodClass(request.method)}`}>
                    {request.method.toUpperCase()}
                  </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {requests.length === 0 && !isLoading && !isMutating && (
                        <p className="text-sm text-muted-foreground p-4 text-center">No requests found. Click "Add New Request" to start.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default Sidebar;
