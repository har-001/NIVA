// ============================================
// NIVA — Phase 06 Computer Control Automated Tests
// ============================================

import { toolRegistry } from './modules/tools/tool.registry';

async function runTests() {
  console.log('🧪 Starting Phase 06 Advanced Computer Control Test Suite...\n');

  // Test 1: Volume Control
  console.log('--- TEST 1: Volume Control Tool ---');
  const volRes = await toolRegistry.execute('system_volume', { action: 'up' });
  console.log('Volume Result:', volRes.result);
  if (!volRes.result?.includes('volume')) throw new Error('Volume test failed');
  console.log('✅ Volume tool execution verified.\n');

  // Test 2: Clipboard Write & Read
  console.log('--- TEST 2: Clipboard Tool ---');
  const clipWrite = await toolRegistry.execute('system_clipboard', { action: 'write', text: 'NIVA Autonomous AI Assistant' });
  console.log('Clipboard Write Result:', clipWrite.result);
  const clipRead = await toolRegistry.execute('system_clipboard', { action: 'read' });
  console.log('Clipboard Read Result:', clipRead.result);
  if (!clipRead.result?.includes('NIVA Autonomous AI Assistant')) throw new Error('Clipboard test failed');
  console.log('✅ Clipboard read/write verified.\n');

  // Test 3: List Files in User Directory
  console.log('--- TEST 3: List Files in Documents ---');
  const listRes = await toolRegistry.execute('system_list_files', { folder: 'Documents' });
  console.log('List Files Result:\n', listRes.result?.slice(0, 200) + '...\n');
  if (!listRes.result?.includes('Files in Documents')) throw new Error('List files test failed');
  console.log('✅ List files tool execution verified.\n');

  // Test 4: Read File Content
  console.log('--- TEST 4: Read Safe File Content ---');
  const readRes = await toolRegistry.execute('system_read_file', { filepath: 'package.json' });
  console.log('Read File Result:\n', readRes.result?.slice(0, 150) + '...\n');
  if (!readRes.result?.includes('niva-server')) throw new Error('Read file test failed');
  console.log('✅ Read file tool execution verified.\n');

  console.log('🎉 ALL 4/4 COMPUTER CONTROL TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
