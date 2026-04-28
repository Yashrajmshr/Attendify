const express = require('express');
const router = express.Router();
const {
    applyLeave,
    getMyLeaves,
    getLeaves,
    updateLeaveStatus
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

router.post('/apply', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/', protect, getLeaves); 
router.put('/:id/status', protect, updateLeaveStatus); 

module.exports = router;
