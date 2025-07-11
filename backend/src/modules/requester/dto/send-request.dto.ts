import { IsString, IsUrl, IsIn, IsOptional, IsObject } from 'class-validator';

const validHttpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export class SendRequestDto {
  @IsUrl({}, { message: 'URL must be a valid URL.' })
  url: string;

  @IsIn(validHttpMethods, { message: `Method must be one of: ${validHttpMethods.join(', ')}` })
  method: string;

  @IsOptional()
  @IsObject({ message: 'Headers must be an object.' })
  headers?: Record<string, string>;

  @IsOptional()
  // We allow any type for the body, as it will be passed through.
  // Specific validation for the body's content type (e.g. JSON) is not done here,
  // as it depends on the target API.
  body?: any;
}
