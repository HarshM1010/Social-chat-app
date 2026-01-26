import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { Message, MessageSchema } from './schemas/message.schema';
import { Neo4jModule } from '../config/neo4j.module';
import { ChatResolver } from 'src/resolvers/chat.resolver';
// import { UserResolver } from 'src/resolvers/user.resolver';
import { ChatService } from './chat.service';
// import { LastMessageLoader } from './dataloader/last-message.loader';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    Neo4jModule,
  ],
  providers: [
    ChatGateway,
    ChatService,
    ChatResolver,
    // UserResolver,
    // LastMessageLoader,
  ],
})
export class ChatModule {}
