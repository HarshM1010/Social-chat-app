import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('ChatUser')
export class ChatUser {
  @Field(() => ID)
  userId: string;

  @Field()
  username: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  roomId?: string;

  @Field({ nullable: true })
  lastMessage: string;

  @Field({ nullable: true })
  requestStatus?: string;
}
