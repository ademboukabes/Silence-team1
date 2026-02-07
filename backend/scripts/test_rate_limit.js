const fetch = require('node-fetch');

async function testRateLimit() {
    console.log('--- Testing Rate Limiting (Limit: 10/min) on /api/bookings ---');
    let blocked = false;

    for (let i = 1; i <= 15; i++) {
        const start = Date.now();
        try {
            const response = await fetch('http://localhost:3000/api/bookings', { method: 'GET' });
            const duration = Date.now() - start;

            if (response.status === 429) {
                console.log(`Request ${i}: ⛔ BLOCKED (429 Too Many Requests)`);
                blocked = true;
            } else if (response.status === 401) {
                console.log(`Request ${i}: ✅ Status 401 (Auth Failed) (${duration}ms)`);
            } else {
                console.log(`Request ${i}: ✅ Status ${response.status} (${duration}ms)`);
            }
        } catch (error) {
            console.error(`Request ${i}: ❌ Error ${error.message}`);
        }
    }

    if (blocked) {
        console.log('\n✅ SUCCESS: Rate Limiting is active.');
    } else {
        console.log('\n❌ FAILURE: No requests were blocked.');
        process.exit(1);
    }
}

testRateLimit();
