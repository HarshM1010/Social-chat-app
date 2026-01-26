import {
  Resolver,
  Mutation,
  Args,
  Context,
  Subscription,
} from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { pubSub } from '../utils/pubSub';
import { RequestService } from '../request/request.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { ChatUser } from '../users/entities/user.entity';

@Resolver(() => ChatUser)
export class RequestResolver {
  constructor(private readonly requestService: RequestService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async sendFriendRequest(
    @Args('to') receiverId: string,
    @Context() context: any,
  ) {
    const userId = context.jwt.sub;

    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }
    const senderInfo = await this.requestService.sendFriendRequest(
      userId,
      receiverId,
    );
    if (senderInfo) {
      await pubSub.publish('friendRequestReceived', {
        friendRequestReceived: {
          receiverId: receiverId,
          username: senderInfo.username,
          name: senderInfo.name,
          userId: senderInfo.userId,
        },
      });
      return true;
    }
    return false;
  }

  @Subscription(() => ChatUser, {
    filter: (payload, variables) => {
      return payload.friendRequestReceived.receiverId === variables.userId;
    },
    resolve: (payload) => {
      return payload.friendRequestReceived;
    },
  })
  friendRequestReceived(@Args('userId') userId: string) {
    return pubSub.asyncIterator('friendRequestReceived');
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async cancelFriendRequest(
    @Args('to') receiverId: string,
    @Context() context: any,
  ) {
    const userId = context.jwt.sub;

    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }

    const result = await this.requestService.cancelFriendRequest(
      userId,
      receiverId,
    );
    if (result) {
      await pubSub.publish('cancelRequestReceived', {
        cancelRequestReceived: {
          receiverId: receiverId,
        },
      });
      return true;
    }
    return false;
  }

  @Subscription(() => String, {
    filter: (payload, variables) => {
      return payload.cancelRequestReceived.receiverId === variables.userId;
    },
    resolve: () => {
      return true;
    },
  })
  cancelRequestReceived(@Args('userId') userId: string) {
    return pubSub.asyncIterator('cancelRequestReceived');
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async acceptFriendRequest(
    @Args('senderId') senderId: string,
    @Context() context: any,
  ) {
    const userId = context.jwt.sub;
    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }
    const result = await this.requestService.acceptFriendRequest(
      senderId,
      userId,
    );
    if (result) {
      await pubSub.publish('acceptRequestReceived', {
        acceptRequestReceived: {
          senderId: senderId,
        },
      });
      return true;
    }
    return false;
  }

  @Subscription(() => Boolean, {
    filter: (payload, variables) => {
      return payload.acceptRequestReceived.senderId === variables.userId;
    },
    resolve: () => {
      return true;
    },
  })
  acceptRequestReceived(@Args('userId') userId: string) {
    return pubSub.asyncIterator('acceptRequestReceived');
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async rejectFriendRequest(
    @Args('from') from: string,
    @Context() context: any,
  ) {
    const userId = context.jwt.sub;
    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }
    const result = await this.requestService.rejectFriendRequest(from, userId);
    if (result) {
      await pubSub.publish('rejectRequestReceived', {
        rejectRequestReceived: {
          senderId: from,
        },
      });
      return true;
    }
    return false;
  }

  @Subscription(() => Boolean, {
    filter: (payload, variables) => {
      return payload.rejectRequestReceived.senderId === variables.userId;
    },
    resolve: () => {
      return true;
    },
  })
  rejectRequestReceived(@Args('userId') userId: string) {
    return pubSub.asyncIterator('rejectRequestReceived');
  }
}
