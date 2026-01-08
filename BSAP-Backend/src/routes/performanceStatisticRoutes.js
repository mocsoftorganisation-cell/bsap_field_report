const express = require('express');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/performanceStatisticController');
// const logger = require('../config/logger'); // Import logger
// const performanceStatisticService = require('../services/performanceStatisticService'); 

const router = express.Router();

// Performance statistics form endpoints
router.get('/performance', authenticate, controller.getPerformanceForm);
router.get('/performance/module/:moduleId/topic/:topicId', authenticate, controller.getPerformanceFormByModuleTopic);
router.post('/save-statistics', authenticate, controller.saveStatistics);
router.post('/sent-otp', authenticate, controller.sentOTP);
router.post('/verify-otp', authenticate, controller.verifyOTP);
router.post('/make-active', authenticate, controller.makeActive);

// Original endpoints
router.get('/', authenticate, controller.list);
router.get('/:id', authenticate, controller.detail);
router.post('/', authenticate, controller.create);
router.post('/bulk-save', authenticate, controller.bulkSave);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.remove);

router.get('/user/:userId', authenticate, controller.byUser);
router.get('/user/:userId/month/:monthYear', authenticate, controller.byUserMonth);

router.get('/summary', authenticate, controller.summary);
router.get('/labels', authenticate, controller.labels);
router.post('/labels/filter', authenticate, controller.labelsFilter);
router.post('/report-values', authenticate, controller.reportValues);
router.get('/count/user/:userId/date/:date', authenticate, controller.countByUserDate);
router.get('/success-count/user/:userId/date/:date', authenticate, controller.successCountByUserDate);
// routes/performance-statistics.js

// Get next topic

// 
// Add these routes:
router.get('/next/:moduleId/:topicId', 
  authenticate, 
  controller.getNextTopic
);

router.get('/previous/:moduleId/:topicId', 
  authenticate, 
  controller.getPreviousTopic
);

router.get('/navigation-info/:moduleId/:topicId', 
  authenticate, 
  controller.getNavigationInfo
);

// ... your other routes ...



module.exports = router;