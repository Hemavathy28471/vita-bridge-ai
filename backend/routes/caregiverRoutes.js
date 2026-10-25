const express = require('express');
const router = express.Router();
const { getMonitoredPatients, verifyCaregiverAccess } = require('../controllers/caregiverController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);
router.use(authorize('caregiver', 'admin'));

router.get('/patients', getMonitoredPatients);
router.get('/patients/:patientId/verify', verifyCaregiverAccess, (req, res) => {
  res.json({ success: true, message: 'Access verified under active patient consent.' });
});

module.exports = router;
