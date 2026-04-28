const express = require('express');
const router = express.Router();
const multer = require('multer');
const { addStudent, uploadStudents, getStudents, downloadTemplate, downloadSectionStudents, resetDeviceBinding } = require('../controllers/studentController');
const { protect, facultyOnly, authorizeRoles } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

router.post('/', protect, authorizeRoles('faculty', 'admin'), addStudent);
router.post('/upload', protect, authorizeRoles('faculty', 'admin'), upload.single('file'), uploadStudents);
router.post('/download-section', protect, authorizeRoles('faculty', 'admin'), downloadSectionStudents);
router.post('/reset-device/:id', protect, authorizeRoles('faculty', 'admin'), resetDeviceBinding);
router.get('/template', protect, authorizeRoles('faculty', 'admin'), downloadTemplate);
router.get('/', protect, authorizeRoles('faculty', 'admin'), getStudents);

module.exports = router;
