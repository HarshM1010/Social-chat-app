import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class MemberRemovedResponse {
  @Field()
  groupId: string;
}
