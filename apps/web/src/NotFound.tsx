import { DotGrid } from './DotGrid';
import { SiteHeader } from './parts';

/** The page for an address that does not exist. */
export function NotFound() {
  return (
    <>
      <DotGrid />
      <SiteHeader />
      <main id="main" className="all">
        <div className="section-card">
          <h1 className="section-title">Page not found</h1>
        </div>
        <article className="row more-card">
          <p>
            I couldn’t find that page. The link may be old or have a typo. The home page and my
            projects are a click away.
          </p>
          <ul className="row-links">
            <li>
              <a className="row-link" href="/">
                Go home
              </a>
            </li>
            <li>
              <a className="row-link" href="/projects/">
                See my projects
              </a>
            </li>
          </ul>
        </article>
      </main>
    </>
  );
}

export default NotFound;
