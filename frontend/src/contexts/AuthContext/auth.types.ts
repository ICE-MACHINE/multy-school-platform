import type { User, UserRole } from '../../types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string, schoolId?: string) => Promise<User | null>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  updateUser: (data: Partial<User>) => void;
}
