import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import authService from '../../services/authService';
import api from '../../services/api';
import type { User, UserRole } from '../../types';

interface MeResponse {
  id: string;
  role: UserRole;
  schoolId?: string;
  schoolSlug?: string;
  phone: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  mustChangePassword?: boolean;
}

function enforcePasswordChange(user: User): void {
  if (!user.mustChangePassword) return;
  const path = window.location.pathname;
  if (path.includes('/profile') || path.includes('/login')) return;
  if (user.role === 'super_admin') {
    window.location.href = '/superAdmin/profile';
    return;
  }
  const match = path.match(/^\/s\/([^/]+)/);
  const slug = user.schoolSlug || (match ? match[1] : '');
  if (!slug) return;
  const segment = user.role === 'school_admin' ? 'admin' : user.role;
  window.location.href = `/s/${slug}/${segment}/profile`;
}

function toUser(me: MeResponse): User {
  return {
    id: me.id,
    phone: me.phone || '',
    role: me.role,
    schoolId: me.schoolId,
    schoolSlug: me.schoolSlug || '',
    firstName: me.firstName || '',
    lastName: me.lastName || '',
    isActive: me.isActive ?? true,
    mustChangePassword: Boolean(me.mustChangePassword),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: MeResponse }>('/auth/me');
      const current = toUser(data.data);
      setUser(current);
      enforcePasswordChange(current);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (phone: string, password: string, schoolId?: string) => {
    const response = schoolId
      ? await authService.loginSchool(schoolId, { phone, password })
      : await authService.loginSuperAdmin({ phone, password });
    const loggedIn = response.data.user;
    setUser(loggedIn);
    enforcePasswordChange(loggedIn);
    return loggedIn;
  };

  const logout = () => {
    void authService.logout();
    setUser(null);
  };

  const hasRole = (...roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
