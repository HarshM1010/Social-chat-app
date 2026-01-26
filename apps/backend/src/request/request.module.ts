import { Module } from '@nestjs/common';
import { RequestService } from './request.service';
import { RequestResolver } from '../resolvers/request.resolver';
import { Neo4jModule } from '../config/neo4j.module';

@Module({
  imports: [Neo4jModule],
  providers: [RequestResolver, RequestService],
})
export class RequestModule {}
