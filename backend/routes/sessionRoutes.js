const express = require('express');
const router = express.Router();
const { createSession, getSessions, getSessionById } = require('../controllers/sessionController');
const { protect, facultyOnly } = require('../middleware/authMiddleware');

router.route('/').post(protect, facultyOnly, createSession).get(protect, facultyOnly, getSessions);
router.route('/:id').get(protect, getSessionById);
router.route('/:id/end').put(protect, facultyOnly, require('../controllers/sessionController').endSession);

module.exports = router;
