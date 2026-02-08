const express = require('express');
const router = express.Router();
const { markAttendance, getSessionAttendance, getStudentAttendance } = require('../controllers/attendanceController');
const { protect, facultyOnly } = require('../middleware/authMiddleware');

router.post('/', protect, markAttendance);
router.get('/session/:sessionId', protect, facultyOnly, getSessionAttendance);
router.get('/my', protect, getStudentAttendance);

module.exports = router;
