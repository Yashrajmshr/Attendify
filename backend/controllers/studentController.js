const { db } = require('../config/firebase');
const ExcelJS = require('exceljs');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// @desc    Add a single student
// @route   POST /api/student
// @access  Private/Faculty
const addStudent = async (req, res) => {
    const { name, email, password, rollNumber, department, section } = req.body;

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
            section,
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
const uploadStudents = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const worksheet = workbook.getWorksheet(1);

        const studentsToCreate = [];

        // First pass: Collect data
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const name = row.getCell(1).text;
            const email = row.getCell(2).text;
            const password = row.getCell(3).text || '123456';
            const rollNumber = row.getCell(4).text;
            const department = row.getCell(5).text;
            const section = row.getCell(6).text;

            if (email && rollNumber) {
                studentsToCreate.push({
                    name,
                    email,
                    password,
                    role: 'student',
                    rollNumber,
                    department,
                    section
                });
            }
        });

        let count = 0;
        const userRef = db.collection('users');
        const salt = await bcrypt.genSalt(10);

        // This is slow for large datasets but safer. Batched writes can be used for up to 500 items.
        for (const student of studentsToCreate) {
            const snapshot = await userRef.where('email', '==', student.email).get();
            if (snapshot.empty) {
                student.password = await bcrypt.hash(student.password, salt);
                student.createdAt = new Date().toISOString();
                await userRef.add(student);
                count++;
            }
        }

        // Cleanup file
        fs.unlinkSync(req.file.path);

        res.status(201).json({ message: `${count} students added successfully` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing file' });
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

module.exports = { addStudent, uploadStudents, getStudents };
