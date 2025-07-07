import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CheckpointService } from './checkpoint.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { Checkpoint } from './entities/checkpoint.entity';
import { Request as ApiRequest } from '../request/entities/request.entity';

/**
 * Controller responsible for handling incoming HTTP requests related to checkpoints.
 * It uses the CheckpointService to perform business logic.
 * Endpoints are validated using global ValidationPipe and specific DTOs.
 */
@Controller('checkpoints')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class CheckpointController {
  private readonly logger = new Logger(CheckpointController.name);

  /**
   * Constructs the CheckpointController.
   * @param checkpointService - The injected CheckpointService for handling business logic.
   */
  constructor(private readonly checkpointService: CheckpointService) {}

  /**
   * Handles POST requests to create a new checkpoint for an API request.
   * @param createCheckpointDto - The data for the new checkpoint, validated by CreateCheckpointDto.
   * @returns A promise that resolves to the created Checkpoint entity.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCheckpointDto: CreateCheckpointDto): Promise<Checkpoint> {
    this.logger.log(`Received POST /checkpoints request with body: ${JSON.stringify(createCheckpointDto)}`);
    const result = await this.checkpointService.create(createCheckpointDto);
    this.logger.log(`Responding to POST /checkpoints with status 201, ID: ${result._id}`);
    return result;
  }

  /**
   * Handles GET requests to retrieve all checkpoints for a specific API request.
   * @param requestId - The ID of the parent API request, passed as a URL parameter.
   * @returns A promise that resolves to an array of Checkpoint entities.
   */
  @Get('request/:requestId')
  async findAllForRequest(@Param('requestId') requestId: string): Promise<Checkpoint[]> {
    this.logger.log(`Received GET /checkpoints/request/${requestId} request`);
    const results = await this.checkpointService.findAllForRequest(requestId);
    this.logger.log(`Responding to GET /checkpoints/request/${requestId} with ${results.length} items`);
    return results;
  }

  /**
   * Handles POST requests to roll back an API request to the state of a specific checkpoint.
   * @param id - The ID of the checkpoint to roll back to, passed as a URL parameter.
   * @returns A promise that resolves to the updated ApiRequest (Request) entity after rollback.
   */
  @Post(':id/rollback')
  async rollback(@Param('id') id: string): Promise<ApiRequest> {
    this.logger.log(`Received POST /checkpoints/${id}/rollback request`);
    const result = await this.checkpointService.rollback(id);
    this.logger.log(`Responding to POST /checkpoints/${id}/rollback`);
    return result;
  }

  /**
   * Handles DELETE requests to remove a checkpoint.
   * Responds with HTTP 204 No Content on successful deletion.
   * @param id - The ID of the checkpoint to delete, passed as a URL parameter.
   * @returns A promise that resolves when the operation is complete.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Received DELETE /checkpoints/${id} request`);
    await this.checkpointService.remove(id);
    this.logger.log(`Responding to DELETE /checkpoints/${id} with status 204`);
    return;
  }
}
