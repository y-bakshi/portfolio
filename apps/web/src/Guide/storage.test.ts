import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CHAT_KEY,
  loadMirror,
  loadUi,
  MAX_MIRRORED,
  parseMirror,
  saveMirror,
  saveUi,
  UI_KEY,
  type SavedMessage,
} from './storage';

const msg = (i: number): SavedMessage => ({
  id: `m${i}`,
  role: i % 2 ? 'user' : 'assistant',
  text: `t${i}`,
  cites: [],
});

afterEach(() => vi.restoreAllMocks());

describe('the chat mirror', () => {
  it('saves and loads messages', () => {
    const messages = [msg(1), { ...msg(2), cites: ['testpilot'], rating: 1 as const }];
    saveMirror(messages);
    expect(loadMirror()).toEqual(messages);
    expect(JSON.parse(localStorage.getItem(CHAT_KEY)!).v).toBe(1);
  });

  it('keeps only the last 20 messages', () => {
    saveMirror(Array.from({ length: 30 }, (_, i) => msg(i)));
    const kept = loadMirror();
    expect(kept).toHaveLength(MAX_MIRRORED);
    expect(kept[0].id).toBe('m10');
    expect(kept.at(-1)!.id).toBe('m29');
  });

  it('removes the entry when the chat is empty', () => {
    saveMirror([msg(1)]);
    saveMirror([]);
    expect(localStorage.getItem(CHAT_KEY)).toBeNull();
  });

  it.each([
    ['nothing', null],
    ['text that is not JSON', '{oops'],
    ['a number', '5'],
    ['the wrong version', JSON.stringify({ v: 2, messages: [{ role: 'user', text: 'a' }] })],
    ['messages that are not a list', JSON.stringify({ v: 1, messages: 'x' })],
  ])('gives an empty chat for %s', (_name, raw) => {
    expect(parseMirror(raw)).toEqual([]);
  });

  it('drops malformed messages and repairs odd fields', () => {
    const raw = JSON.stringify({
      v: 1,
      messages: [
        null,
        { role: 'system', text: 'x' },
        { role: 'user', text: 5 },
        { role: 'assistant', text: 'ok', cites: [1, 2], id: 7, rating: 3 },
        { role: 'user', text: 'fine', cites: ['a'], id: 'u', rating: -1 },
      ],
    });
    expect(parseMirror(raw)).toEqual([
      { role: 'assistant', text: 'ok', cites: [] },
      { role: 'user', text: 'fine', cites: ['a'], id: 'u', rating: -1 },
    ]);
  });

  it('survives storage that throws, as in private mode', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => saveMirror([msg(1)])).not.toThrow();
    expect(() => saveMirror([])).not.toThrow();
    expect(loadMirror()).toEqual([]);
    expect(() => saveUi({ open: true, draft: 'x' })).not.toThrow();
    expect(loadUi()).toEqual({ open: false, draft: '' });
  });
});

describe('the panel state', () => {
  it('saves and loads whether the panel is open and the unsent draft', () => {
    saveUi({ open: true, draft: 'half a question' });
    expect(loadUi()).toEqual({ open: true, draft: 'half a question' });
    expect(sessionStorage.getItem(UI_KEY)).not.toBeNull();
    expect(localStorage.getItem(UI_KEY)).toBeNull();
  });

  it('removes the entry when there is nothing to remember', () => {
    saveUi({ open: true, draft: 'x' });
    saveUi({ open: false, draft: '' });
    expect(sessionStorage.getItem(UI_KEY)).toBeNull();
  });

  it.each([
    ['corrupt text', '{nope'],
    ['the wrong version', JSON.stringify({ v: 9, open: true, draft: 'x' })],
    ['null', 'null'],
  ])('starts closed and empty for %s', (_name, raw) => {
    sessionStorage.setItem(UI_KEY, raw);
    expect(loadUi()).toEqual({ open: false, draft: '' });
  });

  it('ignores fields of the wrong type and caps a long draft', () => {
    sessionStorage.setItem(UI_KEY, JSON.stringify({ v: 1, open: 'yes', draft: 'x'.repeat(5000) }));
    const ui = loadUi();
    expect(ui.open).toBe(false);
    expect(ui.draft).toHaveLength(1000);
  });
});
