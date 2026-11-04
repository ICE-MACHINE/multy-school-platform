export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender?: string;
  placeOfResidence?: string;
  schoolId: string;
  childrenIds: string[];
  children?: Array<{ id: string; firstName: string; lastName: string; registrationNumber: string }>;
  childrenCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateParentPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  gender?: string;
  placeOfResidence?: string;
}

export interface UpdateParentPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  gender?: string;
  placeOfResidence?: string;
}
