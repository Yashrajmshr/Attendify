const { sequelize } = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        // Add 'admin' to enum if not exists (Postgres specific)
        try {
            await sequelize.query("ALTER TYPE \"enum_Users_role\" ADD VALUE 'admin';");
        } catch (e) {
            // Ignore if already exists
            console.log('Enum value might already exist or not supported:', e.message);
        }

        // Check if admin exists
        const adminExists = await User.findOne({ where: { email: 'admin@attendify.com' } });
        if (adminExists) {
            console.log('Admin user already exists.');
            process.exit();
        }

        // Create Admin
        await User.create({
            name: 'System Administrator',
            email: 'admin@attendify.com',
            password: 'adminpassword', // Will be hashed by hook
            role: 'admin',
            department: 'Administration'
        });

        console.log('Admin user created successfully.');
        console.log('Email: admin@attendify.com');
        console.log('Password: adminpassword');
        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
