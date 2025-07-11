import { Controller, Post, Body, UsePipes, ValidationPipe, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { RequesterService } from './requester.service';
import { SendRequestDto } from './dto/send-request.dto';

@Controller('api/v1/requester') // As per AGENT.md, use URI versioning
export class RequesterController {
  private readonly logger = new Logger(RequesterController.name);

  constructor(private readonly requesterService: RequesterService) {}

  @Post('send')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true })) // Enable validation and transformation
  async sendRequest(@Body() sendRequestDto: SendRequestDto) {
    this.logger.log(`Received request to proxy: ${sendRequestDto.method} ${sendRequestDto.url}`);
    try {
      const result = await this.requesterService.sendRequest(sendRequestDto);
      // The service already returns an object with status, headers, data.
      // We might need to set the response status code of *this* controller's response
      // based on the proxied request's status, but typically the proxy itself
      // would return 200 OK if the proxy operation was successful, and the payload
      // contains the actual status from the target.
      // For now, let's assume the client (frontend) will interpret the nested status.
      return result;
    } catch (error) {
      this.logger.error(`Error in sendRequest controller: ${error.message}`, error.stack);
      // The service should throw an object with status and message.
      // If not, default to 500.
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Failed to proxy request',
          error: error.name || 'InternalServerError',
          details: error.data, // Include proxied error data if available
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
