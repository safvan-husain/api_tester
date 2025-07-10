'use client';

import React from 'react';
import { useGetRequests, IRequest } from '../../../lib/api/requests';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming shadcn/ui scroll-area
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn/ui card

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

const RequestList: React.FC = () => {
  const { data: requests, error, isLoading } = useGetRequests();

  if (isLoading) {
    return <div>Loading requests...</div>;
  }

  if (error) {
    return <div>Error loading requests: {error.message}</div>;
  }

  if (!requests || requests.length === 0) {
    return <div>No requests found.</div>;
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Saved Requests</h2>
        <div className="space-y-2">
          {requests.map((request: IRequest) => (
            <Card key={request.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between space-x-2">
                  <span className="font-semibold truncate flex-1 !text-red-700" title={request.name} >
                    {request.name}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${getMethodClass(request.method)}`}>
                    {request.method.toUpperCase()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

export default RequestList;
