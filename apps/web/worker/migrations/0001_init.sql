-- Chats, messages, feedback and events for the portfolio guide.
-- Nothing here identifies a visitor: a chat is a random id, and there is no IP, email or account.

CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  ua_class TEXT,
  locale TEXT
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  cites_json TEXT NOT NULL DEFAULT '[]',
  model TEXT,
  retrieval_ids_json TEXT,
  top_score REAL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_micro_usd INTEGER,
  latency_ms INTEGER,
  created_at INTEGER NOT NULL,
  UNIQUE (chat_id, seq)
);

CREATE INDEX messages_created_at ON messages (created_at);

CREATE TABLE feedback (
  message_id TEXT PRIMARY KEY REFERENCES messages (id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at INTEGER NOT NULL
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT,
  type TEXT NOT NULL,
  data_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX events_created_at ON events (created_at);
CREATE INDEX events_type_created_at ON events (type, created_at);
