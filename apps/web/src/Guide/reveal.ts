/** Time between words as an answer is written out. */
export const WORD_DELAY_MS = 28;

/** Splits text into words, each keeping its trailing space, so joining them restores the text. */
export const wordsOf = (text: string) => text.split(/(?<=\s)/).filter(Boolean);

/**
 * Shows an answer word by word, whether the words arrive all at once or as they are written. Pieces
 * wait in a queue and come out at a steady pace, so a fast server still reads like someone typing.
 */
export function createReveal(onShow: (text: string) => void, delay = WORD_DELAY_MS) {
  const queue: string[] = [];
  let shown = '';
  let timer: number | undefined;
  let waiting: (() => void) | undefined;

  const step = () => {
    timer = undefined;
    const next = queue.shift();
    if (next === undefined) {
      waiting?.();
      return;
    }
    shown += next;
    onShow(shown);
    timer = window.setTimeout(step, delay);
  };

  return {
    /** Adds a piece. The first one shows at once; the rest follow at the pace. */
    push(piece: string) {
      if (!piece) return;
      queue.push(piece);
      if (timer === undefined) step();
    },
    /** Resolves when everything pushed so far has been shown. */
    drained(): Promise<void> {
      if (timer === undefined && queue.length === 0) return Promise.resolve();
      return new Promise((resolve) => (waiting = resolve));
    },
    /** Stops for good, for example when the page is left. */
    cancel() {
      window.clearTimeout(timer);
      timer = undefined;
      queue.length = 0;
      waiting?.();
    },
  };
}
