import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { useStore } from '../lib/store';
import { Button } from '../components/ui';

export default function ApplyScreen({ navigation, route }: any) {
  const { jobs, user, profile, apply, setResume } = useStore();
  const job = jobs.find((j) => j.id === route.params.id)!;
  const [cover, setCover] = useState('');
  const [resumeName, setResumeName] = useState(profile?.resume?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pickResume = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const f = res.assets[0];
      const okExt = /\.(pdf|doc|docx)$/i.test(f.name);
      if (!okExt) {
        const msg = 'Please upload a PDF, DOC or DOCX file only.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid file', msg);
        return;
      }
      await setResume({
        id: 'res_' + Date.now(),
        name: f.name,
        mimeType: f.mimeType ?? 'application/pdf',
        size: f.size ?? 0,
        uri: f.uri,
        uploadedAt: Date.now(),
      });
      setResumeName(f.name);
    } catch {}
  };

  const submit = async () => {
    if (!resumeName) {
      const msg = 'Please select or upload a resume before applying.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Resume required', msg);
      return;
    }
    setLoading(true);
    const r = await apply(job.id, resumeName, cover);
    setLoading(false);
    if (r.ok) setDone(true);
    else {
      Platform.OS === 'web' ? window.alert(r.error) : Alert.alert('Notice', r.error ?? '');
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-done" size={48} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSub}>Your application has been submitted successfully. We'll notify you as the status updates.</Text>
          <View style={styles.successCard}>
            <Text style={styles.scJob}>{job.title}</Text>
            <Text style={styles.scCompany}>{job.company}</Text>
            <View style={styles.scStatus}>
              <View style={styles.scDot} />
              <Text style={styles.scStatusText}>Status: Applied</Text>
            </View>
          </View>
          <Button title="Track My Application" icon="trending-up" onPress={() => navigation.navigate('Applications')} style={{ alignSelf: 'stretch', marginTop: 24 }} />
          <Button title="Browse More Jobs" variant="outline" onPress={() => navigation.navigate('Jobs')} style={{ alignSelf: 'stretch', marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Apply for Job</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          <View style={styles.jobCard}>
            <Text style={{ fontSize: 30 }}>{job.logo}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobCompany}>{job.company} • {job.location}</Text>
            </View>
          </View>

          <Text style={styles.step}>1. Your Details</Text>
          <View style={styles.card}>
            <DetailRow icon="person-outline" label="Name" value={user?.name ?? ''} />
            <DetailRow icon="mail-outline" label="Email" value={user?.email ?? ''} />
            <DetailRow icon="call-outline" label="Mobile" value={user?.phone ?? ''} />
            <DetailRow icon="location-outline" label="Location" value={profile?.location ?? '—'} />
            <DetailRow icon="ribbon-outline" label="Experience" value={profile?.experience ?? '—'} last />
          </View>

          <Text style={styles.step}>2. Resume</Text>
          <Pressable style={styles.resumeBox} onPress={pickResume}>
            <Ionicons name={resumeName ? 'document-text' : 'cloud-upload-outline'} size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeName}>{resumeName || 'Upload Resume (PDF, DOC, DOCX)'}</Text>
              <Text style={styles.resumeHint}>{resumeName ? 'Tap to replace' : 'Tap to browse files'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>

          <Text style={styles.step}>3. Cover Letter <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            value={cover}
            onChangeText={setCover}
            placeholder="Write a short message to the employer…"
            placeholderTextColor={colors.textFaint}
            multiline
            style={styles.textArea}
          />

          <View style={styles.confirmNote}>
            <Ionicons name="shield-checkmark" size={16} color={colors.green} />
            <Text style={styles.confirmText}>Your resume is stored securely and only shared with this employer.</Text>
          </View>

          <Button title="Confirm & Submit Application" icon="send" loading={loading} onPress={submit} style={{ marginTop: 18 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, last }: any) {
  return (
    <View style={[styles.detailRow, !last && styles.detailBorder]}>
      <Ionicons name={icon} size={17} color={colors.textMuted} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  jobCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  jobTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  jobCompany: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  step: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 22, marginBottom: 10 },
  optional: { fontSize: 13, fontWeight: '500', color: colors.textFaint },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 13.5, color: colors.textMuted, width: 78 },
  detailValue: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600', textAlign: 'right' },
  resumeBox: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, padding: 16, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.primarySoft, borderStyle: 'dashed' },
  resumeName: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  resumeHint: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  textArea: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, minHeight: 110, fontSize: 14.5, color: colors.text, textAlignVertical: 'top' },
  confirmNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.greenSoft, padding: 12, borderRadius: radius.md, marginTop: 16 },
  confirmText: { flex: 1, fontSize: 12.5, color: colors.green, fontWeight: '600', lineHeight: 17 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  successTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 22 },
  successSub: { fontSize: 14.5, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  successCard: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginTop: 24, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  scJob: { fontSize: 16, fontWeight: '800', color: colors.text },
  scCompany: { fontSize: 13.5, color: colors.textMuted, marginTop: 3 },
  scStatus: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  scDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  scStatusText: { fontSize: 13.5, fontWeight: '700', color: colors.primary },
});
