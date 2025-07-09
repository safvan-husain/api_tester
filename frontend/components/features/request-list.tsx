'use client';

import React from 'react';
import { useGetRequests, IRequest } from '@/lib/api/requests'; // Adjust path as necessary
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming shadcn/ui scroll-area
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn/ui card

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
    <ScrollArea className="h-full w-full p-4">
      <Card>
        <CardHeader>
          <CardTitle>Saved Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.map((request: IRequest) => (
            <div key={request.id} className="mb-2 p-2 border rounded">
              <p className="font-semibold">{request.name}</p>
              <p className="text-sm text-gray-600">{request.method}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </ScrollArea>
  );
};

export default RequestList;
