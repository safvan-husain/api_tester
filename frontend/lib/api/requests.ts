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
export interface CreateRequestPayload {
  name: string;
  url:string;
  method: string;
}

export const createRequest = async (payload: CreateRequestPayload): Promise<IRequest> => {
  const { data } = await apiClient.post('/requests', payload);
  return data;
};

export const useCreateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<IRequest, Error, CreateRequestPayload>({
    mutationFn: createRequest,
    onSuccess: () => {
      // Invalidate and refetch the requests query after a new request is created
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
};
