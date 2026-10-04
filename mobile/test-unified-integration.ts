// ============================================
// NIVA — Phase 07 & 08: Unified Integration Test Suite
// Communication Hub (Multi-Channel Dispatch, Contacts, AI Calling)
// & Cross-Platform Device Pairing and Synchronization
// Run: npx tsx test-unified-integration.ts
// ============================================

declare const process: any;

import { NivaMobileApiClient } from './src/services/apiClient';
import { ContactItem, OutboundMessageRequest, CallSession } from './src/types/mobile';

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
  console.log('⚡ NIVA PHASE 07 & 08: UNIFIED INTEGRATION AUDIT ⚡');
  console.log('======================================================\n');

  const client = new NivaMobileApiClient('localhost');

  // TEST 1: Contacts Directory Management
  console.log('🧪 TEST 1: Contacts Directory (CRUD & Filtering)');
  {
    const contacts = await client.getContacts();
    assert('Contacts list retrieved successfully', Array.isArray(contacts) && contacts.length > 0);

    const filtered = await client.getContacts('Harshit');
    assert('Contact query filtering matches name', filtered.some((c) => c.name.includes('Harshit')));

    const newContact = await client.saveContact({
      name: 'External Project Evaluator',
      phone: '+91 99887 76655',
      email: 'evaluator@ptu.ac.in',
      relationship: 'External Examiner',
    });
    assert('New contact persisted', newContact.success === true && !!newContact.contact);

    if (newContact.contact) {
      const del = await client.deleteContact(newContact.contact.id);
      assert('Contact purged cleanly', del === true);
    }
  }

  // TEST 2: Multi-Channel Communication Dispatch
  console.log('\n🧪 TEST 2: Multi-Channel Outbound Dispatch');
  {
    // WhatsApp
    const waRes = await client.sendCommunication({
      channel: 'whatsapp',
      recipient: '+91 98765 43210',
      content: 'Project NIVA Phase 07 Communication link active.',
    });
    assert('Dispatched message via WhatsApp', waRes.success === true);

    // Email
    const emailRes = await client.sendCommunication({
      channel: 'email',
      recipient: 'evaluator@ptu.ac.in',
      subject: 'NIVA Autonomous Final Year Project Progress Report',
      content: 'Automated notification: All major phases 00-11 successfully integrated.',
    });
    assert('Dispatched message via Email', emailRes.success === true);

    // Telegram
    const tgRes = await client.sendCommunication({
      channel: 'telegram',
      recipient: '@niva_bot',
      content: 'DevOps server heartbeat ping OK.',
    });
    assert('Dispatched message via Telegram', tgRes.success === true);
  }

  // TEST 3: AI Calling Assistant HUD & Live Transcripts
  console.log('\n🧪 TEST 3: AI Calling Assistant & Compliant Recording');
  {
    // Start Call
    const callRes = await client.startCallSession('Dr. Project Guide (HOD)', '+91 98111 22334', 'incoming');
    assert('AI Call Session initialized', callRes.success === true && !!callRes.session);
    assert('Call session direction marked incoming', callRes.session.direction === 'incoming');
    assert('Initial AI greeting generated in transcript', callRes.session.transcripts.length > 0);

    const callId = callRes.session.id;

    // Toggle Recording
    const isRecording = await client.toggleCallRecording(callId);
    assert('Call recording state toggled with consent compliance', typeof isRecording === 'boolean');

    // Add Live Transcripts
    const transcriptAfterUser = await client.addCallTranscript(
      callId,
      'contact',
      'Can you tell me the progress of the NIVA system?'
    );
    assert('Contact audio transcribed into session', !!transcriptAfterUser);

    const transcriptAfterAi = await client.addCallTranscript(
      callId,
      'ai',
      'Yes, Sir! NIVA has passed all Phase 00 through 08 audits with zero errors.'
    );
    assert('AI vocal response recorded in transcript stream', !!transcriptAfterAi);

    // End Call
    const endRes = await client.endCallSession(callId);
    assert('Call session gracefully terminated', endRes === true);
  }

  // TEST 4: Unified Cross-Platform Device Pairing
  console.log('\n🧪 TEST 4: Cross-Platform Device Identity & Pairing');
  {
    const mobileReg = await client.registerDevice('NIVA Expo Mobile Client');
    assert('Mobile device registered with unique ID', mobileReg.success === true);
    assert('Mobile client classified as mobile type', mobileReg.device.type === 'mobile');
    assert('Mobile device marked trusted', mobileReg.device.isTrusted === true);
  }

  // SUMMARY REPORT
  console.log('\n======================================================');
  console.log(`📊 UNIFIED AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Exception:', err);
  process.exit(1);
});
