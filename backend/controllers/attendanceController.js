const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User'); // Import User for include
const { getDistanceFromLatLonInMeters } = require('../utils/distance');

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private/Student
const markAttendance = async (req, res) => {
    const { sessionId, lat, lng } = req.body;

    const session = await Session.findByPk(sessionId);

    if (!session) {
        return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.isActive) {
        return res.status(400).json({ message: 'Session is no longer active' });
    }

    // Calculate distance
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
    const alreadyMarked = await Attendance.findOne({
        where: {
            sessionId,
            studentId: req.user.id
        }
    });

    if (alreadyMarked) {
        return res.status(400).json({ message: 'Attendance already marked' });
    }

    const attendance = await Attendance.create({
        sessionId,
        studentId: req.user.id,
        status: 'Present',
        lat,
        lng,
        distanceFromFaculty: distance
    });

    const json = attendance.toJSON();
    json._id = attendance.id;

    res.status(201).json(json);
};

// @desc    Get attendance for a specific session
// @route   GET /api/attendance/session/:sessionId
// @access  Private/Faculty
const getSessionAttendance = async (req, res) => {
    const attendance = await Attendance.findAll({
        where: { sessionId: req.params.sessionId },
        include: [{ model: User, as: 'student', attributes: ['name', 'rollNumber', 'section'] }],
        order: [['createdAt', 'DESC']]
    });

    // Flatten result for frontend if needed or keep structure
    // Sequelize include structure: attendance.student.name
    // Mongoose populate structure: attendance.studentId.name
    // To match frontend:
    const response = attendance.map(att => {
        const json = att.toJSON();
        json._id = att.id;
        json.studentId = json.student; // Field Alias for compatibility
        return json;
    });

    res.json(response);
};

// @desc    Get student's own attendance history
// @route   GET /api/attendance/my
// @access  Private/Student
const getStudentAttendance = async (req, res) => {
    const attendance = await Attendance.findAll({
        where: { studentId: req.user.id },
        include: [{ model: Session, attributes: ['subject', 'section', 'createdAt'] }],
        order: [['createdAt', 'DESC']]
    });

    const response = attendance.map(att => {
        const json = att.toJSON();
        json._id = att.id;
        json.sessionId = json.Session; // Field Alias for compatibility
        return json;
    });

    res.json(response);
};

module.exports = { markAttendance, getSessionAttendance, getStudentAttendance };
