import { AppDataSource } from '../../config/data-source';
import { SuperAdmin } from '../../modules/superAdmin/superAdmin.entity';
import { SchoolAdmin } from '../../modules/schoolAdmin/schoolAdmin.entity';
import { Teacher } from '../../modules/teacher/teacher.entity';
import { Parent } from '../../modules/parent/parent.entity';

export interface SessionState {
  exists: boolean;
  isActive: boolean;
  tokenVersion: number;
  mustChangePassword: boolean;
}

const CACHE_TTL_MS = Number(process.env.AUTH_SESSION_CACHE_MS || 30_000);
const cache = new Map<string, { expiresAt: number; state: SessionState }>();

function repoForRole(role: string) {
  switch (role) {
    case 'super_admin':
      return AppDataSource.getRepository(SuperAdmin);
    case 'school_admin':
      return AppDataSource.getRepository(SchoolAdmin);
    case 'teacher':
      return AppDataSource.getRepository(Teacher);
    case 'parent':
      return AppDataSource.getRepository(Parent);
    default:
      return null;
  }
}

export async function getSessionState(role: string, userId: string): Promise<SessionState> {
  if (!AppDataSource.isInitialized) {
    // Unit tests and CLI contexts run without a database; the production
    // server always initializes the DataSource before accepting traffic.
    return { exists: true, isActive: true, tokenVersion: 0, mustChangePassword: false };
  }
  const key = `${role}:${userId}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.state;

  const repo = repoForRole(role) as {
    findOne(options: unknown): Promise<Record<string, unknown> | null>;
  } | null;
  if (!repo) return { exists: false, isActive: false, tokenVersion: 0, mustChangePassword: false };

  const user = await repo.findOne({ where: { id: userId } });
  const state: SessionState = user
    ? {
        exists: true,
        isActive: Boolean(user.isActive ?? true),
        tokenVersion: Number(user.tokenVersion) || 0,
        mustChangePassword: Boolean(user.mustChangePassword ?? false),
      }
    : { exists: false, isActive: false, tokenVersion: 0, mustChangePassword: false };

  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, state });
  return state;
}

export function invalidateSessionCache(role: string, userId: string): void {
  cache.delete(`${role}:${userId}`);
}

export async function bumpTokenVersion(role: string, userId: string): Promise<void> {
  const repo = repoForRole(role) as {
    increment(criteria: unknown, propertyPath: string, value: number): Promise<unknown>;
  } | null;
  if (!repo) return;
  await repo.increment({ id: userId }, 'tokenVersion', 1);
  invalidateSessionCache(role, userId);
}

export function isTokenRevoked(state: SessionState, tokenVersionClaim: unknown): boolean {
  if (!state.exists || !state.isActive) return true;
  const claim = typeof tokenVersionClaim === 'number' ? tokenVersionClaim : 0;
  return claim !== state.tokenVersion;
}
