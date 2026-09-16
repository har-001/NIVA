// ============================================
// NIVA — Comprehensive Command Execution & Male Voice Persona Verification
// ============================================

import { nivaAgent } from './modules/ai/agent';
import { toolRegistry } from './modules/tools/tool.registry';

async function runVerification() {
  console.log('🧪 Starting NIVA Command Execution & Voice Persona Test Suite...\n');

  // 1. Male Persona Verification
  console.log('--- TEST 1: Masculine Hindi Persona & Response Check ---');
  let introResponse = '';
  for await (const event of nivaAgent.chatStream([], 'tum kaun ho aur kya kar sakte ho?')) {
    if (event.type === 'chunk' && event.content) {
      introResponse += event.content;
    }
  }
  console.log('Intro Response:\n', introResponse);

  const hasFeminineWords =
    introResponse.includes('sakti hoon') ||
    introResponse.includes('karti hoon') ||
    introResponse.includes('karungi');

  if (hasFeminineWords) {
    throw new Error('FAILED: Found feminine verb conjugations in AI response! Expected strictly male persona.');
  }

  const hasMasculineWords =
    introResponse.includes('sakta hoon') ||
    introResponse.includes('karta hoon') ||
    introResponse.includes('karunga');

  if (!hasMasculineWords) {
    throw new Error('FAILED: Expected masculine verb conjugations ("sakta hoon" / "karta hoon" / "karunga").');
  }
  console.log('✅ PASSED: Assistant speaks with authentic male persona!\n');

  // 2. Weather Command Execution Check
  console.log('--- TEST 2: Weather Command Intent Execution ---');
  let weatherToolTriggered = false;
  let weatherUrl = '';
  for await (const event of nivaAgent.chatStream([], 'aaj mausam kaisa hai weather batao')) {
    if (event.type === 'tool_call') {
      weatherToolTriggered = true;
      weatherUrl = event.toolCall?.arguments?.url;
      console.log(`⚡ Tool Triggered: ${event.toolCall?.name} -> ${weatherUrl}`);
    }
  }
  if (!weatherToolTriggered || !weatherUrl.includes('google.com/search?q=')) {
    throw new Error('FAILED: Weather query did not trigger physical search execution!');
  }
  console.log('✅ PASSED: Weather query triggers browser search!\n');

  // 3. YouTube / Music Command Execution Check
  console.log('--- TEST 3: YouTube / Music Command Execution ---');
  let ytToolTriggered = false;
  let ytUrl = '';
  for await (const event of nivaAgent.chatStream([], 'youtube par arijit singh ke gaane chalao')) {
    if (event.type === 'tool_call') {
      ytToolTriggered = true;
      ytUrl = event.toolCall?.arguments?.url;
      console.log(`⚡ Tool Triggered: ${event.toolCall?.name} -> ${ytUrl}`);
    }
  }
  if (!ytToolTriggered || !ytUrl.includes('youtube.com')) {
    throw new Error('FAILED: YouTube query did not trigger URL opening!');
  }
  console.log('✅ PASSED: YouTube query triggers YouTube launch!\n');

  // 4. Image Generation Response Check (NO raw link!)
  console.log('--- TEST 4: Image Generation Format Check (NO Raw Links) ---');
  const imgRes = await toolRegistry.execute('generate_image', { prompt: 'Futuristic Sports Car', style: 'cyberpunk' });
  console.log('Image Generation Result:\n', imgRes.result);
  if (imgRes.result?.includes('[Open Full Resolution Image]')) {
    throw new Error('FAILED: Image result still contains raw direct url link markdown!');
  }
  if (!imgRes.result?.includes('Generated Artwork')) {
    throw new Error('FAILED: Image result missing standard artwork card metadata.');
  }
  console.log('✅ PASSED: Image generation produces clean card format without raw link!\n');

  // 5. General Search / Question Check
  console.log('--- TEST 5: General Question Search Check ("elon musk kaun hai") ---');
  let searchToolTriggered = false;
  let searchUrl = '';
  for await (const event of nivaAgent.chatStream([], 'elon musk kaun hai search karo')) {
    if (event.type === 'tool_call') {
      searchToolTriggered = true;
      searchUrl = event.toolCall?.arguments?.url;
      console.log(`⚡ Tool Triggered: ${event.toolCall?.name} -> ${searchUrl}`);
    }
  }
  if (!searchToolTriggered || !searchUrl.includes('google.com/search?q=')) {
    throw new Error('FAILED: Question did not trigger live browser search!');
  }
  console.log('✅ PASSED: General question triggers live browser search execution!\n');

  console.log('🎉 ALL COMMAND EXECUTION & MALE VOICE TESTS PASSED SUCCESSFULLY! 🎉');
}

runVerification().catch((err) => {
  console.error('❌ Verification error:', err);
  process.exit(1);
});
