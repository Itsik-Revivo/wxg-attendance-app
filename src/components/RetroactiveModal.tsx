import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, SafeAreaView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { attendanceApi, Project } from '../api/client';
import { Colors, Spacing, Radius, Typography } from '../theme';
import ProjectPickerModal from './ProjectPickerModal';

interface Props {
  visible:   boolean;
  type:      'in' | 'out';
  projects:  Project[];
  onClose:   () => void;
  onSubmit:  () => void;
}

export default function RetroactiveModal({ visible, type, projects, onClose, onSubmit }: Props) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [date,    setDate]    = useState(new Date());
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const isIn = type === 'in';

  const handleSubmit = async () => {
    if (isIn && !selectedProject) {
      Alert.alert('שגיאה', 'יש לבחור פרויקט');
      return;
    }
    if (!note.trim()) {
      Alert.alert('שגיאה', 'יש להוסיף הסבר לדיווח רטרואקטיבי');
      return;
    }

    setLoading(true);
    try {
      if (isIn) {
        await attendanceApi.clockIn({
          projectId:       selectedProject!.id,
          isRetroactive:   true,
          retroactiveNote: note,
          retroactiveTime: date.toISOString(),
        });
      } else {
        await attendanceApi.clockOut({
          isRetroactive:   true,
          retroactiveNote: note,
          retroactiveTime: date.toISOString(),
        });
      }
      onSubmit();
      resetForm();
    } catch (err: any) {
      Alert.alert('שגיאה', err.response?.data?.error ?? 'שגיאה בשמירת הדיווח');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProject(null);
    setDate(new Date());
    setNote('');
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.container}>
          <ScrollView keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={s.header}>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <Text style={s.closeText}>ביטול</Text>
              </TouchableOpacity>
              <Text style={s.title}>{isIn ? 'כניסה רטרואקטיבית' : 'יציאה רטרואקטיבית'}</Text>
              <View style={{ width: 50 }} />
            </View>

            <View style={s.content}>

              {/* Date/time picker */}
              <Text style={s.label}>תאריך ושעה</Text>
              <TouchableOpacity style={s.field} onPress={() => setShowPicker(true)}>
                <Text style={s.fieldText}>
                  {format(date, 'dd/MM/yyyy HH:mm')}
                </Text>
                <Text style={s.fieldIcon}>📅</Text>
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={date}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, d) => { setShowPicker(false); if (d) setDate(d); }}
                  maximumDate={new Date()}
                  locale="he"
                />
              )}

              {/* Project picker (only for clock-in) */}
              {isIn && (
                <>
                  <Text style={s.label}>פרויקט</Text>
                  <TouchableOpacity
                    style={s.field}
                    onPress={() => setShowProjectPicker(true)}
                  >
                    <Text style={[s.fieldText, !selectedProject && s.placeholder]}>
                      {selectedProject?.name ?? 'בחר פרויקט...'}
                    </Text>
                    <Text style={s.fieldIcon}>▼</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Note */}
              <Text style={s.label}>סיבה לדיווח רטרואקטיבי *</Text>
              <TextInput
                style={s.textarea}
                multiline
                numberOfLines={4}
                placeholder="הסבר מדוע הדיווח מתבצע בדיעבד..."
                placeholderTextColor={Colors.textMuted}
                value={note}
                onChangeText={setNote}
                textAlign="right"
                textAlignVertical="top"
              />

              {/* Warning */}
              <View style={s.warning}>
                <Text style={s.warningText}>
                  ⚠️ דיווחים רטרואקטיביים מסומנים בצבע כתום ויוצגו לחשבת השכר בסגירת חודש
                </Text>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, loading && s.submitDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={s.submitText}>
                  {loading ? 'שומר...' : 'שמור דיווח'}
                </Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ProjectPickerModal
        visible={showProjectPicker}
        projects={projects}
        onSelect={(p) => { setSelectedProject(p); setShowProjectPicker(false); }}
        onClose={() => setShowProjectPicker(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title:     { ...Typography.h2 },
  closeBtn:  { padding: Spacing.xs },
  closeText: { color: Colors.error, fontSize: 15 },

  content: { padding: Spacing.md, gap: Spacing.xs },

  label: { ...Typography.label, marginTop: Spacing.md, marginBottom: Spacing.xs },

  field: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldText:   { fontSize: 15, color: Colors.textPrimary },
  fieldIcon:   { fontSize: 16 },
  placeholder: { color: Colors.textMuted },

  textarea: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
  },

  warning: {
    backgroundColor: '#FFF8E1',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  warningText: { fontSize: 12, color: Colors.warning, textAlign: 'right', lineHeight: 18 },

  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
