import { PRIVACY_UPDATED, privacySections, privacyShort } from './content/privacy';
import { Container } from './layout/Container';
import { credits } from './layout/credits';
import { EMAILS } from './layout/nav';
import { PageFrame } from './layout/PageFrame';

/** What the site saves, who handles it, and who made the parts that are not Yash's. */
export function PrivacyPage() {
  return (
    <PageFrame current="privacy">
      <Container className="pt-10 pb-6 md:pt-14">
        <h1 className="display text-[clamp(2.8rem,6vw,4.8rem)]">Privacy and credits</h1>
        <p className="mt-3 max-w-[40rem] text-xl text-ink">{privacyShort}</p>
        <p className="mt-2 text-muted">Last updated {PRIVACY_UPDATED}.</p>
        <div className="mt-10 grid max-w-[44rem] gap-9">
          {privacySections.map((s) => (
            <section key={s.title} aria-labelledby={`p-${s.title}`} className="space-y-3">
              <h2 id={`p-${s.title}`} className="display text-3xl">
                {s.title}
              </h2>
              {s.body.map((p) => (
                <p key={p} className="text-[1.02rem] leading-relaxed">
                  {p}
                </p>
              ))}
              {s.title === 'Questions or deletion' && (
                <p>
                  <a
                    className="font-semibold text-action underline underline-offset-4"
                    href={`mailto:${EMAILS.work}`}
                  >
                    {EMAILS.work}
                  </a>
                </p>
              )}
            </section>
          ))}
          <section aria-labelledby="credits-title" className="space-y-3">
            <h2 id="credits-title" className="display text-3xl">
              Credits
            </h2>
            <ul className="space-y-1.5 text-[1.02rem]">
              {credits.map((c) => (
                <li key={c.name}>
                  {c.text}{' '}
                  <a
                    className="font-semibold text-action underline underline-offset-4"
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {c.name}
                  </a>
                  {'note' in c ? c.note : ''}.
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Container>
    </PageFrame>
  );
}

export default PrivacyPage;
