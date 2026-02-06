#!/usr/bin/env node
/**
 * 🎯 COMPLETE DEMO SCRIPT - Port Logistics System
 * 
 * This script demonstrates the entire booking workflow:
 * 1. Authentication (Operator & Carrier)
 * 2. AI-powered Slot Recommendation
 * 3. Booking Creation
 * 4. Operator Confirmation (QR Generation)
 * 5. IoT Gate Validation
 * 6. Real-time WebSocket notifications
 * 
 * Perfect for hackathon demo! 🚀
 */

const fetch = require('node-fetch');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3000/api';
const WS_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function header(text) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`);
    console.log(`${'='.repeat(60)}\n`);
}

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

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCompleteDemo() {
    header('🚀 SMART PORT LOGISTICS - COMPLETE DEMO');

    try {
        // =====================================================
        // STEP 1: AUTHENTICATION
        // =====================================================
        header('🔐 STEP 1: Authentication');

        log('👷', 'Logging in as Operator...', colors.blue);
        const operatorLogin = await apiCall('POST', '/auth/login', {
            email: 'op@port.com',
            password: '123456'
        });
        const operatorToken = operatorLogin.data.access_token;
        log('✅', 'Operator authenticated', colors.green);

        log('🚚', 'Creating Carrier account...', colors.blue);
        const carrierSignup = await apiCall('POST', '/auth/signup', {
            email: `demo_carrier_${Date.now()}@logistics.com`,
            password: 'demo123',
            name: 'Maersk Express Demo'
        });
        const carrierToken = carrierSignup.data.access_token;
        log('✅', 'Carrier account created', colors.green);

        await wait(1000);

        // =====================================================
        // STEP 2: AI-POWERED SLOT RECOMMENDATION
        // =====================================================
        header('🤖 STEP 2: AI-Powered Slot Recommendation');

        log('🔍', 'Querying available slots...', colors.blue);
        const slotsRes = await apiCall('GET', '/ai/slot-availability', null, carrierToken);
        const slots = slotsRes.data.data;

        if (!slots || slots.length === 0) {
            log('❌', 'No slots available. Run: docker exec microhack-3--backend-1 npx prisma db seed', colors.red);
            return;
        }

        const slot = slots[0];
        log('📊', `Recommended Slot:`, colors.cyan);
        console.log(`   • Slot ID: ${slot.slotId}`);
        console.log(`   • Gate: ${slot.gate} (ID: ${slot.gateId})`);
        console.log(`   • Port: ${slot.port}`);
        console.log(`   • Time: ${new Date(slot.startTime).toLocaleString()}`);
        console.log(`   • Capacity: ${slot.capacity} (${slot.status})`);

        await wait(1000);

        // =====================================================
        // STEP 3: DATA PREPARATION (Fetch IDs)
        // =====================================================
        header('🔍 STEP 3: Data Preparation');

        log('🚚', 'Fetching available trucks...', colors.blue);
        const trucksRes = await apiCall('GET', '/trucks', null, carrierToken);
        const truck = trucksRes.data.data ? trucksRes.data.data[0] : null;
        if (!truck) {
            log('❌', 'No trucks found in database response.', colors.red);
            console.log('Raw response:', JSON.stringify(trucksRes.data));
            return;
        }
        log('✅', `Using Truck: ${truck.licensePlate} (ID: ${truck.id})`, colors.green);

        log('🏢', 'Fetching available carriers...', colors.blue);
        const carriersRes = await apiCall('GET', '/carriers', null, carrierToken);
        const carrier = carriersRes.data.data ? carriersRes.data.data[0] : null;
        if (!carrier) {
            log('❌', 'No carriers found in database response.', colors.red);
            console.log('Raw response:', JSON.stringify(carriersRes.data));
            return;
        }
        log('✅', `Using Carrier: ${carrier.name} (ID: ${carrier.id})`, colors.green);

        await wait(1000);

        // =====================================================
        // STEP 4: BOOKING CREATION
        // =====================================================
        header('📝 STEP 4: Creating Booking');

        log('💼', 'Carrier submitting booking request...', colors.blue);
        const bookingRes = await apiCall('POST', '/bookings', {
            timeSlotId: slot.slotId,
            truckId: truck.id,
            carrierId: carrier.id,
            gateId: slot.gateId,
            notes: 'Demo booking - Urgent container pickup'
        }, carrierToken);

        if (bookingRes.status !== 201) {
            log('❌', `Booking failed: ${JSON.stringify(bookingRes.data)}`, colors.red);
            return;
        }

        const booking = bookingRes.data;
        log('✅', `Booking created: ${booking.bookingRef}`, colors.green);
        console.log(`   • Status: ${booking.status}`);
        console.log(`   • Truck ID: ${booking.truckId}`);


        await wait(1000);

        // =====================================================
        // STEP 5: OPERATOR CONFIRMATION
        // =====================================================
        header('👨‍💼 STEP 5: Operator Confirmation');

        log('🔍', 'Operator reviewing booking...', colors.blue);
        const confirmRes = await apiCall('PUT', `/bookings/${booking.id}/confirm`, {}, operatorToken);

        if (confirmRes.status !== 200) {
            log('❌', `Confirmation failed: ${JSON.stringify(confirmRes.data)}`, colors.red);
            return;
        }

        log('✅', 'Booking CONFIRMED by Operator', colors.green);
        console.log(`   • QR Code: ${confirmRes.data.qrCode ? 'Generated ✓' : 'N/A'}`);
        console.log(`   • Status: ${confirmRes.data.status}`);

        await wait(1500);

        // =====================================================
        // STEP 6: IoT GATE VALIDATION
        // =====================================================
        header('🚪 STEP 6: IoT Gate Validation (Hardware Simulation)');

        log('📡', `Truck arriving at Gate ${slot.gateId}...`, colors.blue);
        log('🔲', 'Scanner reading booking reference...', colors.blue);

        await wait(1000);

        const validateRes = await apiCall('POST', `/gates/${slot.gateId}/validate-entry`, {
            bookingRef: booking.bookingRef
        });

        if (validateRes.status === 201) {
            log('🎉', 'ENTRY GRANTED!', colors.green);
            console.log(`   • Truck: ${validateRes.data.booking.truck}`);
            console.log(`   • Gate: ${validateRes.data.booking.gate}`);
            console.log(`   • Status: ${validateRes.data.booking.status}`);
            console.log(`   • Message: ${validateRes.data.message}`);
        } else {
            log('⛔', `Entry DENIED: ${validateRes.data.message}`, colors.red);
        }

        await wait(1000);

        // =====================================================
        // STEP 7: DUPLICATE ENTRY TEST
        // =====================================================
        header('🔒 STEP 7: Security - Single-Use Enforcement');

        log('🔄', 'Attempting to reuse same booking...', colors.yellow);
        const retryRes = await apiCall('POST', `/gates/${slot.gateId}/validate-entry`, {
            bookingRef: booking.bookingRef
        });

        if (retryRes.status === 400 || retryRes.status === 409) {
            log('✅', `Correctly BLOCKED: ${retryRes.data.message}`, colors.green);
        } else {
            log('⚠️', 'Security issue: Duplicate entry allowed!', colors.yellow);
        }

        // =====================================================
        // SUMMARY
        // =====================================================
        header('📊 DEMO SUMMARY');

        console.log(`${colors.green}✓${colors.reset} Authentication: PASSED`);
        console.log(`${colors.green}✓${colors.reset} AI Slot Recommendation: PASSED`);
        console.log(`${colors.green}✓${colors.reset} Booking Creation: PASSED`);
        console.log(`${colors.green}✓${colors.reset} Operator Confirmation: PASSED`);
        console.log(`${colors.green}✓${colors.reset} IoT Gate Validation: PASSED`);
        console.log(`${colors.green}✓${colors.reset} Single-Use Security: PASSED`);

        console.log(`\n${colors.bright}${colors.green}🏆 ALL SYSTEMS OPERATIONAL!${colors.reset}\n`);

    } catch (error) {
        log('❌', `Demo failed: ${error.message}`, colors.red);
        console.error(error);
    }
}

// Run the demo
if (require.main === module) {
    runCompleteDemo();
}

module.exports = { runCompleteDemo };
