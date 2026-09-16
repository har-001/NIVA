// ============================================
// NIVA — Google Gemini AI Provider
// ============================================

import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../../../config';
import { logger } from '../../../utils/logger';
import {
  AIProvider,
  AIMessage,
  AIGenerateOptions,
  AIResponse,
  AIStreamChunk,
  AIToolDefinition,
  AIToolCall,
} from '../types';

const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * Convert NIVA messages to Gemini content format
 */
function toGeminiContents(messages: AIMessage[]) {
  return messages
    .filter((m) => m.role !== 'system') // system prompt handled separately
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

/**
 * Convert NIVA tool definitions to Gemini function declarations
 */
function toGeminiFunctions(tools: AIToolDefinition[]) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as any,
  }));
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!this.client) {
      if (!config.geminiApiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return !!config.geminiApiKey;
  }

  async generate(
    messages: AIMessage[],
    options?: AIGenerateOptions
  ): Promise<AIResponse> {
    const client = this.getClient();
    const model = options?.model || DEFAULT_MODEL;
    const systemPrompt = options?.systemPrompt || messages.find((m) => m.role === 'system')?.content;
    const contents = toGeminiContents(messages);

    try {
      const generateConfig: any = {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 0.95,
      };

      if (options?.stopSequences?.length) {
        generateConfig.stopSequences = options.stopSequences;
      }

      const toolsConfig = options?.tools?.length
        ? [{ functionDeclarations: toGeminiFunctions(options.tools) }]
        : undefined;

      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          ...generateConfig,
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          tools: toolsConfig,
        },
      });

      // Extract text and tool calls
      const candidate = response.candidates?.[0];
      let content = '';
      const toolCalls: AIToolCall[] = [];

      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            content += part.text;
          }
          if (part.functionCall) {
            toolCalls.push({
              id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              name: part.functionCall.name!,
              arguments: (part.functionCall.args as Record<string, unknown>) || {},
            });
          }
        }
      }

      const finishReason = toolCalls.length > 0 ? 'tool_calls' : 'stop';

      return {
        content,
        finishReason,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        model,
      };
    } catch (error: any) {
      logger.error('Gemini generate error:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  async *stream(
    messages: AIMessage[],
    options?: AIGenerateOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    const client = this.getClient();
    const model = options?.model || DEFAULT_MODEL;
    const systemPrompt = options?.systemPrompt || messages.find((m) => m.role === 'system')?.content;
    const contents = toGeminiContents(messages);

    try {
      const generateConfig: any = {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 0.95,
      };

      const toolsConfig = options?.tools?.length
        ? [{ functionDeclarations: toGeminiFunctions(options.tools) }]
        : undefined;

      const response = await client.models.generateContentStream({
        model,
        contents,
        config: {
          ...generateConfig,
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          tools: toolsConfig,
        },
      });

      for await (const chunk of response) {
        if (chunk.candidates?.[0]?.content?.parts) {
          for (const part of chunk.candidates[0].content.parts) {
            if (part.text) {
              yield { type: 'text', content: part.text };
            }
            if (part.functionCall) {
              yield {
                type: 'tool_call',
                toolCall: {
                  id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                  name: part.functionCall.name!,
                  arguments: (part.functionCall.args as Record<string, unknown>) || {},
                },
              };
            }
          }
        }

        // Yield usage info at end
        if (chunk.usageMetadata) {
          yield {
            type: 'usage',
            usage: {
              inputTokens: chunk.usageMetadata.promptTokenCount || 0,
              outputTokens: chunk.usageMetadata.candidatesTokenCount || 0,
              totalTokens: chunk.usageMetadata.totalTokenCount || 0,
            },
          };
        }
      }

      yield { type: 'done' };
    } catch (error: any) {
      logger.error('Gemini stream error:', error);
      yield { type: 'error', error: error.message };
    }
  }

  async listModels(): Promise<string[]> {
    return [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash-preview-05-20',
      'gemini-2.5-pro-preview-05-06',
    ];
  }
}
