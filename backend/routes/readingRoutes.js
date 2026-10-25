const express = require('express');
const router = express.Router();
const {
  postReading,
  getReadings,
  getDashboardData,
  importReadings,
  exportData,
} = require('../controllers/readingController');
const { protect } = require('../middleware/auth');
const { validateReadingMiddleware } = require('../middleware/validation');

router.use(protect);

router.post('/', validateReadingMiddleware, postReading);
router.get('/', getReadings);
router.get('/dashboard', getDashboardData);
router.post('/import', importReadings);
router.get('/export', exportData);

module.exports = router;
