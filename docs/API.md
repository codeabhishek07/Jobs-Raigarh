# JOBS AT RAIGARH — REST API Reference

Suggested backend: **Node.js + Express (or NestJS) + PostgreSQL**. Base URL `/api/v1`.
All responses are JSON. Protected routes require `Authorization: Bearer <JWT>`.
The mobile client's `lib/store.tsx` implements exactly these operations offline; point them
at this API to go server-backed.

## Auth
| Method | Endpoint | Body | Notes |
|--------|----------|------|-------|
| POST | `/auth/register` | name, email, phone, password | Job seeker sign-up |
| POST | `/auth/login` | emailOrPhone, password | Returns JWT + role |
| POST | `/auth/forgot` | emailOrPhone | Sends OTP / reset link |
| POST | `/auth/reset` | emailOrPhone, newPassword, otp? | Reset password |
| POST | `/auth/otp/request` | phone | Mobile OTP (if enabled) |
| POST | `/auth/otp/verify` | phone, otp | Verify OTP |
| POST | `/auth/logout` | — | Invalidate token |

## Profile (seeker)
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/me` | Current user + profile |
| PUT | `/me/profile` | Update profile fields |
| POST | `/me/resume` | Multipart upload (PDF/DOC/DOCX, private) |
| GET | `/me/resume` | Signed short-lived URL |
| DELETE | `/me/resume` | Remove resume |
| DELETE | `/me` | Delete account + all data |

## Jobs & Search
| Method | Endpoint | Query | Notes |
|--------|----------|-------|-------|
| GET | `/jobs` | q, category, location, jobType, experience, salary, education, datePosted, page, limit | Paginated, published only |
| GET | `/jobs/:id` | — | Job details |
| GET | `/jobs/featured` | — | Featured jobs |
| GET | `/jobs/recommended` | — | Based on skills/location/category |
| GET | `/categories` · `/locations` | — | Taxonomies |

## Applications & Saved
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/jobs/:id/apply` | resumeId, coverLetter — 409 on duplicate |
| GET | `/me/applications` | With status + history timeline |
| POST | `/jobs/:id/save` · DELETE `/jobs/:id/save` | Bookmark toggle |
| GET | `/me/saved` | Saved jobs |
| GET | `/me/notifications` · POST `/me/notifications/read` | Notifications |

## Admin (role = admin)
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/admin/dashboard` | KPI counts + chart series |
| POST/PUT/DELETE | `/admin/jobs[/:id]` | Job CRUD |
| POST | `/admin/jobs/:id/status` | draft/publish/close |
| POST | `/admin/jobs/:id/duplicate` | Duplicate |
| GET | `/admin/candidates` | Search candidates |
| GET | `/admin/candidates/:id/resume` | Signed download URL |
| GET | `/admin/applications` | Filter by status |
| POST | `/admin/applications/:id/status` | Change status (+ history) |
| POST/DELETE | `/admin/categories` · `/admin/locations` | Manage taxonomies |
| POST | `/admin/notifications` | Broadcast / segment (all, category, location) |
| GET | `/admin/reports` | Stats |
| GET | `/admin/reports/export.csv` | CSV/Excel export |
| PUT | `/admin/settings` | Contact/branding |

## Security middleware
Password hashing (bcrypt/argon2) · JWT auth · role guard · request validation (zod/Joi) ·
rate limiting · Helmet (XSS/headers) · parameterized queries (SQL-injection safe) ·
private resume storage with signed URLs · audit logging on every admin mutation ·
secrets via environment variables.
