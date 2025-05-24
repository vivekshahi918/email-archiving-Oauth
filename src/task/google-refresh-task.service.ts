import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoogleAuthService } from '../auth/google-auth.service';

@Injectable()
export class GoogleRefreshTaskService {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleRefreshToken() {
    console.log('⏰ Checking token refresh...');
    await this.googleAuthService.refreshAccessTokenIfNeeded();
  }
}
