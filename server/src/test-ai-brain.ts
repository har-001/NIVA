// ============================================
// NIVA — Phase 02 Automated AI Brain & System Tools Test
// ============================================

import { aiRegistry } from './modules/ai/registry';
import { toolRegistry } from './modules/tools/tool.registry';
import { nivaAgent } from './modules/ai/agent';

async function runTests() {
  console.log('🧪 Starting NIVA Phase 02 AI Brain & System Tools Test Suite...\n');

  // Test 1: Provider Registry
  console.log('--- TEST 1: AI Provider Registry ---');
  const providers = aiRegistry.listProviders();
  console.log('Registered Providers:', providers);
  const activeProvider = aiRegistry.getProvider();
  console.log(`✅ Active Provider: ${activeProvider.name} (available: ${activeProvider.isAvailable()})\n`);

  // Test 2: System Tools Registry
  console.log('--- TEST 2: System Tools Registry ---');
  const tools = toolRegistry.list();
  console.log(`Registered Tools (${tools.length}):`, tools.map((t) => t.name));
  if (tools.length < 5) throw new Error('Expected at least 5 tools');
  console.log('✅ System tools properly registered.\n');

  // Test 3: Tool Execution: Calculator
  console.log('--- TEST 3: Calculator Tool Execution ---');
  const calcRes = await toolRegistry.execute('calculator', { expression: '125 * 8 + 50' });
  console.log('Calculator Result:', calcRes.result);
  if (!calcRes.result?.includes('1050')) throw new Error('Calculator test failed');
  console.log('✅ Calculator tool execution verified.\n');

  // Test 4: Tool Execution: Date & Time
  console.log('--- TEST 4: Date & Time Tool Execution ---');
  const dtRes = await toolRegistry.execute('date_time', {});
  console.log('Date/Time Result:\n', dtRes.result);
  if (!dtRes.result?.includes('Date:')) throw new Error('Date time test failed');
  console.log('✅ Date/Time tool execution verified.\n');

  // Test 5: Tool Execution: System Info
  console.log('--- TEST 5: System / Laptop Info Tool Execution ---');
  const sysRes = await toolRegistry.execute('system_info', {});
  console.log('System Info Result:\n', sysRes.result);
  if (!sysRes.result?.includes('cpu')) throw new Error('System info test failed');
  console.log('✅ System / Laptop Info tool execution verified.\n');

  // Test 6: Agent Conversational Stream
  console.log('--- TEST 6: NIVA Agent Conversational Stream ---');
  let chatText = '';
  for await (const event of nivaAgent.chatStream([], 'Namaste NIVA!')) {
    if (event.type === 'chunk') {
      process.stdout.write(event.content || '');
      chatText += event.content || '';
    }
  }
  console.log('\n');
  if (chatText.length < 10) throw new Error('Agent stream failed to produce text');
  console.log('✅ Conversational agent stream verified.\n');

  // Test 7: Agent Tool Execution via Stream
  console.log('--- TEST 7: Agent Tool Execution via Stream ("system info") ---');
  let toolCalled = false;
  for await (const event of nivaAgent.chatStream([], 'Show me system info of my laptop')) {
    if (event.type === 'tool_call') {
      toolCalled = true;
      console.log(`⚡ Tool Call Triggered: ${event.toolCall?.name}`);
    } else if (event.type === 'tool_result') {
      console.log(`📦 Tool Result Received:`, event.toolResult?.result?.slice(0, 100) + '...');
    }
  }
  if (!toolCalled) throw new Error('Expected tool call to be triggered');
  console.log('✅ Agent tool calling in stream verified.\n');

  console.log('🎉 ALL 7/7 AI BRAIN & SYSTEM TOOLS TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
