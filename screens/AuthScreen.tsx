import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow } from '../lib/theme';
import { useStore } from '../lib/store';
import { Button, Input } from '../components/ui';

type Mode = 'welcome' | 'login' | 'register' | 'forgot';

export default function AuthScreen() {
  const { login, register, resetPassword, settings } = useStore();
  const [mode, setMode] = useState<Mode>('welcome');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [id, setId] = useState('');
  const [err, setErr] = useState('');
  const [showPw, setShowPw] = useState(false);

  const notify = (msg: string) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Jobs at Raigarh', msg);
  };

  const doLogin = async () => {
    setErr('');
    if (!id || !password) return setErr('Enter your email/mobile and password');
    setLoading(true);
    const r = await login(id, password);
    setLoading(false);
    if (!r.ok) setErr(r.error ?? 'Login failed');
  };

  const doRegister = async () => {
    setErr('');
    if (!name || !email || !phone || !password) return setErr('All fields are required');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address');
    if (!/^\d{10}$/.test(phone.replace(/\D/g, '').slice(-10))) return setErr('Enter a valid 10-digit mobile');
    if (password.length < 6) return setErr('Password must be at least 6 characters');
    if (password !== confirm) return setErr('Passwords do not match');
    setLoading(true);
    const r = await register({ name, email, phone, password });
    setLoading(false);
    if (!r.ok) setErr(r.error ?? 'Registration failed');
  };

  const doForgot = async () => {
    setErr('');
    if (!id || !password) return setErr('Enter your account and a new password');
    if (password.length < 6) return setErr('Password must be at least 6 characters');
    setLoading(true);
    const r = await resetPassword(id, password);
    setLoading(false);
    if (!r.ok) return setErr(r.error ?? 'Reset failed');
    notify('Password reset successful. Please login.');
    setMode('login');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandWrap}>
            <View style={styles.logoBox}>
              <Ionicons name="briefcase" size={34} color={colors.white} />
            </View>
            <Text style={styles.brand}>Jobs at Raigarh</Text>
            <Text style={styles.tagline}>Connecting Talent with Opportunities</Text>
          </View>

          {mode === 'welcome' && (
            <View style={styles.card}>
              <Text style={styles.h1}>Find Your Next Opportunity</Text>
              <Text style={styles.sub}>
                Discover ITI, engineering, IT, government and private jobs across Raigarh and Chhattisgarh.
              </Text>
              <View style={{ height: 20 }} />
              <Button title="Login" icon="log-in-outline" onPress={() => setMode('login')} />
              <View style={{ height: 12 }} />
              <Button
                title="Create Account"
                variant="outline"
                icon="person-add-outline"
                onPress={() => setMode('register')}
              />
              <View style={styles.featureRow}>
                {[
                  { i: 'search', t: 'Search Jobs' },
                  { i: 'document-text', t: 'Upload Resume' },
                  { i: 'trending-up', t: 'Track Status' },
                ].map((f) => (
                  <View key={f.t} style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Ionicons name={f.i as any} size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.featureText}>{f.t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {mode === 'login' && (
            <View style={styles.card}>
              <Text style={styles.h1}>Welcome Back</Text>
              <Text style={styles.sub}>Login to continue your job search</Text>
              <View style={{ height: 18 }} />
              <Input
                label="Email or Mobile"
                icon="person-outline"
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={id}
                onChangeText={setId}
              />
              <Input
                label="Password"
                icon="lock-closed-outline"
                placeholder="Your password"
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPw((s) => !s)} style={styles.showPw}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.textMuted} />
                <Text style={styles.showPwText}>{showPw ? 'Hide' : 'Show'} password</Text>
              </Pressable>
              {err ? <Text style={styles.err}>{err}</Text> : null}
              <View style={{ height: 8 }} />
              <Button title="Login" loading={loading} onPress={doLogin} icon="log-in-outline" />
              <Pressable onPress={() => { setMode('forgot'); setErr(''); }} style={styles.linkCenter}>
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>New here? </Text>
                <Pressable onPress={() => { setMode('register'); setErr(''); }}>
                  <Text style={styles.link}>Create account</Text>
                </Pressable>
              </View>
              <DemoBox />
            </View>
          )}

          {mode === 'register' && (
            <View style={styles.card}>
              <Text style={styles.h1}>Create Account</Text>
              <Text style={styles.sub}>Join as a job seeker — it's free</Text>
              <View style={{ height: 18 }} />
              <Input label="Full Name" icon="person-outline" placeholder="Your name" value={name} onChangeText={setName} />
              <Input
                label="Email"
                icon="mail-outline"
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Input
                label="Mobile Number"
                icon="call-outline"
                placeholder="10-digit mobile"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <Input
                label="Password"
                icon="lock-closed-outline"
                placeholder="At least 6 characters"
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
              />
              <Input
                label="Confirm Password"
                icon="lock-closed-outline"
                placeholder="Re-enter password"
                secureTextEntry={!showPw}
                value={confirm}
                onChangeText={setConfirm}
              />
              {err ? <Text style={styles.err}>{err}</Text> : null}
              <Button title="Create Account" loading={loading} onPress={doRegister} icon="checkmark-circle-outline" />
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Already registered? </Text>
                <Pressable onPress={() => { setMode('login'); setErr(''); }}>
                  <Text style={styles.link}>Login</Text>
                </Pressable>
              </View>
            </View>
          )}

          {mode === 'forgot' && (
            <View style={styles.card}>
              <Text style={styles.h1}>Reset Password</Text>
              <Text style={styles.sub}>Enter your account and a new password</Text>
              <View style={{ height: 18 }} />
              <Input
                label="Email or Mobile"
                icon="person-outline"
                placeholder="you@example.com"
                autoCapitalize="none"
                value={id}
                onChangeText={setId}
              />
              <Input
                label="New Password"
                icon="lock-closed-outline"
                placeholder="At least 6 characters"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {err ? <Text style={styles.err}>{err}</Text> : null}
              <Button title="Reset Password" loading={loading} onPress={doForgot} icon="refresh-outline" />
              <Pressable onPress={() => { setMode('login'); setErr(''); }} style={styles.linkCenter}>
                <Text style={styles.link}>Back to login</Text>
              </Pressable>
            </View>
          )}

          {mode !== 'welcome' && (
            <Pressable onPress={() => { setMode('welcome'); setErr(''); }} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          )}

          <Text style={styles.footer}>Founder: {settings.founder} • {settings.address}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DemoBox() {
  return (
    <View style={styles.demoBox}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Ionicons name="information-circle" size={15} color={colors.primary} />
        <Text style={styles.demoTitle}>Demo Accounts</Text>
      </View>
      <Text style={styles.demoLine}>Admin — abhixfactor@gmail.com / admin123</Text>
      <Text style={styles.demoLine}>Seeker — rahul.verma@example.com / password</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  brandWrap: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  brand: { fontSize: 26, fontWeight: '900', color: colors.text, marginTop: 14, letterSpacing: -0.5 },
  tagline: { fontSize: 13.5, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  h1: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.3 },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 5, lineHeight: 20 },
  err: { color: colors.red, fontSize: 13, marginBottom: 12, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  linkCenter: { alignItems: 'center', marginTop: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  switchText: { color: colors.textMuted, fontSize: 14 },
  showPw: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12, marginTop: -4 },
  showPwText: { fontSize: 13, color: colors.textMuted },
  featureRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 },
  feature: { alignItems: 'center', gap: 7 },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 20 },
  backText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  footer: { textAlign: 'center', color: colors.textFaint, fontSize: 12, marginTop: 24 },
  demoBox: {
    marginTop: 20,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: 14,
  },
  demoTitle: { fontSize: 13, fontWeight: '800', color: colors.primary },
  demoLine: { fontSize: 12.5, color: colors.primaryDark, marginTop: 3 },
});
