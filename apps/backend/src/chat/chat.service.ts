import {
  Injectable,
  NotFoundException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageInput } from './dto/create-message.input';
import { v4 as uuidv4 } from 'uuid';
import { Driver } from 'neo4j-driver';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver,
  ) {}

  async getPrivateRoom(userId: string, friendId: string): Promise<string> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (me:User {userId: $userId})
        MATCH (friend:User {userId: $friendId})
        OPTIONAL MATCH (me)-[:HAS_MEMBER]->(existing:ChatRoom {isGroup: false})<-[:HAS_MEMBER]-(friend)
        WITH me, friend, existing
        CALL apoc.do.when(
          existing is NULL,
          'CREATE (newRoom: ChatRoom {id: $newId, isGroup: false, createdAt: datetime()})
          MERGE (me)-[:HAS_MEMBER]->(newRoom)
          MERGE (friend)-[:HAS_MEMBER]->(newRoom)
          RETURN newRoom.id AS roomId',
          'RETURN existing.id AS roomId',
          {me: me, friend: friend, existing: existing, newId: $newId}
        ) YIELD value

        RETURN value.roomId AS roomId
        `,
        { userId, friendId, newId: uuidv4() },
      );
      if (result.records.length === 0) throw new Error('Could not ensure room');
      return result.records[0].get('roomId');
    } finally {
      await session.close();
    }
  }

  async getMessages(
    roomId: string,
    limit: number = 50,
    skip: number = 0,
  ): Promise<Message[]> {
    return this.messageModel
      .find({ roomId }) // Filter by Room
      .sort({ createdAt: -1 }) // Sort by newest first (uses your index)
      .skip(skip) // Pagination offset
      .limit(limit) // Limit number of messages
      .exec();
  }

  // async getLatestMessagesBatch(roomIds: string[]): Promise<Message[]> {
  //   if (!roomIds || roomIds.length === 0) return [];
  //   console.log('1. Service received IDs:', roomIds);

  //   const result = await this.messageModel.aggregate([
  //     {
  //       $match: {
  //         roomId: { $in: roomIds.map((id) => new Types.ObjectId(id)) },
  //       },
  //     },
  //     {
  //       $sort: { createdAt: -1 },
  //     },
  //     {
  //       $group: {
  //         _id: '$roomId',
  //         latestMessage: { $first: '$$ROOT' },
  //       },
  //     },
  //     {
  //       $replaceRoot: { newRoot: '$latestMessage' },
  //     },
  //   ]);
  //   console.log('2. Aggregation Result:', result);
  //   return result;
  // }

  async sendMessage(
    createMessageInput: CreateMessageInput,
    senderId: string,
  ): Promise<Message> {
    const newMessage = new this.messageModel({
      ...createMessageInput,
      senderId,
      status: 'sent',
      readBy: [],
    });
    return newMessage.save();
  }

  async deleteMessage(messageId: string): Promise<Message> {
    const result = await this.messageModel.findByIdAndDelete(messageId);
    if (!result) throw new NotFoundException('Message not found');
    return result;
  }

  async markAsDelivered(messageId: string): Promise<Message> {
    const message = await this.messageModel.findByIdAndUpdate(
      messageId,
      { status: 'delivered' },
      { new: true }, // returns the updated document
    );
    if (!message) throw new NotFoundException('Message not found');
    return message;
  }

  async markAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const alreadyRead = message.readBy.find((entry) => entry.userId === userId);
    if (!alreadyRead) {
      message.readBy.push({ userId, readAt: new Date() });
      // Logic for group chats: usually status becomes 'read' when everyone has read,
      // but for now, we'll set it to 'read' if at least one of the recipient reads it.
      message.status = 'read';
      await message.save();
    }
    return message;
  }

  async forgetFriendAndHistory(
    friendId: string,
    roomId: string | null,
    currentUserId: string,
  ): Promise<boolean> {
    const session = this.neo4jDriver.session();
    try {
      if (roomId) {
        await this.messageModel.deleteMany({ roomId: roomId });
      }
      await session.run(
        `
        MATCH (me:User {userId: $currentUserId})
        MATCH (friend:User {userId: $friendId})
        MATCH (me)-[r:FRIENDS_WITH]-(friend)
        DELETE r
        WITH me, friend
        OPTIONAL MATCH (me)-[:HAS_MEMBER]->(room:ChatRoom {id: $roomId})<-[:HAS_MEMBER]-(friend)
        WHERE $roomId IS NOT NULL AND room.isGroup = false
        WITH room
        DETACH DELETE room
        RETURN true 
        `,
        { friendId, currentUserId, roomId },
      );
      return true;
    } finally {
      await session.close();
    }
  }

  async addMemberToGroup(
    newMemberId: string,
    groupId: string,
    currentUserId: string,
  ): Promise<boolean> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (me:User {userId: $currentUserId})
        MATCH (g:ChatRoom {id: $groupId})
        MATCH (newMember:User {userId: $newMemberId})
        WHERE g.isGroup = true
        AND (me)-[:HAS_MEMBER]->(g)
        AND (me)-[:FRIENDS_WITH]-(newMember)
        MERGE (newMember)-[:HAS_MEMBER]->(g)
        RETURN true
        `,
        { currentUserId, newMemberId, groupId },
      );
      if (result.records.length === 0) throw new Error('Could not ensure room');
      return true;
    } finally {
      await session.close();
    }
  }

  async removeGroupMember(
    targetUserId: string,
    groupId: string,
    currentUserId: string,
  ): Promise<boolean> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (me:User {userId: $currentUserId})
        MATCH (g:ChatRoom {id: $groupId})
        MATCH (target:User {userId: $targetUserId})
        WHERE (me)-[:IS_ADMIN_OF]->(g)
        AND (target)-[:HAS_MEMBER]->(g)
        MATCH (target)-[r:HAS_MEMBER]->(g)
        OPTIONAL MATCH (target)-[R:IS_ADMIN_OF]->(g)
        DELETE R,r
        RETURN true
        `,
        { currentUserId, targetUserId, groupId },
      );
      if (result.records.length === 0) throw new Error('Could not ensure room');
      return true;
    } finally {
      await session.close();
    }
  }

  async makeGroupAdmin(
    targetUserId: string,
    groupId: string,
    currentUserId: string,
  ): Promise<boolean> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (me:User {userId: $currentUserId})
        MATCH (g:ChatRoom {id: $groupId})
        MATCH (target:User {userId: $targetUserId})
        WHERE (me)-[:IS_ADMIN_OF]->(g)
        AND (target)-[:HAS_MEMBER]->(g)
        AND NOT (target)-[:IS_ADMIN_OF]->(g)
        MERGE (target)-[:IS_ADMIN_OF]->(g)
        RETURN true
        `,
        { currentUserId, targetUserId, groupId },
      );
      if (result.records.length === 0) throw new Error('Could not ensure room');
      return true;
    } finally {
      await session.close();
    }
  }

  async removeGroupAdmin(
    targetUserId: string,
    groupId: string,
    currentUserId: string,
  ): Promise<boolean> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (me:User {userId: $currentUserId})
        MATCH (g:ChatRoom {id: $groupId})
        MATCH (target:User {userId: $targetUserId})
        WHERE (me)-[:IS_ADMIN_OF]->(g)
        AND (target)-[:IS_ADMIN_OF]->(g)
        MATCH (target)-[r:IS_ADMIN_OF]->(g)
        DELETE r
        RETURN true
        `,
        { currentUserId, targetUserId, groupId },
      );
      if (result.records.length === 0) throw new Error('Could not ensure room');
      return true;
    } finally {
      await session.close();
    }
  }
}
