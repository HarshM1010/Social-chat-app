import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';

export const neo4jProvider = {
  provide: 'NEO4J_DRIVER',
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Driver => {
    return neo4j.driver(
      configService.get<string>('NEO4J_URI')!,
      neo4j.auth.basic(
        configService.get<string>('NEO4J_USER')!,
        configService.get<string>('NEO4J_PASSWORD')!,
      ),
    );
  },
};
