// ============================================
// NIVA — Conversational Agent Engine (Memory-Aware)
// ============================================

import { aiRegistry } from './registry';
import { buildSystemPrompt, UserContext } from './prompt';
import { toolRegistry } from '../tools/tool.registry';
import { AIMessage, AIStreamChunk } from './types';
import { logger } from '../../utils/logger';
import { memoryService } from '../memory/memory.service';
import { documentService } from '../memory/document.service';

export interface AgentStreamEvent {
  type: 'chunk' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;
  toolCall?: { id: string; name: string; arguments: Record<string, any> };
  toolResult?: { name: string; result: string; isError?: boolean };
  error?: string;
}

export class NivaAgent {
  /**
   * Fetch and build memory-augmented context for the AI.
   * Injects pinned memories + semantically relevant memories/documents.
   */
  private async buildMemoryContext(
    userId: string | undefined,
    userMessage: string,
    baseContext?: UserContext
  ): Promise<UserContext> {
    const ctx: UserContext = { ...baseContext, userId };

    if (!userId) return ctx;

    try {
      // 1. Fetch pinned memories (always injected)
      const pinned = await memoryService.getPinnedMemories(userId);
      if (pinned.length > 0) {
        ctx.pinnedMemories = pinned.map(
          (m) => `**${m.key}** [${m.category}]: ${m.content}`
        );
      }

      // 2. Semantic search for relevant context based on current message
      const [memResults, docResults] = await Promise.all([
        memoryService.searchMemories(userId, userMessage, 3).catch(() => []),
        documentService.searchDocuments(userId, userMessage, 3).catch(() => []),
      ]);

      const relevantContext: string[] = [];

      for (const r of memResults) {
        relevantContext.push(
          `[Memory] ${r.memory.key}: ${r.memory.content} (${(r.score * 100).toFixed(0)}% relevant)`
        );
      }

      for (const r of docResults) {
        relevantContext.push(
          `[Document: ${r.documentName}] ${r.chunkContent.slice(0, 300)} (${(r.score * 100).toFixed(0)}% relevant)`
        );
      }

      if (relevantContext.length > 0) {
        ctx.relevantContext = relevantContext;
      }
    } catch (err: any) {
      logger.warn(`Failed to build memory context: ${err.message}`);
    }

    return ctx;
  }

  /**
   * Run agent with streaming responses and tool execution loop.
   * Now memory-aware: injects relevant context from memories and documents.
   */
  async *chatStream(
    history: AIMessage[],
    userMessage: string,
    userContext?: UserContext
  ): AsyncGenerator<AgentStreamEvent, void, unknown> {
    const provider = aiRegistry.getProvider();

    // Build memory-augmented context
    const enrichedContext = await this.buildMemoryContext(
      userContext?.userId,
      userMessage,
      userContext
    );

    const systemPrompt = buildSystemPrompt(enrichedContext);
    const tools = toolRegistry.toAIToolDefinitions();

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];

    try {
      logger.info(`NIVA Agent invoking provider: ${provider.name}`);
      let fullResponseText = '';
      let activeToolCall: any = null;

      for await (const chunk of provider.stream(messages, {
        systemPrompt,
        tools,
        temperature: 0.7,
      })) {
        if (chunk.type === 'text' && chunk.content) {
          fullResponseText += chunk.content;
          yield { type: 'chunk', content: chunk.content };
        } else if (chunk.type === 'tool_call' && chunk.toolCall) {
          activeToolCall = chunk.toolCall;
          yield {
            type: 'tool_call',
            toolCall: chunk.toolCall,
          };

          // Execute the tool locally — pass userId in context for memory tools
          logger.info(`Executing tool from AI stream: ${chunk.toolCall.name}`);
          const execution = await toolRegistry.execute(
            chunk.toolCall.name,
            chunk.toolCall.arguments,
            { ...enrichedContext, userId: enrichedContext.userId }
          );

          yield {
            type: 'tool_result',
            toolResult: {
              name: execution.name,
              result: execution.result || '',
              isError: execution.isError,
            },
          };

          // Format a pleasant conversational explanation
          if (!fullResponseText.trim()) {
            let verbalConfirm = 'Maine task complete kar diya hai.';
            let explanation = '';
            const toolName = chunk.toolCall.name;

            if (toolName === 'system_open_app') {
              explanation = `Maine aapke laptop par **${chunk.toolCall.arguments?.app_name || 'app'}** open kar diya hai.`;
            } else if (toolName === 'system_run_command') {
              verbalConfirm = `Maine aapke laptop par command \`${chunk.toolCall.arguments?.command || ''}\` execute kar diya hai:`;
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'system_open_url') {
              const url = String(chunk.toolCall.arguments?.url || '');
              if (url.includes('youtube.com')) {
                explanation = 'Maine aapke laptop par YouTube open kar diya hai.';
              } else {
                explanation = 'Maine aapke laptop browser me page open kar diya hai.';
              }
            } else if (toolName === 'system_info') {
              verbalConfirm = 'Aapke laptop ka system status check kar liya hai.';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'system_screenshot') {
              verbalConfirm = 'Laptop screen ka screenshot capture kar liya hai.';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'calculator') {
              verbalConfirm = 'Calculation solve kar li hai.';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'date_time') {
              verbalConfirm = 'Current date aur time details ye rahe.';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName.startsWith('memory_')) {
              verbalConfirm = 'Memory successfully update ho gayi hai.';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'generate_code') {
              verbalConfirm = 'Maine aapka code generate karke `niva_workspace` me save kar diya hai aur VS Code me open kar diya hai!';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'generate_image') {
              verbalConfirm = 'Maine aapki requested image generate kar di hai:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'system_open_ide') {
              verbalConfirm = 'Maine file ko aapke laptop ke IDE me launch kar diya hai.';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'send_email') {
              verbalConfirm = 'Maine email dispatch kar diya hai.';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'send_message') {
              verbalConfirm = 'Maine message dispatch kar diya hai.';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'initiate_call') {
              verbalConfirm = 'Call connect ho gayi hai.';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'web_search') {
              verbalConfirm = 'Maine live web search complete kar li hai. Ye rahe top results aur sources:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'browse_webpage') {
              verbalConfirm = 'Maine webpage read kar liya hai. Article ka content ye raha:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'fetch_news') {
              verbalConfirm = 'Maine live news feed se taaza khabrein fetch kar li hain:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'run_workflow') {
              verbalConfirm = 'Maine autonomous workflow execution start kar diya hai:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'list_workflows') {
              verbalConfirm = 'NIVA ke sabhi active workflows aur automation schedules ye rahe:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'schedule_task') {
              verbalConfirm = 'Maine aapka task schedule kar diya hai:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'list_plugins') {
              verbalConfirm = 'NIVA ke sabhi installed plugins aur unki capabilities ye rahe:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'toggle_plugin') {
              verbalConfirm = 'Plugin status update ho gaya hai:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'github_repo_info' || toolName === 'github_trending') {
              verbalConfirm = 'GitHub Intelligence se data fetch kar liya hai:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'orchestrate_mission') {
              verbalConfirm = 'Maine Multi-Agent Squad ko deploy karke mission execute aur verify kar diya hai:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'list_agents') {
              verbalConfirm = 'NIVA Multi-Agent Squad ke sabhi 7 specialized agents aur unke roles ye rahe:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'media_player_control') {
              verbalConfirm = 'Windows media command execute kar diya gaya hai.';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'crypto_price_tracker' || toolName === 'currency_convert') {
              verbalConfirm = 'FinTech market data fetch kar liya hai:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else if (toolName === 'code_beautify_format') {
              verbalConfirm = 'Code formatting complete ho gaya hai:';
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            } else {
              explanation = `${verbalConfirm}\n\n${execution.result}`;
            }

            fullResponseText += explanation;
            yield { type: 'chunk', content: explanation };
          }
        } else if (chunk.type === 'error') {
          yield { type: 'error', error: chunk.error };
        }
      }

      yield { type: 'done', content: fullResponseText };
    } catch (err: any) {
      logger.error('NIVA Agent error:', err);
      yield { type: 'error', error: err.message };
    }
  }
}

export const nivaAgent = new NivaAgent();
