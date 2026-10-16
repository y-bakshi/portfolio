/** One turn of the conversation, as given to an answerer. */
export type Turn = { role: 'user' | 'assistant'; text: string };

/** What an answer cost and how it was found, kept with the message for the owner's analytics. */
export type AnswerMeta = {
  model?: string;
  /** Ids of the retrieval chunks the answer was written from. */
  retrievalIds?: string[];
  /** How well the best chunk matched the question, 0 to 1. Low means the notes may not cover it. */
  topScore?: number;
  inputTokens?: number;
  outputTokens?: number;
  /** Integer millionths of a US dollar. */
  costMicroUsd?: number;
};

/** A finished answer. `cites` holds ids of cards on the page (a project, role or degree). */
export type AnswerResult = { text: string; cites: string[]; meta?: AnswerMeta };

/**
 * Anything that can answer a visitor's question. The retrieval-backed model and the "cannot answer"
 * stand-in both implement it, so the chat route does not care which one it is talking to.
 */
export interface Answerer {
  /** The whole answer at once. */
  answer(question: string, history: Turn[]): Promise<AnswerResult>;
  /**
   * Optional: the answer as it is written. Yields pieces of text and returns the finished answer.
   * An answerer without it is streamed by splitting the finished answer into words.
   */
  stream?(question: string, history: Turn[]): AsyncGenerator<string, AnswerResult, void>;
}

/** Splits a finished answer into word-sized pieces, each carrying its own trailing space. */
export function* wordPieces(text: string): Generator<string> {
  const words = text.split(/(?<=\s)/);
  for (const word of words) if (word) yield word;
}

/** Streams any answerer: its own stream when it has one, otherwise the finished answer in pieces. */
export async function* streamAnswer(
  answerer: Answerer,
  question: string,
  history: Turn[],
): AsyncGenerator<string, AnswerResult, void> {
  if (answerer.stream) return yield* answerer.stream(question, history);
  const result = await answerer.answer(question, history);
  for (const piece of wordPieces(result.text)) yield piece;
  return result;
}
