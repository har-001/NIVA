// ============================================
// NIVA — Phase 05: Mobile Expo Foundation Automated Test Suite
// Run: npx tsx test-mobile-foundation.ts
// ============================================

declare const process: any;

import { NivaMobileApiClient } from './src/services/apiClient';
import { mobileStorage } from './src/services/storage';
import { RemoteCommandRequest } from './src/types/mobile';

let passed = 0;
let failed = 0;

function assert(testName: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n====================================================');
  console.log('⚡ NIVA PHASE 05: EXPO MOBILE FOUNDATION AUDIT ⚡');
  console.log('====================================================\n');

  // TEST 1: Storage Adapter
  console.log('🧪 TEST 1: Storage Adapter Persistence');
  {
    await mobileStorage.setItem('test_key', 'niva_mobile_val');
    const readVal = await mobileStorage.getItem('test_key');
    assert('Item written & retrieved from storage', readVal === 'niva_mobile_val');

    await mobileStorage.removeItem('test_key');
    const deletedVal = await mobileStorage.getItem('test_key');
    assert('Item removed from storage', deletedVal === null);
  }

  // TEST 2: Dynamic Connection Configuration
  console.log('\n🧪 TEST 2: Dynamic Connection Configuration');
  {
    const client = new NivaMobileApiClient();
    assert('Default base URL is localhost:3001', client.getBaseUrl() === 'http://localhost:3001/api/v1');

    client.setHost('192.168.1.100');
    assert('Updated host reflected in base URL', client.getBaseUrl() === 'http://192.168.1.100:3001/api/v1');

    client.setCustomUrl('https://api.niva.ai/api/v1');
    assert('Custom URL overrides host/port', client.getBaseUrl() === 'https://api.niva.ai/api/v1');
  }

  // TEST 3: Backend Health & Latency Probe
  console.log('\n🧪 TEST 3: Backend Server Linkage (Port 3001)');
  {
    const client = new NivaMobileApiClient('localhost');
    const health = await client.checkHealth();
    assert('Health probe returned valid status', typeof health.online === 'boolean');
    if (health.online) {
      assert('Latency is reported', typeof health.latencyMs === 'number');
    }
  }

  // TEST 4: Authentication & Session Token Lifecycle
  console.log('\n🧪 TEST 4: Authentication & Session Token Lifecycle');
  {
    const client = new NivaMobileApiClient('localhost');
    const res = await client.login('harshit@test.com', 'pass123');
    assert('Login call succeeded', res.success === true);
    assert('Auth session returned with token', !!res.session?.token);
    assert('User object populated', res.session?.user.email === 'harshit@test.com');
  }

  // TEST 5: Desktop Telemetry Retrieval
  console.log('\n🧪 TEST 5: Desktop Telemetry Retrieval');
  {
    const client = new NivaMobileApiClient('localhost');
    const telemetry = await client.getDesktopTelemetry();
    assert('Telemetry has valid CPU percent', typeof telemetry.cpu_usage_percent === 'number' && telemetry.cpu_usage_percent >= 0);
    assert('Telemetry has RAM usage', typeof telemetry.memory_used_gb === 'number' && telemetry.memory_used_gb > 0);
    assert('Telemetry has total memory', telemetry.total_memory_gb > 0);
    assert('Telemetry has hostname', !!telemetry.hostname);
  }

  // TEST 6: Remote Command Payload Formatting & Dispatch
  console.log('\n🧪 TEST 6: Remote Command Dispatch (Lock & App Launch)');
  {
    const client = new NivaMobileApiClient('localhost');
    const lockCmd: RemoteCommandRequest = {
      action: 'lock_workstation',
      timestamp: Date.now(),
    };
    const resLock = await client.dispatchRemoteCommand(lockCmd);
    assert('Lock command dispatched successfully', resLock.success === true);

    const appCmd: RemoteCommandRequest = {
      action: 'launch_app',
      app: 'notepad',
      timestamp: Date.now(),
    };
    const resApp = await client.dispatchRemoteCommand(appCmd);
    assert('App launch command dispatched successfully', resApp.success === true);
  }

  // TEST 7: AI Chat Message Dispatch
  console.log('\n🧪 TEST 7: AI Chat Message Dispatch');
  {
    const client = new NivaMobileApiClient('localhost');
    const chatRes = await client.sendMessage('Hello NIVA mobile');
    assert('Chat message returns reply', typeof chatRes.reply === 'string' && chatRes.reply.length > 0);
    assert('Chat call marked successful', chatRes.success === true);
  }

  // SUMMARY
  console.log('\n' + '═'.repeat(52));
  console.log(`📱 Phase 05 Test Results: ${passed} PASSED / ${failed} FAILED`);
  console.log('═'.repeat(52));

  if (failed > 0) {
    console.error('❌ SOME AUDIT CHECKS FAILED');
    process.exit(1);
  } else {
    console.log('✅ ALL AUDIT CHECKS PASSED (100% EXPO FOUNDATION READY)');
    process.exit(0);
  }
}

runTests();
