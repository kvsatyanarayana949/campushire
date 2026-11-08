const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const validate = require('../middleware/validate');
const { changePasswordValidator } = require('../validators/authValidators');

// Rate limiting for admin password change (max 10 attempts per 15 min window)
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password change attempts. Please try again after 15 minutes.'
  }
});

// All endpoints in this router are restricted to ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboardMetrics);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);
router.get('/jobs', adminController.listAllJobs);
router.get('/applications', adminController.listAllApplications);

// Secure Admin Password Change
router.post('/change-password', changePasswordLimiter, validate(changePasswordValidator), adminController.changeAdminPassword);

// Production Demo Data Cleanup (Restricted to ADMIN)
router.post('/cleanup-demo-data', adminController.cleanupDemoData);

module.exports = router;
