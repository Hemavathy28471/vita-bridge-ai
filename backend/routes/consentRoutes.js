const express = require('express');
const router = express.Router();
const { getConsents, grantConsent, revokeConsent } = require('../controllers/consentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getConsents);
router.post('/grant', grantConsent);
router.delete('/:id', revokeConsent);

module.exports = router;
