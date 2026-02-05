import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { Driver } from 'neo4j-driver';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { v4 as uuidv4 } from 'uuid';
import {
  ResetToken,
  ResetTokenDocument,
} from '../chat/schemas/reset-token.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @InjectModel(ResetToken.name)
    private readonly resetTokenModel: Model<ResetTokenDocument>,
    @Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver,
  ) {}

  async signup(dto: SignupDto) {
    const session = this.neo4jDriver.session();

    try {
      const existingEmail = await session.run(
        `MATCH (u:User {email: $email}) RETURN u`,
        {
          email: dto.email,
          username: dto.username.toLowerCase(),
        },
      );

      if (existingEmail.records.length > 0) {
        throw new ConflictException('Email is already registered');
      }

      const existingUserName = await session.run(
        `MATCH (u:User {username: $username}) RETURN u`,
        {
          email: dto.email,
          username: dto.username.toLowerCase(),
        },
      );

      if (existingUserName.records.length > 0) {
        throw new ConflictException('This username is taken');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const userId = crypto.randomUUID();

      await session.run(
        `
        CREATE (u:User {
          userId: $userId,
          name: $name,
          username: $username,
          email: $email,
          password: $password
        })
        `,
        {
          userId,
          name: dto.name,
          username: dto.username.toLowerCase(),
          email: dto.email,
          password: hashedPassword,
        },
      );

      const token = this.jwtService.sign({
        sub: userId,
        email: dto.email,
      });

      return {
        token,
        user: {
          userId: userId,
          username: dto.username.toLowerCase(),
          name: dto.name,
          email: dto.email,
        },
      };
    } finally {
      await session.close();
    }
  }

  async login(dto: LoginDto) {
    const session = this.neo4jDriver.session();

    try {
      const identifier = dto.identifier.toLowerCase();

      const result = await session.run(
        `
        MATCH (u:User)
        WHERE u.email = $identifier OR u.username = $identifier
        RETURN u
        `,
        { identifier },
      );

      if (result.records.length === 0) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = result.records[0].get('u').properties;

      const isValid = await bcrypt.compare(dto.password, user.password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.jwtService.sign({
        sub: user.userId,
        email: user.email,
      });

      return {
        token,
        user: {
          userId: user.userId,
          username: user.username,
          name: user.name,
          email: user.email,
        },
      };
    } finally {
      await session.close();
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const session = this.neo4jDriver.session();
    try {
      const { newPassword, currentPassword } = dto;
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})
        RETURN u.password AS hash
        `,
        { userId },
      );
      if (result.records.length === 0) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const storedHash = result.records[0].get('hash');
      const isMatch = await bcrypt.compare(currentPassword, storedHash);
      if (!isMatch) {
        throw new BadRequestException('Incorrect current password');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateResult = await session.run(
        `
        MATCH (u:User {userId: $userId})
        SET u.password = $hashedPassword
        `,
        { userId, hashedPassword },
      );
    } finally {
      await session.close();
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    if (!dto.email) {
      throw new BadRequestException('Email is required');
    }
    const session = this.neo4jDriver.session();
    let userId: string;
    try {
      const result = await session.run(
        `
        MATCH (u:User {email: $email})
        RETURN u.userId AS userId
        `,
        { email: dto.email.toLowerCase() },
      );
      if (!result.records.length) {
        return;
      }
      console.log('Forgot password - user found:', dto.email);
      userId = result.records[0]?.get('userId');
      console.log('User ID:', userId);
    } finally {
      await session.close();
    }
    const token = uuidv4();
    await this.resetTokenModel.create({
      token,
      userId: userId,
    });
    const Url = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${Url}/reset-password?token=${token}`;
    await this.emailService.sendResetPasswordEmail(dto.email, resetLink);
    return { message: 'Reset Password link sent to your email.' };
  }
}
