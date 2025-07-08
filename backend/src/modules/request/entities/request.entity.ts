import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { Types } from 'mongoose';

/**
 * Represents an API request made by the user.
 * Includes details such as URL, method, headers, body, and saved status.
 * Inherits timestamp fields (createdAt, updatedAt) from TimeStamps.
 */
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true }, // Ensure virtuals are included in JSON output
    toObject: { virtuals: true }, // Ensure virtuals are included when converting to object
  },
})
export class Request extends TimeStamps {
  @prop({ type: Types.ObjectId, auto: true })
  public _id!: Types.ObjectId;

  @prop({ required: true, trim: true })
  public name!: string;
  /**
   * The URL of the API request.
   * @example 'https://api.example.com/users'
   */
  @prop({ required: true, trim: true })
  public url!: string;

  /**
   * The HTTP method of the API request.
   * @example 'GET'
   */
  @prop({ required: true, enum: ['GET', 'POST', 'PUT', 'DELETE'] })
  public method!: string;

  /**
   * Key-value pairs representing the headers of the API request.
   * @example { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' }
   */
  @prop({ type: () => Object })
  public headers?: Record<string, any>;

  /**
   * The body of the API request, typically for POST or PUT methods.
   * @example { 'name': 'John Doe', 'email': 'john.doe@example.com' }
   */
  @prop({ type: () => Object })
  public body?: Record<string, any>;

  /**
   * A flag indicating whether the current state of the request is unsaved.
   * True if there are changes not yet committed to a checkpoint.
   * Defaults to true for new requests.
   */
  @prop({ default: true })
  public unsaved!: boolean;
}

/**
 * The Typegoose model for the Request entity.
 */
export const RequestModel = getModelForClass(Request);
