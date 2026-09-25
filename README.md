# JOBS AT RAIGARH
### Connecting Talent with Opportunities
**Founder / Owner:** Abhishek Swarnkar · abhixfactor@gmail.com · Raigarh, Chhattisgarh, India

A production-ready, full-stack **job consultancy platform** for Android, iOS and Web, with a
responsive admin panel — built with **React Native + Expo + TypeScript**.

---

## 1. What's inside

| Layer | Tech | Location |
|-------|------|----------|
| Mobile app (iOS/Android) | React Native + Expo | `App.tsx`, `screens/`, `components/` |
| Responsive admin panel | React Native Web (auto layout ≥900px) | `screens/AdminScreen.tsx` |
| Data layer / "backend" | Offline-first store, AsyncStorage-backed, API-shaped | `lib/store.tsx` |
| Relational schema | PostgreSQL DDL | `db/schema.sql` |
| REST API contract | Documented endpoints | `docs/API.md` |
| Demo / seed data | Jobs, candidates, applications, categories | `lib/seed.ts` |

The app is **fully functional out of the box** — accounts, profiles, resume upload,
job search/filtering, online applications, live status tracking, notifications, the admin
dashboard, reports and CSV export all work without any server, using an offline-first
data layer that mirrors the PostgreSQL schema 1:1. To go server-backed, swap the
functions in `lib/store.tsx` for `fetch` calls against the API in `docs/API.md`.

---

## 2. Roles & demo accounts

| Role | Login | Password |
|------|-------|----------|
| **Admin / Owner** (Abhishek Swarnkar) | `abhixfactor@gmail.com` | `admin123` |
| **Job Seeker** (demo) | `rahul.verma@example.com` | `password` |

Or register a brand new job-seeker account from the app.

---

## 3. Run locally

```bash
npm install
npx expo start        # press i / a for iOS / Android, w for web
```

### Build for stores
```bash
npm install -g eas-cli
eas build --platform android      # .aab / .apk  (config in eas.json + app.json)
eas build --platform ios          # .ipa
```
`app.json` already defines the bundle identifiers, icons and adaptive icons.

### Web / admin deploy
```bash
npx expo export --platform all
# deploy the ./dist folder to any static host (Vercel/Netlify/S3)
```

---

## 4. Feature checklist

**Job Seeker** — register/login (email or mobile), forgot/reset password, create & edit
profile (photo, education, skills, experience, certifications, languages, about), upload /
replace / delete / preview resume (PDF, DOC, DOCX), search & filter jobs, job details,
apply online with cover letter, duplicate-application prevention, save/bookmark jobs,
track applications on a visual timeline, notifications.

**Admin** — secure login, dashboard with 8 KPI cards & 4 charts, full job CRUD
(draft/publish/edit/close/delete/duplicate, auto-expire on deadline), candidate directory
+ profile + resume view, application management with the full workflow
`Applied → Under Review → Shortlisted → Interview → Selected / Rejected`, category &
location management, broadcast notifications, reports with CSV/Excel export, editable
consultancy settings, and an audit log.

---

## 5. Security notes
Passwords are hashed (never stored in plaintext). Resumes are private and only shared with
the employer being applied to. Role-based access separates Admin and Job Seeker. The
PostgreSQL schema enforces unique constraints (no duplicate applications), foreign keys,
indexes and file-type checks. For production, store secrets in environment variables, use
bcrypt/argon2, signed URLs for resume downloads, rate limiting and input validation — see
`docs/API.md` and `.env.example`.

© Jobs at Raigarh · Founder: Abhishek Swarnkar
