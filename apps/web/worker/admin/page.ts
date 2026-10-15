/** The owner page. Static: the numbers are fetched by app.js, and every visitor string is shown as text. */
export const ADMIN_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Guide usage</title>
    <link rel="stylesheet" href="/admin/style.css" />
  </head>
  <body>
    <header class="top">
      <h1>Guide usage</h1>
      <nav aria-label="Time range" id="range">
        <button type="button" data-days="7">7 days</button>
        <button type="button" data-days="30" aria-pressed="true">30 days</button>
        <button type="button" data-days="90">90 days</button>
      </nav>
    </header>
    <main>
      <p id="status" role="status">Loading</p>
      <section class="stats" id="totals" aria-label="Totals"></section>
      <section class="panel">
        <h2>Questions per day</h2>
        <div id="chart-questions"></div>
      </section>
      <section class="panel">
        <h2>Cost per day</h2>
        <div id="chart-cost"></div>
      </section>
      <section class="panel">
        <h2>Top questions</h2>
        <ol id="top" class="list"></ol>
      </section>
      <section class="panel">
        <h2>Low confidence: what to write next</h2>
        <p class="note">
          Questions the guide answered with a weak match or refused. Newest first.
        </p>
        <ol id="weak" class="list"></ol>
      </section>
    </main>
    <script src="/admin/app.js" defer></script>
  </body>
</html>
`;
