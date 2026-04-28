const { db } = require('../config/firebase');

// @desc    Get all subjects
// @route   GET /api/metadata/subjects
// @access  Protected
const getSubjects = async (req, res) => {
    try {
        const snapshot = await db.collection('subjects').get();
        const subjects = [];
        snapshot.forEach(doc => {
            subjects.push({ id: doc.id, ...doc.data() });
        });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add a subject
// @route   POST /api/metadata/subjects
// @access  Private/Admin
const addSubject = async (req, res) => {
    const { name, code } = req.body;
    if (!name || !code) {
        return res.status(400).json({ message: 'Name and Code are required' });
    }

    try {
        const docRef = await db.collection('subjects').add({
            name,
            code,
            createdAt: new Date().toISOString()
        });
        res.status(201).json({ id: docRef.id, name, code, message: 'Subject added' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a subject
// @route   DELETE /api/metadata/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res) => {
    try {
        await db.collection('subjects').doc(req.params.id).delete();
        res.json({ message: 'Subject deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all sections
// @route   GET /api/metadata/sections
// @access  Protected
const getSections = async (req, res) => {
    try {
        const snapshot = await db.collection('sections').get();
        const sections = [];
        snapshot.forEach(doc => {
            sections.push({ id: doc.id, ...doc.data() });
        });
        // Sort sections alphabetically if needed, though frontend can handle it
        sections.sort((a, b) => a.name.localeCompare(b.name));
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add a section
// @route   POST /api/metadata/sections
// @access  Private/Admin
const addSection = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Section name is required' });
    }

    try {
        // Check duplicate
        const snapshot = await db.collection('sections').where('name', '==', name).get();
        if (!snapshot.empty) {
            return res.status(400).json({ message: 'Section already exists' });
        }

        const docRef = await db.collection('sections').add({
            name,
            createdAt: new Date().toISOString()
        });
        res.status(201).json({ id: docRef.id, name, message: 'Section added' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a section
// @route   DELETE /api/metadata/sections/:id
// @access  Private/Admin
const deleteSection = async (req, res) => {
    try {
        await db.collection('sections').doc(req.params.id).delete();
        res.json({ message: 'Section deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getSubjects,
    addSubject,
    deleteSubject,
    getSections,
    addSection,
    deleteSection
};
