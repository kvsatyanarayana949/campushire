const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const pool = require('../src/config/db');
const { assertTestDatabaseSafety } = require('./testGuard');

let server;
let baseUrl;
const PORT = 5055;

before(async () => {
  assertTestDatabaseSafety();
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      baseUrl = `http://localhost:${PORT}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe('CampusHire Full-Stack Backend Integration Tests', () => {
  let studentToken;
  let recruiterToken;
  let adminToken;
  let createdJobId;

  test('1. Health check endpoint responds with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'UP');
    assert.strictEqual(json.service, 'CampusHire API Backend');
  });

  test('2. Student Login with demo credentials returns JWT and student profile', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rohit.verma@student.edu',
        password: 'Password@123'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.token, 'Token must be present');
    assert.strictEqual(json.data.user.role, 'STUDENT');
    assert.strictEqual(json.data.user.email, 'rohit.verma@student.edu');
    assert.strictEqual(json.data.user.profile.roll_number, '22CS1045');
    studentToken = json.data.token;
  });

  test('3. Recruiter Login returns JWT and company information', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya.sharma@nexuscloud.com',
        password: 'Password@123'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.user.role, 'RECRUITER');
    assert.strictEqual(json.data.user.profile.company_name, 'NexusCloud Technologies');
    recruiterToken = json.data.token;
  });

  test('4. Admin Login returns JWT and admin role privileges', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@campushire.io',
        password: 'Password@123'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.user.role, 'ADMIN');
    adminToken = json.data.token;
  });

  test('5. Student cannot access Admin dashboard (RBAC Enforcement)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.match(json.message, /Access forbidden/i);
  });

  test('6. Admin can fetch comprehensive placement analytics dashboard', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.overview.total_students >= 4);
    assert.ok(json.data.overview.total_jobs >= 6);
    assert.ok(Array.isArray(json.data.topCompanies));
  });

  test('7. Jobs listing returns paginated active openings', async () => {
    const res = await fetch(`${baseUrl}/api/jobs?limit=5`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.length > 0);
    assert.ok(json.pagination.total >= 6);
  });

  test('8. Recruiter can post a new verified job opening', async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiterToken}`
      },
      body: JSON.stringify({
        title: 'Backend Systems Engineer (QA Integration Test)',
        description: 'Building high throughput APIs and distributed caching layers.',
        job_type: 'FULL_TIME',
        location: 'Bengaluru, India',
        salary_range: '₹14,00,000 - ₹18,00,000 PA',
        min_cgpa: 7.00,
        max_backlogs: 0,
        eligible_graduation_year: 2026,
        eligible_degrees: 'B.Tech,M.Tech',
        eligible_departments: 'Computer Science & Engineering,Information Technology',
        required_skills: 'Node.js,React,MySQL',
        deadline: '2026-12-31'
      })
    });

    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.id);
    createdJobId = json.data.id;
  });

  test('9. Eligibility Engine accurately verifies eligible student', async () => {
    // Rohit Verma has CGPA 8.75, 0 backlogs, 2026, CSE, skills: React, Node.js, MySQL
    // Job min_cgpa: 7.00, max_backlogs: 0, required_skills: Node.js,React,MySQL
    const res = await fetch(`${baseUrl}/api/jobs/${createdJobId}/eligibility`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.isEligible, true);
    assert.strictEqual(json.data.reasons.length, 0);
  });

  test('10. Eligible student applies for the newly created job', async () => {
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        job_id: createdJobId,
        cover_letter: 'I have deep expertise in building reliable full stack applications.'
      })
    });

    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.status, 'APPLIED');
  });

  test('11. Duplicate application prevention: student cannot apply twice for same job', async () => {
    const res = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        job_id: createdJobId,
        cover_letter: 'Attempting duplicate application.'
      })
    });

    // 409 Conflict returned
    assert.strictEqual(res.status, 409);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.match(json.message, /already submitted an application/i);
  });

  test('12. Ineligible student is rejected by backend eligibility engine', async () => {
    // Vikram Singh has CGPA 6.10, 2 backlogs, 2025, Mechanical Engineering
    // Login as Vikram Singh
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'vikram.singh@student.edu',
        password: 'Password@123'
      })
    });
    const loginJson = await loginRes.json();
    const vikramToken = loginJson.data.token;

    // Check eligibility endpoint
    const eligRes = await fetch(`${baseUrl}/api/jobs/${createdJobId}/eligibility`, {
      headers: { Authorization: `Bearer ${vikramToken}` }
    });
    const eligJson = await eligRes.json();
    assert.strictEqual(eligJson.data.isEligible, false);
    assert.ok(eligJson.data.reasons.length >= 2, 'Should have multiple reasons for ineligibility');

    // Attempt to apply directly to POST /api/applications -> Backend blocks with 403 Forbidden
    const applyRes = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vikramToken}`
      },
      body: JSON.stringify({
        job_id: createdJobId,
        cover_letter: 'Applying despite ineligibility.'
      })
    });
    assert.strictEqual(applyRes.status, 403);
    const applyJson = await applyRes.json();
    assert.strictEqual(applyJson.success, false);
    assert.match(applyJson.message, /not eligible/i);
  });

  test('13. Recruiter views applicants and updates application status to SHORTLISTED', async () => {
    // 1. Fetch applicants for created job
    const applicantsRes = await fetch(`${baseUrl}/api/applications/job/${createdJobId}`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    assert.strictEqual(applicantsRes.status, 200);
    const applicantsJson = await applicantsRes.json();
    assert.ok(applicantsJson.data.applicants.length > 0);
    const targetApplication = applicantsJson.data.applicants[0];

    // 2. Update status to SHORTLISTED with interview schedule
    const updateRes = await fetch(`${baseUrl}/api/applications/${targetApplication.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiterToken}`
      },
      body: JSON.stringify({
        status: 'SHORTLISTED',
        scheduled_at: '2026-12-01 15:30:00',
        meeting_link: 'https://meet.google.com/test-shortlist'
      })
    });
    assert.strictEqual(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.strictEqual(updateJson.data.status, 'SHORTLISTED');
  });

  test('14. Student receives real-time notification on application status change', async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.notifications.length > 0);
    const latest = json.data.notifications[0];
    assert.strictEqual(latest.type, 'APPLICATION_STATUS');
  });
});
