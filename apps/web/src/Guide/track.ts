/**
 * Tells the server that a "Show on the page" button was pressed. It never throws and never makes
 * the page wait: a lost event is fine, a broken click is not.
 */
export function trackCiteClick(sourceId: string): void {
  try {
    const body = JSON.stringify({ type: 'cite_clicked', sourceId });
    // a Blob with a JSON type keeps the request simple, and the browser sends it even on unload
    const sent =
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }));
    if (sent) return;
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // analytics must never break the page
  }
}
