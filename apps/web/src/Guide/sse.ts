/** Reads server-sent events from a stream that arrives in arbitrary pieces. */

export type SseEvent = { event: string; data: unknown };

/**
 * Reads server-sent events from text that arrives in arbitrary pieces. A piece may end in the
 * middle of an event or even of a word, so unfinished text is kept until the blank line that ends it.
 */
export function createSseParser(onEvent: (event: SseEvent) => void) {
  let buffer = '';
  const emit = (block: string) => {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (data.length === 0) return;
    try {
      onEvent({ event, data: JSON.parse(data.join('\n')) });
    } catch {
      // a broken event is skipped; the stream carries on
    }
  };
  return (chunk: string) => {
    buffer += chunk.replace(/\r\n/g, '\n');
    let end = buffer.indexOf('\n\n');
    while (end !== -1) {
      emit(buffer.slice(0, end));
      buffer = buffer.slice(end + 2);
      end = buffer.indexOf('\n\n');
    }
  };
}
