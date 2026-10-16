import { Container } from './layout/Container';
import { PageFrame } from './layout/PageFrame';
import { BookingCard, ContactLinks } from './sections/contact/ContactActions';
import { ExploreLinks } from './sections/contact/ExploreLinks';

/** How to reach Yash. */
export function ContactPage() {
  return (
    <PageFrame current="contact">
      <Container className="pt-10 pb-6 md:pt-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div>
            <h1 className="display text-[clamp(3.4rem,9vw,7rem)]">Let’s talk.</h1>
            <p className="mt-5 text-2xl">Have a role, project, or technical question in mind?</p>
            <p className="mt-2 mb-8 text-lg text-muted">
              Email me, connect on LinkedIn, or book a conversation.
            </p>
            <ContactLinks />
          </div>
          <BookingCard />
        </div>
        <ExploreLinks />
      </Container>
    </PageFrame>
  );
}

export default ContactPage;
