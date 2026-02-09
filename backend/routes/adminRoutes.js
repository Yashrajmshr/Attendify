const express = require('express');
const router = express.Router();
const { createUser, getAllUsers } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/create-user', protect, adminOnly, createUser);
router.get('/users', protect, adminOnly, getAllUsers);

module.exports = router;
