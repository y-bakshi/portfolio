# Portfolio Web

React + Vite frontend for Yash Bakshi's responsive portfolio. The visual system in `docs/design/design-language.md` is hand-written CSS in `src/styles/` (one file per area, imported in order by `index.css`); the browser reset is `reset.css`, copied from Tailwind's preflight (Tailwind itself is not a dependency). React components handle the interactive parts such as the portfolio guide.

## Project Structure

The frontend uses Vite to serve and bundle the React application:

```text
/
├── public/                 favicon, portrait and social preview
├── src/
│   ├── main.tsx            entry, routes, fonts
│   ├── App.tsx             home page
│   ├── CaseStudy.tsx       TestPilot case study
│   ├── Guide.tsx           the guide's state (useGuide) and chat bar (GuideDock)
│   ├── content.ts          projects, roles, education, skills and the guide's answers
│   ├── parts.tsx           header and pipeline trace
│   ├── DotGrid.tsx         the pointer-reactive dot background
│   ├── MistPortrait.tsx    the portrait that condenses from particles
│   ├── pointerPush.ts      the push radius both effects share
│   └── styles/             tokens, base, header, hero, conversation, dock, projects, history,
│                           tools, trace, contact, case, cards and others; index.css imports them in order
└── package.json
```

The site is a few real HTML pages, not a single-page app. `index.html` loads `src/main.tsx` for the home page, and each case study is its own page, for example `projects/testpilot/index.html` loading `src/case-main.tsx`. To add a case study, add a page folder under `projects/`, an entry file, and the page to `build.rollupOptions.input` in `vite.config.ts`. Each page sets its own title and social preview tags.

Reviewed project and case-study content lives in the typed module `src/content.ts` until a content system is selected. Fonts are self-hosted through Fontsource packages imported in `src/main.tsx`.

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
