// ============================================
// NIVA — Phase 14 Multi-Agent Orchestration Test Suite
// ============================================

import { agentRegistry } from './modules/agents/agent.registry';
import { orchestratorService } from './modules/agents/orchestrator.service';
import { AgentBlackboard } from './modules/agents/blackboard';
import { toolRegistry } from './modules/tools/tool.registry';
import { systemTools } from './modules/tools/system.tools';
import { pluginService } from './modules/plugins/plugin.service';
import { FallbackProvider } from './modules/ai/providers/fallback.provider';

async function runMultiAgentTests() {
  console.log('🚀 Starting Phase 14 Multi-Agent Orchestration Test Suite...\n');

  // Register system tools
  for (const t of systemTools) {
    toolRegistry.register(t);
  }

  // --- TEST 1: Agent Registry & Specialist Roles Verification ---
  console.log('--- TEST 1: Specialized Agent Profiles Verification ---');
  const allProfiles = agentRegistry.getAllProfiles();
  console.log(`Total Registered Specialists: ${allProfiles.length}`);

  const requiredRoles = ['orchestrator', 'researcher', 'coder', 'visionary', 'archivist', 'executor', 'guardian'];
  for (const role of requiredRoles) {
    const profile = agentRegistry.getProfile(role as any);
    if (!profile) {
      throw new Error(`FAILED: Specialist role '${role}' is missing from AgentRegistry!`);
    }
    console.log(`  [${profile.avatar}] ${profile.name} (${profile.role}) — ${profile.title} | Allowed Tools: ${profile.allowedTools.length}`);
  }

  if (allProfiles.length !== 7) {
    throw new Error(`FAILED: Expected 7 agent profiles, but found ${allProfiles.length}`);
  }
  console.log('✅ PASSED: All 7 specialized agent profiles verified successfully!\n');

  // --- TEST 2: Goal Decomposition & DAG Planning ---
  console.log('--- TEST 2: Goal Decomposition & Subtask Planning ---');
  const testGoal = 'Search latest artificial intelligence breakthroughs, generate Python simulation code, and save to memory';
  const plan = await orchestratorService.planMission(testGoal, 'test_user_01');

  console.log(`Mission ID: ${plan.id} | Status: ${plan.status} | Subtasks Count: ${plan.subtasks.length}`);
  plan.subtasks.forEach((st, idx) => {
    const deps = st.dependsOn.length > 0 ? ` [Depends on: ${st.dependsOn.join(', ')}]` : '';
    console.log(`  Subtask ${idx + 1}: [${st.assignedRole.toUpperCase()}] "${st.title}"${deps}`);
  });

  const rolesInPlan = plan.subtasks.map(s => s.assignedRole);
  if (!rolesInPlan.includes('researcher') || !rolesInPlan.includes('coder') || !rolesInPlan.includes('guardian')) {
    throw new Error('FAILED: Mission plan missing essential assigned roles!');
  }
  console.log('✅ PASSED: Goal decomposed into multi-step DAG with proper role assignments!\n');

  // --- TEST 3: Mission Execution with Inter-Agent Blackboard Passing ---
  console.log('--- TEST 3: Collaborative Execution & Blackboard Context Passing ---');
  let eventsCount = 0;
  const eventListener = (ev: any) => {
    eventsCount++;
  };
  orchestratorService.addEventListener(eventListener);

  const executedMission = await orchestratorService.executeMission(plan.id);
  orchestratorService.removeEventListener(eventListener);

  console.log(`Mission Execution Result: ${executedMission.status} | Duration: ${executedMission.totalDurationMs}ms`);
  console.log(`Events Emitted During Execution: ${eventsCount}`);

  const blackboardEntries = Object.keys(executedMission.blackboard);
  console.log(`Blackboard Data Entries: ${blackboardEntries.join(', ')}`);

  if (executedMission.status !== 'completed' || blackboardEntries.length === 0) {
    throw new Error('FAILED: Mission did not complete or blackboard remained empty!');
  }
  console.log('✅ PASSED: Multi-agent mission executed with rich shared blackboard memory!\n');

  // --- TEST 4: Sentinel Guardian Verifier & Safety Audit ---
  console.log('--- TEST 4: Sentinel Guardian Safety & Quality Verification ---');
  console.log('Sentinel Verdict:', executedMission.verdict);
  if (!executedMission.verdict?.isSafe || executedMission.verdict.confidence < 0.9) {
    throw new Error('FAILED: Sentinel Guardian verification did not pass!');
  }
  console.log('Synthesized Executive Summary:\n', executedMission.finalSummary);
  console.log('✅ PASSED: Sentinel Guardian verified mission safety and quality!\n');

  // --- TEST 5: AI Agent Conversational Intent Recognition ---
  console.log('--- TEST 5: Conversational Intent Recognition (`orchestrate_mission`) ---');
  const provider = new FallbackProvider();

  // 5a. Intent detection
  const intent1 = (provider as any).detectToolCall('multi agent se research and code create karwao');
  console.log('Intent Detected (orchestrate_mission):', intent1?.name);
  if (!intent1 || intent1.name !== 'orchestrate_mission') {
    throw new Error('FAILED: Multi-agent conversational intent not recognized!');
  }

  // 5b. List agents intent
  const intent2 = (provider as any).detectToolCall('agents dikhao');
  console.log('Intent Detected (list_agents):', intent2?.name);
  if (!intent2 || intent2.name !== 'list_agents') {
    throw new Error('FAILED: List agents conversational intent not recognized!');
  }

  // 5c. Tool execution test
  const listAgentsRes = await toolRegistry.execute('list_agents', {});
  console.log('List Agents Output:\n', listAgentsRes.result);
  if (listAgentsRes.isError || !listAgentsRes.result?.includes('NIVA Lead')) {
    throw new Error('FAILED: list_agents tool execution failed!');
  }
  console.log('✅ PASSED: AI Agent conversational intents for Multi-Agent Squad verified!\n');

  console.log('🎉 ALL 5 MULTI-AGENT ORCHESTRATION TESTS PASSED WITH 100% SUCCESS!');
}

runMultiAgentTests().catch((err) => {
  console.error('❌ Multi-Agent Test Suite Failed:', err);
  process.exit(1);
});
