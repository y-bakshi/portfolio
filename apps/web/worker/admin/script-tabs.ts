/** The renderers for each tab of the owner page. Each takes the JSON its endpoint returns. */
export const TABS_JS = `
// Page analytics: the site's traffic, as Cloudflare counts it
function renderTraffic(t) {
  var intro = byId('traffic-note');
  if (!t.ok) {
    ['traffic-stats', 'chart-visitors', 'chart-views'].forEach(function (id) { clear(byId(id)); });
    ['traffic-countries', 'traffic-browsers', 'traffic-pages', 'traffic-referrers'].forEach(function (id) { clear(byId(id)); });
    note(intro, t.reason === 'not_set_up'
      ? 'Traffic is not set up yet. It needs a read-only Cloudflare token and the zone id in the Worker settings.'
      : 'Cloudflare did not return traffic numbers just now. Try again in a minute.');
    return;
  }
  note(intro, 'Counted by Cloudflare for the whole domain, so bots and file requests are included and visitors is an estimate. Good for trends, not exact audience size.');
  stats(byId('traffic-stats'), [
    ['Visitors (estimate)', num(t.totals.visitors)],
    ['Page views', num(t.totals.pageViews)],
    ['Requests', num(t.totals.requests)]
  ]);
  bars(byId('chart-visitors'), t.daily, 'visitors', num);
  bars(byId('chart-views'), t.daily, 'pageViews', num);
  ranking(byId('traffic-countries'), t.countries, 'No countries yet.');
  ranking(byId('traffic-browsers'), t.browsers, 'No browsers yet.');
  if (t.pages === null) note(byId('traffic-pages'), 'Not available for this range on this plan.');
  else ranking(byId('traffic-pages'), t.pages, 'No page loads in this range.');
  if (t.referrers === null) note(byId('traffic-referrers'), 'Not available for this range on this plan.');
  else ranking(byId('traffic-referrers'), t.referrers, 'No referrers in this range.');
}

// AI usage: how the guide is used and how fast it answers
function renderUsage(s) {
  stats(byId('totals'), [
    ['Chats', num(s.totals.chats)],
    ['Questions', num(s.totals.questions)],
    ['Answers', num(s.totals.answers)],
    ['Cost', usd(s.costMicroUsd)],
    ['Latency p50', ms(s.latencyMs.p50)],
    ['Latency p95', ms(s.latencyMs.p95)],
    ['Thumbs up', pct(s.thumbs.upRatio) + ' (' + s.thumbs.up + ' up, ' + s.thumbs.down + ' down)'],
    ['Fallback rate', pct(s.fallbackRate)],
    ['Rate limited', num(s.rateLimited)]
  ]);
  bars(byId('chart-questions'), s.daily, 'questions', String);
  bars(byId('chart-cost'), s.daily, 'costMicroUsd', usd);
}

// Questions: what people ask, and what the notes miss
function renderQuestions(s) {
  list(byId('top'), s.topQuestions, 'No questions yet.', function (li, q) {
    li.appendChild(el('span', q.text));
    li.appendChild(el('span', '  x' + q.count, 'count'));
  });
  list(byId('weak'), s.lowConfidence, 'Nothing weak yet.', function (li, q) {
    li.appendChild(el('span', q.text));
    var how = q.refused ? 'refused' : 'score ' + (q.score === null ? 'none' : q.score.toFixed(2));
    li.appendChild(el('small', how + ' on ' + q.at.slice(0, 10)));
  });
  ranking(byId('sources'), s.breakdowns && s.breakdowns.sources, 'No source buttons pressed yet.');
}

// Cost and safety: spend, limits and failures
function renderCost(s) {
  var answers = s.totals.answers;
  stats(byId('cost-stats'), [
    ['Spend', usd(s.costMicroUsd)],
    ['Per answer', answers ? usd(s.costMicroUsd / answers) : 'none yet'],
    ['Rate limited', num(s.rateLimited)],
    ['Fallback rate', pct(s.fallbackRate)]
  ]);
  var b = s.breakdowns || {};
  ranking(byId('limits'), b.rateLimits, 'No limits were hit.');
  ranking(byId('fallbacks'), b.fallbacks, 'No fallbacks.');
  ranking(byId('errors'), b.errors, 'No errors.');
}

// Answer quality: the saved evaluations of the guide against the labelled questions
function renderQuality(data) {
  var runs = data.runs || [];
  var host = byId('quality-table');
  var head = byId('quality-note');
  var trend = byId('quality-trend');
  if (!runs.length) {
    clear(host); clear(trend);
    note(head, 'No evaluation has been saved yet. Run npm run eval:record in apps/web, then apply the SQL it writes.');
    return;
  }
  var live = runs.filter(function (r) { return r.kind === 'live'; });
  var latest = live[0] || runs[0];
  var stale = latest.current ? '' : ' It was made before the latest notes or prompt, so it may not describe the live guide.';
  note(head, latest.kind.toUpperCase() + ' run of ' + latest.questions + ' labelled questions on ' + latest.at.slice(0, 10) +
    ' with ' + latest.model + '.' + stale + (latest.kind === 'mock' ? ' A mock run checks the plumbing, not answer quality.' : ''));
  table(host, ['Metric', 'Score', 'Target', ''], latest.rows.map(function (r) {
    var verdict = r.pass === null ? '' : (r.pass ? 'pass' : 'FAIL');
    return [r.metric, r.score, r.threshold, el('td', verdict, r.pass === false ? 'fail' : '')];
  }));
  var keys = ['contextRecall', 'faithfulness', 'answerCorrectness', 'citationAccuracy', 'gapHandling'];
  table(trend, ['Run'].concat(keys), runs.slice(0, 10).map(function (r) {
    var cells = [r.at.slice(0, 10) + ' ' + r.kind];
    keys.forEach(function (k) {
      var row = r.rows.filter(function (x) { return x.metric === k; })[0];
      cells.push(row ? row.score : '-');
    });
    return cells;
  }));
  var fails = byId('quality-fails');
  list(fails, latest.failures, 'No failures listed.', function (li, f) { li.appendChild(el('span', f)); });
}
`;
