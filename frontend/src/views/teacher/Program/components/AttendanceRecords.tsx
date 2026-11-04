import { Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, CircularProgress } from '@mui/material';
import JustifyIcon from '@mui/icons-material/FactCheck';
import GlassSurface from '../../../../components/common/GlassSurface';
import FilterRow from '../../../../components/common/FilterBar';
import { pillFieldSx } from '../../../../components/common/filterStyles';
import SegmentedControl from '../../../../components/common/SegmentedControl';
import type { CourseAttendance } from '../../../../types';
import { useTranslation } from 'react-i18next';


interface AttendanceRecordsProps {
  records: CourseAttendance[];
  recordsTotal: number;
  recordsPage: number;
  recordsLoading: boolean;
  recordDate: string;
  recordSearch: string;
  recordFilter: 'all' | 'absent';
  onSetPage: (p: number) => void;
  onSetDate: (v: string) => void;
  onSetSearch: (v: string) => void;
  onSetFilter: (v: 'all' | 'absent') => void;
  onJustify: (r: CourseAttendance) => void;
}

export default function AttendanceRecords({
  records, recordsTotal, recordsPage, recordsLoading,
  recordDate, recordSearch, recordFilter,
  onSetPage, onSetDate, onSetSearch, onSetFilter, onJustify,
}: AttendanceRecordsProps) {
  const { t } = useTranslation();
  return (
    <GlassSurface sx={{ p: 2.5, borderRadius: 4 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>{t('program.attendanceTab')}</Typography>
      <FilterRow sx={{ mb: 2.5 }}>
        <TextField label={t('common.date')} type="date" size="small" value={recordDate}
          onChange={(e) => { onSetDate(e.target.value); onSetPage(0); }}
          slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 160, ...pillFieldSx }} />
        <TextField label={t('program.searchByName')} size="small" value={recordSearch}
          onChange={(e) => { onSetSearch(e.target.value); onSetPage(0); }} sx={{ minWidth: 180, ...pillFieldSx }} />
        <SegmentedControl value={recordFilter} onChange={(v) => { onSetFilter(v); onSetPage(0); }}
          options={[{ value: 'all' as const, label: t('common.all') }, { value: 'absent' as const, label: t('program.absentOnly') }]} />
      </FilterRow>
      {recordsLoading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
      ) : records.length === 0 ? (
        <Box py={3} textAlign="center"><Typography color="text.secondary">{t('program.noMatchingRecords')}</Typography></Box>
      ) : (
        <>
          <TableContainer sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('students.student')}</TableCell>
                  <TableCell>{t('common.date')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell>{t('attendance.justified')}</TableCell>
                  <TableCell>{t('attendance.justification')}</TableCell>
                  <TableCell>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{r.student?.firstName} {r.student?.lastName}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.student?.registrationNumber}</Typography>
                    </TableCell>
                    <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell><Chip size="small" label={r.isAbsent ? t('attendance.absent') : t('attendance.present')} color={r.isAbsent ? 'error' : 'success'} /></TableCell>
                    <TableCell>{r.isAbsent ? (r.justified ? <Chip size="small" label={t('attendance.justified')} color="success" /> : <Chip size="small" label={t('attendance.unjustified')} color="warning" />) : '-'}</TableCell>
                    <TableCell>{r.isAbsent && r.justified ? (r.justification || '-') : '-'}</TableCell>
                    <TableCell>{r.isAbsent && !r.justified ? <Button size="small" startIcon={<JustifyIcon />} onClick={() => onJustify(r)}>{t('attendance.justify')}</Button> : null}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {recordsTotal > 50 && (
            <TablePagination component="div" dir="ltr" count={recordsTotal} page={recordsPage} rowsPerPage={50} rowsPerPageOptions={[50]}
              onPageChange={(_, p) => onSetPage(p)} />
          )}
        </>
      )}
    </GlassSurface>
  );
}
