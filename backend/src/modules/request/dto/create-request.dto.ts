import { IsString, IsUrl, IsEnum, IsObject, IsOptional } from 'class-validator';

/**
 * Data Transfer Object (DTO) for creating a new API request.
 * Defines the expected shape and validation rules for request creation payload.
 */
export class CreateRequestDto {
  /**
   * The URL for the API request. Must be a valid URL string.
   * @example "https://api.example.com/data"
   */
  @IsUrl()
  url: string;

  /**
   * The HTTP method for the API request.
   * Must be one of 'GET', 'POST', 'PUT', 'DELETE'.
   * @example "POST"
   */
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE'])
  method: string;

  /**
   * Optional headers for the API request. Must be an object.
   * @example { "Content-Type": "application/json" }
   */
  @IsObject()
  @IsOptional()
  headers?: Record<string, any>;

  /**
   * Optional body for the API request. Must be an object.
   * Relevant for methods like POST or PUT.
   * @example { "key": "value" }
   */
  @IsObject()
  @IsOptional()
  body?: Record<string, any>;
}
