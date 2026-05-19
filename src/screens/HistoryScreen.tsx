import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, SafeAreaView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { attendanceApi, reportApi, TimeEntry } from '../api/client';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

export default function HistoryScreen() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['history', year, month],
    queryFn:  () => attendanceApi.getMonth(year, month).then(r => r.data),
  });

  const { data: report } = useQuery({
    queryKey: ['report', year, month],
    queryFn:  () => reportApi.getReports(year, month).then(r => r.data[0]),
  });

  // Group entries by date
  const byDate = entries.reduce((acc, e) => {
    const d = e.date.substring(0, 10);
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy', { locale: he });

  const goBack    = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const goForward = () => {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  return (
    <SafeAreaView style={s.safe}>

      {/* Month navigator */}
      <View style={s.nav}>
        <TouchableOpacity onPress={goForward} style={s.navBtn}>
          <Text style={s.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.navMonth}>{monthLabel}</Text>
        <TouchableOpacity onPress={goBack} style={s.navBtn}>
          <Text style={s.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Summary card */}
      {report && (
        <View style={s.summaryCard}>
          <SummaryItem label="שעות בפועל"   value={fmt(report.totalWorkedMinutes)} highlight />
          <SummaryItem label="תקן"           value={fmt(report.expectedMinutes)} />
          <SummaryItem label="שעות נוספות"  value={fmt(report.overtimeMinutes)} accent />
          <SummaryItem label="היעדרויות"    value={fmt(report.absenceMinutes)} />
        </View>
      )}

      {/* Status badge */}
      {report && (
        <View style={[s.statusBadge, statusStyle(report.status)]}>
          <Text style={s.statusText}>{statusLabel(report.status)}</Text>
        </View>
      )}

      {/* Daily list */}
      <FlatList
        data={Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]))}
        keyExtractor={([d]) => d}
        renderItem={({ item: [dateStr, dayEntries] }) => (
          <DayCard dateStr={dateStr} entries={dayEntries} />
        )}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl }}
        ListEmptyComponent={
          !isLoading ? <Text style={s.empty}>אין נתונים לחודש זה</Text> : null
        }
      />

    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function SummaryItem({ label, value, highlight, accent }: {
  label: string; value: string; highlight?: boolean; accent?: boolean;
}) {
  return (
    <View style={s.summaryItem}>
      <Text style={[s.summaryValue,
        highlight && s.summaryHighlight,
        accent && s.summaryAccent,
      ]}>
        {value}
      </Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </View>
  );
}

function DayCard({ dateStr, entries }: { dateStr: string; entries: TimeEntry[] }) {
  const d = new Date(dateStr);
  const dayLabel  = format(d, 'EEEE', { locale: he });
  const dateLabel = format(d, 'd/M');
  const totalMin  = entries.filter(e => e.endTime).reduce((s, e) => s + (e.totalMinutes ?? 0), 0);
  const hasOpen   = entries.some(e => !e.endTime);

  return (
    <View style={[s.dayCard, isToday(d) && s.dayCardToday]}>
      <View style={s.dayHeader}>
        <Text style={s.dayDate}>{dateLabel}</Text>
        <Text style={s.dayName}>{dayLabel}</Text>
        <Text style={s.dayTotal}>
          {hasOpen ? '⏳ פתוח' : totalMin > 0 ? fmt(totalMin) : '—'}
        </Text>
      </View>

      {entries.map(e => (
        <View key={e.id} style={[s.entryRow, e.isRetroactive && s.entryRetro]}>
          <Text style={s.entryProject}>{e.project?.name}</Text>
          <Text style={s.entryTime}>
            {format(new Date(e.startTime), 'HH:mm')}
            {e.endTime ? ` – ${format(new Date(e.endTime), 'HH:mm')}` : ' (פתוח)'}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function fmt(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    OPEN:     'פתוח לעריכה',
    PENDING:  'ממתין לאישור',
    APPROVED: 'אושר',
    LOCKED:   'נעול',
  };
  return map[s] ?? s;
}

function statusStyle(s: string) {
  const map: Record<string, object> = {
    OPEN:     { backgroundColor: '#E3F2FD', borderColor: '#1976D2' },
    PENDING:  { backgroundColor: '#FFF8E1', borderColor: Colors.warning },
    APPROVED: { backgroundColor: Colors.clockedIn, borderColor: Colors.success },
    LOCKED:   { backgroundColor: '#F5F5F5', borderColor: Colors.textMuted },
  };
  return map[s] ?? {};
}

// ── Styles ─────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  nav: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
  },
  navBtn:   { padding: Spacing.sm },
  navArrow: { fontSize: 24, color: '#fff', fontWeight: '300' },
  navMonth: { fontSize: 18, fontWeight: '700', color: '#fff' },

  summaryCard: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadows.card,
  },
  summaryItem:      { flex: 1, alignItems: 'center' },
  summaryLabel:     { fontSize: 11, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  summaryValue:     { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  summaryHighlight: { color: Colors.primary, fontSize: 18 },
  summaryAccent:    { color: Colors.accent },

  statusBadge: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-end',
  },
  statusText: { fontSize: 12, fontWeight: '600' },

  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayCardToday: { borderColor: Colors.primary, borderWidth: 2 },

  dayHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayDate:  { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  dayName:  { fontSize: 13, color: Colors.textSecondary },
  dayTotal: { fontSize: 14, fontWeight: '600', color: Colors.primaryLight },

  entryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  entryRetro:   { backgroundColor: '#FFF8E1' },
  entryProject: { fontSize: 13, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  entryTime:    { fontSize: 13, color: Colors.textSecondary, marginLeft: Spacing.sm },

  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xxl },
});
