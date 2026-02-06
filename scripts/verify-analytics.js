const fetch = require('node-fetch');

async function runVerification() {
    const API_URL = 'http://localhost:3000/api';

    console.log('🚀 Starting Analytics Verification...');

    // 1. Login as Operator
    console.log('🔐 Logging in as Operator...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'op@port.com', password: '123456' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
        console.error('❌ Login failed:', JSON.stringify(loginData, null, 2));
        process.exit(1);
    }
    const token = loginData.access_token;
    console.log('✅ Token received');

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 1.5 Get Profile to find operator ID
    const profileRes = await fetch(`${API_URL}/auth/profile`, { headers });
    const profileData = await profileRes.json();
    const operatorId = profileData.sub;
    console.log(`✅ Operator authenticated (ID: ${operatorId})`);

    // 2. Check Capabilities
    console.log('📊 Checking Capabilities...');
    const capRes = await fetch(`${API_URL}/analytics/capabilities`, { headers });
    const capData = await capRes.json();
    console.log('Capabilities:', JSON.stringify(capData, null, 2));

    // 3. Create some dummy actions to have logs
    console.log('📝 Generating sample actions...');
    // We need a booking to confirm/reject
    const bookingsRes = await fetch(`${API_URL}/bookings`, { headers });
    const bookings = await bookingsRes.json();
    const pendingBooking = (Array.isArray(bookings) ? bookings : bookings.data || []).find(b => b.status === 'PENDING');

    if (pendingBooking) {
        console.log(`Processing booking ${pendingBooking.id}...`);
        await fetch(`${API_URL}/bookings/${pendingBooking.id}/confirm`, { method: 'PUT', headers });
    } else {
        console.log('No pending bookings found, manually triggering some logs might be needed if script fails.');
    }

    // 4. Test Logs
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    console.log('📜 Fetching Operator Logs...');
    const logsRes = await fetch(`${API_URL}/analytics/operators/${operatorId}/logs?from=${from}&to=${to}`, { headers });
    const logsData = await logsRes.json();
    console.log(`Found ${logsData.data?.logs?.length || 0} logs.`);
    if (logsData.data?.logs?.length > 0) {
        console.log('First log:', JSON.stringify(logsData.data.logs[0], null, 2));
    }

    // 5. Test Metrics
    console.log('📈 Fetching Operator Metrics (Day)...');
    const metricsRes = await fetch(`${API_URL}/analytics/operators/${operatorId}/metrics?from=${from}&to=${to}&groupBy=day`, { headers });
    const metricsData = await metricsRes.json();
    console.log('Metrics Summary:', JSON.stringify(metricsData.data?.totals, null, 2));

    console.log('✨ Verification Finished!');
}

runVerification().catch(err => console.error('💥 Error:', err));
