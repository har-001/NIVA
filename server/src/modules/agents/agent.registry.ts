// ============================================
// NIVA — Specialized Agent Registry
// ============================================

import { AgentProfile, AgentRole } from './types';

export class AgentRegistry {
  private profiles: Map<AgentRole, AgentProfile> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const defaultProfiles: AgentProfile[] = [
      {
        id: 'agent_orchestrator',
        role: 'orchestrator',
        name: 'NIVA Lead',
        title: 'Chief Planning & Orchestration Agent',
        avatar: '🎯',
        description: 'Analyzes user goals, generates structured DAG task plans, coordinates sub-agents, and synthesizes executive conclusions.',
        capabilities: ['Goal Decomposition', 'DAG Subtask Scheduling', 'Inter-Agent Synthesis', 'Blackboard Coordination'],
        allowedTools: ['list_plugins', 'run_workflow', 'list_workflows'],
        status: 'ready',
        systemPrompt: `You are NIVA Lead Orchestrator. Your role is to break down complex multidomain objectives into clean subtasks, delegate them to specialist agents (researcher, coder, visionary, archivist, executor, guardian), and merge their outputs into an executive response.`,
      },
      {
        id: 'agent_researcher',
        role: 'researcher',
        name: 'Web Mining Scout',
        title: 'Intelligence & Live Web Research Specialist',
        avatar: '🔍',
        description: 'Queries live web search, reads deep online articles, aggregates breaking news, and mines factual data.',
        capabilities: ['DuckDuckGo Live Search', 'HTML-to-Markdown Reader', 'Google News RSS Mining', 'Multi-Source Fact Verification'],
        allowedTools: ['web_search', 'browse_webpage', 'fetch_news', 'crypto_price_tracker', 'currency_convert'],
        status: 'ready',
        systemPrompt: `You are the Research Specialist. Your job is to search the internet, read live web pages, extract verified facts, and present clear, concise bullet points for downstream agents and the user.`,
      },
      {
        id: 'agent_coder',
        role: 'coder',
        name: 'Engineer Prime',
        title: 'Software Engineering & IDE Specialist',
        avatar: '💻',
        description: 'Generates production-grade code, formats and beautifies syntax, inspects GitHub repositories, and coordinates local IDE launches.',
        capabilities: ['Multi-Language Synthesis', 'Code Beautification', 'GitHub Intelligence', 'VS Code Workspace Launch'],
        allowedTools: ['generate_code', 'code_beautify_format', 'github_repo_info', 'github_trending'],
        status: 'ready',
        systemPrompt: `You are Engineer Prime. You write production-grade, bug-free, well-typed code. You format syntax cleanly and support modern development patterns across TypeScript, Python, Next.js, and shell scripting.`,
      },
      {
        id: 'agent_visionary',
        role: 'visionary',
        name: 'Multimodal Visionary',
        title: 'Visual Perception & Creative Assets Specialist',
        avatar: '👁️',
        description: 'Synthesizes high-definition digital artwork, visual assets, diagrams, and conducts optical camera inspections.',
        capabilities: ['AI Image Synthesis', 'Prompt Engineering', 'Visual Perception Analysis', 'Asset Optimization'],
        allowedTools: ['generate_image'],
        status: 'ready',
        systemPrompt: `You are the Multimodal Visionary. You craft rich artistic visuals, generate crisp diagrams and user interface concepts, and analyze visual imagery with aesthetic precision.`,
      },
      {
        id: 'agent_archivist',
        role: 'archivist',
        name: 'Knowledge Archivist',
        title: 'Semantic Memory & Document RAG Specialist',
        avatar: '🧠',
        description: 'Manages long-term vector embeddings, user preference memories, document retrieval, and persistent knowledge bases.',
        capabilities: ['Vector Semantic Search', 'Memory Recall & Pinning', 'Document RAG Chunking', 'Personalization Retention'],
        allowedTools: ['search_memories', 'save_memory', 'delete_memory'],
        status: 'ready',
        systemPrompt: `You are the Knowledge Archivist. You maintain the long-term semantic memory of NIVA. You recall past user facts and store critical knowledge for persistent continuity.`,
      },
      {
        id: 'agent_executor',
        role: 'executor',
        name: 'System Actuator',
        title: 'Windows Native Control & Automation Specialist',
        avatar: '⚡',
        description: 'Interfaces with native Windows 11 hardware controls, app launchers, workflow scheduler, and system telemetry.',
        capabilities: ['Native App Launch', 'Telemetry Diagnostics', 'Multi-Step Workflow Execution', 'Audio/Media Playback Control'],
        allowedTools: ['system_open_app', 'system_info', 'system_open_url', 'run_workflow', 'media_player_control'],
        status: 'ready',
        systemPrompt: `You are the System Actuator. You control the user laptop safely. You launch native Windows applications, check CPU/RAM/Battery metrics, and execute approved automation workflows.`,
      },
      {
        id: 'agent_guardian',
        role: 'guardian',
        name: 'Sentinel Guardian',
        title: 'Safety, Policy & Quality Verifier Specialist',
        avatar: '🛡️',
        description: 'Audits multi-agent outputs for policy compliance, security constraints, human-in-the-loop approvals, and factual coherence.',
        capabilities: ['Security Policy Auditing', 'Human Approval Gating', 'Hallucination & Quality Verification', 'Permission Checking'],
        allowedTools: ['system_info'],
        status: 'ready',
        systemPrompt: `You are the Sentinel Guardian. You are the final quality and safety gatekeeper. You inspect generated subtask outputs, verify safety rules, and ensure the response meets strict standards.`,
      },
    ];

    for (const profile of defaultProfiles) {
      this.profiles.set(profile.role, profile);
    }
  }

  getProfile(role: AgentRole): AgentProfile | undefined {
    return this.profiles.get(role);
  }

  getAllProfiles(): AgentProfile[] {
    return Array.from(this.profiles.values());
  }

  isToolAllowed(role: AgentRole, toolName: string): boolean {
    const profile = this.profiles.get(role);
    if (!profile) return false;
    // Orchestrator can coordinate any tool
    if (role === 'orchestrator') return true;
    return profile.allowedTools.includes(toolName);
  }
}

export const agentRegistry = new AgentRegistry();
