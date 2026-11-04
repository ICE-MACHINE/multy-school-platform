import { useState, useEffect, useCallback } from 'react';
import schoolService from '../../../../services/schoolService';
import type { School } from '../../../../types';

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await schoolService.getAll(page + 1, rowsPerPage);
      setSchools(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [page, rowsPerPage]);

  useEffect(() => { fetch(); }, [fetch]);

  return { schools, loading, page, rowsPerPage, total, setPage, setRowsPerPage, refresh: fetch };
}
