/** Tabs, the time range, loading, and the overview that pulls headline numbers from the others. */
export const MAIN_JS = `
var TABS = ['overview', 'pages', 'ai', 'questions', 'quality', 'cost'];
var days = 30;
var data = { summary: null, traffic: null, evals: null };

function renderOverview() {
  var s = data.summary, t = data.traffic, e = data.evals;
  var pairs = [];
  if (t && t.ok) {
    pairs.push(['Visitors (estimate)', num(t.totals.visitors)]);
    pairs.push(['Page views', num(t.totals.pageViews)]);
  }
  if (s) {
    pairs.push(['Chats', num(s.totals.chats)]);
    pairs.push(['Questions', num(s.totals.questions)]);
    pairs.push(['Cost', usd(s.costMicroUsd)]);
    pairs.push(['Thumbs up', pct(s.thumbs.upRatio)]);
  }
  var notes = [];
  if (t && !t.ok) notes.push(t.reason === 'not_set_up' ? 'Traffic is not set up yet (see Page analytics).' : 'Traffic numbers are unavailable right now.');
  if (e) {
    var live = (e.runs || []).filter(function (r) { return r.kind === 'live'; })[0];
    if (!live) notes.push('No live quality evaluation has been saved yet (see Answer quality).');
    else {
      var f = live.rows.filter(function (x) { return x.metric === 'faithfulness'; })[0];
      if (f) pairs.push(['Faithfulness (live eval)', f.score]);
      if (!live.current) notes.push('The last live evaluation is older than the current notes or prompt.');
      var failing = live.rows.filter(function (x) { return x.pass === false; }).length;
      if (failing) notes.push(failing + ' metric(s) in the last live evaluation are below target.');
    }
  }
  if (s && s.lowConfidence.length) notes.push(s.lowConfidence.length + ' recent question(s) the guide could not answer well (see Questions).');
  stats(byId('ov-stats'), pairs);
  list(byId('ov-notes'), notes, 'Nothing needs attention.', function (li, n) { li.appendChild(el('span', n)); });
}

function failed(id) { note(byId(id), 'These numbers could not be loaded.'); }

function loadSummary() {
  var status = byId('status');
  status.textContent = 'Loading';
  return getJson('/api/admin/summary?days=' + days).then(function (s) {
    data.summary = s;
    status.textContent = 'Last ' + s.range.days + ' days';
    renderUsage(s); renderQuestions(s); renderCost(s); renderOverview();
  }).catch(function () { status.textContent = 'The numbers could not be loaded.'; });
}
function loadTraffic() {
  return getJson('/api/admin/traffic?days=' + days).then(function (t) {
    data.traffic = t; renderTraffic(t); renderOverview();
  }).catch(function () { failed('traffic-note'); });
}
function loadEvals() {
  return getJson('/api/admin/evals').then(function (e) {
    data.evals = e; renderQuality(e); renderOverview();
  }).catch(function () { failed('quality-note'); });
}
function loadAll() { loadSummary(); loadTraffic(); loadEvals(); }

function show(name) {
  if (TABS.indexOf(name) < 0) name = 'overview';
  TABS.forEach(function (t) {
    var tab = byId('tab-' + t), panel = byId('panel-' + t);
    var on = t === name;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    panel.hidden = !on;
  });
  // the guide's own tabs and the traffic tab share the range buttons; quality does not use them
  byId('range').hidden = name === 'quality';
  if (window.location.hash !== '#' + name) window.history.replaceState(null, '', '#' + name);
}

TABS.forEach(function (t) {
  byId('tab-' + t).addEventListener('click', function () { show(t); });
});
var buttons = document.querySelectorAll('#range button');
Array.prototype.forEach.call(buttons, function (b) {
  b.addEventListener('click', function () {
    Array.prototype.forEach.call(buttons, function (o) { o.setAttribute('aria-pressed', String(o === b)); });
    days = Number(b.getAttribute('data-days'));
    loadSummary(); loadTraffic();
  });
});
window.addEventListener('hashchange', function () { show(window.location.hash.slice(1)); });
show(window.location.hash.slice(1));
loadAll();
`;
