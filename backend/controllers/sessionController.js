const { db } = require('../config/firebase');

// @desc    Create a new attendance session
// @route   POST /api/session
// @access  Private/Faculty
const createSession = async (req, res) => {
    const { subject, section, lat, lng, radius, sessionType } = req.body;

    if (!lat || !lng || !radius) {
        return res.status(400).json({ message: 'Location and radius are required' });
    }

    try {
        const sessionData = {
            facultyId: req.user.id,
            subject,
            section,
            department: req.user.department || null,
            program: req.user.program || null,
            year: req.user.year || null,
            semester: req.user.semester || null,
            lat,
            lng,
            radius,
            sessionType: sessionType || 'Class',
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

        // Sort newest first
        sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

// @desc    Toggle session active/inactive
// @route   PUT /api/session/:id/toggle
// @access  Private/Faculty
const toggleSession = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    console.log(`[TOGGLE_SESSION] ID: ${id}, User: ${userId}`);

    try {
        const sessionRef = db.collection('sessions').doc(id);
        const doc = await sessionRef.get();

        if (!doc.exists) {
            console.log(`[TOGGLE_SESSION] Session not found`);
            return res.status(404).json({ message: 'Session not found' });
        }

        const session = doc.data();
        console.log(`[TOGGLE_SESSION] DB FacultyId: ${session.facultyId}, req.user.id: ${userId}`);

        if (String(session.facultyId) !== String(userId)) {
            console.log(`[TOGGLE_SESSION] Auth Failed`);
            return res.status(401).json({ message: 'Not authorized for this session' });
        }

        const newStatus = !session.isActive;
        await sessionRef.update({ isActive: newStatus });

        console.log(`[TOGGLE_SESSION] Success: ${newStatus}`);
        res.json({ ...session, isActive: newStatus, _id: doc.id });
    } catch (error) {
        console.error(`[TOGGLE_SESSION] Error:`, error);
        res.status(500).json({ message: 'Server error during toggle', error: error.message });
    }
};

// @desc    Delete a session (and its attendance records)
// @route   DELETE /api/session/:id
// @access  Private/Faculty
const deleteSession = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    console.log(`[DELETE_SESSION] ID: ${id}, User: ${userId}`);

    try {
        const sessionRef = db.collection('sessions').doc(id);
        const doc = await sessionRef.get();

        if (!doc.exists) {
            console.log(`[DELETE_SESSION] Session not found`);
            return res.status(404).json({ message: 'Session not found' });
        }

        const session = doc.data();

        if (String(session.facultyId) !== String(userId)) {
            console.log(`[DELETE_SESSION] Auth Failed. DB: ${session.facultyId}, req: ${userId}`);
            return res.status(401).json({ message: 'Not authorized to delete this session' });
        }

        console.log(`[DELETE_SESSION] Authorization passed. Batch deleting...`);

        // Delete all attendance records for this session in chunks to avoid Firestore limits
        let attendanceSnap = await db.collection('attendance')
            .where('sessionId', '==', id)
            .limit(450)
            .get();

        while (!attendanceSnap.empty) {
            console.log(`[DELETE_SESSION] Deleting batch of ${attendanceSnap.size} records`);
            const batch = db.batch();
            attendanceSnap.forEach(attDoc => batch.delete(attDoc.ref));
            await batch.commit();

            // Fetch next batch
            attendanceSnap = await db.collection('attendance')
                .where('sessionId', '==', id)
                .limit(450)
                .get();
        }

        await sessionRef.delete();
        console.log(`[DELETE_SESSION] Success`);
        res.json({ message: 'Session and all its attendance records deleted successfully' });
    } catch (error) {
        console.error(`[DELETE_SESSION] Error:`, error);
        res.status(500).json({ message: 'Server error during delete', error: error.message });
    }
};

module.exports = { createSession, getSessions, getSessionById, endSession, toggleSession, deleteSession };
