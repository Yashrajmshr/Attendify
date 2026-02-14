async function test() {
    try {
        console.log('1. Login as Admin...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@attendify.com', password: 'adminpassword' })
        });
        const token = (await loginRes.json()).token;
        if (!token) throw new Error('Login failed');

        console.log('2. Create Dummy User...');
        const createRes = await fetch('http://localhost:5000/api/admin/create-user', {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User', email: 'testuser@example.com', password: 'password123',
                role: 'student', department: 'CS', rollNumber: 'TEST001'
            })
        });
        const createdUser = await createRes.json();
        console.log('Created:', createRes.status, createdUser.id);
        const userId = createdUser.id;

        if (userId) {
            console.log('3. Update User...');
            const updateRes = await fetch(`http://localhost:5000/api/admin/update-user/${userId}`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Updated Test User' })
            });
            console.log('Updated:', updateRes.status, await updateRes.json());

            console.log('4. Delete User...');
            const deleteRes = await fetch(`http://localhost:5000/api/admin/delete-user/${userId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Deleted:', deleteRes.status, await deleteRes.json());
        }

    } catch (e) { console.error(e); }
}
test();
