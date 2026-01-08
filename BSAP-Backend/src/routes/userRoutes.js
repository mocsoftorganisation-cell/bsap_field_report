const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const {
  authenticate,
  authenticateWithPermission
} = require('../middleware/auth');

const {
  validatePagination,
  validateId
} = require('../middleware/validationMiddleware');

/* ================= TEST ================= */
router.get('/test', (req, res) => {
  res.json({
    message: 'User routes are working!',
    timestamp: new Date()
  });
});

/* ================= SELF USER ================= */
router.get('/self', authenticate, userController.detail);
router.put('/profile', authenticate, userController.updateMyProfile);

/* ================= ADMIN / PERMISSION ================= */
router.get('/', authenticateWithPermission, validatePagination, userController.search);
router.get('/active', authenticateWithPermission, userController.active);
router.post('/', authenticateWithPermission, userController.create);
router.put('/:id', authenticateWithPermission, validateId, userController.update);
router.delete('/:id', authenticateWithPermission, validateId, userController.remove);
router.post('/:id/toggle-status', authenticateWithPermission, validateId, userController.toggleStatus);
router.post('/:id/verify', authenticateWithPermission, validateId, userController.verify);
router.post('/:id/change-password', authenticateWithPermission, validateId, userController.changePassword);

module.exports = router;