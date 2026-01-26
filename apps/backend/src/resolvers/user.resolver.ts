// import { Resolver, ResolveField, Parent, Mutation, Args } from '@nestjs/graphql';
// import { User } from '../users/models/user.model';
// import { LastMessageLoader } from '../chat/dataloader/last-message.loader';

// @Resolver(() => ChatUser)
// export class UserResolver {
//   constructor(
// private readonly lastMessageLoader: LastMessageLoader,
//   ) {}

//   @ResolveField('lastMessage', () => String, { nullable: true })
//   async getLastMessage(@Parent() user: User) {
//     console.log(`Checking user: ${user.name}, roomId: ${user.roomId}`);
//     if (!user.roomId) return null;
//     // Use the loader. .load() puts this ID in the queue.
//     const msg = await this.lastMessageLoader.batch.load(user.roomId);
//     return msg ? msg.content : 'null';
//   }
// }

import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { UserService } from '../users/user.service';
import { ChatUser } from '../users/entities/user.entity';

@Resolver(() => ChatUser)
export class UserResolver {
  constructor(private readonly usersService: UserService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [ChatUser], { name: 'searchUsers' })
  async searchUsers(
    @Args('username') username: string,
    @Context() context: any,
  ) {
    const currentUserId = context.jwt?.sub;
    if (!currentUserId) {
      throw new ForbiddenException('User is not authenticated');
    }
    return this.usersService.searchUsers(username, currentUserId);
  }
}
