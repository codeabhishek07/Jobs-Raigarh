-- ============================================================
-- JOBS AT RAIGARH — PostgreSQL Schema
-- Founder: Abhishek Swarnkar  |  Raigarh, Chhattisgarh, India
-- ============================================================
-- This schema backs the mobile app + admin panel. The Expo
-- client ships with an offline-first data layer (lib/store.tsx)
-- that mirrors these tables 1:1 so the same models can be moved
-- to a Node.js + Express + PostgreSQL backend without changes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Roles ----------
CREATE TYPE user_role AS ENUM ('admin', 'seeker');
CREATE TYPE job_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE job_type AS ENUM ('Full Time','Part Time','Contract','Apprenticeship','Internship','Work From Home');
CREATE TYPE app_status AS ENUM ('Applied','Under Review','Shortlisted','Interview','Selected','Rejected');

-- ---------- users ----------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL DEFAULT 'seeker',
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT UNIQUE,
  password_hash TEXT NOT NULL,               -- bcrypt / argon2, NEVER plaintext
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ---------- admin_users (extra admin metadata) ----------
CREATE TABLE admin_users (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_owner    BOOLEAN NOT NULL DEFAULT false,
  last_login  TIMESTAMPTZ
);

-- ---------- categories ----------
CREATE TABLE categories (
  id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name   TEXT UNIQUE NOT NULL,
  icon   TEXT,
  color  TEXT
);

-- ---------- locations ----------
CREATE TABLE locations (
  id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name   TEXT UNIQUE NOT NULL,
  state  TEXT DEFAULT 'Chhattisgarh'
);

-- ---------- companies ----------
CREATE TABLE companies (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name    TEXT NOT NULL,
  logo    TEXT,
  about   TEXT
);

-- ---------- job_seekers (profile) ----------
CREATE TABLE job_seekers (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  photo_url      TEXT,
  location       TEXT,
  about          TEXT,
  education      TEXT,
  skills         TEXT[] DEFAULT '{}',
  experience     TEXT,
  certifications TEXT[] DEFAULT '{}',
  languages      TEXT[] DEFAULT '{}',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- resumes (private storage) ----------
CREATE TABLE resumes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  mime_type    TEXT NOT NULL CHECK (mime_type IN (
                 'application/pdf',
                 'application/msword',
                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes   BIGINT NOT NULL,
  storage_key  TEXT NOT NULL,      -- private object-store key (S3/GCS), signed-URL only
  is_private   BOOLEAN NOT NULL DEFAULT true,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resumes_user ON resumes(user_id);

-- ---------- jobs ----------
CREATE TABLE jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  company          TEXT NOT NULL,
  logo             TEXT,
  location         TEXT NOT NULL,
  category         TEXT NOT NULL,
  job_type         job_type NOT NULL DEFAULT 'Full Time',
  salary           TEXT,
  experience       TEXT,
  education        TEXT,
  skills           TEXT[] DEFAULT '{}',
  vacancies        INT NOT NULL DEFAULT 1 CHECK (vacancies > 0),
  description      TEXT,
  responsibilities TEXT[] DEFAULT '{}',
  benefits         TEXT[] DEFAULT '{}',
  qualification    TEXT,
  contact          TEXT,
  status           job_status NOT NULL DEFAULT 'draft',
  featured         BOOLEAN NOT NULL DEFAULT false,
  is_demo          BOOLEAN NOT NULL DEFAULT false,
  posted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline         TIMESTAMPTZ NOT NULL,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_jobs_status   ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_deadline ON jobs(deadline);
CREATE INDEX idx_jobs_search   ON jobs USING gin (to_tsvector('simple', title || ' ' || company));

-- ---------- applications ----------
CREATE TABLE applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id    UUID REFERENCES resumes(id) ON DELETE SET NULL,
  cover_letter TEXT,
  status       app_status NOT NULL DEFAULT 'Applied',
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, user_id)   -- prevents duplicate applications
);
CREATE INDEX idx_apps_user   ON applications(user_id);
CREATE INDEX idx_apps_job    ON applications(job_id);
CREATE INDEX idx_apps_status ON applications(status);

-- ---------- application_status_history ----------
CREATE TABLE application_status_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status         app_status NOT NULL,
  note           TEXT,
  changed_by     UUID REFERENCES users(id),
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ash_app ON application_status_history(application_id);

-- ---------- saved_jobs ----------
CREATE TABLE saved_jobs (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id   UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

-- ---------- notifications ----------
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = broadcast
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'system',
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON notifications(user_id);

-- ---------- audit_logs ----------
CREATE TABLE audit_logs (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor     TEXT NOT NULL,
  action    TEXT NOT NULL,
  meta      JSONB,
  at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- settings (single-row consultancy config) ----------
CREATE TABLE settings (
  id       INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brand    TEXT NOT NULL DEFAULT 'Jobs at Raigarh',
  tagline  TEXT NOT NULL DEFAULT 'Connecting Talent with Opportunities',
  founder  TEXT NOT NULL DEFAULT 'Abhishek Swarnkar',
  email    TEXT NOT NULL DEFAULT 'abhixfactor@gmail.com',
  phone    TEXT,
  address  TEXT DEFAULT 'Raigarh, Chhattisgarh, India',
  about    TEXT
);

-- Auto-expire published jobs after deadline (run via cron/pg_cron):
--   UPDATE jobs SET status = 'closed'
--   WHERE status = 'published' AND deadline < now();
