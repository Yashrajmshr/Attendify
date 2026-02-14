const { db } = require('./config/firebase');
const fs = require('fs');
const path = require('path');

async function check() {
    try {
        const usersSnapshot = await db.collection('users').get();
        let output = `Total Users: ${usersSnapshot.size}\n`;

        if (usersSnapshot.size === 0) {
            output += 'No users found.\n';
        } else {
            usersSnapshot.forEach(doc => {
                const d = doc.data();
                output += `[${doc.id}] ${d.role} - ${d.name} (${d.email})\n`;
            });
        }

        fs.writeFileSync(path.join(__dirname, 'users_dump.txt'), output);
        console.log('Dumped users to users_dump.txt');

    } catch (error) {
        console.error('Error:', error);
    }
}
check();
