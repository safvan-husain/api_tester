import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { url, method, body, headers: requestHeaders } = await request.json();

    if (!url || !method) {
      return NextResponse.json({ error: 'URL and method are required' }, { status: 400 });
    }

    const config: AxiosRequestConfig = {
      url,
      method: method.toUpperCase(),
      data: body,
      headers: requestHeaders || {}, // Pass through headers from the client
      validateStatus: () => true, // Axios will not throw errors for any HTTP status code
    };

    let responseData: any;
    let responseStatus: number;
    let responseHeaders: any;

    try {
      const response: AxiosResponse = await axios(config);
      responseData = response.data;
      responseStatus = response.status;
      responseHeaders = response.headers;
    } catch (error) {
      // Handle network errors or other issues with the axios request itself
      const axiosError = error as AxiosError;
      console.error('Error making outbound request:', axiosError.message);
      // If the error is from Axios (e.g. network error), but not an HTTP error response
      // (because validateStatus means HTTP errors are handled as normal responses)
      if (axiosError.isAxiosError && !axiosError.response) {
        return NextResponse.json({ error: `Request failed: ${axiosError.message}` }, { status: 500 });
      }
      // For other types of errors caught here, or if somehow axiosError.response is not set
      // (though validateStatus should prevent this for HTTP errors)
      return NextResponse.json({ error: 'An unexpected error occurred while making the request' }, { status: 500 });
    }

    return NextResponse.json(
      { data: responseData, status: responseStatus, headers: responseHeaders },
      { status: 200 } // This is the status of the proxy request itself
    );

  } catch (error: any) {
    console.error('Error in send-request API route:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}
