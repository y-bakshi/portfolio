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
          <p>There is nothing at this address. It may have moved, or the link may have a typo.</p>
          <ul className="row-links">
            <li>
              <a className="row-link" href="/">
                Home
              </a>
            </li>
            <li>
              <a className="row-link" href="/projects/">
                All projects
              </a>
            </li>
          </ul>
        </article>
      </main>
    </>
  );
}

export default NotFound;
