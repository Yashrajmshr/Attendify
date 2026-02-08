const { Sequelize } = require('sequelize');

require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('SQLite Connected via Sequelize');

        // Sync models
        await sequelize.sync();
        console.log('Database Synced');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, connectDB };
