/**
 * Cloudflare Turnstile in the browser: a check that is invisible for almost everyone and gives the
 * server a one-use token showing that a person is asking. The site key is public, set at build
 * time as VITE_TURNSTILE_SITE_KEY. Without a key there is no check and no token.
 */
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TIMEOUT_MS = 10000;

type Widget = {
  render(host: HTMLElement, options: Record<string, unknown>): string;
  execute(id: string): void;
  remove(id: string): void;
};

declare global {
  interface Window {
    turnstile?: Widget;
  }
}

let loading: Promise<Widget | null> | null = null;

/** Loads Cloudflare's script once. Resolves to null if it cannot load, so the guide carries on. */
function loadWidget(): Promise<Widget | null> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.turnstile ?? null);
    script.onerror = () => {
      loading = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * A token for one session request, or null when there is no key, the script is blocked, the check
 * fails or it takes too long. The check only shows itself if it needs the visitor to do something.
 */
export async function getTurnstileToken(
  key: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY,
): Promise<string | null> {
  if (!key) return null;
  const widget = await loadWidget();
  if (!widget) return null;
  return new Promise((resolve) => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;right:16px;bottom:96px;z-index:50';
    document.body.appendChild(host);
    let id: string | undefined;
    const finish = (token: string | null) => {
      clearTimeout(timer);
      if (id !== undefined) widget.remove(id);
      host.remove();
      resolve(token);
    };
    const timer = setTimeout(() => finish(null), TIMEOUT_MS);
    try {
      id = widget.render(host, {
        sitekey: key,
        execution: 'execute',
        appearance: 'interaction-only',
        callback: (token: string) => finish(token),
        'error-callback': () => finish(null),
        'timeout-callback': () => finish(null),
      });
      widget.execute(id);
    } catch {
      finish(null);
    }
  });
}
