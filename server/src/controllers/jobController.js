const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { evaluateEligibility } = require('../services/eligibilityService');
const { recordEvent } = require('../utils/startupDiagnostics');

let hasRecordedFirstJobs = false;

// GET /api/jobs
const listJobs = async (req, res, next) => {
  const reqStart = Date.now();
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '9', 10)));
    const offset = (page - 1) * limit;

    const {
      search,
      job_type,
      location,
      min_cgpa,
      graduation_year,
      company_id,
      recruiter_id,
      status, // 'active', 'all'
      sort
    } = req.query;

    const conditions = [];
    const params = [];

    // By default, public & students only see active jobs with deadline >= today or active
    if (status === 'all' && req.user && (req.user.role === 'ADMIN' || req.user.role === 'RECRUITER')) {
      // allow seeing inactive
    } else {
      conditions.push('j.is_active = TRUE');
    }

    if (recruiter_id) {
      conditions.push('j.recruiter_id = ?');
      params.push(parseInt(recruiter_id, 10));
    }

    if (company_id) {
      conditions.push('j.company_id = ?');
      params.push(parseInt(company_id, 10));
    }

    if (job_type) {
      conditions.push('j.job_type = ?');
      params.push(job_type);
    }

    if (location) {
      conditions.push('j.location LIKE ?');
      params.push(`%${location}%`);
    }

    if (min_cgpa) {
      conditions.push('j.min_cgpa <= ?');
      params.push(parseFloat(min_cgpa));
    }

    if (graduation_year) {
      conditions.push('(j.eligible_graduation_year IS NULL OR j.eligible_graduation_year = ?)');
      params.push(parseInt(graduation_year, 10));
    }

    if (search) {
      conditions.push('(j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ? OR j.required_skills LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'j.created_at DESC';
    if (sort === 'deadline') orderBy = 'j.deadline ASC';
    else if (sort === 'cgpa_asc') orderBy = 'j.min_cgpa ASC';
    else if (sort === 'cgpa_desc') orderBy = 'j.min_cgpa DESC';

    // Count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total
       FROM jobs j
       LEFT JOIN companies c ON j.company_id = c.id
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Rows
    const [jobs] = await pool.query(
      `SELECT j.*,
              COALESCE(c.name, 'Hiring Organization') as company_name,
              c.logo_url as company_logo,
              COALESCE(c.industry, 'Technology') as company_industry,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicant_count
       FROM jobs j
       LEFT JOIN companies c ON j.company_id = c.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // If request user is a student, check which of these jobs they already applied to
    let appliedJobIds = new Set();
    if (req.user && req.user.role === 'STUDENT') {
      const [applications] = await pool.query(
        'SELECT job_id, status FROM applications WHERE student_id = ?',
        [req.user.id]
      );
      const appMap = {};
      applications.forEach(a => {
        appMap[a.job_id] = a.status;
      });

      const formatted = jobs.map(j => ({
        ...j,
        has_applied: !!appMap[j.id],
        application_status: appMap[j.id] || null
      }));

      const benchmarkRunId = req.headers['x-benchmark-run-id'] || req.query?.benchmark_run_id;
      if (benchmarkRunId) {
        recordEvent('BENCHMARK_JOBS_RESPONSE', 'SUCCESS', `Run: ${benchmarkRunId} | Returned ${jobs.length} jobs in ${Date.now() - reqStart}ms`);
      } else if (!hasRecordedFirstJobs) {
        hasRecordedFirstJobs = true;
        recordEvent('FIRST_JOBS_API_RESPONSE', 'SUCCESS', `Returned ${jobs.length} jobs (total: ${total}) in ${Date.now() - reqStart}ms`);
      }

      return paginatedResponse(res, formatted, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    }

    const benchmarkRunId = req.headers['x-benchmark-run-id'] || req.query?.benchmark_run_id;
    if (benchmarkRunId) {
      recordEvent('BENCHMARK_JOBS_RESPONSE', 'SUCCESS', `Run: ${benchmarkRunId} | Returned ${jobs.length} jobs in ${Date.now() - reqStart}ms`);
    } else if (!hasRecordedFirstJobs) {
      hasRecordedFirstJobs = true;
      recordEvent('FIRST_JOBS_API_RESPONSE', 'SUCCESS', `Returned ${jobs.length} jobs (total: ${total}) in ${Date.now() - reqStart}ms`);
    }

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

// GET /api/jobs/:id
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [jobs] = await pool.query(
      `SELECT j.*, 
              c.name as company_name, c.website as company_website, c.location as company_location, 
              c.industry as company_industry, c.description as company_description, c.logo_url as company_logo,
              u.name as recruiter_name, u.email as recruiter_email,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicant_count
       FROM jobs j 
       JOIN companies c ON j.company_id = c.id 
       JOIN users u ON j.recruiter_id = u.id 
       WHERE j.id = ? LIMIT 1`,
      [id]
    );

    if (jobs.length === 0) {
      return errorResponse(res, 'Job posting not found.', 404);
    }

    const job = jobs[0];

    // If user is a student, attach their application status if existing
    let userApplication = null;
    if (req.user && req.user.role === 'STUDENT') {
      const [apps] = await pool.query(
        'SELECT id, status, applied_at, cover_letter FROM applications WHERE job_id = ? AND student_id = ? LIMIT 1',
        [id, req.user.id]
      );
      if (apps.length > 0) {
        userApplication = apps[0];
      }
    }

    return successResponse(res, {
      ...job,
      user_application: userApplication
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/jobs
const createJob = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;
    let {
      title,
      description,
      job_type,
      location,
      salary_range,
      min_cgpa,
      max_backlogs,
      eligible_graduation_year,
      eligible_degrees,
      eligible_departments,
      required_skills,
      deadline,
      company_id
    } = req.body;

    let targetCompanyId = company_id;

    if (req.user.role === 'RECRUITER') {
      const [recruiter] = await pool.query(
        'SELECT company_id FROM recruiter_profiles WHERE user_id = ? LIMIT 1',
        [recruiterId]
      );
      if (recruiter.length === 0) {
        return errorResponse(res, 'Recruiter company profile not configured.', 400);
      }
      targetCompanyId = recruiter[0].company_id;
    } else if (req.user.role === 'ADMIN') {
      if (!targetCompanyId) {
        return errorResponse(res, 'Company ID is required when admin creates a job posting.', 400);
      }
    }

    // Format skills
    let skillsString = required_skills;
    if (Array.isArray(required_skills)) {
      skillsString = required_skills.join(',');
    }

    const [result] = await pool.query(
      `INSERT INTO jobs 
        (company_id, recruiter_id, title, description, job_type, location, salary_range, 
         min_cgpa, max_backlogs, eligible_graduation_year, eligible_degrees, eligible_departments, 
         required_skills, deadline) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        targetCompanyId,
        recruiterId,
        title.trim(),
        description.trim(),
        job_type || 'FULL_TIME',
        location.trim(),
        salary_range.trim(),
        min_cgpa !== undefined ? parseFloat(min_cgpa) : 6.00,
        max_backlogs !== undefined ? parseInt(max_backlogs, 10) : 0,
        eligible_graduation_year ? parseInt(eligible_graduation_year, 10) : null,
        eligible_degrees || 'B.Tech,M.Tech,MCA',
        eligible_departments || 'All Departments',
        skillsString,
        deadline
      ]
    );

    const [created] = await pool.query(
      `SELECT j.*, c.name as company_name 
       FROM jobs j 
       JOIN companies c ON j.company_id = c.id 
       WHERE j.id = ?`,
      [result.insertId]
    );

    return successResponse(res, created[0], 'Job opening published successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/jobs/:id
const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const [existing] = await pool.query('SELECT recruiter_id, company_id FROM jobs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Job opening not found.', 404);
    }

    if (req.user.role !== 'ADMIN' && existing[0].recruiter_id !== userId) {
      return errorResponse(res, 'Unauthorized. You can only modify your own job postings.', 403);
    }

    const {
      title,
      description,
      job_type,
      location,
      salary_range,
      min_cgpa,
      max_backlogs,
      eligible_graduation_year,
      eligible_degrees,
      eligible_departments,
      required_skills,
      deadline,
      is_active
    } = req.body;

    let skillsString = required_skills;
    if (Array.isArray(required_skills)) {
      skillsString = required_skills.join(',');
    }

    await pool.query(
      `UPDATE jobs SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        job_type = COALESCE(?, job_type),
        location = COALESCE(?, location),
        salary_range = COALESCE(?, salary_range),
        min_cgpa = COALESCE(?, min_cgpa),
        max_backlogs = COALESCE(?, max_backlogs),
        eligible_graduation_year = COALESCE(?, eligible_graduation_year),
        eligible_degrees = COALESCE(?, eligible_degrees),
        eligible_departments = COALESCE(?, eligible_departments),
        required_skills = COALESCE(?, required_skills),
        deadline = COALESCE(?, deadline),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        title ? title.trim() : null,
        description ? description.trim() : null,
        job_type || null,
        location ? location.trim() : null,
        salary_range ? salary_range.trim() : null,
        min_cgpa !== undefined ? parseFloat(min_cgpa) : null,
        max_backlogs !== undefined ? parseInt(max_backlogs, 10) : null,
        eligible_graduation_year !== undefined ? parseInt(eligible_graduation_year, 10) : null,
        eligible_degrees || null,
        eligible_departments || null,
        skillsString || null,
        deadline || null,
        is_active !== undefined ? is_active : null,
        id
      ]
    );

    const [updated] = await pool.query(
      `SELECT j.*, c.name as company_name 
       FROM jobs j 
       JOIN companies c ON j.company_id = c.id 
       WHERE j.id = ?`,
      [id]
    );

    return successResponse(res, updated[0], 'Job opening updated successfully.');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/jobs/:id
const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [existing] = await pool.query('SELECT recruiter_id FROM jobs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Job opening not found.', 404);
    }

    if (req.user.role !== 'ADMIN' && existing[0].recruiter_id !== userId) {
      return errorResponse(res, 'Unauthorized to delete this job opening.', 403);
    }

    // Toggle active status to false (clean archival)
    await pool.query('UPDATE jobs SET is_active = FALSE WHERE id = ?', [id]);

    return successResponse(res, null, 'Job posting closed and archived successfully.');
  } catch (err) {
    next(err);
  }
};

// GET /api/jobs/:id/eligibility
const checkJobEligibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Fetch student profile
    const [profiles] = await pool.query(
      'SELECT * FROM student_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (profiles.length === 0) {
      return errorResponse(res, 'Complete your student profile before checking job eligibility.', 400);
    }

    const studentProfile = profiles[0];

    // Fetch student skills
    const [skills] = await pool.query(
      'SELECT skill_name, proficiency FROM student_skills WHERE student_id = ?',
      [studentProfile.id]
    );

    // Fetch job details
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [id]);
    if (jobs.length === 0) {
      return errorResponse(res, 'Job opening not found.', 404);
    }

    const job = jobs[0];

    // Run Backend Eligibility Engine
    const evaluation = evaluateEligibility(studentProfile, skills, job);

    return successResponse(res, evaluation, 'Eligibility evaluated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  checkJobEligibility
};
