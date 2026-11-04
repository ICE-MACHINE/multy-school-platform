export interface CreateParentDTO {
  firstName: string;
  lastName: string;
  placeOfResidence?: string;
  gender: 'male' | 'female';
  phone: string;
  password: string;
  schoolId: string;
}

export interface LoginParentDTO {
  phone: string;
  password: string;
  schoolId: string;
}