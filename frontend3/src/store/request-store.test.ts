import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRequestStore, useInitializeRequestStore } from './request-store';
import { useGetRequests } from '@/lib/api/requests';

// Mock the useGetRequests hook from React Query
vi.mock('@/lib/api/requests', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useGetRequests: vi.fn(),
    };
});

const mockUseGetRequests = useGetRequests as vi.MockedFunction<typeof useGetRequests>;

describe('useRequestStore', () => {
    beforeEach(() => {
        // Reset the store before each test
        useRequestStore.setState({
            requests: [],
            selectedRequest: null,
            isLoading: false,
            isMutating: false,
            error: null,
            mutationError: null,
        });
        mockUseGetRequests.mockReset();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useRequestStore());
        expect(result.current.requests).toEqual([]);
        expect(result.current.selectedRequest).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isMutating).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.mutationError).toBeNull();
    });

    it('should set requests', () => {
        const { result } = renderHook(() => useRequestStore());
        const mockRequests = [{ id: '1', name: 'Test 1', method: 'GET', url: '' }];
        act(() => {
            result.current.setRequests(mockRequests);
        });
        expect(result.current.requests).toEqual(mockRequests);
        expect(result.current.isLoading).toBe(false); // Should set isLoading to false
    });

    it('should set loading state', () => {
        const { result } = renderHook(() => useRequestStore());
        act(() => {
            result.current.setLoading(true);
        });
        expect(result.current.isLoading).toBe(true);
    });

    it('should set error state', () => {
        const { result } = renderHook(() => useRequestStore());
        const mockError = new Error('Failed to fetch');
        act(() => {
            result.current.setError(mockError);
        });
        expect(result.current.error).toEqual(mockError);
        expect(result.current.isLoading).toBe(false); // Should set isLoading to false
    });

    it('should add a request and select it', async () => {
        const { result } = renderHook(() => useRequestStore());
        const createMutationFn = vi.fn(async (payload) => ({ id: 'new-id', ...payload }));
        const newRequestPayload = { name: 'New Request', method: 'POST', url: '/api' };

        await act(async () => {
            await result.current.addRequest(newRequestPayload, createMutationFn);
        });

        expect(createMutationFn).toHaveBeenCalledWith(newRequestPayload);
        expect(result.current.requests).toEqual([{ id: 'new-id', ...newRequestPayload }]);
        expect(result.current.selectedRequest).toEqual({ id: 'new-id', ...newRequestPayload });
        expect(result.current.isMutating).toBe(false);
    });

    it('should handle error when adding a request', async () => {
        const { result } = renderHook(() => useRequestStore());
        const mockError = new Error('Add failed');
        const createMutationFn = vi.fn(async () => { throw mockError; });
        const newRequestPayload = { name: 'New Request', method: 'POST', url: '/api' };

        let caughtError: any;
        await act(async () => {
            try {
                await result.current.addRequest(newRequestPayload, createMutationFn);
            } catch (e) {
                caughtError = e;
            }
        });

        expect(caughtError).toEqual(mockError);
        expect(result.current.mutationError).toEqual(mockError);
        expect(result.current.isMutating).toBe(false);
        expect(result.current.requests).toEqual([]);
    });

    it('should update an existing request', async () => {
        const { result } = renderHook(() => useRequestStore());
        const initialRequest = { id: '1', name: 'Old Name', method: 'GET', url: '' };
        act(() => {
            result.current.setRequests([initialRequest]);
            result.current.selectRequest(initialRequest);
        });

        const updateMutationFn = vi.fn(async (payload) => ({ ...initialRequest, ...payload }));
        const updatedRequestPayload = { id: '1', name: 'Updated Name', method: 'PUT' };

        await act(async () => {
            await result.current.updateRequest(updatedRequestPayload, updateMutationFn);
        });

        expect(updateMutationFn).toHaveBeenCalledWith(updatedRequestPayload);
        expect(result.current.requests).toEqual([{ id: '1', name: 'Updated Name', method: 'PUT', url: '' }]);
        expect(result.current.selectedRequest).toEqual({ id: '1', name: 'Updated Name', method: 'PUT', url: '' });
        expect(result.current.isMutating).toBe(false);
    });

    it('should handle error when updating a request', async () => {
        const { result } = renderHook(() => useRequestStore());
        const initialRequest = { id: '1', name: 'Old Name', method: 'GET', url: '' };
        act(() => {
            result.current.setRequests([initialRequest]);
        });

        const mockError = new Error('Update failed');
        const updateMutationFn = vi.fn(async () => { throw mockError; });
        const updatedRequestPayload = { id: '1', name: 'Updated Name', method: 'PUT' };

        let caughtError: any;
        await act(async () => {
            try {
                await result.current.updateRequest(updatedRequestPayload, updateMutationFn);
            } catch (e) {
                caughtError = e;
            }
        });

        expect(caughtError).toEqual(mockError);
        expect(result.current.mutationError).toEqual(mockError);
        expect(result.current.isMutating).toBe(false);
        expect(result.current.requests).toEqual([initialRequest]); // Should remain unchanged
    });

    it('should select a request', () => {
        const { result } = renderHook(() => useRequestStore());
        const mockRequest = { id: '1', name: 'Test 1', method: 'GET', url: '' };
        act(() => {
            result.current.selectRequest(mockRequest);
        });
        expect(result.current.selectedRequest).toEqual(mockRequest);
    });

    it('should add a new request and save it via mutation', async () => {
        const { result } = renderHook(() => useRequestStore());
        const createMutationFn = vi.fn(async (payload) => ({ id: 'draft-id', ...payload }));

        await act(async () => {
            await result.current.addNewRequestAndSave(createMutationFn);
        });

        expect(createMutationFn).toHaveBeenCalledWith({
            name: 'New Request',
            method: 'GET',
            url: '',
            body: {},
        });
        expect(result.current.requests).toEqual([
            { id: 'draft-id', name: 'New Request', method: 'GET', url: '', body: {} },
        ]);
        expect(result.current.selectedRequest).toEqual(
            { id: 'draft-id', name: 'New Request', method: 'GET', url: '', body: {} },
        );
        expect(result.current.isMutating).toBe(false);
    });

    it('should handle error when adding and saving a new request', async () => {
        const { result } = renderHook(() => useRequestStore());
        const mockError = new Error('Save failed');
        const createMutationFn = vi.fn(async () => { throw mockError; });

        let caughtError: any;
        await act(async () => {
            try {
                await result.current.addNewRequestAndSave(createMutationFn);
            } catch (e) {
                caughtError = e;
            }
        });

        expect(caughtError).toEqual(mockError);
        expect(result.current.mutationError).toEqual(mockError);
        expect(result.current.isMutating).toBe(false);
        expect(result.current.requests).toEqual([]);
    });
});

describe('useInitializeRequestStore', () => {
    beforeEach(() => {
        useRequestStore.setState({
            requests: [],
            selectedRequest: null,
            isLoading: false,
            isMutating: false,
            error: null,
            mutationError: null,
        });
        mockUseGetRequests.mockReset();
    });

    it('should set loading state when query is loading', () => {
        mockUseGetRequests.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: undefined,
        });

        const { result } = renderHook(() => useInitializeRequestStore());

        expect(result.current.isLoading).toBe(true);
        expect(useRequestStore.getState().isLoading).toBe(true);
    });

    it('should set requests and loading to false when data is fetched', () => {
        const mockRequests = [{ id: '1', name: 'Fetched', method: 'GET', url: '' }];
        mockUseGetRequests.mockReturnValue({
            data: mockRequests,
            isLoading: false,
            error: undefined,
        });

        const { result } = renderHook(() => useInitializeRequestStore());

        expect(result.current.isLoading).toBe(false);
        expect(useRequestStore.getState().requests).toEqual(mockRequests);
        expect(useRequestStore.getState().isLoading).toBe(false);
    });

    it('should set error state when query has an error', () => {
        const mockError = new Error('Query Error');
        mockUseGetRequests.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: mockError,
        });

        const { result } = renderHook(() => useInitializeRequestStore());

        expect(result.current.error).toEqual(mockError);
        expect(useRequestStore.getState().error).toEqual(mockError);
        expect(useRequestStore.getState().isLoading).toBe(false); // Should set isLoading to false
    });

    it('should not update requests if they are the same', () => {
        const mockRequests = [{ id: '1', name: 'Fetched', method: 'GET', url: '' }];
        // Initialize store with these requests first
        useRequestStore.setState({ requests: mockRequests });

        mockUseGetRequests.mockReturnValue({
            data: mockRequests,
            isLoading: false,
            error: undefined,
        });

        const setStateSpy = vi.spyOn(useRequestStore, 'setState');

        renderHook(() => useInitializeRequestStore());

        // Expect setState not to be called again for requests if they are identical
        expect(setStateSpy).not.toHaveBeenCalledWith(expect.objectContaining({ requests: mockRequests }));
        setStateSpy.mockRestore();
    });

    it('should update requests if lengths differ', () => {
        const initialRequests = [{ id: '1', name: 'Initial', method: 'GET', url: '' }];
        useRequestStore.setState({ requests: initialRequests });

        const fetchedRequests = [
            { id: '1', name: 'Initial', method: 'GET', url: '' },
            { id: '2', name: 'New', method: 'POST', url: '' },
        ];
        mockUseGetRequests.mockReturnValue({
            data: fetchedRequests,
            isLoading: false,
            error: undefined,
        });

        renderHook(() => useInitializeRequestStore());

        expect(useRequestStore.getState().requests).toEqual(fetchedRequests);
    });

    it('should update requests if content differs even with same length', () => {
        const initialRequests = [{ id: '1', name: 'Initial', method: 'GET', url: '' }];
        useRequestStore.setState({ requests: initialRequests });

        const fetchedRequests = [{ id: '1', name: 'Updated', method: 'GET', url: '' }];
        mockUseGetRequests.mockReturnValue({
            data: fetchedRequests,
            isLoading: false,
            error: undefined,
        });

        renderHook(() => useInitializeRequestStore());

        expect(useRequestStore.getState().requests).toEqual(fetchedRequests);
    });

    it('should handle empty fetchedRequests and empty currentRequests', () => {
        useRequestStore.setState({ requests: [], isLoading: true }); // Simulate initial loading state

        mockUseGetRequests.mockReturnValue({
            data: [],
            isLoading: false,
            error: undefined,
        });

        renderHook(() => useInitializeRequestStore());

        expect(useRequestStore.getState().requests).toEqual([]);
        expect(useRequestStore.getState().isLoading).toBe(false);
    });
});
