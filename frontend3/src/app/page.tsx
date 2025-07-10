'use client';

import React from 'react'; // useEffect removed as it's in useInitializeRequestStore
import Sidebar from '@/components/features/sidebar'; // Corrected import path
import RequestDetailsTabs from '../components/features/request-details-tabs';
import { useInitializeRequestStore, useRequestStore } from '../store/request-store';
import { useCreateRequest, useUpdateRequest } from '@/lib/api/requests';
import { Toaster } from "sonner" // For displaying success/error messages
import { toast } from "sonner"


export default function Home() {
    // Initialize the store with data fetched by React Query
    const { isLoading: storeIsLoading, error: storeError } = useInitializeRequestStore();

    // Get mutation functions from React Query hooks
    const createRequestMutation = useCreateRequest();
    const updateRequestMutation = useUpdateRequest();

    // Get actions from Zustand store
    const { addNewRequestAndSave, updateRequest, isMutating, mutationError } = useRequestStore();

    const handleAddNewRequest = async () => {
        try {
            await addNewRequestAndSave(createRequestMutation.mutateAsync);
            toast.success("Request created successfully!");
        } catch (error: any) {
            toast.error(`Failed to create request: ${error?.message || 'Unknown error'}`);
            console.error("Create request failed:", error);
        }
    };

    // This function will be passed to RequestDetailsTabs or called from there
    // For now, RequestDetailsTabs calls store's updateRequest directly,
    // so we need to ensure it gets the mutation function.
    // This might require a slight refactor of RequestDetailsTabs or how it accesses updateRequest.
    // Let's adjust RequestDetailsTabs to accept updateRequestMutation.mutateAsync

    if (storeIsLoading && !useRequestStore.getState().requests.length) { // Check if requests are actually empty
        return <div className="flex h-screen items-center justify-center">Loading application data...</div>;
    }

    if (storeError) {
        return <div className="flex h-screen items-center justify-center">Error loading application data: {storeError.message}</div>;
    }

    return (
        <main className="flex h-screen overflow-hidden">
            <Toaster richColors />
            <div className="w-1/4 max-w-xs min-w-[250px] h-full">
                {/* Pass the mutation wrapped action to Sidebar */}
                <Sidebar onAddNewRequest={handleAddNewRequest} />
            </div>
            <div className="flex-1 h-full overflow-y-auto">
                {/* Pass the update mutation to RequestDetailsTabs */}
                <RequestDetailsTabs updateRequestMutationFn={updateRequestMutation.mutateAsync} />
            </div>
            {isMutating && (
                <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-md shadow-lg">
                    Saving...
                </div>
            )}
            {/* mutationError is already handled by toast in this setup, but could be displayed here too */}
        </main>
    );
}
