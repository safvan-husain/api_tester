import { create } from 'zustand';
import { IRequest, CreateRequestPayload, UpdateRequestPayload, useGetRequests } from '@/lib/api/requests';
import React from 'react'; // Import React for useEffect in useInitializeRequestStore

// Define the store's state and actions
interface RequestState {
    requests: IRequest[];
    selectedRequest: IRequest | null;
    isLoading: boolean; // For initial data loading
    isMutating: boolean; // For create/update operations
    error: Error | null;
    mutationError: Error | null;

    // Actions related to fetching data (primarily for initialization)
    setRequests: (requests: IRequest[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: Error | null) => void;

    // Actions related to request manipulation
    // These will now incorporate calling the mutation functions passed from components
    addRequest: (
        requestPayload: CreateRequestPayload,
        createMutationFn: (payload: CreateRequestPayload) => Promise<IRequest>
    ) => Promise<void>;

    updateRequest: (
        requestPayload: UpdateRequestPayload,
        updateMutationFn: (payload: UpdateRequestPayload) => Promise<IRequest>
    ) => Promise<void>;

    selectRequest: (request: IRequest | null) => void;

    // Action to add a new draft locally, then trigger save
    addNewRequestAndSave: (
        createMutationFn: (payload: CreateRequestPayload) => Promise<IRequest>
    ) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set, get) => ({
    requests: [],
    selectedRequest: null,
    isLoading: false,
    isMutating: false,
    error: null,
    mutationError: null,

    setRequests: (requests) => set({ requests, isLoading: false }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error, isLoading: false }),

    addRequest: async (requestPayload, createMutationFn) => {
        set({ isMutating: true, mutationError: null });
        try {
            const newRequest = await createMutationFn(requestPayload);
            set((state) => ({
                requests: [...state.requests, newRequest],
                selectedRequest: newRequest, // Optionally select the new request
                isMutating: false,
            }));
            // React Query's onSuccess will handle cache invalidation
        } catch (e: any) {
            set({ mutationError: e, isMutating: false });
            throw e; // Re-throw for the caller to handle
        }
    },

    updateRequest: async (requestPayload, updateMutationFn) => {
        set({ isMutating: true, mutationError: null });
        try {
            const updatedRequest = await updateMutationFn(requestPayload);
            set((state) => ({
                requests: state.requests.map((req) =>
                    req.id === updatedRequest.id ? updatedRequest : req
                ),
                selectedRequest: state.selectedRequest?.id === updatedRequest.id ? updatedRequest : state.selectedRequest,
                isMutating: false,
            }));
            // React Query's onSuccess will handle cache invalidation
        } catch (e: any) {
            set({ mutationError: e, isMutating: false });
            throw e; // Re-throw for the caller to handle
        }
    },

    selectRequest: (request: IRequest | null) => {
        set({ selectedRequest: request });
    },

    addNewRequestAndSave: async (createMutationFn) => {
        const newDraftPayload: CreateRequestPayload = {
            name: 'New Request',
            method: 'GET',
            url: '',
            body: {},
            // headers: {}, // Initialize if needed
        };
        // We don't add to local state immediately.
        // We call the mutation, and React Query's onSuccess (which invalidates and refetches)
        // will lead to the store being updated via useInitializeRequestStore,
        // or the addRequest action can update the store if called directly with the result.
        // For now, let's rely on the createMutationFn to return the new request and then update.
        set({ isMutating: true, mutationError: null });
        try {
            const newRequest = await createMutationFn(newDraftPayload);
            set((state) => ({
                requests: [...state.requests, newRequest], // Add to local state after successful creation
                selectedRequest: newRequest, // Select the newly created and saved request
                isMutating: false,
            }));
            
        } catch (e: any) {
            console.error("Failed to save new request:", e);
            set({ mutationError: e, isMutating: false });
            // Optionally, add the draft locally even if save fails, with a flag indicating it's unsaved.
            // For simplicity, we're not doing that here yet.
            throw e;
        }
    },
}));

// Custom hook to initialize the store with data from React Query
export const useInitializeRequestStore = () => {
    const { data: fetchedRequests, isLoading: queryIsLoading, error: queryError } = useGetRequests();
    const { setLoading, setError } = useRequestStore(); // Only get setters, not state that causes re-renders

    React.useEffect(() => {
        if (queryIsLoading) {
            setLoading(true);
        }
    }, [queryIsLoading, setLoading]);

    React.useEffect(() => {
        if (fetchedRequests) {
            const currentRequests = useRequestStore.getState().requests;
            // Only update if fetchedRequests is different from current requests
            // A simple length check and then a more robust comparison if lengths match
            if (fetchedRequests.length !== currentRequests.length ||
                JSON.stringify(fetchedRequests) !== JSON.stringify(currentRequests)) {
                useRequestStore.setState({ requests: fetchedRequests, isLoading: false });
            } else if (fetchedRequests.length === 0 && currentRequests.length === 0) {
                // If both are empty, ensure loading is false
                useRequestStore.setState({ isLoading: false });
            }
        }
    }, [fetchedRequests]);

    React.useEffect(() => {
        if (queryError) {
            setError(queryError);
        }
    }, [queryError, setError]);

    // The store's isLoading and error will reflect the query's state.
    return { isLoading: queryIsLoading, error: queryError };
};
