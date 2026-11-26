/* Shared helpers for the Final Fantasy Resonance pages.
   - Site bar: back to Game Guides, FF section link, theme switch (shares the 'gg-theme' key with the hub and GTA pages)
   - Deep links: #tab-id or #any-element-id opens the right tab; switching tabs updates the URL
   - Arrow-key navigation on the tab strip
   - "Continue reading" record for the hub ('gg-last')
   - Back-to-top button, print layout that shows every tab
   Works with each page's own tab code: it only clicks the existing tab buttons. */
(function () {
  'use strict';
  var d = document, de = d.documentElement;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- styles ---------- */
  var css = ''
    + '.gg-bar{max-width:1060px;margin:0 auto;padding:10px 16px 0;display:flex;align-items:center;gap:6px 14px;flex-wrap:wrap;font-size:14px}'
    + '.gg-bar a{color:var(--muted,var(--mute));text-decoration:none;font-weight:700;padding:6px 2px;min-height:32px;display:inline-flex;align-items:center}'
    + '.gg-bar a:hover{color:var(--fg,var(--ink))}.gg-bar .sep{color:var(--border,var(--line))}.gg-bar .sp{flex:1}'
    + '.gg-bar button{font:700 13px/1 var(--body,inherit);color:var(--fg,var(--ink));background:var(--surface,var(--card));border:1px solid var(--border,var(--line));border-radius:99px;padding:8px 12px;min-height:34px;cursor:pointer}'
    + '.gg-bar button:hover{border-color:var(--brand,var(--acc))}'
    + '.gg-top{position:fixed;right:16px;bottom:16px;z-index:20;width:44px;height:44px;border-radius:50%;border:1px solid var(--border,var(--line));background:var(--surface,var(--card));color:var(--fg,var(--ink));cursor:pointer;display:grid;place-items:center;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity 180ms cubic-bezier(.2,.7,.2,1),transform 180ms cubic-bezier(.2,.7,.2,1)}'
    + '.gg-top.on{opacity:1;transform:none;pointer-events:auto}.gg-top:hover{border-color:var(--brand,var(--acc))}'
    + '.gg-flash{animation:ggflash 1.4s ease-out 1}@keyframes ggflash{0%{box-shadow:0 0 0 3px var(--accent,var(--acc))}100%{box-shadow:0 0 0 3px transparent}}'
    + '@media (prefers-reduced-motion:reduce){.gg-top{transition:none}.gg-flash{animation:none}}'
    + '@media print{.gg-bar,.gg-top,.bar,.tabs,.filters,.veil-toggle,.pathbar,.wt-tools,.sp-btn{display:none!important}'
    + '.js .panel,.panel{display:block!important}.spoil .sp-body{filter:none!important}body{background:#fff;color:#000}'
    + '.panel{break-before:page}.panel:first-of-type{break-before:auto}a{color:inherit}}';
  var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);

  /* ---------- site bar ---------- */
  var main = d.querySelector('main');
  if (main) {
    var bar = d.createElement('nav');
    bar.className = 'gg-bar'; bar.setAttribute('aria-label', 'Site');
    bar.innerHTML = '<a href="../">← Game Guides</a><span class="sep" aria-hidden="true">/</span>'
      + '<a href="../#ff-resonance">Final Fantasy Resonance</a><span class="sp"></span>'
      + '<button type="button" class="gg-theme" aria-label="Switch light or dark theme">Theme</button>';
    d.body.insertBefore(bar, d.body.firstChild);
    bar.querySelector('.gg-theme').addEventListener('click', function () {
      var th = de.getAttribute('data-theme');
      var dark = th === 'dark' || (!th && matchMedia('(prefers-color-scheme: dark)').matches);
      var nx = dark ? 'light' : 'dark';
      de.setAttribute('data-theme', nx); ls('gg-theme', nx);
    });
  }

  /* ---------- tabs: deep links + keyboard ---------- */
  var tabs = [].slice.call(d.querySelectorAll('.tabs button[data-t]'));
  var title = (d.querySelector('meta[name="gg-title"]') || {}).content || (d.querySelector('h1') || {}).textContent || d.title;
  function current() { var t = d.querySelector('.tabs button[aria-selected="true"]'); return t ? t.dataset.t : ''; }
  function remember() {
    var path = location.pathname.split('/').slice(-2).join('/');
    var tab = current(), lbl = '';
    tabs.forEach(function (b) { if (b.dataset.t === tab) lbl = b.textContent.trim(); });
    ls('gg-last', JSON.stringify({ u: path + (tab ? '#' + tab : ''), t: title.trim(), tab: lbl, at: Date.now() }));
  }
  function openFor(id, scroll) {
    if (!id) return false;
    var el = d.getElementById(id);
    if (!el) return false;
    var panel = el.classList.contains('panel') ? el : el.closest('.panel');
    if (panel) {
      var btn = tabs.filter(function (b) { return b.dataset.t === panel.id; })[0];
      if (btn && btn.getAttribute('aria-selected') !== 'true') btn.click();
      // keep the precise target (#b-tellus) in the address bar, not just the tab
      if (el !== panel && history.replaceState) history.replaceState(null, '', '#' + id);
    }
    if (scroll && el !== panel) {
      setTimeout(function () {
        el.scrollIntoView({ block: 'start' });
        el.classList.remove('gg-flash'); void el.offsetWidth; el.classList.add('gg-flash');
      }, 30);
    }
    return true;
  }
  tabs.forEach(function (b, i) {
    b.setAttribute('id', 'tab-' + b.dataset.t);
    b.setAttribute('aria-controls', b.dataset.t);
    b.addEventListener('click', function () {
      if (history.replaceState) history.replaceState(null, '', '#' + b.dataset.t);
      remember();
    });
    b.addEventListener('keydown', function (ev) {
      var k = ev.key, j = -1;
      if (k === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (k === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (k === 'Home') j = 0; else if (k === 'End') j = tabs.length - 1;
      if (j < 0) return;
      ev.preventDefault(); tabs[j].click(); tabs[j].focus();
    });
  });
  function syncTabindex() { tabs.forEach(function (b) { b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1; }); }
  d.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('.tabs')) setTimeout(syncTabindex, 0); });

  // in-page links like href="#bosses" or "#b-tellus" should open the right tab
  d.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (id && openFor(id, true)) { ev.preventDefault(); if (history.replaceState) history.replaceState(null, '', '#' + id); remember(); }
  });
  function fromHash() { var id = decodeURIComponent(location.hash.slice(1)); if (id) openFor(id, true); }
  window.addEventListener('hashchange', fromHash);
  fromHash(); syncTabindex(); remember();

  /* ---------- back to top ---------- */
  var top = d.createElement('button');
  top.className = 'gg-top'; top.type = 'button'; top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
  d.body.appendChild(top);
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { top.classList.toggle('on', window.scrollY > 900); ticking = false; });
  }, { passive: true });
})();
