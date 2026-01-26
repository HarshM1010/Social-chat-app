import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './schemas/message.schema';
import { WsAuthGuard } from '../auth/ws-auth.guard';
import { Inject, UseGuards, Logger } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import type { AuthenticatedSocket } from './types/authenticated-socket';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @Inject('NEO4J_DRIVER') private neo4jDriver: Driver,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized on Port 3001');
  }

  // This will log when a client tries to connect
  handleConnection(client: any) {
    this.logger.log(`Client attempting connection: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  async joinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.user.sub;

    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[:HAS_MEMBER]->(g:ChatRoom {id: $roomId})
        RETURN g
        `,
        { userId, roomId },
      );

      if (result.records.length === 0) {
        this.logger.warn(`User ${userId} denied access to room ${roomId}`);
        client.emit('error', 'Unauthorized');
        return;
      }

      await client.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
      this.logger.log(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      this.logger.error('Neo4j Error during join_room:', error);
    } finally {
      await session.close();
    }
  }

  //we must use chat.resolver.ts (graphql) to write state change logics and gateway (websocket) only for emphemeral events

  // @SubscribeMessage('send_message')
  // async sendMessage(
  //   @MessageBody() data: { roomId: string; content: string },
  //   @ConnectedSocket() client: AuthenticatedSocket,
  // ) {
  //   try{
  //     const senderId = client.user.sub;

  //     if (!client.rooms.has(data.roomId)) {
  //         client.emit('error', 'You must join the room before sending messages.');
  //         return;
  //     }

  //     const message = await this.messageModel.create({
  //       roomId: data.roomId,
  //       senderId,
  //       content: data.content,
  //       status: 'sent',
  //     });

  //     client.to(data.roomId).emit('new_message', message);
  //     client.emit('new_message', message);
  //     this.logger.log(`Message sent in room ${data.roomId} by ${senderId}`);
  //   } catch (error) {
  //     this.logger.error('Error sending message:', error);
  //     client.emit('error', 'Failed to save message');
  //   }
  // }

  // @SubscribeMessage('message_delivered')
  // async messageDelivered(
  //   @MessageBody() data: { messageId: string; roomId: string },
  //   @ConnectedSocket() client: AuthenticatedSocket,
  // ) {
  //   // Update DB
  //   await this.messageModel.findByIdAndUpdate(data.messageId, {
  //     status: 'delivered',
  //   });

  //   // Notify the room (or just the sender) that the message was delivered
  //   // We send to the room so the sender sees the double-tick
  //   client.to(data.roomId).emit('message_status_update', {
  //     messageId: data.messageId,
  //     status: 'delivered',
  //   });
  // }

  // @SubscribeMessage('message_read')
  // async messageRead(
  //   @MessageBody() data: { roomId: string; messageId: string },
  //   @ConnectedSocket() client: AuthenticatedSocket,
  // ) {
  //   const userId = client.user.sub;

  //   const message = await this.messageModel.findById(data.messageId);

  //   if (!message) return;

  //   const alreadyRead = message.readBy.find((entry) => entry.userId === userId);
  //   if (!alreadyRead) {
  //     message.readBy.push({ userId, readAt: new Date() });
  //   }
  //   // Optional: determine if all members read
  //   message.status = 'read';
  //   await message.save();

  //   this.server.to(data.roomId).emit('message_status_update', {
  //     messageId: data.messageId,
  //     status: 'read',
  //     readBy: message.readBy,
  //   });
  // }

  // @SubscribeMessage('get_messages')
  // async getMessages(
  //   @MessageBody() data: { roomId: string; cursor?: string; limit: number },
  // ) {
  //   const limit = data.limit || 20;
  //   const query: any = { roomId: data.roomId };

  //   // If a cursor is provided, fetch messages OLDER than that timestamp
  //   if (data.cursor) {
  //     query.createdAt = { $lt: new Date(data.cursor) };
  //   }

  //   return await this.messageModel
  //     .find(query)
  //     .sort({ createdAt: -1 }) // Utilizes your compound index
  //     .limit(limit);
  // }
}
