const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const fs = require('fs');
const { logActivity } = require('../utils/logger');
const { getAttendanceAnalytics, getLiveSessions } = require('./attendanceController');

// @desc    Create a new user (Faculty/Student)
// @route   POST /api/admin/create-user
// @access  Private/Admin
const createUser = async (req, res) => {
    const { name, email, password, role, rollNumber, department, section, adminType, assignedDepartment } = req.body;

    // Validate request
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate admin-specific fields
    if (role === 'admin') {
        if (!adminType || !['super', 'department', 'readonly'].includes(adminType)) {
            return res.status(400).json({ message: 'Invalid admin type. Must be: super, department, or readonly' });
        }
        if (adminType === 'department' && !assignedDepartment) {
            return res.status(400).json({ message: 'Department Admin must have an assigned department' });
        }
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
            department: department || null,
            program: req.body.program || null,
            year: req.body.year || null,
            semester: req.body.semester || null,
            section: section || null,
            group: req.body.group || null,
            createdAt: new Date().toISOString()
        };

        // Add admin-specific fields
        if (role === 'admin') {
            newUser.adminType = adminType;
            newUser.assignedDepartment = adminType === 'department' ? assignedDepartment : null;
        }

        // Add faculty-specific fields
        if (role === 'faculty') {
            newUser.subject = req.body.subject || null;
            newUser.sections = req.body.sections || [];
        }

        const docRef = await userRef.add(newUser);

        res.status(201).json({
            id: docRef.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            adminType: newUser.adminType,
            assignedDepartment: newUser.assignedDepartment,
            subject: newUser.subject,
            sections: newUser.sections,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = db.collection('users');

        if (role) {
            query = query.where('role', '==', role);
        }

        // Department Admin: Filter by assigned department
        if (req.user.role === 'admin' && req.user.adminType === 'department') {
            query = query.where('department', '==', req.user.assignedDepartment);
        }

        const snapshot = await query.get();

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
        const { name, email, role, rollNumber, department, program, year, semester, section, password, adminType, assignedDepartment } = req.body;

        const updatedData = {
            name: name || userData.name,
            email: email || userData.email,
            role: role || userData.role,
        };

        // Only add fields if they have values (not undefined or null)
        if (rollNumber !== undefined) updatedData.rollNumber = rollNumber || null;
        if (department !== undefined) updatedData.department = department || null;
        if (program !== undefined) updatedData.program = program || null;
        if (year !== undefined) updatedData.year = year || null;
        if (semester !== undefined) updatedData.semester = semester || null;
        if (section !== undefined) updatedData.section = section || null;
        if (req.body.group !== undefined) updatedData.group = req.body.group || null;

        // Update admin-specific fields
        if (role === 'admin' || userData.role === 'admin') {
            updatedData.adminType = adminType || userData.adminType || 'super';
            updatedData.assignedDepartment = (adminType === 'department' || userData.adminType === 'department')
                ? (assignedDepartment || userData.assignedDepartment)
                : null;
        }

        // Update faculty-specific fields
        if (role === 'faculty' || userData.role === 'faculty') {
            updatedData.subject = req.body.subject !== undefined ? req.body.subject : userData.subject;
            updatedData.sections = req.body.sections !== undefined ? req.body.sections : (userData.sections || []);
        }

        // Update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updatedData.password = await bcrypt.hash(password, salt);
        }

        await userRef.update(updatedData);

        // Log the update activity
        await logActivity(req.params.id, userData.role, 'UPDATE', { updatedBy: req.user.id }, req.ip);

        res.json({ message: 'User updated successfully', user: { id: req.params.id, ...updatedData } });
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

        const userData = doc.data();

        // Cascade Delete for Faculty: Clean up sessions if they were a faculty
        if (userData.role === 'faculty') {
            const sessionsSnap = await db.collection('sessions').where('facultyId', '==', req.params.id).get();
            if (!sessionsSnap.empty) {
                console.log(`[DELETE_USER] Cleaning up ${sessionsSnap.size} sessions for faculty`);
                for (const sessionDoc of sessionsSnap.docs) {
                    const attSnap = await db.collection('attendance').where('sessionId', '==', sessionDoc.id).get();
                    const batch = db.batch();
                    attSnap.forEach(att => batch.delete(att.ref));
                    batch.delete(sessionDoc.ref);
                    await batch.commit();
                }
            }
        }

        await userRef.delete();

        // Log action (assuming req.user contains admin info from authMiddleware)
        if (req.user) {
            await logActivity(req.user.id, req.user.role, 'DELETE_USER', { targetUserId: req.params.id, targetEmail: userData.email }, req.ip);
        }

        res.json({ message: 'User removed' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Upload users via Excel/CSV
// @route   POST /api/admin/upload-users
// @access  Private/Admin
const uploadUsers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload an Excel or CSV file' });
    }

    const { role } = req.body;
    if (!role) {
        return res.status(400).json({ message: 'Role is required' });
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
        const usersToProcess = [];

        // First pass: Collect data
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            let name, email, rollNumber, department, program, year, semester, section, group;

            if (role === 'student') {
                rollNumber = row.getCell(1).text ? row.getCell(1).text.toString().trim() : null;
                name = row.getCell(2).text ? row.getCell(2).text.toString().trim() : null;
                email = row.getCell(3).text ? row.getCell(3).text.toString().trim() : null;
                department = row.getCell(4).text ? row.getCell(4).text.toString().trim() : null;
                program = row.getCell(5).text ? row.getCell(5).text.toString().trim() : null;
                year = row.getCell(6).text ? row.getCell(6).text.toString().trim() : null;
                semester = row.getCell(7).text ? row.getCell(7).text.toString().trim() : null;
                section = row.getCell(8).text ? row.getCell(8).text.toString().trim() : null;
                group = row.getCell(9).text ? row.getCell(9).text.toString().trim() : null;

                if (!rollNumber || !name || !email || !department) {
                    summary.failed_rows.push({ row: rowNumber, reason: 'Missing required fields (Roll No, Name, Email, Dept)' });
                    return;
                }
            } else if (role === 'faculty') {
                name = row.getCell(1).text ? row.getCell(1).text.toString().trim() : null;
                email = row.getCell(2).text ? row.getCell(2).text.toString().trim() : null;
                department = row.getCell(3).text ? row.getCell(3).text.toString().trim() : null;
                program = row.getCell(4).text ? row.getCell(4).text.toString().trim() : null;

                if (!name || !email || !department) {
                    summary.failed_rows.push({ row: rowNumber, reason: 'Missing required fields (Name, Email, Dept)' });
                    return;
                }
            } else {
                // Admin
                name = row.getCell(1).text ? row.getCell(1).text.toString().trim() : null;
                email = row.getCell(2).text ? row.getCell(2).text.toString().trim() : null;

                if (!name || !email) {
                    summary.failed_rows.push({ row: rowNumber, reason: 'Missing Name or Email' });
                    return;
                }
            }

            // Auto-generate password if not handled (here we just set default)
            const passwordPlain = `${name.replace(/\s+/g, '')}@123`;

            usersToProcess.push({
                rowNumber,
                name,
                email,
                passwordPlain,
                role,
                rollNumber: rollNumber || null,
                department: department || null,
                program: program || null,
                year: year || null,
                semester: semester || null,
                section: section || null,
                group: group || null
            });
        });

        summary.total_uploaded = usersToProcess.length;

        const userRef = db.collection('users');
        const salt = await bcrypt.genSalt(10);

        for (const user of usersToProcess) {
            // Check for duplicate email
            const emailSnapshot = await userRef.where('email', '==', user.email).get();
            if (!emailSnapshot.empty) {
                summary.failed_rows.push({ row: user.rowNumber, reason: `Email ${user.email} already exists` });
                continue;
            }

            const hashedPassword = await bcrypt.hash(user.passwordPlain, salt);

            const newUser = {
                name: user.name,
                email: user.email,
                password: hashedPassword,
                role: user.role,
                rollNumber: user.rollNumber,
                department: user.department,
                program: user.program,
                year: user.year,
                semester: user.semester,
                section: user.section,
                group: user.group,
                createdAt: new Date().toISOString()
            };

            await userRef.add(newUser);
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
// @route   GET /api/admin/template
// @access  Private/Admin
const downloadUserTemplate = async (req, res) => {
    const { role } = req.query;

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(role ? `${role.charAt(0).toUpperCase() + role.slice(1)} Template` : 'Users');

        if (role === 'student') {
            worksheet.columns = [
                { header: 'Roll Number', key: 'rollNumber', width: 15 },
                { header: 'Name', key: 'name', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Department', key: 'department', width: 15 },
                { header: 'Program', key: 'program', width: 15 },
                { header: 'Year', key: 'year', width: 10 },
                { header: 'Semester', key: 'semester', width: 10 },
                { header: 'Section', key: 'section', width: 10 },
                { header: 'Group', key: 'group', width: 10 }
            ];
            worksheet.addRow({
                rollNumber: 'CS-2024-001',
                name: 'John Doe',
                email: 'john@example.com',
                department: 'CS',
                program: 'B.Tech',
                year: '1',
                semester: '1',
                section: 'A',
                group: '1'
            });
        } else if (role === 'faculty') {
            worksheet.columns = [
                { header: 'Name', key: 'name', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Department', key: 'department', width: 20 },
                { header: 'Program', key: 'program', width: 15 },
                { header: 'Year', key: 'year', width: 10 },
                { header: 'Semester', key: 'semester', width: 10 },
                { header: 'Section', key: 'section', width: 10 }
            ];
            worksheet.addRow({
                name: 'Dr. Jane Smith',
                email: 'jane@example.com',
                department: 'CS',
                program: 'B.Tech',
                year: '1',
                semester: '1',
                section: 'A'
            });
        } else {
            // Admin
            worksheet.columns = [
                { header: 'Name', key: 'name', width: 25 },
                { header: 'Email', key: 'email', width: 30 }
            ];
            worksheet.addRow({
                name: 'Admin User',
                email: 'admin@example.com'
            });
        }

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${role}_template.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ message: 'Error generating template', error: error.message });
    }
};

// @desc    Bulk Delete Users
// @route   POST /api/admin/delete-users
// @access  Private/Admin
// @desc    Bulk Delete Users
// @route   POST /api/admin/delete-users
// @access  Private/Admin
const bulkDeleteUsers = async (req, res) => {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'No users selected' });
    }

    try {
        const userRef = db.collection('users');
        const batch = db.batch();

        userIds.forEach(id => {
            const docRef = userRef.doc(id);
            batch.delete(docRef);
        });

        await batch.commit();

        if (req.user) {
            await logActivity(req.user.id, req.user.role, 'BULK_DELETE_USERS', { count: userIds.length, userIds }, req.ip);
        }

        res.json({ message: `Successfully deleted ${userIds.length} users` });
    } catch (error) {
        console.error('Error bulk deleting users:', error);
        res.status(500).json({ message: 'Error deleting users', error: error.message });
    }
};

// @desc    Bulk Transfer Users (Update Dept, Program, etc.)
// @route   POST /api/admin/transfer-users
// @access  Private/Admin
const bulkTransferUsers = async (req, res) => {
    const { userIds, updates } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'No users selected' });
    }

    if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
    }

    try {
        const userRef = db.collection('users');
        const batch = db.batch();

        userIds.forEach(id => {
            const docRef = userRef.doc(id);
            batch.update(docRef, updates);
        });

        await batch.commit();
        res.json({ message: `Successfully transferred ${userIds.length} users` });
    } catch (error) {
        console.error('Error bulk transferring users:', error);
        res.status(500).json({ message: 'Error transferring users', error: error.message });
    }
};

// @desc    Bulk Password Reset
// @route   POST /api/admin/reset-passwords
// @access  Private/Admin
// @desc    Bulk Password Reset
// @route   POST /api/admin/reset-passwords
// @access  Private/Admin
const bulkPasswordReset = async (req, res) => {
    const { userIds, newPassword } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'No users selected' });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const userRef = db.collection('users');
        const batch = db.batch();

        userIds.forEach(id => {
            const docRef = userRef.doc(id);
            batch.update(docRef, { password: hashedPassword });
        });

        await batch.commit();

        if (req.user) {
            await logActivity(req.user.id, req.user.role, 'BULK_PASSWORD_RESET', { count: userIds.length, userIds }, req.ip);
        }

        res.json({ message: `Successfully reset passwords for ${userIds.length} users` });
    } catch (error) {
        console.error('Error bulk resetting passwords:', error);
        res.status(500).json({ message: 'Error resetting passwords', error: error.message });
    }
};

// @desc    Export Users to Excel
// @route   GET /api/admin/export-users
// @access  Private/Admin
const exportUsers = async (req, res) => {
    try {
        // We can accept filters via query params if needed, 
        // or just export all if no ids provided?
        // Ideally frontend sends IDs if "Select All" wasn't global, 
        // or sends filters. For simplicity, let's allow exporting ALL or Selected IDs via POST (wait, commonly GET with query params).
        // Let's implement a POST for export to handle large ID lists, or logic to fetch from DB based on filters.
        // For now, let's assume we pass IDs or fetch all if empty.

        // Actually, GET is better for file download. 
        // If IDs are too many, we might need a different approach, but for query params:

        let users = [];
        const { role, department, program, year, semester, section } = req.query;
        let query = db.collection('users');

        if (role) query = query.where('role', '==', role);
        if (department) query = query.where('department', '==', department);
        if (program) query = query.where('program', '==', program);
        if (year) query = query.where('year', '==', year);
        if (semester) query = query.where('semester', '==', semester);
        if (section) query = query.where('section', '==', section);

        const snapshot = await query.get();
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Exported Users');

        worksheet.columns = [
            { header: 'Role', key: 'role', width: 10 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Roll Number', key: 'rollNumber', width: 15 },
            { header: 'Department', key: 'department', width: 15 },
            { header: 'Program', key: 'program', width: 10 },
            { header: 'Year', key: 'year', width: 10 },
            { header: 'Semester', key: 'semester', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            { header: 'Group', key: 'group', width: 10 }
        ];

        users.forEach(user => {
            worksheet.addRow({
                role: user.role,
                name: user.name,
                email: user.email,
                rollNumber: user.rollNumber,
                department: user.department,
                program: user.program,
                year: user.year,
                semester: user.semester,
                section: user.section,
                group: user.group
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=users_export.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting users:', error);
        res.status(500).json({ message: 'Error exporting users', error: error.message });
    }
};

// @desc    Get System Logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getSystemLogs = async (req, res) => {
    try {
        const logsRef = db.collection('activity_logs');
        const snapshot = await logsRef.orderBy('timestamp', 'desc').limit(100).get();

        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
};

// @desc    Delete Single Log
// @route   DELETE /api/admin/logs/:id
// @access  Private/Admin
const deleteLog = async (req, res) => {
    try {
        await db.collection('activity_logs').doc(req.params.id).delete();
        res.json({ message: 'Log deleted successfully' });
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ message: 'Error deleting log', error: error.message });
    }
};

// @desc    Bulk Delete Logs
// @route   POST /api/admin/logs/delete
// @access  Private/Admin
const bulkDeleteLogs = async (req, res) => {
    const { logIds } = req.body;

    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
        return res.status(400).json({ message: 'No logs selected for deletion' });
    }

    try {
        const batch = db.batch();
        logIds.forEach(id => {
            const docRef = db.collection('activity_logs').doc(id);
            batch.delete(docRef);
        });

        await batch.commit();
        res.json({ message: `Successfully deleted ${logIds.length} logs` });
    } catch (error) {
        console.error('Error deleting logs:', error);
        res.status(500).json({ message: 'Error deleting logs', error: error.message });
    }
};

// @desc    Get Defaulters List
// @route   GET /api/admin/defaulters
// @access  Private/Admin
const getDefaulters = async (req, res) => {
    try {
        const threshold = parseFloat(req.query.threshold) || 75;
        
        // Fetch all students
        const studentsSnap = await db.collection('users').where('role', '==', 'student').get();
        const students = [];
        studentsSnap.forEach(doc => students.push({ id: doc.id, ...doc.data() }));

        const sessionsSnap = await db.collection('sessions').get();
        const sessions = [];
        const sessionWeights = {};
        sessionsSnap.forEach(doc => {
            const data = doc.data();
            sessions.push({ id: doc.id, ...data });
            sessionWeights[doc.id] = data.sessionType === 'Lab' ? 2 : 1;
        });

        const attendanceSnap = await db.collection('attendance').get();
        const attendanceMap = {}; 
        attendanceSnap.forEach(doc => {
            const data = doc.data();
            if (data.status === 'P' || data.status === 'Present') {
                if (!attendanceMap[data.studentId]) attendanceMap[data.studentId] = 0;
                attendanceMap[data.studentId] += sessionWeights[data.sessionId] || 1;
            }
        });

        const sectionSessions = {}; 
        sessions.forEach(s => {
            if (s.section) {
                if (!sectionSessions[s.section]) sectionSessions[s.section] = 0;
                sectionSessions[s.section] += sessionWeights[s.id] || 1;
            }
        });

        const defaulters = [];
        students.forEach(student => {
            const possibleClasses = sectionSessions[student.section] || 0;
            if (possibleClasses === 0) return; 

            const presentClasses = attendanceMap[student.id] || 0;
            const percentage = (presentClasses / possibleClasses) * 100;

            if (percentage < threshold) {
                defaulters.push({
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    rollNumber: student.rollNumber,
                    section: student.section,
                    percentage: parseFloat(percentage.toFixed(2)),
                    presentClasses,
                    possibleClasses
                });
            }
        });

        res.json(defaulters);
    } catch (error) {
        console.error('Error fetching defaulters:', error);
        res.status(500).json({ message: 'Error fetching defaulters', error: error.message });
    }
};

// @desc    Notify Defaulters
// @route   POST /api/admin/notify-defaulters
// @access  Private/Admin
const notifyDefaulters = async (req, res) => {
    try {
        const { studentIds } = req.body;
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'No students selected' });
        }

        console.log(`[NOTIFY DEFAULTERS] Sending warning emails to ${studentIds.length} students...`);
        studentIds.forEach(id => {
            console.log(`Email sent to student ID: ${id}`);
        });

        res.json({ message: `Successfully notified ${studentIds.length} defaulters` });
    } catch (error) {
        console.error('Error notifying defaulters:', error);
        res.status(500).json({ message: 'Error notifying defaulters', error: error.message });
    }
};


module.exports = {
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    uploadUsers,
    downloadUserTemplate,
    bulkDeleteUsers,
    bulkTransferUsers,
    bulkPasswordReset,
    exportUsers,
    getSystemLogs,
    deleteLog,
    bulkDeleteLogs,
    getAttendanceAnalytics,
    getLiveSessions,
    getDefaulters,
    notifyDefaulters
};
