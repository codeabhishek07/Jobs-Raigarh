import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { Job } from '../lib/types';
import { Badge, timeAgo } from './ui';
import { useStore } from '../lib/store';

export default function JobCard({
  job,
  onPress,
  compact,
}: {
  job: Job;
  onPress: () => void;
  compact?: boolean;
}) {
  const { isSaved, toggleSave, user } = useStore();
  const saved = isSaved(job.id);
  const expired = job.deadline < Date.now() || job.status === 'closed';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.top}>
        <View style={styles.logo}>
          <Text style={{ fontSize: 22 }}>{job.logo ?? '🏢'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.company} numberOfLines={1}>
            {job.company}
          </Text>
        </View>
        {user?.role !== 'admin' && (
          <Pressable onPress={() => toggleSave(job.id)} hitSlop={10} style={styles.saveBtn}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? colors.primary : colors.textFaint}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{job.location}</Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="briefcase-outline" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{job.experience}</Text>
        </View>
      </View>

      <View style={styles.salaryRow}>
        <Ionicons name="cash-outline" size={14} color={colors.green} />
        <Text style={styles.salary}>{job.salary}</Text>
      </View>

      <View style={styles.badges}>
        <Badge label={job.jobType} bg={colors.primaryLight} fg={colors.primary} />
        <Badge label={job.category} bg={colors.bg} fg={colors.textMuted} />
        {job.featured && <Badge label="Featured" bg={colors.accentSoft} fg={colors.accent} icon="star" />}
      </View>

      <View style={styles.footer}>
        <Text style={styles.posted}>Posted {timeAgo(job.postedAt)}</Text>
        {expired ? (
          <Text style={styles.expired}>Closed</Text>
        ) : (
          <View style={styles.applyHint}>
            <Text style={styles.applyText}>View & Apply</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadow.soft,
  },
  compact: { width: 280 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  logo: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15.5, fontWeight: '800', color: colors.text, lineHeight: 20 },
  company: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  saveBtn: { padding: 2 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12.5, color: colors.textMuted },
  salaryRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  salary: { fontSize: 13.5, fontWeight: '700', color: colors.green },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  posted: { fontSize: 12, color: colors.textFaint },
  expired: { fontSize: 12.5, fontWeight: '700', color: colors.red },
  applyHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  applyText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
});
