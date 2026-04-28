const { db } = require('../config/firebase');

/**
 * Log activity to Firestore
 * @param {string} userId - ID of the user performing the action
 * @param {string} userRole - Role of the user (admin, faculty, student)
 * @param {string} action - Short description of action (e.g., 'LOGIN', 'DELETE_USER')
 * @param {object} details - Additional details about the action
 * @param {string} ip - IP address of the user
 * @param {string} status - 'SUCCESS' or 'FAILURE'
 */
const logActivity = async (userId, userRole, action, details, ip, status = 'SUCCESS') => {
    try {
        await db.collection('activity_logs').add({
            userId,
            userRole,
            action,
            details,
            ip: ip || 'unknown',
            status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to write log:', error);
    }
};

module.exports = { logActivity };
