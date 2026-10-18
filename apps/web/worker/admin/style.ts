/** Plain CSS in the site's palette: ivory ground, panel cards, navy ink, hard offset shadows, square corners. */
export const ADMIN_CSS = `
:root {
  --ground: #e8e0d2;
  --panel: #f4efe5;
  --ink: #0e1d61;
  --muted: #4b547f;
  --line: #bdb09a;
  --mark: #b89a5a;
  --shadow: #040720;
  --text: 'Geist Variable', system-ui, sans-serif;
  --code: 'Geist Mono Variable', Consolas, monospace;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font: 500 16px/1.55 var(--text);
}
.top {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: center;
  justify-content: space-between;
  padding: 20px clamp(16px, 5vw, 48px);
  border-bottom: 2px solid var(--ink);
  background: var(--panel);
}
h1, h2 { margin: 0; line-height: 1.15; }
h1 { font-size: 26px; }
h2 { font-size: 18px; margin-bottom: 12px; }
main {
  display: grid;
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px clamp(16px, 5vw, 48px) 64px;
}
button {
  font: inherit;
  color: var(--ink);
  background: var(--panel);
  border: 2px solid var(--ink);
  border-radius: 0;
  padding: 6px 14px;
  cursor: pointer;
}
button[aria-pressed='true'] { background: var(--ink); color: var(--panel); }
button:focus-visible { outline: 3px solid var(--mark); outline-offset: 2px; }
.panel, .stat {
  background: var(--panel);
  border: 2px solid var(--ink);
  box-shadow: 6px 6px 0 var(--shadow);
  padding: 18px;
}
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 18px; }
.stat b { display: block; font: 700 28px/1.2 var(--code); }
.stat span { color: var(--muted); font-size: 14px; }
.note, #status { color: var(--muted); margin: 0 0 12px; }
.list { margin: 0; padding-left: 24px; display: grid; gap: 8px; }
.list li { overflow-wrap: anywhere; }
.list small { display: block; color: var(--muted); font-family: var(--code); font-size: 13px; }
.count { font-family: var(--code); color: var(--muted); }
svg { display: block; width: 100%; height: auto; }
.bar { fill: var(--ink); }
.axis { stroke: var(--line); stroke-width: 1; }
.label { fill: var(--muted); font: 11px var(--code); }
.value { fill: var(--ink); font: 600 12px var(--code); paint-order: stroke; stroke: var(--panel); stroke-width: 3px; }
[hidden] { display: none !important; }
.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 14px clamp(16px, 5vw, 48px) 0;
  border-bottom: 2px solid var(--ink);
  background: var(--panel);
}
.tabs button { border-bottom: 0; white-space: nowrap; }
.tabs button[aria-selected='true'] { background: var(--ink); color: var(--panel); }
[role='tabpanel'] { display: grid; gap: 24px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { text-align: left; padding: 6px 10px 6px 0; border-bottom: 1px solid var(--line); }
th { color: var(--muted); font-weight: 600; }
td { font-family: var(--code); }
.fail { color: #8a1c1c; font-weight: 700; }
`;
