import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ChatUser } from '../../users/entities/user.entity';
import { Document } from 'mongoose';

@ObjectType()
export class ReadReceipt {
  @Field()
  userId: string;

  @Field()
  readAt: Date;
}

@ObjectType()
@Schema({ timestamps: true })
export class Message {
  @Field(() => ID)
  _id: string;

  @Field()
  @Prop({ required: true })
  roomId: string;

  @Field() //Field() means it will not be stored in mongodb but will be available for query in graphql
  @Prop({ required: true })
  senderId: string;

  @Field()
  @Prop({ required: true }) // Mongoose property (it will be stored in MongoDB database) not be available for query in graphql
  content: string;

  @Field()
  @Prop({ default: 'sent', enum: ['sent', 'delivered', 'read'] })
  status: string;

  @Field(() => [ReadReceipt])
  @Prop({ type: [{ userId: String, readAt: Date }] })
  readBy: ReadReceipt[];

  @Field(() => ChatUser, { nullable: true })
  sender?: any;

  @Field(() => String)
  get createdAt(): string {
    // Access the underlying date value and convert to ISO String
    const dateVal = (this as any).createdAt || (this as any)._doc?.createdAt;
    if (!dateVal) return new Date().toISOString();
    return new Date(dateVal).toISOString();
  }

  @Field(() => String, { nullable: true })
  get updatedAt(): string {
    const dateVal = (this as any).updatedAt || (this as any)._doc?.updatedAt;
    if (!dateVal) return new Date().toISOString();
    return new Date(dateVal).toISOString();
  }
}

@ObjectType()
export class ChatResponse {
  @Field()
  roomId: string;

  @Field(() => [Message])
  messages: Message[];
}

export type MessageDocument = Message & Document;
export const MessageSchema = SchemaFactory.createForClass(Message);

// Compound index for fast message retrieval per room
MessageSchema.index({ roomId: 1, createdAt: -1 });
