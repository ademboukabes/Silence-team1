/**
 * WebSocket Real-time Notification Test
 * 
 * Tests:
 * 1. Authenticate and get JWT token
 * 2. Connect to WebSocket with token
 * 3. Listen for NEW_NOTIFICATION events
 * 4. Create a notification via REST API
 * 5. Verify WebSocket event is received
 */

const BASE_URL = 'http://localhost:3000/api';
const WS_URL = 'ws://localhost:3000';
let fetch;
let io;

async function test() {
    // Import dependencies
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;

    const socketClient = await import('socket.io-client');
    io = socketClient.io;

    console.log('🧪 WEBSOCKET REAL-TIME TEST STARTED');
    console.log('====================================\n');

    // Step 1: Login to get JWT token
    console.log('Step 1: Authenticating...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'op@port.com', password: '123456' })
    });
    const loginData = await loginRes.json();
    const token = loginData.access_token || loginData.data?.access_token;
    const userId = loginData.user?.id || loginData.data?.user?.id || 1;

    if (!token) {
        console.error('❌ Login failed. Response:', loginData);
        return;
    }
    console.log(`✅ Authenticated. User ID: ${userId}\n`);

    // Step 2: Connect to WebSocket
    console.log('Step 2: Connecting to WebSocket...');
    const socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
    });

    let eventReceived = false;
    let receivedPayload = null;

    // Wait for connection
    await new Promise((resolve) => {
        socket.on('connect', () => {
            console.log(`✅ WebSocket connected. Socket ID: ${socket.id}\n`);
            resolve();
        });

        socket.on('connect_error', (err) => {
            console.error('❌ WebSocket connection error:', err.message);
            resolve();
        });
    });

    // Step 3: Listen for NEW_NOTIFICATION events
    console.log('Step 3: Setting up NEW_NOTIFICATION listener...');
    socket.on('NEW_NOTIFICATION', (payload) => {
        console.log('📬 NEW_NOTIFICATION event received!');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        eventReceived = true;
        receivedPayload = payload;
    });
    console.log('✅ Listener registered\n');

    // Step 4: Create a notification via REST API
    console.log('Step 4: Creating notification via REST API...');
    const notifRes = await fetch(`${BASE_URL}/notification/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            userId: userId,
            title: '🧪 WebSocket Test Notification',
            body: 'If you receive this in real-time, WebSocket integration is working!',
            type: 'info',
            device_type: 'web',
            notification_token: 'test-token-' + Date.now()
        })
    });

    const notifData = await notifRes.json();
    console.log(`✅ Notification created via API. ID: ${notifData.data?.id || notifData.id}\n`);

    // Step 5: Wait for WebSocket event
    console.log('Step 5: Waiting for WebSocket event (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify results
    console.log('\n====================================');
    console.log('📊 TEST RESULTS');
    console.log('====================================');
    if (eventReceived) {
        console.log('✅ SUCCESS: WebSocket event received!');
        console.log('✅ Real-time notification delivery is working!');
        console.log('\nReceived data:');
        console.log(`  - Notification ID: ${receivedPayload.notificationId}`);
        console.log(`  - Title: ${receivedPayload.title}`);
        console.log(`  - Type: ${receivedPayload.type}`);
    } else {
        console.log('❌ FAILURE: WebSocket event NOT received');
        console.log('❌ Check that:');
        console.log('   1. Backend WebSocket gateway is running');
        console.log('   2. NotificationService is emitting events');
        console.log('   3. User rooms are correctly joined');
    }

    // Cleanup
    socket.disconnect();
    console.log('\n🏁 Test completed. WebSocket disconnected.');
}

test().catch(console.error);
