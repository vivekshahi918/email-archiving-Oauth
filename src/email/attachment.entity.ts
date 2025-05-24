import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Email } from './email.entity';

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  driveLink: string;

  @ManyToOne(() => Email, email => email.attachments, { onDelete: 'CASCADE' })
  email: Email;
}
