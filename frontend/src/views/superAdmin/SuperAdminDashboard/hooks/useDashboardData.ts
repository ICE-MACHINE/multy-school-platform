import { useState, useEffect } from 'react';
import statsService from '../../../../services/statsService';
import type { PlatformStats } from '../../../../types';

export function useDashboardData() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsService.getSuperAdminStats()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}
