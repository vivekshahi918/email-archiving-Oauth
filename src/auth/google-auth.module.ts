import { Module } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [GoogleAuthService],
  controllers: [AuthController],
  exports: [GoogleAuthService], 
})
export class GoogleAuthModule {}
