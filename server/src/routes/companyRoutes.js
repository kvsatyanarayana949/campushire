const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

router.get('/', companyController.listCompanies);
router.get('/:id', companyController.getCompanyById);
router.post('/', authenticate, authorize('RECRUITER', 'ADMIN'), companyController.createCompany);
router.put('/:id', authenticate, authorize('RECRUITER', 'ADMIN'), companyController.updateCompany);

module.exports = router;
