async function test() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@attendify.com',
                password: 'adminpassword'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        const usersRes = await fetch('http://localhost:5000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await usersRes.json();

        if (users.length > 0) {
            console.log('First user keys:', Object.keys(users[0]));
            console.log('Use _id:', users[0]._id);
            console.log('Use id:', users[0].id);
        } else {
            console.log('No users found.');
        }

    } catch (e) { console.error(e); }
}
test();
