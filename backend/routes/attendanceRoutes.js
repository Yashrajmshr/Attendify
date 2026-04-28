const express = require('express');
const router = express.Router();
const { markAttendance, getSessionAttendance, getStudentAttendance, exportAttendance, getAttendanceAnalytics, getLiveSessions } = require('../controllers/attendanceController');
const { protect, facultyOnly } = require('../middleware/authMiddleware');

router.post('/', protect, markAttendance);
router.get('/export', protect, facultyOnly, exportAttendance);

router.get('/session/:sessionId', protect, facultyOnly, getSessionAttendance);
router.get('/my', protect, getStudentAttendance);

router.get('/analytics', protect, getAttendanceAnalytics);
router.get('/live', protect, getLiveSessions);

module.exports = router;
