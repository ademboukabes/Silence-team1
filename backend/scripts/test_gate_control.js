// Gate Control Integration Test Script
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function apiCall(method, endpoint, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();
    return { status: response.status, data };
}

async function testGateControl() {
    console.log('🚀 === Gate Control Integration Test ===\n');

    try {
        // 1. Login as Operator
        console.log('1️⃣ Logging in as Operator...');
        const login = await apiCall('POST', '/auth/login', {
            email: 'op@port.com',
            password: '123456'
        });
        const operatorToken = login.data.access_token;
        console.log('✅ Operator logged in\n');

        // 2. Login as Carrier (create new user)
        console.log('2️⃣ Creating Carrier user...');
        const carrierSignup = await apiCall('POST', '/auth/signup', {
            email: `test_carrier_${Date.now()}@test.com`,
            password: 'test123',
            name: 'Test Carrier'
        });
        const carrierToken = carrierSignup.data.access_token;
        console.log('✅ Carrier user created\n');

        // 3. Get available slots
        console.log('3️⃣ Fetching available slots...');
        const slotsRes = await apiCall('GET', '/ai/slot-availability', null, carrierToken);
        const slots = slotsRes.data.data;

        if (!slots || slots.length === 0) {
            console.log('❌ No available slots. Please run `docker exec microhack-3--backend-1 npx prisma db seed` first.');
            return;
        }

        const slot = slots[0];
        const gateId = slot.gateId; // Dynamic gateId from API
        console.log(`✅ Found slot: ${slot.slotId} at ${slot.gate} (Gate ID: ${gateId})\n`);

        // 4. Get carrier ID and truck ID (from seed data)
        const carrierId = 1; // From seed
        const truckId = 1; // From seed

        // 5. Create booking
        console.log('4️⃣ Creating booking...');
        const bookingRes = await apiCall('POST', '/bookings', {
            timeSlotId: slot.slotId,
            truckId: truckId,
            carrierId: carrierId,
            gateId: gateId // Use dynamic gateId
        }, carrierToken);

        if (bookingRes.status !== 201) {
            console.log(`❌ Failed to create booking: ${JSON.stringify(bookingRes.data)}`);
            return;
        }

        const bookingRef = bookingRes.data.bookingRef;
        const bookingId = bookingRes.data.id;
        console.log(`✅ Booking created: ${bookingRef}\n`);

        // 6. Confirm booking (Operator action)
        console.log('5️⃣ Confirming booking (Operator)...');
        const confirmRes = await apiCall('PUT', `/bookings/${bookingId}/confirm`, {}, operatorToken);

        if (confirmRes.status !== 200) {
            console.log(`❌ Failed to confirm booking: ${JSON.stringify(confirmRes.data)}`);
            return;
        }

        console.log(`✅ Booking confirmed: ${confirmRes.data.qrCode ? 'QR Code generated' : 'No QR'}\n`);

        // 7. Validate Entry (IoT/Hardware simulation)
        console.log('6️⃣ Validating entry at gate (IoT simulation)...');
        const validateRes = await apiCall('POST', `/gates/${gateId}/validate-entry`, {
            bookingRef: bookingRef
        });

        if (validateRes.status !== 201) {
            console.log(`❌ Entry validation failed: ${JSON.stringify(validateRes.data)}`);
            return;
        }

        console.log('✅ ENTRY GRANTED!');
        console.log(`   Truck: ${validateRes.data.booking.truck}`);
        console.log(`   Gate: ${validateRes.data.booking.gate}`);
        console.log(`   Status: ${validateRes.data.booking.status}`);
        console.log(`   Message: ${validateRes.data.message}\n`);

        // 8. Try to validate again (should fail)
        console.log('7️⃣ Attempting to use booking again (should fail)...');
        const retryRes = await apiCall('POST', `/gates/${gateId}/validate-entry`, {
            bookingRef: bookingRef
        });

        if (retryRes.status === 400 || retryRes.status === 409) {
            console.log(`✅ Correctly rejected: ${retryRes.data.message}\n`);
        } else {
            console.log('⚠️  System allowed duplicate entry (unexpected)\n');
        }

        console.log('🎉 === Gate Control Test PASSED ===');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testGateControl();
