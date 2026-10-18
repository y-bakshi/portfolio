/** The kinds of notes the guide answers from. */
export type ChunkKind = 'project' | 'case-study' | 'role' | 'education' | 'small-project' | 'fact';

/** One small note. `id` is stable, so a citation can be checked and an index can be updated. */
export type Chunk = {
  /** For example `project:testpilot#detail`. */
  id: string;
  /** The card on the page this note comes from, so a citation can open it. Not always a card. */
  sourceId: string;
  kind: ChunkKind;
  title: string;
  text: string;
  /** Changes whenever the text or title does, so the indexer knows what to embed again. */
  contentHash: string;
};

export type ChunkWithVector = Chunk & { vector: number[] };

export type Hit = { id: string; score: number };

/** Where the vectors live: memory in tests, D1 for local use and as a small fallback, Vectorize in production. */
export interface VectorIndex {
  upsert(records: ChunkWithVector[]): Promise<void>;
  /** The k closest notes, best first. Score is cosine similarity. */
  query(vector: number[], k: number): Promise<Hit[]>;
  /** Forget notes that are no longer in the corpus. */
  remove(ids: string[]): Promise<void>;
}
