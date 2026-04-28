const { db } = require('../config/firebase');

// @desc    Apply for Leave (Student)
// @route   POST /api/leaves/apply
// @access  Private/Student
const applyLeave = async (req, res) => {
    const { startDate, endDate, reason } = req.body;
    
    if (!startDate || !endDate || !reason) {
        return res.status(400).json({ message: 'Start date, end date, and reason are required' });
    }

    try {
        const leaveData = {
            studentId: req.user.id,
            studentName: req.user.name,
            rollNumber: req.user.rollNumber || 'N/A',
            section: req.user.section || 'N/A',
            startDate,
            endDate,
            reason,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('leaves').add(leaveData);
        res.status(201).json({ id: docRef.id, ...leaveData, message: 'Leave application submitted successfully' });
    } catch (error) {
        console.error('Error applying for leave:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get My Leaves (Student)
// @route   GET /api/leaves/my
// @access  Private/Student
const getMyLeaves = async (req, res) => {
    try {
        const snapshot = await db.collection('leaves')
            .where('studentId', '==', req.user.id)
            .get();
            
        const leaves = [];
        snapshot.forEach(doc => leaves.push({ id: doc.id, ...doc.data() }));
        leaves.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(leaves);
    } catch (error) {
        console.error('Error fetching leaves:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get Pending/All Leaves (Admin/Faculty)
// @route   GET /api/leaves
// @access  Private/Admin, Faculty
const getLeaves = async (req, res) => {
    try {
        const { status } = req.query; // 'Pending', 'Approved', 'Rejected'
        let query = db.collection('leaves');
        
        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.get();
        const leaves = [];
        snapshot.forEach(doc => leaves.push({ id: doc.id, ...doc.data() }));
        leaves.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(leaves);
    } catch (error) {
        console.error('Error fetching leaves:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update Leave Status (Admin/Faculty)
// @route   PUT /api/leaves/:id/status
// @access  Private/Admin, Faculty
const updateLeaveStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const leaveRef = db.collection('leaves').doc(id);
        const doc = await leaveRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        await leaveRef.update({
            status,
            actionBy: req.user.id,
            actionAt: new Date().toISOString()
        });

        if (status === 'Approved') {
            const leaveData = doc.data();
            const { studentId, section, startDate, endDate } = leaveData;
            
            const startStr = new Date(startDate).toISOString();
            const endObj = new Date(endDate);
            endObj.setHours(23, 59, 59, 999);
            const endStr = endObj.toISOString();

            const sessionsSnap = await db.collection('sessions')
                .where('section', '==', section)
                .where('createdAt', '>=', startStr)
                .where('createdAt', '<=', endStr)
                .get();

            if (!sessionsSnap.empty) {
                const batch = db.batch();
                const attRef = db.collection('attendance');

                // To avoid too many await calls inside loop, just get them all or do it smartly
                // For simplicity, we loop
                for (const sessionDoc of sessionsSnap.docs) {
                    const sessionId = sessionDoc.id;
                    const sessionData = sessionDoc.data();

                    const existingAtt = await attRef
                        .where('sessionId', '==', sessionId)
                        .where('studentId', '==', studentId)
                        .get();

                    if (existingAtt.empty) {
                        const newAttRef = attRef.doc();
                        batch.set(newAttRef, {
                            sessionId,
                            studentId,
                            status: 'L',
                            lat: 0,
                            lng: 0,
                            distanceFromFaculty: 0,
                            createdAt: sessionData.createdAt
                        });
                    } else {
                        existingAtt.forEach(attDoc => {
                            if (attDoc.data().status !== 'P' && attDoc.data().status !== 'Present') {
                                batch.update(attDoc.ref, { status: 'L' });
                            }
                        });
                    }
                }
                await batch.commit();
            }
        }

        res.json({ message: `Leave ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.error('Error updating leave status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    applyLeave,
    getMyLeaves,
    getLeaves,
    updateLeaveStatus
};
