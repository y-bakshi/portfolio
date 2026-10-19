import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { useGuideContext } from '../../Guide';
import { Container } from '../../layout/Container';
import { MistPortrait } from '../../MistPortrait';
import { HeroLinks } from './HeroLinks';

/** The first screen: who Yash is, how to ask the guide or reach him, and the portrait. */
export function Hero({ isMobile, onFormed }: { isMobile: boolean; onFormed: () => void }) {
  const { openChat } = useGuideContext();
  // a phone draws the portrait about 700 pixels wide, so it gets the smaller file; chosen once, so turning
  // the phone does not restart the animation
  const [portrait] = useState(() =>
    isMobile
      ? { src: '/portrait-760.webp', width: 760, height: 743 }
      : { src: '/portrait.webp', width: 1100, height: 1075 },
  );
  return (
    <Container
      as="section"
      aria-labelledby="hero-title"
      className="grid items-center gap-6 overflow-x-clip pt-8 pb-10 md:grid-cols-[1.15fr_1fr] md:gap-4 md:pt-14"
    >
      <div className="order-2 md:order-1">
        <h1 id="hero-title" className="display text-[clamp(3rem,6.4vw,5.6rem)] text-ink">
          hi yash here.{' '}
          <span aria-hidden="true" className="font-sans">
            👋
          </span>
        </h1>
        <p className="mt-4 text-xl text-ink">
          software engineer, finishing my MS at Arizona State University
        </p>
        <p className="mt-5 max-w-[30rem] text-lg text-muted">
          Backend by trade, full-stack by passion. I build AI applications, backend services and
          cloud delivery.
        </p>
        <p className="mt-8 text-lg font-semibold text-ink">
          For Q&amp;A,{' '}
          <button
            type="button"
            onClick={openChat}
            className="inline-flex items-center gap-1 underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-ring"
          >
            start a chat with the guide
            <HugeiconsIcon aria-hidden icon={ArrowUpRight01Icon} size={18} />
          </button>
        </p>
        <p className="mt-1 text-sm text-muted">
          For anything the guide cannot answer, please{' '}
          <a href="/contact/" className="font-semibold text-ink underline underline-offset-4">
            contact me
          </a>{' '}
          instead.
        </p>
        <HeroLinks />
      </div>
      <figure className="order-1 mx-auto w-full max-w-[34rem] md:order-2 md:max-w-none">
        <MistPortrait
          src={portrait.src}
          width={portrait.width}
          height={portrait.height}
          alt="Illustrated portrait of Yash Bakshi in a beanie and sunglasses, looking down"
          onFormed={onFormed}
        />
      </figure>
    </Container>
  );
}
