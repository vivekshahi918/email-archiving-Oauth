import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { google, gmail_v1 } from 'googleapis';
import { Buffer } from 'buffer';
import { Readable } from 'stream'; 
import { Email } from '../email/email.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GoogleAuthService } from '../auth/google-auth.service';
import { Attachment } from '../email/attachment.entity';

interface GmailPart {
  filename?: string | undefined;
  body?: { attachmentId?: string };
  parts?: GmailPart[];
  mimeType?: string;
}

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  constructor(
    private readonly googleAuth: GoogleAuthService,
    @InjectRepository(Email)
    private readonly emailRepo: Repository<Email>,
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
  ) {}

  private mapToGmailPart(parts: gmail_v1.Schema$MessagePart[] | undefined): GmailPart[] {
    if (!parts) return [];
    return parts.map(p => ({
      filename: p.filename ?? undefined,
      body: p.body ? { attachmentId: p.body.attachmentId ?? undefined } : undefined,
      parts: this.mapToGmailPart(p.parts),
      mimeType: p.mimeType ?? undefined,
    }));
  }

  private getAttachmentParts(parts: GmailPart[]): GmailPart[] {
    let attachments: GmailPart[] = [];
    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push(part);
      }
      if (part.parts && part.parts.length > 0) {
        attachments = attachments.concat(this.getAttachmentParts(part.parts));
      }
    }
    return attachments;
  }

  async fetchAndStoreEmails() {
    const auth = await this.googleAuth.getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    this.logger.log('📥 Fetching emails from Gmail API...');
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    });

    for (const msg of res.data.messages || []) {
      if (!msg.id) continue;

      const fullMsg = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full', // Important to get full metadata
      });

      const payload = fullMsg.data.payload;
      const headers = payload?.headers || [];

      const messageId = fullMsg.data.id ?? '';
      const threadId = fullMsg.data.threadId ?? '';

      const existing = await this.emailRepo.findOneBy({ messageId });
      if (existing) {
        existing.labelIds = fullMsg.data.labelIds || [];
        existing.isRead = !existing.labelIds.includes('UNREAD');
        existing.isStarred = existing.labelIds.includes('STARRED');
        await this.emailRepo.save(existing);

        this.logger.log(`🔄 Updated existing email labels for messageId: ${messageId}`);
        continue;
      }

      const getHeader = (name: string): string => {
        return headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
      };

      const email = new Email();
      email.messageId = messageId;
      email.threadId = threadId;
      email.subject = getHeader('Subject');
      email.from = getHeader('From');
      email.to = getHeader('To');
      email.cc = getHeader('Cc');
      email.bcc = getHeader('Bcc');
      email.date = new Date(getHeader('Date') || new Date().toISOString());
      email.inReplyTo = getHeader('In-Reply-To');
      email.references = getHeader('References');
      email.labelIds = fullMsg.data.labelIds || [];
      email.historyId = fullMsg.data.historyId || '';
      email.isRead = !email.labelIds.includes('UNREAD');
      email.isStarred = email.labelIds.includes('STARRED');

      // Parse email body
      if (payload?.parts?.length) {
        const bodyPart = payload.parts.find(
          part => part.mimeType === 'text/plain' || part.mimeType === 'text/html',
        );
        email.body = bodyPart?.body?.data
          ? Buffer.from(bodyPart.body.data, 'base64').toString('utf-8')
          : '';
      } else {
        email.body = payload?.body?.data
          ? Buffer.from(payload.body.data, 'base64').toString('utf-8')
          : '';
      }

      const savedEmail = await this.emailRepo.save(email);

      // Handle attachments
      const attachmentsParts = payload?.parts
        ? this.getAttachmentParts(this.mapToGmailPart(payload.parts))
        : [];

      for (const part of attachmentsParts) {
        if (!part.body?.attachmentId) continue;

        const attachmentRes = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: msg.id,
          id: part.body.attachmentId,
        });

        const attachmentData = attachmentRes.data?.data || '';
        const buffer = Buffer.from(attachmentData, 'base64');
        const stream = Readable.from(buffer);

        const mimeType = part.mimeType || 'application/octet-stream';

        const driveFile = await drive.files.create({
          requestBody: {
            name: part.filename,
            mimeType,
          },
          media: {
            mimeType,
            body: stream,
          },
          fields: 'id, webViewLink, webContentLink',
        });

        const fileId = driveFile.data.id;

        if (fileId) {
          await drive.permissions.create({
            fileId: fileId,
            requestBody: {
              type: 'anyone',
              role: 'reader',
            },
          });

          const link = driveFile.data.webViewLink || '';

          const attachment = this.attachmentRepo.create({
            filename: part.filename,
            driveLink: link,
            email: savedEmail,
          });

          await this.attachmentRepo.save(attachment);
          this.logger.log(`📎 Uploaded and saved attachment: ${part.filename}`);
        } else {
          this.logger.warn(`⚠️ Skipping attachment ${part.filename}: No fileId returned`);
        }
      }

      this.logger.log(`✅ Saved email with messageId: ${messageId}`);
    }
  }

  @Cron('*/3 * * * *') // Every 3 minutes
  async handleCron() {
    this.logger.log('⏰ Running scheduled email fetch...');
    try {
      await this.fetchAndStoreEmails();
    } catch (error) {
      this.logger.error('❌ Error fetching emails:', error);
    }
  }
}
