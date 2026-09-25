import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius } from '../lib/theme';
import { useStore } from '../lib/store';
import { Button } from '../components/ui';

const CONTENT: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: 'Privacy Policy',
    body: [
      'Jobs at Raigarh ("we", "us") is committed to protecting the privacy of every job seeker and employer who uses our platform.',
      'Information we collect: name, email, mobile number, location, education, skills, experience, certifications, languages, profile photo and resume documents that you voluntarily provide.',
      'How we use your data: to build your profile, match you with relevant jobs, allow you to apply, and let verified employers/consultancy admins review your application.',
      'Resume privacy: your resume is stored securely and is never made public. It is only shared with the specific employer whose job you apply to.',
      'We never sell your personal data. We use industry-standard measures such as password hashing, role-based access and encrypted storage of secrets.',
      'You may edit or delete your profile, resume and account at any time from the app.',
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    body: [
      'By using Jobs at Raigarh you agree to provide accurate information and to use the platform lawfully.',
      'Job seekers are responsible for the accuracy of their profile and resume. Employers are responsible for the accuracy of the jobs they post.',
      'Jobs at Raigarh acts as a consultancy connecting talent with opportunities and does not guarantee employment.',
      'You must not post false, misleading, offensive or discriminatory content. We may remove content or suspend accounts that violate these terms.',
      'All job postings and applications are subject to review by the consultancy administration.',
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    body: [
      'Jobs at Raigarh is an independent local job consultancy platform.',
      'We are not affiliated with any government body unless explicitly stated in a specific job posting.',
      'While we verify listings to the best of our ability, we do not guarantee the accuracy, completeness or availability of any job.',
      'Never pay money to any employer or agent for a job. Genuine employers do not ask job seekers for fees. Report suspicious postings to the consultancy.',
      'Salary ranges, vacancies and deadlines are indicative and set by employers.',
    ],
  },
  deletion: {
    title: 'Account & Data Deletion',
    body: [
      'You have full control over your data on Jobs at Raigarh.',
      'You can delete your account and all associated data — profile, resume, saved jobs and applications — permanently at any time.',
      'Once deleted, this information cannot be recovered. Employers will no longer see your applications.',
      'To request assistance with data deletion, contact abhixfactor@gmail.com.',
    ],
  },
};

export default function LegalScreen({ navigation, route }: any) {
  const initial = route.params?.tab ?? 'privacy';
  const [tab, setTab] = useState<string>(initial);
  const { deleteAccount } = useStore();
  const data = CONTENT[tab];

  const confirmDelete = () => {
    const run = () => deleteAccount();
    if (Platform.OS === 'web') { if (window.confirm('Permanently delete your account and all data? This cannot be undone.')) run(); }
    else Alert.alert('Delete Account', 'Permanently delete your account and all data? This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: run }]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Legal</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {Object.keys(CONTENT).map((k) => (
            <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabActive]}>
              <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{CONTENT[k].title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.h1}>{data.title}</Text>
        <Text style={styles.updated}>Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>
        {data.body.map((p, i) => (
          <Text key={i} style={styles.para}>{p}</Text>
        ))}
        {tab === 'deletion' && (
          <Button title="Delete My Account & Data" variant="danger" icon="trash-outline" onPress={confirmDelete} style={{ marginTop: 20 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  tabsWrap: { paddingVertical: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginRight: 8 },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.white },
  h1: { fontSize: 22, fontWeight: '900', color: colors.text },
  updated: { fontSize: 12.5, color: colors.textFaint, marginTop: 4, marginBottom: 16 },
  para: { fontSize: 14.5, color: colors.textMuted, lineHeight: 23, marginBottom: 14 },
});
