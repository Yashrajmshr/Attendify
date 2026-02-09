const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Create a new user (Faculty/Student)
// @route   POST /api/admin/create-user
// @access  Private/Admin
const createUser = async (req, res) => {
    const { name, email, password, role, rollNumber, department, section } = req.body;

    // Validate request
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    try {
        const user = await User.create({
            name,
            email,
            password,
            role,
            rollNumber,
            department,
            section
        });

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createUser, getAllUsers };
