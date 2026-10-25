const express = require('express');
const router = express.Router();
const { getAdminOverview, getAuditLogs } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);
router.use(authorize('admin'));

router.get('/overview', getAdminOverview);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
