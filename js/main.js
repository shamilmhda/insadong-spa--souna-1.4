/* Insadong Spa & Sauna — shared behaviour (vanilla JS) */
(function () {
  'use strict';
  // Indicative rates only — edit here. 1 KRW = x
  var RATES = { KRW: 1, USD: 0.00072, JPY: 0.108, CNY: 0.0052 };
  var SYM = { KRW: '₩', USD: '$', JPY: '¥', CNY: 'CN¥' };
  var state = { cur: 'KRW', pay: 'cash' };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  try { var sv = JSON.parse(localStorage.getItem('insadong') || '{}'); if (RATES[sv.cur]) state.cur = sv.cur; if (sv.pay === 'card' || sv.pay === 'cash') state.pay = sv.pay; } catch (e) {}

  function fmt(krw) {
    var v = krw * RATES[state.cur];
    var s = state.cur === 'USD' ? v.toFixed(2) : state.cur === 'CNY' ? v.toFixed(1) : Math.round(v).toLocaleString();
    return SYM[state.cur] + s;
  }
  function withVat(krw, on) { return on && state.pay === 'card' ? Math.round(krw * 1.1) : krw; }

  function render() {
    document.body.classList.toggle('card-mode', state.pay === 'card');
    $$('[data-krw]').forEach(function (el) { el.textContent = fmt(withVat(+el.dataset.krw, 'vat' in el.dataset)); });
    $$('[data-pay]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.pay === state.pay); });
    $$('.cur').forEach(function (s) { s.value = state.cur; });
    calc();
    try { localStorage.setItem('insadong', JSON.stringify(state)); } catch (e) {}
  }

  // Cash/Card + currency controls (any number of toolbars per page)
  $$('.cur').forEach(function (s) { s.addEventListener('change', function () { state.cur = s.value; render(); }); });
  $$('[data-pay]').forEach(function (b) { b.addEventListener('click', function () { state.pay = b.dataset.pay; render(); }); });

  // Mobile menu
  var mb = $('.menu-btn'), nav = $('.bar nav');
  if (mb && nav) mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });

  // Plan My Visit calculator (admission page)
  // Fields: adults, kids, entry (KRW), pkg (KRW), pkgQty, snacks (KRW), plus add-on checkboxes [data-krw]
  function calc() {
    var f = $('#calc'); if (!f) return;
    var n = function (k) { return Math.max(0, +(f.elements[k] || {}).value || 0); };
    var adults = n('adults'), kids = n('kids'), entry = n('entry'), pkg = n('pkg');
    var qty = pkg ? Math.min(n('pkgQty'), adults) : 0;
    var addons = 0; $$('input[type=checkbox][data-krw]', f).forEach(function (c) { if (c.checked) addons += +c.dataset.krw; });
    var total = (adults - qty) * entry + kids * 7000 + addons + n('snacks') + withVat(qty * pkg, true);
    var out = $('#calc-total'); if (out) out.textContent = fmt(total);
    var note = $('#calc-note');
    if (note) note.textContent = state.pay === 'card' ? 'Card: +10% VAT included on spa packages.' : 'Cash price. Card payments add 10% VAT to spa packages.';
  }
  var cf = $('#calc'); if (cf) { cf.addEventListener('input', calc); cf.addEventListener('change', calc); }

  // First-timer stepper (first-visit page)
  $$('[data-stepper]').forEach(function (s) {
    var steps = $$('.step', s), i = 0, bar = $('.progress i', s), p = $('[data-prev]', s), nx = $('[data-next]', s);
    function show(k) {
      i = Math.max(0, Math.min(steps.length - 1, k));
      steps.forEach(function (el, j) { el.classList.toggle('on', j === i); });
      if (bar) bar.style.width = ((i + 1) / steps.length * 100) + '%';
      if (p) p.disabled = i === 0;
      if (nx) nx.disabled = i === steps.length - 1;
    }
    if (p) p.addEventListener('click', function () { show(i - 1); });
    if (nx) nx.addEventListener('click', function () { show(i + 1); });
    show(0);
  });

  // Snack filter: buttons [data-filter="all|drinks|traditional|eggs"], items [data-cat]
  $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $$('[data-cat]').forEach(function (it) { it.hidden = b.dataset.filter !== 'all' && it.dataset.cat !== b.dataset.filter; });
    });
  });

  // Copy Korean address for taxi: <button data-copy="...">
  function toast(m) { var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200); }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = b.dataset.copy, ok = function () { toast('Copied. Show this to your taxi driver.'); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function () { toast('Copy failed. Select the text manually.'); });
      else { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Copy failed.'); } ta.remove(); }
    });
  });

  // Hide any photo that fails to load so the gradient fallback shows
  $$('img[data-photo]').forEach(function (im) { im.addEventListener('error', function () { im.style.display = 'none'; }); });

  render();
})();
