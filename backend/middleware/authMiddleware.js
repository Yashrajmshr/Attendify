const { db } = require('../config/firebase');
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const userRef = db.collection('users').doc(decoded.id);
            const doc = await userRef.get();

            if (doc.exists) {
                req.user = { ...doc.data(), id: doc.id };
                delete req.user.password; // Exclude password
                next();
            } else {
                res.status(401).json({ message: 'Not authorized, user not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        if (!token) {
            res.status(401).json({ message: 'Not authorized, no token' });
        }
    }
};

const facultyOnly = (req, res, next) => {
    if (req.user && req.user.role === 'faculty') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as faculty' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as admin' });
    }
};

module.exports = { protect, facultyOnly, adminOnly };
