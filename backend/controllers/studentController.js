const User = require('../models/User');
const ExcelJS = require('exceljs');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// @desc    Add a single student
// @route   POST /api/student
// @access  Private/Faculty
const addStudent = async (req, res) => {
    const { name, email, password, rollNumber, department, section } = req.body;

    try {
        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'student',
            rollNumber,
            department,
            section
        });

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
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

        // Filter duplicates from DB check is complex in bulk. 
        // Sequelize bulkCreate with updateOnDuplicate or ignoreDuplicates is an option.
        // For simplicity with bcrypt, we'll loop check-create.

        let count = 0;
        for (const student of studentsToCreate) {
            const exists = await User.findOne({ where: { email: student.email } });
            if (!exists) {
                await User.create(student); // Password hook will hash it
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
    const students = await User.findAll({
        where: { role: 'student' },
        attributes: { exclude: ['password'] }
    });

    const response = students.map(s => {
        const json = s.toJSON();
        json._id = s.id;
        return json;
    });

    res.json(response);
};

module.exports = { addStudent, uploadStudents, getStudents };
