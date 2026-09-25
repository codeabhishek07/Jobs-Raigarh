import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { useStore } from '../lib/store';
import JobCard from '../components/JobCard';
import { Avatar, SectionHeader } from '../components/ui';

export default function HomeScreen({ navigation }: any) {
  const { jobs, user, settings, categories, locations, unreadCount } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  const published = useMemo(
    () => jobs.filter((j) => j.status === 'published' && j.deadline > Date.now()),
    [jobs]
  );
  const featured = published.filter((j) => j.featured);
  const latest = [...published].sort((a, b) => b.postedAt - a.postedAt);
  const recent = latest.slice(0, 4);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  const goJobs = (params?: any) => navigation.navigate('Jobs', params);

  const countByCategory = (name: string) =>
    published.filter((j) => j.category === name).length;
  const countByLocation = (name: string) =>
    published.filter((j) => j.location === name).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hi, {user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
            <Text style={styles.brand}>{settings.brand}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.bell}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Profile')} style={{ marginLeft: 10 }}>
            <Avatar name={user?.name ?? 'U'} photo={undefined} size={40} />
          </Pressable>
        </View>

        <Text style={styles.tagline}>Find Your Next Opportunity</Text>

        {/* Search bar */}
        <Pressable style={styles.searchBar} onPress={() => goJobs({ focusSearch: true })}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search jobs, company, skills…</Text>
        </Pressable>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickAction icon="briefcase" label="Find Jobs" color={colors.primary} onPress={() => goJobs()} />
          <QuickAction icon="cloud-upload" label="Upload Resume" color={colors.accent} onPress={() => navigation.navigate('EditProfile', { scrollResume: true })} />
          <QuickAction icon="trending-up" label="My Status" color={colors.green} onPress={() => navigation.navigate('Applications')} />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader title="Popular Categories" actionLabel="See all" onAction={() => goJobs({ showFilters: true })} />
          <View style={styles.catGrid}>
            {categories.slice(0, 8).map((c) => (
              <Pressable key={c.name} style={styles.catItem} onPress={() => goJobs({ category: c.name })}>
                <View style={[styles.catIcon, { backgroundColor: c.color + '18' }]}>
                  <Ionicons name={c.icon as any} size={20} color={c.color} />
                </View>
                <Text style={styles.catName} numberOfLines={2}>{c.name}</Text>
                <Text style={styles.catCount}>{countByCategory(c.name)} jobs</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Featured */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Featured Jobs" actionLabel="View all" onAction={() => goJobs()} />
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(i) => i.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              renderItem={({ item }) => (
                <View style={{ marginRight: 12 }}>
                  <JobCard job={item} compact onPress={() => navigation.navigate('JobDetails', { id: item.id })} />
                </View>
              )}
            />
          </View>
        )}

        {/* Jobs by location */}
        <View style={styles.section}>
          <SectionHeader title="Jobs by Location" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {locations
              .filter((l) => countByLocation(l) > 0)
              .map((l) => (
                <Pressable key={l} style={styles.locChip} onPress={() => goJobs({ location: l })}>
                  <Ionicons name="location" size={15} color={colors.primary} />
                  <Text style={styles.locName}>{l}</Text>
                  <View style={styles.locCount}>
                    <Text style={styles.locCountText}>{countByLocation(l)}</Text>
                  </View>
                </Pressable>
              ))}
          </ScrollView>
        </View>

        {/* Recently added */}
        <View style={styles.section}>
          <SectionHeader title="Recently Added Jobs" actionLabel="View all" onAction={() => goJobs()} />
          {recent.map((j) => (
            <JobCard key={j.id} job={j} onPress={() => navigation.navigate('JobDetails', { id: j.id })} />
          ))}
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <SectionHeader title="How It Works" />
          <View style={styles.howCard}>
            {[
              { i: 'person-add', t: 'Create your profile', d: 'Add skills, education & resume' },
              { i: 'search', t: 'Search & apply', d: 'Find jobs and apply in one tap' },
              { i: 'trending-up', t: 'Track your status', d: 'Follow every application live' },
              { i: 'checkmark-done-circle', t: 'Get hired', d: 'Interview & land the role' },
            ].map((s, i) => (
              <View key={s.t} style={styles.howRow}>
                <View style={styles.howNum}>
                  <Ionicons name={s.i as any} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.howTitle}>{s.t}</Text>
                  <Text style={styles.howDesc}>{s.d}</Text>
                </View>
                <Text style={styles.howStep}>{i + 1}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.aboutLink} onPress={() => navigation.navigate('About')}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.aboutText}>About Jobs at Raigarh & Contact</Text>
        </Pressable>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, color, onPress }: any) {
  return (
    <Pressable style={styles.quick} onPress={onPress}>
      <View style={[styles.quickIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  hello: { fontSize: 13, color: colors.textMuted },
  brand: { fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.4 },
  tagline: { fontSize: 13, color: colors.primary, fontWeight: '600', paddingHorizontal: 16, marginTop: 2 },
  bell: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  badgeDot: {
    position: 'absolute', top: -2, right: -2, backgroundColor: colors.red, minWidth: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 2, borderColor: colors.bg,
  },
  badgeDotText: { color: colors.white, fontSize: 9.5, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card,
    marginHorizontal: 16, marginTop: 14, paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, ...shadow.soft,
  },
  searchPlaceholder: { color: colors.textFaint, fontSize: 15 },
  quickRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 14 },
  quick: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: 16,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, ...shadow.soft,
  },
  quickIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  section: { paddingHorizontal: 16, marginTop: 26 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catItem: {
    width: '22%', minWidth: 78, alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 4, borderWidth: 1, borderColor: colors.border,
  },
  catIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 10.5, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 7, lineHeight: 13 },
  catCount: { fontSize: 9.5, color: colors.textFaint, marginTop: 2 },
  locChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1,
    borderColor: colors.border, marginRight: 10,
  },
  locName: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  locCount: { backgroundColor: colors.primaryLight, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  locCountText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  howCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1,
    borderColor: colors.border, gap: 4, ...shadow.soft,
  },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  howNum: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  howTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  howDesc: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
  howStep: { fontSize: 22, fontWeight: '900', color: colors.border },
  aboutLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 26 },
  aboutText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
