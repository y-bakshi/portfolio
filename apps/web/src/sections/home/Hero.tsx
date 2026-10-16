import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon, BubbleChatIcon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { useGuideContext } from '../../Guide';
import { Container } from '../../layout/Container';
import { MistPortrait } from '../../MistPortrait';

/** The first screen: who Yash is, two ways in, and the portrait. */
export function Hero({ isMobile, onFormed }: { isMobile: boolean; onFormed: () => void }) {
  const { setOpen } = useGuideContext();
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
      className="grid items-center gap-6 pt-8 pb-10 md:grid-cols-[1.15fr_1fr] md:gap-4 md:pt-14"
    >
      <div className="order-2 md:order-1">
        <h1 id="hero-title" className="display text-[clamp(2.5rem,5.2vw,4.7rem)] text-ink">
          Hi, I’m Yash. I build AI applications, backend services and cloud delivery.
        </h1>
        <p className="mt-6 max-w-[34rem] text-lg text-muted">
          The guide in the corner answers questions about my projects from my own notes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href="/projects/">
              View projects
              <HugeiconsIcon icon={ArrowRight02Icon} size={20} />
            </a>
          </Button>
          <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
            <HugeiconsIcon icon={BubbleChatIcon} size={20} />
            Chat with the guide
          </Button>
        </div>
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
