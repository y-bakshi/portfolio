/**
 * Browser copies of the chat. localStorage keeps a mirror of the last messages, so the page can
 * paint a returning visitor's chat at once. sessionStorage keeps the panel state and the unsent
 * draft for this tab only. Storage can be missing, full or blocked (private mode), so every read
 * and write is wrapped, and bad data is ignored rather than trusted.
 */
export const CHAT_KEY = 'guide.chat.v1';
export const UI_KEY = 'guide.ui.v1';
/** How many messages the mirror keeps. */
export const MAX_MIRRORED = 20;
const MAX_DRAFT = 1000;

export type Rating = 1 | -1;

/** One message as kept in the mirror. Local-only messages have no id and so no thumbs. */
export type SavedMessage = {
  id?: string;
  role: 'user' | 'assistant';
  text: string;
  cites: string[];
  rating?: Rating | null;
};

const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Keeps a parsed value only if it has the shape of a message. */
function asMessage(value: unknown): SavedMessage | null {
  if (typeof value !== 'object' || value === null) return null;
  const m = value as Record<string, unknown>;
  if ((m.role !== 'user' && m.role !== 'assistant') || typeof m.text !== 'string') return null;
  const message: SavedMessage = {
    role: m.role,
    text: m.text,
    cites: isStrings(m.cites) ? m.cites : [],
  };
  if (typeof m.id === 'string') message.id = m.id;
  if (m.rating === 1 || m.rating === -1) message.rating = m.rating;
  return message;
}

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string | null) {
  try {
    if (value === null) storage().removeItem(key);
    else if (storage().getItem(key) !== value) storage().setItem(key, value);
  } catch {
    // private mode or a full disk: the chat still works, it just is not remembered here
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

/** Turns the stored text back into messages. Anything unreadable gives an empty list. */
export function parseMirror(raw: string | null): SavedMessage[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return [];
    const { v, messages } = data as { v?: unknown; messages?: unknown };
    if (v !== 1 || !Array.isArray(messages)) return [];
    return messages.map(asMessage).filter((m): m is SavedMessage => m !== null);
  } catch {
    return [];
  }
}

export const loadMirror = () => parseMirror(read(local, CHAT_KEY));

/** Saves the last messages; an empty chat removes the entry. */
export function saveMirror(messages: SavedMessage[]) {
  const kept = messages.slice(-MAX_MIRRORED);
  write(local, CHAT_KEY, kept.length ? JSON.stringify({ v: 1, messages: kept }) : null);
}

/** What this tab remembers about the panel. */
export type UiState = { open: boolean; draft: string };

export function loadUi(): UiState {
  const fallback: UiState = { open: false, draft: '' };
  try {
    const data: unknown = JSON.parse(read(session, UI_KEY) ?? 'null');
    if (typeof data !== 'object' || data === null) return fallback;
    const { v, open, draft } = data as Record<string, unknown>;
    if (v !== 1) return fallback;
    return {
      open: open === true,
      draft: typeof draft === 'string' ? draft.slice(0, MAX_DRAFT) : '',
    };
  } catch {
    return fallback;
  }
}

export function saveUi(state: UiState) {
  const empty = !state.open && !state.draft;
  write(
    session,
    UI_KEY,
    empty
      ? null
      : JSON.stringify({ v: 1, open: state.open, draft: state.draft.slice(0, MAX_DRAFT) }),
  );
}
