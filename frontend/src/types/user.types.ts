export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'parent';
export type SchoolType = 'quranic' | 'private' | 'kindergarten';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: UserRole;
  schoolId?: string;
  schoolSlug?: string;
  isActive: boolean;
  mustChangePassword?: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}
