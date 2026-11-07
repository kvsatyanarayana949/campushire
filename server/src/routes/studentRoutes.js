const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

// Student profile management
router.get('/profile', authenticate, authorize('STUDENT'), studentController.getProfile);
router.put('/profile', authenticate, authorize('STUDENT'), studentController.updateProfile);

// Students directory for Recruiters and Admins
router.get('/', authenticate, authorize('RECRUITER', 'ADMIN'), studentController.listStudents);

module.exports = router;
