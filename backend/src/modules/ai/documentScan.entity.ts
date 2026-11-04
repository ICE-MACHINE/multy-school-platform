import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { School } from '../school/school.entity';
import { Student } from '../student/student.entity';

export type DocumentScanStatus = 'processing' | 'completed' | 'failed';
export type DocumentType =
  | 'absence_justification'
  | 'medical_certificate'
  | 'invoice'
  | 'other'
  | 'unknown';

export interface ExtractedDocumentFields {
  title?: string;
  studentName?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  ageYears?: string;
  issueDate?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  issuer?: string;
  summary?: string;
  [key: string]: string | undefined;
}

export type DocumentReviewStatus =
  | 'pending_review'
  | 'confirmed'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'expired';

export interface DocumentVerification {
  requiresHumanReview: true;
  studentNameMatches: boolean | null;
  firstNameMatches: boolean | null;
  lastNameMatches: boolean | null;
  dateOfBirthMatches: boolean | null;
  ageMatches: boolean | null;
  documentAgeYears: number | null;
  studentAgeYears: number | null;
  issueDateValid: boolean;
  datesValid: boolean;
  lowConfidence: boolean;
  extractionSkipped: boolean;
  checks: string[];
}

@Entity('ai_document_scans')
export class DocumentScan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ type: 'varchar' })
  uploadedById!: string;

  @Column({ nullable: true })
  studentId!: string | null;

  @ManyToOne(() => Student, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'studentId' })
  student!: Student | null;

  @Column()
  originalName!: string;

  @Column()
  mimeType!: string;

  @Column({ type: 'int' })
  sizeBytes!: number;

  @Column({ type: 'varchar' })
  encryptedPath!: string;

  @Column({ type: 'enum', enum: ['processing', 'completed', 'failed'] })
  status!: DocumentScanStatus;

  @Column({
    type: 'enum',
    enum: ['absence_justification', 'medical_certificate', 'invoice', 'other', 'unknown'],
    default: 'unknown',
  })
  documentType!: DocumentType;

  @Column({ type: 'text', nullable: true })
  extractedText!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  extractedFields!: ExtractedDocumentFields | null;

  @Column({ type: 'simple-json', nullable: true })
  segmentation!: Record<string, unknown> | null;

  @Column({ type: 'float', nullable: true })
  confidence!: number | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({
    type: 'enum',
    enum: ['pending_review', 'confirmed', 'approved', 'rejected', 'archived', 'expired'],
    default: 'pending_review',
  })
  reviewStatus!: DocumentReviewStatus;

  @Column({ type: 'varchar', length: 64, nullable: true })
  contentHash!: string | null;

  @Column({ type: 'varchar', nullable: true })
  duplicateOfId!: string | null;

  @Column({ type: 'date', nullable: true })
  approvedStartDate!: string | null;

  @Column({ type: 'date', nullable: true })
  approvedEndDate!: string | null;

  @Column({ type: 'varchar', nullable: true })
  archivedById!: string | null;

  @Column({ type: 'datetime', nullable: true })
  archivedAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  expiredAt!: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  verification!: DocumentVerification | null;

  @Column({ type: 'varchar', nullable: true })
  confirmedById!: string | null;

  @Column({ type: 'datetime', nullable: true })
  confirmedAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  reviewedById!: string | null;

  @Column({ type: 'varchar', nullable: true })
  reviewedByRole!: string | null;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewNote!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  appliedAttendanceIds!: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  appliedCourseAttendanceIds!: string[] | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
