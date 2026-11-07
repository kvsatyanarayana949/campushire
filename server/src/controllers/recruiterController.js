const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

// GET /api/recruiters/profile
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [profiles] = await pool.query(
      `SELECT rp.*, u.name as recruiter_name, u.email as recruiter_email,
              c.id as company_id, c.name as company_name, c.website as company_website,
              c.location as company_location, c.industry as company_industry,
              c.description as company_description, c.logo_url as company_logo
       FROM recruiter_profiles rp
       JOIN users u ON rp.user_id = u.id
       JOIN companies c ON rp.company_id = c.id
       WHERE rp.user_id = ? LIMIT 1`,
      [userId]
    );

    if (profiles.length === 0) {
      return errorResponse(res, 'Recruiter profile not found.', 404);
    }

    const profile = profiles[0];

    // Compute metrics for this recruiter's jobs
    const [metrics] = await pool.query(
      `SELECT 
        COUNT(DISTINCT j.id) as total_jobs_posted,
        COUNT(DISTINCT a.id) as total_applicants,
        SUM(CASE WHEN a.status = 'SHORTLISTED' THEN 1 ELSE 0 END) as shortlisted_count,
        SUM(CASE WHEN a.status = 'SELECTED' THEN 1 ELSE 0 END) as selected_count,
        SUM(CASE WHEN a.status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) as under_review_count
       FROM jobs j
       LEFT JOIN applications a ON j.id = a.job_id
       WHERE j.recruiter_id = ?`,
      [userId]
    );

    return successResponse(res, {
      ...profile,
      stats: metrics[0]
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/recruiters/profile
const updateProfile = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const {
      name,
      designation,
      phone,
      company_name,
      company_website,
      company_location,
      company_industry,
      company_description,
      company_logo
    } = req.body;

    await connection.beginTransaction();

    if (name) {
      await connection.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), userId]);
    }

    const [recruiterRows] = await connection.query(
      'SELECT id, company_id FROM recruiter_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (recruiterRows.length === 0) {
      await connection.rollback();
      connection.release();
      return errorResponse(res, 'Recruiter profile not found.', 404);
    }

    const { id: recruiterId, company_id: companyId } = recruiterRows[0];

    // Update recruiter profile fields
    await connection.query(
      `UPDATE recruiter_profiles SET 
        designation = COALESCE(?, designation),
        phone = COALESCE(?, phone)
       WHERE id = ?`,
      [designation || null, phone || null, recruiterId]
    );

    // Update company details
    if (company_name || company_website || company_location || company_industry || company_description || company_logo) {
      await connection.query(
        `UPDATE companies SET 
          name = COALESCE(?, name),
          website = COALESCE(?, website),
          location = COALESCE(?, location),
          industry = COALESCE(?, industry),
          description = COALESCE(?, description),
          logo_url = COALESCE(?, logo_url)
         WHERE id = ?`,
        [
          company_name || null,
          company_website || null,
          company_location || null,
          company_industry || null,
          company_description || null,
          company_logo || null,
          companyId
        ]
      );
    }

    await connection.commit();
    connection.release();

    // Fetch updated
    const [updated] = await pool.query(
      `SELECT rp.*, u.name as recruiter_name, u.email as recruiter_email,
              c.name as company_name, c.website as company_website,
              c.location as company_location, c.industry as company_industry,
              c.description as company_description, c.logo_url as company_logo
       FROM recruiter_profiles rp
       JOIN users u ON rp.user_id = u.id
       JOIN companies c ON rp.company_id = c.id
       WHERE rp.id = ?`,
      [recruiterId]
    );

    return successResponse(res, updated[0], 'Recruiter profile updated successfully.');
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile
};
