import { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, TablePagination, Box, Typography, Skeleton,
  TextField, InputAdornment, IconButton,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import InboxIcon from '@mui/icons-material/Inbox';
import { useTranslation } from 'react-i18next';
import GlassSurface from './GlassSurface';
export interface Column<T> {
  id: string;
  label: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: number | string;
  minWidth?: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  searchable?: boolean;
  searchKeys?: string[];
  page?: number;
  rowsPerPage?: number;
  totalRows?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (limit: number) => void;
  rowSx?: (row: T) => SxProps<Theme>;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, keyExtractor, onRowClick, loading, searchable = true,
  page = 0, rowsPerPage = 10, totalRows, onPageChange, onRowsPerPageChange,
  rowSx, emptyMessage,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const emptyLabel = emptyMessage ?? t('common.noData');
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.id];
        return val && String(val).toLowerCase().includes(lower);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!orderBy) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filtered, orderBy, order]);

  const handleSort = (id: string) => {
    setOrderBy(id);
    setOrder(orderBy === id && order === 'asc' ? 'desc' : 'asc');
  };

  if (loading) {
    return (
      <GlassSurface sx={{ p: 2, borderRadius: 4 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={48}
            sx={{
              mb: 1,
              animation: `pulse-soft 1.5s ease-in-out infinite`,
              transform: 'none',
            }}
          />
        ))}
      </GlassSurface>
    );
  }

  return (
    <GlassSurface
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        animation: 'fadeInUp 350ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {searchable && (
        <Box sx={{ p: 2, pb: 0 }}>
          <TextField
            size="small" fullWidth placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                bgcolor: 'action.hover',
                transition: 'box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': { bgcolor: 'action.selected' },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                  boxShadow: `0 0 0 3px ${alpha(primary, 0.18)}`,
                },
                '& fieldset': { border: 'none' },
              },
            }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>,
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}><ClearIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
        </Box>
      )}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  sx={{
                    width: col.width,
                    minWidth: col.minWidth,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    letterSpacing: 0.02,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel active={orderBy === col.id} direction={orderBy === col.id ? order : 'asc'} onClick={() => handleSort(col.id)}>
                      {col.label}
                    </TableSortLabel>
                  ) : col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box py={8} sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 56, height: 56, mx: 'auto', mb: 1.5, borderRadius: 3,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'action.hover', color: 'text.disabled',
                      }}
                    >
                      <InboxIcon fontSize="large" />
                    </Box>
                    <Typography color="text.secondary" variant="body2">{emptyLabel}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row, index) => (
                <TableRow
                  key={keyExtractor(row)}
                  hover={!!onRowClick}
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    ...(rowSx ? rowSx(row) : {}),
                    '&:last-child td': { borderBottom: 0 },
                    '&:hover': onRowClick ? { bgcolor: 'action.hover' } : undefined,
                    '@keyframes rowEnter': {
                      from: { opacity: 0, transform: 'translateY(-4px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                    animation: `rowEnter 200ms ${index * 30}ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                    transition: 'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id}>{col.accessor(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {onPageChange && (
        <TablePagination
          component="div"
          count={totalRows ?? sorted.length}
          page={page}
          onPageChange={(_, p) => onPageChange(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value))}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage={t('common.rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t('common.of')} ${count !== -1 ? count : to}`}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiTablePagination-toolbar': { px: 2 },
          }}
        />
      )}
    </GlassSurface>
  );
}
