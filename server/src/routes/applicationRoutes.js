const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

// Student submits an application
router.post('/', authenticate, authorize('STUDENT'), applicationController.applyJob);

// Student views their own applications
router.get('/my-applications', authenticate, authorize('STUDENT'), applicationController.getMyApplications);

// Recruiter & Admin view applicants for a specific job
router.get('/job/:jobId', authenticate, authorize('RECRUITER', 'ADMIN'), applicationController.getJobApplicants);

// Recruiter & Admin update candidate status
router.patch('/:id/status', authenticate, authorize('RECRUITER', 'ADMIN'), applicationController.updateApplicationStatus);

// Student withdraws an applied application
router.delete('/:id', authenticate, authorize('STUDENT', 'ADMIN'), applicationController.withdrawApplication);

module.exports = router;
