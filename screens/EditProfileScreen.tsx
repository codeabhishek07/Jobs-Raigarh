import React, { useState, useRef, useEffect } from 'react';
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
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { useStore } from '../lib/store';
import { Avatar, Button, Input } from '../components/ui';

const EXPERIENCE = ['Fresher', '0-2 years', '1-3 years', '2-5 years', '5+ years'];

export default function EditProfileScreen({ navigation, route }: any) {
  const { user, profile, locations, saveProfile, setResume } = useStore();
  const scrollRef = useRef<ScrollView>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [location, setLocation] = useState(profile?.location ?? 'Raigarh');
  const [education, setEducation] = useState(profile?.education ?? '');
  const [experience, setExperience] = useState(profile?.experience ?? 'Fresher');
  const [about, setAbout] = useState(profile?.about ?? '');
  const [photo, setPhoto] = useState(profile?.photo);
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [certs, setCerts] = useState<string[]>(profile?.certifications ?? []);
  const [langs, setLangs] = useState<string[]>(profile?.languages ?? []);
  const [resume, setResumeState] = useState(profile?.resume);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (route.params?.scrollResume) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 400);
  }, [route.params]);

  const notify = (m: string) => (Platform.OS === 'web' ? window.alert(m) : Alert.alert('Jobs at Raigarh', m));

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const pickResume = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const f = res.assets[0];
    if (!/\.(pdf|doc|docx)$/i.test(f.name)) return notify('Please upload a PDF, DOC or DOCX file.');
    const r = { id: 'res_' + Date.now(), name: f.name, mimeType: f.mimeType ?? 'application/pdf', size: f.size ?? 0, uri: f.uri, uploadedAt: Date.now() };
    setResumeState(r);
  };

  const deleteResume = () => {
    if (Platform.OS === 'web') { if (window.confirm('Delete your resume?')) setResumeState(null); }
    else Alert.alert('Delete Resume', 'Remove your uploaded resume?', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => setResumeState(null) }]);
  };

  const save = async () => {
    if (!name.trim()) return notify('Name cannot be empty');
    setSaving(true);
    await saveProfile({ _name: name.trim(), _phone: phone.trim(), location, education, experience, about, photo, skills, certifications: certs, languages: langs, resume });
    await setResume(resume ?? null);
    setSaving(false);
    notify('Profile saved successfully');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Photo */}
          <View style={styles.photoWrap}>
            <Pressable onPress={pickPhoto}>
              {photo ? <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" /> : <Avatar name={name || 'U'} size={88} />}
              <View style={styles.photoEdit}><Ionicons name="camera" size={16} color={colors.white} /></View>
            </Pressable>
            <Text style={styles.photoLabel}>Tap to change photo</Text>
          </View>

          <Input label="Full Name" icon="person-outline" value={name} onChangeText={setName} placeholder="Your name" />
          <Input label="Mobile Number" icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10-digit mobile" />
          <Input label="Email (login)" icon="mail-outline" value={user?.email} editable={false} />

          <Text style={styles.groupLabel}>Location</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {locations.map((l) => (
              <Chip key={l} label={l} active={location === l} onPress={() => setLocation(l)} />
            ))}
          </ScrollView>

          <Input label="Education" icon="school-outline" value={education} onChangeText={setEducation} placeholder="e.g. B.Tech, ITI Fitter, B.Com" />

          <Text style={styles.groupLabel}>Experience</Text>
          <View style={styles.chipRow}>
            {EXPERIENCE.map((e) => <Chip key={e} label={e} active={experience === e} onPress={() => setExperience(e)} />)}
          </View>

          <Text style={styles.groupLabel}>About Me</Text>
          <TextInput value={about} onChangeText={setAbout} placeholder="Introduce yourself to employers…" placeholderTextColor={colors.textFaint} multiline style={styles.textArea} />

          <TagInput label="Skills" placeholder="Add a skill" tags={skills} setTags={setSkills} />
          <TagInput label="Certifications" placeholder="Add a certification" tags={certs} setTags={setCerts} />
          <TagInput label="Languages" placeholder="Add a language" tags={langs} setTags={setLangs} />

          <Text style={styles.groupLabel}>Resume (PDF, DOC, DOCX)</Text>
          {resume ? (
            <View style={styles.resumeCard}>
              <Ionicons name="document-text" size={28} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resumeName} numberOfLines={1}>{resume.name}</Text>
                <Text style={styles.resumeMeta}>{(resume.size / 1024).toFixed(0)} KB • Stored privately</Text>
              </View>
              <Pressable onPress={pickResume} style={styles.resumeAction} hitSlop={6}>
                <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
              </Pressable>
              <Pressable onPress={deleteResume} style={styles.resumeAction} hitSlop={6}>
                <Ionicons name="trash-outline" size={20} color={colors.red} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.uploadBox} onPress={pickResume}>
              <Ionicons name="cloud-upload-outline" size={26} color={colors.primary} />
              <Text style={styles.uploadText}>Upload Resume</Text>
              <Text style={styles.uploadHint}>PDF, DOC or DOCX up to 5 MB</Text>
            </Pressable>
          )}

          <Button title="Save Profile" icon="checkmark-circle" loading={saving} onPress={save} style={{ marginTop: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TagInput({ label, placeholder, tags, setTags }: { label: string; placeholder: string; tags: string[]; setTags: (t: string[]) => void }) {
  const [val, setVal] = useState('');
  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setVal('');
  };
  return (
    <View style={{ marginTop: 4 }}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.tagInputRow}>
        <TextInput value={val} onChangeText={setVal} placeholder={placeholder} placeholderTextColor={colors.textFaint} style={styles.tagInput} onSubmitEditing={add} returnKeyType="done" />
        <Pressable onPress={add} style={styles.addBtn}><Ionicons name="add" size={22} color={colors.white} /></Pressable>
      </View>
      {tags.length > 0 && (
        <View style={styles.tagWrap}>
          {tags.map((t) => (
            <Pressable key={t} style={styles.tag} onPress={() => setTags(tags.filter((x) => x !== t))}>
              <Text style={styles.tagText}>{t}</Text>
              <Ionicons name="close" size={13} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function Chip({ label, active, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={[styles.chipBtn, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  photoWrap: { alignItems: 'center', marginBottom: 20 },
  photo: { width: 88, height: 88, borderRadius: 44 },
  photoEdit: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg },
  photoLabel: { fontSize: 12.5, color: colors.textMuted, marginTop: 8 },
  groupLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chipBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginRight: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  textArea: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: 13, minHeight: 90, fontSize: 15, color: colors.text, textAlignVertical: 'top', marginBottom: 14 },
  tagInputRow: { flexDirection: 'row', gap: 8 },
  tagInput: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, color: colors.text },
  addBtn: { width: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  tagText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  resumeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  resumeName: { fontSize: 14, fontWeight: '700', color: colors.text },
  resumeMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  resumeAction: { padding: 4 },
  uploadBox: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 24, borderWidth: 1.5, borderColor: colors.primarySoft, borderStyle: 'dashed', gap: 6 },
  uploadText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  uploadHint: { fontSize: 12.5, color: colors.textMuted },
});
