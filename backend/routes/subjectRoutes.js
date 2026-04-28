const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    createSubject,
    getSubjects,
    getMySubjects,
    updateSubject,
    deleteSubject,
    uploadSubjects,
    downloadTemplate
} = require('../controllers/subjectController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

// Faculty route - must come before admin routes
router.get('/my-subjects', protect, getMySubjects);

// Admin routes
router.post('/', protect, adminOnly, createSubject);
router.post('/upload', protect, adminOnly, upload.single('file'), uploadSubjects);
router.get('/template', protect, adminOnly, downloadTemplate);
router.get('/', protect, adminOnly, getSubjects);
router.put('/:id', protect, adminOnly, updateSubject);
router.delete('/:id', protect, adminOnly, deleteSubject);

module.exports = router;
