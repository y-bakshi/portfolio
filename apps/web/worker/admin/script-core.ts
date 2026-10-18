/**
 * Helpers shared by the owner page's tabs, as source text for the page script. Visitor text is
 * untrusted, so everything is built with createElement and textContent: there is no innerHTML.
 * (No backticks or dollar-brace in these strings, so they need no escaping.)
 */
export const CORE_JS = `
var SVG = 'http://www.w3.org/2000/svg';

function el(tag, text, cls) {
  var node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function byId(id) { return document.getElementById(id); }
function pct(v) { return v === null || v === undefined ? 'none yet' : Math.round(v * 100) + '%'; }
function ms(v) { return v === null || v === undefined ? 'none yet' : Math.round(v) + ' ms'; }
function usd(micro) { return '$' + (micro / 1e6).toFixed(micro < 1e5 ? 4 : 2); }
function num(n) { return String(Math.round(n)).replace(/(\\d)(?=(\\d{3})+$)/g, '$1,'); }

function stat(label, value) {
  var box = el('div', undefined, 'stat');
  box.appendChild(el('b', value));
  box.appendChild(el('span', label));
  return box;
}
function stats(host, pairs) {
  clear(host);
  pairs.forEach(function (p) { host.appendChild(stat(p[0], p[1])); });
}

function bars(host, rows, key, format) {
  clear(host);
  var w = 600, h = 140, pad = 18, top = 30;
  var max = Math.max.apply(null, rows.map(function (r) { return r[key]; }).concat([1]));
  var svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + (h + pad));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', rows.length + ' days, highest ' + format(max));
  var step = w / rows.length;
  var numbers = [];
  rows.forEach(function (r, i) {
    var bh = (r[key] / max) * (h - top);
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
    if (r[key] > 0) {
      var n = document.createElementNS(SVG, 'text');
      n.setAttribute('class', 'value');
      var text = format(r[key]);
      var wide = text.length * 7.2 > step;
      var right = i * step + step * 0.88;
      n.setAttribute('x', String(wide ? right : i * step + step / 2));
      n.setAttribute('y', String(h - bh - 4 - (wide && i % 2 ? 13 : 0)));
      n.setAttribute('text-anchor', wide ? 'end' : 'middle');
      n.textContent = text;
      numbers.push(n);
    }
  });
  numbers.forEach(function (n) { svg.appendChild(n); });
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

// a name and a count per line, for the short rankings (countries, pages, source buttons)
function ranking(host, items, empty) {
  list(host, items || [], empty, function (li, r) {
    li.appendChild(el('span', r.name !== undefined ? r.name : r.key));
    li.appendChild(el('span', '  ' + num(r.count), 'count'));
  });
}

function table(host, head, rows) {
  clear(host);
  var t = el('table');
  var tr = el('tr');
  head.forEach(function (h) { tr.appendChild(el('th', h)); });
  var thead = el('thead');
  thead.appendChild(tr);
  t.appendChild(thead);
  var body = el('tbody');
  rows.forEach(function (r) {
    var row = el('tr');
    r.forEach(function (cell) {
      row.appendChild(typeof cell === 'string' ? el('td', cell) : cell);
    });
    body.appendChild(row);
  });
  t.appendChild(body);
  host.appendChild(t);
}

function note(host, text) { clear(host); host.appendChild(el('p', text, 'note')); }

function getJson(url) {
  return fetch(url, { credentials: 'same-origin' }).then(function (r) {
    if (!r.ok) throw new Error('status ' + r.status);
    return r.json();
  });
}
`;
