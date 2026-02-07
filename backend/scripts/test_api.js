async function test() {
    console.log('--- Starting API Verification (Fixed Schema) ---');
    const baseUrl = 'http://localhost:3000/api';
    const timestamp = Date.now();
    const credentials = {
        email: `test_${timestamp}@example.com`,
        password: 'password123',
        name: 'Test Carrier'
    };

    // 1. Signup
    console.log('Testing Signup for:', credentials.email);
    const signupResponse = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    console.log('Signup Status:', signupResponse.status);
    const signupData = await signupResponse.json();
    console.log('Signup Response:', JSON.stringify(signupData, null, 2));

    if (signupResponse.status === 201 || signupResponse.status === 200) {
        // 2. Login
        console.log('\nTesting Login...');
        const loginResponse = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.password
            })
        });
        console.log('Login Status:', loginResponse.status);
        const loginData = await loginResponse.json();
        console.log('Login Response:', JSON.stringify(loginData, null, 2));

        if (loginData.access_token) {
            const token = loginData.access_token;
            const authHeader = { 'Authorization': `Bearer ${token}` };

            // 3. Get Slot Availability (AI Endpoint)
            console.log('\nTesting Slot Availability (AI)...');
            const slotsResponse = await fetch(`${baseUrl}/ai/slot-availability`, { headers: authHeader });
            console.log('Slots Status:', slotsResponse.status);
            const slotsData = await slotsResponse.json();
            console.log('Slots Response:', JSON.stringify(slotsData, null, 2));

            // 4. Get Bookings
            console.log('\nTesting Get Bookings...');
            const bookingsResponse = await fetch(`${baseUrl}/bookings`, { headers: authHeader });
            console.log('Bookings Status:', bookingsResponse.status);
            const bookingsData = await bookingsResponse.json();
            console.log('Bookings Response:', JSON.stringify(bookingsData, null, 2));

            console.log('\n--- API Verification Completed Successfully ---');
        } else {
            console.error('Login failed.');
        }
    } else {
        console.error('Signup failed.');
    }
}

test();
