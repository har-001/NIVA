// ============================================
// NIVA — Phase 06: Mobile Features Automated Test Suite
// Real-Time Socket Streaming, Multimodal Vision,
// Neural Memory Hub, Voice Engine & Remote Deck
// Run: npx tsx test-mobile-features.ts
// ============================================

declare const process: any;

import { NivaMobileApiClient } from './src/services/apiClient';
import { socketService } from './src/services/socketService';
import { voiceService } from './src/services/voiceService';
import { RemoteCommandRequest, MemoryItem } from './src/types/mobile';

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
  console.log('\n======================================================');
  console.log('⚡ NIVA PHASE 06: EXPO MOBILE FEATURES AUDIT ⚡');
  console.log('======================================================\n');

  const client = new NivaMobileApiClient('localhost');

  // TEST 1: Socket.IO URL & Service Event Architecture
  console.log('🧪 TEST 1: Socket.IO URL Resolution & Event Registration');
  {
    const socketUrl = client.getSocketUrl();
    assert('Socket URL parsed correctly from base URL', socketUrl === 'http://localhost:3001');

    client.setHost('192.168.1.50');
    assert('Socket URL reflects updated host dynamically', client.getSocketUrl() === 'http://192.168.1.50:3001');

    let chunkReceived = false;
    const unsub = socketService.onStreamChunk((data) => {
      if (data.chunk === 'Hello') chunkReceived = true;
    });
    assert('Stream chunk listener registered successfully', typeof unsub === 'function');
    unsub();
  }

  // TEST 2: Voice Synthesis & Settings Engine
  console.log('\n🧪 TEST 2: Voice Engine (TTS & Settings)');
  {
    const initialSettings = voiceService.getSettings();
    assert('Voice service defaults initialized', typeof initialSettings.gender === 'string');

    voiceService.setGender('male');
    const maleSettings = voiceService.getSettings();
    assert('Voice gender switched to male', maleSettings.gender === 'male');
    assert('Male voice pitch adjusted lower', maleSettings.pitch < 1.0);

    voiceService.setGender('female');
    const femaleSettings = voiceService.getSettings();
    assert('Female voice pitch adjusted for NIVA voice profile', femaleSettings.pitch > 1.0);

    let callbackFired = false;
    await new Promise<void>((resolve) => {
      voiceService.speak('Test speech clean vocalizer [link](http://test)', () => {
        callbackFired = true;
        resolve();
      });
    });
    assert('Speak method handled without error and triggered callback', callbackFired);
  }

  // TEST 3: Multimodal Vision Analysis Bridge
  console.log('\n🧪 TEST 3: Multimodal Vision Analysis Engine');
  {
    const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const visionResult = await client.analyzeImage(mockBase64, 'Identify objects on desk');
    assert('Vision analysis responded successfully', visionResult.success === true);
    assert('Vision returned valid scene description', typeof visionResult.description === 'string' && visionResult.description.length > 5);
    assert('Vision returned classification tags array', Array.isArray(visionResult.tags) && visionResult.tags.length > 0);
  }

  // TEST 4: Neural Memory Hub (CRUD Operations)
  console.log('\n🧪 TEST 4: Neural Memory Hub (Vector Storage & Recall)');
  {
    const initialList = await client.getMemories();
    assert('Retrieved initial memory list', Array.isArray(initialList) && initialList.length > 0);

    const testContent = `Automated unit test memory at ${Date.now()}`;
    const createRes = await client.createMemory(testContent, 'project');
    assert('New memory item successfully created', createRes.success === true && !!createRes.data);
    assert('Saved memory content matches input', createRes.data?.content === testContent);
    assert('Saved memory category assigned', createRes.data?.category === 'project');

    if (createRes.data) {
      const deleteRes = await client.deleteMemory(createRes.data.id);
      assert('Memory item successfully purged', deleteRes === true);

      const afterDelete = await client.getMemories();
      const exists = afterDelete.some((m) => m.id === createRes.data?.id);
      assert('Purged memory confirmed absent from memory vault', !exists);
    }
  }

  // TEST 5: Remote Control Deck (Media, Volume, and Screenshots)
  console.log('\n🧪 TEST 5: Extended PC Remote Deck Actions');
  {
    // Volume Down
    const volDownReq: RemoteCommandRequest = { action: 'volume_down' };
    const volDownRes = await client.dispatchRemoteCommand(volDownReq);
    assert('Dispatched VOL DOWN command', volDownRes.success === true);

    // Volume Up
    const volUpReq: RemoteCommandRequest = { action: 'volume_up' };
    const volUpRes = await client.dispatchRemoteCommand(volUpReq);
    assert('Dispatched VOL UP command', volUpRes.success === true);

    // Volume Mute
    const muteReq: RemoteCommandRequest = { action: 'volume_mute' };
    const muteRes = await client.dispatchRemoteCommand(muteReq);
    assert('Dispatched VOLUME MUTE command', muteRes.success === true);

    // Media Play/Pause
    const mediaReq: RemoteCommandRequest = { action: 'media_play_pause' };
    const mediaRes = await client.dispatchRemoteCommand(mediaReq);
    assert('Dispatched MEDIA PLAY/PAUSE command', mediaRes.success === true);

    // PC Screen Capture
    const screenReq: RemoteCommandRequest = { action: 'screenshot' };
    const screenRes = await client.dispatchRemoteCommand(screenReq);
    assert('Dispatched SCREENSHOT command', screenRes.success === true);
  }

  // TEST 6: Mobile Device Pairing & Fingerprinting
  console.log('\n🧪 TEST 6: Mobile Device Pairing Registration');
  {
    const pairRes = await client.registerDevice('Test Phone (NIVA QA)');
    assert('Device registration completed', pairRes.success === true);
    assert('Device ID created with mobile prefix', pairRes.device.id.startsWith('dev-mob-'));
    assert('Device trusted state is true', pairRes.device.isTrusted === true);
    assert('Device fingerprint verified', typeof pairRes.device.fingerprint === 'string');
  }

  // SUMMARY REPORT
  console.log('\n======================================================');
  console.log(`📊 PHASE 06 AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Exception:', err);
  process.exit(1);
});
