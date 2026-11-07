/**
 * CampusHire Backend Eligibility Engine
 * Rigorously evaluates student profile and technical skills against job criteria.
 */

const evaluateEligibility = (studentProfile, studentSkills = [], job) => {
  const reasons = [];
  const warnings = [];

  // 1. CGPA Check
  const studentCgpa = parseFloat(studentProfile.cgpa || 0);
  const minCgpa = parseFloat(job.min_cgpa || 0);
  if (studentCgpa < minCgpa) {
    reasons.push(`Your CGPA (${studentCgpa.toFixed(2)}) is below the required minimum (${minCgpa.toFixed(2)}).`);
  }

  // 2. Active Backlogs Check
  const studentBacklogs = parseInt(studentProfile.active_backlogs || 0, 10);
  const maxBacklogs = parseInt(job.max_backlogs !== undefined && job.max_backlogs !== null ? job.max_backlogs : 0, 10);
  if (studentBacklogs > maxBacklogs) {
    reasons.push(
      `You currently have ${studentBacklogs} active backlog(s); the maximum permitted for this opening is ${maxBacklogs}.`
    );
  }

  // 3. Graduation Year Check
  if (job.eligible_graduation_year) {
    const studentGradYear = parseInt(studentProfile.graduation_year || 0, 10);
    const requiredGradYear = parseInt(job.eligible_graduation_year, 10);
    if (studentGradYear !== requiredGradYear) {
      reasons.push(
        `Job requires graduation year ${requiredGradYear}, but your profile indicates ${studentGradYear || 'Not set'}.`
      );
    }
  }

  // 4. Eligible Degrees Check
  if (job.eligible_degrees && job.eligible_degrees !== 'All Degrees') {
    const allowedDegrees = job.eligible_degrees
      .split(',')
      .map(d => d.trim().toLowerCase())
      .filter(Boolean);
    const studentDegree = (studentProfile.degree || '').trim().toLowerCase();
    
    if (allowedDegrees.length > 0 && !allowedDegrees.includes(studentDegree)) {
      reasons.push(
        `Eligible degrees: [${job.eligible_degrees}]. Your enrolled degree is "${studentProfile.degree || 'Unspecified'}".`
      );
    }
  }

  // 5. Eligible Departments Check
  if (job.eligible_departments && job.eligible_departments !== 'All Departments') {
    const allowedDepts = job.eligible_departments
      .split(',')
      .map(d => d.trim().toLowerCase())
      .filter(Boolean);
    const studentDept = (studentProfile.department || '').trim().toLowerCase();
    
    if (allowedDepts.length > 0 && !allowedDepts.includes(studentDept)) {
      reasons.push(
        `Eligible departments: [${job.eligible_departments}]. Your registered department is "${studentProfile.department || 'Unspecified'}".`
      );
    }
  }

  // 6. Required Skills Matching Check
  let requiredSkillsList = [];
  if (job.required_skills) {
    if (typeof job.required_skills === 'string') {
      try {
        const parsed = JSON.parse(job.required_skills);
        requiredSkillsList = Array.isArray(parsed) ? parsed : job.required_skills.split(',');
      } catch (e) {
        requiredSkillsList = job.required_skills.split(',');
      }
    } else if (Array.isArray(job.required_skills)) {
      requiredSkillsList = job.required_skills;
    }
  }
  requiredSkillsList = requiredSkillsList.map(s => s.trim()).filter(Boolean);

  const studentSkillNames = (studentSkills || []).map(s => {
    return (typeof s === 'string' ? s : s.skill_name || '').trim().toLowerCase();
  });

  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of requiredSkillsList) {
    const normalized = skill.toLowerCase();
    if (studentSkillNames.some(s => s === normalized || s.includes(normalized) || normalized.includes(s))) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  if (missingSkills.length > 0) {
    reasons.push(`Missing ${missingSkills.length} required skill(s): ${missingSkills.join(', ')}.`);
  }

  const isEligible = reasons.length === 0;

  return {
    isEligible,
    reasons,
    warnings,
    studentCgpa,
    minCgpa,
    studentBacklogs,
    maxBacklogs,
    matchedSkills,
    missingSkills,
    requiredSkills: requiredSkillsList,
    summary: isEligible
      ? 'You satisfy all academic and technical eligibility criteria for this position.'
      : `You are currently ineligible for this job opening due to ${reasons.length} unmet requirement(s).`
  };
};

module.exports = {
  evaluateEligibility
};
