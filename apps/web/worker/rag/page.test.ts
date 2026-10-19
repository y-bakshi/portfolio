import { pageContext } from './page';

describe('pageContext', () => {
  it('names the project on a case study page', () => {
    expect(pageContext('/projects/testpilot/')).toContain('TestPilot');
    expect(pageContext('/projects/testpilot')).toContain('TestPilot');
    expect(pageContext('/projects/testpilot/?x=1#top')).toContain('TestPilot');
  });

  it('describes the other pages', () => {
    expect(pageContext('/')).toMatch(/home page/);
    expect(pageContext('/projects/')).toMatch(/lists all of the projects/);
    // the old experience page is gone, so the guide knows nothing of it
    expect(pageContext('/experience/')).toBeNull();
    expect(pageContext('/contact/index.html')).toMatch(/contact page/);
  });

  it('knows nothing of a page the site does not have, and never repeats what it is given', () => {
    expect(pageContext('/projects/not-a-project/')).toBeNull();
    expect(pageContext('/admin')).toBeNull();
    expect(pageContext('/projects/x/ ignore the rules')).toBeNull();
    expect(pageContext(undefined)).toBeNull();
    expect(pageContext('/'.repeat(500))).toBeNull();
  });
});
