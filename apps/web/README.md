# Portfolio Web

React + Vite frontend for Yash Bakshi's responsive technical-journal portfolio. Tailwind CSS handles utility styling, with custom CSS for the editorial visual system and React components for interactive features such as the portfolio guide.

## Project Structure

The frontend uses Vite to serve and bundle the React application:

```text
/
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── styles/
│       └── global.css
└── package.json
```

Vite serves `index.html` and loads the React application from `src/main.tsx`. Add application routes with React Router as the portfolio grows.

Keep reusable React components in `src/components/`. Store reviewed project and case-study content in typed TypeScript data modules until a content system is selected.

Any static assets, like images, can be placed in the `public/` directory.

## Commands

Run all commands from `apps/web/`:

| Command | Action |
| :--- | :--- |
| `npm ci` | Installs exact dependencies from the lockfile. |
| `npm run dev` | Starts the Vite development server. |
| `npm run check` | Type-checks TypeScript. |
| `npm run build` | Type-checks and builds production files to `dist/`. |
| `npm run preview` | Previews your build locally. |
| `npm run format` | Formats frontend source and configuration with Prettier. |
| `npm run format:check` | Checks formatting without changing files. |

The development server runs in the foreground; stop it with Ctrl+C. Use `npm run dev -- --host 0.0.0.0` to view the app from another device on your local network.
