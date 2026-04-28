const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    uploadUsers,
    downloadUserTemplate,
    bulkDeleteUsers,
    bulkTransferUsers,
    bulkPasswordReset,
    exportUsers,
    getSystemLogs,
    deleteLog,
    bulkDeleteLogs,
    getAttendanceAnalytics,
    getLiveSessions,
    getDefaulters,
    notifyDefaulters
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

router.post('/create-user', protect, adminOnly, createUser);
router.post('/upload-users', protect, adminOnly, upload.single('file'), uploadUsers);
router.get('/template', protect, adminOnly, downloadUserTemplate);
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/update-user/:id', protect, adminOnly, updateUser);
router.delete('/delete-user/:id', protect, adminOnly, deleteUser);

// Bulk Actions
router.post('/delete-users', protect, adminOnly, bulkDeleteUsers);
router.post('/transfer-users', protect, adminOnly, bulkTransferUsers);
router.post('/reset-passwords', protect, adminOnly, bulkPasswordReset);
router.get('/export-users', protect, adminOnly, exportUsers);

// Logs
router.get('/logs', protect, adminOnly, getSystemLogs);
router.delete('/logs/:id', protect, adminOnly, deleteLog);
router.post('/logs/delete', protect, adminOnly, bulkDeleteLogs);

// Analytics
router.get('/analytics/attendance', protect, adminOnly, getAttendanceAnalytics);
router.get('/sessions/live', protect, adminOnly, getLiveSessions);

// Defaulters
router.get('/defaulters', protect, adminOnly, getDefaulters);
router.post('/notify-defaulters', protect, adminOnly, notifyDefaulters);

module.exports = router;
