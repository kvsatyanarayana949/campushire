const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// GET /api/companies
const listCompanies = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const offset = (page - 1) * limit;

    const { search, industry, location } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(c.name LIKE ? OR c.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (industry) {
      conditions.push('c.industry = ?');
      params.push(industry);
    }

    if (location) {
      conditions.push('c.location LIKE ?');
      params.push(`%${location}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM companies c ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [companies] = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.is_active = TRUE) as active_jobs_count
       FROM companies c 
       ${whereClause} 
       ORDER BY active_jobs_count DESC, c.name ASC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, companies, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/companies/:id
const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [companies] = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.is_active = TRUE) as active_jobs_count
       FROM companies c 
       WHERE c.id = ? LIMIT 1`,
      [id]
    );

    if (companies.length === 0) {
      return errorResponse(res, 'Company not found.', 404);
    }

    const company = companies[0];

    const [activeJobs] = await pool.query(
      `SELECT id, title, job_type, location, salary_range, min_cgpa, max_backlogs, required_skills, deadline, created_at 
       FROM jobs 
       WHERE company_id = ? AND is_active = TRUE 
       ORDER BY created_at DESC`,
      [id]
    );

    return successResponse(res, {
      ...company,
      jobs: activeJobs
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/companies
const createCompany = async (req, res, next) => {
  try {
    const { name, website, location, industry, description, logo_url } = req.body;

    if (!name || !location || !industry) {
      return errorResponse(res, 'Company name, location, and industry are required.', 400);
    }

    const [existing] = await pool.query('SELECT id FROM companies WHERE LOWER(name) = LOWER(?)', [name.trim()]);
    if (existing.length > 0) {
      return errorResponse(res, 'A company with this name already exists.', 409);
    }

    const [result] = await pool.query(
      `INSERT INTO companies (name, website, location, industry, description, logo_url, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), website || null, location.trim(), industry.trim(), description || null, logo_url || null, req.user.id]
    );

    const [created] = await pool.query('SELECT * FROM companies WHERE id = ?', [result.insertId]);

    return successResponse(res, created[0], 'Company created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/companies/:id
const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, website, location, industry, description, logo_url } = req.body;

    // Check permissions
    if (req.user.role !== 'ADMIN') {
      const [recruiter] = await pool.query(
        'SELECT company_id FROM recruiter_profiles WHERE user_id = ? LIMIT 1',
        [req.user.id]
      );
      if (recruiter.length === 0 || recruiter[0].company_id !== parseInt(id, 10)) {
        return errorResponse(res, 'You do not have permission to edit this company profile.', 403);
      }
    }

    await pool.query(
      `UPDATE companies SET 
        name = COALESCE(?, name),
        website = COALESCE(?, website),
        location = COALESCE(?, location),
        industry = COALESCE(?, industry),
        description = COALESCE(?, description),
        logo_url = COALESCE(?, logo_url)
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        website || null,
        location ? location.trim() : null,
        industry ? industry.trim() : null,
        description || null,
        logo_url || null,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM companies WHERE id = ?', [id]);
    return successResponse(res, updated[0], 'Company updated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCompanies,
  getCompanyById,
  createCompany,
  updateCompany
};
