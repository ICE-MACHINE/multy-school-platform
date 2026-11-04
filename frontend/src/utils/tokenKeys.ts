// Auth tokens are HttpOnly cookies set by the API — JavaScript never sees,
// stores, or sends them. This module only knows how to (a) read the
// non-HttpOnly CSRF cookie for the double-submit header and (b) purge the
// legacy localStorage tokens written by older versions of the app.

export function getLoginRedirectPath(): string {
  const path = window.location.pathname;
  if (path.startsWith('/superAdmin')) return '/superAdmin/login';
  const match = path.match(/^\/s\/([^/]+)/);
  return match ? `/s/${match[1]}/login` : '/superAdmin/login';
}

export function getCsrfToken(): string | null {
  const prefix = 'csrf_token=';
  const part = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : null;
}

const LEGACY_TOKEN_KEY = /(^|_)accessToken$|(^|_)refreshToken$|^accessToken$|^refreshToken$/;

export function purgeLegacyStoredTokens(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && LEGACY_TOKEN_KEY.test(key)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage may be unavailable (private mode); cookies still protect the session.
  }
}
