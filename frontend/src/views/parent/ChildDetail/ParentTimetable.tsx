import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Chip, CircularProgress, Tabs, Tab,
} from '@mui/material';
import ClassroomIcon from '@mui/icons-material/Class';
import CourseIcon from '@mui/icons-material/Book';
import PageHeader from '../../../components/common/PageHeader';
import GlassSurface from '../../../components/common/GlassSurface';
import TimetableWeekGrid from '../../../components/timetable/TimetableWeekGrid';
import timetableService from '../../../services/timetableService';
import parentService from '../../../services/parentService';
import type { TimetableSlot, TimetableSettings } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';


interface ChildWithSlots {
  id: string;
  firstName: string;
  lastName: string;
  classroom?: { id: string; name: string };
  slots: TimetableSlot[];
}

export default function ParentTimetable() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const { user } = useAuth();
  const [settings, setSettings] = useState<TimetableSettings | null>(null);
  const [children, setChildren] = useState<ChildWithSlots[]>([]);
  const [selectedChild, setSelectedChild] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!schoolId || !user?.id) return;
    setLoading(true);
    try {
      const [settingsRes, childrenRes] = await Promise.all([
        timetableService.getSettings(schoolId),
        parentService.getChildren(schoolId).catch(() => ({ data: [] })),
      ]);
      setSettings(settingsRes.data);
      const kids = childrenRes.data || [];
      const withSlots: ChildWithSlots[] = await Promise.all(
        kids.map(async (child: any) => {
          try {
            const slotsRes = await timetableService.getChildSlots(schoolId, child.id);
            return { ...child, slots: slotsRes.data || [] };
          } catch {
            return { ...child, slots: [] };
          }
        })
      );
      setChildren(withSlots);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [schoolId, user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  const currentChild = children[selectedChild];

  const getChildInfo = (child: ChildWithSlots) => {
    if (child.classroom) return child.classroom.name;
    const firstSlot = child.slots[0];
    if (!firstSlot) return t('parent.noTimetable');
    if (firstSlot.type === 'course') return firstSlot.course?.name || t('timetable.course');
    if (firstSlot.type === 'classroom') return firstSlot.classroom?.name || t('timetable.classroom');
    return firstSlot.activity?.title || t('timetable.activity');
  };

  const getChildType = (child: ChildWithSlots): 'classroom' | 'course' | 'activity' | null => {
    if (child.classroom) return 'classroom';
    const firstSlot = child.slots[0];
    if (!firstSlot) return null;
    return firstSlot.type;
  };

  const teacherName = (slot: TimetableSlot) =>
    [slot.teacher?.firstName, slot.teacher?.lastName].filter(Boolean).join(' ').trim();

  return (
    <Box>
      <PageHeader title={t('nav.timetable')} subtitle={t('parent.weeklyTimetableSubtitle')} />

      {children.length === 0 ? (
        <GlassSurface sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">{t('parent.noChildrenInSchool')}</Typography>
        </GlassSurface>
      ) : (
        <>
          {children.length > 1 && (
            <Tabs value={selectedChild} onChange={(_, v) => setSelectedChild(v)} sx={{ mb: 2 }}
              variant="scrollable" scrollButtons="auto">
              {children.map((child) => {
                const childType = getChildType(child);
                return (
                  <Tab key={child.id}
                    label={
                      <Box display="flex" flexDirection="column" alignItems="flex-start">
                        <Typography fontWeight={600} fontSize="0.9rem">
                          {child.firstName} {child.lastName}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {childType === 'classroom' && <ClassroomIcon sx={{ fontSize: 12 }} />}
                          {childType === 'course' && <CourseIcon sx={{ fontSize: 12 }} />}
                          <Typography variant="caption" color="text.secondary">
                            {getChildInfo(child)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                );
              })}
            </Tabs>
          )}

          {currentChild && (
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Chip
                icon={getChildType(currentChild) === 'classroom' ? <ClassroomIcon /> : <CourseIcon />}
                label={`${currentChild.firstName} ${currentChild.lastName} — ${getChildInfo(currentChild)}`}
                color="primary" variant="outlined" size="small"
              />
            </Box>
          )}

          {settings && currentChild && (
            <TimetableWeekGrid
              settings={settings}
              slots={currentChild.slots}
              getSubtitle={teacherName}
              emptyLabel={t('timetable.noLessonsToday')}
            />
          )}
        </>
      )}
    </Box>
  );
}
