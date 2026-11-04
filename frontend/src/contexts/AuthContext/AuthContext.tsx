import { createContext } from 'react';
import type { AuthContextType } from './auth.types';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => null,
  logout: () => {},
  hasRole: () => false,
  updateUser: () => {},
});
