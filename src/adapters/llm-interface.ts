// Minimal LLM adapter interface for auditor

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMAdapter {
  generateResponse(params: {
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<LLMResponse>;
}

// Simple Claude adapter (stub for now)
export class ClaudeAdapter implements LLMAdapter {
  constructor(private apiKey: string) {}

  async generateResponse(params: {
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<LLMResponse> {
    // Stub - will implement full version later with @anthropic-ai/sdk
    return {
      content: JSON.stringify({ methodologyScore: 70, relevanceScore: 75 }),
      model: 'claude-sonnet-4',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
    };
  }
}
