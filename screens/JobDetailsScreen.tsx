import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { useStore } from '../lib/store';
import { Badge, Button, fmtDate, timeAgo } from '../components/ui';

export default function JobDetailsScreen({ navigation, route }: any) {
  const { jobs, isSaved, toggleSave, hasApplied } = useStore();
  const job = jobs.find((j) => j.id === route.params.id);

  if (!job) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 20 }}>Job not found.</Text>
      </SafeAreaView>
    );
  }

  const saved = isSaved(job.id);
  const applied = hasApplied(job.id);
  const expired = job.deadline < Date.now() || job.status !== 'published';
  const daysLeft = Math.ceil((job.deadline - Date.now()) / 86400000);

  const onApply = () => {
    if (applied) {
      const msg = 'You have already applied to this job. Track it in My Applications.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Already Applied', msg);
      return;
    }
    if (expired) return;
    navigation.navigate('Apply', { id: job.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Job Details</Text>
        <Pressable onPress={() => toggleSave(job.id)} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? colors.primary : colors.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={{ fontSize: 34 }}>{job.logo}</Text>
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
          <View style={styles.heroBadges}>
            <Badge label={job.jobType} bg={colors.primaryLight} fg={colors.primary} />
            <Badge label={job.category} bg={colors.bg} fg={colors.textMuted} />
            {job.featured && <Badge label="Featured" bg={colors.accentSoft} fg={colors.accent} icon="star" />}
          </View>
        </View>

        {/* Key facts grid */}
        <View style={styles.factGrid}>
          <Fact icon="location-outline" label="Location" value={job.location} />
          <Fact icon="cash-outline" label="Salary" value={job.salary} color={colors.green} />
          <Fact icon="briefcase-outline" label="Experience" value={job.experience} />
          <Fact icon="school-outline" label="Education" value={job.education} />
          <Fact icon="people-outline" label="Vacancies" value={String(job.vacancies)} />
          <Fact icon="time-outline" label="Job Type" value={job.jobType} />
        </View>

        {/* Deadline banner */}
        <View style={[styles.deadline, expired ? styles.deadlineExpired : styles.deadlineOk]}>
          <Ionicons name={expired ? 'alert-circle' : 'calendar-outline'} size={18} color={expired ? colors.red : colors.amber} />
          <Text style={[styles.deadlineText, { color: expired ? colors.red : colors.amber }]}>
            {expired ? 'Applications closed' : `Apply by ${fmtDate(job.deadline)} • ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
          </Text>
        </View>

        <Section title="Job Description">
          <Text style={styles.body}>{job.description}</Text>
        </Section>

        {job.responsibilities.length > 0 && (
          <Section title="Responsibilities">
            {job.responsibilities.map((r, i) => <Bullet key={i} text={r} />)}
          </Section>
        )}

        {job.skills.length > 0 && (
          <Section title="Required Skills">
            <View style={styles.skills}>
              {job.skills.map((s) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {job.qualification ? (
          <Section title="Qualification">
            <Text style={styles.body}>{job.qualification}</Text>
          </Section>
        ) : null}

        {job.benefits.length > 0 && (
          <Section title="Benefits">
            {job.benefits.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={17} color={colors.green} />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </Section>
        )}

        <Section title="Contact Information">
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={17} color={colors.primary} />
            <Text style={styles.contactText}>{job.contact}</Text>
          </View>
          <Text style={styles.posted}>Posted {timeAgo(job.postedAt)}</Text>
        </Section>
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <Button
          title={saved ? 'Saved' : 'Save Job'}
          variant="outline"
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          onPress={() => toggleSave(job.id)}
          style={{ flex: 1 }}
        />
        <Button
          title={applied ? 'Applied ✓' : expired ? 'Closed' : 'Apply Now'}
          icon={applied ? 'checkmark-circle' : 'send'}
          onPress={onApply}
          disabled={expired && !applied}
          variant={applied ? 'success' : 'primary'}
          style={{ flex: 2 }}
        />
      </View>
    </SafeAreaView>
  );
}

function Fact({ icon, label, value, color }: any) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={18} color={color ?? colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={[styles.factValue, color && { color }]} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}
function Section({ title, children }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.dot} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 18 },
  logo: { width: 78, height: 78, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  title: { fontSize: 21, fontWeight: '900', color: colors.text, textAlign: 'center', marginTop: 14, letterSpacing: -0.4 },
  company: { fontSize: 15, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, justifyContent: 'center' },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  fact: {
    width: '47%', flexGrow: 1, flexDirection: 'row', gap: 10, backgroundColor: colors.card,
    borderRadius: radius.md, padding: 13, borderWidth: 1, borderColor: colors.border,
  },
  factLabel: { fontSize: 11.5, color: colors.textFaint, fontWeight: '600' },
  factValue: { fontSize: 13.5, color: colors.text, fontWeight: '700', marginTop: 2 },
  deadline: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 14, padding: 13, borderRadius: radius.md },
  deadlineOk: { backgroundColor: colors.amberSoft },
  deadlineExpired: { backgroundColor: colors.redSoft },
  deadlineText: { fontSize: 13.5, fontWeight: '700', flex: 1 },
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 10 },
  body: { fontSize: 14.5, color: colors.textMuted, lineHeight: 22 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: colors.primaryLight, paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.pill },
  skillText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 9 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8 },
  benefitText: { flex: 1, fontSize: 14.5, color: colors.textMuted, lineHeight: 21 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  contactText: { fontSize: 14.5, color: colors.primary, fontWeight: '600' },
  posted: { fontSize: 12.5, color: colors.textFaint, marginTop: 10 },
  footer: {
    flexDirection: 'row', gap: 10, padding: 14, paddingBottom: 20, backgroundColor: colors.card,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
});
