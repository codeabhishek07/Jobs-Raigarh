import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow, statusColor } from '../lib/theme';
import { useStore } from '../lib/store';
import { Badge, Button, EmptyState, fmtDate } from '../components/ui';
import StatusTimeline from '../components/StatusTimeline';
import { Application, AppStatus } from '../lib/types';

const TABS: (AppStatus | 'All')[] = ['All', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

export default function ApplicationsScreen({ navigation }: any) {
  const { applications, jobs, user } = useStore();
  const [tab, setTab] = useState<AppStatus | 'All'>('All');
  const [selected, setSelected] = useState<Application | null>(null);

  const mine = useMemo(
    () => applications.filter((a) => a.userId === user?.id).sort((a, b) => b.appliedAt - a.appliedAt),
    [applications, user]
  );
  const filtered = tab === 'All' ? mine : mine.filter((a) => a.status === tab);
  const jobOf = (id: string) => jobs.find((j) => j.id === id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Applications</Text>
        <Text style={styles.count}>{mine.length} total applications</Text>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {TABS.map((t) => {
            const c = mine.filter((a) => t === 'All' || a.status === t).length;
            const active = tab === t;
            return (
              <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t}</Text>
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && { color: colors.white }]}>{c}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const job = jobOf(item.jobId);
          const sc = statusColor[item.status];
          return (
            <Pressable style={styles.appCard} onPress={() => setSelected(item)}>
              <View style={styles.appTop}>
                <View style={styles.appLogo}><Text style={{ fontSize: 22 }}>{job?.logo ?? '🏢'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appJob} numberOfLines={1}>{job?.title ?? 'Job'}</Text>
                  <Text style={styles.appCompany} numberOfLines={1}>{job?.company}</Text>
                </View>
                <Badge label={item.status} bg={sc.bg} fg={sc.fg} />
              </View>
              <View style={styles.appMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.metaText}>Applied {fmtDate(item.appliedAt)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.metaText}>{job?.location}</Text>
                </View>
              </View>
              <View style={styles.appFooter}>
                <Text style={styles.viewTimeline}>View timeline</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.primary} />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="documents-outline"
            title={tab === 'All' ? 'No applications yet' : `No ${tab.toLowerCase()} applications`}
            subtitle="Start applying to jobs and track your progress here."
            action={<Button title="Find Jobs" icon="search" onPress={() => navigation.navigate('Jobs')} />}
          />
        }
      />

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selected && (() => {
              const job = jobOf(selected.jobId);
              return (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Application Status</Text>
                    <Pressable onPress={() => setSelected(null)} hitSlop={10}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </Pressable>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.modalJobCard}>
                      <Text style={{ fontSize: 30 }}>{job?.logo}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalJob}>{job?.title}</Text>
                        <Text style={styles.modalCompany}>{job?.company} • {job?.location}</Text>
                      </View>
                    </View>
                    <Text style={styles.timelineTitle}>Progress Timeline</Text>
                    <View style={styles.timelineCard}>
                      <StatusTimeline status={selected.status} history={selected.history} />
                    </View>
                    {selected.coverLetter ? (
                      <>
                        <Text style={styles.timelineTitle}>Your Cover Letter</Text>
                        <View style={styles.coverCard}>
                          <Text style={styles.coverText}>{selected.coverLetter}</Text>
                        </View>
                      </>
                    ) : null}
                    <Button title="View Job Details" variant="outline" icon="open-outline" onPress={() => { setSelected(null); navigation.navigate('JobDetails', { id: selected.jobId }); }} style={{ marginTop: 18 }} />
                    <View style={{ height: 20 }} />
                  </ScrollView>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  count: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  tabsWrap: { marginTop: 14 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginRight: 8 },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.white },
  tabBadge: { backgroundColor: colors.bg, borderRadius: 9, minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center' },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  list: { padding: 16, paddingTop: 14, paddingBottom: 30 },
  appCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12, ...shadow.soft },
  appTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appLogo: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  appJob: { fontSize: 15, fontWeight: '800', color: colors.text },
  appCompany: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  appMeta: { flexDirection: 'row', gap: 16, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12.5, color: colors.textMuted },
  appFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  viewTimeline: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  modalJobCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  modalJob: { fontSize: 16, fontWeight: '800', color: colors.text },
  modalCompany: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  timelineTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 22, marginBottom: 12 },
  timelineCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.border },
  coverCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  coverText: { fontSize: 14, color: colors.textMuted, lineHeight: 21, fontStyle: 'italic' },
});
