/**
 * The small part of a SQL database the Worker uses. Cloudflare's D1 satisfies it as it is, and the
 * tests satisfy it with an in-memory SQLite, so the same queries run in both.
 */
export interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}

export interface Db {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
}
