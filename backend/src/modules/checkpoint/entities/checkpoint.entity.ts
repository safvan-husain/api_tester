import {
  prop,
  getModelForClass,
  Ref,
  modelOptions,
} from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { Request } from '../../request/entities/request.entity';
import { Types } from 'mongoose';

/**
 * Represents a saved state (checkpoint) of an API request.
 * Checkpoints allow users to version their requests and rollback to previous states.
 * Inherits timestamp fields (createdAt, updatedAt) from TimeStamps.
 */
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
export class Checkpoint extends TimeStamps {
  @prop({ type: Types.ObjectId, auto: true })
  public _id!: Types.ObjectId;
  /**
   * A reference to the original Request entity this checkpoint belongs to.
   */
  @prop({ ref: () => Request, required: true })
  public requestId!: Ref<Request>;

  /**
   * An optional user-defined name for the checkpoint.
   * @example "Initial working version"
   */
  @prop({ trim: true })
  public name?: string;

  /**
   * A snapshot of the parent Request's data at the time of checkpoint creation.
   * This includes URL, method, headers, and body.
   */
  @prop({ type: () => Object, required: true })
  public data!: {
    url: string;
    method: string;
    headers?: Record<string, any>;
    body?: Record<string, any>;
  };
}

/**
 * The Typegoose model for the Checkpoint entity.
 */
export const CheckpointModel = getModelForClass(Checkpoint);
