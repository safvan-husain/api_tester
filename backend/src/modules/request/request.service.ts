import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

/**
 * Service responsible for handling business logic related to API requests.
 * This includes CRUD operations and managing the 'unsaved' status of requests.
 */
@Injectable()
export class RequestService {
  private readonly logger = new Logger(RequestService.name);

  /**
   * Constructs the RequestService.
   * @param requestModel - The injected Typegoose model for Request entities.
   */
  constructor(
    @InjectModel(Request.name)
    private readonly requestModel: ReturnModelType<typeof Request>,
  ) {
    this.logger.log(`requestModel: ${this.requestModel.toString()}`);
  }

  /**
   * Creates a new API request record in the database.
   * New requests are marked as 'unsaved' by default (handled by entity schema).
   * @param createRequestDto - Data for creating the new request.
   * @returns A promise that resolves to the created Request entity.
   * @throws Error if database operation fails.
   */
  async create(createRequestDto: CreateRequestDto): Promise<Request> {
    this.logger.log(
      `Creating new request: ${JSON.stringify(createRequestDto)}`,
    );
    try {
      const newRequest = new this.requestModel(createRequestDto);
      const savedRequest = await newRequest.save();
      this.logger.log(
        `Successfully created request with ID: ${savedRequest._id.toString()}`,
      );
      return savedRequest;
    } catch (error) {
      this.logger.error(
        `Failed to create request: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieves all API request records from the database.
   * @returns A promise that resolves to an array of Request entities.
   * @throws Error if database operation fails.
   */
  async findAll(): Promise<Request[]> {
    this.logger.log('Fetching all requests');
    try {
      const requests = await this.requestModel.find().exec();
      this.logger.log(`Found ${requests.length} requests`);
      return requests;
    } catch (error) {
      this.logger.error(
        `Failed to fetch all requests: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retrieves a single API request record by its ID.
   * @param id - The unique identifier of the request to retrieve.
   * @returns A promise that resolves to the found Request entity.
   * @throws NotFoundException if no request with the given ID is found.
   * @throws Error if database operation fails for other reasons.
   */
  async findOne(id: string): Promise<Request> {
    this.logger.log(`Fetching request with ID: ${id}`);
    try {
      const request = await this.requestModel.findById(id).exec();
      if (!request) {
        this.logger.warn(`Request with ID "${id}" not found`);
        throw new NotFoundException(`Request with ID "${id}" not found`);
      }
      this.logger.log(`Found request with ID: ${id}`);
      return request;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Failed to fetch request with ID ${id}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  /**
   * Updates an existing API request record.
   * Sets the 'unsaved' status of the request to true upon update.
   * @param id - The unique identifier of the request to update.
   * @param updateRequestDto - Data for updating the request.
   * @returns A promise that resolves to the updated Request entity.
   * @throws NotFoundException if no request with the given ID is found.
   * @throws Error if database operation fails for other reasons.
   */
  async update(
    id: string,
    updateRequestDto: UpdateRequestDto,
  ): Promise<Request> {
    this.logger.log(
      `Updating request with ID: ${id} with data: ${JSON.stringify(updateRequestDto)}`,
    );
    try {
      const updatedRequest = await this.requestModel
        .findByIdAndUpdate(
          id,
          { ...updateRequestDto, unsaved: true },
          { new: true },
        )
        .exec();
      if (!updatedRequest) {
        this.logger.warn(`Request with ID "${id}" not found for update`);
        throw new NotFoundException(`Request with ID "${id}" not found`);
      }
      this.logger.log(`Successfully updated request with ID: ${id}`);
      return updatedRequest;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Failed to update request with ID ${id}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  /**
   * Deletes an API request record from the database.
   * @param id - The unique identifier of the request to delete.
   * @returns A promise that resolves to an object indicating success and the ID of the deleted request.
   * @throws NotFoundException if no request with the given ID is found.
   * @throws Error if database operation fails for other reasons.
   */
  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    this.logger.log(`Removing request with ID: ${id}`);
    try {
      const result = await this.requestModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        this.logger.warn(`Request with ID "${id}" not found for deletion`);
        throw new NotFoundException(`Request with ID "${id}" not found`);
      }
      this.logger.log(`Successfully removed request with ID: ${id}`);
      return { deleted: true, id };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Failed to remove request with ID ${id}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  /**
   * Sets the 'unsaved' status of a specific API request.
   * This method is typically called by the CheckpointService when a checkpoint is created or rollback occurs.
   * @param id - The unique identifier of the request whose 'unsaved' status is to be updated.
   * @param status - The new boolean value for the 'unsaved' status.
   * @returns A promise that resolves to the updated Request entity.
   * @throws NotFoundException if no request with the given ID is found.
   * @throws Error if database operation fails for other reasons.
   */
  async setUnsavedStatus(id: string, status: boolean): Promise<Request> {
    this.logger.log(
      `Setting unsaved status to ${status} for request with ID: ${id}`,
    );
    try {
      const request = await this.requestModel
        .findByIdAndUpdate(id, { unsaved: status }, { new: true })
        .exec();
      if (!request) {
        this.logger.warn(
          `Request with ID "${id}" not found for updating unsaved status`,
        );
        throw new NotFoundException(`Request with ID "${id}" not found`);
      }
      this.logger.log(
        `Successfully set unsaved status for request with ID: ${id}`,
      );
      return request;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Failed to set unsaved status for request ID ${id}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }
}
