import { Test, TestingModule } from '@nestjs/testing';
import { RequesterController } from './requester.controller';
import { RequesterService } from './requester.service';
import { SendRequestDto } from './dto/send-request.dto';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Import HttpModule

// Mock RequesterService
const mockRequesterService = {
  sendRequest: jest.fn(),
};

describe('RequesterController', () => {
  let controller: RequesterController;
  let service: RequesterService;

  beforeEach(async () => {
    // Disable logger temporarily for tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule], // Add HttpModule here if service depends on HttpService directly, or mock service entirely
      controllers: [RequesterController],
      providers: [
        {
          provide: RequesterService,
          useValue: mockRequesterService,
        },
      ],
    }).compile();

    controller = module.get<RequesterController>(RequesterController);
    service = module.get<RequesterService>(RequesterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendRequest', () => {
    const dto: SendRequestDto = {
      url: 'http://example.com',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { data: 'test' },
    };

    it('should call requesterService.sendRequest and return the result', async () => {
      const serviceResponse = {
        status: 201,
        headers: { 'x-custom-header': 'value' },
        data: { id: 1, message: 'created' },
      };
      mockRequesterService.sendRequest.mockResolvedValue(serviceResponse);

      const result = await controller.sendRequest(dto);

      expect(service.sendRequest).toHaveBeenCalledWith(dto);
      expect(result).toEqual(serviceResponse);
    });

    it('should throw HttpException if service throws an error with status and message', async () => {
      const serviceError = {
        message: 'Target server error',
        status: 502,
        data: { error_code: 'BAD_GATEWAY' },
        name: 'CustomErrorName'
      };
      mockRequesterService.sendRequest.mockRejectedValue(serviceError);

      await expect(controller.sendRequest(dto)).rejects.toThrow(HttpException);
      try {
        await controller.sendRequest(dto);
      } catch (e: any) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(serviceError.status);
        expect(e.getResponse()).toEqual({
          statusCode: serviceError.status,
          message: serviceError.message,
          error: serviceError.name, // Controller uses error.name
          details: serviceError.data,
        });
      }
    });

    it('should throw HttpException with 500 if service throws an error without status', async () => {
      const serviceError = {
        message: 'Some internal service failure',
        // No status
      };
      mockRequesterService.sendRequest.mockRejectedValue(serviceError);

      await expect(controller.sendRequest(dto)).rejects.toThrow(HttpException);
      try {
        await controller.sendRequest(dto);
      } catch (e: any) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(e.getResponse()).toMatchObject({ // Use toMatchObject for flexibility
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: serviceError.message,
        });
      }
    });

    // ValidationPipe tests are implicitly handled by NestJS if DTOs are correctly annotated.
    // For explicit testing of ValidationPipe behavior with the controller,
    // it would typically involve e2e tests or more complex unit test setup
    // to actually invoke the pipe. Here, we trust NestJS's pipe mechanism.
    // However, we can ensure the DTO itself has correct validation decorators,
    // which is tested by using an invalid DTO.
    // This kind of test is better as an e2e test.
    // For a unit test, we would mock the ValidationPipe or test it separately.
  });
});
