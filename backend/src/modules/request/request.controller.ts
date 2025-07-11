import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RequestService } from './request.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { Request } from './entities/request.entity';

/**
 * Controller responsible for handling incoming HTTP requests related to API requests.
 * It uses the RequestService to perform business logic.
 * Endpoints are validated using global ValidationPipe and specific DTOs.
 */
@Controller('requests')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class RequestController {
  private readonly logger = new Logger(RequestController.name);

  /**
   * Constructs the RequestController.
   * @param requestService - The injected RequestService for handling business logic.
   */
  constructor(private readonly requestService: RequestService) {}

  /**
   * Handles POST requests to create a new API request.
   * @param createRequestDto - The data for the new API request, validated by CreateRequestDto.
   * @returns A promise that resolves to the created Request entity.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRequestDto: CreateRequestDto): Promise<Request> {
    this.logger.log(
      `Received POST /requests request with body: ${JSON.stringify(createRequestDto)}`,
    );
    const result = await this.requestService.create(createRequestDto);
    this.logger.log(
      `Responding to POST /requests with status 201, ID: ${result._id.toString()}`,
    );
    return result;
  }

  /**
   * Handles GET requests to retrieve all API requests.
   * @returns A promise that resolves to an array of Request entities.
   */
  @Get()
  async findAll(): Promise<Request[]> {
    this.logger.log('Received GET /requests request');
    this.logger.log('Received PATCH /requests');
    const results = await this.requestService.findAll();
    this.logger.log(`Responding to GET /requests with ${results.length} items`);
    return results;
  }

  /**
   * Handles GET requests to retrieve a specific API request by its ID.
   * @param id - The ID of the API request to retrieve, passed as a URL parameter.
   * @returns A promise that resolves to the found Request entity.
   * @throws NotFoundException if the request with the given ID is not found.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Request> {
    this.logger.log(`Received GET /requests/${id} request`);
    const result = await this.requestService.findOne(id);
    this.logger.log(`Responding to GET /requests/${id}`);
    return result;
  }

  /**
   * Handles PATCH requests to update an existing API request.
   * @param id - The ID of the API request to update, passed as a URL parameter.
   * @param updateRequestDto - The data for updating the API request, validated by UpdateRequestDto.
   * @returns A promise that resolves to the updated Request entity.
   * @throws NotFoundException if the request with the given ID is not found.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRequestDto: UpdateRequestDto,
  ): Promise<Request> {
    this.logger.log(
      `Received PATCH /requests/${id} request with body: ${JSON.stringify(updateRequestDto)}`,
    );
    const result = await this.requestService.update(id, updateRequestDto);
    this.logger.log(`Responding to PATCH /requests/${id}`);
    return result;
  }

  /**
   * Handles DELETE requests to remove an API request.
   * Responds with HTTP 204 No Content on successful deletion.
   * @param id - The ID of the API request to delete, passed as a URL parameter.
   * @returns A promise that resolves when the operation is complete.
   * @throws NotFoundException if the request with the given ID is not found.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Received DELETE /requests/${id} request`);
    await this.requestService.remove(id);
    this.logger.log(`Responding to DELETE /requests/${id} with status 204`);
    return;
  }
}
