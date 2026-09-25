import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius } from '../lib/theme';
import { useStore } from '../lib/store';
import { EmptyState, timeAgo } from '../components/ui';

const ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  job: { icon: 'briefcase', color: colors.primary, bg: colors.primaryLight },
  status: { icon: 'sync', color: colors.amber, bg: colors.amberSoft },
  interview: { icon: 'calendar', color: colors.cyan, bg: colors.cyanSoft },
  announcement: { icon: 'megaphone', color: colors.purple, bg: colors.purpleSoft },
  system: { icon: 'information-circle', color: colors.green, bg: colors.greenSoft },
};

export default function NotificationsScreen({ navigation }: any) {
  const { notifications, user, markNotifRead, markAllRead } = useStore();
  const mine = useMemo(
    () => notifications.filter((n) => n.userId === user?.id || n.userId === undefined).sort((a, b) => b.createdAt - a.createdAt),
    [notifications, user]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Notifications</Text>
        <Pressable onPress={markAllRead} hitSlop={8}>
          <Text style={styles.markAll}>Mark all</Text>
        </Pressable>
      </View>
      <FlatList
        data={mine}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cfg = ICONS[item.type] ?? ICONS.system;
          return (
            <Pressable style={[styles.item, !item.read && styles.itemUnread]} onPress={() => markNotifRead(item.id)}>
              <View style={[styles.itemIcon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody}>{item.body}</Text>
                <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="notifications-outline" title="No notifications" subtitle="You're all caught up! New job alerts and updates will appear here." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  markAll: { fontSize: 13.5, fontWeight: '700', color: colors.primary, paddingRight: 6 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 30 },
  item: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  itemUnread: { backgroundColor: colors.primaryLight, borderColor: colors.primarySoft },
  itemIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  itemBody: { fontSize: 13, color: colors.textMuted, marginTop: 3, lineHeight: 18 },
  itemTime: { fontSize: 11.5, color: colors.textFaint, marginTop: 6 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 4 },
});
