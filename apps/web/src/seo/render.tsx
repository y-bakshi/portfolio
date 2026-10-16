import { renderToString } from 'react-dom/server';
import AllProjects from '../AllProjects';
import Home from '../App';
import CaseStudy from '../CaseStudy';
import ChatPage from '../ChatPage';
import ContactPage from '../ContactPage';
import ExperiencePage from '../ExperiencePage';
import NotFound from '../NotFound';

/** The page components by their built file, so the build can put each one's markup in its HTML. */
export const pageComponents = {
  'index.html': Home,
  'projects/index.html': AllProjects,
  'projects/testpilot/index.html': CaseStudy,
  'experience/index.html': ExperiencePage,
  'contact/index.html': ContactPage,
  'chat/index.html': ChatPage,
  '404.html': NotFound,
} as const;

export type PageFile = keyof typeof pageComponents;

/** The page as static HTML. Rendered with no window, so every component must cope without one. */
export function renderPage(file: PageFile): string {
  const Page = pageComponents[file];
  return renderToString(<Page />);
}
