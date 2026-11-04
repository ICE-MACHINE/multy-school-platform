import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export type DocumentAccessAction =
  | 'upload'
  | 'view'
  | 'download_decrypted'
  | 'preview'
  | 'confirm'
  | 'approve'
  | 'reject';

@Entity('ai_document_access_logs')
export class DocumentAccessLog {
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
    enum: ['upload', 'view', 'download_decrypted', 'preview', 'confirm', 'approve', 'reject'],
  })
  action!: DocumentAccessAction;

  @CreateDateColumn()
  createdAt!: Date;
}
