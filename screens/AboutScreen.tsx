import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { useStore } from '../lib/store';

export default function AboutScreen({ navigation }: any) {
  const { settings, jobs, users, applications } = useStore();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>About & Contact</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={styles.hero}>
          <View style={styles.logoBox}><Ionicons name="briefcase" size={32} color={colors.white} /></View>
          <Text style={styles.brand}>{settings.brand}</Text>
          <Text style={styles.tagline}>{settings.tagline}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.about}>{settings.about}</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat value={jobs.filter((j) => j.status === 'published').length} label="Active Jobs" />
          <Stat value={users.filter((u) => u.role === 'seeker').length} label="Job Seekers" />
          <Stat value={applications.length} label="Applications" />
        </View>

        <View style={styles.founderCard}>
          <View style={styles.founderAvatar}><Text style={styles.founderInitials}>AS</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.founderLabel}>Founder & Owner</Text>
            <Text style={styles.founderName}>{settings.founder}</Text>
          </View>
          <Ionicons name="ribbon" size={22} color={colors.accent} />
        </View>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.card}>
          <ContactRow icon="mail" label="Email" value={settings.email} />
          <ContactRow icon="call" label="Phone" value={settings.phone} />
          <ContactRow icon="location" label="Address" value={settings.address} last />
        </View>

        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.menu}>
          <MenuItem label="Privacy Policy" onPress={() => navigation.navigate('Legal', { tab: 'privacy' })} />
          <MenuItem label="Terms & Conditions" onPress={() => navigation.navigate('Legal', { tab: 'terms' })} />
          <MenuItem label="Disclaimer" onPress={() => navigation.navigate('Legal', { tab: 'disclaimer' })} />
          <MenuItem label="Account & Data Deletion" onPress={() => navigation.navigate('Legal', { tab: 'deletion' })} last />
        </View>

        <Text style={styles.footer}>© {new Date().getFullYear()} Jobs at Raigarh • Raigarh, Chhattisgarh</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: any) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function ContactRow({ icon, label, value, last }: any) {
  return (
    <View style={[styles.contactRow, !last && styles.rowBorder]}>
      <View style={styles.contactIcon}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
    </View>
  );
}
function MenuItem({ label, onPress, last }: any) {
  return (
    <Pressable style={[styles.menuItem, !last && styles.rowBorder]} onPress={onPress}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  hero: { alignItems: 'center', paddingVertical: 20 },
  logoBox: { width: 68, height: 68, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  brand: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 12 },
  tagline: { fontSize: 13.5, color: colors.primary, fontWeight: '600', marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  about: { fontSize: 14.5, color: colors.textMuted, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 11.5, color: colors.textMuted, marginTop: 3, textAlign: 'center' },
  founderCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  founderAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  founderInitials: { fontSize: 18, fontWeight: '900', color: colors.primary },
  founderLabel: { fontSize: 12, color: colors.textMuted },
  founderName: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 22, marginBottom: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 12, color: colors.textMuted },
  contactValue: { fontSize: 14.5, fontWeight: '600', color: colors.text, marginTop: 2 },
  menu: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
  menuLabel: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  footer: { textAlign: 'center', color: colors.textFaint, fontSize: 12, marginTop: 24 },
});
