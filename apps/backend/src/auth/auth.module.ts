import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Neo4jModule } from 'src/config/neo4j.module';
import { EmailService } from './email.service';
import { ResetToken } from 'src/chat/schemas/reset-token.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ResetTokenSchema } from 'src/chat/schemas/reset-token.schema';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is not defined');
        }
        return {
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
    Neo4jModule,
    MongooseModule.forFeature([
      { name: ResetToken.name, schema: ResetTokenSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService],
})
export class AuthModule {}
