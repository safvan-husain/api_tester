import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const apiClient = axios.create({ // Export apiClient
  baseURL: 'http://localhost:3001', // Ensure this matches your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface IRequest {
  id: string; // Assuming requests have an ID
  name: string;
  url: string;
  method: string;
  body?: string; // Optional body
  headers?: Record<string, string>; // Optional headers
  createdAt?: string; // Optional, might be assigned by backend
  updatedAt?: string; // Optional, might be assigned by backend
}

// Fetch all requests
export const getRequests = async (): Promise<IRequest[]> => {
  const { data } = await apiClient.get('/requests');
  return data;
};

export const useGetRequests = () => {
  return useQuery<IRequest[], Error>({
    queryKey: ['requests'],
    queryFn: getRequests,
  });
};

// Create a new request
// Use Omit to exclude 'id' and 'createdAt', 'updatedAt' as they are usually backend-generated
export type CreateRequestPayload = Omit<IRequest, 'id' | 'createdAt' | 'updatedAt'>;

export const createRequest = async (payload: CreateRequestPayload): Promise<IRequest> => {
  const { data } = await apiClient.post('/requests', payload);
  return data;
};

export const useCreateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<IRequest, Error, CreateRequestPayload>({
    mutationFn: createRequest,
    onSuccess: (newRequest) => {
      // Invalidate and refetch the requests query
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      // Optionally, update the cache directly
      // queryClient.setQueryData(['requests'], (oldData: IRequest[] | undefined) =>
      //   oldData ? [...oldData, newRequest] : [newRequest]
      // );
      // queryClient.setQueryData(['request', newRequest.id], newRequest);
    },
  });
};

// Update an existing request
// Payload can be a partial update, but requires ID
export type UpdateRequestPayload = Partial<Omit<IRequest, 'id' | 'createdAt' | 'updatedAt'>> & { id: string };


export const updateRequestApi = async (payload: UpdateRequestPayload): Promise<IRequest> => {
  const { id, ...updateData } = payload;
  const { data } = await apiClient.put(`/requests/${id}`, updateData);
  return data;
};

export const useUpdateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<IRequest, Error, UpdateRequestPayload>({
    mutationFn: updateRequestApi,
    onSuccess: (updatedRequest) => {
      // Invalidate and refetch the specific request and the list
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', updatedRequest.id] });
      // Optionally, update the cache directly
      queryClient.setQueryData(['request', updatedRequest.id], updatedRequest);
      queryClient.setQueryData(['requests'], (oldData: IRequest[] | undefined) =>
          oldData?.map(req => req.id === updatedRequest.id ? updatedRequest : req) ?? []
      );
    },
  });
};
