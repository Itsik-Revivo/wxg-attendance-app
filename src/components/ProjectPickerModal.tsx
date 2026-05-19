import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, SafeAreaView,
} from 'react-native';
import { Project } from '../api/client';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface Props {
  visible:   boolean;
  projects:  Project[];
  onSelect:  (p: Project) => void;
  onClose:   () => void;
}

export default function ProjectPickerModal({ visible, projects, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = projects.filter(p =>
    p.name.includes(search) ||
    (p.projectCode?.includes(search) ?? false)
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeText}>סגור</Text>
          </TouchableOpacity>
          <Text style={s.title}>בחר פרויקט</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Search */}
        <View style={s.searchWrapper}>
          <TextInput
            style={s.search}
            placeholder="חפש לפי שם או מספר..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.row} onPress={() => onSelect(item)} activeOpacity={0.7}>
              <View style={s.rowContent}>
                <Text style={s.projectName}>{item.name}</Text>
                {item.projectCode && (
                  <Text style={s.projectCode}>מס' {item.projectCode}</Text>
                )}
              </View>
              {item.hasPolygon && (
                <View style={s.polygonBadge}>
                  <Text style={s.polygonText}>📍 יש פוליגון</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={
            <Text style={s.empty}>לא נמצאו פרויקטים</Text>
          }
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />

      </SafeAreaView>
    </Modal>
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
  closeText: { color: Colors.primaryLight, fontSize: 15 },

  searchWrapper: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  search: {
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowContent:   { flex: 1, alignItems: 'flex-end' },
  projectName:  { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  projectCode:  { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  polygonBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginLeft: Spacing.sm,
  },
  polygonText: { fontSize: 11, color: Colors.success },

  separator: { height: 1, backgroundColor: Colors.border },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xl },
});
