import { IsString, IsMongoId, IsOptional } from 'class-validator';

/**
 * Data Transfer Object (DTO) for creating a new checkpoint.
 * Defines the expected shape and validation rules for checkpoint creation payload.
 */
export class CreateCheckpointDto {
  /**
   * The ID of the API Request for which to create a checkpoint.
   * Must be a valid MongoDB ObjectId string.
   * @example "60c72b965f1b2c001f8e4d2a"
   */
  @IsMongoId()
  requestId: string;

  /**
   * An optional name for the checkpoint.
   * If not provided, the checkpoint might be created with a default name or timestamp.
   * @example "User login test setup"
   */
  @IsString()
  @IsOptional()
  name?: string;
}
