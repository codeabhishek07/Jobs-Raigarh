import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  SeekerProfile,
  Job,
  Application,
  SavedJob,
  AppNotification,
  AuditLog,
  Settings,
  Role,
  AppStatus,
  Resume,
} from './types';
import {
  SEED_JOBS,
  DEFAULT_SETTINGS,
  ADMIN_SEED,
  CATEGORIES,
  LOCATIONS,
} from './seed';

// ---------- lightweight "secure" hashing (djb2) ----------
export function hashPassword(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = (h * 33) ^ pw.charCodeAt(i);
  return 'h$' + (h >>> 0).toString(16) + '$' + pw.length;
}
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 11);

const K = {
  users: 'jar.users',
  profiles: 'jar.profiles',
  jobs: 'jar.jobs',
  apps: 'jar.applications',
  saved: 'jar.saved',
  notifs: 'jar.notifications',
  audit: 'jar.audit',
  settings: 'jar.settings',
  categories: 'jar.categories',
  locations: 'jar.locations',
  session: 'jar.session',
  seeded: 'jar.seeded.v1',
};

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
async function write(key: string, val: any) {
  await AsyncStorage.setItem(key, JSON.stringify(val));
}

interface Ctx {
  loading: boolean;
  user: User | null;
  profile: SeekerProfile | null;
  users: User[];
  jobs: Job[];
  applications: Application[];
  saved: SavedJob[];
  notifications: AppNotification[];
  audit: AuditLog[];
  settings: Settings;
  categories: { name: string; icon: string; color: string }[];
  locations: string[];

  // auth
  register: (
    d: { name: string; email: string; phone: string; password: string }
  ) => Promise<{ ok: boolean; error?: string }>;
  login: (
    id: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; role?: Role }>;
  logout: () => Promise<void>;
  resetPassword: (id: string, newPw: string) => Promise<{ ok: boolean; error?: string }>;

  // profile
  saveProfile: (p: Partial<SeekerProfile> & { _name?: string; _phone?: string; _email?: string }) => Promise<void>;
  setResume: (r: Resume | null) => Promise<void>;
  profileCompletion: (u?: User | null, p?: SeekerProfile | null) => number;
  deleteAccount: () => Promise<void>;

  // jobs
  upsertJob: (j: Partial<Job> & { id?: string }) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;
  setJobStatus: (id: string, status: Job['status']) => Promise<void>;
  duplicateJob: (id: string) => Promise<void>;

  // applications
  apply: (jobId: string, resumeName?: string, cover?: string) => Promise<{ ok: boolean; error?: string }>;
  hasApplied: (jobId: string) => boolean;
  setAppStatus: (appId: string, status: AppStatus, note?: string) => Promise<void>;

  // saved
  toggleSave: (jobId: string) => Promise<void>;
  isSaved: (jobId: string) => boolean;

  // notifications
  markNotifRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  sendNotification: (
    n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
  ) => Promise<void>;
  unreadCount: number;

  // admin
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  removeCategory: (name: string) => Promise<void>;
  addLocation: (name: string) => Promise<void>;
  removeLocation: (name: string) => Promise<void>;
  getProfileFor: (userId: string) => SeekerProfile | null;

  resetDemo: () => Promise<void>;
}

const StoreContext = createContext<Ctx>({} as Ctx);
export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Record<string, SeekerProfile>>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [saved, setSaved] = useState<SavedJob[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState(CATEGORIES);
  const [locations, setLocations] = useState<string[]>(LOCATIONS);

  const profile = user ? profiles[user.id] ?? null : null;

  const logAudit = useCallback(
    async (actor: string, action: string) => {
      const entry: AuditLog = { id: uid('log'), actor, action, at: Date.now() };
      setAudit((prev) => {
        const next = [entry, ...prev].slice(0, 300);
        write(K.audit, next);
        return next;
      });
    },
    []
  );

  // ---- bootstrap ----
  useEffect(() => {
    (async () => {
      const seeded = await read(K.seeded, false);
      if (!seeded) {
        const admin: User = {
          id: 'admin_root',
          role: 'admin',
          name: ADMIN_SEED.name,
          email: ADMIN_SEED.email,
          phone: ADMIN_SEED.phone,
          password: hashPassword(ADMIN_SEED.password),
          createdAt: Date.now(),
        };
        const demoSeekers = buildDemoSeekers();
        const allUsers = [admin, ...demoSeekers.users];
        await write(K.users, allUsers);
        await write(K.profiles, demoSeekers.profiles);
        await write(K.jobs, SEED_JOBS);
        const demoApps = buildDemoApplications(SEED_JOBS, demoSeekers.users);
        await write(K.apps, demoApps);
        await write(K.settings, DEFAULT_SETTINGS);
        await write(K.categories, CATEGORIES);
        await write(K.locations, LOCATIONS);
        await write(K.notifs, buildDemoNotifications());
        await write(K.seeded, true);
      }

      const [
        u,
        p,
        j,
        a,
        s,
        n,
        au,
        st,
        cat,
        loc,
        sess,
      ] = await Promise.all([
        read<User[]>(K.users, []),
        read<Record<string, SeekerProfile>>(K.profiles, {}),
        read<Job[]>(K.jobs, []),
        read<Application[]>(K.apps, []),
        read<SavedJob[]>(K.saved, []),
        read<AppNotification[]>(K.notifs, []),
        read<AuditLog[]>(K.audit, []),
        read<Settings>(K.settings, DEFAULT_SETTINGS),
        read(K.categories, CATEGORIES),
        read<string[]>(K.locations, LOCATIONS),
        read<string | null>(K.session, null),
      ]);
      setUsers(u);
      setProfiles(p);
      setJobs(expireJobs(j));
      setApplications(a);
      setSaved(s);
      setNotifications(n);
      setAudit(au);
      setSettings(st);
      setCategories(cat);
      setLocations(loc);
      if (sess) {
        const found = u.find((x) => x.id === sess);
        if (found) setUser(found);
      }
      setLoading(false);
    })();
  }, []);

  function expireJobs(list: Job[]): Job[] {
    const now = Date.now();
    return list.map((j) =>
      j.status === 'published' && j.deadline < now ? { ...j, status: 'closed' } : j
    );
  }

  // ---------- AUTH ----------
  const register: Ctx['register'] = async (d) => {
    const email = d.email.trim().toLowerCase();
    const phone = d.phone.trim();
    if (users.some((u) => u.email.toLowerCase() === email))
      return { ok: false, error: 'Email already registered' };
    if (phone && users.some((u) => u.phone === phone))
      return { ok: false, error: 'Mobile number already registered' };
    const newUser: User = {
      id: uid('usr'),
      role: 'seeker',
      name: d.name.trim(),
      email,
      phone,
      password: hashPassword(d.password),
      createdAt: Date.now(),
    };
    const nextUsers = [...users, newUser];
    const prof: SeekerProfile = {
      userId: newUser.id,
      location: 'Raigarh',
      about: '',
      education: '',
      skills: [],
      experience: 'Fresher',
      certifications: [],
      languages: ['Hindi', 'English'],
      resume: null,
      updatedAt: Date.now(),
    };
    const nextProfiles = { ...profiles, [newUser.id]: prof };
    setUsers(nextUsers);
    setProfiles(nextProfiles);
    setUser(newUser);
    await write(K.users, nextUsers);
    await write(K.profiles, nextProfiles);
    await write(K.session, newUser.id);
    await pushWelcome(newUser.id);
    logAudit(newUser.email, 'Registered new account');
    return { ok: true };
  };

  const pushWelcome = async (userId: string) => {
    const n: AppNotification = {
      id: uid('ntf'),
      userId,
      title: 'Welcome to Jobs at Raigarh 🎉',
      body: 'Complete your profile and upload your resume to start applying.',
      type: 'system',
      read: false,
      createdAt: Date.now(),
    };
    setNotifications((prev) => {
      const next = [n, ...prev];
      write(K.notifs, next);
      return next;
    });
  };

  const login: Ctx['login'] = async (id, password) => {
    const key = id.trim().toLowerCase();
    const found = users.find(
      (u) => u.email.toLowerCase() === key || u.phone === id.trim()
    );
    if (!found) return { ok: false, error: 'Account not found' };
    if (found.password !== hashPassword(password))
      return { ok: false, error: 'Incorrect password' };
    setUser(found);
    await write(K.session, found.id);
    logAudit(found.email, 'Logged in');
    return { ok: true, role: found.role };
  };

  const logout = async () => {
    if (user) logAudit(user.email, 'Logged out');
    setUser(null);
    await AsyncStorage.removeItem(K.session);
  };

  const resetPassword: Ctx['resetPassword'] = async (id, newPw) => {
    const key = id.trim().toLowerCase();
    const idx = users.findIndex(
      (u) => u.email.toLowerCase() === key || u.phone === id.trim()
    );
    if (idx < 0) return { ok: false, error: 'Account not found' };
    const next = [...users];
    next[idx] = { ...next[idx], password: hashPassword(newPw) };
    setUsers(next);
    await write(K.users, next);
    return { ok: true };
  };

  // ---------- PROFILE ----------
  const saveProfile: Ctx['saveProfile'] = async (p) => {
    if (!user) return;
    const cur = profiles[user.id];
    const next = { ...profiles, [user.id]: { ...cur, ...p, userId: user.id, updatedAt: Date.now() } };
    setProfiles(next);
    await write(K.profiles, next);
    // keep user name in sync if provided
    if (p['about'] !== undefined || true) {
      // update users name from profile? name is in user object; handle separately
    }
  };

  const updateUserFields = async (fields: Partial<User>) => {
    if (!user) return;
    const nextUser = { ...user, ...fields };
    const nextUsers = users.map((u) => (u.id === user.id ? nextUser : u));
    setUser(nextUser);
    setUsers(nextUsers);
    await write(K.users, nextUsers);
  };

  const setResume: Ctx['setResume'] = async (r) => {
    if (!user) return;
    await saveProfile({ resume: r });
    if (r) {
      logAudit(user.email, 'Uploaded resume: ' + r.name);
    }
  };

  const profileCompletion: Ctx['profileCompletion'] = (u = user, p = profile) => {
    if (!u) return 0;
    const checks = [
      !!u.name,
      !!u.email,
      !!u.phone,
      !!p?.location,
      !!p?.education,
      (p?.skills?.length ?? 0) > 0,
      !!p?.experience,
      !!p?.about,
      !!p?.photo,
      !!p?.resume,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const deleteAccount = async () => {
    if (!user) return;
    const nextUsers = users.filter((u) => u.id !== user.id);
    const nextProfiles = { ...profiles };
    delete nextProfiles[user.id];
    const nextApps = applications.filter((a) => a.userId !== user.id);
    const nextSaved = saved.filter((s) => s.userId !== user.id);
    setUsers(nextUsers);
    setProfiles(nextProfiles);
    setApplications(nextApps);
    setSaved(nextSaved);
    await write(K.users, nextUsers);
    await write(K.profiles, nextProfiles);
    await write(K.apps, nextApps);
    await write(K.saved, nextSaved);
    logAudit(user.email, 'Deleted account and data');
    setUser(null);
    await AsyncStorage.removeItem(K.session);
  };

  // ---------- JOBS ----------
  const persistJobs = async (next: Job[]) => {
    setJobs(next);
    await write(K.jobs, next);
  };

  const upsertJob: Ctx['upsertJob'] = async (j) => {
    let result: Job;
    if (j.id && jobs.some((x) => x.id === j.id)) {
      result = { ...(jobs.find((x) => x.id === j.id) as Job), ...j } as Job;
      await persistJobs(jobs.map((x) => (x.id === j.id ? result : x)));
      logAudit(user?.email ?? 'admin', 'Edited job: ' + result.title);
    } else {
      result = {
        id: uid('job'),
        logo: '🏢',
        skills: [],
        responsibilities: [],
        benefits: [],
        featured: false,
        isDemo: false,
        status: 'draft',
        postedAt: Date.now(),
        deadline: Date.now() + 30 * 86400000,
        vacancies: 1,
        ...j,
      } as Job;
      await persistJobs([result, ...jobs]);
      logAudit(user?.email ?? 'admin', 'Created job: ' + result.title);
      if (result.status === 'published') await broadcastNewJob(result);
    }
    return result;
  };

  const broadcastNewJob = async (j: Job) => {
    const n: AppNotification = {
      id: uid('ntf'),
      title: 'New Job: ' + j.title,
      body: `${j.company} • ${j.location} • ${j.salary}`,
      type: 'job',
      read: false,
      createdAt: Date.now(),
    };
    setNotifications((prev) => {
      const next = [n, ...prev];
      write(K.notifs, next);
      return next;
    });
  };

  const deleteJob = async (id: string) => {
    const j = jobs.find((x) => x.id === id);
    await persistJobs(jobs.filter((x) => x.id !== id));
    logAudit(user?.email ?? 'admin', 'Deleted job: ' + (j?.title ?? id));
  };

  const setJobStatus = async (id: string, status: Job['status']) => {
    const j = jobs.find((x) => x.id === id);
    await persistJobs(jobs.map((x) => (x.id === id ? { ...x, status } : x)));
    logAudit(user?.email ?? 'admin', `Set job "${j?.title}" -> ${status}`);
    if (status === 'published' && j) await broadcastNewJob({ ...j, status });
  };

  const duplicateJob = async (id: string) => {
    const j = jobs.find((x) => x.id === id);
    if (!j) return;
    const copy: Job = {
      ...j,
      id: uid('job'),
      title: j.title + ' (Copy)',
      status: 'draft',
      isDemo: false,
      postedAt: Date.now(),
    };
    await persistJobs([copy, ...jobs]);
    logAudit(user?.email ?? 'admin', 'Duplicated job: ' + j.title);
  };

  // ---------- APPLICATIONS ----------
  const hasApplied = (jobId: string) =>
    !!user && applications.some((a) => a.jobId === jobId && a.userId === user.id);

  const apply: Ctx['apply'] = async (jobId, resumeName, cover) => {
    if (!user) return { ok: false, error: 'Please login to apply' };
    if (hasApplied(jobId)) return { ok: false, error: 'You have already applied' };
    const app: Application = {
      id: uid('app'),
      jobId,
      userId: user.id,
      resumeName,
      coverLetter: cover,
      status: 'Applied',
      appliedAt: Date.now(),
      history: [{ status: 'Applied', at: Date.now() }],
    };
    const next = [app, ...applications];
    setApplications(next);
    await write(K.apps, next);
    const job = jobs.find((j) => j.id === jobId);
    await pushToUser(user.id, {
      title: 'Application Submitted ✅',
      body: `Your application for ${job?.title ?? 'the job'} has been submitted.`,
      type: 'status',
    });
    logAudit(user.email, 'Applied to job: ' + (job?.title ?? jobId));
    return { ok: true };
  };

  const pushToUser = async (
    userId: string,
    n: { title: string; body: string; type: AppNotification['type'] }
  ) => {
    const notif: AppNotification = {
      id: uid('ntf'),
      userId,
      read: false,
      createdAt: Date.now(),
      ...n,
    };
    setNotifications((prev) => {
      const next = [notif, ...prev];
      write(K.notifs, next);
      return next;
    });
  };

  const setAppStatus: Ctx['setAppStatus'] = async (appId, status, note) => {
    const target = applications.find((a) => a.id === appId);
    if (!target) return;
    const next = applications.map((a) =>
      a.id === appId
        ? {
            ...a,
            status,
            history: [...a.history, { status, at: Date.now(), note }],
          }
        : a
    );
    setApplications(next);
    await write(K.apps, next);
    const job = jobs.find((j) => j.id === target.jobId);
    await pushToUser(target.userId, {
      title:
        status === 'Interview'
          ? 'Interview Scheduled 📅'
          : 'Application Update',
      body: `Your application for ${job?.title ?? 'a job'} is now "${status}".${
        note ? ' Note: ' + note : ''
      }`,
      type: status === 'Interview' ? 'interview' : 'status',
    });
    logAudit(user?.email ?? 'admin', `App ${appId} -> ${status}`);
  };

  // ---------- SAVED ----------
  const isSaved = (jobId: string) =>
    !!user && saved.some((s) => s.jobId === jobId && s.userId === user.id);

  const toggleSave = async (jobId: string) => {
    if (!user) return;
    let next: SavedJob[];
    if (isSaved(jobId)) {
      next = saved.filter((s) => !(s.jobId === jobId && s.userId === user.id));
    } else {
      next = [
        { id: uid('sav'), jobId, userId: user.id, savedAt: Date.now() },
        ...saved,
      ];
    }
    setSaved(next);
    await write(K.saved, next);
  };

  // ---------- NOTIFICATIONS ----------
  const markNotifRead = async (id: string) => {
    const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(next);
    await write(K.notifs, next);
  };
  const markAllRead = async () => {
    const next = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(next);
    await write(K.notifs, next);
  };
  const sendNotification: Ctx['sendNotification'] = async (n) => {
    const notif: AppNotification = {
      id: uid('ntf'),
      read: false,
      createdAt: Date.now(),
      ...n,
    };
    const next = [notif, ...notifications];
    setNotifications(next);
    await write(K.notifs, next);
    logAudit(user?.email ?? 'admin', 'Sent notification: ' + n.title);
  };

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return notifications.filter(
      (n) => !n.read && (n.userId === user.id || n.userId === undefined)
    ).length;
  }, [notifications, user]);

  // ---------- ADMIN SETTINGS / TAXONOMY ----------
  const updateSettings: Ctx['updateSettings'] = async (s) => {
    const next = { ...settings, ...s };
    setSettings(next);
    await write(K.settings, next);
    logAudit(user?.email ?? 'admin', 'Updated settings');
  };
  const addCategory = async (name: string) => {
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    const next = [...categories, { name, icon: 'pricetag', color: '#1D4ED8' }];
    setCategories(next);
    await write(K.categories, next);
  };
  const removeCategory = async (name: string) => {
    const next = categories.filter((c) => c.name !== name);
    setCategories(next);
    await write(K.categories, next);
  };
  const addLocation = async (name: string) => {
    if (locations.some((l) => l.toLowerCase() === name.toLowerCase())) return;
    const next = [...locations, name];
    setLocations(next);
    await write(K.locations, next);
  };
  const removeLocation = async (name: string) => {
    const next = locations.filter((l) => l !== name);
    setLocations(next);
    await write(K.locations, next);
  };

  const getProfileFor = (userId: string) => profiles[userId] ?? null;

  const resetDemo = async () => {
    await Promise.all(Object.values(K).map((k) => AsyncStorage.removeItem(k)));
    // reload page on web / re-seed
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  };

  // proxy saveProfile to also allow updating user core fields via special keys
  const saveProfileWrapped: Ctx['saveProfile'] = async (p: any) => {
    const { _name, _phone, _email, ...rest } = p;
    if (_name !== undefined || _phone !== undefined || _email !== undefined) {
      await updateUserFields({
        ...(_name !== undefined ? { name: _name } : {}),
        ...(_phone !== undefined ? { phone: _phone } : {}),
        ...(_email !== undefined ? { email: _email } : {}),
      });
    }
    if (Object.keys(rest).length) await saveProfile(rest);
  };

  const value: Ctx = {
    loading,
    user,
    profile,
    users,
    jobs,
    applications,
    saved,
    notifications,
    audit,
    settings,
    categories,
    locations,
    register,
    login,
    logout,
    resetPassword,
    saveProfile: saveProfileWrapped,
    setResume,
    profileCompletion,
    deleteAccount,
    upsertJob,
    deleteJob,
    setJobStatus,
    duplicateJob,
    apply,
    hasApplied,
    setAppStatus,
    toggleSave,
    isSaved,
    markNotifRead,
    markAllRead,
    sendNotification,
    unreadCount,
    updateSettings,
    addCategory,
    removeCategory,
    addLocation,
    removeLocation,
    getProfileFor,
    resetDemo,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// ---------- demo builders ----------
function buildDemoSeekers() {
  const base = [
    {
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      phone: '9876500001',
      location: 'Raigarh',
      education: 'ITI Fitter',
      skills: ['Fitter', 'Machine Maintenance', 'Safety'],
      experience: '2 years',
      about: 'ITI Fitter looking for plant maintenance roles in Raigarh.',
      photo: undefined,
    },
    {
      name: 'Priya Sahu',
      email: 'priya.sahu@example.com',
      phone: '9876500002',
      location: 'Raigarh',
      education: 'B.Sc Nursing',
      skills: ['Patient Care', 'Emergency', 'Injections'],
      experience: '3 years',
      about: 'Experienced staff nurse seeking hospital opportunities.',
    },
    {
      name: 'Amit Patel',
      email: 'amit.patel@example.com',
      phone: '9876500003',
      location: 'Kharsia',
      education: 'B.Tech (CS)',
      skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
      experience: '3 years',
      about: 'Full stack developer, open to remote roles.',
    },
    {
      name: 'Sunita Yadav',
      email: 'sunita.yadav@example.com',
      phone: '9876500004',
      location: 'Sarangarh',
      education: 'B.Com',
      skills: ['Tally ERP', 'GST', 'Excel'],
      experience: '4 years',
      about: 'Accountant with GST and Tally expertise.',
    },
    {
      name: 'Deepak Nair',
      email: 'deepak.nair@example.com',
      phone: '9876500005',
      location: 'Raigarh',
      education: 'B.Ed',
      skills: ['English', 'Lesson Planning', 'Classroom Management'],
      experience: '2 years',
      about: 'Primary school teacher passionate about early education.',
    },
  ];
  const users: User[] = [];
  const profiles: Record<string, SeekerProfile> = {};
  base.forEach((b, i) => {
    const id = 'demo_seeker_' + (i + 1);
    users.push({
      id,
      role: 'seeker',
      name: b.name,
      email: b.email,
      phone: b.phone,
      password: hashPassword('password'),
      createdAt: Date.now() - (i + 1) * 3 * 86400000,
    });
    profiles[id] = {
      userId: id,
      location: b.location,
      about: b.about,
      education: b.education,
      skills: b.skills,
      experience: b.experience,
      certifications: ['Certificate of Completion'],
      languages: ['Hindi', 'English'],
      resume: {
        id: uid('res'),
        name: b.name.split(' ')[0].toLowerCase() + '_resume.pdf',
        mimeType: 'application/pdf',
        size: 145000,
        uri: 'demo://resume',
        uploadedAt: Date.now(),
      },
      photo: b.photo,
      updatedAt: Date.now(),
    };
  });
  return { users, profiles };
}

function buildDemoApplications(jobs: Job[], seekers: User[]): Application[] {
  const statuses: AppStatus[] = [
    'Applied',
    'Under Review',
    'Shortlisted',
    'Interview',
    'Selected',
    'Rejected',
  ];
  const apps: Application[] = [];
  seekers.forEach((s, i) => {
    const picks = jobs.slice(i, i + 2);
    picks.forEach((job, k) => {
      const status = statuses[(i + k) % statuses.length];
      const flowIdx = ['Applied', 'Under Review', 'Shortlisted', 'Interview'].indexOf(
        status
      );
      const history = [] as Application['history'];
      const chain = ['Applied', 'Under Review', 'Shortlisted', 'Interview'];
      const upTo = flowIdx >= 0 ? flowIdx : chain.length - 1;
      for (let x = 0; x <= upTo; x++)
        history.push({ status: chain[x] as AppStatus, at: Date.now() - (upTo - x) * 86400000 });
      if (status === 'Selected' || status === 'Rejected')
        history.push({ status, at: Date.now() });
      apps.push({
        id: uid('app'),
        jobId: job.id,
        userId: s.id,
        resumeName: s.name.split(' ')[0].toLowerCase() + '_resume.pdf',
        coverLetter: 'I am interested in this role and believe I am a good fit.',
        status,
        appliedAt: Date.now() - (i + k + 1) * 86400000,
        history,
      });
    });
  });
  return apps;
}

function buildDemoNotifications(): AppNotification[] {
  return [
    {
      id: uid('ntf'),
      title: 'Welcome to Jobs at Raigarh',
      body: 'New jobs are added every day. Turn on notifications to never miss one.',
      type: 'announcement',
      read: false,
      createdAt: Date.now() - 86400000,
    },
  ];
}
