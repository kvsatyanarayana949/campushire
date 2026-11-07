const pool = require('../config/db');
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

    if (parseInt(id, 10) === req.user.id) {
      return errorResponse(res, 'You cannot deactivate your own administrative account.', 400);
    }

    const [users] = await pool.query('SELECT id, name, is_active FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return errorResponse(res, 'User not found.', 404);
    }

    const newStatus = !users[0].is_active;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

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

module.exports = {
  getDashboardMetrics,
  listUsers,
  toggleUserStatus,
  listAllJobs,
  listAllApplications
};
