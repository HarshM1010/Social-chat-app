import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Neo4jModule } from 'src/config/neo4j.module';

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
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
