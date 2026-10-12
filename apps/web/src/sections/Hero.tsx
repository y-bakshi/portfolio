import { MistPortrait } from '../MistPortrait';
import type { Guide } from '../Guide';

/** The first screen: the portrait and the conversation with the guide. */
export function Hero({
  isMobile,
  thread,
  feedRef,
}: Pick<Guide, 'isMobile' | 'thread'> & { feedRef: Guide['refs']['feedRef'] }) {
  return (
    <section className="ask" aria-labelledby="ask-title">
      <h1 id="ask-title" className="sr-only">
        Yash Bakshi, software engineer
      </h1>
      <figure className="portrait">
        <MistPortrait
          src="/portrait.webp"
          width={1100}
          height={1075}
          alt="Illustrated portrait of Yash Bakshi in a beanie and sunglasses, looking down"
        />
      </figure>
      <div className="feed" ref={feedRef} aria-label="Conversation with the guide">
        <p className="ask-lede">
          I’m Yash Bakshi, a software engineer working across AI applications, backend services and
          cloud delivery. The guide in the corner is an assistant that answers questions about my
          projects from my own notes.
        </p>
        {!isMobile && thread}
      </div>
    </section>
  );
}
