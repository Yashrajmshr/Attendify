const { db } = require('./config/firebase');

async function checkUser() {
    try {
        const snapshot = await db.collection('users').where('email', '==', 'yashr72e5@gmail.com').get();
        if (snapshot.empty) {
            console.log('User not found');
            return;
        }
        snapshot.forEach(doc => {
            console.log('User data:', doc.data());
        });
    } catch (e) {
        console.error(e);
    }
}
checkUser();
