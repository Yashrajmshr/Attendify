const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Session = require('./Session');
const User = require('./User');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    status: {
        type: DataTypes.ENUM('Present', 'Absent'),
        defaultValue: 'Present'
    },
    lat: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    lng: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    distanceFromFaculty: {
        type: DataTypes.FLOAT, // in meters
        allowNull: false
    }
});

// Associations
Attendance.belongsTo(Session, { foreignKey: 'sessionId' });
Attendance.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

module.exports = Attendance;
