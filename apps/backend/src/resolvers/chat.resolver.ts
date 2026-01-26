import {
  Resolver,
  Query,
  Args,
  Int,
  Context,
  Mutation,
  Subscription,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { ChatService } from '../chat/chat.service';
import { Message } from '../chat/schemas/message.schema';
import { CreateMessageInput } from '../chat/dto/create-message.input';
import { pubSub } from '../utils/pubSub';
import { ForbiddenException, Inject, UseGuards } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { ChatUser } from '../users/entities/user.entity';
import { ChatResponse } from '../chat/schemas/message.schema';
import { FriendRemovedPayload } from '../chat/schemas/friendRemoved.schema';
import { MemberRemovedResponse } from 'src/chat/schemas/memberRemovedResponse';

@Resolver(() => Message)
export class ChatResolver {
  constructor(
    private readonly chatService: ChatService,
    @Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver,
  ) {}

  @ResolveField(() => ChatUser) // Resolves the sender field in Message (added to get the username in the response to get_messages query)
  async sender(@Parent() message: Message) {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})
        RETURN u
        `,
        {
          userId: message.senderId,
        },
      );
      if (result.records.length === 0) return null;
      const username = result.records[0].get('u').properties;
      return username; //returns username
    } finally {
      await session.close();
    }
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => ChatResponse, { name: 'getMessages' })
  async getMessages(
    @Args('roomId', { type: () => String, nullable: true }) roomId: string,
    @Args('friendId', { type: () => String, nullable: true }) friendId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Context() context: any,
  ) {
    const userId = context.jwt?.sub;
    if (!roomId) {
      roomId = await this.chatService.getPrivateRoom(userId, friendId);
    }
    const messages = await this.chatService.getMessages(roomId, limit, skip);
    return {
      roomId: roomId,
      messages: messages,
    };
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  async sendMessage(
    @Args('input') input: CreateMessageInput,
    @Context() context: any,
  ): Promise<Message> {
    const userId = context.jwt?.sub;
    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[:HAS_MEMBER]->(g:ChatRoom {id: $roomId})
        RETURN g
        `,
        {
          userId,
          roomId: input.roomId,
        },
      );
      if (result.records.length === 0) {
        throw new ForbiddenException('You are not a member of this chat room');
      }
    } finally {
      await session.close();
    }
    const message = await this.chatService.sendMessage(input, userId);
    await pubSub.publish('messageAdded', { messageAdded: message });
    return message;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message) // response of the mutation is of type Message as the user's ui needs to know to remove the message which user deleted...
  async deleteMessage(@Args('id', { type: () => ID }) id: string) {
    const deletedMessage = await this.chatService.deleteMessage(id);
    await pubSub.publish('messageDeleted', { messageDeleted: deletedMessage });
    return deletedMessage;
  }

  @Subscription(() => Message, {
    name: 'messageDeleted',
    filter: (payload, variables) =>
      payload.messageDeleted.roomId === variables.roomId,
  })
  messageDeleted(@Args('roomId') roomId: string) {
    return pubSub.asyncIterator('messageDeleted');
  }

  @Subscription(() => Message, {
    name: 'messageAdded',
    filter: (payload, variables) =>
      payload.messageAdded.roomId === variables.roomId,
  })
  messageAdded(@Args('roomId') roomId: string) {
    return pubSub.asyncIterator('messageAdded');
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  async markAsDelivered(
    @Args('messageId', { type: () => ID }) messageId: string,
  ) {
    const message = await this.chatService.markAsDelivered(messageId);
    // Broadcast update to the room
    await pubSub.publish('messageStatusUpdated', {
      messageStatusUpdated: message,
    });
    return message;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  async markAsRead(
    @Args('messageId', { type: () => ID }) messageId: string,
    @Context() context: any,
  ) {
    const userId = context.jwt?.sub;
    if (!userId) throw new ForbiddenException('User is not authenticated');
    const message = await this.chatService.markAsRead(messageId, userId);
    // Broadcast update to the room
    await pubSub.publish('messageStatusUpdated', {
      messageStatusUpdated: message,
    });
    return message;
  }

  @Subscription(() => Message, {
    name: 'messageStatusUpdated',
    filter: (payload, variables) =>
      payload.messageStatusUpdated.roomId === variables.roomId,
  })
  messageStatusUpdated(@Args('roomId') roomId: string) {
    return pubSub.asyncIterator('messageStatusUpdated');
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async forgetFriend(
    @Args('friendId') friendId: string,
    @Args('roomId', { nullable: true }) roomId: string,
    @Context() context: any,
  ) {
    const currentUserId = context.jwt?.sub;
    if (!currentUserId) {
      throw new ForbiddenException('User is not authenticated');
    }
    const result = await this.chatService.forgetFriendAndHistory(
      friendId,
      roomId,
      currentUserId,
    );
    if (result) {
      await pubSub.publish('friendRemoved', {
        friendRemoved: {
          targetUserId: friendId,
          removedUserId: currentUserId,
        },
      });
    }
    return result;
  }

  @Subscription(() => FriendRemovedPayload, {
    filter: (payload, variables) =>
      payload.friendRemoved.targetUserId === variables.userId,
  })
  friendRemoved(@Args('userId') userId: string) {
    return pubSub.asyncIterator('friendRemoved');
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async addMemberToGroup(
    @Args('groupId') groupId: string,
    @Args('newMemberId') newMemberId: string,
    @Context() context: any,
  ) {
    const currentUserId = context.jwt?.sub;
    if (!currentUserId) {
      throw new ForbiddenException('User is not authenticated');
    }
    const result = await this.chatService.addMemberToGroup(
      newMemberId,
      groupId,
      currentUserId,
    );
    if (result) {
      await pubSub.publish('addedMemberReceived', {
        addedMemberReceived: {
          targetUserId: newMemberId,
        },
      });
      await pubSub.publish('addedMemRosterUpdated', {
        addedMemRosterUpdated: {
          groupId: groupId,
        },
      });
    }
    return result;
  }

  @Subscription(() => Boolean, {
    filter: (payload, variables) =>
      payload.addedMemberReceived.targetUserId === variables.userId,
    resolve: () => true,
  })
  addedMemberReceived(@Args('userId') userId: string) {
    return pubSub.asyncIterator('addedMemberReceived');
  }

  @Subscription(() => Boolean, {
    filter: (payload, variables) =>
      payload.addedMemRosterUpdated.groupId === variables.groupId,
    resolve: () => true,
  })
  addedMemRosterUpdated(@Args('groupId') groupId: string) {
    return pubSub.asyncIterator('addedMemRosterUpdated');
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async removeGroupMember(
    @Args('groupId') groupId: string,
    @Args('targetUserId') targetUserId: string,
    @Context() context: any,
  ) {
    const currentUserId = context.jwt?.sub;
    if (!currentUserId) {
      throw new ForbiddenException('User is not authenticated');
    }
    const result = await this.chatService.removeGroupMember(
      targetUserId,
      groupId,
      currentUserId,
    );
    if (result) {
      await pubSub.publish('removedMemberReceived', {
        removedMemberReceived: {
          targetUserId: targetUserId,
          groupId: groupId,
        },
      });
      await pubSub.publish('removedMemRosterUpdated', {
        removedMemRosterUpdated: {
          groupId: groupId,
        },
      });
    }
    return result;
  }

  @Subscription(() => MemberRemovedResponse, {
    filter: (payload, variables) =>
      payload.removedMemberReceived.targetUserId === variables.userId,
    resolve: (payload) => payload.removedMemberReceived,
  })
  removedMemberReceived(@Args('userId') userId: string) {
    return pubSub.asyncIterator('removedMemberReceived');
  }

  @Subscription(() => Boolean, {
    filter: (payload, variables) =>
      payload.removedMemRosterUpdated.groupId === variables.groupId,
    resolve: () => true,
  })
  removedMemRosterUpdated(@Args('groupId') groupId: string) {
    return pubSub.asyncIterator('removedMemRosterUpdated');
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async makeGroupAdmin(
    @Args('groupId') groupId: string,
    @Args('targetUserId') targetUserId: string,
    @Context() context: any,
  ) {
    const currentUserId = context.jwt?.sub;
    if (!currentUserId) {
      throw new ForbiddenException('User is not authenticated');
    }
    const result = await this.chatService.makeGroupAdmin(
      targetUserId,
      groupId,
      currentUserId,
    );
    if (result) {
      await pubSub.publish('adminStatusChanged', {
        adminStatusChanged: {
          groupId: groupId,
        },
      });
    }
    return true;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async removeGroupAdmin(
    @Args('groupId') groupId: string,
    @Args('targetUserId') targetUserId: string,
    @Context() context: any,
  ) {
    const currentUserId = context.jwt?.sub;
    if (!currentUserId) {
      throw new ForbiddenException('User is not authenticated');
    }
    const result = await this.chatService.removeGroupAdmin(
      targetUserId,
      groupId,
      currentUserId,
    );
    if (result) {
      await pubSub.publish('adminStatusChanged', {
        adminStatusChanged: {
          groupId: groupId,
        },
      });
    }
    return true;
  }

  @Subscription(() => Boolean, {
    filter: (payload, variables) =>
      payload.adminStatusChanged.groupId === variables.groupId,
    resolve: () => true,
  })
  adminStatusChanged(@Args('groupId') groupId: string) {
    return pubSub.asyncIterator('adminStatusChanged');
  }
}
