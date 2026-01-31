import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ResetPasswordDto } from './auth/dto/reset-password.dto';
import { Driver } from 'neo4j-driver';
import {
  ResetToken,
  ResetTokenDocument,
} from './chat/schemas/reset-token.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(ResetToken.name)
    private readonly resetTokenModel: Model<ResetTokenDocument>,
    @Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (!dto.token) {
      throw new BadRequestException('Token is required');
    }
    if (!dto.newPassword) {
      throw new BadRequestException('New password is required');
    }
    const resetTokenDoc = await this.resetTokenModel.findOne({
      token: dto.token,
    });
    if (!resetTokenDoc) {
      throw new BadRequestException('Invalid or expired token');
    }
    const userId = resetTokenDoc.userId;
    const session = this.neo4jDriver.session();
    try {
      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
      await session.run(
        `
        MATCH (u:User {userId: $userId})
        SET u.password = $hashedPassword
        `,
        { userId, hashedPassword },
      );
      await this.resetTokenModel.deleteOne({ _id: resetTokenDoc._id });
      return { message: 'Password reset successfully' };
    } finally {
      await session.close();
    }
  }
}
