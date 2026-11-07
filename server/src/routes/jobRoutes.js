const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const validate = require('../middleware/validate');
const { jobValidator } = require('../validators/jobValidators');

// Optional auth helper: if token present, decode so student can see their application status / eligibility
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, jobController.listJobs);
router.get('/:id', optionalAuth, jobController.getJobById);
router.get('/:id/eligibility', authenticate, authorize('STUDENT'), jobController.checkJobEligibility);

router.post('/', authenticate, authorize('RECRUITER', 'ADMIN'), validate(jobValidator), jobController.createJob);
router.put('/:id', authenticate, authorize('RECRUITER', 'ADMIN'), jobController.updateJob);
router.delete('/:id', authenticate, authorize('RECRUITER', 'ADMIN'), jobController.deleteJob);

module.exports = router;
