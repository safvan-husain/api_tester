import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { RequesterService } from './requester.service';
import { SendRequestDto } from './dto/send-request.dto';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios'; // Import AxiosError
import { Logger } from '@nestjs/common';

// Mock HttpService
const mockHttpService = {
  request: jest.fn(),
};

describe('RequesterService', () => {
  let service: RequesterService;
  let httpService: HttpService;

  beforeEach(async () => {
    // Disable logger temporarily for tests if it's too noisy
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});


    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequesterService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<RequesterService>(RequesterService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendRequest', () => {
    const dto: SendRequestDto = {
      url: 'http://example.com',
      method: 'GET',
      headers: { 'X-Test': 'true' },
      body: { key: 'value' },
    };

    it('should successfully send a request and return response data', async () => {
      const mockResponse: AxiosResponse = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config: { headers: {} as any, url: dto.url, method: dto.method } as any,
      };
      mockHttpService.request.mockReturnValue(of(mockResponse));

      const result = await service.sendRequest(dto);

      expect(httpService.request).toHaveBeenCalledWith({
        url: dto.url,
        method: dto.method.toUpperCase(),
        headers: dto.headers,
        data: dto.body,
        validateStatus: expect.any(Function),
      });
      expect(result).toEqual({
        status: mockResponse.status,
        headers: mockResponse.headers,
        data: mockResponse.data,
      });
    });

    it('should handle HTTP error responses from target server', async () => {
      const mockErrorResponse: AxiosResponse = {
        data: { error: 'not found' },
        status: 404,
        statusText: 'Not Found',
        headers: { 'content-type': 'application/json' },
        config: { headers: {} as any, url: dto.url, method: dto.method } as any,
      };
      mockHttpService.request.mockReturnValue(of(mockErrorResponse)); // Simulating validateStatus: () => true

      const result = await service.sendRequest(dto);

      expect(result).toEqual({
        status: mockErrorResponse.status,
        headers: mockErrorResponse.headers,
        data: mockErrorResponse.data,
      });
    });

    it('should handle network errors or other Axios errors without a response', async () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Network Error',
        // No 'response' object for this type of error
      } as AxiosError;

      mockHttpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(service.sendRequest(dto)).rejects.toMatchObject({
        message: `Request failed: Network Error`,
        status: 500,
      });
    });

    it('should handle errors thrown by HttpService if response is malformed in error', async () => {
        // This simulates a more complex error scenario where Axios might still provide a response object
        // but it's part of an error structure that the catchError block in the service is designed to handle.
        const errorResponseFromServer: Partial<AxiosResponse> = { // Use Partial for easier mocking
            status: 503,
            data: { detail: 'Service Unavailable' },
            headers: { 'x-error-id': '123' }
        };
        const axiosErrorWithResponse = {
            isAxiosError: true,
            message: 'Request failed with status code 503',
            response: errorResponseFromServer
        } as AxiosError;

        // In our service, validateStatus: () => true means this should ideally not be thrown by HttpService directly
        // but rather returned as a normal response. However, if HttpService's observable itself errors out
        // *while still having a response object attached to the error* (less common with validateStatus but possible for other reasons),
        // the service's catchError should handle it.
        // For the sake of testing the service's internal catchError's re-throwing logic:
        mockHttpService.request.mockImplementation(() => {
          return throwError(() => axiosErrorWithResponse);
        });

        await expect(service.sendRequest(dto)).rejects.toMatchObject({
          message: 'Error from target server: Request failed with status code 503',
          status: 503,
          data: { detail: 'Service Unavailable' },
          headers: { 'x-error-id': '123' }
        });
      });

    it('should use empty headers object if DTO provides no headers', async () => {
        const dtoWithoutHeaders: SendRequestDto = {
            url: 'http://example.com',
            method: 'GET',
        };
        const mockResponse: AxiosResponse = {
            data: { message: 'success' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: { headers: {} as any } as any,
        };
        mockHttpService.request.mockReturnValue(of(mockResponse));

        await service.sendRequest(dtoWithoutHeaders);

        expect(httpService.request).toHaveBeenCalledWith(
            expect.objectContaining({
                headers: {}, // Ensure empty object is passed if DTO.headers is undefined
            })
        );
    });
  });
});
