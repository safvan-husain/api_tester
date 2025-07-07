import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from '@nestjs/mongoose';
import { Checkpoint } from './entities/checkpoint.entity';
import { Request as ApiRequest } from '../request/entities/request.entity';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { RequestService } from '../request/request.service';

/**
 * Service responsible for handling business logic related to checkpoints.
 * This includes creating checkpoints, listing them for a request,
 * rolling back a request to a checkpoint's state, and deleting checkpoints.
 */
@Injectable()
export class CheckpointService {
  private readonly logger = new Logger(CheckpointService.name);

  /**
   * Constructs the CheckpointService.
   * @param checkpointModel - The injected Typegoose model for Checkpoint entities.
   * @param apiRequestModel - The injected Typegoose model for ApiRequest (Request) entities.
   * @param requestService - The injected RequestService to interact with Request entities.
   */
  constructor(
    @InjectModel(Checkpoint.name)
    private readonly checkpointModel: ReturnModelType<typeof Checkpoint>,
    @InjectModel(ApiRequest.name)
    private readonly apiRequestModel: ReturnModelType<typeof ApiRequest>,
    private readonly requestService: RequestService,
  ) {}

  /**
   * Creates a new checkpoint for a given API request.
   * This involves saving the current state of the request and then marking the request as 'saved' (unsaved = false).
   * @param createCheckpointDto - Data for creating the new checkpoint, including requestId and an optional name.
   * @returns A promise that resolves to the created Checkpoint entity.
   * @throws NotFoundException if the parent request to checkpoint is not found.
   * @throws Error if any database operation fails.
   */
  async create(createCheckpointDto: CreateCheckpointDto): Promise<Checkpoint> {
    const { requestId, name } = createCheckpointDto;
    this.logger.log(`Creating checkpoint for request ID: ${requestId}, name: "${name}"`);

    try {
      const requestToCheckpoint = await this.apiRequestModel.findById(requestId).exec();
      if (!requestToCheckpoint) {
        this.logger.warn(`Request with ID "${requestId}" not found for checkpoint creation.`);
        throw new NotFoundException(`Request with ID "${requestId}" not found.`);
      }

      const checkpointData = {
        url: requestToCheckpoint.url,
        method: requestToCheckpoint.method,
        headers: requestToCheckpoint.headers,
        body: requestToCheckpoint.body,
      };

      const newCheckpoint = new this.checkpointModel({
        requestId,
        name,
        data: checkpointData,
      });
      const savedCheckpoint = await newCheckpoint.save();
      this.logger.log(`Successfully created checkpoint with ID: ${savedCheckpoint._id} for request ID: ${requestId}`);

      try {
        await this.requestService.setUnsavedStatus(requestId, false);
        this.logger.log(`Successfully set unsaved status to false for request ID: ${requestId}`);
      } catch (error) {
        this.logger.error(
          `Failed to set unsaved status to false for request ${requestId} after creating checkpoint ${savedCheckpoint._id}. Error: ${error.message}`,
           error.stack
        );
      }

      return savedCheckpoint;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(`Failed to create checkpoint for request ID ${requestId}: ${error.message}`, error.stack);
      }
      throw error;
    }
  }

  /**
   * Retrieves all checkpoints associated with a specific API request, sorted by creation date descending.
   * @param requestId - The unique identifier of the parent API request.
   * @returns A promise that resolves to an array of Checkpoint entities.
   * @throws NotFoundException if the parent request is not found.
   * @throws Error if any database operation fails.
   */
  async findAllForRequest(requestId: string): Promise<Checkpoint[]> {
    this.logger.log(`Fetching all checkpoints for request ID: ${requestId}`);
    try {
      const requestExists = await this.apiRequestModel.findById(requestId).exec();
      if (!requestExists) {
        this.logger.warn(`Request with ID "${requestId}" not found, cannot retrieve checkpoints.`);
        throw new NotFoundException(`Request with ID "${requestId}" not found, cannot retrieve checkpoints.`);
      }
      const checkpoints = await this.checkpointModel.find({ requestId }).sort({ createdAt: -1 }).exec();
      this.logger.log(`Found ${checkpoints.length} checkpoints for request ID: ${requestId}`);
      return checkpoints;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(`Failed to fetch checkpoints for request ID ${requestId}: ${error.message}`, error.stack);
      }
      throw error;
    }
  }

  /**
   * Rolls back an API request to the state saved in a specific checkpoint.
   * This updates the original request document with data from the checkpoint and marks it as 'unsaved'.
   * @param checkpointId - The unique identifier of the checkpoint to roll back to.
   * @returns A promise that resolves to the updated ApiRequest (Request) entity.
   * @throws NotFoundException if the checkpoint is not found.
   * @throws InternalServerErrorException if the original request cannot be found or updated during rollback.
   * @throws Error if any other database operation fails.
   */
  async rollback(checkpointId: string): Promise<ApiRequest> {
    this.logger.log(`Rolling back to checkpoint ID: ${checkpointId}`);
    try {
      const checkpoint = await this.checkpointModel.findById(checkpointId).exec();
      if (!checkpoint) {
        this.logger.warn(`Checkpoint with ID "${checkpointId}" not found for rollback.`);
        throw new NotFoundException(`Checkpoint with ID "${checkpointId}" not found.`);
      }

      const { requestId, data } = checkpoint;
      this.logger.log(`Found checkpoint. Rolling back request ID: ${requestId}`);

      const updatedRequest = await this.apiRequestModel
        .findByIdAndUpdate(
          requestId,
          { ...data, unsaved: true }, // Apply checkpoint data and mark as unsaved
          { new: true },
        )
        .exec();

      if (!updatedRequest) {
        this.logger.error(`Failed to find and update original request ID "${requestId}" during rollback from checkpoint ID "${checkpointId}".`);
        throw new InternalServerErrorException(
          `Failed to find and update original request with ID "${requestId}" during rollback.`,
        );
      }
      this.logger.log(`Successfully rolled back request ID: ${requestId} to checkpoint ID: ${checkpointId}`);
      return updatedRequest;
    } catch (error) {
      if (!(error instanceof NotFoundException || error instanceof InternalServerErrorException)) {
        this.logger.error(`Failed to rollback to checkpoint ID ${checkpointId}: ${error.message}`, error.stack);
      }
      throw error;
    }
  }

  /**
   * Deletes a checkpoint record from the database.
   * @param id - The unique identifier of the checkpoint to delete.
   * @returns A promise that resolves to an object indicating success and the ID of the deleted checkpoint.
   * @throws NotFoundException if no checkpoint with the given ID is found.
   * @throws Error if database operation fails for other reasons.
   */
  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    this.logger.log(`Removing checkpoint with ID: ${id}`);
    try {
      const result = await this.checkpointModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        this.logger.warn(`Checkpoint with ID "${id}" not found for deletion.`);
        throw new NotFoundException(`Checkpoint with ID "${id}" not found`);
      }
      this.logger.log(`Successfully removed checkpoint with ID: ${id}`);
      return { deleted: true, id };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(`Failed to remove checkpoint ID ${id}: ${error.message}`, error.stack);
      }
      throw error;
    }
  }
}
