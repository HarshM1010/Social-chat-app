import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ResetToken extends Document {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'ChatUser' })
  userId: Types.ObjectId;

  @Prop({ required: true, default: Date.now, expires: 600 })
  createdAt: Date;
}

export type ResetTokenDocument = ResetToken & Document;
export const ResetTokenSchema = SchemaFactory.createForClass(ResetToken);
