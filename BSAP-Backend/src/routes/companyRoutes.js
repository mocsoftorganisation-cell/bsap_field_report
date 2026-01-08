const express = require('express');
const router = express.Router();

const companyController = require('../controllers/companyController');
const { authenticate } = require('../middleware/auth');
const { validatePagination, validateId, validateCompanyCreate, validateCompanyUpdate } = require('../middleware/validationMiddleware');

// CRUD
router.get('/', authenticate, validatePagination, companyController.list);
router.post('/', authenticate, validateCompanyCreate, companyController.create);
router.put('/:id', authenticate, validateId, validateCompanyUpdate, companyController.update);


// Health check for modules
router.get('/health', (req, res) => {
  res.json({
    status: 'SUCCESS',
    message: 'Company API is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;