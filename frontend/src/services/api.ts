import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { getCsrfToken, getLoginRedirectPath, purgeLegacyStoredTokens } from '../utils/tokenKeys';

purgeLegacyStoredTokens();

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

function applyCommonHeaders(config: InternalAxiosRequestConfig) {
  if (!(config.headers instanceof AxiosHeaders)) {
    config.headers = new AxiosHeaders(config.headers);
  }
  const headers = config.headers as AxiosHeaders;
  headers.set('Accept-Language', localStorage.getItem('app-language') || navigator.language || 'en');
  if (config.method && MUTATING_METHODS.has(config.method.toLowerCase())) {
    const csrf = getCsrfToken();
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }
  return config;
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

export const publicApi = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});
publicApi.interceptors.request.use((config) => applyCommonHeaders(config));

api.interceptors.request.use((config) => applyCommonHeaders(config));

let refreshPromise: Promise<unknown> | null = null;

async function refreshSession(): Promise<unknown> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', {}, { withCredentials: true, headers: csrfHeaders() })
      .then(({ data }) => data.data)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function csrfHeaders(): Record<string, string> {
  const csrf = getCsrfToken();
  return csrf ? { 'X-CSRF-Token': csrf } : {};
}

async function handleAuthFailure(originalRequest: { _retry?: boolean; [key: string]: unknown }): Promise<unknown> {
  try {
    await refreshSession();
    return api(originalRequest as never);
  } catch {
    // Only force a full-page redirect from protected pages. On public pages
    // (landing, school landing, login) a failed refresh simply means
    // "anonymous": redirecting there — especially to the page we are already
    // on — would reload the app forever. AuthGuard handles protected routes
    // with a client-side Navigate instead.
    const path = window.location.pathname;
    const target = getLoginRedirectPath();
    const isPublicPage = path === '/' || /^\/s\/[^/]+\/?$/.test(path) || path.endsWith('/login');
    if (!isPublicPage && path !== target) {
      window.location.href = target;
    }
    return Promise.reject(new Error('Refresh failed'));
  }
}

function isPublicAuthRequest(url?: string): boolean {
  // '/auth/me' is the anonymous session probe used by AuthProvider on every
  // page (including public ones): its 401 must reject quietly, never trigger
  // a refresh + redirect cycle.
  return !!url && (url.includes('/login') || url.includes('/auth/refresh') || url.includes('/auth/me'));
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    if ((status === 401 || status === 403) && originalRequest && !originalRequest._retry && !isPublicAuthRequest(originalRequest.url)) {
      // A 403 can be CSRF/authorization, not only an expired session: only
      // attempt the cookie refresh for 401s, and for 403s when a CSRF token
      // exists and the failure was not already a retried request.
      if (status === 401) {
        originalRequest._retry = true;
        return handleAuthFailure(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
