# CampusHire – Smart Placement & Recruitment Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![MySQL Version](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com)
[![Vite](https://img.shields.io/badge/Bundler-Vite-purple.svg)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kvsatyanarayana949/campushire)

CampusHire is a production-grade, full-stack campus recruitment and placement automation SaaS platform. It bridges university candidates, corporate recruiters, and institutional placement cell administrators through automated backend academic eligibility validation, real-time application pipelines, interview scheduling, and placement analytics.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [Eligibility Engine (Core Business Logic)](#eligibility-engine-core-business-logic)
6. [API Documentation](#api-documentation)
7. [Installation & Local Setup](#installation--local-setup)
8. [Environment Configuration](#environment-configuration)
9. [Automated Testing Suite](#automated-testing-suite)
10. [Demo Accounts](#demo-accounts)
11. [Free Deployment Guide](#free-deployment-guide)
12. [Fresher Interview Technical Walkthrough](#fresher-interview-technical-walkthrough)

---

## 1. Key Features

### For Students
- **Candidate Onboarding & Profile**: Academic record tracking including verified CGPA, department, roll number, active backlogs count, graduation year, and resume link.
- **Technical Skills Matrix**: Tag programming languages and frameworks with proficiency levels (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
- **Real-Time Eligibility Checker**: Instantly evaluate qualifications against job postings with an itemized breakdown of CGPA comparison, backlogs check, and missing technical skills.
- **Duplicate Application Prevention**: Both frontend validation and MySQL database-level unique constraints ensure students cannot apply more than once to any drive.
- **Application Pipeline Tracking**: Track application lifecycle across 5 stages (`APPLIED` → `UNDER_REVIEW` → `SHORTLISTED` → `SELECTED` / `REJECTED`).
- **Application Withdrawal**: Withdraw active submissions prior to recruiter review.
- **Interview Notifications**: Receive instant notification alerts with interview schedules and video meeting links.

### For Corporate Recruiters
- **Company Recruitment Workspace**: Manage company branding, headquarters, industry, and description.
- **Configurable Campus Drives**: Publish job openings with custom academic eligibility thresholds (minimum CGPA, active backlog cap, eligible graduation batch, degrees, and departments).
- **Candidate Pipeline Review**: Filter applicants by status, review student academic transcripts and technical skills, and access resume documents.
- **Status Transitions & Interview Scheduling**: Advance candidates across recruitment stages, set interview dates, and attach meeting URLs.
- **Students Talent Directory**: Search and explore candidate pools across the university.

### For Placement Administrators
- **Placement Analytics Console**: Interactive charts powered by Recharts visualizing department-wise enrolled vs. placed students and application status distribution.
- **Institutional Oversight**: Monitor all corporate drives, candidate applications, and offer acceptance velocity.
- **User Management**: Search, audit, and toggle active/inactive account status with safety locks against self-deactivation.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 (Vite build tool)
- **Language**: JavaScript (ES6+)
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with automatic JWT interceptors
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Responsive bar and distribution charts)
- **Global State**: React Context API (`AuthContext`, `ToastContext`)

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Architecture**: Modular Controller-Service-Repository REST API
- **Authentication**: Stateless JSON Web Tokens (JWT)
- **Password Hashing**: bcryptjs (10 salt rounds)
- **Request Validation**: express-validator middleware
- **Security**: Helmet security headers, CORS origin whitelisting, express-rate-limit brute force protection

### Database
- **Engine**: MySQL 8.0+
- **Driver**: mysql2 with Promise API and connection pooling
- **Integrity**: Parameterized SQL queries, foreign key cascading constraints, unique compound indexes, and ACID transactions for multi-table updates.

---

## 3. System Architecture

```
CampusHire Platform
│
├── client/ (React + Vite SPA)
│   ├── src/
│   │   ├── api/             # Axios instance & JWT interceptors
│   │   ├── context/         # AuthContext & ToastContext
│   │   ├── components/      # Reusable UI system (Badge, Modal, Skeletons, etc.)
│   │   ├── layouts/         # MainLayout (Public) & DashboardLayout (Auth)
│   │   └── pages/
│   │       ├── public/      # Landing, Jobs, Details, Login, Registration
│   │       ├── student/     # Dashboard, Profile, Applications, Alerts
│   │       ├── recruiter/   # Dashboard, Post Job, Manage Jobs, Pipeline
│   │       └── admin/       # Analytics, User Management, Global Audit
│
├── server/ (Node.js + Express.js REST API)
│   ├── database/            # schema.sql, seed.sql, init.js
│   ├── src/
│   │   ├── config/          # MySQL connection pool (mysql2/promise)
│   │   ├── controllers/     # auth, student, recruiter, company, job, app, admin
│   │   ├── middleware/      # auth (JWT), roles (RBAC), validate, errorHandler
│   │   ├── routes/          # Express route routers
│   │   ├── services/        # eligibilityService (Core Evaluation Engine)
│   │   ├── utils/           # Standardized API response formatters
│   │   ├── validators/      # express-validator schemas
│   │   ├── app.js           # Express application configuration
│   │   └── server.js        # HTTP server entrypoint
│   └── tests/               # Automated integration test suite (14 passing tests)
```

---

## 4. Database Design

Normalized 3NF relational schema with 9 primary tables:

1. **`users`**: Identity table storing name, email (unique index), bcrypt password hash, role (`STUDENT`, `RECRUITER`, `ADMIN`), and account active flag.
2. **`companies`**: Organization details created by recruiters or administrators.
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

### Checks performed:
1. **CGPA Threshold**: Compares student CGPA against job's minimum requirement.
2. **Backlog Cap**: Verifies student active backlogs does not exceed job's maximum limit.
3. **Graduation Batch**: If specified, checks student's graduation year.
4. **Degree & Department Alignment**: Checks if student's degree/department matches approved list or `All Departments`.
5. **Technical Skills Matching**: Compares student's skills against job's required skills. Identifies matched skills and missing skills.
6. **Ineligibility Reasons**: Returns an array of human-readable reasons for ineligibility, preventing invalid submissions before writing to database.

---

## 6. API Documentation

All API responses follow a uniform JSON schema:

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
| `GET` | `/api/admin/jobs` | Admin | Institutional job openings audit |
| `GET` | `/api/admin/applications` | Admin | Global applications tracking pool |

---

## 7. Installation & Local Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MySQL Server 8.0+ running locally or cloud MySQL instance

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd campushire
```

### Step 2: Install Dependencies
```bash
npm run install:all
```
*(Installs both server and client dependencies)*

### Step 3: Configure Environment Variables
Copy the `.env.example` templates to `.env`:

**Server (`server/.env`)**:
```env
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campushire_db
JWT_SECRET=campushire_super_secret_jwt_key_2026_dev_mode
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

**Client (`client/.env`)**:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Initialize MySQL Database & Seed Data
```bash
npm run db:init
```
*(Executes `schema.sql` and populates realistic demo records with companies, students, jobs, and applications)*

### Step 5: Start Development Servers
In two separate terminal windows:

**Terminal 1 (Backend API)**:
```bash
npm run server
```
*Backend runs at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)*

**Terminal 2 (Frontend Client)**:
```bash
npm run client
```
*Frontend runs at `http://localhost:5173`*

---

## 8. Automated Testing Suite

CampusHire includes an automated integration test suite verifying end-to-end functionality across authentication, RBAC authorization, job creation, eligibility evaluation, duplicate prevention, and status workflows.

Run tests:
```bash
npm test
```

### Test Suite Results:
```
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
ℹ tests 14 | pass 14 | fail 0
```

---

## 9. Demo Accounts

For instant review and evaluation, pre-seeded demonstration accounts are available with one-click autofill buttons on the login page:

| Role | Name | Email | Password | Academic / Org Details |
|---|---|---|---|---|
| **Student (Eligible)** | Rohit Verma | `rohit.verma@student.edu` | `Password@123` | CGPA: 8.75, 0 Backlogs, CSE (2026), React, Node, MySQL |
| **Student (Intermediate)** | Ananya Sen | `ananya.sen@student.edu` | `Password@123` | CGPA: 7.40, 1 Backlog, IT (2026), Tailwind, React |
| **Student (Ineligible Edge Case)** | Vikram Singh | `vikram.singh@student.edu` | `Password@123` | CGPA: 6.10, 2 Backlogs, Mech (2025) - Tests eligibility rejection |
| **Recruiter** | Priya Sharma | `priya.sharma@nexuscloud.com` | `Password@123` | NexusCloud Technologies, Campus Talent Head |
| **Recruiter** | Arjun Mehta | `arjun.mehta@fintechlabs.io` | `Password@123` | Apex FinTech Labs, Senior Engineering Recruitment |
| **Administrator** | System Admin | `admin@campushire.io` | `Password@123` | Institutional Placement Cell Director |

---

## 10. Free Deployment Guide

CampusHire is engineered for zero-cost deployment across modern cloud platforms:

### 1. Database (Free MySQL)
- **Option A**: [TiDB Cloud Serverless](https://tidbcloud.com) (5GB free MySQL-compatible database, always free).
- **Option B**: [Aiven for MySQL](https://aiven.io) (Free tier managed MySQL).
- **Option C**: [Railway](https://railway.app) (Free trial MySQL service).

*After provisioning cloud MySQL, run `node database/init.js` with cloud `DB_HOST`, `DB_USER`, `DB_PASSWORD` to create the schema and demo seed.*

### 2. Backend (Free Node.js Host)
- **Platform**: [Render](https://render.com) (Free Web Service) or [Railway](https://railway.app).
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PORT=5000`
  - `NODE_ENV=production`
  - `DB_HOST=<cloud-mysql-host>`
  - `DB_PORT=3306`
  - `DB_USER=<cloud-mysql-user>`
  - `DB_PASSWORD=<cloud-mysql-password>`
  - `DB_NAME=campushire_db`
  - `JWT_SECRET=<random-64-char-string>`
  - `CORS_ORIGIN=https://<your-frontend>.vercel.app`

### 3. Frontend (Free Static Host - Vercel)
- **Platform**: [Vercel](https://vercel.com)
- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL=https://<your-backend>.onrender.com/api`

---

## 11. Fresher Interview Technical Walkthrough

### 1. What problem does CampusHire solve?
In traditional university placement drives, placement cells manually track hundreds of student resumes in spreadsheets. Ineligible candidates often apply to companies with strict CGPA or backlog cutoffs, creating administrative overhead and recruiter frustration. CampusHire solves this by automating eligibility verification on the backend, tracking real-time status transitions, and providing placement analytics.

### 2. How is security handled?
- Passwords are never stored in plain text; they are hashed with `bcryptjs` using 10 salt rounds.
- Authentication uses stateless JWT tokens verified by custom middleware on protected routes.
- Role-based authorization (`authorize('STUDENT')`, `authorize('RECRUITER')`, `authorize('ADMIN')`) guarantees students cannot view or modify administrative records or other students' private data.
- SQL injection is eliminated using parameterized queries (`?` placeholders) with `mysql2`.
- `helmet` configures HTTP security headers and `cors` restricts frontend origins.
- Rate limiting protects authentication routes against brute-force attacks.

### 3. How does the backend prevent duplicate applications?
Duplicate application prevention is enforced at two distinct architectural levels:
1. **Application Logic**: The `POST /api/applications` controller queries existing records before running the evaluation.
2. **Database Integrity**: The `applications` table enforces a composite unique constraint: `UNIQUE KEY uq_job_student (job_id, student_id)`. Even under concurrent race conditions, MySQL rejects duplicates with an `ER_DUP_ENTRY` error code, which our centralized error middleware catches and translates to a clean 409 Conflict response.

### 4. What happens if a student modifies the frontend to apply for an ineligible job?
CampusHire strictly adheres to zero-trust principles. The frontend eligibility check is merely a user experience convenience. When the submission reaches `POST /api/applications`, the backend queries the student's authoritative database profile and recalculates all requirements (CGPA cutoff, active backlogs, graduation year, degree, and required skills matching). If the student is ineligible, the backend aborts the transaction and returns a `403 Forbidden` with the exact unmet criteria.

---

## License

This project is licensed under the MIT License - open for educational and portfolio demonstration use.
