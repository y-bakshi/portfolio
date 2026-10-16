import { Button } from '@/components/ui/button';
import { Container } from './layout/Container';
import { PageFrame } from './layout/PageFrame';

/** The page for an address that does not exist. */
export function NotFound() {
  return (
    <PageFrame current="home">
      <Container className="pt-14 pb-10 md:pt-20">
        <h1 className="display text-[clamp(3rem,8vw,6rem)]">Page not found</h1>
        <p className="mt-5 max-w-[34rem] text-xl text-muted">
          I couldn’t find that page. The link may be old or have a typo. The home page and my
          projects are a click away.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href="/">Go home</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/projects/">See my projects</a>
          </Button>
        </div>
      </Container>
    </PageFrame>
  );
}

export default NotFound;
