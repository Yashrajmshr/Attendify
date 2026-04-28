const { db } = require('../config/firebase');
const ExcelJS = require('exceljs');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// @desc    Add a single student
// @route   POST /api/student
// @access  Private/Faculty
const addStudent = async (req, res) => {
    const { name, email, password, rollNumber, department, program, section, year, group } = req.body;

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
            role: 'student',
            rollNumber,
            department,
            program,
            section,
            year,
            group: group ? Number(group) : null,
            createdAt: new Date().toISOString()
        };

        const docRef = await userRef.add(newUser);

        res.status(201).json({
            _id: docRef.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        });
    } catch (error) {
        res.status(400).json({ message: 'Invalid user data', error: error.message });
    }
};

// @desc    Upload students via Excel
// @route   POST /api/student/upload
// @access  Private/Faculty
// @desc    Upload students via Excel/CSV
// @route   POST /api/student/upload
// @access  Private/Faculty
// @desc    Upload students via Excel/CSV
// @route   POST /api/student/upload
// @access  Private (Faculty/Admin)
const uploadStudents = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload an Excel or CSV file' });
    }

    // Get default section/department from request body (e.g., from Admin Section Management)
    // Get default section/department from request body (e.g., from Admin Section Management)
    const defaultDepartment = req.body.department;
    let defaultProgram = req.body.program;
    let defaultSection = req.body.section;
    let defaultYear = req.body.year;

    // Sanitize "undefined" strings that might come from FormData
    if (defaultProgram === 'undefined' || defaultProgram === 'null') defaultProgram = null;
    if (defaultYear === 'undefined' || defaultYear === 'null') defaultYear = null;

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
        const studentsToProcess = [];

        // First pass: Collect data
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const rollNumber = row.getCell(1).text ? row.getCell(1).text.toString() : null;
            const name = row.getCell(2).text;
            let email = row.getCell(3).text;
            // Use cell value if present, otherwise use default from body
            const department = row.getCell(4).text || defaultDepartment;
            const program = defaultProgram; // Program usually not in CSV, take from context
            const semester = row.getCell(5).text;
            const section = row.getCell(6).text || defaultSection;
            const group = row.getCell(7).text; // Group is column 7
            const year = defaultYear; // Year from context

            if (!rollNumber || !name) {
                summary.failed_rows.push({ row: rowNumber, reason: 'Missing roll_number or student_name' });
                return;
            }

            if (!department) {
                summary.failed_rows.push({ row: rowNumber, reason: 'Missing department (and no default provided)' });
                return;
            }

            // Generate default email if missing
            if (!email) {
                email = `${rollNumber.toLowerCase()}@college.edu`;
            }

            // Auto-generate credentials
            const passwordPlain = `${name.replace(/\s+/g, '')}@123`;

            studentsToProcess.push({
                rowNumber,
                name,
                email,
                passwordPlain,
                role: 'student',
                rollNumber,
                department,
                program,
                semester,
                section,
                year,
                group: group ? Number(group) : null,
                list_order: rowNumber - 1
            });
        });

        summary.total_uploaded = studentsToProcess.length;

        const userRef = db.collection('users');
        const salt = await bcrypt.genSalt(10);

        for (const student of studentsToProcess) {
            // Check for duplicate email
            const emailSnapshot = await userRef.where('email', '==', student.email).get();
            if (!emailSnapshot.empty) {
                summary.failed_rows.push({ row: student.rowNumber, reason: `Email ${student.email} already exists` });
                continue;
            }

            // Check for duplicate roll number within the same department? 
            // Or globally? Usually unique globally or per university. Let's assume global uniqueness for rollNumber.
            // But wait, if we are updating, maybe we should update? 
            // For now, let's skip if exists. 
            // Actually, we might want to check by rollNumber.
            const rollSnapshot = await userRef.where('rollNumber', '==', student.rollNumber).get();
            if (!rollSnapshot.empty) {
                summary.failed_rows.push({ row: student.rowNumber, reason: `Roll Number ${student.rollNumber} already exists` });
                continue;
            }

            const hashedPassword = await bcrypt.hash(student.passwordPlain, salt);

            const newStudent = {
                name: student.name,
                email: student.email,
                password: hashedPassword,
                role: 'student',
                rollNumber: student.rollNumber,
                department: student.department || null,
                program: student.program || null,
                semester: student.semester || null,
                section: student.section || null,
                year: student.year || null,
                group: student.group || null,
                list_order: student.list_order,
                createdAt: new Date().toISOString()
            };

            await userRef.add(newStudent);
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

// @desc    Download students of a section
// @route   POST /api/student/download-section
// @access  Private (Faculty/Admin)
const downloadSectionStudents = async (req, res) => {
    const { section, department, program, year } = req.body;

    if (!section || !department) {
        return res.status(400).json({ message: 'Please provide section and department' });
    }

    try {
        const userRef = db.collection('users');
        // Query by Department and Section first (broadest scope)
        let snapshot = await userRef
            .where('role', '==', 'student')
            .where('department', '==', department)
            .where('section', '==', section);

        // Optional: Filter by semester if provided
        if (req.body.semester) {
            // Note: In Firestore, you can chained where clauses.
            // However, if some students don't have a semester field, they won't be returned.
            // Given the new hierarchy, we should probably filter by it if it's passed.
            // But let's do it in memory to be safe with mixed data for now, 
            // or add it to the query if we are sure.
            // Let's stick to the current broad query and filter in loop for maximum compatibility during migration.
        }

        snapshot = await userRef.get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No students found in this section' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${department} - Section ${section}`);

        worksheet.columns = [
            { header: 'Roll Number', key: 'rollNumber', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Department', key: 'department', width: 15 },
            { header: 'Program', key: 'program', width: 15 }, // Added Program column
            { header: 'Year', key: 'year', width: 10 },       // Added Year column
            { header: 'Semester', key: 'semester', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            { header: 'Group', key: 'group', width: 10 }      // Added Group column
        ];

        let studentCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();

            // Filter logic:
            // 1. Strict match if student has program/year
            // 2. Loose match if student DOES NOT have program/year (legacy data)
            // Filter logic:
            // 1. Strict match if student has program/year/semester
            // 2. Loose match if student DOES NOT have them (legacy data)
            const programMatch = !program || !data.program || data.program === program;
            const yearMatch = !year || !data.year || data.year.toString() === year.toString();
            const semesterMatch = !req.body.semester || !data.semester || data.semester.toString() === req.body.semester.toString();

            if (programMatch && yearMatch && semesterMatch) {
                worksheet.addRow({
                    rollNumber: data.rollNumber,
                    name: data.name,
                    email: data.email,
                    department: data.department,
                    program: data.program || program || '', // Use data or context or empty
                    year: data.year || year || '',
                    semester: data.semester,
                    year: data.year || year || '',
                    semester: data.semester,
                    section: data.section,
                    group: data.group || ''
                });
                studentCount++;
            }
        });

        if (studentCount === 0) {
            return res.status(404).json({ message: 'No students found matching these criteria' });
        }

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=students_${department}_${section}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        res.status(500).json({ message: 'Error generating file', error: error.message });
    }
};

// @desc    Get all students
// @route   GET /api/student
// @access  Private/Faculty
const getStudents = async (req, res) => {
    try {
        const userRef = db.collection('users');
        const snapshot = await userRef.where('role', '==', 'student').get();

        const students = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            delete data.password;
            students.push({ ...data, _id: doc.id });
        });



        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Download template for bulk upload
// @route   GET /api/student/template
// @access  Private/Faculty
const downloadTemplate = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Students');

        worksheet.columns = [
            { header: 'Roll Number', key: 'rollNumber', width: 15 },
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'Email (Optional)', key: 'email', width: 30 },
            { header: 'Department', key: 'department', width: 15 },
            { header: 'Semester', key: 'semester', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            { header: 'Group', key: 'group', width: 10 }
        ];

        // Add example row
        worksheet.addRow({
            rollNumber: 'CS101',
            name: 'John Doe',
            email: '',
            department: 'CS',
            semester: '1',
            section: 'A',
            group: '1'
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=student_template.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ message: 'Error generating template', error: error.message });
    }
};

const resetDeviceBinding = async (req, res) => {
    try {
        const { id } = req.params;
        const userRef = db.collection('users').doc(id);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Student not found' });
        }

        await userRef.update({
            deviceId: null,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        });

        res.json({ message: 'Device binding reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { addStudent, uploadStudents, getStudents, downloadTemplate, downloadSectionStudents, resetDeviceBinding };
