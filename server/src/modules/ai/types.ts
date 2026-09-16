// ============================================
// NIVA — AI Provider Types & Interfaces
// ============================================

/**
 * Unified types for the AI provider abstraction layer.
 * Any AI provider (Gemini, OpenAI, Ollama) must implement the AIProvider interface.
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AIToolResult {
  toolCallId: string;
  name: string;
  result: string;
  isError?: boolean;
}

export interface AIGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  tools?: AIToolDefinition[];
  stream?: boolean;
  stopSequences?: string[];
}

export interface AIResponse {
  content: string;
  finishReason: 'stop' | 'tool_calls' | 'max_tokens' | 'error';
  toolCalls?: AIToolCall[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  metadata?: Record<string, unknown>;
}

export interface AIStreamChunk {
  type: 'text' | 'tool_call' | 'usage' | 'done' | 'error';
  content?: string;
  toolCall?: AIToolCall;
  usage?: AIResponse['usage'];
  error?: string;
}

/**
 * The AI Provider interface that all providers must implement.
 */
export interface AIProvider {
  /** Provider name (e.g., "gemini", "openai", "ollama") */
  readonly name: string;

  /** Check if the provider is configured and available */
  isAvailable(): boolean;

  /** Generate a response (non-streaming) */
  generate(
    messages: AIMessage[],
    options?: AIGenerateOptions
  ): Promise<AIResponse>;

  /** Generate a streaming response */
  stream(
    messages: AIMessage[],
    options?: AIGenerateOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown>;

  /** List available models for this provider */
  listModels(): Promise<string[]>;
}
