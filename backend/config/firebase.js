const admin = require('firebase-admin');
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    try {
        serviceAccount = require('./attendify-1d0ca-firebase-adminsdk-fbsvc-1e4acd84ac.json');
    } catch (e) {
        console.error("FIREBASE_SERVICE_ACCOUNT environment variable is not set, and local credentials file is missing.");
    }
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized');
} catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
}

const db = admin.firestore();

module.exports = { db, admin };
