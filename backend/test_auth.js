async function test() {
    try {
        const email = `test${Date.now()}@test.com`;
        console.log('Registering:', email);
        const regRes = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email,
                password: 'password123',
                role: 'student',
                department: 'CS'
            })
        });
        const regData = await regRes.json();
        console.log('Reg:', regRes.status, regData);

        if (regRes.status === 201) {
            console.log('Logging in...');
            const loginRes = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password: 'password123'
                })
            });
            const loginData = await loginRes.json();
            console.log('Login:', loginRes.status, loginData);
        }
    } catch (e) { console.error(e); }
}
test();
