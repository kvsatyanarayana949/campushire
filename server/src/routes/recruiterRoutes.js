const express = require('express');
const router = express.Router();
const recruiterController = require('../controllers/recruiterController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

router.get('/profile', authenticate, authorize('RECRUITER'), recruiterController.getProfile);
router.put('/profile', authenticate, authorize('RECRUITER'), recruiterController.updateProfile);

module.exports = router;
