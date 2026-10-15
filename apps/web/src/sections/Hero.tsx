import { useState } from 'react';
import { MistPortrait } from '../MistPortrait';
import { Lede } from './Lede';
import type { Guide } from '../Guide';

/** The first screen: the portrait and the conversation with the guide. */
export function Hero({
  isMobile,
  thread,
  feedRef,
  formed,
  onFormed,
}: Pick<Guide, 'isMobile' | 'thread'> & {
  feedRef: Guide['refs']['feedRef'];
  /** True once the portrait has formed. The introduction types, and a saved chat comes back, after it. */
  formed: boolean;
  onFormed: () => void;
}) {
  // a phone draws the portrait about 700 pixels wide, so it gets the smaller file; chosen once, so turning
  // the phone does not restart the animation
  const [portrait] = useState(() =>
    isMobile
      ? { src: '/portrait-760.webp', width: 760, height: 743 }
      : { src: '/portrait.webp', width: 1100, height: 1075 },
  );
  return (
    <section className="ask" aria-labelledby="ask-title">
      <h1 id="ask-title" className="sr-only">
        Yash Bakshi, software engineer
      </h1>
      <figure className="portrait">
        <MistPortrait
          src={portrait.src}
          width={portrait.width}
          height={portrait.height}
          alt="Illustrated portrait of Yash Bakshi in a beanie and sunglasses, looking down"
          onFormed={onFormed}
        />
      </figure>
      <div className="feed" ref={feedRef} aria-label="Conversation with the guide">
        <Lede
          start={formed}
          text="I’m Yash Bakshi, a software engineer working across AI applications, backend services and cloud delivery. The guide in the corner is an assistant that answers questions about my projects from my own notes."
        />
        {!isMobile && formed && thread}
      </div>
    </section>
  );
}
