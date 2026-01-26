import { Module } from '@nestjs/common';
import { neo4jProvider } from './neo4j.config';

@Module({
  providers: [neo4jProvider],
  exports: [neo4jProvider],
})
export class Neo4jModule {}
