import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RequestList from '@/components/features/request-list';
import * as apiRequests from '@/lib/api/requests'; // To mock functions

// Mock the API module
jest.mock('@/lib/api/requests');

// Mock shadcn/ui components that are direct dependencies
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => <div {...props}>{children}</div>,
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => <div {...props}>{children}</div>,
}));

const mockGetRequests = apiRequests.useGetRequests as jest.Mock;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for testing
    },
  },
});

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('RequestList Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockGetRequests.mockReset();
    queryClient.clear(); // Clear query cache
  });

  it('should display loading state initially', () => {
    mockGetRequests.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    });

    render(<RequestList />, { wrapper: AllTheProviders });
    expect(screen.getByText('Loading requests...')).toBeInTheDocument();
  });

  it('should display error message if fetching fails', async () => {
    const errorMessage = 'Failed to fetch';
    mockGetRequests.mockReturnValue({
      data: undefined,
      error: new Error(errorMessage),
      isLoading: false,
    });

    render(<RequestList />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(screen.getByText(`Error loading requests: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('should display "No requests found" if data is empty', async () => {
    mockGetRequests.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });

    render(<RequestList />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(screen.getByText('No requests found.')).toBeInTheDocument();
    });
  });

  it('should display the list of requests', async () => {
    const mockRequests = [
      { id: '1', name: 'Test Request 1', method: 'GET', url: 'http://example.com/1' },
      { id: '2', name: 'Test Request 2', method: 'POST', url: 'http://example.com/2' },
    ];

    mockGetRequests.mockReturnValue({
      data: mockRequests,
      error: null,
      isLoading: false,
    });

    render(<RequestList />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(screen.getByText('Test Request 1')).toBeInTheDocument();
      expect(screen.getByText('GET')).toBeInTheDocument(); // Check for method of first item
      expect(screen.getByText('Test Request 2')).toBeInTheDocument();
      expect(screen.getByText('POST')).toBeInTheDocument(); // Check for method of second item
    });
  });
});
