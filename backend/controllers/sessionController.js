const Session = require('../models/Session');

// @desc    Create a new attendance session
// @route   POST /api/session
// @access  Private/Faculty
const createSession = async (req, res) => {
    const { subject, section, lat, lng, radius } = req.body;

    if (!lat || !lng || !radius) {
        return res.status(400).json({ message: 'Location and radius are required' });
    }

    try {
        const session = await Session.create({
            facultyId: req.user.id,
            subject,
            section,
            lat,
            lng,
            radius
        });

        // Map to frontend expected format if needed, or update frontend. 
        // For now, let's keep response similar but id is `id` not `_id`. 
        // We will inject `_id` alias in response to minimize frontend breakage.
        const responseSession = session.toJSON();
        responseSession._id = session.id;

        res.status(201).json(responseSession);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all sessions for a faculty
// @route   GET /api/session
// @access  Private/Faculty
const getSessions = async (req, res) => {
    const sessions = await Session.findAll({
        where: { facultyId: req.user.id },
        order: [['createdAt', 'DESC']]
    });

    // Map for frontend compatibility
    const responseSessions = sessions.map(s => {
        const json = s.toJSON();
        json._id = s.id;
        return json;
    });

    res.json(responseSessions);
};

// @desc    Get session by ID
// @route   GET /api/session/:id
// @access  Private
const getSessionById = async (req, res) => {
    const session = await Session.findByPk(req.params.id);

    if (session) {
        const json = session.toJSON();
        json._id = session.id;
        res.json(json);
    } else {
        res.status(404).json({ message: 'Session not found' });
    }
};

module.exports = { createSession, getSessions, getSessionById };
