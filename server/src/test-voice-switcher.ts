// ============================================
// NIVA — Voice Switcher Verification Test
// ============================================

import { nivaAgent } from './modules/ai/agent';

async function runVoiceSwitchTest() {
  console.log('🧪 Starting NIVA Voice Switcher Verification...\n');

  // Test 1: Switch to Female Voice
  console.log('--- TEST 1: User requests Female Voice ---');
  let femaleReply = '';
  for await (const event of nivaAgent.chatStream([], 'female voice me bolo please')) {
    if (event.type === 'chunk' && event.content) {
      femaleReply += event.content;
    }
  }
  console.log('Female Voice Reply:\n', femaleReply);
  if (!femaleReply.includes('Female Voice') || !femaleReply.includes('karungi')) {
    throw new Error('FAILED: Female voice switch reply missing confirmation or feminine inflection!');
  }
  console.log('✅ PASSED: Female voice switch confirmed!\n');

  // Test 2: Switch to Male Voice
  console.log('--- TEST 2: User requests Male Voice ---');
  let maleReply = '';
  for await (const event of nivaAgent.chatStream([], 'ab male voice me bolo')) {
    if (event.type === 'chunk' && event.content) {
      maleReply += event.content;
    }
  }
  console.log('Male Voice Reply:\n', maleReply);
  if (!maleReply.includes('Male Voice') || !maleReply.includes('karunga')) {
    throw new Error('FAILED: Male voice switch reply missing confirmation or masculine inflection!');
  }
  console.log('✅ PASSED: Male voice switch confirmed!\n');

  console.log('🎉 ALL VOICE SWITCHER TESTS PASSED SUCCESSFULLY! 🎉');
}

runVoiceSwitchTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
