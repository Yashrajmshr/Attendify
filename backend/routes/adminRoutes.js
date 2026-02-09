const express = require('express');
const router = express.Router();
const { createUser, getAllUsers, updateUser, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/create-user', protect, adminOnly, createUser);
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/update-user/:id', protect, adminOnly, updateUser);
router.delete('/delete-user/:id', protect, adminOnly, deleteUser);

module.exports = router;
