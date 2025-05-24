import { google } from 'googleapis';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { OAuth2Client, Credentials } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
  private oauth2Client: OAuth2Client;
  private readonly tokenPath = path.join(__dirname, '../../src/config/token.json');

  constructor() {
    const credentialsPath = path.join(__dirname, '../../src/config/client_service.json');
    const credentials = JSON.parse(require('fs').readFileSync(credentialsPath, 'utf-8'));
    const oauthConfig = credentials.installed || credentials.web;

    if (!oauthConfig) {
      throw new Error('Invalid client_service.json: Missing "installed" or "web" object');
    }

    this.oauth2Client = new google.auth.OAuth2(
      oauthConfig.client_id,
      oauthConfig.client_secret,
      oauthConfig.redirect_uris[0],
    );
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    await this.saveTokens(tokens);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  private async saveTokens(tokens: Credentials) {
    await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2));
  }

  async getOAuthClient(): Promise<OAuth2Client> {
    try {
      const tokenData = await fs.readFile(this.tokenPath, 'utf-8');
      const tokens = JSON.parse(tokenData);
      this.oauth2Client.setCredentials(tokens);
    } catch (err) {
      console.error('❌ Failed to load token.json:', err.message);
      throw new Error('Missing or invalid token.json. Please authorize the app via /auth URL.');
    }

    return this.oauth2Client;
  }

  async refreshAccessTokenIfNeeded(): Promise<void> {
    try {
      const tokenData = await fs.readFile(this.tokenPath, 'utf-8');
      const tokens = JSON.parse(tokenData);

      const expiryDate = tokens.expiry_date || 0;
      const now = Date.now();

      if (now > expiryDate - 60_000) {
        this.oauth2Client.setCredentials(tokens);
        const { credentials } = await this.oauth2Client.refreshAccessToken();

        console.log('✅ Token refreshed');
        await this.saveTokens(credentials);
        this.oauth2Client.setCredentials(credentials);
      } else {
        console.log('🔁 Token still valid');
      }
    } catch (err) {
      console.error('❌ Token refresh failed:', err.message);
    }
  }
}
