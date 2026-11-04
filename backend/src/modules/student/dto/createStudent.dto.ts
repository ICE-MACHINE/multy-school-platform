export interface CreateStudentDTO {
  registrationNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: 'male' | 'female';
  healthStatus?: string;
  schoolId: string;
  parentId?: string;
  classroomId?: string;
  isExemptFromPayment?: boolean;
}