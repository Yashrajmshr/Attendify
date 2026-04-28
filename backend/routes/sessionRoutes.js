const express = require('express');
const router = express.Router();
const { createSession, getSessions, getSessionById, endSession, toggleSession, deleteSession } = require('../controllers/sessionController');
const { protect, facultyOnly } = require('../middleware/authMiddleware');

// Base routes
router.post('/', protect, facultyOnly, createSession);
router.get('/', protect, facultyOnly, getSessions);

// Specific ID routes (MUST be above generic :id)
router.put('/:id/end', protect, facultyOnly, endSession);
router.put('/:id/toggle', protect, facultyOnly, toggleSession);

// Generic ID routes
router.get('/:id', protect, getSessionById);
router.delete('/:id', protect, facultyOnly, deleteSession);

module.exports = router;
