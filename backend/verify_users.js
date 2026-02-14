const { db } = require('./config/firebase');

async function verify() {
    try {
        console.log('Checking users collection...');
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            console.log('No users found.');
            return;
        }

        snapshot.forEach(doc => {
            const user = doc.data();
            console.log(`User: ${user.email}, ID: ${doc.id}`);
            if (!user.password) {
                console.error(`  MISSING PASSWORD for ${user.email}`);
            } else {
                console.log(`  Password type: ${typeof user.password}`);
                if (typeof user.password !== 'string') {
                    console.error(`  INVALID PASSWORD TYPE for ${user.email}`);
                }
            }
        });
        console.log('Verification complete.');
    } catch (error) {
        console.error('Error:', error);
    }
}

verify();
