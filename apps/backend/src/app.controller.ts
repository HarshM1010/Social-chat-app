import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ResetPasswordDto } from './auth/dto/reset-password.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.appService.resetPassword(body);
    return {
      message: 'Password has been reset successfully.',
    };
  }
}
