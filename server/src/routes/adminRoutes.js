const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

// All endpoints in this router are restricted to ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboardMetrics);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);
router.get('/jobs', adminController.listAllJobs);
router.get('/applications', adminController.listAllApplications);

module.exports = router;
