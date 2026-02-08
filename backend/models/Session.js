const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    section: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lat: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    lng: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    radius: {
        type: DataTypes.INTEGER, // in meters
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // Foreign key defined in associations
});

// Associations
Session.belongsTo(User, { as: 'faculty', foreignKey: 'facultyId' });

module.exports = Session;
