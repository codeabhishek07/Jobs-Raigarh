import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Platform, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius } from '../lib/theme';
import { useStore } from '../lib/store';
import { Button } from './ui';
import { Job, JobType } from '../lib/types';

const JOB_TYPES: JobType[] = ['Full Time', 'Part Time', 'Contract', 'Apprenticeship', 'Internship', 'Work From Home'];
const LOGOS = ['🏢', '🏭', '💻', '🏥', '🏦', '🎓', '⚙️', '🛠️', '📣', '🏛️', '🔌', '🛵'];

export default function JobForm({ visible, onClose, editing }: { visible: boolean; onClose: () => void; editing?: Job | null }) {
  const { upsertJob, categories, locations } = useStore();
  const [f, setF] = useState<any>(seed(editing));

  React.useEffect(() => { if (visible) setF(seed(editing)); }, [visible, editing]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const notify = (m: string) => (Platform.OS === 'web' ? window.alert(m) : Alert.alert('Notice', m));

  const submit = async (status: 'draft' | 'published') => {
    if (!f.title.trim() || !f.company.trim()) return notify('Job title and company are required');
    const daysToDeadline = parseInt(f.deadlineDays) || 30;
    await upsertJob({
      id: editing?.id,
      title: f.title.trim(),
      company: f.company.trim(),
      logo: f.logo,
      location: f.location,
      category: f.category,
      jobType: f.jobType,
      salary: f.salary.trim() || 'Negotiable',
      experience: f.experience.trim() || 'Fresher',
      education: f.education.trim() || 'Any',
      skills: splitList(f.skills),
      vacancies: parseInt(f.vacancies) || 1,
      description: f.description.trim(),
      responsibilities: splitLines(f.responsibilities),
      benefits: splitLines(f.benefits),
      qualification: f.qualification.trim(),
      contact: f.contact.trim() || 'abhixfactor@gmail.com',
      deadline: editing && !f.deadlineChanged ? editing.deadline : Date.now() + daysToDeadline * 86400000,
      featured: f.featured,
      status,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{editing ? 'Edit Job' : 'Create New Job'}</Text>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Field label="Job Title *"><TextInput style={styles.input} value={f.title} onChangeText={(v) => set('title', v)} placeholder="e.g. ITI Fitter" placeholderTextColor={colors.textFaint} /></Field>
            <Field label="Company *"><TextInput style={styles.input} value={f.company} onChangeText={(v) => set('company', v)} placeholder="Company name" placeholderTextColor={colors.textFaint} /></Field>

            <Text style={styles.groupLabel}>Company Logo</Text>
            <View style={styles.logoRow}>
              {LOGOS.map((l) => (
                <Pressable key={l} onPress={() => set('logo', l)} style={[styles.logoChip, f.logo === l && styles.logoChipActive]}>
                  <Text style={{ fontSize: 22 }}>{l}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.groupLabel}>Category</Text>
            <ChipScroll items={categories.map((c: any) => c.name)} value={f.category} onSelect={(v: string) => set('category', v)} />

            <Text style={styles.groupLabel}>Location</Text>
            <ChipScroll items={locations} value={f.location} onSelect={(v: string) => set('location', v)} />

            <Text style={styles.groupLabel}>Job Type</Text>
            <View style={styles.chipWrap}>
              {JOB_TYPES.map((t) => <Chip key={t} label={t} active={f.jobType === t} onPress={() => set('jobType', t)} />)}
            </View>

            <View style={styles.row2}>
              <Field label="Salary" flex><TextInput style={styles.input} value={f.salary} onChangeText={(v) => set('salary', v)} placeholder="₹15,000-25,000" placeholderTextColor={colors.textFaint} /></Field>
              <Field label="Vacancies" flex><TextInput style={styles.input} value={f.vacancies} onChangeText={(v) => set('vacancies', v)} keyboardType="number-pad" placeholder="2" placeholderTextColor={colors.textFaint} /></Field>
            </View>
            <View style={styles.row2}>
              <Field label="Experience" flex><TextInput style={styles.input} value={f.experience} onChangeText={(v) => set('experience', v)} placeholder="1-3 years" placeholderTextColor={colors.textFaint} /></Field>
              <Field label="Deadline (days)" flex><TextInput style={styles.input} value={f.deadlineDays} onChangeText={(v: string) => { set('deadlineDays', v); set('deadlineChanged', true); }} keyboardType="number-pad" placeholder="30" placeholderTextColor={colors.textFaint} /></Field>
            </View>
            <Field label="Education"><TextInput style={styles.input} value={f.education} onChangeText={(v) => set('education', v)} placeholder="Graduate / ITI / 12th" placeholderTextColor={colors.textFaint} /></Field>
            <Field label="Skills (comma separated)"><TextInput style={styles.input} value={f.skills} onChangeText={(v) => set('skills', v)} placeholder="Excel, Communication" placeholderTextColor={colors.textFaint} /></Field>
            <Field label="Description"><TextInput style={[styles.input, styles.area]} value={f.description} onChangeText={(v) => set('description', v)} multiline placeholder="Describe the role…" placeholderTextColor={colors.textFaint} /></Field>
            <Field label="Responsibilities (one per line)"><TextInput style={[styles.input, styles.area]} value={f.responsibilities} onChangeText={(v) => set('responsibilities', v)} multiline placeholder={'Task 1\nTask 2'} placeholderTextColor={colors.textFaint} /></Field>
            <Field label="Benefits (one per line)"><TextInput style={[styles.input, styles.area]} value={f.benefits} onChangeText={(v) => set('benefits', v)} multiline placeholder={'PF\nInsurance'} placeholderTextColor={colors.textFaint} /></Field>
            <Field label="Qualification"><TextInput style={styles.input} value={f.qualification} onChangeText={(v) => set('qualification', v)} placeholder="Required qualification" placeholderTextColor={colors.textFaint} /></Field>
            <Field label="Contact Information"><TextInput style={styles.input} value={f.contact} onChangeText={(v) => set('contact', v)} placeholder="email or phone" placeholderTextColor={colors.textFaint} autoCapitalize="none" /></Field>

            <Pressable style={styles.featuredRow} onPress={() => set('featured', !f.featured)}>
              <Ionicons name={f.featured ? 'checkbox' : 'square-outline'} size={22} color={f.featured ? colors.primary : colors.textFaint} />
              <Text style={styles.featuredText}>Mark as Featured Job</Text>
            </Pressable>
            <View style={{ height: 12 }} />
          </ScrollView>
          <View style={styles.footer}>
            <Button title="Save Draft" variant="ghost" icon="save-outline" onPress={() => submit('draft')} style={{ flex: 1 }} />
            <Button title={editing ? 'Update & Publish' : 'Publish'} icon="cloud-upload" onPress={() => submit('published')} style={{ flex: 1.4 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function seed(e?: Job | null) {
  return {
    title: e?.title ?? '', company: e?.company ?? '', logo: e?.logo ?? '🏢',
    location: e?.location ?? 'Raigarh', category: e?.category ?? 'Private Jobs', jobType: e?.jobType ?? 'Full Time',
    salary: e?.salary ?? '', vacancies: String(e?.vacancies ?? 1), experience: e?.experience ?? '', education: e?.education ?? '',
    skills: e?.skills?.join(', ') ?? '', description: e?.description ?? '', responsibilities: e?.responsibilities?.join('\n') ?? '',
    benefits: e?.benefits?.join('\n') ?? '', qualification: e?.qualification ?? '', contact: e?.contact ?? 'abhixfactor@gmail.com',
    featured: e?.featured ?? false, deadlineDays: '30', deadlineChanged: false,
  };
}
const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const splitLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function Field({ label, children, flex }: any) {
  return <View style={[{ marginBottom: 12 }, flex && { flex: 1 }]}><Text style={styles.groupLabel}>{label}</Text>{children}</View>;
}
function ChipScroll({ items, value, onSelect }: any) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
      {items.map((it: string) => <Chip key={it} label={it} active={value === it} onPress={() => onSelect(it)} />)}
    </ScrollView>
  );
}
function Chip({ label, active, onPress }: any) {
  return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '900', color: colors.text },
  groupLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 7 },
  input: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.text },
  area: { minHeight: 80, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12 },
  logoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  logoChip: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border },
  logoChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginRight: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  featuredRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  featuredText: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  footer: { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
});
