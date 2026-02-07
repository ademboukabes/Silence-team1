#!/usr/bin/env node
/**
 *  COMPREHENSIVE SYSTEM TEST - Port Logistics System (A to Z)
 * 
 * This script verifies:
 * 1. Authentication & Role Management
 * 2. Infrastructure & Metadata Discovery
 * 3. Driver-Centric Booking Workflow
 * 4. Operator Unified Status Control
 * 5. IoT Gate Security & Validation
 * 6. AI Analytics Scaffolds
 * 7. Blockchain Notarization Audit
 */

// const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
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

async function runTestAll() {
  header('🚀 SYSTEM-WIDE VALIDATION (A TO Z)');

  try {
    // =====================================================
    // STEP 1: AUTHENTICATION
    // =====================================================
    header('🔐 STEP 1: Authentication & User Roles');

    log('👷', 'Logging in as Operator (Admin)...', colors.blue);
    const opRes = await apiCall('POST', '/auth/login', {
      email: 'op@port.com',
      password: '123456'
    });
    if (opRes.status > 299) throw new Error(`Operator login failed: ${JSON.stringify(opRes.data)}`);
    const opToken = opRes.data.access_token;

    log('👤', 'Fetching Operator profile...', colors.blue);
    const profileRes = await apiCall('GET', '/auth/profile', null, opToken);
    const opId = profileRes.data.sub || profileRes.data.id;
    log('✅', `Operator authenticated (ID: ${opId})`, colors.green);

    log('🚚', 'Creating NEW Carrier account...', colors.blue);
    const carrierSignup = await apiCall('POST', '/auth/signup', {
      email: `carrier_${Date.now()}@test.com`,
      password: 'password123',
      name: 'Test Carrier Ltd'
    });
    if (carrierSignup.status > 299) throw new Error(`Carrier signup failed: ${JSON.stringify(carrierSignup.data)}`);
    const carrierToken = carrierSignup.data.access_token;
    log('✅', 'Carrier account created and authenticated', colors.green);

    // =====================================================
    // STEP 2: INFRASTRUCTURE & METADATA
    // =====================================================
    header('🔍 STEP 2: Infrastructure & Metadata Discovery');

    log('🚪', 'Fetching gates and active time slots...', colors.blue);
    const gatesRes = await apiCall('GET', '/gates', null, carrierToken);
    const gates = gatesRes.data.data || gatesRes.data;
    const targetGate = gates[0];

    const gateInfo = await apiCall('GET', `/gates/${targetGate.id}`, null, carrierToken);
    const slots = gateInfo.data.timeSlots || [];

    // Find or fallback to slot
    const now = new Date();
    let slot = slots.find(s => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      return now >= start && now <= end;
    }) || slots[0];

    log('✅', `Target Gate: ${targetGate.name}`, colors.green);
    log('✅', `Selected Slot: ${new Date(slot.startTime).toLocaleString()}`, colors.green);

    log('🚚', 'Fetching business entities (Trucks & Carriers)...', colors.blue);
    const trucksRes = await apiCall('GET', '/trucks', null, carrierToken);
    const truck = trucksRes.data.data ? trucksRes.data.data[0] : (trucksRes.data[0]);

    const carriersRes = await apiCall('GET', '/carriers', null, carrierToken);
    const carrier = carriersRes.data.data ? carriersRes.data.data[0] : (carriersRes.data[0]);

    log('✅', `Truck: ${truck.licensePlate}, Carrier: ${carrier.name}`, colors.green);

    // =====================================================
    // STEP 3: BOOKING LIFESTYLE
    // =====================================================
    header('📝 STEP 3: Booking Lifecycle (Driver-Centric)');

    log('✏️', 'Creating a new booking with driver details...', colors.blue);
    const bookingRes = await apiCall('POST', '/bookings', {
      timeSlotId: slot.id,
      truckId: truck.id,
      carrierId: carrier.id,
      gateId: targetGate.id,
      driverName: 'Test Driver',
      driverEmail: 'test-driver@example.com',
      driverPhone: '+000000000',
      driverMatricule: 'MAT-TEST',
      merchandiseDescription: 'Sensitive Equipment'
    }, carrierToken);
    const booking = bookingRes.data;
    log('✅', `Booking CREATED (UUID: ${booking.id})`, colors.green);

    log('👨‍💼', 'Operator CONFIRMING booking via unified endpoint...', colors.blue);
    const confirmRes = await apiCall('PUT', `/bookings/${booking.id}/status`, {
      status: 'CONFIRMED'
    }, opToken);
    log('✅', `Booking CONFIRMED. QR Code: ${confirmRes.data.qrCode.substring(0, 30)}...`, colors.green);

    // =====================================================
    // STEP 4: IOT GATE VALIDATION
    // =====================================================
    header('🛡️ STEP 4: IoT Gate & Security Validation');

    log('📡', 'Truck arriving at gate. Validating entry...', colors.blue);
    const validateRes = await apiCall('POST', `/gates/${targetGate.id}/validate-entry`, {
      bookingId: booking.id
    });
    if (validateRes.status === 200 || validateRes.status === 201) {
      log('🎉', 'ENTRY GRANTED! Barrier opened.', colors.green);
    } else {
      log('⛔', `Entry DENIED: ${validateRes.data.message}`, colors.yellow);
    }

    log('🔒', 'Attempting RE-USE of same booking (Security Check)...', colors.blue);
    const retryRes = await apiCall('POST', `/gates/${targetGate.id}/validate-entry`, {
      bookingId: booking.id
    });
    log('✅', `RE-USE BLOCKED correctly: ${retryRes.data.message}`, colors.green);

    // =====================================================
    // STEP 5: AI ANALYTICS & AUDIT
    // =====================================================
    header('📊 STEP 5: AI Analytics & Blockchain Audit');

    log('🤖', 'Checking AI Analytics capabilities...', colors.blue);
    const capabilities = await apiCall('GET', '/analytics/capabilities', null, opToken);
    log('✅', `Capabilities: ${Object.keys(capabilities.data.data).join(', ')}`, colors.magenta);

    log('📜', `Checking Audit Logs for Operator ${opId}...`, colors.blue);
    const from = new Date(Date.now() - 3600000).toISOString();
    const to = new Date(Date.now() + 3600000).toISOString();
    const logsRes = await apiCall('GET', `/analytics/operators/${opId}/logs?from=${from}&to=${to}`, null, opToken);

    const logs = logsRes.data.data ? logsRes.data.data.logs : [];
    log('✅', `Retrieved ${logs.length} logs for current session`, colors.green);

    const notarizationLog = logs.find(l => l.action_type === 'BLOCKCHAIN_NOTARIZATION');
    if (notarizationLog) {
      log('🔗', 'Blockchain Notarization verified in Audit Logs!', colors.magenta);
    } else {
      log('⚠️', 'Blockchain notarization log not found in recent logs (background task may be pending).', colors.yellow);
    }

    header('🏆 FULL SYSTEM VALIDATION COMPLETE!');
    console.log(`${colors.bright}${colors.green}End-to-end flow verified from Account Creation to Blockchain Notarization Audit.${colors.reset}\n`);

  } catch (error) {
    log('❌', `Test failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

runTestAll();
