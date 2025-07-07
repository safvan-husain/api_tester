import { IsUrl, IsEnum, IsObject, IsOptional } from 'class-validator';

/**
 * Data Transfer Object (DTO) for updating an existing API request.
 * All fields are optional, allowing partial updates.
 */
export class UpdateRequestDto {
  /**
   * The new URL for the API request. Must be a valid URL string if provided.
   * @example "https://api.newexample.com/updated-data"
   */
  @IsUrl()
  @IsOptional()
  url?: string;

  /**
   * The new HTTP method for the API request.
   * Must be one of 'GET', 'POST', 'PUT', 'DELETE' if provided.
   * @example "PUT"
   */
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE'])
  @IsOptional()
  method?: string;

  /**
   * New or updated headers for the API request. Must be an object if provided.
   * @example { "Authorization": "Bearer newtoken" }
   */
  @IsObject()
  @IsOptional()
  headers?: Record<string, any>;

  /**
   * New or updated body for the API request. Must be an object if provided.
   * @example { "newKey": "newValue" }
   */
  @IsObject()
  @IsOptional()
  body?: Record<string, any>;
}
