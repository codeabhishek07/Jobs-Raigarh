import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { useStore } from '../lib/store';
import JobCard from '../components/JobCard';
import { Button, EmptyState, Pill } from '../components/ui';
import { JobType } from '../lib/types';

const JOB_TYPES: JobType[] = ['Full Time', 'Part Time', 'Contract', 'Apprenticeship', 'Internship', 'Work From Home'];
const EXPERIENCE = ['Fresher', '0-2 years', '1-3 years', '2-5 years', '5+ years'];
const DATE_POSTED = ['Any time', 'Last 24 hours', 'Last 7 days', 'Last 30 days'];
const PAGE = 6;

export default function JobsScreen({ navigation, route }: any) {
  const { jobs, categories, locations } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [jobType, setJobType] = useState<JobType | null>(null);
  const [exp, setExp] = useState<string | null>(null);
  const [datePosted, setDatePosted] = useState('Any time');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const p = route.params;
    if (!p) return;
    if (p.category) setCategory(p.category);
    if (p.location) setLocation(p.location);
    if (p.showFilters) setShowFilters(true);
  }, [route.params]);

  const published = useMemo(
    () => jobs.filter((j) => j.status === 'published' && j.deadline > Date.now()),
    [jobs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const dpMs =
      datePosted === 'Last 24 hours' ? 86400000 :
      datePosted === 'Last 7 days' ? 7 * 86400000 :
      datePosted === 'Last 30 days' ? 30 * 86400000 : Infinity;
    return published.filter((j) => {
      if (q) {
        const hay = (j.title + ' ' + j.company + ' ' + j.skills.join(' ') + ' ' + j.location).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (category && j.category !== category) return false;
      if (location && j.location !== location) return false;
      if (jobType && j.jobType !== jobType) return false;
      if (exp && !j.experience.toLowerCase().includes(exp.toLowerCase().split(' ')[0])) {
        if (exp === 'Fresher' && !/fresher|0/.test(j.experience.toLowerCase())) return false;
        if (exp !== 'Fresher') return false;
      }
      if (now - j.postedAt > dpMs) return false;
      return true;
    }).sort((a, b) => b.postedAt - a.postedAt);
  }, [published, query, category, location, jobType, exp, datePosted]);

  const visible = filtered.slice(0, page * PAGE);
  const activeFilters = [category, location, jobType, exp, datePosted !== 'Any time' ? datePosted : null].filter(Boolean).length;

  const clearAll = () => {
    setCategory(null); setLocation(null); setJobType(null); setExp(null); setDatePosted('Any time');
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Find Jobs</Text>
        <Text style={styles.count}>{filtered.length} opportunities available</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={19} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={(t) => { setQuery(t); setPage(1); }}
              placeholder="Title, company, skill, location"
              placeholderTextColor={colors.textFaint}
              style={styles.searchInput}
              returnKeyType="search"
              autoFocus={route.params?.focusSearch}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textFaint} />
              </Pressable>
            ) : null}
          </View>
          <Pressable style={[styles.filterBtn, activeFilters > 0 && styles.filterBtnActive]} onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={20} color={activeFilters > 0 ? colors.white : colors.primary} />
            {activeFilters > 0 && (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{activeFilters}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* quick category scroller */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 16 }}>
          <Pill label="All" active={!category} onPress={() => setCategory(null)} />
          {categories.map((c) => (
            <Pill key={c.name} label={c.name} icon={c.icon as any} active={category === c.name} onPress={() => { setCategory(category === c.name ? null : c.name); setPage(1); }} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => navigation.navigate('JobDetails', { id: item.id })} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No jobs found"
            subtitle="Try adjusting your search or filters to see more opportunities."
            action={activeFilters > 0 ? <Button title="Clear Filters" variant="outline" onPress={clearAll} /> : undefined}
          />
        }
        ListFooterComponent={
          visible.length < filtered.length ? (
            <Button title="Load More Jobs" variant="outline" onPress={() => setPage((p) => p + 1)} style={{ marginTop: 4 }} />
          ) : filtered.length > 0 ? (
            <Text style={styles.end}>You've reached the end • {filtered.length} jobs</Text>
          ) : null
        }
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        {...{ categories, locations, category, setCategory, location, setLocation, jobType, setJobType, exp, setExp, datePosted, setDatePosted, clearAll, resultCount: filtered.length, setPage }}
      />
    </SafeAreaView>
  );
}

function FilterModal({ visible, onClose, categories, locations, category, setCategory, location, setLocation, jobType, setJobType, exp, setExp, datePosted, setDatePosted, clearAll, resultCount, setPage }: any) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <FilterGroup title="Category">
              <Pill label="All" active={!category} onPress={() => setCategory(null)} />
              {categories.map((c: any) => (
                <Pill key={c.name} label={c.name} active={category === c.name} onPress={() => setCategory(category === c.name ? null : c.name)} />
              ))}
            </FilterGroup>
            <FilterGroup title="Location">
              <Pill label="All" active={!location} onPress={() => setLocation(null)} />
              {locations.map((l: string) => (
                <Pill key={l} label={l} active={location === l} onPress={() => setLocation(location === l ? null : l)} />
              ))}
            </FilterGroup>
            <FilterGroup title="Job Type">
              {JOB_TYPES.map((t) => (
                <Pill key={t} label={t} active={jobType === t} onPress={() => setJobType(jobType === t ? null : t)} />
              ))}
            </FilterGroup>
            <FilterGroup title="Experience">
              {EXPERIENCE.map((e) => (
                <Pill key={e} label={e} active={exp === e} onPress={() => setExp(exp === e ? null : e)} />
              ))}
            </FilterGroup>
            <FilterGroup title="Date Posted">
              {DATE_POSTED.map((d) => (
                <Pill key={d} label={d} active={datePosted === d} onPress={() => setDatePosted(d)} />
              ))}
            </FilterGroup>
            <View style={{ height: 20 }} />
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button title="Clear All" variant="ghost" onPress={clearAll} style={{ flex: 1 }} />
            <Button title={`Show ${resultCount} Jobs`} onPress={() => { setPage(1); onClose(); }} style={{ flex: 2 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterGroup({ title, children }: any) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupPills}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  count: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card,
    paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, ...shadow.soft,
  },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.text },
  filterBtn: {
    width: 50, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
  },
  filterBtnActive: { backgroundColor: colors.primary },
  filterCount: {
    position: 'absolute', top: -6, right: -6, backgroundColor: colors.accent, minWidth: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  filterCountText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  list: { padding: 16, paddingTop: 8, paddingBottom: 30 },
  end: { textAlign: 'center', color: colors.textFaint, fontSize: 13, paddingVertical: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  groupTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 10 },
  groupPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalFooter: { flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
});
