const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    createSection,
    getSections,
    updateSection,
    deleteSection,
    uploadSections,
    downloadSectionTemplate,
    updateSectionHierarchy,
    deleteSectionHierarchy
} = require('../controllers/sectionController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

router.post('/', protect, adminOnly, createSection);
router.post('/upload', protect, adminOnly, upload.single('file'), uploadSections);
router.get('/template', protect, adminOnly, downloadSectionTemplate);
router.put('/hierarchy', protect, adminOnly, updateSectionHierarchy);
router.delete('/hierarchy', protect, adminOnly, deleteSectionHierarchy);
router.get('/', protect, adminOnly, getSections);
router.put('/:id', protect, adminOnly, updateSection);
router.delete('/:id', protect, adminOnly, deleteSection);

module.exports = router;
