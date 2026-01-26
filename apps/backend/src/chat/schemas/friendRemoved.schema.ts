import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class FriendRemovedPayload {
  @Field()
  targetUserId: string;
  @Field()
  removedUserId: string;
}
