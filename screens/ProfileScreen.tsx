import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { useStore } from '../lib/store';
import { Avatar, Button, ProgressBar } from '../components/ui';

export default function ProfileScreen({ navigation }: any) {
  const { user, profile, applications, saved, profileCompletion, logout, resetDemo } = useStore();
  const completion = profileCompletion();
  const myApps = applications.filter((a) => a.userId === user?.id).length;
  const mySaved = saved.filter((s) => s.userId === user?.id).length;

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Log out of your account?')) logout();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          {profile?.photo ? (
            <Image source={{ uri: profile.photo }} style={styles.photo} contentFit="cover" />
          ) : (
            <Avatar name={user?.name ?? 'U'} size={72} />
          )}
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>{profile?.education || 'Job Seeker'} • {profile?.location}</Text>
          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={13} color={colors.textMuted} />
              <Text style={styles.contactText}>{user?.email}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={13} color={colors.textMuted} />
              <Text style={styles.contactText}>{user?.phone}</Text>
            </View>
          </View>
          <Button title="Edit Profile" variant="outline" icon="create-outline" small onPress={() => navigation.navigate('EditProfile')} style={{ marginTop: 16, alignSelf: 'stretch' }} />
        </View>

        {/* Completion */}
        <View style={styles.completionCard}>
          <View style={styles.completionHead}>
            <Text style={styles.completionTitle}>Profile Completion</Text>
            <Text style={[styles.completionPct, { color: completion >= 80 ? colors.green : colors.amber }]}>{completion}% Complete</Text>
          </View>
          <ProgressBar value={completion} />
          {completion < 100 && (
            <Text style={styles.completionHint}>Complete your profile to improve job matches and employer visibility.</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat icon="documents" label="Applications" value={myApps} color={colors.primary} onPress={() => navigation.navigate('Applications')} />
          <Stat icon="bookmark" label="Saved" value={mySaved} color={colors.accent} onPress={() => navigation.navigate('Saved')} />
          <Stat icon="checkmark-done" label="Selected" value={applications.filter((a) => a.userId === user?.id && a.status === 'Selected').length} color={colors.green} onPress={() => navigation.navigate('Applications')} />
        </View>

        {/* Profile sections */}
        <InfoSection title="About Me" icon="person-circle-outline">
          <Text style={styles.body}>{profile?.about || 'No description added yet. Tap Edit Profile to introduce yourself.'}</Text>
        </InfoSection>

        <InfoSection title="Skills" icon="build-outline">
          {profile?.skills?.length ? (
            <View style={styles.chips}>{profile.skills.map((s) => <Chip key={s} label={s} />)}</View>
          ) : <Text style={styles.empty}>No skills added</Text>}
        </InfoSection>

        <InfoSection title="Experience & Education" icon="school-outline">
          <Row label="Experience" value={profile?.experience || '—'} />
          <Row label="Education" value={profile?.education || '—'} />
        </InfoSection>

        <InfoSection title="Certifications" icon="ribbon-outline">
          {profile?.certifications?.length ? (
            profile.certifications.map((c, i) => <Row key={i} label="" value={c} bullet />)
          ) : <Text style={styles.empty}>No certifications added</Text>}
        </InfoSection>

        <InfoSection title="Languages" icon="language-outline">
          {profile?.languages?.length ? (
            <View style={styles.chips}>{profile.languages.map((l) => <Chip key={l} label={l} />)}</View>
          ) : <Text style={styles.empty}>No languages added</Text>}
        </InfoSection>

        <InfoSection title="Resume" icon="document-text-outline">
          {profile?.resume ? (
            <View style={styles.resumeRow}>
              <Ionicons name="document-text" size={26} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resumeName}>{profile.resume.name}</Text>
                <Text style={styles.resumeMeta}>{(profile.resume.size / 1024).toFixed(0)} KB • Private</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('EditProfile', { scrollResume: true })}>
                <Text style={styles.manage}>Manage</Text>
              </Pressable>
            </View>
          ) : (
            <Button title="Upload Resume" variant="outline" icon="cloud-upload-outline" small onPress={() => navigation.navigate('EditProfile', { scrollResume: true })} />
          )}
        </InfoSection>

        {/* Menu */}
        <View style={styles.menu}>
          <MenuItem icon="information-circle-outline" label="About & Contact" onPress={() => navigation.navigate('About')} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => navigation.navigate('Legal', { tab: 'privacy' })} />
          <MenuItem icon="document-text-outline" label="Terms & Conditions" onPress={() => navigation.navigate('Legal', { tab: 'terms' })} />
          <MenuItem icon="refresh-outline" label="Reset Demo Data" onPress={resetDemo} />
          <MenuItem icon="log-out-outline" label="Log Out" danger onPress={confirmLogout} last />
        </View>

        <Text style={styles.footer}>Jobs at Raigarh • Founder: Abhishek Swarnkar</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, label, value, color, onPress }: any) {
  return (
    <Pressable style={styles.stat} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}
function InfoSection({ title, icon, children }: any) {
  return (
    <View style={styles.infoSection}>
      <View style={styles.infoHead}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
function Chip({ label }: { label: string }) {
  return <View style={styles.chip}><Text style={styles.chipText}>{label}</Text></View>;
}
function Row({ label, value, bullet }: any) {
  return (
    <View style={styles.infoRow}>
      {bullet && <View style={styles.bulletDot} />}
      {label ? <Text style={styles.infoLabel}>{label}</Text> : null}
      <Text style={[styles.infoValue, bullet && { flex: 1 }]}>{value}</Text>
    </View>
  );
}
function MenuItem({ icon, label, onPress, danger, last }: any) {
  return (
    <Pressable style={[styles.menuItem, !last && styles.menuBorder]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? colors.red : colors.textMuted} />
      <Text style={[styles.menuLabel, danger && { color: colors.red }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  profileCard: { alignItems: 'center', backgroundColor: colors.card, margin: 16, marginBottom: 12, borderRadius: radius.xl, padding: 22, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  photo: { width: 72, height: 72, borderRadius: 36 },
  name: { fontSize: 20, fontWeight: '900', color: colors.text, marginTop: 12 },
  role: { fontSize: 13.5, color: colors.textMuted, marginTop: 3 },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12, justifyContent: 'center' },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contactText: { fontSize: 12.5, color: colors.textMuted },
  completionCard: { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  completionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completionTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  completionPct: { fontSize: 13.5, fontWeight: '800' },
  completionHint: { fontSize: 12.5, color: colors.textMuted, marginTop: 10, lineHeight: 17 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 12 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.text, marginTop: 8 },
  statLabel: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  infoSection: { backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  body: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  empty: { fontSize: 13.5, color: colors.textFaint, fontStyle: 'italic' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  chipText: { color: colors.primary, fontWeight: '700', fontSize: 12.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  infoLabel: { fontSize: 13.5, color: colors.textMuted, width: 90 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '600' },
  resumeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resumeName: { fontSize: 14, fontWeight: '700', color: colors.text },
  resumeMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  manage: { fontSize: 13.5, fontWeight: '700', color: colors.primary },
  menu: { backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.text },
  footer: { textAlign: 'center', color: colors.textFaint, fontSize: 12, marginTop: 20 },
});
