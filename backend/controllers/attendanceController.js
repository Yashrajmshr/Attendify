const { db } = require('../config/firebase');
const { getDistanceFromLatLonInMeters } = require('../utils/distance');
const { logActivity } = require('../utils/logger');

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

        // --- Device Binding Logic ---
        const { deviceId } = req.body;
        const userRef = db.collection('users').doc(req.user.id);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (deviceId) {
            if (!userData.deviceId) {
                // First time binding
                await userRef.update({ deviceId: deviceId });
            } else if (userData.deviceId !== deviceId) {
                // Device mismatch
                return res.status(403).json({
                    message: 'Device mismatch! You can only mark attendance from your registered device.',
                    isDeviceError: true
                });
            }
        }
        // ----------------------------

        const attendanceData = {
            sessionId,
            studentId: req.user.id,
            status: 'P',
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
// @desc    Get attendance for a specific session (Ordered & Symbol Based)
// @route   GET /api/attendance/session/:sessionId
// @access  Private/Faculty
const getSessionAttendance = async (req, res) => {
    try {
        const sessionRef = db.collection('sessions').doc(req.params.sessionId);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const session = sessionDoc.data();
        const { section, subject } = session; // Assuming subject isn't strict filter for students but section is

        // 1. Fetch all students in this section/department to build the "List"
        // Note: In a real app, you might need to filter by Department AND Section.
        // For now, assuming Global Section or derived from Faculty. 
        // Let's assume the session has enough info or we fetch all students and filter.
        // Better: Query users by section.
        let studentsQuery = db.collection('users').where('role', '==', 'student');

        if (section) {
            studentsQuery = studentsQuery.where('section', '==', section);
        }

        // Also filter by department if available in session, else assumes faculty's department or global
        // This might need adjustment based on exact schema

        const studentsSnapshot = await studentsQuery.get();
        const students = [];
        studentsSnapshot.forEach(doc => {
            students.push({ ...doc.data(), _id: doc.id });
        });

        // Sort students by list_order
        students.sort((a, b) => (a.list_order || 999999) - (b.list_order || 999999));

        // 2. Fetch existing attendance for this session
        const attendanceRef = db.collection('attendance');
        const snapshot = await attendanceRef.where('sessionId', '==', req.params.sessionId).get();

        const attendanceMap = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            attendanceMap[data.studentId] = data; // map by studentId
        });

        // 3. Merge: If no record, default to "A" (Absent). If present, use stored status or convert "Present" -> "P"
        const finalAttendanceList = students.map(student => {
            const record = attendanceMap[student._id];

            // Normalize status: "Present" -> "P", "Absent" -> "A", else "A"
            let status = 'A';
            let recordId = null;
            let distance = null;

            if (record) {
                if (record.status === 'Present' || record.status === 'P') status = 'P';
                else status = 'A';
                recordId = record._id || null; // Might not have _id in data()
                distance = record.distanceFromFaculty;
            }

            return {
                student: {
                    _id: student._id,
                    name: student.name,
                    rollNumber: student.rollNumber,
                    list_order: student.list_order
                },
                studentId: { // Alias for frontend compatibility
                    _id: student._id,
                    name: student.name,
                    rollNumber: student.rollNumber,
                    list_order: student.list_order
                },
                status: status,
                distanceFromFaculty: distance || 0,
                markedAt: record ? record.createdAt : null,
                createdAt: record ? record.createdAt : null // Maintain legacy field
            };
        });

        res.json(finalAttendanceList);
    } catch (error) {
        console.error(error);
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

// @desc    Export attendance as CSV
// @route   GET /api/attendance/export
// @access  Private/Faculty
const exportAttendance = async (req, res) => {
    const { startDate, endDate, subject, section } = req.query; // Expects YYYY-MM-DD

    if (!startDate || !endDate || !subject) {
        return res.status(400).json({ message: 'Start date, end date, and subject are required' });
    }

    try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Report');

        // 1. Fetch all students for the subject/section (ordered)
        let studentsQuery = db.collection('users').where('role', '==', 'student');
        if (section) studentsQuery = studentsQuery.where('section', '==', section);
        const studentsSnapshot = await studentsQuery.get();

        const students = [];
        studentsSnapshot.forEach(doc => {
            students.push({ ...doc.data(), _id: doc.id });
        });
        students.sort((a, b) => (a.list_order || 999999) - (b.list_order || 999999));

        // 2. Fetch all sessions for this subject within date range
        // Note: Storing createdAt as ISO string. String comparison works for YYYY-MM-DD...
        const sessionsRef = db.collection('sessions');
        const sessionsSnapshot = await sessionsRef
            .where('facultyId', '==', req.user.id)
            .where('subject', '==', subject)
            .where('createdAt', '>=', new Date(startDate).toISOString())
            .where('createdAt', '<=', new Date(endDate + 'T23:59:59').toISOString())
            .get();

        const sessionIds = [];
        const sessionDates = [];
        const dateWeights = {};

        sessionsSnapshot.forEach(doc => {
            const data = doc.data();
            sessionIds.push(doc.id);
            // Extract date (YYYY-MM-DD)
            const date = new Date(data.createdAt).toISOString().split('T')[0];
            const weight = data.sessionType === 'Lab' ? 2 : 1;
            
            sessionDates.push({ id: doc.id, date, weight });
            if (!dateWeights[date] || weight > dateWeights[date]) {
                dateWeights[date] = weight;
            }
        });

        // 3. Fetch attendance records for these sessions
        const attendanceMap = {}; // { studentId: { date: 'P' } }

        if (sessionIds.length > 0) {
            // Fetch in batches if necessary, but for now simple query
            // Firestore 'in' has limit 10. If > 10 sessions, need multiple queries.
            // Simplified: Fetch all attendance for these sessions (iterative or chunked)

            // Strategy: Iterate sessions and fetch attendance (N queries) or fetch all attendance filtered by something else?
            // Since we don't have a composite index for everything, iterating sessions is decent for reporting.

            for (const sessionId of sessionIds) {
                const attSnap = await db.collection('attendance').where('sessionId', '==', sessionId).get();
                attSnap.forEach(doc => {
                    const data = doc.data();
                    if (!attendanceMap[data.studentId]) attendanceMap[data.studentId] = {};

                    // Find which date this session belongs to
                    const sessionObj = sessionDates.find(s => s.id === sessionId);
                    if (sessionObj) {
                        if (data.status === 'Present' || data.status === 'P') {
                            attendanceMap[data.studentId][sessionObj.date] = sessionObj.weight === 2 ? 'P(2)' : 'P';
                        } else if (data.status === 'L' || data.status === 'Leave') {
                            attendanceMap[data.studentId][sessionObj.date] = sessionObj.weight === 2 ? 'L(2)' : 'L';
                        } else {
                            if (!['P', 'P(2)', 'L', 'L(2)'].includes(attendanceMap[data.studentId][sessionObj.date])) {
                                attendanceMap[data.studentId][sessionObj.date] = 'A';
                            }
                        }
                    }
                });
            }
        }

        // 4. Build CSV
        // Columns: Roll No, Name, [Dates...], Total Present, Percentage
        const uniqueDates = [...new Set(sessionDates.map(s => s.date))].sort();
        const totalPossibleClasses = uniqueDates.reduce((sum, date) => sum + (dateWeights[date] || 1), 0);

        const columns = [
            { header: 'Roll Number', key: 'rollNumber', width: 15 },
            { header: 'Student Name', key: 'name', width: 25 },
            ...uniqueDates.map(date => ({ header: date, key: date, width: 12 })),
            { header: 'Total Present', key: 'totalPresent', width: 15 },
            { header: 'Percentage', key: 'percentage', width: 15 },
        ];

        worksheet.columns = columns;

        students.forEach(student => {
            const row = {
                rollNumber: student.rollNumber,
                name: student.name
            };

            let presentCount = 0;

            uniqueDates.forEach(date => {
                const status = (attendanceMap[student._id] && attendanceMap[student._id][date]) ? attendanceMap[student._id][date] : 'A';
                row[date] = status;
                if (status === 'P' || status === 'L') presentCount += 1;
                else if (status === 'P(2)' || status === 'L(2)') presentCount += 2;
            });

            row.totalPresent = presentCount;
            row.percentage = totalPossibleClasses > 0 ? ((presentCount / totalPossibleClasses) * 100).toFixed(2) + '%' : '0%';

            worksheet.addRow(row);
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=attendance_report.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Export specific session attendance as CSV
// @route   GET /api/attendance/export/session/:sessionId
// @access  Private/Faculty
const exportSessionAttendance = async (req, res) => {
    try {
        const sessionRef = db.collection('sessions').doc(req.params.sessionId);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const session = sessionDoc.data();
        // Construct filename: Subject_YYYY-MM-DD_attendance.csv
        const dateStr = session.createdAt ? new Date(session.createdAt).toISOString().split('T')[0] : 'date';
        const filename = `${session.subject.replace(/\s+/g, '_')}_${dateStr}_attendance.csv`;

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Session Attendance');

        worksheet.columns = [
            { header: 'Roll Number', key: 'rollNumber', width: 15 },
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'Status', key: 'status', width: 10 }
        ];

        // 1. Fetch all students (Ordered)
        let studentsQuery = db.collection('users').where('role', '==', 'student');
        if (session.section) studentsQuery = studentsQuery.where('section', '==', session.section);

        const studentsSnapshot = await studentsQuery.get();
        const students = [];
        studentsSnapshot.forEach(doc => {
            students.push({ ...doc.data(), _id: doc.id });
        });
        students.sort((a, b) => (a.list_order || 999999) - (b.list_order || 999999));

        // 2. Fetch attendance
        const attendanceRef = db.collection('attendance');
        const snapshot = await attendanceRef.where('sessionId', '==', req.params.sessionId).get();
        const attendanceMap = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            attendanceMap[data.studentId] = (data.status === 'Present' || data.status === 'P') ? 'P' : 'A';
        });

        // 3. Build Rows
        students.forEach(student => {
            worksheet.addRow({
                rollNumber: student.rollNumber,
                name: student.name,
                status: attendanceMap[student._id] || 'A'
            });
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${filename}`
        );

        await workbook.csv.write(res); // Requirement says CSV
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};



// @desc    Update/Edit Attendance (Manual Override)
// @route   PUT /api/attendance/:id
// @access  Private/Faculty
const updateAttendance = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'P' or 'A'

    try {
        const attendanceRef = db.collection('attendance').doc(id);
        const doc = await attendanceRef.get();

        if (!doc.exists) {
            // Check if we need to create it? (User might want to mark someone present who was absent/no-record)
            // But usually ID implies existing record. If absent means no record, we might need a different approach.
            // For now, assume we're editing an existing record.
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        const prevData = doc.data();
        await attendanceRef.update({
            status,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        });

        // Log it
        await logActivity(
            req.user.id,
            req.user.role,
            'UPDATE_ATTENDANCE',
            {
                attendanceId: id,
                studentId: prevData.studentId,
                oldStatus: prevData.status,
                newStatus: status
            },
            req.ip
        );

        res.json({ message: 'Attendance updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get Attendance Analytics
// @route   GET /api/attendance/analytics
// @access  Private/Admin & Faculty
const getAttendanceAnalytics = async (req, res) => {
    try {
        const { department, program, year, semester, section, subjectId, startDate, endDate } = req.query;
        let { facultyId } = req.query;

        // Force facultyId if user is faculty
        if (req.user.role === 'faculty') {
            facultyId = req.user.id;
        }

        // Date Range (Default: Last 30 days)
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date();
        if (!startDate) start.setDate(start.getDate() - 30);

        // 1. Fetch filtered sessions
        let sessionsQuery = db.collection('sessions')
            .where('createdAt', '>=', start.toISOString())
            .where('createdAt', '<=', end.toISOString());

        const sessionsSnapshot = await sessionsQuery.get();
        let sessions = [];
        sessionsSnapshot.forEach(doc => sessions.push({ id: doc.id, ...doc.data() }));

        // Apply filters in memory
        sessions = sessions.filter(session => {
            if (facultyId && session.facultyId !== facultyId) return false;
            if (subjectId && session.subjectId !== subjectId && session.subject !== subjectId) return false;
            if (section && session.section !== section) return false;
            if (department && session.department !== department) return false;
            if (program && session.program !== program) return false;
            if (year && session.year !== year) return false;
            if (semester && session.semester !== semester) return false;
            return true;
        });

        const totalSessions = sessions.reduce((acc, s) => acc + (s.sessionType === 'Lab' ? 2 : 1), 0);
        const sessionIds = sessions.map(s => s.id);

        if (totalSessions === 0) {
            return res.json({
                overview: { totalSessions: 0, totalAttendance: 0, averageAttendance: 0 },
                timeline: [],
                subjectPerformance: [],
                lowAttendanceStudents: []
            });
        }

        // 2. Fetch Attendance for these sessions
        const attendanceSnapshot = await db.collection('attendance')
            .where('createdAt', '>=', start.toISOString())
            .where('createdAt', '<=', end.toISOString())
            .get();

        let attendanceRecords = [];
        attendanceSnapshot.forEach(doc => attendanceRecords.push({ id: doc.id, ...doc.data() }));

        const SessionIdSet = new Set(sessionIds);
        attendanceRecords = attendanceRecords.filter(a => SessionIdSet.has(a.sessionId));

        const totalAttendance = attendanceRecords.reduce((acc, a) => {
            if (a.status === 'P' || a.status === 'Present' || a.status === 'L' || a.status === 'Leave') {
                const session = sessions.find(s => s.id === a.sessionId);
                const weight = (session && session.sessionType === 'Lab') ? 2 : 1;
                return acc + weight;
            }
            return acc;
        }, 0);
        const averageAttendance = totalSessions > 0 ? (totalAttendance / totalSessions).toFixed(1) : 0;

        // 3. Timeline Chart Data (Daily)
        const timelineMap = {};
        sessions.forEach(session => {
            const date = session.createdAt.split('T')[0];
            const weight = session.sessionType === 'Lab' ? 2 : 1;
            if (!timelineMap[date]) timelineMap[date] = { date, sessions: 0, present: 0 };
            timelineMap[date].sessions += weight;
        });

        attendanceRecords.forEach(att => {
            if (att.status === 'P' || att.status === 'Present' || att.status === 'L' || att.status === 'Leave') {
                const date = att.createdAt.split('T')[0];
                const session = sessions.find(s => s.id === att.sessionId);
                const weight = (session && session.sessionType === 'Lab') ? 2 : 1;
                if (timelineMap[date]) timelineMap[date].present += weight;
            }
        });

        // 4. Subject Performance
        const subjectMap = {};
        sessions.forEach(session => {
            const sub = session.subject;
            const weight = session.sessionType === 'Lab' ? 2 : 1;
            if (!subjectMap[sub]) subjectMap[sub] = { subject: sub, sessions: 0, present: 0 };
            subjectMap[sub].sessions += weight;
        });

        attendanceRecords.forEach(att => {
            if (att.status === 'P' || att.status === 'Present' || att.status === 'L' || att.status === 'Leave') {
                const session = sessions.find(s => s.id === att.sessionId);
                if (session) {
                    const sub = session.subject;
                    const weight = session.sessionType === 'Lab' ? 2 : 1;
                    if (subjectMap[sub]) subjectMap[sub].present += weight;
                }
            }
        });

        // 5. Fetch Total Students matching filters
        let studentsQuery = db.collection('users').where('role', '==', 'student');
        if (department) studentsQuery = studentsQuery.where('department', '==', department);
        if (program) studentsQuery = studentsQuery.where('program', '==', program);
        if (year) studentsQuery = studentsQuery.where('year', '==', year);
        if (section) studentsQuery = studentsQuery.where('section', '==', section);

        const studentsSnapshot = await studentsQuery.get();
        const totalStudents = studentsSnapshot.size;

        const timeline = Object.values(timelineMap)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(item => {
                const expected = item.sessions * totalStudents;
                const percentage = expected > 0 ? ((item.present / expected) * 100).toFixed(1) : 0;
                return {
                    ...item,
                    totalStudents,
                    expected,
                    percentage: parseFloat(percentage),
                    absent: expected - item.present
                };
            });

        const subjectPerformance = Object.values(subjectMap).map(item => {
            return {
                ...item,
                avgPresent: (item.present / item.sessions).toFixed(1)
            };
        });

        res.json({
            overview: {
                totalSessions,
                totalAttendance,
                averageAttendance,
                totalStudents
            },
            timeline,
            subjectPerformance
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
};

// @desc    Get Live Sessions
// @route   GET /api/attendance/live
// @access  Private/Admin & Faculty
const getLiveSessions = async (req, res) => {
    try {
        let snapshot;
        if (req.user.role === 'faculty') {
            snapshot = await db.collection('sessions').where('isActive', '==', true).where('facultyId', '==', req.user.id).get();
        } else if (req.user.role === 'admin' && req.user.adminType === 'department') {
            snapshot = await db.collection('sessions').where('isActive', '==', true).where('department', '==', req.user.assignedDepartment).get();
        } else {
            snapshot = await db.collection('sessions').where('isActive', '==', true).get();
        }

        const rawSessions = [];
        const facultyIds = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            rawSessions.push({ id: doc.id, ...data });
            if (data.facultyId) facultyIds.add(data.facultyId);
        });

        const facultyMap = {};
        if (facultyIds.size > 0) {
            const facultySnapshot = await db.collection('users').where('role', '==', 'faculty').get();
            facultySnapshot.forEach(doc => {
                facultyMap[doc.id] = doc.data().name;
            });
        }

        const { department, program, year, semester, section, subjectId } = req.query;

        const liveSessions = rawSessions
            .filter(s => {
                if (department && s.department !== department) return false;
                if (program && s.program !== program) return false;
                if (year && s.year !== year) return false;
                if (semester && s.semester !== semester) return false;
                if (section && s.section !== section) return false;
                if (subjectId && s.subjectId !== subjectId && s.subject !== subjectId) return false;
                return true;
            })
            .map(s => ({
                ...s,
                facultyName: facultyMap[s.facultyId] || 'Unknown'
            }));

        res.json(liveSessions);
    } catch (error) {
        console.error('Error fetching live sessions:', error);
        res.status(500).json({ message: 'Error fetching live sessions', error: error.message });
    }
};

module.exports = {
    markAttendance,
    getSessionAttendance,
    getStudentAttendance,
    exportAttendance,
    updateAttendance,
    getAttendanceAnalytics,
    getLiveSessions
};
