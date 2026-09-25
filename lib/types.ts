// ============================================================
// JOBS AT RAIGARH — Data Model / Types
// Mirrors the relational schema (see /db/schema.sql):
// users, job_seekers, jobs, companies, categories, locations,
// applications, resumes, saved_jobs, notifications,
// application_status_history, admin_users, audit_logs
// ============================================================

export type Role = 'admin' | 'seeker';

export type JobType =
  | 'Full Time'
  | 'Part Time'
  | 'Contract'
  | 'Apprenticeship'
  | 'Internship'
  | 'Work From Home';

export type JobStatus = 'draft' | 'published' | 'closed';

export type AppStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview'
  | 'Selected'
  | 'Rejected';

export const APP_STATUS_FLOW: AppStatus[] = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Selected',
];

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  password: string; // stored hashed (see hashPassword)
  createdAt: number;
}

export interface Resume {
  id: string;
  name: string; // file name
  mimeType: string;
  size: number; // bytes
  uri: string; // local/secure uri (private)
  uploadedAt: number;
}

export interface SeekerProfile {
  userId: string;
  photo?: string;
  location: string;
  about: string;
  education: string;
  skills: string[];
  experience: string; // e.g. "3 years"
  certifications: string[];
  languages: string[];
  resume?: Resume | null;
  updatedAt: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  logo?: string; // emoji or url
  location: string;
  category: string;
  jobType: JobType;
  salary: string;
  experience: string;
  education: string;
  skills: string[];
  vacancies: number;
  description: string;
  responsibilities: string[];
  benefits: string[];
  qualification: string;
  contact: string;
  postedAt: number;
  deadline: number;
  status: JobStatus;
  featured: boolean;
  isDemo: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  resumeName?: string;
  coverLetter?: string;
  status: AppStatus;
  appliedAt: number;
  history: { status: AppStatus; at: number; note?: string }[];
}

export interface SavedJob {
  id: string;
  jobId: string;
  userId: string;
  savedAt: number;
}

export interface AppNotification {
  id: string;
  userId?: string; // undefined = broadcast to all seekers
  title: string;
  body: string;
  type: 'job' | 'status' | 'interview' | 'announcement' | 'system';
  read: boolean;
  createdAt: number;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  at: number;
}

export interface Settings {
  brand: string;
  tagline: string;
  founder: string;
  email: string;
  phone: string;
  address: string;
  about: string;
}
