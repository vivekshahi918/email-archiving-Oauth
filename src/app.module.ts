import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import configuration from './config/configuration';
import { Email } from './email/email.entity';
import { Attachment } from './email/attachment.entity';

import { GoogleAuthService } from './auth/google-auth.service';
import { GmailService } from './gmail/gmail.service';
import { GoogleAuthModule } from './auth/google-auth.module';
import { GoogleRefreshTaskService } from './task/google-refresh-task.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.name,
          entities: [Email, Attachment], // ✅ FIXED: Add Attachment entity here
          synchronize: true, // ⚠️ Disable in production
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([Email, Attachment]), // ✅ Enables Repositories
    GoogleAuthModule,
  ],
  providers: [GoogleAuthService, GmailService, GoogleRefreshTaskService,],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly gmailService: GmailService) {}

  onModuleInit() {
    setInterval(() => {
      this.gmailService.fetchAndStoreEmails()
        .then(() => console.log('✅ Fetched new emails'))
        .catch(err => console.error('❌ Email fetch error:', err));
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}
