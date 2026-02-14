const { db } = require('../config/firebase');

// @desc    Create a new attendance session
// @route   POST /api/session
// @access  Private/Faculty
const createSession = async (req, res) => {
    const { subject, section, lat, lng, radius } = req.body;

    if (!lat || !lng || !radius) {
        return res.status(400).json({ message: 'Location and radius are required' });
    }

    try {
        const sessionData = {
            facultyId: req.user.id,
            subject,
            section,
            lat,
            lng,
            radius,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        const sessionRef = await db.collection('sessions').add(sessionData);

        const responseSession = { ...sessionData, _id: sessionRef.id };

        res.status(201).json(responseSession);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all sessions for a faculty
// @route   GET /api/session
// @access  Private/Faculty
const getSessions = async (req, res) => {
    try {
        const sessionsRef = db.collection('sessions');
        const snapshot = await sessionsRef.where('facultyId', '==', req.user.id).get();

        const sessions = [];
        snapshot.forEach(doc => {
            sessions.push({ ...doc.data(), _id: doc.id });
        });

        // Client side sorting might be needed or composite index for orderBy
        // sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get session by ID
// @route   GET /api/session/:id
// @access  Private
const getSessionById = async (req, res) => {
    try {
        const sessionRef = db.collection('sessions').doc(req.params.id);
        const doc = await sessionRef.get();

        if (doc.exists) {
            res.json({ ...doc.data(), _id: doc.id });
        } else {
            res.status(404).json({ message: 'Session not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    End/Deactivate a session
// @route   PUT /api/session/:id/end
// @access  Private/Faculty
const endSession = async (req, res) => {
    try {
        const sessionRef = db.collection('sessions').doc(req.params.id);
        const doc = await sessionRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const session = doc.data();

        if (session.facultyId !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await sessionRef.update({ isActive: false });

        res.json({ ...session, isActive: false, _id: doc.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createSession, getSessions, getSessionById, endSession };
