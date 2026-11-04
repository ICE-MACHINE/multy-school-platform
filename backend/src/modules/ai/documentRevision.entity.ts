import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export type DocumentRevisionAction =
  | 'uploaded'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'fields_corrected'
  | 'confirmed'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'expired'
  | 'duplicate_upload_blocked';

export interface DocumentFieldChange {
  from: string | null;
  to: string | null;
}

@Entity('ai_document_revisions')
export class DocumentRevision {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  schoolId!: string;

  @Column()
  documentId!: string;

  @Column()
  actorId!: string;

  @Column()
  actorRole!: string;

  @Column({
    type: 'enum',
    enum: [
      'uploaded', 'analysis_completed', 'analysis_failed', 'fields_corrected',
      'confirmed', 'approved', 'rejected', 'archived', 'expired', 'duplicate_upload_blocked',
    ],
  })
  action!: DocumentRevisionAction;

  @Column({ type: 'varchar', nullable: true })
  fromStatus!: string | null;

  @Column({ type: 'varchar', nullable: true })
  toStatus!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  changes!: Record<string, DocumentFieldChange> | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
