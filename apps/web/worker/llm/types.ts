/** One message sent to a chat model. */
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatRequest = {
  messages: ChatMessage[];
  maxOutputTokens?: number;
  temperature?: number;
};

/** A finished reply, with what it used. `costMicroUsd` is an estimate in millionths of a US dollar. */
export type ChatResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costMicroUsd: number;
};

export interface LlmProvider {
  chat(request: ChatRequest): Promise<ChatResult>;
  /** Optional: yields the reply as it is written, and returns the finished reply. */
  chatStream?(request: ChatRequest): AsyncGenerator<string, ChatResult, void>;
}

export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
  dimensions: number;
  /** A starting point for the lowest retrieval score worth answering from. Tune it with the eval. */
  suggestedMinScore?: number;
}

/** The fetch the adapters call. Tests pass their own, so no test touches the network. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
