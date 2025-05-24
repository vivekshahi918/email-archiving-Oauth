import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Attachment } from './attachment.entity';

@Entity()
export class Email {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  messageId: string;

  @Column()
  threadId: string;

  @Column()
  subject: string;

  @Column()
  from: string;

  @Column({ nullable: true })
  to: string;

  @Column({ nullable: true })
  cc: string;

  @Column({ nullable: true })
  bcc: string;

  @Column('text')
  body: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  inReplyTo: string;

  @Column({ nullable: true })
  references: string;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  labelIds: string[];

  @Column({ default: '' })
  historyId: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isStarred: boolean;

  @OneToMany(() => Attachment, attachment => attachment.email, { cascade: true })
  attachments: Attachment[];
}
