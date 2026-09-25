import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { useStore } from '../lib/store';
import JobCard from '../components/JobCard';
import { Button, EmptyState } from '../components/ui';

export default function SavedScreen({ navigation }: any) {
  const { saved, jobs, user } = useStore();
  const savedJobs = useMemo(() => {
    const ids = saved.filter((s) => s.userId === user?.id).sort((a, b) => b.savedAt - a.savedAt).map((s) => s.jobId);
    return ids.map((id) => jobs.find((j) => j.id === id)).filter(Boolean) as typeof jobs;
  }, [saved, jobs, user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Jobs</Text>
        <Text style={styles.count}>{savedJobs.length} bookmarked jobs</Text>
      </View>
      <FlatList
        data={savedJobs}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <JobCard job={item} onPress={() => navigation.navigate('JobDetails', { id: item.id })} />}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title="No saved jobs"
            subtitle="Tap the bookmark icon on any job to save it for later."
            action={<Button title="Browse Jobs" icon="search" onPress={() => navigation.navigate('Jobs')} />}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  count: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  list: { padding: 16, paddingTop: 14, paddingBottom: 30 },
});
