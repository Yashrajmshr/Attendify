const { db } = require('../config/firebase');
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
            role,
            rollNumber: rollNumber || null,
            department,
            section: section || null,
            createdAt: new Date().toISOString()
        };

        const docRef = await userRef.add(newUser);

        res.status(201).json({
            id: docRef.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
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
        const userRef = db.collection('users');
        const snapshot = await userRef.get();

        const users = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            delete data.password;
            users.push({ ...data, id: doc.id });
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update user details
// @route   PUT /api/admin/update-user/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const userRef = db.collection('users').doc(req.params.id);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = doc.data();
        const { name, email, role, rollNumber, department, section, password } = req.body;

        const updatedData = {
            name: name || userData.name,
            email: email || userData.email,
            role: role || userData.role,
            rollNumber: rollNumber || userData.rollNumber,
            department: department || userData.department,
            section: section || userData.section
        };

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updatedData.password = await bcrypt.hash(password, salt);
        }

        await userRef.update(updatedData);

        res.json({
            id: doc.id,
            ...updatedData,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/delete-user/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        console.log('Deleting user:', req.params.id);
        const userRef = db.collection('users').doc(req.params.id);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        await userRef.delete();
        res.json({ message: 'User removed' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { createUser, getAllUsers, updateUser, deleteUser };
