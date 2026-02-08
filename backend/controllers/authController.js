const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, rollNumber, department, section } = req.body;

    try {
        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            rollNumber,
            department,
            section
        });

        if (user) {
            res.status(201).json({
                _id: user.id, // Frontend expects _id
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid user data', error: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user.id, // Frontend expects _id
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            token: generateToken(user.id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

module.exports = { registerUser, authUser };
