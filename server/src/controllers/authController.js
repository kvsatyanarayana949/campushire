const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'campushire_secret_jwt_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId, role }, secret, { expiresIn });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      name,
      email,
      password,
      role,
      // Student details
      rollNumber,
      degree,
      department,
      cgpa,
      activeBacklogs,
      graduationYear,
      phone,
      bio,
      skills,
      // Recruiter details
      companyName,
      companyWebsite,
      companyLocation,
      companyIndustry,
      companyDescription,
      designation
    } = req.body;

    // Check if user already exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return errorResponse(res, 'An account with this email address already exists.', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Begin database transaction
    await connection.beginTransaction();

    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    const userId = userResult.insertId;

    let profileData = null;

    if (role === 'STUDENT') {
      const parsedCgpa = cgpa ? parseFloat(cgpa) : 0.00;
      const parsedBacklogs = activeBacklogs !== undefined ? parseInt(activeBacklogs, 10) : 0;
      const parsedGradYear = graduationYear ? parseInt(graduationYear, 10) : new Date().getFullYear();

      const [studentResult] = await connection.query(
        `INSERT INTO student_profiles 
          (user_id, roll_number, degree, department, cgpa, active_backlogs, graduation_year, phone, bio) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, rollNumber, degree, department, parsedCgpa, parsedBacklogs, parsedGradYear, phone || null, bio || null]
      );
      const studentProfileId = studentResult.insertId;

      // Insert skills if provided
      if (skills && Array.isArray(skills) && skills.length > 0) {
        for (const skill of skills) {
          const skillName = typeof skill === 'string' ? skill.trim() : (skill.name || '').trim();
          const proficiency = typeof skill === 'object' && skill.proficiency ? skill.proficiency : 'INTERMEDIATE';
          if (skillName) {
            await connection.query(
              'INSERT INTO student_skills (student_id, skill_name, proficiency) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE proficiency = ?',
              [studentProfileId, skillName, proficiency, proficiency]
            );
          }
        }
      }

      profileData = {
        profileId: studentProfileId,
        rollNumber,
        degree,
        department,
        cgpa: parsedCgpa,
        activeBacklogs: parsedBacklogs,
        graduationYear: parsedGradYear
      };

      // Add a welcome notification
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type) 
         VALUES (?, 'Welcome to CampusHire!', 'Your student profile has been set up successfully. Explore verified campus openings and check your eligibility anytime.', 'SYSTEM')`,
        [userId]
      );

    } else if (role === 'RECRUITER') {
      // Find or create company
      let companyId;
      const [existingCompanies] = await connection.query(
        'SELECT id FROM companies WHERE LOWER(name) = LOWER(?) LIMIT 1',
        [companyName]
      );

      if (existingCompanies.length > 0) {
        companyId = existingCompanies[0].id;
      } else {
        const [companyResult] = await connection.query(
          `INSERT INTO companies (name, website, location, industry, description, created_by) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            companyName,
            companyWebsite || null,
            companyLocation || 'Remote / Hybrid',
            companyIndustry || 'Technology',
            companyDescription || null,
            userId
          ]
        );
        companyId = companyResult.insertId;
      }

      const [recruiterResult] = await connection.query(
        `INSERT INTO recruiter_profiles (user_id, company_id, designation, phone) 
         VALUES (?, ?, ?, ?)`,
        [userId, companyId, designation || 'Campus Recruiter', phone || null]
      );

      profileData = {
        profileId: recruiterResult.insertId,
        companyId,
        companyName,
        designation
      };

      // Add welcome notification
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type) 
         VALUES (?, 'Welcome Recruiter!', 'Your company recruitment workspace is active. You can now publish job openings and define academic eligibility criteria.', 'SYSTEM')`,
        [userId]
      );
    }

    await connection.commit();
    connection.release();

    const token = generateToken(userId, role);

    return successResponse(
      res,
      {
        token,
        user: {
          id: userId,
          name,
          email,
          role,
          profile: profileData
        }
      },
      'Account registered successfully.',
      201
    );
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const user = users[0];

    if (!user.is_active) {
      return errorResponse(res, 'Your account has been deactivated. Contact placement administrator.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    // Fetch related profile based on role
    let profile = null;
    let skills = [];

    if (user.role === 'STUDENT') {
      const [profiles] = await pool.query(
        'SELECT * FROM student_profiles WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      if (profiles.length > 0) {
        profile = profiles[0];
        const [studentSkills] = await pool.query(
          'SELECT skill_name, proficiency FROM student_skills WHERE student_id = ?',
          [profile.id]
        );
        skills = studentSkills;
      }
    } else if (user.role === 'RECRUITER') {
      const [profiles] = await pool.query(
        `SELECT rp.*, c.name as company_name, c.location as company_location, c.industry as company_industry, c.logo_url as company_logo 
         FROM recruiter_profiles rp 
         JOIN companies c ON rp.company_id = c.id 
         WHERE rp.user_id = ? LIMIT 1`,
        [user.id]
      );
      if (profiles.length > 0) {
        profile = profiles[0];
      }
    }

    const token = generateToken(user.id, user.role);

    return successResponse(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile,
          skills
        }
      },
      'Login successful.'
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found.', 404);
    }

    const user = users[0];
    let profile = null;
    let skills = [];

    if (user.role === 'STUDENT') {
      const [profiles] = await pool.query(
        'SELECT * FROM student_profiles WHERE user_id = ? LIMIT 1',
        [userId]
      );
      if (profiles.length > 0) {
        profile = profiles[0];
        const [studentSkills] = await pool.query(
          'SELECT id, skill_name, proficiency FROM student_skills WHERE student_id = ?',
          [profile.id]
        );
        skills = studentSkills;
      }
    } else if (user.role === 'RECRUITER') {
      const [profiles] = await pool.query(
        `SELECT rp.*, c.name as company_name, c.website as company_website, c.location as company_location, 
                c.industry as company_industry, c.description as company_description, c.logo_url as company_logo
         FROM recruiter_profiles rp 
         JOIN companies c ON rp.company_id = c.id 
         WHERE rp.user_id = ? LIMIT 1`,
        [userId]
      );
      if (profiles.length > 0) {
        profile = profiles[0];
      }
    }

    return successResponse(res, {
      ...user,
      profile,
      skills
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe
};
