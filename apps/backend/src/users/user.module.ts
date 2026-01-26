import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from '../resolvers/user.resolver';
import { Neo4jModule } from '../config/neo4j.module';

@Module({
  imports: [Neo4jModule],
  providers: [UserResolver, UserService],
})
export class UserModule {}
