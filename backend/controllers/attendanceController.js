const { db } = require('../config/firebase');
const { getDistanceFromLatLonInMeters } = require('../utils/distance');

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private/Student
const markAttendance = async (req, res) => {
    const { sessionId, lat, lng } = req.body;

    try {
        const sessionRef = db.collection('sessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const session = sessionDoc.data();

        if (!session.isActive) {
            return res.status(400).json({ message: 'Session is no longer active' });
        }

        // Validate QR Code Expiration (Dynamic QR)
        const { qrGeneratedAt } = req.body;
        if (qrGeneratedAt) {
            const timeDifference = Date.now() - qrGeneratedAt;
            const ALLOWED_DELAY = 15000; // 15 seconds validity

            if (timeDifference > ALLOWED_DELAY) {
                // return res.status(400).json({ message: 'QR Code expired! Please scan a new one.' });
            }

            if (timeDifference < -5000) { // Allow 5 seconds clock skew
                // return res.status(400).json({ message: 'Invalid device time. Please sync your clock.' });
            }
        }

        // Calculate distance from Session (Faculty)
        const distance = getDistanceFromLatLonInMeters(
            session.lat,
            session.lng,
            lat,
            lng
        );

        if (distance > session.radius) {
            return res.status(400).json({
                message: `You are too far from the class. Distance: ${distance.toFixed(2)}m, Allowed: ${session.radius}m`
            });
        }

        // Check if already marked
        const attendanceRef = db.collection('attendance');
        const snapshot = await attendanceRef
            .where('sessionId', '==', sessionId)
            .where('studentId', '==', req.user.id)
            .get();

        if (!snapshot.empty) {
            return res.status(400).json({ message: 'Attendance already marked' });
        }

        const attendanceData = {
            sessionId,
            studentId: req.user.id,
            status: 'Present',
            lat,
            lng,
            distanceFromFaculty: distance,
            createdAt: new Date().toISOString()
        };

        const docRef = await attendanceRef.add(attendanceData);

        res.status(201).json({ ...attendanceData, _id: docRef.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get attendance for a specific session
// @route   GET /api/attendance/session/:sessionId
// @access  Private/Faculty
const getSessionAttendance = async (req, res) => {
    try {
        const attendanceRef = db.collection('attendance');
        const snapshot = await attendanceRef.where('sessionId', '==', req.params.sessionId).get();

        const attendanceList = [];

        // Manual join to get student details
        const studentIds = new Set();
        snapshot.forEach(doc => {
            const data = doc.data();
            studentIds.add(data.studentId);
            attendanceList.push({ ...data, _id: doc.id });
        });

        // Fetch students in parallel
        // Firestore 'in' query supports up to 10 (or 30) items. For large lists, we might need multiple queries or just fetch all logic is simpler for now or fetch individually (slower). 
        // Note: For a class size ~60, fetching individually might be okay but batched is better.
        // Let's implement a simple fetch-all-needed strategy.

        if (studentIds.size > 0) {
            const usersRef = db.collection('users');
            // 'in' query is limited. Let's try to just fetch individual users or use Promise.all.
            const userPromises = Array.from(studentIds).map(id => usersRef.doc(id).get());
            const userDocs = await Promise.all(userPromises);
            const userMap = {};
            userDocs.forEach(doc => {
                if (doc.exists) userMap[doc.id] = doc.data();
            });

            // Merge
            attendanceList.forEach(att => {
                if (userMap[att.studentId]) {
                    att.student = userMap[att.studentId]; // Provide full object
                    att.studentId = att.student; // Alias for compatibility if needed (as per previous controller)
                }
            });
        }

        res.json(attendanceList);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get student's own attendance history
// @route   GET /api/attendance/my
// @access  Private/Student
const getStudentAttendance = async (req, res) => {
    try {
        const attendanceRef = db.collection('attendance');
        const snapshot = await attendanceRef.where('studentId', '==', req.user.id).get();

        const attendanceList = [];
        const sessionIds = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            sessionIds.add(data.sessionId);
            attendanceList.push({ ...data, _id: doc.id });
        });

        if (sessionIds.size > 0) {
            const sessionsRef = db.collection('sessions');
            const sessionPromises = Array.from(sessionIds).map(id => sessionsRef.doc(id).get());
            const sessionDocs = await Promise.all(sessionPromises);
            const sessionMap = {};
            sessionDocs.forEach(doc => {
                if (doc.exists) sessionMap[doc.id] = doc.data();
            });

            // Merge
            attendanceList.forEach(att => {
                if (sessionMap[att.sessionId]) {
                    att.Session = sessionMap[att.sessionId]; // Original was 'Session'
                    att.sessionId = att.Session; // Alias
                }
            });
        }

        res.json(attendanceList);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { markAttendance, getSessionAttendance, getStudentAttendance };
