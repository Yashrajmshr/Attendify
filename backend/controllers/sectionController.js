const { db } = require('../config/firebase');
const ExcelJS = require('exceljs');
const fs = require('fs');

// @desc    Create a new section
// @route   POST /api/sections
// @access  Private/Admin
const createSection = async (req, res) => {
    const { name, department, program, year, semester } = req.body;

    if (!name || !department || !program || !year || !semester) {
        return res.status(400).json({ message: 'Please provide name, department, program, year, and semester' });
    }

    try {
        const sectionRef = db.collection('sections');
        // Check if section with same name, department, program AND year exists
        const snapshot = await sectionRef
            .where('name', '==', name)
            .where('department', '==', department)
            .where('program', '==', program)
            .where('year', '==', year.toString())
            .where('semester', '==', semester.toString())
            .get();

        if (!snapshot.empty) {
            return res.status(400).json({ message: 'Section with this name already exists in this department, program, year, and semester' });
        }

        const newSection = {
            name,
            department,
            program,
            year: year.toString(),
            semester: semester.toString(),
            createdAt: new Date().toISOString()
        };

        const docRef = await sectionRef.add(newSection);

        res.status(201).json({
            id: docRef.id,
            ...newSection
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all sections
// @route   GET /api/sections
// @access  Private/Admin
const getSections = async (req, res) => {
    try {
        const sectionsRef = db.collection('sections');
        const snapshot = await sectionsRef.get();

        const sections = [];
        snapshot.forEach(doc => {
            sections.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a section
// @route   PUT /api/sections/:id
// @access  Private/Admin
const updateSection = async (req, res) => {
    const { id } = req.params;
    const { name, department, program } = req.body;

    try {
        const sectionRef = db.collection('sections').doc(id);
        const doc = await sectionRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Section not found' });
        }

        const updatedSection = {
            name: name || doc.data().name,
            department: department || doc.data().department,
            program: program || doc.data().program,
            year: req.body.year ? req.body.year.toString() : doc.data().year, // Handle year update
            semester: req.body.semester ? req.body.semester.toString() : doc.data().semester,
            updatedAt: new Date().toISOString()
        };

        await sectionRef.update(updatedSection);

        res.json({
            id,
            ...updatedSection
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a section
// @route   DELETE /api/sections/:id
// @access  Private/Admin
const deleteSection = async (req, res) => {
    const { id } = req.params;

    try {
        const sectionRef = db.collection('sections').doc(id);
        const doc = await sectionRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Section not found' });
        }

        await sectionRef.delete();

        res.json({ message: 'Section deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Upload sections via Excel/CSV
// @route   POST /api/sections/upload
// @access  Private/Admin
const uploadSections = async (req, res) => {
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
        const sectionsToProcess = [];

        // First pass: Collect data
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            // Expected format: Department, Program, Year, Semester, Section Name
            const department = row.getCell(1).text ? row.getCell(1).text.toString().trim() : null;
            const program = row.getCell(2).text ? row.getCell(2).text.toString().trim() : null;
            const year = row.getCell(3).text ? row.getCell(3).text.toString().trim() : null;
            const semester = row.getCell(4).text ? row.getCell(4).text.toString().trim() : null;
            const name = row.getCell(5).text ? row.getCell(5).text.toString().trim() : null;

            if (!department || !program || !year || !semester || !name) {
                summary.failed_rows.push({ row: rowNumber, reason: 'Missing department, program, year, semester, or name' });
                return;
            }

            sectionsToProcess.push({
                rowNumber,
                department,
                program,
                year,
                semester,
                name
            });
        });

        summary.total_uploaded = sectionsToProcess.length;

        const sectionRef = db.collection('sections');

        for (const section of sectionsToProcess) {
            // Check for duplicate
            const snapshot = await sectionRef
                .where('name', '==', section.name)
                .where('department', '==', section.department)
                .where('program', '==', section.program)
                .where('year', '==', section.year)
                .where('semester', '==', section.semester)
                .get();

            if (!snapshot.empty) {
                summary.failed_rows.push({ row: section.rowNumber, reason: `Section ${section.name} already exists in ${section.department} / ${section.program} Year ${section.year} Sem ${section.semester}` });
                continue;
            }

            const newSection = {
                name: section.name,
                department: section.department,
                program: section.program,
                year: section.year,
                semester: section.semester,
                createdAt: new Date().toISOString()
            };

            await sectionRef.add(newSection);
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

// @desc    Download section upload template
// @route   GET /api/sections/template
// @access  Private/Admin
const downloadSectionTemplate = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sections Template');

        worksheet.columns = [
            { header: 'Department', key: 'department', width: 20 },
            { header: 'Program', key: 'program', width: 15 },
            { header: 'Year', key: 'year', width: 10 },
            { header: 'Semester', key: 'semester', width: 10 },
            { header: 'Name', key: 'name', width: 15 }
        ];

        // Add example rows
        worksheet.addRow({ department: 'Computer Science', program: 'B.Tech', year: '1', semester: '1', name: 'A' });
        worksheet.addRow({ department: 'Computer Science', program: 'M.Tech', year: '1', semester: '1', name: 'A' });
        worksheet.addRow({ department: 'Electrical', program: 'B.E.', year: '2', semester: '3', name: 'B' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=section_upload_template.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ message: 'Error generating template' });
    }
};

// @desc    Update hierarchy (Rename Department, Program, or Year)
// @route   PUT /api/sections/hierarchy
// @access  Private/Admin
const updateSectionHierarchy = async (req, res) => {
    const { type, oldValue, newValue, department, program } = req.body; // department/program needed for context

    if (!type || !oldValue || !newValue) {
        return res.status(400).json({ message: 'Please provide type, oldValue, and newValue' });
    }

    try {
        const sectionsRef = db.collection('sections');
        let snapshot;

        if (type === 'department') {
            snapshot = await sectionsRef.where('department', '==', oldValue).get();
        } else if (type === 'program') {
            if (!department) {
                return res.status(400).json({ message: 'Department is required when renaming a program' });
            }
            snapshot = await sectionsRef
                .where('department', '==', department)
                .where('program', '==', oldValue)
                .get();
        } else if (type === 'year') {
            if (!department || !program) {
                return res.status(400).json({ message: 'Department and Program are required form renaming a year' });
            }
            snapshot = await sectionsRef
                .where('department', '==', department)
                .where('program', '==', program)
                .where('year', '==', oldValue)
                .get();
        } else if (type === 'semester') {
            if (!department || !program || !req.body.year) {
                return res.status(400).json({ message: 'Department, Program and Year are required form renaming a semester' });
            }
            snapshot = await sectionsRef
                .where('department', '==', department)
                .where('program', '==', program)
                .where('year', '==', req.body.year.toString())
                .where('semester', '==', oldValue)
                .get();
        } else {
            return res.status(400).json({ message: 'Invalid type. Must be "department", "program", "year", or "semester"' });
        }

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No matching sections found' });
        }

        const batch = db.batch();
        let updateCount = 0;

        snapshot.forEach(doc => {
            const docRef = sectionsRef.doc(doc.id);
            if (type === 'department') {
                batch.update(docRef, { department: newValue });
            } else if (type === 'program') {
                batch.update(docRef, { program: newValue });
            } else if (type === 'year') {
                batch.update(docRef, { year: newValue });
            } else if (type === 'semester') {
                batch.update(docRef, { semester: newValue });
            }
            updateCount++;
        });

        await batch.commit();

        res.json({ message: `Successfully updated ${updateCount} sections`, count: updateCount });

    } catch (error) {
        console.error('Error updating hierarchy:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete hierarchy (Department, Program, or Year)
// @route   DELETE /api/sections/hierarchy
// @access  Private/Admin
const deleteSectionHierarchy = async (req, res) => {
    const { type, value, department, program, year } = req.body; // Added year destructuring

    if (!type || !value) {
        return res.status(400).json({ message: 'Please provide type and value' });
    }

    try {
        const sectionsRef = db.collection('sections');
        let snapshot;

        if (type === 'department') {
            snapshot = await sectionsRef.where('department', '==', value).get();
        } else if (type === 'program') {
            if (!department) {
                return res.status(400).json({ message: 'Department is required when deleting a program' });
            }
            snapshot = await sectionsRef
                .where('department', '==', department)
                .where('program', '==', value)
                .get();
        } else if (type === 'year') {
            if (!department || !program) {
                return res.status(400).json({ message: 'Department and Program are required when deleting a year' });
            }
            snapshot = await sectionsRef
                .where('department', '==', department)
                .where('program', '==', program)
                .where('year', '==', value)
                .get();
        } else if (type === 'semester') {
            if (!department || !program || !year) {
                return res.status(400).json({ message: 'Department, Program and Year are required when deleting a semester' });
            }
            snapshot = await sectionsRef
                .where('department', '==', department)
                .where('program', '==', program)
                .where('year', '==', year)
                .where('semester', '==', value)
                .get();
        } else {
            return res.status(400).json({ message: 'Invalid type. Must be "department", "program", "year", or "semester"' });
        }

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No matching sections found to delete' });
        }

        const batch = db.batch();
        let deleteCount = 0;

        snapshot.forEach(doc => {
            batch.delete(doc.ref);
            deleteCount++;
        });

        await batch.commit();

        res.json({ message: `Successfully deleted ${deleteCount} sections`, count: deleteCount });

    } catch (error) {
        console.error('Error deleting hierarchy:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createSection,
    getSections,
    updateSection,
    deleteSection,
    uploadSections,
    downloadSectionTemplate,
    updateSectionHierarchy,
    deleteSectionHierarchy
};
