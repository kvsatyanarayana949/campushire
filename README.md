# CampusHire – Smart Placement & Recruitment Management Platform

[![Live Frontend](https://img.shields.io/badge/Live_App-campushire--mu.vercel.app-blue?style=flat-square&logo=vercel)](https://campushire-mu.vercel.app)
[![Live Backend API](https://img.shields.io/badge/Live_API-campushire--satya--backend.onrender.com-46E3B7?style=flat-square&logo=render)](https://campushire-satya-backend.onrender.com/api/health)
[![GitHub Repository](https://img.shields.io/badge/GitHub-campushire-181717?style=flat-square&logo=github)](https://github.com/kvsatyanarayana949/campushire)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/Node.js-v18+-green.svg?style=flat-square&logo=node.js)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/React-18-blue.svg?style=flat-square&logo=react)](https://react.dev)
[![MySQL Version](https://img.shields.io/badge/MySQL-8.0+-orange.svg?style=flat-square&logo=mysql)](https://www.mysql.com)
[![Test Suite](https://img.shields.io/badge/Tests-52%20Passed%20(100%25)-success?style=flat-square)](https://github.com/kvsatyanarayana949/campushire)

CampusHire is a production-grade, full-stack campus recruitment and placement automation SaaS platform. It bridges university candidates, corporate recruiters, and institutional placement cell administrators through automated backend academic eligibility validation, real-time application pipelines, interview scheduling, and placement analytics.

---

## 🌐 Live Deployments & Endpoints

| Component | Provider | Live URL | Status |
|---|---|---|---|
| **Web Client (SPA)** | Vercel Hobby | [https://campushire-mu.vercel.app](https://campushire-mu.vercel.app) | `200 OK` |
| **REST API Server** | Render Free Web Service | [https://campushire-satya-backend.onrender.com](https://campushire-satya-backend.onrender.com) | `200 OK` |
| **Health Check** | Render | [https://campushire-satya-backend.onrender.com/api/health](https://campushire-satya-backend.onrender.com/api/health) | `{"status":"UP"}` |
| **Jobs Catalog API** | Render | [https://campushire-satya-backend.onrender.com/api/jobs](https://campushire-satya-backend.onrender.com/api/jobs) | `200 OK` |
| **Cloud Database** | TiDB Cloud Serverless | Distributed MySQL 8.0 compatible | Connected (SSL) |

---

## Table of Contents

1. [Key Features](#1-key-features)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Design & Schema](#4-database-design--schema)
5. [Eligibility Engine (Core Business Logic)](#5-eligibility-engine-core-business-logic)
6. [Security & Production Engineering](#6-security--production-engineering)
7. [API Documentation](#7-api-documentation)
8. [Installation & Local Setup](#8-installation--local-setup)
9. [Environment Configuration](#9-environment-configuration)
10. [Automated Testing Suite (52 Tests)](#10-automated-testing-suite-52-tests)
11. [Demo Credentials](#11-demo-credentials)
12. [Zero-Cost Cloud Deployment Guide](#12-zero-cost-cloud-deployment-guide)
13. [Fresher & SDE Technical Interview Walkthrough](#13-fresher--sde-technical-interview-walkthrough)

---

## 1. Key Features

### For Students
- **Candidate Onboarding & Academic Profile**: Academic record tracking including verified CGPA, department, roll number, active backlogs count, graduation batch, and resume URL.
- **Technical Skills Matrix**: Tag programming languages, frameworks, and databases with proficiency levels (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
- **Real-Time Eligibility Checker**: Instantly evaluate qualifications against job postings with an itemized breakdown comparing CGPA, backlogs, and missing skills.
- **Duplicate Application Prevention**: Dual-layer protection (frontend validation and database-level unique constraints) ensuring students cannot apply more than once to any drive.
- **Application Pipeline Tracking**: Track application lifecycle across 5 stages (`APPLIED` → `UNDER_REVIEW` → `SHORTLISTED` → `SELECTED` / `REJECTED`).
- **Application Withdrawal**: Safe withdrawal of active submissions prior to recruiter review.
- **Interview Notifications**: Instant alerts with interview schedules and video meeting links.

### For Corporate Recruiters
- **Company Recruitment Workspace**: Manage company branding, headquarters, industry, and description.
- **Configurable Campus Drives**: Publish job openings with custom academic eligibility thresholds (minimum CGPA, active backlog cap, eligible graduation batch, degrees, and departments).
- **Candidate Pipeline Review**: Filter applicants by status, review student academic transcripts and technical skills, and access resume documents.
- **Status Transitions & Interview Scheduling**: Advance candidates across recruitment stages, set interview dates, and attach meeting URLs.
- **Student Talent Directory**: Search and explore candidate pools across the university.

### For Placement Administrators
- **Placement Analytics Console**: Interactive charts powered by Recharts visualizing department-wise enrolled vs. placed students and application status distribution.
- **Institutional Oversight**: Monitor all corporate drives, candidate applications, and offer acceptance velocity.
- **User Management**: Search, audit, and toggle active/inactive account status with safety locks against self-deactivation.
- **Credential & Session Management**: Secure admin password rotation with pessimistic row locking and atomic session invalidation.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 (Vite build tool)
- **Language**: JavaScript (ES6+)
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with automatic JWT request interceptors
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Responsive bar and distribution charts)
- **Global State**: React Context API (`AuthContext`, `ToastContext`)

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Architecture**: Modular Controller-Service-Repository REST API
- **Authentication**: Stateless JSON Web Tokens (JWT) with database-backed `token_version` session revocation
- **Password Hashing**: bcryptjs (10 salt rounds)
- **Concurrency Control**: MySQL pessimistic row locking (`SELECT ... FOR UPDATE`)
- **Request Validation**: express-validator middleware
- **Security**: Helmet security headers, strict CORS origin whitelisting, express-rate-limit brute force protection

### Database
- **Engine**: MySQL 8.0+ / TiDB Cloud Serverless (Distributed MySQL 8.0 Wire-Compatible)
- **Driver**: mysql2 with Promise API and connection pooling
- **Integrity**: Parameterized SQL queries, foreign key cascading constraints, unique compound indexes, and ACID transactions for multi-table updates.

---

## 3. System Architecture

```
CampusHire Platform Architecture
│
├── client/ (React 18 + Vite SPA on Vercel)
│   ├── src/
│   │   ├── api/             # Axios instance & JWT request interceptors
│   │   ├── context/         # AuthContext (session state) & ToastContext
│   │   ├── components/      # Reusable UI primitives (Badge, Modal, Skeletons)
│   │   ├── layouts/         # MainLayout (Public) & DashboardLayout (Protected)
│   │   └── pages/
│   │       ├── public/      # Landing, Jobs Catalog, Job Details, Login, Register
│   │       ├── student/     # Student Dashboard, Profile, Applications, Alerts
│   │       ├── recruiter/   # Recruiter Dashboard, Post Job, Pipeline Manager
│   │       └── admin/       # Placement Analytics, User Management, Audit Logs
│
├── server/ (Node.js + Express REST API on Render)
│   ├── database/
│   │   ├── schema.sql       # Authoritative 3NF relational schema
│   │   ├── seed.sql         # Realistic demo seed dataset
│   │   └── init.js          # Idempotent, race-safe migration engine
│   ├── src/
│   │   ├── config/          # Centralized JWT config (jwt.js) & MySQL pool (db.js)
│   │   ├── controllers/     # auth, student, recruiter, company, job, app, admin
│   │   ├── middleware/      # auth (JWT + token_version), roles (RBAC), errorHandler
│   │   ├── routes/          # Express route routers
│   │   ├── services/        # eligibilityService (Core Evaluation Engine)
│   │   ├── utils/           # Standardized API response formatters
│   │   ├── validators/      # express-validator schemas
│   │   ├── app.js           # Express app configuration & fail-fast checks
│   │   └── server.js        # HTTP server entrypoint
│   └── tests/               # 52 automated tests with isolation guard
│       ├── testGuard.js     # Production DB safety barrier
│       ├── jwtConfig.test.js
│       ├── migration.test.js
│       ├── passwordSecurity.test.js
│       └── api.test.js
```

---

## 4. Database Design & Schema

Normalized 3NF relational schema with 9 primary tables:

1. **`users`**: Identity table storing name, email (unique index), bcrypt password hash, role (`STUDENT`, `RECRUITER`, `ADMIN`), account active flag, and `token_version` (INT NOT NULL DEFAULT 0).
2. **`companies`**: Organization profiles created by recruiters or administrators.
3. **`student_profiles`**: 1-to-1 relationship with `users` (`user_id` FK). Holds roll number, degree, department, CGPA, active backlogs, graduation year, phone, and resume URL.
4. **`student_skills`**: Many-to-1 with `student_profiles`. Stores skill names and proficiency (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`) with composite unique constraint `(student_id, skill_name)`.
5. **`recruiter_profiles`**: 1-to-1 with `users`. Associates recruiter with their `companies` organization and designation.
6. **`jobs`**: Job postings specifying title, description, job type, salary range, academic cutoffs (`min_cgpa`, `max_backlogs`, `eligible_graduation_year`, `eligible_degrees`, `eligible_departments`), `required_skills`, and deadline date.
7. **`applications`**: Junction table between `jobs` and `users` (student). Enforces unique composite constraint `uq_job_student (job_id, student_id)` to prevent duplicate applications.
8. **`interviews`**: Scheduled interview records linked to applications with datetime, mode, and video link.
9. **`notifications`**: Real-time user alert records for application status transitions and interview invitations.

---

## 5. Eligibility Engine (Core Business Logic)

Located in `server/src/services/eligibilityService.js`, the eligibility engine performs server-side candidate evaluation:

$$\text{isEligible} = (\text{CGPA} \ge \text{min\_cgpa}) \land (\text{Backlogs} \le \text{max\_backlogs}) \land (\text{GradYear Match}) \land (\text{Degree Match}) \land (\text{Skills Match})$$

### Checks Performed:
1. **CGPA Threshold**: Compares student CGPA against job's minimum cutoff.
2. **Backlog Cap**: Verifies student active backlogs does not exceed job's maximum limit.
3. **Graduation Batch**: If specified, checks student's graduation year.
4. **Degree & Department Alignment**: Checks if student's degree/department matches approved list or `All Departments`.
5. **Technical Skills Matching**: Compares student's skills against job's required skills. Identifies matched skills and missing skills.
6. **Zero-Trust Backend Verification**: The submission handler `POST /api/applications` re-evaluates all criteria server-side against authoritative database records before accepting submissions.

---

## 6. Security & Production Engineering

### 1. Database-Backed `token_version` Session Revocation
- Every user row in the database maintains an integer `token_version` column (default `0`).
- Every issued JWT embeds `tokenVersion: user.token_version`.
- The authentication middleware (`server/src/middleware/auth.js`) checks:
  ```javascript
  if (user.token_version !== decoded.tokenVersion) {
    return res.status(401).json({ success: false, message: 'Session revoked. Please log in again.' });
  }
  ```
- When an administrator rotates their password, the database updates the password hash and atomically increments `token_version` in a single transaction. All previously issued tokens are immediately rejected across all devices without requiring stateful Redis clusters.

### 2. Pessimistic Concurrency Control
- In `server/src/controllers/adminController.js`, password changes acquire a pessimistic row-level write lock:
  ```sql
  SELECT id, password_hash, token_version FROM users WHERE id = ? FOR UPDATE;
  ```
- The subsequent update uses optimistic locking verification:
  ```sql
  UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ? AND token_version = ?;
  ```
- This prevents two concurrent requests from verifying the same old password and causing race condition overwrites.

### 3. Idempotent & Race-Safe Migration Engine
- `server/database/init.js` features `verifyAndMigrateTokenVersion` to safely handle multi-instance container startups:
  1. Queries `information_schema.columns` to check if `token_version` exists.
  2. If missing, attempts `ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0`.
  3. If another backend container runs `ALTER TABLE` concurrently, the error is caught and the schema is re-verified.
  4. Enforces strict type validation using `/^int(\(\d+\))?$/` and signedness checks (rejecting unsigned types or missing defaults).
  5. Any unrecoverable database or migration error halts startup immediately with a non-zero exit code (`process.exit(1)`).

### 4. Fail-Fast Centralized JWT Secret Enforcement
- Centralized in `server/src/config/jwt.js` through `getJwtSecret()`.
- Stripped all hardcoded fallback keys. If `JWT_SECRET` is missing, undefined, or empty, the backend fails fast at boot time before accepting any HTTP requests.

### 5. Automated Database Isolation Guard
- `server/tests/testGuard.js` inspects database connection targets before any test suite executes.
- If `DB_HOST` points to TiDB Cloud, AWS, Render, or any remote IP, test execution aborts immediately to protect production data integrity.

---

## 7. API Documentation

All API responses follow a uniform JSON envelope:

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

### Authentication Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register Student or Recruiter account with profile |
| `POST` | `/api/auth/login` | Public | Authenticate user, return JWT and profile details |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user session and permissions |

### Job Management Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/jobs` | Public | List active jobs with search, filters, and pagination |
| `GET` | `/api/jobs/:id` | Public | Get position details and company overview |
| `GET` | `/api/jobs/:id/eligibility` | Student | Audit student eligibility against criteria |
| `POST` | `/api/jobs` | Recruiter, Admin | Publish new campus recruitment drive |
| `PUT` | `/api/jobs/:id` | Recruiter (Owner), Admin | Update job opening specifications |
| `DELETE` | `/api/jobs/:id` | Recruiter (Owner), Admin | Archive and close job posting |

### Application Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/applications` | Student | Submit application with backend eligibility check |
| `GET` | `/api/applications/my-applications` | Student | View candidate's applications and status |
| `GET` | `/api/applications/job/:jobId` | Recruiter (Owner), Admin | View applicants for a specific position |
| `PATCH` | `/api/applications/:id/status` | Recruiter, Admin | Update status and schedule interviews |
| `DELETE` | `/api/applications/:id` | Student, Admin | Withdraw application (if in `APPLIED` status) |

### Administrative Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin | Comprehensive placement metrics and chart data |
| `GET` | `/api/admin/users` | Admin | Paginated user accounts list |
| `PATCH` | `/api/admin/users/:id/toggle-status` | Admin | Activate or deactivate user credentials |
| `POST` | `/api/admin/change-password` | Admin | Rotate admin credentials with row locking & session revocation |
| `GET` | `/api/admin/jobs` | Admin | Institutional job openings audit |
| `GET` | `/api/admin/applications` | Admin | Global applications tracking pool |

---

## 8. Installation & Local Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MySQL Server 8.0+ running locally (or cloud MySQL instance)

### Step 1: Clone Repository
```bash
git clone https://github.com/kvsatyanarayana949/campushire.git
cd campushire
```

### Step 2: Install Dependencies
```bash
npm run install:all
```
*(Installs dependencies across root, server, and client)*

### Step 3: Configure Local Environment
Create `server/.env` and `client/.env` files (refer to Section 9 below).

### Step 4: Initialize Local Database
```bash
npm run db:init
```
*(Executes `schema.sql`, applies migrations, and seeds realistic demo data)*

### Step 5: Start Development Servers
```bash
# Terminal 1: Backend API (port 5000)
npm run server

# Terminal 2: Frontend Client (port 5173)
npm run client
```

---

## 9. Environment Configuration

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_password
DB_NAME=campushire_db
JWT_SECRET=your_secure_development_jwt_secret_min_32_characters
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 10. Automated Testing Suite (52 Tests)

CampusHire includes 5 comprehensive automated test suites covering integration, security, migration concurrency, and isolation:

```bash
npm --prefix server test
```

### Test Suite Summary:
```
▶ CampusHire Full-Stack Backend Integration Tests (14 tests)
  ✔ 1. Health check endpoint responds with 200 OK
  ✔ 2. Student Login with demo credentials returns JWT and student profile
  ✔ 3. Recruiter Login returns JWT and company information
  ✔ 4. Admin Login returns JWT and admin role privileges
  ✔ 5. Student cannot access Admin dashboard (RBAC Enforcement)
  ✔ 6. Admin can fetch comprehensive placement analytics dashboard
  ✔ 7. Jobs listing returns paginated active openings
  ✔ 8. Recruiter can post a new verified job opening
  ✔ 9. Eligibility Engine accurately verifies eligible student
  ✔ 10. Eligible student applies for the newly created job
  ✔ 11. Duplicate application prevention: student cannot apply twice for same job
  ✔ 12. Ineligible student is rejected by backend eligibility engine
  ✔ 13. Recruiter views applicants and updates application status to SHORTLISTED
  ✔ 14. Student receives real-time notification on application status change

▶ JWT Configuration & Secret Enforcement Suite (8 tests)
  ✔ 1. Missing JWT_SECRET: startup/configuration fails with clear fatal error
  ✔ 2. Empty or whitespace JWT_SECRET: startup/configuration fails with clear fatal error
  ✔ 3. Valid JWT_SECRET: configuration succeeds and returns trimmed secret
  ✔ 4. Signing and verification use the same configured secret
  ✔ 5. A token signed using a different secret is rejected (invalid signature)
  ✔ 6. No hardcoded fallback remains anywhere in the backend source code
  ✔ 7. Secret value is never leaked in exception messages
  ✔ Cleanup: Restore environment

▶ Database Migration & Concurrency Suite (Isolated Local Tables) (8 tests)
  ✔ 1. Column already exists with correct definition (INT NOT NULL DEFAULT 0)
  ✔ 2. Column is missing and gets created successfully with valid definition
  ✔ 3. Concurrent migration race: Instance A creates column, Instance B fails ALTER TABLE but recovers via schema recheck
  ✔ 4. ALTER TABLE fails and column remains missing: startup fails (throws FATAL error)
  ✔ 5. Column exists with an incorrect definition: startup fails (throws FATAL error)
  ✔ 6. Schema recheck itself fails: startup fails (throws FATAL error)
  ✔ 7. Column exists with incorrect signedness (INT UNSIGNED): startup fails (throws FATAL error)
  ✔ 8. Genuine two-connection migration race: two real connections attempt migration simultaneously and both succeed

▶ Admin Password Change & Database-Backed Token Version Security Suite (17 tests)
  ✔ 1. Unauthenticated request to /api/admin/change-password is rejected (401)
  ✔ 2. Student role cannot access /api/admin/change-password (403 RBAC)
  ✔ 3. Recruiter role cannot access /api/admin/change-password (403 RBAC)
  ✔ 4. Test admin logs in: token contains tokenVersion = 0 and no password hash
  ✔ 5. Validation error: Missing required fields rejected (422)
  ✔ 6. Validation error: Weak password rejected (422)
  ✔ 7. Validation error: New password identical to current password rejected (422)
  ✔ 8. Failed password change does NOT increment token_version or alter stored password hash
  ✔ 9. Successful password change increments token_version to 1 and returns fresh JWT (200)
  ✔ 10. JWT Session Revocation: Old JWT token (version 0) is immediately rejected (401)
  ✔ 11. Legacy token without tokenVersion claim is also rejected (401)
  ✔ 12. Newly issued JWT token (version 1) is valid and accesses protected admin routes (200)
  ✔ 13. Login with old password fails (401)
  ✔ 14. Login with new password succeeds and returns token with tokenVersion = 1 (200)
  ✔ 15. Student & Recruiter authorization behavior remains completely unchanged
  ✔ 16. Route canonicalization: redundant /api/auth/change-password does not exist (404)
  ✔ 17. Concurrent password-change protection: only one concurrent request succeeds and token_version increments exactly once

▶ Test Environment Isolation Guard Suite (5 tests)
  ✔ 1. Passes when connected to local loopback (127.0.0.1:3306)
  ✔ 2. Throws fatal safety violation when DB_HOST contains tidbcloud
  ✔ 3. Throws fatal safety violation when DB_PORT is 4000
  ✔ 4. Throws fatal safety violation when DB_HOST is an external IP or remote server
  ✔ Cleanup: Restore test environment

ℹ tests 52 | pass 52 | fail 0 | cancelled 0 | skipped 0
```

---

## 11. Demo Credentials

Pre-seeded accounts for evaluation on the [Live Web Application](https://campushire-mu.vercel.app):

| Role | Name | Email | Password | Autofill on Login Page |
|---|---|---|---|---|
| **Student (Eligible)** | Rohit Verma | `rohit.verma@student.edu` | `Password@123` | ✅ 1-Click Button |
| **Recruiter** | Priya Sharma | `priya.sharma@nexuscloud.com` | `Password@123` | ✅ 1-Click Button |
| **Administrator** | System Admin | `admin@campushire.io` | `Password@123` | 🔒 Manual Entry (Least-Privilege Security) |

> **Security Note**: The administrator account requires manual credential entry by design. Hardcoded admin autofill credentials have been intentionally excised from the production frontend bundle to adhere to production security standards.

---

## 12. Zero-Cost Cloud Deployment Guide

CampusHire is engineered for 100% free-tier cloud hosting:

1. **Database: TiDB Cloud Serverless (Free Forever)**
   - 5GB free storage, auto-scaling compute, full MySQL 8.0 wire compatibility, TLS/SSL encryption.
2. **Backend: Render Free Web Service**
   - Free Node.js web service. Automatic deployment on push to `main`.
   - Start command: `node database/init.js && npm start` (runs idempotent migrations automatically).
3. **Frontend: Vercel Hobby (Free Forever)**
   - Vite React SPA static deployment with global edge CDN distribution and auto HTTPS.

---

## 13. Fresher & SDE Technical Interview Walkthrough

### 1. How does CampusHire implement instant session revocation with stateless JWTs?
Standard JWTs are self-contained and stateless, meaning once issued, a token remains valid until it expires even if the user's password is changed or compromised. CampusHire solves this with a lightweight **database-backed `token_version`**:
- Each user record holds an integer `token_version` (starting at 0).
- When a JWT is signed, `tokenVersion` is embedded into the payload.
- Authentication middleware retrieves the user's current `token_version` from the database and asserts `tokenVersion === user.token_version`.
- When an admin rotates their password, the database updates the password hash and increments `token_version` in one atomic operation.
- Instantly, all previously issued tokens are rejected with HTTP 401 across all browsers and devices without needing an expensive, stateful Redis cache cluster.

### 2. How do you protect against race conditions during concurrent password updates?
CampusHire implements two complementary concurrency controls:
1. **Pessimistic Row Locking**: Uses `SELECT id, password_hash, token_version FROM users WHERE id = ? FOR UPDATE` inside an ACID transaction. If two requests arrive simultaneously, the second transaction is queued until the first completes.
2. **Optimistic Version Verification**: The update statement executes `UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ? AND token_version = ?`. If the version has already changed, the query matches 0 rows, triggering an immediate transaction rollback.

### 3. How does the automated migration handle multi-instance race conditions?
When deploying multiple container instances horizontally, all instances boot up simultaneously and run `node database/init.js`.
- If two instances execute `ALTER TABLE users ADD COLUMN token_version...` at the same time, MySQL gives a `Duplicate column name` error to the second instance.
- Rather than crashing, the migration engine catches this error, inspects `information_schema.columns`, and checks if the column now exists with the exact definition (`INT NOT NULL DEFAULT 0`).
- If confirmed, it logs that another instance completed the migration and startup continues successfully. If the column does not exist or has an invalid type, it halts startup with `process.exit(1)`.

### 4. How does CampusHire prevent duplicate applications?
Enforced at two distinct architectural layers:
1. **Application Logic**: The controller queries existing submissions for `(job_id, student_id)` before evaluating eligibility.
2. **Database Integrity**: The `applications` table enforces a composite unique key: `UNIQUE KEY uq_job_student (job_id, student_id)`. Under high-concurrency race conditions, MySQL rejects duplicates with error code `ER_DUP_ENTRY`, which the centralized error middleware intercepts and translates to a clean `409 Conflict`.

### 5. Why is the backend eligibility engine zero-trust?
Frontend checks can be bypassed by intercepting or scripting HTTP requests. CampusHire treats all frontend data as untrusted. When `POST /api/applications` receives a request, it ignores client assertions and queries authoritative student records from MySQL, evaluating CGPA cutoffs, active backlogs, graduation year, degree, and required technical skills. If any requirement fails, the submission is rejected with `403 Forbidden` and an itemized breakdown of unmet criteria.

---

## License

This project is licensed under the MIT License - open for educational and portfolio demonstration use.
