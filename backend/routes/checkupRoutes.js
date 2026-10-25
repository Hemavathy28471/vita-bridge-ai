const express = require('express');
const router = express.Router();
const { submitCheckup, getCheckupHistory, getCheckupById } = require('../controllers/checkupController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/submit', submitCheckup);
router.get('/history', getCheckupHistory);
router.get('/:id', getCheckupById);

module.exports = router;
