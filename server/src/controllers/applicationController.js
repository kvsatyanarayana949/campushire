const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { evaluateEligibility } = require('../services/eligibilityService');

// POST /api/applications
const applyJob = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const studentUserId = req.user.id;
    const { job_id, cover_letter } = req.body;

    if (!job_id) {
      connection.release();
      return errorResponse(res, 'Job ID is required.', 400);
    }

    // 1. Fetch Job
    const [jobs] = await connection.query(
      `SELECT j.*, c.name as company_name 
       FROM jobs j 
       JOIN companies c ON j.company_id = c.id 
       WHERE j.id = ? LIMIT 1`,
      [job_id]
    );

    if (jobs.length === 0) {
      connection.release();
      return errorResponse(res, 'Job opening does not exist.', 404);
    }

    const job = jobs[0];

    if (!job.is_active) {
      connection.release();
      return errorResponse(res, 'This job opening is no longer active.', 400);
    }

    // Check application deadline
    const today = new Date().toISOString().split('T')[0];
    if (job.deadline < today) {
      connection.release();
      return errorResponse(res, `The application deadline (${job.deadline}) for this opening has passed.`, 400);
    }

    // 2. Fetch Student Profile & Skills
    const [profiles] = await connection.query(
      'SELECT * FROM student_profiles WHERE user_id = ? LIMIT 1',
      [studentUserId]
    );

    if (profiles.length === 0) {
      connection.release();
      return errorResponse(res, 'Please complete your student profile before applying for jobs.', 400);
    }

    const studentProfile = profiles[0];

    const [skills] = await connection.query(
      'SELECT skill_name, proficiency FROM student_skills WHERE student_id = ?',
      [studentProfile.id]
    );

    // 3. Prevent Duplicate Application Check
    const [existingApps] = await connection.query(
      'SELECT id, status, applied_at FROM applications WHERE job_id = ? AND student_id = ? LIMIT 1',
      [job_id, studentUserId]
    );

    if (existingApps.length > 0) {
      connection.release();
      return errorResponse(
        res,
        `You have already submitted an application for this position on ${existingApps[0].applied_at}. Current status: ${existingApps[0].status}.`,
        409
      );
    }

    // 4. Run Backend Eligibility Engine
    const eligibility = evaluateEligibility(studentProfile, skills, job);
    if (!eligibility.isEligible) {
      connection.release();
      return errorResponse(
        res,
        `You are not eligible to apply for this opening. Reasons: ${eligibility.reasons.join(' ')}`,
        403,
        eligibility.reasons
      );
    }

    // 5. Insert Application Transactionally
    await connection.beginTransaction();

    const [appResult] = await connection.query(
      `INSERT INTO applications (job_id, student_id, status, cover_letter) 
       VALUES (?, ?, 'APPLIED', ?)`,
      [job_id, studentUserId, cover_letter ? cover_letter.trim() : null]
    );

    const applicationId = appResult.insertId;

    // 6. Notify Recruiter
    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES (?, 'New Candidate Applied', ?, 'SYSTEM')`,
      [
        job.recruiter_id,
        `${req.user.name} (${studentProfile.roll_number}) submitted an application for "${job.title}".`
      ]
    );

    // 7. Notify Student
    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES (?, 'Application Submitted Successfully', ?, 'APPLICATION_STATUS')`,
      [
        studentUserId,
        `Your application for "${job.title}" at ${job.company_name} was received. Status: APPLIED.`
      ]
    );

    await connection.commit();
    connection.release();

    return successResponse(
      res,
      {
        applicationId,
        job_id,
        status: 'APPLIED',
        applied_at: new Date()
      },
      'Application submitted successfully!',
      201
    );
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
};

// GET /api/applications/my-applications
const getMyApplications = async (req, res, next) => {
  try {
    const studentUserId = req.user.id;
    const { status } = req.query;

    const conditions = ['a.student_id = ?'];
    const params = [studentUserId];

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    const [applications] = await pool.query(
      `SELECT a.*, 
              j.title as job_title, j.job_type, j.location as job_location, j.salary_range, j.deadline,
              c.id as company_id, c.name as company_name, c.logo_url as company_logo,
              i.id as interview_id, i.scheduled_at as interview_time, i.mode as interview_mode, 
              i.meeting_link as interview_link, i.status as interview_status
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       LEFT JOIN interviews i ON a.id = i.application_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.applied_at DESC`,
      params
    );

    return successResponse(res, applications);
  } catch (err) {
    next(err);
  }
};

// GET /api/applications/job/:jobId
const getJobApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status, search } = req.query;

    // Check recruiter authorization
    const [jobs] = await pool.query('SELECT recruiter_id, company_id, title FROM jobs WHERE id = ?', [jobId]);
    if (jobs.length === 0) {
      return errorResponse(res, 'Job opening not found.', 404);
    }

    if (req.user.role !== 'ADMIN' && jobs[0].recruiter_id !== req.user.id) {
      return errorResponse(res, 'Unauthorized to view applicants for this job opening.', 403);
    }

    const conditions = ['a.job_id = ?'];
    const params = [jobId];

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR sp.roll_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [applicants] = await pool.query(
      `SELECT a.*, 
              u.name as student_name, u.email as student_email,
              sp.roll_number, sp.degree, sp.department, sp.cgpa, sp.active_backlogs, 
              sp.graduation_year, sp.phone as student_phone, sp.resume_url,
              (SELECT GROUP_CONCAT(CONCAT(skill_name, ':', proficiency) SEPARATOR ',') 
               FROM student_skills WHERE student_id = sp.id) as skills_concat,
              i.id as interview_id, i.scheduled_at as interview_time, i.status as interview_status
       FROM applications a
       JOIN users u ON a.student_id = u.id
       JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN interviews i ON a.id = i.application_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY sp.cgpa DESC, a.applied_at ASC`,
      params
    );

    const formatted = applicants.map(app => {
      const skills = app.skills_concat
        ? app.skills_concat.split(',').map(item => {
            const [skill_name, proficiency] = item.split(':');
            return { skill_name, proficiency };
          })
        : [];
      const copy = { ...app, skills };
      delete copy.skills_concat;
      return copy;
    });

    return successResponse(res, {
      job_title: jobs[0].title,
      total_applicants: formatted.length,
      applicants: formatted
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/applications/:id/status
const updateApplicationStatus = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status, scheduled_at, meeting_link, notes } = req.body;

    const validStatuses = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED'];
    if (!validStatuses.includes(status)) {
      connection.release();
      return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Fetch existing application with job & student details
    const [rows] = await connection.query(
      `SELECT a.*, j.recruiter_id, j.title as job_title, c.name as company_name, u.name as student_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       JOIN users u ON a.student_id = u.id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      connection.release();
      return errorResponse(res, 'Application not found.', 404);
    }

    const application = rows[0];

    // Authorization check
    if (req.user.role !== 'ADMIN' && application.recruiter_id !== req.user.id) {
      connection.release();
      return errorResponse(res, 'Unauthorized to update this application status.', 403);
    }

    await connection.beginTransaction();

    await connection.query('UPDATE applications SET status = ? WHERE id = ?', [status, id]);

    // If scheduled_at provided or status is SHORTLISTED with interview details
    if (scheduled_at) {
      await connection.query(
        `INSERT INTO interviews (application_id, scheduled_at, meeting_link, notes, status) 
         VALUES (?, ?, ?, ?, 'SCHEDULED') 
         ON DUPLICATE KEY UPDATE scheduled_at = VALUES(scheduled_at), meeting_link = VALUES(meeting_link), notes = VALUES(notes)`,
        [id, scheduled_at, meeting_link || null, notes || null]
      );
    }

    // Create tailored notification for student
    let notificationTitle = `Application Status Update: ${status}`;
    let notificationMsg = `Your application for "${application.job_title}" at ${application.company_name} is now: ${status}.`;

    if (status === 'SHORTLISTED') {
      notificationTitle = 'You are Shortlisted! 🌟';
      notificationMsg = `Congratulations! You have been shortlisted for "${application.job_title}" at ${application.company_name}.`;
    } else if (status === 'SELECTED') {
      notificationTitle = 'Job Offer Extended! 🎉';
      notificationMsg = `Incredible news! ${application.company_name} has officially selected you for "${application.job_title}"!`;
    } else if (status === 'REJECTED') {
      notificationTitle = 'Application Update';
      notificationMsg = `Thank you for your interest in "${application.job_title}" at ${application.company_name}. The team has decided not to proceed with your candidacy at this time.`;
    }

    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES (?, ?, ?, 'APPLICATION_STATUS')`,
      [application.student_id, notificationTitle, notificationMsg]
    );

    await connection.commit();
    connection.release();

    const [updated] = await pool.query('SELECT * FROM applications WHERE id = ?', [id]);
    return successResponse(res, updated[0], `Application status changed to ${status}.`);
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
};

// DELETE /api/applications/:id (Withdraw application)
const withdrawApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [existing] = await pool.query(
      'SELECT student_id, status FROM applications WHERE id = ? LIMIT 1',
      [id]
    );

    if (existing.length === 0) {
      return errorResponse(res, 'Application not found.', 404);
    }

    if (req.user.role !== 'ADMIN' && existing[0].student_id !== userId) {
      return errorResponse(res, 'Unauthorized to withdraw this application.', 403);
    }

    // Students can only withdraw if status is APPLIED
    if (req.user.role === 'STUDENT' && existing[0].status !== 'APPLIED') {
      return errorResponse(
        res,
        `Cannot withdraw application once it is in "${existing[0].status}" stage. Please contact the recruiter directly.`,
        400
      );
    }

    await pool.query('DELETE FROM applications WHERE id = ?', [id]);

    return successResponse(res, null, 'Application withdrawn successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  applyJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
  withdrawApplication
};
