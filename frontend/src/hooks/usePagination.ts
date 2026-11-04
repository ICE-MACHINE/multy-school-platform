import { useState } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination({ initialPage = 1, initialLimit = 10 }: UsePaginationProps = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);

  return { page, limit, total, totalPages, setPage, setLimit, setTotal };
}
