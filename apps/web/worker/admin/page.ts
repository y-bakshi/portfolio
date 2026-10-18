const TABS: [string, string][] = [
  ['overview', 'Overview'],
  ['pages', 'Page analytics'],
  ['ai', 'AI usage'],
  ['questions', 'Questions'],
  ['quality', 'Answer quality'],
  ['cost', 'Cost and safety'],
];

const tabButtons = TABS.map(
  ([id, label], i) =>
    `<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${i === 0}"${i === 0 ? '' : ' tabindex="-1"'}>${label}</button>`,
).join('\n        ');

/** One titled card with a place to draw into. */
const panel = (title: string, body: string) =>
  `<section class="panel"><h2>${title}</h2>${body}</section>`;

const tab = (id: string, content: string) =>
  `<div role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}"${id === 'overview' ? '' : ' hidden'}>${content}</div>`;

/** The owner page. Static: the numbers are fetched by app.js, and every visitor string is shown as text. */
export const ADMIN_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Site and guide</title>
    <link rel="stylesheet" href="/admin/style.css" />
  </head>
  <body>
    <header class="top">
      <h1>Site and guide</h1>
      <nav aria-label="Time range" id="range">
        <button type="button" data-days="7">7 days</button>
        <button type="button" data-days="30" aria-pressed="true">30 days</button>
        <button type="button" data-days="90">90 days</button>
      </nav>
    </header>
    <nav class="tabs" role="tablist" aria-label="Sections">
        ${tabButtons}
    </nav>
    <main>
      <p id="status" role="status">Loading</p>
      ${tab(
        'overview',
        `<section class="stats" id="ov-stats" aria-label="Headlines"></section>
      ${panel('Needs attention', '<ul id="ov-notes" class="list"></ul>')}`,
      )}
      ${tab(
        'pages',
        `<div id="traffic-note"></div>
      <section class="stats" id="traffic-stats" aria-label="Traffic"></section>
      ${panel('Visitors per day', '<div id="chart-visitors"></div>')}
      ${panel('Page views per day', '<div id="chart-views"></div>')}
      ${panel('Top pages', '<ol id="traffic-pages" class="list"></ol>')}
      ${panel('Where visitors come from', '<ol id="traffic-referrers" class="list"></ol>')}
      ${panel('Countries', '<ol id="traffic-countries" class="list"></ol>')}
      ${panel('Browsers', '<ol id="traffic-browsers" class="list"></ol>')}`,
      )}
      ${tab(
        'ai',
        `<section class="stats" id="totals" aria-label="Totals"></section>
      ${panel('Questions per day', '<div id="chart-questions"></div>')}
      ${panel('Cost per day', '<div id="chart-cost"></div>')}`,
      )}
      ${tab(
        'questions',
        `${panel('Top questions', '<ol id="top" class="list"></ol>')}
      ${panel(
        'Low confidence: what to write next',
        `<p class="note">Questions the guide answered with a weak match or refused. Newest first.</p>
        <ol id="weak" class="list"></ol>`,
      )}
      ${panel('Source buttons pressed', '<ol id="sources" class="list"></ol>')}`,
      )}
      ${tab(
        'quality',
        `<div id="quality-note"></div>
      ${panel('Latest evaluation', '<div id="quality-table"></div>')}
      ${panel('Recent runs', '<div id="quality-trend"></div>')}
      ${panel('Failures to read', '<ol id="quality-fails" class="list"></ol>')}`,
      )}
      ${tab(
        'cost',
        `<section class="stats" id="cost-stats" aria-label="Spend"></section>
      ${panel('Limits that were hit', '<ol id="limits" class="list"></ol>')}
      ${panel('Why answers fell back', '<ol id="fallbacks" class="list"></ol>')}
      ${panel('Errors', '<ol id="errors" class="list"></ol>')}`,
      )}
    </main>
    <script src="/admin/app.js" defer></script>
  </body>
</html>
`;
