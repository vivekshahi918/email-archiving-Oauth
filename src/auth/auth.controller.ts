import { Controller, Get, Query, Res } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { Response } from 'express';

@Controller('auth') 
export class AuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  // http://localhost:3000/auth/google/auth
  @Get('google/auth')
  getAuthUrl() {
    const url = this.googleAuthService.getAuthUrl();
    return { url };
  }

  @Get('google/callback')
  async handleCallback(@Query('code') code: string, @Res() res: Response) {
    await this.googleAuthService.getTokens(code);
    res.send('✅ Authentication successful. You may close this tab.');
  }
}
