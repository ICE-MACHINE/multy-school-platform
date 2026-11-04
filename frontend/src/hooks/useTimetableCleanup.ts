import { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import timetableService from '../services/timetableService';

const CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000; // weekly

export function useTimetableCleanup() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(async () => {
    if (!schoolId) return;
    try {
      await timetableService.cleanupOldRequests(schoolId);
    } catch { /* silent */ }
  }, [schoolId]);

  useEffect(() => {
    cleanup();
    intervalRef.current = setInterval(cleanup, CLEANUP_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cleanup]);
}

export default useTimetableCleanup;
