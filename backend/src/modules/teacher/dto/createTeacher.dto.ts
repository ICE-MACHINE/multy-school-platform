export interface CreateTeacherDTO {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: 'male' | 'female';
  phone: string;
  password: string;
  schoolId: string;
  classroomId?: string;
}

export interface LoginTeacherDTO {
  phone: string;
  password: string;
  schoolId: string;
}