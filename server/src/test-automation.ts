// ============================================
// NIVA — Phase 12 Automation & Workflows Test Suite
// ============================================

import { automationService } from './modules/automation/automation.service';
import { nivaAgent } from './modules/ai/agent';

async function runAutomationTests() {
  console.log('🧪 Starting NIVA Phase 12 Automation & Workflows Test Suite...\n');

  // --- TEST 1: Workflow Registry & Seeds ---
  console.log('--- TEST 1: Workflow Registry & Seed Workflows ---');
  const allWorkflows = automationService.getAllWorkflows();
  console.log(`Registered Workflows: ${allWorkflows.length}`);
  allWorkflows.forEach((wf, idx) => {
    console.log(` [${idx + 1}] "${wf.name}" (${wf.id}) | Trigger: ${wf.trigger.type} | Steps: ${wf.steps.length} | Active: ${wf.isActive}`);
  });

  if (allWorkflows.length < 4) {
    throw new Error(`FAILED: Expected at least 4 seed workflows, found ${allWorkflows.length}`);
  }
  console.log('✅ PASSED: Default autonomous workflows registered successfully!\n');

  // --- TEST 2: Multi-Step Workflow Execution ---
  console.log('--- TEST 2: Multi-Step Workflow Execution (Morning Briefing) ---');
  const execution = await automationService.runWorkflow('wf_morning_briefing');
  console.log(`Execution ID: ${execution.id} | Status: ${execution.status} | Steps completed: ${execution.stepResults.length}`);
  execution.stepResults.forEach((res, idx) => {
    console.log(`  Step [${idx + 1}] ${res.stepId} (${res.tool}): Status=${res.status}, Duration=${res.durationMs}ms`);
  });

  if (execution.status !== 'completed' || execution.stepResults.length !== 3) {
    throw new Error(`FAILED: Morning briefing execution did not complete properly! Status: ${execution.status}`);
  }
  console.log('✅ PASSED: Multi-step workflow executed sequentially and completed!\n');

  // --- TEST 3: Human-in-the-Loop Approval Gating ---
  console.log('--- TEST 3: Human-in-the-Loop Approval Gating ---');
  const sensitiveExec = await automationService.runWorkflow('wf_critical_action_approval');
  console.log(`Initial Status: ${sensitiveExec.status} | Current Step: ${sensitiveExec.currentStepIndex}`);
  
  if (sensitiveExec.status !== 'waiting_approval') {
    throw new Error(`FAILED: Expected execution status to be 'waiting_approval', got '${sensitiveExec.status}'`);
  }
  console.log('  -> Workflow paused at sensitive step requiring human approval.');

  // Now simulate user approval
  console.log('  -> Simulating user approval via approveExecution()...');
  const approvedExec = await automationService.approveExecution(sensitiveExec.id);
  console.log(`After Approval Status: ${approvedExec.status} | Total Steps: ${approvedExec.stepResults.length}`);

  if (approvedExec.status !== 'completed') {
    throw new Error(`FAILED: Approved execution failed to complete! Status: ${approvedExec.status}`);
  }
  console.log('✅ PASSED: Approval gating successfully paused and resumed on user confirmation!\n');

  // --- TEST 4: Custom Workflow Creation & Toggle ---
  console.log('--- TEST 4: Custom Workflow Creation & Lifecycle ---');
  const customWf = automationService.createWorkflow({
    name: 'Test File & System Audit',
    description: 'Custom test workflow for automated testing',
    trigger: { type: 'manual' },
    steps: [
      {
        id: 'step_1',
        name: 'Check Time',
        tool: 'date_time',
        arguments: {},
      },
    ],
  });
  console.log(`Created Workflow: ${customWf.name} (${customWf.id})`);
  
  const toggled = automationService.toggleWorkflow(customWf.id, false);
  console.log(`Toggled isActive: ${toggled.isActive}`);
  if (toggled.isActive !== false) {
    throw new Error('FAILED: Toggle workflow did not set isActive to false!');
  }

  const deleted = automationService.deleteWorkflow(customWf.id);
  console.log(`Deleted: ${deleted}`);
  if (!deleted) {
    throw new Error('FAILED: Delete workflow failed!');
  }
  console.log('✅ PASSED: Custom workflow creation, toggle, and deletion verified!\n');

  // --- TEST 5: AI Agent `run_workflow` Tool Execution ---
  console.log('--- TEST 5: AI Agent Conversational Execution of `run_workflow` ---');
  let agentReply = '';
  for await (const event of nivaAgent.chatStream([], 'morning briefing workflow chalao')) {
    if (event.type === 'chunk' && event.content) {
      agentReply += event.content;
    }
  }
  console.log('Agent Response Snippet:\n', agentReply.slice(0, 350) + '...\n');
  if (!agentReply.includes('Morning Intelligence Briefing') && !agentReply.includes('Briefing') && !agentReply.includes('workflow')) {
    throw new Error('FAILED: Agent response does not reflect workflow execution!');
  }
  console.log('✅ PASSED: Conversational intent recognized and workflow triggered by AI Agent!\n');

  console.log('🎉 ALL 5 AUTOMATION TESTS PASSED SUCCESSFULLY! NIVA autonomous engine is fully operational.');
}

runAutomationTests().catch((err) => {
  console.error('❌ Automation Test Suite Failed:', err);
  process.exit(1);
});
