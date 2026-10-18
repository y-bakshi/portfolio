-- The notes the guide answers from. They are public site content, so nothing here is personal.
-- embedding_json is used by the local and D1 index; with Vectorize in production it stays empty.

CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding_json TEXT,
  updated_at INTEGER NOT NULL
);

CREATE INDEX chunks_source_id ON chunks (source_id);
