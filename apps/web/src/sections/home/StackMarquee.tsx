import { useState } from 'react';
import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { MorphGlyph } from '@/components/MorphGlyph';
import { TechLogo } from '@/components/TechLogo';
import { heroStack } from '../../content';
import { Container } from '../../layout/Container';

/** A slow strip of the technologies Yash works with. It can be paused, and it stands still under reduced motion. */
export function StackMarquee() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="border-y border-line/70 bg-panel/50">
      <Container className="flex items-center gap-4 py-3">
        <p className="sr-only">Technologies I work with: {heroStack.join(', ')}.</p>
        <div aria-hidden="true" className="marquee-mask relative flex-1 overflow-hidden">
          <ul
            data-paused={paused}
            className="marquee-track flex w-max gap-10 data-[paused=true]:[animation-play-state:paused]"
          >
            {[...heroStack, ...heroStack].map((name, i) => (
              <li key={i} className="flex items-center gap-2.5 text-[0.95rem] font-medium text-ink">
                <TechLogo name={name} className="size-5" />
                {name}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          aria-pressed={paused}
          aria-label={paused ? 'Play the technology strip' : 'Pause the technology strip'}
          onClick={() => setPaused((p) => !p)}
          className="rounded-full border border-ink/40 p-2 text-ink transition hover:border-ink hover:bg-ink/5"
        >
          <MorphGlyph icon={paused ? PlayIcon : PauseIcon} size={16} />
        </button>
      </Container>
    </div>
  );
}
