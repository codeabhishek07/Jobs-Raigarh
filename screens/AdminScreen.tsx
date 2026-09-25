import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  TextInput,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow, statusColor } from '../lib/theme';
import { useStore } from '../lib/store';
import { Avatar, Badge, Button, EmptyState, fmtDate, timeAgo } from '../components/ui';
import { BarChart, HBarChart, DonutLegend } from '../components/charts';
import JobForm from '../components/JobForm';
import StatusTimeline from '../components/StatusTimeline';
import { downloadCSV } from '../lib/export';
import { Application, AppStatus, Job } from '../lib/types';

type Section = 'dashboard' | 'jobs' | 'candidates' | 'applications' | 'categories' | 'locations' | 'notifications' | 'reports' | 'settings';

const MENU: { key: Section; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'jobs', label: 'Jobs', icon: 'briefcase' },
  { key: 'candidates', label: 'Candidates', icon: 'people' },
  { key: 'applications', label: 'Applications', icon: 'documents' },
  { key: 'categories', label: 'Categories', icon: 'pricetags' },
  { key: 'locations', label: 'Locations', icon: 'location' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

export default function AdminScreen() {
  const store = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [section, setSection] = useState<Section>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const go = (s: Section) => { setSection(s); setDrawerOpen(false); };

  return (
    <SafeAreaView style={styles.safe} edges={['top', wide ? 'left' : 'top']}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {wide && <Sidebar section={section} go={go} store={store} />}
        <View style={{ flex: 1 }}>
          {!wide && (
            <View style={styles.mobileBar}>
              <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8}><Ionicons name="menu" size={26} color={colors.text} /></Pressable>
              <Text style={styles.mobileTitle}>{MENU.find((m) => m.key === section)?.label}</Text>
              <View style={styles.adminBadge}><Ionicons name="shield-checkmark" size={14} color={colors.primary} /><Text style={styles.adminBadgeText}>Admin</Text></View>
            </View>
          )}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {section === 'dashboard' && <Dashboard store={store} go={go} wide={wide} />}
            {section === 'jobs' && <JobsAdmin store={store} />}
            {section === 'candidates' && <Candidates store={store} />}
            {section === 'applications' && <Applications store={store} />}
            {section === 'categories' && <Categories store={store} />}
            {section === 'locations' && <Locations store={store} />}
            {section === 'notifications' && <NotificationsAdmin store={store} />}
            {section === 'reports' && <Reports store={store} />}
            {section === 'settings' && <SettingsAdmin store={store} />}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>

      {!wide && (
        <Modal visible={drawerOpen} animationType="fade" transparent onRequestClose={() => setDrawerOpen(false)}>
          <Pressable style={styles.drawerOverlay} onPress={() => setDrawerOpen(false)}>
            <Pressable style={styles.drawer} onPress={(e) => e.stopPropagation?.()}>
              <Sidebar section={section} go={go} store={store} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function Sidebar({ section, go, store }: any) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarBrand}>
        <View style={styles.sidebarLogo}><Ionicons name="briefcase" size={22} color={colors.white} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sidebarTitle}>Jobs at Raigarh</Text>
          <Text style={styles.sidebarSub}>Admin Panel</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {MENU.map((m) => {
          const active = section === m.key;
          const count = m.key === 'jobs' ? store.jobs.length : m.key === 'candidates' ? store.users.filter((u: any) => u.role === 'seeker').length : m.key === 'applications' ? store.applications.length : undefined;
          return (
            <Pressable key={m.key} onPress={() => go(m.key)} style={[styles.menuItem, active && styles.menuItemActive]}>
              <Ionicons name={(active ? m.icon : m.icon + '-outline') as any} size={20} color={active ? colors.primary : colors.textMuted} />
              <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{m.label}</Text>
              {count !== undefined && <View style={styles.menuCount}><Text style={styles.menuCountText}>{count}</Text></View>}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.sidebarFooter}>
        <Avatar name={store.user?.name ?? 'A'} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={styles.footerName} numberOfLines={1}>{store.user?.name}</Text>
          <Text style={styles.footerRole}>Owner</Text>
        </View>
        <Pressable onPress={store.logout} hitSlop={8}><Ionicons name="log-out-outline" size={22} color={colors.red} /></Pressable>
      </View>
    </View>
  );
}

// ---------------- DASHBOARD ----------------
function Dashboard({ store, go, wide }: any) {
  const { jobs, applications, users } = store;
  const now = Date.now();
  const activeJobs = jobs.filter((j: Job) => j.status === 'published' && j.deadline > now).length;
  const seekers = users.filter((u: any) => u.role === 'seeker');
  const byStatus = (s: AppStatus) => applications.filter((a: Application) => a.status === s).length;

  const cards = [
    { label: 'Total Jobs', value: jobs.length, icon: 'briefcase', color: colors.primary },
    { label: 'Active Jobs', value: activeJobs, icon: 'flash', color: colors.green },
    { label: 'Candidates', value: seekers.length, icon: 'people', color: colors.purple },
    { label: 'Applications', value: applications.length, icon: 'documents', color: colors.accent },
    { label: 'Pending', value: byStatus('Applied') + byStatus('Under Review'), icon: 'hourglass', color: colors.amber },
    { label: 'Shortlisted', value: byStatus('Shortlisted'), icon: 'star', color: colors.cyan },
    { label: 'Interviews', value: byStatus('Interview'), icon: 'calendar', color: colors.primaryDark },
    { label: 'Selected', value: byStatus('Selected'), icon: 'checkmark-done', color: colors.green },
  ];

  // applications over last 7 days
  const overTime = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * 86400000);
    const label = day.toLocaleDateString('en-IN', { weekday: 'short' });
    const value = applications.filter((a: Application) => {
      const d = new Date(a.appliedAt);
      return d.toDateString() === day.toDateString();
    }).length;
    return { label, value };
  });

  const catData = store.categories.map((c: any) => ({ label: c.name, value: jobs.filter((j: Job) => j.category === c.name).length, color: c.color })).filter((d: any) => d.value > 0).sort((a: any, b: any) => b.value - a.value).slice(0, 6);
  const locData = store.locations.map((l: string) => ({ label: l, value: jobs.filter((j: Job) => j.location === l).length })).filter((d: any) => d.value > 0).sort((a: any, b: any) => b.value - a.value).slice(0, 6);
  const statusData = (['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'] as AppStatus[]).map((s) => ({ label: s, value: byStatus(s), color: statusColor[s].fg }));

  return (
    <View>
      <Header title={`Welcome, ${store.user?.name?.split(' ')[0]}`} subtitle="Here's what's happening today" wide={wide} />
      <View style={styles.cardGrid}>
        {cards.map((c) => (
          <View key={c.label} style={[styles.statCard, wide ? { width: '23%' } : { width: '47%' }]}>
            <View style={[styles.statIcon, { backgroundColor: c.color + '18' }]}><Ionicons name={c.icon as any} size={20} color={c.color} /></View>
            <Text style={styles.statValue}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.chartsWrap, wide && { flexDirection: 'row', flexWrap: 'wrap' }]}>
        <ChartCard title="Applications Over Time (7 days)" wide={wide}>
          <BarChart data={overTime} />
        </ChartCard>
        <ChartCard title="Application Status" wide={wide}>
          <DonutLegend data={statusData.filter((d) => d.value > 0)} />
        </ChartCard>
        <ChartCard title="Jobs by Category" wide={wide}>
          {catData.length ? <HBarChart data={catData} /> : <Text style={styles.muted}>No data</Text>}
        </ChartCard>
        <ChartCard title="Jobs by Location" wide={wide}>
          {locData.length ? <HBarChart data={locData.map((d: any) => ({ ...d, color: colors.cyan }))} /> : <Text style={styles.muted}>No data</Text>}
        </ChartCard>
      </View>

      <Text style={styles.sectionHeading}>Recent Applications</Text>
      {applications.slice(0, 5).map((a: Application) => {
        const job = jobs.find((j: Job) => j.id === a.jobId);
        const seeker = users.find((u: any) => u.id === a.userId);
        return (
          <View key={a.id} style={styles.rowCard}>
            <Avatar name={seeker?.name ?? 'U'} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{seeker?.name}</Text>
              <Text style={styles.rowSub}>{job?.title} • {timeAgo(a.appliedAt)}</Text>
            </View>
            <Badge label={a.status} bg={statusColor[a.status].bg} fg={statusColor[a.status].fg} />
          </View>
        );
      })}
      <Button title="View All Applications" variant="outline" icon="arrow-forward" onPress={() => go('applications')} style={{ marginTop: 12 }} />
    </View>
  );
}

// ---------------- JOBS ADMIN ----------------
function JobsAdmin({ store }: any) {
  const { jobs, deleteJob, setJobStatus, duplicateJob } = store;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'published' | 'draft' | 'closed'>('all');

  const filtered = jobs.filter((j: Job) => (tab === 'all' || j.status === tab) && (j.title + j.company).toLowerCase().includes(query.toLowerCase()));
  const confirmDelete = (j: Job) => {
    const run = () => deleteJob(j.id);
    if (Platform.OS === 'web') { if (window.confirm(`Delete "${j.title}"?`)) run(); }
    else Alert.alert('Delete Job', `Delete "${j.title}"?`, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: run }]);
  };

  return (
    <View>
      <Header title="Job Management" subtitle={`${jobs.length} total postings`} action={<Button title="New Job" icon="add" small onPress={() => { setEditing(null); setShowForm(true); }} />} />
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search jobs…" placeholderTextColor={colors.textFaint} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {(['all', 'published', 'draft', 'closed'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.pill, tab === t && styles.pillActive]}>
            <Text style={[styles.pillText, tab === t && { color: colors.white }]}>{t[0].toUpperCase() + t.slice(1)} ({jobs.filter((j: Job) => t === 'all' || j.status === t).length})</Text>
          </Pressable>
        ))}
      </ScrollView>
      {filtered.length === 0 ? <EmptyState icon="briefcase-outline" title="No jobs" subtitle="Create your first job posting." /> : filtered.map((j: Job) => {
        const apps = store.applications.filter((a: Application) => a.jobId === j.id).length;
        const stColor = j.status === 'published' ? colors.green : j.status === 'draft' ? colors.amber : colors.red;
        const stBg = j.status === 'published' ? colors.greenSoft : j.status === 'draft' ? colors.amberSoft : colors.redSoft;
        return (
          <View key={j.id} style={styles.jobRow}>
            <View style={styles.jobRowTop}>
              <Text style={{ fontSize: 26 }}>{j.logo}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{j.title}</Text>
                <Text style={styles.rowSub}>{j.company} • {j.location}</Text>
              </View>
              <Badge label={j.status} bg={stBg} fg={stColor} />
            </View>
            <View style={styles.jobRowMeta}>
              <Text style={styles.metaChip}>{j.category}</Text>
              <Text style={styles.metaChip}>{apps} applicants</Text>
              <Text style={styles.metaChip}>Ends {fmtDate(j.deadline)}</Text>
            </View>
            <View style={styles.actionRow}>
              <IconAction icon="create-outline" label="Edit" onPress={() => { setEditing(j); setShowForm(true); }} />
              {j.status !== 'published' ? <IconAction icon="cloud-upload-outline" label="Publish" color={colors.green} onPress={() => setJobStatus(j.id, 'published')} /> : <IconAction icon="lock-closed-outline" label="Close" color={colors.amber} onPress={() => setJobStatus(j.id, 'closed')} />}
              <IconAction icon="copy-outline" label="Copy" onPress={() => duplicateJob(j.id)} />
              <IconAction icon="trash-outline" label="Delete" color={colors.red} onPress={() => confirmDelete(j)} />
            </View>
          </View>
        );
      })}
      <JobForm visible={showForm} editing={editing} onClose={() => setShowForm(false)} />
    </View>
  );
}

// ---------------- CANDIDATES ----------------
function Candidates({ store }: any) {
  const { users, getProfileFor, applications } = store;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const seekers = users.filter((u: any) => u.role === 'seeker').filter((u: any) => (u.name + u.email + u.phone).toLowerCase().includes(query.toLowerCase()));

  const exportCandidates = () => {
    const rows = seekers.map((u: any) => {
      const p = getProfileFor(u.id);
      return { Name: u.name, Email: u.email, Phone: u.phone, Location: p?.location ?? '', Education: p?.education ?? '', Experience: p?.experience ?? '', Skills: p?.skills?.join('; ') ?? '', Applications: applications.filter((a: Application) => a.userId === u.id).length };
    });
    const ok = downloadCSV('candidates.csv', rows);
    if (!ok && Platform.OS !== 'web') Alert.alert('Export', 'CSV export is available on the web admin panel.');
  };

  return (
    <View>
      <Header title="Candidates" subtitle={`${seekers.length} registered job seekers`} action={<Button title="Export CSV" icon="download-outline" variant="outline" small onPress={exportCandidates} />} />
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search by name, email, phone…" placeholderTextColor={colors.textFaint} />
      </View>
      {seekers.map((u: any) => {
        const p = getProfileFor(u.id);
        const apps = applications.filter((a: Application) => a.userId === u.id).length;
        return (
          <Pressable key={u.id} style={styles.rowCard} onPress={() => setSelected(u)}>
            <Avatar name={u.name} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{u.name}</Text>
              <Text style={styles.rowSub}>{p?.education || 'Job Seeker'} • {p?.location}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.candApps}>{apps}</Text>
              <Text style={styles.candAppsLabel}>applied</Text>
            </View>
          </Pressable>
        );
      })}
      <CandidateModal candidate={selected} onClose={() => setSelected(null)} store={store} />
    </View>
  );
}

function CandidateModal({ candidate, onClose, store }: any) {
  if (!candidate) return null;
  const p = store.getProfileFor(candidate.id);
  const apps = store.applications.filter((a: Application) => a.userId === candidate.id);
  const notify = (m: string) => (Platform.OS === 'web' ? window.alert(m) : Alert.alert('Notice', m));
  return (
    <Modal visible={!!candidate} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Candidate Profile</Text>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Avatar name={candidate.name} size={72} />
              <Text style={styles.candName}>{candidate.name}</Text>
              <Text style={styles.candRole}>{p?.education} • {p?.location}</Text>
            </View>
            <InfoLine icon="mail-outline" text={candidate.email} />
            <InfoLine icon="call-outline" text={candidate.phone} />
            <InfoLine icon="briefcase-outline" text={`Experience: ${p?.experience ?? '—'}`} />
            {p?.about ? <Text style={styles.candAbout}>{p.about}</Text> : null}
            {p?.skills?.length ? (
              <View style={styles.skillWrap}>{p.skills.map((s: string) => <View key={s} style={styles.skillChip}><Text style={styles.skillText}>{s}</Text></View>)}</View>
            ) : null}
            {p?.resume ? (
              <Pressable style={styles.resumeCard} onPress={() => notify(`Downloading ${p.resume.name} — resume is stored securely and shared only with the consultancy.`)}>
                <Ionicons name="document-text" size={26} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{p.resume.name}</Text>
                  <Text style={styles.rowSub}>{(p.resume.size / 1024).toFixed(0)} KB • Private</Text>
                </View>
                <Ionicons name="download-outline" size={22} color={colors.primary} />
              </Pressable>
            ) : <Text style={styles.muted}>No resume uploaded</Text>}
            <Text style={styles.sectionHeading}>Applications ({apps.length})</Text>
            {apps.map((a: Application) => {
              const job = store.jobs.find((j: Job) => j.id === a.jobId);
              return (
                <View key={a.id} style={styles.miniApp}>
                  <Text style={styles.miniAppTitle}>{job?.title}</Text>
                  <Badge label={a.status} bg={statusColor[a.status].bg} fg={statusColor[a.status].fg} />
                </View>
              );
            })}
            <Button title="Contact Candidate" icon="mail" onPress={() => notify(`Contact ${candidate.name} at ${candidate.email} / ${candidate.phone}`)} style={{ marginTop: 16 }} />
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------------- APPLICATIONS ADMIN ----------------
function Applications({ store }: any) {
  const { applications, jobs, users, setAppStatus } = store;
  const [tab, setTab] = useState<AppStatus | 'All'>('All');
  const [selected, setSelected] = useState<Application | null>(null);
  const TABS: (AppStatus | 'All')[] = ['All', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];
  const filtered = applications.filter((a: Application) => tab === 'All' || a.status === tab).sort((a: Application, b: Application) => b.appliedAt - a.appliedAt);

  const exportApps = () => {
    const rows = applications.map((a: Application) => {
      const job = jobs.find((j: Job) => j.id === a.jobId);
      const u = users.find((x: any) => x.id === a.userId);
      return { Candidate: u?.name, Email: u?.email, Phone: u?.phone, Job: job?.title, Company: job?.company, Location: job?.location, Status: a.status, AppliedOn: fmtDate(a.appliedAt) };
    });
    downloadCSV('applications.csv', rows);
  };

  return (
    <View>
      <Header title="Applications" subtitle={`${applications.length} total`} action={<Button title="Export CSV" icon="download-outline" variant="outline" small onPress={exportApps} />} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.pill, tab === t && styles.pillActive]}>
            <Text style={[styles.pillText, tab === t && { color: colors.white }]}>{t} ({applications.filter((a: Application) => t === 'All' || a.status === t).length})</Text>
          </Pressable>
        ))}
      </ScrollView>
      {filtered.length === 0 ? <EmptyState icon="documents-outline" title="No applications" /> : filtered.map((a: Application) => {
        const job = jobs.find((j: Job) => j.id === a.jobId);
        const u = users.find((x: any) => x.id === a.userId);
        return (
          <Pressable key={a.id} style={styles.rowCard} onPress={() => setSelected(a)}>
            <Avatar name={u?.name ?? 'U'} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{u?.name}</Text>
              <Text style={styles.rowSub}>{job?.title} • {timeAgo(a.appliedAt)}</Text>
            </View>
            <Badge label={a.status} bg={statusColor[a.status].bg} fg={statusColor[a.status].fg} />
          </Pressable>
        );
      })}
      <AppStatusModal app={selected} onClose={() => setSelected(null)} store={store} />
    </View>
  );
}

function AppStatusModal({ app, onClose, store }: any) {
  if (!app) return null;
  const job = store.jobs.find((j: Job) => j.id === app.jobId);
  const u = store.users.find((x: any) => x.id === app.userId);
  const STATUSES: AppStatus[] = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];
  const notify = (m: string) => (Platform.OS === 'web' ? window.alert(m) : Alert.alert('Notice', m));
  const current = store.applications.find((a: Application) => a.id === app.id) ?? app;
  return (
    <Modal visible={!!app} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Application</Text>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.rowCard}>
              <Avatar name={u?.name ?? 'U'} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{u?.name}</Text>
                <Text style={styles.rowSub}>{u?.email} • {u?.phone}</Text>
              </View>
            </View>
            <View style={styles.miniApp}><Text style={styles.miniAppTitle}>{job?.title}</Text><Text style={styles.rowSub}>{job?.company}</Text></View>
            {current.coverLetter ? <View style={styles.coverCard}><Text style={styles.coverText}>{current.coverLetter}</Text></View> : null}
            <Text style={styles.sectionHeading}>Update Status</Text>
            <View style={styles.statusGrid}>
              {STATUSES.map((s) => {
                const active = current.status === s;
                return (
                  <Pressable key={s} onPress={() => store.setAppStatus(app.id, s)} style={[styles.statusBtn, { borderColor: statusColor[s].fg }, active && { backgroundColor: statusColor[s].fg }]}>
                    <Text style={[styles.statusBtnText, { color: active ? colors.white : statusColor[s].fg }]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.sectionHeading}>Timeline</Text>
            <View style={styles.timelineCard}><StatusTimeline status={current.status} history={current.history} /></View>
            <Button title="Contact Candidate" icon="mail" variant="outline" onPress={() => notify(`Contact ${u?.name} at ${u?.email} / ${u?.phone}`)} style={{ marginTop: 16 }} />
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------------- CATEGORIES / LOCATIONS ----------------
function Categories({ store }: any) {
  const { categories, addCategory, removeCategory, jobs } = store;
  const [val, setVal] = useState('');
  return (
    <View>
      <Header title="Categories" subtitle={`${categories.length} job categories`} />
      <View style={styles.addRow}>
        <TextInput style={styles.searchInput} value={val} onChangeText={setVal} placeholder="New category name" placeholderTextColor={colors.textFaint} />
        <Button title="Add" icon="add" small onPress={() => { if (val.trim()) { addCategory(val.trim()); setVal(''); } }} />
      </View>
      {categories.map((c: any) => (
        <View key={c.name} style={styles.taxRow}>
          <View style={[styles.taxIcon, { backgroundColor: (c.color ?? colors.primary) + '18' }]}><Ionicons name={(c.icon ?? 'pricetag') as any} size={18} color={c.color ?? colors.primary} /></View>
          <Text style={styles.taxLabel}>{c.name}</Text>
          <Text style={styles.taxCount}>{jobs.filter((j: Job) => j.category === c.name).length} jobs</Text>
          <Pressable onPress={() => removeCategory(c.name)} hitSlop={8}><Ionicons name="trash-outline" size={20} color={colors.red} /></Pressable>
        </View>
      ))}
    </View>
  );
}

function Locations({ store }: any) {
  const { locations, addLocation, removeLocation, jobs } = store;
  const [val, setVal] = useState('');
  return (
    <View>
      <Header title="Locations" subtitle={`${locations.length} service locations`} />
      <View style={styles.addRow}>
        <TextInput style={styles.searchInput} value={val} onChangeText={setVal} placeholder="New location name" placeholderTextColor={colors.textFaint} />
        <Button title="Add" icon="add" small onPress={() => { if (val.trim()) { addLocation(val.trim()); setVal(''); } }} />
      </View>
      {locations.map((l: string) => (
        <View key={l} style={styles.taxRow}>
          <View style={[styles.taxIcon, { backgroundColor: colors.primaryLight }]}><Ionicons name="location" size={18} color={colors.primary} /></View>
          <Text style={styles.taxLabel}>{l}</Text>
          <Text style={styles.taxCount}>{jobs.filter((j: Job) => j.location === l).length} jobs</Text>
          <Pressable onPress={() => removeLocation(l)} hitSlop={8}><Ionicons name="trash-outline" size={20} color={colors.red} /></Pressable>
        </View>
      ))}
    </View>
  );
}

// ---------------- NOTIFICATIONS ADMIN ----------------
function NotificationsAdmin({ store }: any) {
  const { sendNotification, notifications, categories, locations } = store;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('All Users');
  const notify = (m: string) => (Platform.OS === 'web' ? window.alert(m) : Alert.alert('Sent', m));
  const send = () => {
    if (!title.trim() || !body.trim()) return notify('Enter title and message');
    sendNotification({ title: title.trim(), body: `${body.trim()}${target !== 'All Users' ? ` (${target})` : ''}`, type: 'announcement' });
    setTitle(''); setBody('');
    notify('Notification sent to ' + target);
  };
  const broadcasts = notifications.filter((n: any) => n.userId === undefined);
  return (
    <View>
      <Header title="Notifications" subtitle="Send announcements to job seekers" />
      <View style={styles.formCard}>
        <Text style={styles.groupLabel}>Send To</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {['All Users', 'By Category', 'By Location'].map((t) => (
            <Pressable key={t} onPress={() => setTarget(t)} style={[styles.pill, target === t && styles.pillActive]}><Text style={[styles.pillText, target === t && { color: colors.white }]}>{t}</Text></Pressable>
          ))}
        </ScrollView>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Notification title" placeholderTextColor={colors.textFaint} />
        <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top', marginTop: 10 }]} value={body} onChangeText={setBody} multiline placeholder="Message…" placeholderTextColor={colors.textFaint} />
        <Button title="Send Notification" icon="send" onPress={send} style={{ marginTop: 12 }} />
      </View>
      <Text style={styles.sectionHeading}>Sent Announcements</Text>
      {broadcasts.length === 0 ? <Text style={styles.muted}>No announcements yet</Text> : broadcasts.map((n: any) => (
        <View key={n.id} style={styles.rowCard}>
          <View style={[styles.taxIcon, { backgroundColor: colors.purpleSoft }]}><Ionicons name="megaphone" size={18} color={colors.purple} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{n.title}</Text>
            <Text style={styles.rowSub} numberOfLines={2}>{n.body}</Text>
          </View>
          <Text style={styles.muted}>{timeAgo(n.createdAt)}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------- REPORTS ----------------
function Reports({ store }: any) {
  const { jobs, applications, users } = store;
  const now = Date.now();
  const seekers = users.filter((u: any) => u.role === 'seeker');
  const newReg = seekers.filter((u: any) => now - u.createdAt < 7 * 86400000).length;
  const byStatus = (s: AppStatus) => applications.filter((a: Application) => a.status === s).length;

  const reportRows = [
    { Metric: 'Total Candidates', Value: seekers.length },
    { Metric: 'New Registrations (7d)', Value: newReg },
    { Metric: 'Jobs Posted', Value: jobs.length },
    { Metric: 'Active Jobs', Value: jobs.filter((j: Job) => j.status === 'published' && j.deadline > now).length },
    { Metric: 'Applications Received', Value: applications.length },
    { Metric: 'Shortlisted', Value: byStatus('Shortlisted') },
    { Metric: 'Interviews', Value: byStatus('Interview') },
    { Metric: 'Selected', Value: byStatus('Selected') },
    { Metric: 'Rejected', Value: byStatus('Rejected') },
  ];

  const byJob = jobs.map((j: Job) => ({ Job: j.title, Company: j.company, Location: j.location, Applications: applications.filter((a: Application) => a.jobId === j.id).length })).sort((a: any, b: any) => b.Applications - a.Applications);
  const byLoc = store.locations.map((l: string) => ({ Location: l, Applications: applications.filter((a: Application) => { const job = jobs.find((j: Job) => j.id === a.jobId); return job?.location === l; }).length })).filter((r: any) => r.Applications > 0);

  return (
    <View>
      <Header title="Reports" subtitle="Statistics & data export" />
      <View style={styles.reportGrid}>
        {reportRows.map((r) => (
          <View key={r.Metric} style={styles.reportCard}>
            <Text style={styles.reportValue}>{r.Value}</Text>
            <Text style={styles.reportLabel}>{r.Metric}</Text>
          </View>
        ))}
      </View>
      <View style={styles.exportRow}>
        <Button title="Export Summary" icon="download-outline" variant="outline" small onPress={() => downloadCSV('summary_report.csv', reportRows)} style={{ flex: 1 }} />
        <Button title="Applications by Job" icon="download-outline" variant="outline" small onPress={() => downloadCSV('applications_by_job.csv', byJob)} style={{ flex: 1 }} />
      </View>
      <Button title="Export Applications by Location" icon="download-outline" variant="outline" small onPress={() => downloadCSV('applications_by_location.csv', byLoc)} style={{ marginTop: 10 }} />
      <Text style={styles.sectionHeading}>Applications by Job</Text>
      <HBarChart data={byJob.slice(0, 6).map((r: any) => ({ label: r.Job, value: r.Applications }))} />
      {Platform.OS !== 'web' && <Text style={[styles.muted, { marginTop: 16 }]}>Tip: Open the admin panel in a web browser to download CSV/Excel files.</Text>}
    </View>
  );
}

// ---------------- SETTINGS ----------------
function SettingsAdmin({ store }: any) {
  const { settings, updateSettings, audit } = store;
  const [s, setS] = useState(settings);
  const notify = (m: string) => (Platform.OS === 'web' ? window.alert(m) : Alert.alert('Saved', m));
  const set = (k: string, v: string) => setS((p: any) => ({ ...p, [k]: v }));
  return (
    <View>
      <Header title="Settings" subtitle="Consultancy contact & branding" />
      <View style={styles.formCard}>
        {[
          { k: 'brand', l: 'Brand Name' }, { k: 'tagline', l: 'Tagline' }, { k: 'founder', l: 'Founder' },
          { k: 'email', l: 'Contact Email' }, { k: 'phone', l: 'Contact Phone' }, { k: 'address', l: 'Address' },
        ].map((f) => (
          <View key={f.k} style={{ marginBottom: 12 }}>
            <Text style={styles.groupLabel}>{f.l}</Text>
            <TextInput style={styles.input} value={(s as any)[f.k]} onChangeText={(v) => set(f.k, v)} placeholderTextColor={colors.textFaint} />
          </View>
        ))}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.groupLabel}>About</Text>
          <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} value={s.about} onChangeText={(v) => set('about', v)} multiline placeholderTextColor={colors.textFaint} />
        </View>
        <Button title="Save Settings" icon="checkmark-circle" onPress={() => { updateSettings(s); notify('Settings saved'); }} />
      </View>
      <Text style={styles.sectionHeading}>Audit Log</Text>
      {audit.slice(0, 12).map((a: any) => (
        <View key={a.id} style={styles.auditRow}>
          <Ionicons name="ellipse" size={8} color={colors.primary} />
          <Text style={styles.auditText}><Text style={{ fontWeight: '700' }}>{a.actor}</Text> — {a.action}</Text>
          <Text style={styles.auditTime}>{timeAgo(a.at)}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------- shared bits ----------------
function Header({ title, subtitle, action, wide }: any) {
  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}
function ChartCard({ title, children, wide }: any) {
  return (
    <View style={[styles.chartCard, wide && { width: '48.5%' }]}>
      <Text style={styles.chartTitle}>{title}</Text>
      {children}
    </View>
  );
}
function IconAction({ icon, label, onPress, color }: any) {
  return (
    <Pressable onPress={onPress} style={styles.iconAction}>
      <Ionicons name={icon} size={18} color={color ?? colors.primary} />
      <Text style={[styles.iconActionText, color && { color }]}>{label}</Text>
    </Pressable>
  );
}
function InfoLine({ icon, text }: any) {
  return <View style={styles.infoLine}><Ionicons name={icon} size={16} color={colors.textMuted} /><Text style={styles.infoLineText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  sidebar: { width: 260, backgroundColor: colors.card, borderRightWidth: 1, borderRightColor: colors.border, paddingVertical: 16 },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  sidebarLogo: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sidebarTitle: { fontSize: 15, fontWeight: '900', color: colors.text },
  sidebarSub: { fontSize: 12, color: colors.textMuted },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 13, marginHorizontal: 8, borderRadius: radius.md },
  menuItemActive: { backgroundColor: colors.primaryLight },
  menuLabel: { fontSize: 14.5, fontWeight: '600', color: colors.textMuted, flex: 1 },
  menuLabelActive: { color: colors.primary, fontWeight: '800' },
  menuCount: { backgroundColor: colors.bg, borderRadius: 10, minWidth: 22, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center' },
  menuCountText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  sidebarFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  footerName: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  footerRole: { fontSize: 11.5, color: colors.textMuted },
  mobileBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  mobileTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  adminBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row' },
  drawer: { width: 260, backgroundColor: colors.card },
  content: { padding: 16, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.4 },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: '2.6%', rowGap: 12 },
  statCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 26, fontWeight: '900', color: colors.text, marginTop: 10 },
  statLabel: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  chartsWrap: { marginTop: 20, gap: 14 },
  chartCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  chartTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 16 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 22, marginBottom: 12 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  rowTitle: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  rowSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.text },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginRight: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  jobRow: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  jobRowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  jobRowMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metaChip: { fontSize: 11.5, color: colors.textMuted, backgroundColor: colors.bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.sm, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, flexWrap: 'wrap' },
  iconAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.bg, borderRadius: radius.sm },
  iconActionText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
  candApps: { fontSize: 18, fontWeight: '900', color: colors.primary },
  candAppsLabel: { fontSize: 10.5, color: colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  candName: { fontSize: 19, fontWeight: '900', color: colors.text, marginTop: 12 },
  candRole: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLineText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  candAbout: { fontSize: 14, color: colors.textMuted, lineHeight: 21, marginTop: 12 },
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  skillChip: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  skillText: { color: colors.primary, fontWeight: '700', fontSize: 12.5 },
  resumeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, marginTop: 14 },
  miniApp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, padding: 13, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  miniAppTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text, flex: 1 },
  coverCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: 13, borderWidth: 1, borderColor: colors.border, marginTop: 8 },
  coverText: { fontSize: 13.5, color: colors.textMuted, fontStyle: 'italic', lineHeight: 20 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.5 },
  statusBtnText: { fontSize: 13, fontWeight: '700' },
  timelineCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 14 },
  taxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  taxIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  taxLabel: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.text },
  taxCount: { fontSize: 12.5, color: colors.textMuted },
  formCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  groupLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 7 },
  input: { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.text },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: '2.6%', rowGap: 12 },
  reportCard: { width: '31.5%', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  reportValue: { fontSize: 24, fontWeight: '900', color: colors.primary },
  reportLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  exportRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  auditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  auditText: { flex: 1, fontSize: 13, color: colors.textMuted },
  auditTime: { fontSize: 11.5, color: colors.textFaint },
  muted: { fontSize: 13.5, color: colors.textFaint },
});
