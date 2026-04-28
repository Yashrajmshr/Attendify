const express = require('express');
const router = express.Router();
const {
    getSubjects,
    addSubject,
    deleteSubject,
    getSections,
    addSection,
    deleteSection
} = require('../controllers/metadataController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Publicly accessible to authenticated users (for dropdowns)
router.get('/subjects', protect, getSubjects);
router.get('/sections', protect, getSections);

// Admin only management
router.post('/subjects', protect, adminOnly, addSubject);
router.delete('/subjects/:id', protect, adminOnly, deleteSubject);

router.post('/sections', protect, adminOnly, addSection);
router.delete('/sections/:id', protect, adminOnly, deleteSection);

module.exports = router;
