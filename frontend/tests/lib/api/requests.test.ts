import axios from 'axios'; // Import axios
import MockAdapter from 'axios-mock-adapter';
// Import the functions to test and the apiClient
import { getRequests, createRequest, IRequest, CreateRequestPayload, apiClient } from '@/lib/api/requests';

// apiClient is an instance of axios created by axios.create()
// We need to ensure our MockAdapter is targeting this specific instance.
// The most straightforward way if apiClient is exported is to use it directly.
// If it's not being recognized, it might be due to Jest's module system complexities.

let mockAxios: MockAdapter;

describe('API Request Functions', () => {
  beforeEach(() => {
    // Initialize MockAdapter with the actual apiClient instance before each test
    // This ensures that if the apiClient module is re-evaluated or if Jest does something tricky,
    // we always get the current instance.
    mockAxios = new MockAdapter(apiClient, { onNoMatch: "throwException" });
  });

  afterEach(() => {
    mockAxios.restore(); // Restores the original axios instance and removes all handlers
  });

  describe('getRequests', () => {
    it('should fetch requests successfully', async () => {
      const mockData: IRequest[] = [
        { id: '1', name: 'Request 1', method: 'GET', url: 'http://example.com/1' },
        { id: '2', name: 'Request 2', method: 'POST', url: 'http://example.com/2' },
      ];
      // Use the baseURL from apiClient if requests are made with relative paths
      mockAxios.onGet(`${apiClient.defaults.baseURL}/requests`).reply(200, mockData);

      const result = await getRequests();
      expect(result).toEqual(mockData);
    });

    it('should handle error when fetching requests', async () => {
      mockAxios.onGet(`${apiClient.defaults.baseURL}/requests`).reply(500, { message: 'Server Error' });

      await expect(getRequests()).rejects.toThrow();
    });
  });

  describe('createRequest', () => {
    it('should create a request successfully', async () => {
      const payload: CreateRequestPayload = {
        name: 'New Request',
        method: 'PUT',
        url: 'http://example.com/new',
      };
      const responseData: IRequest = { id: '3', ...payload };

      mockAxios.onPost(`${apiClient.defaults.baseURL}/requests`, payload).reply(201, responseData);

      const result = await createRequest(payload);
      expect(result).toEqual(responseData);
    });

    it('should handle error when creating a request', async () => {
      const payload: CreateRequestPayload = {
        name: 'New Request',
        method: 'PUT',
        url: 'http://example.com/new',
      };
      mockAxios.onPost(`${apiClient.defaults.baseURL}/requests`, payload).reply(500, { message: 'Server Error' });

      await expect(createRequest(payload)).rejects.toThrow();
    });
  });
});
