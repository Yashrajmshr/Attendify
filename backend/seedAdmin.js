const { db } = require('./config/firebase');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        const userRef = db.collection('users');
        const snapshot = await userRef.where('email', '==', 'admin@attendify.com').get();

        if (!snapshot.empty) {
            console.log('Admin user already exists.');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('adminpassword', salt);

        await userRef.add({
            name: 'System Administrator',
            email: 'admin@attendify.com',
            password: hashedPassword,
            role: 'admin',
            department: 'Administration',
            createdAt: new Date().toISOString()
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
