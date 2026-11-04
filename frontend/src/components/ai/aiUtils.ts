export function formatRatioPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

export function getErrorMessage(err: unknown, fallback: string, timeoutMessage?: string): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { code?: unknown; message?: unknown; response?: { data?: { message?: unknown } } };
    if (timeoutMessage && (e.code === 'ECONNABORTED' || (typeof e.message === 'string' && e.message.includes('timeout')))) {
      return timeoutMessage;
    }
    const message = e.response?.data?.message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
