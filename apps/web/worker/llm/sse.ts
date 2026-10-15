/** Yields the payload of each `data:` line of a server-sent events body, in order. */
export async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? '';
      for (const line of lines) if (line.startsWith('data:')) yield line.slice(5).trim();
    }
    pending += decoder.decode();
    if (pending.startsWith('data:')) yield pending.slice(5).trim();
  } finally {
    reader.releaseLock();
  }
}
