import { Controller, Post, Body, Res, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import express from 'express';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RestAuthGuard } from './rest-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('signup')
  async signup(
    @Res({ passthrough: true }) res: express.Response,
    @Body() body: SignupDto,
  ) {
    const { token, user } = await this.authService.signup(body);
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
    });

    return { success: true, user };
  }

  @Post('login')
  async login(
    @Res({ passthrough: true }) res: express.Response,
    @Body() body: LoginDto,
  ) {
    const { token, user } = await this.authService.login(body);
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
      path: '/',
    });

    return { success: true, user };
  }

  @UseGuards(RestAuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    return res.status(200).json({ message: 'Logged out successfully' });
  }

  @UseGuards(RestAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: any,
    @Res({ passthrough: true }) res: express.Response,
    @Body() body: ChangePasswordDto,
  ) {
    const userId = req.user.sub;
    await this.authService.changePassword(userId, body);
    return res.status(200).json({
      message: 'Password updated successfully',
    });
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body);
    return {
      message: 'If that email is registered, a reset link has been sent.',
    };
  }
}
