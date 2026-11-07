const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 150 })
    .withMessage('Name must be between 2 and 150 characters.'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required.')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),

  body('role')
    .isIn(['STUDENT', 'RECRUITER'])
    .withMessage('Role must be either STUDENT or RECRUITER.'),

  // Student specific conditional fields
  body('rollNumber')
    .if(body('role').equals('STUDENT'))
    .trim()
    .notEmpty()
    .withMessage('Roll number is required for students.'),

  body('degree')
    .if(body('role').equals('STUDENT'))
    .trim()
    .notEmpty()
    .withMessage('Degree is required for students.'),

  body('department')
    .if(body('role').equals('STUDENT'))
    .trim()
    .notEmpty()
    .withMessage('Department is required for students.'),

  body('graduationYear')
    .if(body('role').equals('STUDENT'))
    .isInt({ min: 2020, max: 2035 })
    .withMessage('Valid graduation year between 2020 and 2035 is required.'),

  // Recruiter specific conditional fields
  body('companyName')
    .if(body('role').equals('RECRUITER'))
    .trim()
    .notEmpty()
    .withMessage('Company name is required for recruiters.'),

  body('designation')
    .if(body('role').equals('RECRUITER'))
    .trim()
    .notEmpty()
    .withMessage('Designation is required for recruiters.')
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
];

module.exports = {
  registerValidator,
  loginValidator
};
