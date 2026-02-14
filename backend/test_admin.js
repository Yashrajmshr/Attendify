async function test() {
    try {
        console.log('Logging in as admin...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@attendify.com',
                password: 'adminpassword'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login:', loginRes.status);

        if (loginRes.status === 200) {
            const token = loginData.token;
            console.log('Fetching users...');
            const usersRes = await fetch('http://localhost:5000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await usersRes.json();
            console.log('Users fetch status:', usersRes.status);
            console.log('Users count:', Array.isArray(users) ? users.length : 'Not an array');
            if (!Array.isArray(users)) console.log(users);
        } else {
            console.log('Login failed:', loginData);
        }
    } catch (e) { console.error(e); }
}
test();
