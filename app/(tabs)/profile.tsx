import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useAuthStore } from '../../src/store/auth.store';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../src/theme';

const COMPANY_LABELS: Record<string, string> = {
  WAXMAN_GROUP:          'וקסמן גרופ',
  WAXMAN_CONSULTANTS:    'וקסמן יועצים והנדסה',
  WAXMAN_MANAGEMENT:     'וקסמן ניהול והשבחה',
  WAXMAN_INFRASTRUCTURE: 'וקסמן תשתיות, תעשיה ואנרגיה',
};

export default function ProfileScreen() {
  const { employee, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('התנתקות', 'האם לצאת מהמערכת?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התנתק', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/login');
      }},
    ]);
  };

  if (!employee) return null;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView>
        {/* Header */}
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {employee.fullName.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </Text>
          </View>
          <Text style={s.name}>{employee.fullName}</Text>
          <Text style={s.role}>{employee.jobTitle ?? 'עובד'}</Text>
        </View>

        {/* Info cards */}
        <View style={s.section}>
          <InfoRow label="חברה"     value={COMPANY_LABELS[employee.company] ?? employee.company} />
          <InfoRow label="מייל"     value={employee.email ?? '—'} />
          {employee.isPayrollAdmin && (
            <InfoRow label="תפקיד מערכת" value="חשב/ת שכר" highlight />
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>🚪  התנתקות</Text>
        </TouchableOpacity>

        <Text style={s.version}>גרסה 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={s.infoRow}>
      <Text style={[s.infoValue, highlight && s.infoHighlight]}>{value}</Text>
      <Text style={s.infoLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name:       { fontSize: 22, fontWeight: '700', color: '#fff' },
  role:       { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  section: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.card,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel:     { ...Typography.label },
  infoValue:     { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', flex: 1, textAlign: 'left' },
  infoHighlight: { color: Colors.accent, fontWeight: '700' },

  logoutBtn: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  logoutText: { color: Colors.error, fontSize: 15, fontWeight: '600' },

  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginBottom: Spacing.xl },
});
