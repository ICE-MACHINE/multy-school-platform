import { useState, useMemo } from 'react';
import { useDebounce } from './useDebounce';

export function useSearch<T>(items: T[], keys: (keyof T)[]) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return items;
    const lower = debouncedSearch.toLowerCase();
    return items.filter((item) =>
      keys.some((key) => {
        const val = item[key];
        return val && String(val).toLowerCase().includes(lower);
      })
    );
  }, [items, debouncedSearch, keys]);

  return { search, setSearch, filtered };
}
