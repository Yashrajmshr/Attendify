const { db } = require('./config/firebase');
const bcrypt = require('bcryptjs');

async function create() {
    try {
        const email = 'debug_admin@test.com';
        const password = 'password';

        const snap = await db.collection('users').where('email', '==', email).get();
        if (!snap.empty) {
            console.log('Debug admin exists.');
            // Update password to be sure
            const user = snap.docs[0];
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            await user.ref.update({ password: hash });
            console.log('Updated password for debug admin');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await db.collection('users').add({
            name: 'Debug Admin',
            email,
            password: hash,
            role: 'admin',
            createdAt: new Date().toISOString()
        });
        console.log('Created debug admin: debug_admin@test.com / password');
        process.exit();
    } catch (e) { console.error(e); }
}
create();
