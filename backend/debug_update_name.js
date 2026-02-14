async function test() {
    try {
        console.log('Login...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'debug_admin@test.com', password: 'password' })
        });
        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        if (!loginRes.ok) {
            console.error('Login Failed:', loginData);
            return;
        }
        const token = loginData.token;

        // Create user
        console.log('Creating User...');
        const createRes = await fetch('http://localhost:5000/api/admin/create-user', {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Original Name', email: 'update_test_2@example.com', password: 'password', // Changed email to avoid collision
                role: 'student', department: 'CS', rollNumber: 'UP002', section: 'A'
            })
        });
        const user = await createRes.json();
        console.log('Create Status:', createRes.status);
        if (!createRes.ok) {
            console.error('Create Failed:', user);
            // If user already exists, we might need to find it or pick a random email
            return;
        }
        console.log('Created User ID:', user.id);

        // Update with FULL payload
        const payload = {
            name: 'Updated Name',
            email: 'update_test_2@example.com',
            password: '',
            role: 'student',
            rollNumber: 'UP002',
            department: 'CS',
            section: 'A'
        };

        console.log('Updating...');
        const updateRes = await fetch(`http://localhost:5000/api/admin/update-user/${user.id}`, {
            method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const updatedUser = await updateRes.json();
        console.log('Update Status:', updateRes.status);
        console.log('Updated User Name:', updatedUser.name);

        // Clean up
        await fetch(`http://localhost:5000/api/admin/delete-user/${user.id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });

    } catch (e) { console.error('Script Error:', e); }
}
test();
