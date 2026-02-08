const express = require('express');
const router = express.Router();
const multer = require('multer');
const { addStudent, uploadStudents, getStudents } = require('../controllers/studentController');
const { protect, facultyOnly } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

router.post('/', protect, facultyOnly, addStudent);
router.post('/upload', protect, facultyOnly, upload.single('file'), uploadStudents);
router.get('/', protect, facultyOnly, getStudents);

module.exports = router;
