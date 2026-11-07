const { body } = require('express-validator');

const jobValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Job title is required.')
    .isLength({ max: 200 })
    .withMessage('Job title must not exceed 200 characters.'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Job description is required.'),

  body('job_type')
    .isIn(['FULL_TIME', 'INTERNSHIP', 'PART_TIME', 'CONTRACT'])
    .withMessage('Valid job type is required.'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Job location is required.'),

  body('salary_range')
    .trim()
    .notEmpty()
    .withMessage('Salary or stipend range is required.'),

  body('min_cgpa')
    .isFloat({ min: 0.0, max: 10.0 })
    .withMessage('Minimum CGPA must be a decimal value between 0.0 and 10.0.'),

  body('max_backlogs')
    .isInt({ min: 0, max: 20 })
    .withMessage('Maximum permitted backlogs must be between 0 and 20.'),

  body('deadline')
    .isISO8601()
    .withMessage('Application deadline must be a valid date (YYYY-MM-DD).'),

  body('required_skills')
    .notEmpty()
    .withMessage('At least one required skill must be specified.')
];

module.exports = {
  jobValidator
};
