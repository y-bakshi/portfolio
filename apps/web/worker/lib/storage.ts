/**
 * The small key-value store the limiter and budget use. A Durable Object's storage satisfies it as
 * it is, and the tests use a Map, so the same logic runs in both. Inside one Durable Object a
 * read followed by a write cannot be interleaved with another request, so no locks are needed.
 */
export interface KvStorage {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<unknown>;
  list<T>(options: { prefix: string }): Promise<Map<string, T>>;
}

/** An in-memory store for tests. */
export function memoryStorage(): KvStorage {
  const data = new Map<string, unknown>();
  return {
    get: async <T>(key: string) => data.get(key) as T | undefined,
    put: async (key, value) => void data.set(key, structuredClone(value)),
    delete: async (key) => data.delete(key),
    list: async <T>({ prefix }: { prefix: string }) =>
      new Map([...data].filter(([k]) => k.startsWith(prefix)) as [string, T][]),
  };
}
