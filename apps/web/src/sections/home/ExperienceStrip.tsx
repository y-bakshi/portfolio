import { roles } from '../../content';
import { Container } from '../../layout/Container';

const latest = roles[0];

/** One line under the hero: the most recent role and what it covered. */
export function ExperienceStrip() {
  return (
    <Container className="flex flex-col gap-2 py-5 text-[0.95rem] md:flex-row md:items-center md:justify-between">
      <p>
        <span className="font-bold">Recent experience:</span>{' '}
        <a href="/experience/" className="underline-offset-4 hover:text-action hover:underline">
          {latest.title} at {latest.org}
        </a>
      </p>
      {latest.tags && <p className="text-muted">{latest.tags.join(' · ')}</p>}
    </Container>
  );
}
