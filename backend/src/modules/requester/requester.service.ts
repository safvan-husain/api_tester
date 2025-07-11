import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import { SendRequestDto } from './dto/send-request.dto';

@Injectable()
export class RequesterService {
  private readonly logger = new Logger(RequesterService.name);

  constructor(private readonly httpService: HttpService) {}

  async sendRequest(sendRequestDto: SendRequestDto): Promise<any> {
    const { url, method, headers, body } = sendRequestDto;

    const config: AxiosRequestConfig = {
      url,
      method: method.toUpperCase() as any, // Cast as Axios expects specific types but string is fine
      headers: headers || {},
      data: body,
      validateStatus: () => true, // Axios will not throw errors for any HTTP status code, we handle it
    };

    this.logger.log(`Sending ${config.method} request to ${config.url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request(config).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              `Axios error making outbound request: ${error.message}`,
              error.stack,
            );
            // This error is for issues with the request sending itself (e.g., network error)
            // not for HTTP error statuses, which are handled by validateStatus.
            if (error.response) {
              // If there's a response object in the error, it means the server responded with an error code
              // but validateStatus: () => true should prevent this block from being hit for HTTP errors.
              // This might be more for malformed requests that Axios itself rejects before sending, or other issues.
              throw {
                message: `Error from target server: ${error.message}`,
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
              };
            }
            // For errors without a response object (e.g. network error, DNS resolution failure)
            throw {
              message: `Request failed: ${error.message}`,
              // Assign a generic server error status or a specific one if identifiable
              status: 500, // Or perhaps 502 Bad Gateway if it's a network issue with upstream
            };
          }),
        ),
      );

      this.logger.log(
        `Received response from ${config.url}: Status ${response.status}`,
      );

      return {
        status: response.status,
        headers: response.headers,
        data: response.data,
      };
    } catch (error) {
      // This will catch errors thrown from the catchError block or other unexpected errors
      this.logger.error(
        `Failed to process request for ${url}: ${error.message || 'Unknown error'}`,
        error.stack,
      );
      // Ensure a consistent error structure is returned to the controller
      throw {
        message:
          error.message ||
          'An unexpected error occurred while proxying the request.',
        status: error.status || 500,
        data: error.data, // Include if available
        headers: error.headers, // Include if available
      };
    }
  }
}
