export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;

interface AttemptState {
  failures: number;
  firstFailureAt: number;
  lockedUntil: number;
}

const attempts = new Map<string, AttemptState>();

export function loginThrottleKey(phone: string, scope = ''): string {
  return `${scope}:${phone}`.toLowerCase();
}

export function isLoginLocked(key: string, now: Date = new Date()): boolean {
  const state = attempts.get(key);
  if (!state) return false;
  if (state.lockedUntil > now.getTime()) return true;
  if (state.lockedUntil > 0 && state.lockedUntil <= now.getTime()) attempts.delete(key);
  return false;
}

export function recordLoginFailure(key: string, now: Date = new Date()): void {
  const nowMs = now.getTime();
  const state = attempts.get(key);
  if (!state || nowMs - state.firstFailureAt > LOGIN_WINDOW_MS) {
    attempts.set(key, { failures: 1, firstFailureAt: nowMs, lockedUntil: 0 });
    return;
  }
  state.failures += 1;
  if (state.failures >= LOGIN_MAX_FAILURES) {
    state.lockedUntil = nowMs + LOGIN_LOCK_MS;
  }
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}

export function resetLoginThrottleForTests(): void {
  attempts.clear();
}
