const { db } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
        const userRef = db.collection('users');
        const snapshot = await userRef.where('email', '==', email).get();

        if (!snapshot.empty) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: role || 'student',
            rollNumber: rollNumber || null,
            department,
            section: section || null,
            createdAt: new Date().toISOString()
        };

        const docRef = await userRef.add(newUser);

        res.status(201).json({
            _id: docRef.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            token: generateToken(docRef.id),
        });

    } catch (error) {
        res.status(400).json({ message: 'Invalid user data', error: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRef = db.collection('users');
        const snapshot = await userRef.where('email', '==', email).get();

        if (snapshot.empty) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        let user = null;
        let userId = null;

        snapshot.forEach(doc => {
            user = doc.data();
            userId = doc.id;
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: userId,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                token: generateToken(userId),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { registerUser, authUser };
