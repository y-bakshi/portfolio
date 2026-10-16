// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { cleanData, MAX_DATA_BYTES, recordEvent, type EventType } from './events';
import { testDb } from '../test/sqlite-d1';

const NOW = Date.UTC(2026, 9, 14, 12);
const clock = () => NOW;
const rows = (db: ReturnType<typeof testDb>) =>
  db.raw.prepare('SELECT * FROM events').all() as {
    chat_id: string | null;
    type: string;
    data_json: string | null;
    created_at: number;
  }[];

describe('recordEvent', () => {
  it('writes a known event with its time and the chat id', async () => {
    const db = testDb();
    const ok = await recordEvent(db, clock, {
      type: 'answer_shown',
      chatId: 'c1',
      data: { latencyMs: 820, costMicroUsd: 950, model: 'gemini-2.5-flash-lite', topScore: 0.71 },
    });
    expect(ok).toBe(true);
    const [row] = rows(db);
    expect(row).toMatchObject({ chat_id: 'c1', type: 'answer_shown', created_at: NOW });
    expect(JSON.parse(row.data_json!)).toEqual({
      latencyMs: 820,
      costMicroUsd: 950,
      model: 'gemini-2.5-flash-lite',
      topScore: 0.71,
    });
  });

  it('stores null data and a null chat id when there are none', async () => {
    const db = testDb();
    await recordEvent(db, clock, { type: 'chat_started' });
    expect(rows(db)[0]).toMatchObject({ chat_id: null, data_json: null });
  });

  it('drops unknown keys and keys that belong to another type', () => {
    expect(cleanData('cite_clicked', { sourceId: 'testpilot', latencyMs: 5, extra: 'x' })).toEqual({
      sourceId: 'testpilot',
    });
  });

  it('drops free text: only short codes, numbers and thumbs get through', () => {
    expect(cleanData('error', { code: 'What is your salary? Call me on 555 0100' })).toEqual({});
    expect(cleanData('cite_clicked', { sourceId: '<script>alert(1)</script>' })).toEqual({});
    expect(cleanData('answer_shown', { latencyMs: '12', costMicroUsd: NaN })).toEqual({});
    expect(cleanData('feedback', { value: 5 })).toEqual({});
    expect(cleanData('feedback', { value: -1 })).toEqual({ value: -1 });
  });

  it('ignores inherited keys such as __proto__', () => {
    const data = JSON.parse('{"__proto__":{"code":"x"},"constructor":"y"}');
    expect(cleanData('error', data)).toEqual({});
  });

  it('refuses a type that is not in the list', async () => {
    const db = testDb();
    expect(await recordEvent(db, clock, { type: 'page_view' as EventType })).toBe(false);
    expect(rows(db)).toHaveLength(0);
  });

  it('keeps the data under the size cap', () => {
    const json = JSON.stringify(
      cleanData('answer_shown', {
        latencyMs: 1,
        inputTokens: 1,
        outputTokens: 1,
        costMicroUsd: 1,
        topScore: 1,
        model: 'm'.repeat(64),
      }),
    );
    expect(json.length).toBeLessThan(MAX_DATA_BYTES);
  });

  it('swallows a database failure, logs a short message and returns false', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = {
      prepare: () => {
        throw new Error('disk gone');
      },
      batch: async () => [],
    };
    expect(await recordEvent(broken, clock, { type: 'chat_started' })).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
