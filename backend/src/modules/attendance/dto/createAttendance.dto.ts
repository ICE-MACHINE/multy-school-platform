export interface CreateAttendanceDTO {
  date: string;
  studentId: string;
  isAbsent?: boolean;
  justified?: boolean;
  justification?: string;
  schoolId: string;
  recordedById: string;
}

export interface BulkAttendanceDTO {
  date: string;
  records: {
    studentId: string;
    isAbsent: boolean;
    justified?: boolean;
    justification?: string;
  }[];
  schoolId: string;
  recordedById: string;
}