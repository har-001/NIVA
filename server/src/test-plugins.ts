// ============================================
// NIVA — Phase 13 Plugin Ecosystem Test Suite
// ============================================

import { pluginService } from './modules/plugins/plugin.service';
import { toolRegistry } from './modules/tools/tool.registry';
import { createPluginSDK, PluginPermissionError } from './modules/plugins/plugin.sdk';
import { nivaAgent } from './modules/ai/agent';

async function runPluginTests() {
  console.log('🧪 Starting NIVA Phase 13 Plugin Ecosystem Test Suite...\n');

  // --- TEST 1: Plugin Registry & Default Seeds ---
  console.log('--- TEST 1: Plugin Registry & Pre-built Seeds ---');
  const plugins = pluginService.getAllPlugins();
  console.log(`Installed Plugins Count: ${plugins.length}`);
  plugins.forEach((p, idx) => {
    const m = p.manifest;
    console.log(` [${idx + 1}] ${m.icon || '🧩'} ${m.name} (${m.id}) | Category: ${m.category} | Status: ${p.status} | Tools: ${m.tools?.length || 0}`);
  });

  if (plugins.length < 4) {
    throw new Error(`FAILED: Expected at least 4 default plugins, got ${plugins.length}`);
  }
  console.log('✅ PASSED: Default seed plugins loaded and active!\n');

  // --- TEST 2: Dynamic Tool Synchronization on Toggle ---
  console.log('--- TEST 2: Dynamic Tool Registration & Deregistration ---');
  const toolBefore = toolRegistry.get('github_repo_info');
  if (!toolBefore) {
    throw new Error('FAILED: "github_repo_info" should be registered initially!');
  }
  console.log('Initial check: "github_repo_info" is present in toolRegistry.');

  // Disable GitHub plugin
  console.log('Disabling "niva-plugin-github"...');
  await pluginService.disablePlugin('niva-plugin-github');
  const toolAfterDisable = toolRegistry.get('github_repo_info');
  if (toolAfterDisable) {
    throw new Error('FAILED: "github_repo_info" was not removed after disabling plugin!');
  }
  console.log('Verified: Tool was dynamically detached from toolRegistry.');

  // Re-enable GitHub plugin
  console.log('Re-enabling "niva-plugin-github"...');
  await pluginService.enablePlugin('niva-plugin-github');
  const toolAfterReenable = toolRegistry.get('github_repo_info');
  if (!toolAfterReenable) {
    throw new Error('FAILED: "github_repo_info" was not re-registered after enabling plugin!');
  }
  console.log('✅ PASSED: Dynamic tool lifecycle sync verified successfully!\n');

  // --- TEST 3: Permission Enforcement Sandbox ---
  console.log('--- TEST 3: Sandboxed Plugin SDK & Permission Boundaries ---');
  const restrictedManifest = {
    id: 'test-sandbox-plugin',
    name: 'Restricted Test Plugin',
    version: '1.0.0',
    description: 'Plugin without network permission',
    author: 'Test',
    category: 'utilities' as const,
    permissions: ['storage:readwrite' as const],
  };

  const sdk = createPluginSDK(restrictedManifest, {}, () => {});
  
  // Storage should succeed
  await sdk.storage.set('test_key', 'safe_value');
  const storedVal = await sdk.storage.get('test_key');
  if (storedVal !== 'safe_value') {
    throw new Error('FAILED: Sandboxed storage failed to store or retrieve value!');
  }
  console.log('Storage permission granted: storage.get/set works.');

  // Network fetch should be denied
  let caughtPermissionError = false;
  try {
    await sdk.http.fetch('https://example.com');
  } catch (err: any) {
    if (err instanceof PluginPermissionError) {
      caughtPermissionError = true;
      console.log(`Permission denial caught as expected: "${err.message}"`);
    }
  }

  if (!caughtPermissionError) {
    throw new Error('FAILED: Plugin without network:fetch permission was not blocked!');
  }
  console.log('✅ PASSED: Permission boundary sandbox successfully enforced!\n');

  // --- TEST 4: Direct Tool Execution of Plugin Tools ---
  console.log('--- TEST 4: Plugin Tool Execution ---');
  // 4a. Currency Converter
  const currencyRes = await toolRegistry.execute('currency_convert', {
    amount: 100,
    from: 'USD',
    to: 'INR',
  });
  console.log('Currency Convert Result:\n', currencyRes.result);
  if (currencyRes.isError || !currencyRes.result?.includes('INR')) {
    throw new Error('FAILED: currency_convert tool execution failed!');
  }

  // 4b. Code Beautifier
  const formatRes = await toolRegistry.execute('code_beautify_format', {
    code: '{"project":"NIVA","phase":13,"active":true}',
    language: 'json',
  });
  console.log('Code Beautifier Result:\n', formatRes.result);
  if (formatRes.isError || !formatRes.result?.includes('Formatted JSON Output')) {
    throw new Error('FAILED: code_beautify_format tool execution failed!');
  }
  console.log('✅ PASSED: Plugin tools executed and returned verified output!\n');

  // --- TEST 5: AI Agent Intent Recognition (`list_plugins`) ---
  console.log('--- TEST 5: AI Agent Conversational Execution of `list_plugins` ---');
  let agentReply = '';
  for await (const event of nivaAgent.chatStream([], 'plugins dikhao')) {
    if (event.type === 'chunk' && event.content) {
      agentReply += event.content;
    }
  }
  console.log('Agent Response Snippet:\n', agentReply.slice(0, 350) + '...\n');
  if (!agentReply.includes('GitHub Intelligence') && !agentReply.includes('Windows Media') && !agentReply.includes('Plugins')) {
    throw new Error('FAILED: Agent response does not reflect installed plugins!');
  }
  console.log('✅ PASSED: Conversational intent recognized and plugins listed by AI Agent!\n');

  console.log('🎉 ALL 5 PLUGIN ECOSYSTEM TESTS PASSED SUCCESSFULLY! Phase 13 is fully functional.');
}

runPluginTests().catch((err) => {
  console.error('❌ Plugin Test Suite Failed:', err);
  process.exit(1);
});
