const { db } = require('./config/firebase');

async function dump() {
    try {
        console.log('Dumping users...');
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            console.log('No users found.');
            return;
        }

        snapshot.forEach(doc => {
            const u = doc.data();
            console.log(`User: ${u.email} | Pwd: ${u.password ? typeof u.password : 'MISSING'} | Role: ${u.role}`);
        });
        console.log('Done.');
    } catch (e) {
        console.error(e);
    }
}
dump();
