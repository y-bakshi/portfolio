# Portfolio Web

React + Vite frontend for Yash Bakshi's responsive portfolio, styled with Tailwind v4 and shadcn/ui components. The visual system is in `docs/design/design-language.md`; the palette and fonts are tokens in `src/tailwind.css`. React components handle the interactive parts such as the portfolio guide and the animated figures.

## Project Structure

The frontend uses Vite to serve and bundle the React application. Files are small and each does one job (a test fails any source file over 220 lines):

```text
/
├── public/                 favicon, portrait, social preview, org logos, technology logos (logos/tech)
├── src/
│   ├── App.tsx, AllProjects.tsx, CaseStudy.tsx, ExperiencePage.tsx, ContactPage.tsx, NotFound.tsx
│   │                       one thin file per page; each composes sections inside <PageFrame>
│   ├── *-main.tsx          one entry per page
│   ├── layout/             page frame, header, footer, container, nav and credits
│   ├── sections/           the parts of each page, in a folder per page (home, projects, case, experience, contact)
│   ├── components/         shared pieces (project card and row, stack list, tech logo) and ui/ (shadcn)
│   ├── content/            all page copy and data: projects, history, diagrams/ (the figures)
│   ├── diagrams/           the animated isometric figures: stations/ (the machines), scene/ (layout, timeline), iso/vendor (the Anatomy kit)
│   ├── Guide/              the chat: state (useGuide), panel, launcher, thread, storage, API client, Avatar/ (the animated face)
│   ├── lib/                small helpers (cn, useInView)
│   ├── DotGrid.tsx, MistPortrait.tsx, portrait/   the pointer-reactive background and the portrait that condenses from particles
│   ├── seo/                titles and descriptions, structured data, llms.txt, prerender
│   └── tailwind.css        Tailwind, the palette and fonts as tokens, and a few base rules
├── worker/                 the Cloudflare Worker: the guide's API
├── e2e/                    Playwright tests
└── package.json
```

The site is a few real HTML pages, not a single-page app: `index.html`, `projects/`, `projects/testpilot/`, `experience/`, `contact/` and `404.html`, each loading its entry file. To add a page, add a folder with an `index.html`, an entry file, the page to `build.rollupOptions.input` in `vite.config.ts`, the component to `src/seo/render.tsx` and an entry to `src/seo/pages.ts`. Each page sets its own title and social preview tags. At build time every page is drawn to HTML inside `#root` so a reader without JavaScript sees the content.

Reviewed project and case-study content lives in the typed modules under `src/content/`. Fonts are self-hosted through Fontsource packages imported in `src/entry.ts`. The technology logos in `public/logos/tech` are copied from the `thesvg` package by `npm run logos:copy` (the list is `src/components/tech-logos.json`).

Any static assets, like images, can be placed in the `public/` directory.

## Commands

Run all commands from `apps/web/`:

| Command | Action |
| :--- | :--- |
| `npm ci` | Installs exact dependencies from the lockfile. |
| `npm run dev` | Starts the Vite development server. |
| `npm run check` | Type-checks TypeScript. |
| `npm test` | Runs the unit and component tests once (Vitest). |
| `npm run test:watch` | Re-runs the tests as files change. |
| `npm run e2e` | Runs the browser tests in Chromium (Playwright); first run `npx playwright install chromium`. |
| `npm run build` | Type-checks and builds production files to `dist/`. |
| `npm run preview` | Previews your build locally. |
| `npm run format` | Formats frontend source and configuration with Prettier. |
| `npm run format:check` | Checks formatting without changing files. |

The development server runs in the foreground; stop it with Ctrl+C. Use `npm run dev -- --host 0.0.0.0` to view the app from another device on your local network.
