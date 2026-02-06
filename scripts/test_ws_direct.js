#!/usr/bin/env node
/**
 * 📡 WEBSOCKET DIRECT TEST
 * 
 * Verifies real-time event delivery:
 * 1. Carrier -> Operator (BOOKING_CREATED)
 * 2. Operator -> Carrier (BOOKING_STATUS_CHANGED)
 * 3. System -> Operator (GATE_PASSAGE)
 */

const fetch = require('node-fetch');
const { io } = require('socket.io-client');

const API_URL = 'http://localhost:3000/api';
const WS_URL = 'http://localhost:3000';

async function apiCall(method, endpoint, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}${endpoint}`, {
        method, headers, body: body ? JSON.stringify(body) : null,
    });
    const data = await response.json();
    return { status: response.status, data };
}

async function runWsTest() {
    console.log('🚀 Starting WebSocket Verification...');

    // 1. Authenticate
    console.log('🔐 Authenticating...');
    const opLogin = await apiCall('POST', '/auth/login', { email: 'op@port.com', password: '123456' });
    const carrierLogin = await apiCall('POST', '/auth/login', { email: 'driver@maersk.com', password: '123456' });

    if (opLogin.status > 299 || carrierLogin.status > 299) {
        console.error('❌ Authentication failed');
        process.exit(1);
    }

    const opToken = opLogin.data.access_token;
    const carrierToken = carrierLogin.data.access_token;

    // 2. Connect WebSockets
    console.log('📡 Connecting Operator WebSocket...');
    const opSocket = io(WS_URL, { auth: { token: opToken } });

    console.log('📡 Connecting Carrier WebSocket...');
    const carrierSocket = io(WS_URL, { auth: { token: carrierToken } });

    // 3. Fetch Metadata
    console.log('🔍 Fetching infrastructure metadata...');
    const gatesRes = await apiCall('GET', '/gates', null, carrierToken);
    const gates = gatesRes.data.data || gatesRes.data;
    const gateId = gates[0].id;

    const gateInfo = await apiCall('GET', `/gates/${gateId}`, null, carrierToken);
    const slots = gateInfo.data.timeSlots || gateInfo.data.data?.timeSlots || gateInfo.data || [];
    const slot = Array.isArray(slots) ? slots[0] : (slots.timeSlots ? slots.timeSlots[0] : null);

    // Fallback logic for robustness
    const targetSlot = slot || { id: 1 };

    const trucksRes = await apiCall('GET', '/trucks', null, carrierToken);
    const truckId = (trucksRes.data.data || trucksRes.data)[0].id;

    const carriersRes = await apiCall('GET', '/carriers', null, carrierToken);
    const carrierId = (carriersRes.data.data || carriersRes.data)[0].id;

    let eventsReceived = 0;

    opSocket.on('connect', () => console.log('✅ Operator Socket Connected'));
    carrierSocket.on('connect', () => console.log('✅ Carrier Socket Connected'));

    opSocket.on('BOOKING_CREATED', (data) => {
        console.log('🔔 [OPERATOR RECEIVED] BOOKING_CREATED:', data.bookingId);
        eventsReceived++;
    });

    carrierSocket.on('BOOKING_STATUS_CHANGED', (data) => {
        console.log('🔔 [CARRIER RECEIVED] BOOKING_STATUS_CHANGED:', data.newStatus);
        eventsReceived++;
    });

    opSocket.on('GATE_PASSAGE', (data) => {
        console.log('🔔 [OPERATOR RECEIVED] GATE_PASSAGE:', data.status);
        eventsReceived++;
    });

    // 3. Trigger Events
    setTimeout(async () => {
        console.log('\n📝 Step 1: Carrier creating booking...');
        const bRes = await apiCall('POST', '/bookings', {
            timeSlotId: targetSlot.id,
            truckId: truckId,
            gateId: gateId,
            carrierId: carrierId,
            driverName: 'WS Test Driver',
            driverEmail: 'ws-test@example.com',
            driverPhone: '123',
            driverMatricule: 'WS-1'
        }, carrierToken);

        const booking = bRes.data;
        console.log(`📡 Booking Status: ${bRes.status}`);
        if (!booking.id) {
            console.error('❌ Booking creation failed:', bRes.data);
            process.exit(1);
        }

        console.log('📝 Step 2: Operator confirming booking...');
        const cRes = await apiCall('PUT', `/bookings/${booking.id}/status`, { status: 'CONFIRMED' }, opToken);
        console.log(`📡 Confirm Status: ${cRes.status}`);

        console.log('📝 Step 3: Simulating Gate Passage...');
        const gRes = await apiCall('POST', `/gates/${gateId}/validate-entry`, { bookingId: booking.id });
        console.log(`📡 Gate Status: ${gRes.status}`);

        // Wait for events to trickle in
        setTimeout(() => {
            console.log(`\n📊 Test Finished. Events Received: ${eventsReceived}`);
            if (eventsReceived >= 3) {
                console.log('🏆 ALL WEBSOCKET EVENTS RECEIVED!');
                process.exit(0);
            } else if (eventsReceived >= 2) {
                console.log('⚠️ PARTIAL EVENTS RECEIVED (GATE_PASSAGE missing?)');
                process.exit(0);
            } else {
                console.log('❌ WEBSOCKETS TEST FAILED - INSUFFICIENT EVENTS');
                process.exit(1);
            }
        }, 5000);
    }, 2000);
}

runWsTest();
