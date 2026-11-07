const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// GET /api/students/profile
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [profiles] = await pool.query(
      `SELECT sp.*, u.name, u.email 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.user_id = ? LIMIT 1`,
      [userId]
    );

    if (profiles.length === 0) {
      return errorResponse(res, 'Student profile not found.', 404);
    }

    const profile = profiles[0];

    const [skills] = await pool.query(
      'SELECT id, skill_name, proficiency FROM student_skills WHERE student_id = ? ORDER BY id ASC',
      [profile.id]
    );

    // Also get counts of applied, shortlisted, selected
    const [appStats] = await pool.query(
      `SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'SHORTLISTED' THEN 1 ELSE 0 END) as shortlisted_count,
        SUM(CASE WHEN status = 'SELECTED' THEN 1 ELSE 0 END) as selected_count,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count
       FROM applications WHERE student_id = ?`,
      [userId]
    );

    return successResponse(res, {
      ...profile,
      skills,
      stats: appStats[0]
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/students/profile
const updateProfile = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const {
      name,
      roll_number,
      degree,
      department,
      cgpa,
      active_backlogs,
      graduation_year,
      phone,
      resume_url,
      bio,
      skills
    } = req.body;

    await connection.beginTransaction();

    // 1. Update user table if name provided
    if (name) {
      await connection.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), userId]);
    }

    // 2. Fetch student profile id
    const [existing] = await connection.query(
      'SELECT id FROM student_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (existing.length === 0) {
      await connection.rollback();
      connection.release();
      return errorResponse(res, 'Student profile does not exist.', 404);
    }

    const studentProfileId = existing[0].id;

    // 3. Update student profile fields
    await connection.query(
      `UPDATE student_profiles SET 
        roll_number = COALESCE(?, roll_number),
        degree = COALESCE(?, degree),
        department = COALESCE(?, department),
        cgpa = COALESCE(?, cgpa),
        active_backlogs = COALESCE(?, active_backlogs),
        graduation_year = COALESCE(?, graduation_year),
        phone = COALESCE(?, phone),
        resume_url = COALESCE(?, resume_url),
        bio = COALESCE(?, bio)
       WHERE id = ?`,
      [
        roll_number !== undefined ? roll_number : null,
        degree !== undefined ? degree : null,
        department !== undefined ? department : null,
        cgpa !== undefined ? parseFloat(cgpa) : null,
        active_backlogs !== undefined ? parseInt(active_backlogs, 10) : null,
        graduation_year !== undefined ? parseInt(graduation_year, 10) : null,
        phone !== undefined ? phone : null,
        resume_url !== undefined ? resume_url : null,
        bio !== undefined ? bio : null,
        studentProfileId
      ]
    );

    // 4. Update skills if provided
    if (skills && Array.isArray(skills)) {
      // Replace skills with updated list
      await connection.query('DELETE FROM student_skills WHERE student_id = ?', [studentProfileId]);
      
      for (const item of skills) {
        const skillName = typeof item === 'string' ? item.trim() : (item.skill_name || item.name || '').trim();
        const proficiency = typeof item === 'object' && item.proficiency ? item.proficiency : 'INTERMEDIATE';
        if (skillName) {
          await connection.query(
            'INSERT INTO student_skills (student_id, skill_name, proficiency) VALUES (?, ?, ?)',
            [studentProfileId, skillName, proficiency]
          );
        }
      }
    }

    await connection.commit();
    connection.release();

    // Fetch updated
    const [updated] = await pool.query(
      `SELECT sp.*, u.name, u.email 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.id = ?`,
      [studentProfileId]
    );

    const [updatedSkills] = await pool.query(
      'SELECT id, skill_name, proficiency FROM student_skills WHERE student_id = ? ORDER BY id ASC',
      [studentProfileId]
    );

    return successResponse(
      res,
      {
        ...updated[0],
        skills: updatedSkills
      },
      'Profile updated successfully.'
    );
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
};

// GET /api/students (Recruiters & Admins)
const listStudents = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const { search, department, min_cgpa, max_backlogs, graduation_year, skill } = req.query;

    const conditions = ['u.role = "STUDENT"', 'u.is_active = TRUE'];
    const params = [];

    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR sp.roll_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (department) {
      conditions.push('sp.department = ?');
      params.push(department);
    }

    if (min_cgpa) {
      conditions.push('sp.cgpa >= ?');
      params.push(parseFloat(min_cgpa));
    }

    if (max_backlogs !== undefined && max_backlogs !== '') {
      conditions.push('sp.active_backlogs <= ?');
      params.push(parseInt(max_backlogs, 10));
    }

    if (graduation_year) {
      conditions.push('sp.graduation_year = ?');
      params.push(parseInt(graduation_year, 10));
    }

    if (skill) {
      conditions.push('EXISTS (SELECT 1 FROM student_skills ss WHERE ss.student_id = sp.id AND ss.skill_name LIKE ?)');
      params.push(`%${skill}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const [countResult] = await pool.query(
      `SELECT COUNT(DISTINCT sp.id) as total 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Fetch records
    const [students] = await pool.query(
      `SELECT sp.*, u.name, u.email,
        (SELECT GROUP_CONCAT(CONCAT(skill_name, ':', proficiency) SEPARATOR ',') 
         FROM student_skills WHERE student_id = sp.id) as skills_concat
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       ${whereClause} 
       ORDER BY sp.cgpa DESC, sp.id DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const formatted = students.map(s => {
      const skills = s.skills_concat
        ? s.skills_concat.split(',').map(item => {
            const [skill_name, proficiency] = item.split(':');
            return { skill_name, proficiency };
          })
        : [];
      const copy = { ...s, skills };
      delete copy.skills_concat;
      return copy;
    });

    return paginatedResponse(res, formatted, {
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
  getProfile,
  updateProfile,
  listStudents
};
