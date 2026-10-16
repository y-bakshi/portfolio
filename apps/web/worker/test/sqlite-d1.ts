import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { join } from 'node:path';
import type { Db, Statement } from '../lib/db';

/** One prepared query on an in-memory SQLite, shaped like a D1 statement. */
function statement(db: DatabaseSync, sql: string, values: unknown[] = []): Statement {
  const bound = values as SQLInputValue[];
  return {
    bind: (...next: unknown[]) => statement(db, sql, next),
    first: async <T>() => (db.prepare(sql).get(...bound) as T | undefined) ?? null,
    all: async <T>() => ({ results: db.prepare(sql).all(...bound) as T[] }),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...bound).changes) } }),
  };
}

/** What a test needs from the database: the queries, the raw handle, and a way to run a script. */
export type TestDb = Db & { raw: DatabaseSync; exec(sql: string): void };

/** A fresh in-memory SQLite with every migration applied, behaving like D1 (foreign keys on). */
export function testDb(): TestDb {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON');
  const dir = join(import.meta.dirname, '..', 'migrations');
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    raw.exec(readFileSync(join(dir, file), 'utf8'));
  }
  return {
    raw,
    exec: (sql) => raw.exec(sql),
    prepare: (sql) => statement(raw, sql),
    // D1 runs a batch in one transaction; the tests do the same
    batch: async (statements) => {
      raw.exec('BEGIN');
      try {
        const results = [];
        for (const s of statements) results.push(await s.run());
        raw.exec('COMMIT');
        return results;
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
