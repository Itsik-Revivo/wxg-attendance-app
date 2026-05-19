import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import { attendanceApi, projectApi, Project, TimeEntry } from '../api/client';
import { useAuthStore } from '../store/auth.store';
import { useLocation } from '../hooks/useLocation';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';
import ProjectPickerModal from '../components/ProjectPickerModal';
import RetroactiveModal from '../components/RetroactiveModal';

export default function HomeScreen() {
  const { employee } = useAuthStore();
  const queryClient  = useQueryClient();
  const { coord, refresh: refreshGps } = useLocation();

  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showRetroModal,    setShowRetroModal]    = useState(false);
  const [retroType,         setRetroType]         = useState<'in' | 'out'>('in');

  // ── Queries ──────────────────────────────────────────────────

  const { data: today, isLoading: todayLoading, refetch: refetchToday } = useQuery({
    queryKey: ['today'],
    queryFn:  () => attendanceApi.getToday().then(r => r.data),
    refetchInterval: 60_000, // refresh every minute
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => projectApi.getMyProjects().then(r => r.data),
  });

  // ── Mutations ────────────────────────────────────────────────

  const clockInMutation = useMutation({
    mutationFn: (projectId: string) =>
      attendanceApi.clockIn({
        projectId,
        lat: coord?.lat,
        lng: coord?.lng,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error ?? 'שגיאה בחתימת כניסה';
      Alert.alert('שגיאה', msg);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () =>
      attendanceApi.clockOut({ lat: coord?.lat, lng: coord?.lng }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error ?? 'שגיאה בחתימת יציאה';
      Alert.alert('שגיאה', msg);
    },
  });

  // ── Refetch on focus ─────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      refetchToday();
      refreshGps();
    }, [])
  );

  // ── Derived state ────────────────────────────────────────────

  const isClockedIn    = today?.isCurrentlyClockedIn ?? false;
  const todayEntries   = today?.entries ?? [];
  const openEntry      = todayEntries.find(e => !e.endTime);
  const todayMinutes   = todayEntries
    .filter(e => e.endTime)
    .reduce((sum, e) => sum + (e.totalMinutes ?? 0), 0);

  const greeting = getGreeting();
  const dateStr  = format(new Date(), 'EEEE, d בMMMM', { locale: he });

  // ── Handlers ─────────────────────────────────────────────────

  const handleClockIn = () => {
    if (projects.length === 0) {
      Alert.alert('שגיאה', 'אין פרויקטים פעילים משויכים אליך');
      return;
    }
    setShowProjectPicker(true);
  };

  const handleClockOut = () => {
    Alert.alert(
      'יציאה מעבודה',
      `האם לאשר יציאה מ-${openEntry?.project?.name}?`,
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'אישור יציאה', onPress: () => clockOutMutation.mutate() },
      ]
    );
  };

  const handleRetroactive = (type: 'in' | 'out') => {
    setRetroType(type);
    setShowRetroModal(true);
  };

  const isBusy = clockInMutation.isPending || clockOutMutation.isPending;

  // ── Render ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        refreshControl={
          <RefreshControl refreshing={todayLoading} onRefresh={() => { refetchToday(); refreshGps(); }} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.greeting}>{greeting}, {employee?.fullName?.split(' ')[0]}</Text>
          <Text style={s.date}>{dateStr}</Text>
        </View>

        {/* Status card */}
        <View style={[s.statusCard, isClockedIn && s.statusCardActive]}>
          <View style={s.statusRow}>
            <View style={[s.statusDot, isClockedIn && s.statusDotActive]} />
            <Text style={[s.statusText, isClockedIn && s.statusTextActive]}>
              {isClockedIn ? `בעבודה — ${openEntry?.project?.name}` : 'לא מחתים נוכחות'}
            </Text>
          </View>
          {isClockedIn && openEntry && (
            <Text style={s.clockedSince}>
              מאז {format(new Date(openEntry.startTime), 'HH:mm')}
            </Text>
          )}
          {todayMinutes > 0 && (
            <Text style={s.todayTotal}>
              סה"כ היום: {formatMinutes(todayMinutes)}
            </Text>
          )}
        </View>

        {/* Main action button */}
        <TouchableOpacity
          style={[s.mainBtn, isClockedIn ? s.mainBtnOut : s.mainBtnIn, isBusy && s.mainBtnDisabled]}
          onPress={isClockedIn ? handleClockOut : handleClockIn}
          disabled={isBusy}
          activeOpacity={0.85}
        >
          {isBusy ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Text style={s.mainBtnIcon}>{isClockedIn ? '🚪' : '✅'}</Text>
              <Text style={s.mainBtnText}>{isClockedIn ? 'חתימת יציאה' : 'חתימת כניסה'}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Retroactive buttons */}
        <View style={s.retroRow}>
          <TouchableOpacity style={s.retroBtn} onPress={() => handleRetroactive('in')}>
            <Text style={s.retroText}>+ כניסה רטרואקטיבית</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.retroBtn} onPress={() => handleRetroactive('out')}>
            <Text style={s.retroText}>+ יציאה רטרואקטיבית</Text>
          </TouchableOpacity>
        </View>

        {/* Today's entries */}
        {todayEntries.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>פעילות היום</Text>
            {todayEntries.map(entry => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </View>
        )}

      </ScrollView>

      {/* Modals */}
      <ProjectPickerModal
        visible={showProjectPicker}
        projects={projects}
        onSelect={(p) => {
          setShowProjectPicker(false);
          clockInMutation.mutate(p.id);
        }}
        onClose={() => setShowProjectPicker(false)}
      />

      <RetroactiveModal
        visible={showRetroModal}
        type={retroType}
        projects={projects}
        onClose={() => setShowRetroModal(false)}
        onSubmit={() => {
          setShowRetroModal(false);
          queryClient.invalidateQueries({ queryKey: ['today'] });
        }}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function EntryRow({ entry }: { entry: TimeEntry }) {
  const start = format(new Date(entry.startTime), 'HH:mm');
  const end   = entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '—';
  const duration = entry.totalMinutes ? formatMinutes(entry.totalMinutes) : 'פתוח';

  return (
    <View style={s.entryRow}>
      <View style={s.entryLeft}>
        <Text style={s.entryTime}>{start} – {end}</Text>
        <Text style={s.entryDuration}>{duration}</Text>
      </View>
      <View style={s.entryRight}>
        <Text style={s.entryProject}>{entry.project?.name}</Text>
        {entry.isRetroactive && <Text style={s.retroTag}>רטרואקטיבי</Text>}
      </View>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  return 'ערב טוב';
}

function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}ש' ${min > 0 ? `${min}ד'` : ''}` : `${min}ד'`;
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },

  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'right' },
  date:     { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'right', marginTop: 2 },

  statusCard: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  statusCardActive: {
    backgroundColor: Colors.clockedIn,
    borderColor: Colors.clockedInBorder,
  },
  statusRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  statusDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.textMuted,
  },
  statusDotActive:   { backgroundColor: Colors.success },
  statusText:        { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  statusTextActive:  { color: Colors.success },
  clockedSince: { fontSize: 13, color: Colors.success, textAlign: 'right', marginTop: 4 },
  todayTotal:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'right', marginTop: 4 },

  mainBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.button,
  },
  mainBtnIn:       { backgroundColor: Colors.success },
  mainBtnOut:      { backgroundColor: Colors.error },
  mainBtnDisabled: { opacity: 0.7 },
  mainBtnIcon:     { fontSize: 24 },
  mainBtnText:     { fontSize: 20, fontWeight: '800', color: '#fff' },

  retroRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  retroBtn: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  retroText: { fontSize: 12, color: Colors.primaryLight, fontWeight: '500' },

  section:      { margin: Spacing.md },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },

  entryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryLeft:    { alignItems: 'flex-end' },
  entryRight:   { alignItems: 'flex-start' },
  entryTime:    { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  entryDuration:{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  entryProject: { fontSize: 14, color: Colors.primaryLight, fontWeight: '500', maxWidth: 160 },
  retroTag: {
    fontSize: 10, color: Colors.warning,
    borderWidth: 1, borderColor: Colors.warning,
    borderRadius: 3, paddingHorizontal: 4,
    marginTop: 2,
  },
});
