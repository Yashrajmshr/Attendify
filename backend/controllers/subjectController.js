const { db } = require('../config/firebase');
const ExcelJS = require('exceljs');
const fs = require('fs');

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = async (req, res) => {
    const { name, code, department, semester, credits, type, attendanceWeightage, facultyId, sections } = req.body;

    if (!name || !code || !department) {
        return res.status(400).json({ message: 'Please provide name, code, and department' });
    }

    try {
        const subjectRef = db.collection('subjects');
        const snapshot = await subjectRef.where('code', '==', code).get();

        if (!snapshot.empty) {
            return res.status(400).json({ message: 'Subject with this code already exists' });
        }

        const newSubject = {
            name,
            code,
            department,
            program: req.body.program || null,
            year: req.body.year || null,
            semester: semester || null,
            section: req.body.section || null,
            credits: Number(credits) || 0,
            type: type || 'Theory',
            attendanceWeightage: Number(attendanceWeightage) || 75,
            facultyId: facultyId || null,
            createdAt: new Date().toISOString()
        };

        const docRef = await subjectRef.add(newSubject);

        // If faculty is assigned, update the faculty user's subject and sections
        if (newSubject.facultyId) {
            const facultyRef = db.collection('users').doc(newSubject.facultyId);
            const facultyDoc = await facultyRef.get();

            if (facultyDoc.exists) {
                await facultyRef.update({
                    subject: docRef.id
                });
            }
        }

        res.status(201).json({
            id: docRef.id,
            ...newSubject
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private/Admin
const getSubjects = async (req, res) => {
    try {
        const subjectsRef = db.collection('subjects');
        const snapshot = await subjectsRef.get();

        const subjects = [];
        snapshot.forEach(doc => {
            subjects.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get subjects assigned to logged-in faculty
// @route   GET /api/subjects/my-subjects
// @access  Private/Faculty
const getMySubjects = async (req, res) => {
    try {
        // req.user contains the logged-in user's info from auth middleware
        const facultyId = req.user.id;

        // Query subjects collection for all subjects where facultyId matches
        const subjectsSnapshot = await db.collection('subjects').where('facultyId', '==', facultyId).get();

        const subjects = [];
        subjectsSnapshot.forEach(doc => {
            subjects.push({ id: doc.id, ...doc.data() });
        });

        // Get user details to fetch their sections
        const userRef = db.collection('users').doc(facultyId);
        const userDoc = await userRef.get();

        const sections = (userDoc.exists && userDoc.data().section) ? [userDoc.data().section] : [];

        // Return both for compatibility
        res.json({
            subjects, // Array for reports
            subject: subjects.length > 0 ? subjects[0] : null, // Single subject for legacy components
            sections // Shared sections
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = async (req, res) => {
    const { id } = req.params;
    const { name, code, department, semester, credits, type, attendanceWeightage, facultyId, sections } = req.body;

    try {
        const subjectRef = db.collection('subjects').doc(id);
        const doc = await subjectRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        const oldData = doc.data();

        const updatedSubject = {
            name: name || oldData.name,
            code: code || oldData.code,
            department: department || oldData.department,
            program: req.body.program !== undefined ? req.body.program : oldData.program,
            year: req.body.year !== undefined ? req.body.year : oldData.year,
            semester: semester || oldData.semester,
            section: req.body.section !== undefined ? req.body.section : oldData.section,
            credits: credits !== undefined ? Number(credits) : (oldData.credits || 0),
            type: type || oldData.type || 'Theory',
            attendanceWeightage: attendanceWeightage !== undefined ? Number(attendanceWeightage) : (oldData.attendanceWeightage || 75),
            facultyId: facultyId !== undefined ? facultyId : (oldData.facultyId || null),
            updatedAt: new Date().toISOString()
        };

        await subjectRef.update(updatedSubject);

        // If faculty is assigned, update the faculty user's subject and sections
        if (updatedSubject.facultyId) {
            const facultyRef = db.collection('users').doc(updatedSubject.facultyId);
            const facultyDoc = await facultyRef.get();

            if (facultyDoc.exists) {
                await facultyRef.update({
                    subject: id
                });
            }
        }

        // If faculty was removed (old had faculty, new doesn't), clear the old faculty's assignment
        if (oldData.facultyId && !updatedSubject.facultyId) {
            const oldFacultyRef = db.collection('users').doc(oldData.facultyId);
            const oldFacultyDoc = await oldFacultyRef.get();

            if (oldFacultyDoc.exists && oldFacultyDoc.data().subject === id) {
                await oldFacultyRef.update({
                    subject: null
                });
            }
        }

        res.json({
            id,
            ...updatedSubject
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res) => {
    const { id } = req.params;

    try {
        const subjectRef = db.collection('subjects').doc(id);
        const doc = await subjectRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Cascade Delete: Find and remove all sessions associated with this subject
        const sessionsSnap = await db.collection('sessions').where('subjectId', '==', id).get();
        if (!sessionsSnap.empty) {
            console.log(`[DELETE_SUBJECT] Cleaning up ${sessionsSnap.size} sessions`);
            for (const sessionDoc of sessionsSnap.docs) {
                // We reuse the same logic: delete attendees then the session
                const attSnap = await db.collection('attendance').where('sessionId', '==', sessionDoc.id).get();
                const batch = db.batch();
                attSnap.forEach(att => batch.delete(att.ref));
                batch.delete(sessionDoc.ref);
                await batch.commit();
            }
        }

        await subjectRef.delete();
        res.json({ message: 'Subject and all its sessions/attendance deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Upload subjects via Excel/CSV
// @route   POST /api/subjects/upload
// @access  Private/Admin
const uploadSubjects = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload an Excel or CSV file' });
    }

    const summary = {
        total_uploaded: 0,
        successful_inserts: 0,
        failed_rows: []
    };

    try {
        const workbook = new ExcelJS.Workbook();
        if (req.file.originalname.endsWith('.csv')) {
            await workbook.csv.readFile(req.file.path);
        } else {
            await workbook.xlsx.readFile(req.file.path);
        }

        const worksheet = workbook.getWorksheet(1);
        const subjectsToProcess = [];

        // First pass: Collect data
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const code = row.getCell(1).text ? row.getCell(1).text.toString().trim() : null;
            const name = row.getCell(2).text ? row.getCell(2).text.toString().trim() : null;
            const department = row.getCell(3).text ? row.getCell(3).text.toString().trim() : null;
            const program = row.getCell(4).text ? row.getCell(4).text.toString().trim() : null;
            const year = row.getCell(5).text ? row.getCell(5).text.toString().trim() : null;
            const semester = row.getCell(6).text ? row.getCell(6).text.toString().trim() : null;
            const section = row.getCell(7).text ? row.getCell(7).text.toString().trim() : null;
            const credits = row.getCell(8).text ? row.getCell(8).text.toString().trim() : '0';
            const type = row.getCell(9).text ? row.getCell(9).text.toString().trim() : 'Theory';
            const attendanceWeightage = row.getCell(10).text ? row.getCell(10).text.toString().trim() : '75';
            const facultyEmail = row.getCell(11).text ? row.getCell(11).text.toString().trim() : null;

            if (!code || !name) {
                summary.failed_rows.push({ row: rowNumber, reason: 'Missing Code or Name' });
                return;
            }

            if (!department) {
                summary.failed_rows.push({ row: rowNumber, reason: 'Missing Department' });
                return;
            }

            subjectsToProcess.push({
                rowNumber,
                code,
                name,
                department,
                program: program || null,
                year: year || null,
                semester: semester || null,
                section: section || null,
                credits: Number(credits) || 0,
                type: type || 'Theory',
                attendanceWeightage: Number(attendanceWeightage) || 75,
                facultyEmail: facultyEmail || null
            });
        });

        summary.total_uploaded = subjectsToProcess.length;

        const subjectRef = db.collection('subjects');
        const usersRef = db.collection('users');

        // Pre-fetch all faculty emails to map to IDs (Optimization: could fetch only needed ones, but batch is easier)
        const facultySnapshot = await usersRef.where('role', '==', 'faculty').get();
        const facultyMap = new Map(); // email -> id
        facultySnapshot.forEach(doc => {
            facultyMap.set(doc.data().email, doc.id);
        });

        for (const subject of subjectsToProcess) {
            // Check for duplicate subject code
            const codeSnapshot = await subjectRef.where('code', '==', subject.code).get();
            if (!codeSnapshot.empty) {
                summary.failed_rows.push({ row: subject.rowNumber, reason: `Subject Code ${subject.code} already exists` });
                continue;
            }

            let facultyId = null;
            if (subject.facultyEmail) {
                if (facultyMap.has(subject.facultyEmail)) {
                    facultyId = facultyMap.get(subject.facultyEmail);
                } else {
                    // Start soft warning? Or just null. Let's just keep null and maybe log in summary if strict.
                    // For now, no strict error, just skip assignment
                }
            }

            const newSubject = {
                name: subject.name,
                code: subject.code,
                department: subject.department,
                program: subject.program,
                semester: subject.semester,
                credits: subject.credits,
                type: subject.type,
                attendanceWeightage: subject.attendanceWeightage,
                facultyId: facultyId,
                createdAt: new Date().toISOString()
            };

            await subjectRef.add(newSubject);
            summary.successful_inserts++;
        }

        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(201).json({
            message: 'Upload processed',
            summary
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing file', error: error.message });
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};

// @desc    Download template for bulk upload
// @route   GET /api/subjects/template
// @access  Private/Admin
const downloadTemplate = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Subjects');

        worksheet.columns = [
            { header: 'Code', key: 'code', width: 15 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Department', key: 'department', width: 20 },
            { header: 'Program', key: 'program', width: 15 },
            { header: 'Year', key: 'year', width: 10 },
            { header: 'Semester', key: 'semester', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            { header: 'Credits', key: 'credits', width: 10 },
            { header: 'Type', key: 'type', width: 15 }, // Theory/Practical
            { header: 'Attendance Weightage (%)', key: 'attendanceWeightage', width: 20 },
            { header: 'Faculty Email', key: 'facultyEmail', width: 30 }
        ];

        // Add example row
        worksheet.addRow({
            code: 'CS101',
            name: 'Introduction to Programming',
            department: 'Computer Science',
            program: 'B.Tech',
            year: '1',
            semester: '1',
            section: 'A',
            credits: 4,
            type: 'Theory',
            attendanceWeightage: 75,
            facultyEmail: 'faculty@example.com'
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=subject_template.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ message: 'Error generating template', error: error.message });
    }
};

module.exports = {
    createSubject,
    getSubjects,
    getMySubjects,
    updateSubject,
    deleteSubject,
    uploadSubjects,
    downloadTemplate
};
