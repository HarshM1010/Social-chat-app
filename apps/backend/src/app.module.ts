import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Neo4jGraphQL } from '@neo4j/graphql';
import { typeDefs } from './graphql/schema';
import { neo4jProvider } from './config/neo4j.config';
import { mongoConfig } from './config/mongo.config';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { Neo4jModule } from './config/neo4j.module';
import { mergeSchemas } from '@graphql-tools/schema';
import { RequestModule } from './request/request.module';
import { UserModule } from './users/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  ResetToken,
  ResetTokenSchema,
} from './chat/schemas/reset-token.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    mongoConfig,
    MongooseModule.forFeature([
      { name: ResetToken.name, schema: ResetTokenSchema },
    ]),
    Neo4jModule,
    AuthModule,
    ChatModule,
    RequestModule,
    UserModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      imports: [Neo4jModule, ChatModule],
      driver: ApolloDriver,
      inject: ['NEO4J_DRIVER'],
      useFactory: (driver) => {
        return {
          autoSchemaFile: true,
          transformSchema: async (nestSchema) => {
            try {
              const neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                features: {
                  subscriptions: true,
                  authorization: {
                    key: process.env.JWT_SECRET!,
                  },
                },
              });
              const neoGqlSchema = await neoSchema.getSchema();
              return mergeSchemas({
                schemas: [nestSchema, neoGqlSchema],
              });
            } catch (error) {
              console.error('=========================================');
              console.error('SCHEMA MERGE ERROR DETECTED:');
              // This will print the actual error messages inside the array
              if (Array.isArray(error)) {
                error.forEach((e) => console.error(e.message));
              } else {
                console.error(error);
              }
              console.error('=========================================');
              throw error;
            }
          },
          installSubscriptionHandlers: true,
          subscriptions: {
            'graphql-ws': true,
            'subscriptions-transport-ws': true,
          },
          context: ({ req, res, connection }) => {
            if (connection) {
              return { jwt: connection.context.jwt };
            }
            if (!req) return {};
            // console.log('--- ALL HEADERS ---', req.headers);
            // 2. Access headers directly from the Express request object
            const authHeader = req.headers.authorization || req.headers.Authorization;
            const cookieToken = req.cookies?.access_token;
            let token = null;
            let jwtPayload = undefined;
            if (authHeader) {
              token = authHeader.replace('Bearer ', '');
            } else if (cookieToken) {
              token = cookieToken;
            }
            if (token) {
              try {
                jwtPayload = require('jsonwebtoken').verify(
                  token,
                  process.env.JWT_SECRET!,
                );
              } catch (e) {
                console.error('Token verification failed:', e.message);
              }
            }
            console.log('AUTH HEADER:', authHeader);
            console.log('Cookie Token found:', !!cookieToken);
            console.log('JWT IN CONTEXT:', jwtPayload);

            return {
              req, // Pass req back if other parts of your app need it
              res,
              jwt: jwtPayload,
            };
          },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [neo4jProvider, AppService],
})
export class AppModule {}
