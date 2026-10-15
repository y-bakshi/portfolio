/**
 * The owner page's script, kept as a string so the Worker can serve it. Visitor text is untrusted,
 * so everything is built with createElement and textContent: there is no innerHTML anywhere.
 * (No backticks or dollar-brace inside, so the string needs no escaping.)
 */
export const ADMIN_JS = `(function () {
'use strict';
var SVG = 'http://www.w3.org/2000/svg';

function el(tag, text, cls) {
  var node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function pct(v) { return v === null ? 'none yet' : Math.round(v * 100) + '%'; }
function ms(v) { return v === null ? 'none yet' : Math.round(v) + ' ms'; }
function usd(micro) { return '$' + (micro / 1e6).toFixed(micro < 1e5 ? 4 : 2); }

function stat(label, value) {
  var box = el('div', undefined, 'stat');
  box.appendChild(el('b', value));
  box.appendChild(el('span', label));
  return box;
}

function bars(host, rows, key, format) {
  clear(host);
  var w = 600, h = 140, pad = 18;
  var max = Math.max.apply(null, rows.map(function (r) { return r[key]; }).concat([1]));
  var svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + (h + pad));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', rows.length + ' days, highest ' + format(max));
  var step = w / rows.length;
  rows.forEach(function (r, i) {
    var bh = (r[key] / max) * h;
    var rect = document.createElementNS(SVG, 'rect');
    rect.setAttribute('class', 'bar');
    rect.setAttribute('x', String(i * step + step * 0.12));
    rect.setAttribute('width', String(step * 0.76));
    rect.setAttribute('y', String(h - bh));
    rect.setAttribute('height', String(bh));
    var title = document.createElementNS(SVG, 'title');
    title.textContent = r.day + ': ' + format(r[key]);
    rect.appendChild(title);
    svg.appendChild(rect);
  });
  var axis = document.createElementNS(SVG, 'line');
  axis.setAttribute('class', 'axis');
  axis.setAttribute('x1', '0'); axis.setAttribute('x2', String(w));
  axis.setAttribute('y1', String(h)); axis.setAttribute('y2', String(h));
  svg.appendChild(axis);
  [0, rows.length - 1].forEach(function (i) {
    var t = document.createElementNS(SVG, 'text');
    t.setAttribute('class', 'label');
    t.setAttribute('y', String(h + 13));
    t.setAttribute('x', i === 0 ? '0' : String(w));
    t.setAttribute('text-anchor', i === 0 ? 'start' : 'end');
    t.textContent = rows[i].day;
    svg.appendChild(t);
  });
  host.appendChild(svg);
}

function list(host, items, empty, line) {
  clear(host);
  if (!items.length) { host.appendChild(el('li', empty)); return; }
  items.forEach(function (item) {
    var li = el('li');
    line(li, item);
    host.appendChild(li);
  });
}

function render(s) {
  var totals = document.getElementById('totals');
  clear(totals);
  [
    ['Chats', String(s.totals.chats)],
    ['Questions', String(s.totals.questions)],
    ['Answers', String(s.totals.answers)],
    ['Cost', usd(s.costMicroUsd)],
    ['Latency p50', ms(s.latencyMs.p50)],
    ['Latency p95', ms(s.latencyMs.p95)],
    ['Thumbs up', pct(s.thumbs.upRatio) + ' (' + s.thumbs.up + ' up, ' + s.thumbs.down + ' down)'],
    ['Fallback rate', pct(s.fallbackRate)],
    ['Rate limited', String(s.rateLimited)]
  ].forEach(function (p) { totals.appendChild(stat(p[0], p[1])); });

  bars(document.getElementById('chart-questions'), s.daily, 'questions', String);
  bars(document.getElementById('chart-cost'), s.daily, 'costMicroUsd', usd);

  list(document.getElementById('top'), s.topQuestions, 'No questions yet.', function (li, q) {
    li.appendChild(el('span', q.text));
    li.appendChild(el('span', '  x' + q.count, 'count'));
  });
  list(document.getElementById('weak'), s.lowConfidence, 'Nothing weak yet.', function (li, q) {
    li.appendChild(el('span', q.text));
    var how = q.refused ? 'refused' : 'score ' + (q.score === null ? 'none' : q.score.toFixed(2));
    li.appendChild(el('small', how + ' on ' + q.at.slice(0, 10)));
  });
}

var status = document.getElementById('status');
function load(days) {
  status.textContent = 'Loading';
  fetch('/api/admin/summary?days=' + days, { credentials: 'same-origin' })
    .then(function (r) {
      if (!r.ok) throw new Error('status ' + r.status);
      return r.json();
    })
    .then(function (s) { status.textContent = 'Last ' + s.range.days + ' days'; render(s); })
    .catch(function () { status.textContent = 'The numbers could not be loaded.'; });
}

var buttons = document.querySelectorAll('#range button');
Array.prototype.forEach.call(buttons, function (b) {
  b.addEventListener('click', function () {
    Array.prototype.forEach.call(buttons, function (o) { o.setAttribute('aria-pressed', String(o === b)); });
    load(b.getAttribute('data-days'));
  });
});
load(30);
})();
`;
