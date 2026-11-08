const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken } = require('./authController');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// GET /api/admin/dashboard
const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Core Counts
    const [counts] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'RECRUITER') as total_recruiters,
        (SELECT COUNT(*) FROM companies) as total_companies,
        (SELECT COUNT(*) FROM jobs WHERE is_active = TRUE) as active_jobs,
        (SELECT COUNT(*) FROM jobs) as total_jobs,
        (SELECT COUNT(*) FROM applications) as total_applications,
        (SELECT COUNT(*) FROM applications WHERE status = 'SELECTED') as total_placed_students
    `);

    // 2. Applications Status Breakdown
    const [statusBreakdown] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM applications 
      GROUP BY status
    `);

    // 3. Department Placement Statistics
    const [deptStats] = await pool.query(`
      SELECT 
        sp.department,
        COUNT(DISTINCT sp.id) as total_enrolled,
        COUNT(DISTINCT CASE WHEN a.status = 'SELECTED' THEN sp.id END) as placed_count
      FROM student_profiles sp
      LEFT JOIN applications a ON sp.user_id = a.student_id
      GROUP BY sp.department
    `);

    // 4. Top Hiring Companies
    const [topCompanies] = await pool.query(`
      SELECT 
        c.id, c.name, c.logo_url, c.industry,
        COUNT(DISTINCT j.id) as job_openings,
        COUNT(DISTINCT a.id) as total_applications,
        COUNT(DISTINCT CASE WHEN a.status = 'SELECTED' THEN a.id END) as selections_count
      FROM companies c
      LEFT JOIN jobs j ON c.id = j.company_id
      LEFT JOIN applications a ON j.id = a.job_id
      GROUP BY c.id
      ORDER BY selections_count DESC, job_openings DESC
      LIMIT 5
    `);

    // 5. Recent Placement Activities
    const [recentActivities] = await pool.query(`
      SELECT 
        a.id, a.status, a.updated_at,
        u.name as student_name, sp.roll_number, sp.department,
        j.title as job_title, c.name as company_name
      FROM applications a
      JOIN users u ON a.student_id = u.id
      JOIN student_profiles sp ON u.id = sp.user_id
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      ORDER BY a.updated_at DESC
      LIMIT 8
    `);

    return successResponse(res, {
      overview: counts[0],
      statusBreakdown,
      departmentStats: deptStats,
      topCompanies,
      recentActivities
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const offset = (page - 1) * limit;

    const { role, is_active, search } = req.query;
    const conditions = [];
    const params = [];

    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    if (is_active !== undefined && is_active !== '') {
      conditions.push('is_active = ?');
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [users] = await pool.query(
      `SELECT id, name, email, role, is_active, created_at 
       FROM users 
       ${whereClause} 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, users, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);

    if (targetId === req.user.id) {
      return errorResponse(res, 'You cannot deactivate your own administrative account.', 400);
    }

    const [users] = await pool.query('SELECT id, name, email, is_active FROM users WHERE id = ?', [targetId]);
    if (users.length === 0) {
      return errorResponse(res, 'User not found.', 404);
    }

    // Safety guard: Protect core demonstration accounts from deactivation
    const protectedIds = [1, 2, 5];
    const protectedEmails = ['rohit.verma@student.edu', 'priya.sharma@nexuscloud.com', 'admin@campushire.io'];
    if (protectedIds.includes(targetId) || protectedEmails.includes(users[0].email)) {
      return errorResponse(res, 'Core demonstration accounts cannot be deactivated to ensure uninterrupted evaluation.', 403);
    }

    const newStatus = !users[0].is_active;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, targetId]);

    return successResponse(
      res,
      { id, is_active: newStatus },
      `User account ${newStatus ? 'activated' : 'deactivated'} successfully.`
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/jobs
const listAllJobs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const offset = (page - 1) * limit;

    const { search, status } = req.query;
    const conditions = [];
    const params = [];

    if (status === 'active') {
      conditions.push('j.is_active = TRUE');
    } else if (status === 'inactive') {
      conditions.push('j.is_active = FALSE');
    }

    if (search) {
      conditions.push('(j.title LIKE ? OR c.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM jobs j JOIN companies c ON j.company_id = c.id ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [jobs] = await pool.query(
      `SELECT j.*, c.name as company_name, u.name as recruiter_name,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicant_count
       FROM jobs j 
       JOIN companies c ON j.company_id = c.id 
       JOIN users u ON j.recruiter_id = u.id 
       ${whereClause} 
       ORDER BY j.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, jobs, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/applications
const listAllApplications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const offset = (page - 1) * limit;

    const { status, search } = req.query;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(u.name LIKE ? OR j.title LIKE ? OR c.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM applications a
       JOIN users u ON a.student_id = u.id
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [applications] = await pool.query(
      `SELECT a.*, 
              u.name as student_name, u.email as student_email,
              sp.roll_number, sp.department, sp.cgpa,
              j.title as job_title, c.name as company_name
       FROM applications a
       JOIN users u ON a.student_id = u.id
       JOIN student_profiles sp ON u.id = sp.user_id
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       ${whereClause}
       ORDER BY a.applied_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, applications, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/change-password
const changeAdminPassword = async (req, res, next) => {
  let connection;
  try {
    const { currentPassword, newPassword } = req.body;
    // Derive ID exclusively from the authenticated JWT token — never accept an ID from the request body or query
    const adminUserId = req.user.id;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Exclusive row-level lock (FOR UPDATE) to prevent concurrent race conditions
    const [users] = await connection.query(
      'SELECT id, email, password, role, token_version FROM users WHERE id = ? AND role = ? FOR UPDATE',
      [adminUserId, 'ADMIN']
    );

    if (users.length === 0) {
      await connection.rollback();
      return errorResponse(res, 'Administrator account not found.', 404);
    }

    const admin = users[0];

    // Safety guard: Restrict credential modification on the public demonstration admin account
    if (adminUserId === 1 || admin.email === 'admin@campushire.io') {
      await connection.rollback();
      return errorResponse(res, 'Modifying credentials for the public demonstration administrator account is restricted to preserve demo availability.', 403);
    }

    // 2. Verify current password using bcrypt against the locked, up-to-date row
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      await connection.rollback();
      return errorResponse(res, 'Current password is incorrect.', 400);
    }

    // 3. Hash the new password using bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const currentVersion = admin.token_version !== undefined && admin.token_version !== null ? Number(admin.token_version) : 0;
    const newTokenVersion = currentVersion + 1;

    // 4. Update password and increment token_version guarded by current version
    const [updateResult] = await connection.query(
      'UPDATE users SET password = ?, token_version = ?, updated_at = NOW() WHERE id = ? AND role = ? AND token_version = ?',
      [hashedPassword, newTokenVersion, adminUserId, 'ADMIN', currentVersion]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return errorResponse(res, 'Concurrent modification detected. Please try again.', 409);
    }

    // 5. Commit transaction atomically
    await connection.commit();

    // 6. Generate fresh JWT token with the committed token_version
    const token = generateToken(adminUserId, 'ADMIN', newTokenVersion);

    return successResponse(
      res,
      { token },
      'Administrator password updated successfully.'
    );
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// POST /api/admin/cleanup-demo-data
const cleanupDemoData = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Safety Pre-Check: Ensure the 6 approved demo jobs exist
    const [approvedJobs] = await connection.query(
      'SELECT id, title, is_active FROM jobs WHERE id IN (1, 2, 3, 4, 5, 6)'
    );
    if (approvedJobs.length < 6) {
      return errorResponse(res, 'Safety violation: One or more approved seed jobs (IDs 1-6) are missing. Aborting cleanup.', 500);
    }

    // Safety Pre-Check: Ensure the 3 primary demo accounts exist
    const [primaryUsers] = await connection.query(
      'SELECT id, email, role FROM users WHERE id IN (1, 2, 5)'
    );
    if (primaryUsers.length < 3) {
      return errorResponse(res, 'Safety violation: One or more primary demo accounts (IDs 1, 2, 5) are missing. Aborting cleanup.', 500);
    }

    await connection.beginTransaction();

    // 1. Remove test applications (specifically application 30002 or applications for test job 30002)
    const [appDelete] = await connection.query(
      'DELETE FROM applications WHERE id = 30002 OR job_id = 30002 OR student_id IN (30002, 30003)'
    );

    // 2. Remove test jobs (specifically job 30002 / title "gundu")
    const [jobDelete] = await connection.query(
      'DELETE FROM jobs WHERE id = 30002 OR title = ?',
      ['gundu']
    );

    // 3. Remove test recruiter profile and company (suridu)
    await connection.query('DELETE FROM recruiter_profiles WHERE user_id = 30003');
    const [companyDelete] = await connection.query(
      'DELETE FROM companies WHERE id = 30002 OR name = ?',
      ['suridu']
    );

    // 4. Remove test student profile, skills, and notifications
    await connection.query(
      'DELETE FROM student_skills WHERE student_id IN (SELECT id FROM student_profiles WHERE user_id = 30002)'
    );
    await connection.query('DELETE FROM student_profiles WHERE user_id = 30002');
    await connection.query('DELETE FROM notifications WHERE user_id IN (30002, 30003)');

    // 5. Remove test users (satya / betzen accounts)
    const [userDelete] = await connection.query(
      'DELETE FROM users WHERE id IN (30002, 30003) OR email IN (?, ?)',
      ['toyeso4513@betzen.com', 'toyeso4513@betzenn.com']
    );

    // 6. Deactivate secondary demo duplicate accounts so only the 3 primary demo accounts are active
    await connection.query('UPDATE users SET is_active = FALSE WHERE id IN (3, 4, 6, 7, 8)');
    await connection.query('UPDATE users SET is_active = TRUE WHERE id IN (1, 2, 5)');

    // 7. Verify all 6 approved jobs are active
    await connection.query('UPDATE jobs SET is_active = TRUE WHERE id IN (1, 2, 3, 4, 5, 6)');

    await connection.commit();

    // 8. Post-verification query
    const [finalJobs] = await connection.query(
      'SELECT id, title, company_id, recruiter_id, is_active FROM jobs WHERE is_active = TRUE ORDER BY id ASC'
    );
    const [finalUsers] = await connection.query(
      'SELECT id, name, email, role, is_active FROM users ORDER BY id ASC'
    );
    const [finalApps] = await connection.query(
      'SELECT id, job_id, student_id, status FROM applications ORDER BY id ASC'
    );

    return successResponse(
      res,
      {
        cleaned: {
          testJobsRemoved: jobDelete.affectedRows,
          testUsersRemoved: userDelete.affectedRows,
          testCompaniesRemoved: companyDelete.affectedRows,
          testApplicationsRemoved: appDelete.affectedRows
        },
        retainedJobs: finalJobs,
        retainedUsers: finalUsers,
        retainedApplications: finalApps
      },
      'Production demo data cleanup completed successfully.'
    );
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getDashboardMetrics,
  listUsers,
  toggleUserStatus,
  listAllJobs,
  listAllApplications,
  changeAdminPassword,
  cleanupDemoData
};
