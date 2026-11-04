/* Gab X-Port — canevas de routes, flux, onglets des corridors, apparitions au défilement.
   Sans ce script, tout reste lisible : les panneaux restent ouverts et rien n'est masqué. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVG = 'http://www.w3.org/2000/svg';

  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window) || !items.length) return;
    root.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    Array.prototype.forEach.call(items, function (item) {
      var siblings = item.parentElement ? item.parentElement.querySelectorAll(':scope > .reveal') : [];
      item.style.setProperty('--reveal-delay', (Array.prototype.indexOf.call(siblings, item) * 70) + 'ms');
      io.observe(item);
    });
  }

  /* ------------------------------------------------ Fils : calculés depuis les boîtes réelles */
  function el(name, attrs, parent) {
    var node = document.createElementNS(SVG, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function edge(box, frame, side) {
    var r = box.getBoundingClientRect();
    return { x: (side === 'left' ? r.left : r.right) - frame.left, y: r.top + r.height / 2 - frame.top };
  }
  function curve(a, b) {
    var k = Math.max(40, Math.abs(b.x - a.x) * 0.5) * (b.x >= a.x ? 1 : -1);
    return 'C' + (a.x + k) + ',' + a.y + ' ' + (b.x - k) + ',' + b.y + ' ' + b.x + ',' + b.y;
  }
  function visible(svg) { return svg && getComputedStyle(svg).display !== 'none'; }
  // Redessine quand la taille change ou quand les polices arrivent (les libellés déplacent les boîtes).
  function watch(target, draw) {
    draw();
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(target);
    else window.addEventListener('resize', draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  }

  // Canevas du héros : chaque port est relié au Gabon, poignée à chaque bout, impulsions vers le Gabon.
  function initCanvas() {
    var canvas = document.querySelector('[data-route-canvas]');
    if (!canvas) return;
    var svg = canvas.querySelector('.route-wires');
    var ga = canvas.querySelector('.node-ga .node-box');
    var ports = Array.prototype.slice.call(canvas.querySelectorAll('button.node'));
    var handles = el('g', { 'class': 'wire-handles' }, svg);

    watch(canvas, function () {
      if (!visible(svg)) return;
      var frame = canvas.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + frame.width + ' ' + frame.height);
      while (handles.firstChild) handles.removeChild(handles.firstChild);
      var g = edge(ga, frame, 'right');
      ports.forEach(function (node) {
        var p = edge(node.querySelector('.node-box'), frame, 'left');
        var path = svg.querySelector('#w-' + node.getAttribute('data-port'));
        if (path) path.setAttribute('d', 'M' + p.x + ',' + p.y + ' ' + curve(p, g));
        el('circle', { 'class': 'wire-handle', cx: p.x, cy: p.y, r: 4 }, handles);
      });
      el('circle', { 'class': 'wire-handle', cx: g.x, cy: g.y, r: 4.5 }, handles);
    });
    if (reduce && svg.pauseAnimations) svg.pauseAnimations();

    // Survol ou focus d'un port : son fil s'allume et sa photo remplace celle d'Owendo.
    var shot = canvas.querySelector('[data-port-shot]');
    var img = shot && shot.querySelector('img');
    var cap = shot && shot.querySelector('figcaption');
    var initial = img ? { src: img.getAttribute('src'), alt: img.alt, cap: cap.textContent } : null;
    var timer = null;
    function show(src, alt, text) {
      if (!img || img.getAttribute('src') === src) return;
      shot.classList.add('is-swapping');
      var next = new Image();
      next.onload = function () { img.src = src; img.alt = alt; cap.textContent = text; shot.classList.remove('is-swapping'); };
      next.src = src;
    }
    function activate(node) {
      clearTimeout(timer);
      ports.forEach(function (n) { n.classList.toggle('is-active', n === node); });
      canvas.setAttribute('data-active', node.getAttribute('data-port'));
      show(node.getAttribute('data-src'), node.getAttribute('data-alt'), node.getAttribute('data-cap'));
    }
    function reset() {
      timer = setTimeout(function () {
        canvas.setAttribute('data-active', '');
        ports.forEach(function (n) { n.classList.remove('is-active'); });
        if (initial) show(initial.src, initial.alt, initial.cap);
      }, 900);
    }
    ports.forEach(function (node) {
      node.addEventListener('mouseenter', function () { activate(node); });
      node.addEventListener('focus', function () { activate(node); });
      node.addEventListener('mouseleave', reset);
      node.addEventListener('blur', reset);
    });
  }

  // Flux : les nœuds s'enchaînent sur un fil, une impulsion va de la publication au message.
  function initFlows() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-flow]'), function (flow, n) {
      var svg = flow.querySelector('.flow-wires');
      var nodes = Array.prototype.slice.call(flow.querySelectorAll('[data-node]'));
      if (!svg || nodes.length < 2) return;
      var id = 'flow-path-' + n;
      var path = el('path', { id: id, 'class': 'wire' }, svg);
      var handles = el('g', { 'class': 'wire-handles' }, svg);
      if (!reduce) {
        var pulse = el('circle', { 'class': 'pulse', r: 3.5 }, svg);
        var motion = el('animateMotion', { dur: '4.2s', repeatCount: 'indefinite' }, pulse);
        el('mpath', { href: '#' + id }, motion);
      }
      watch(flow, function () {
        if (!visible(svg)) return;
        var frame = flow.getBoundingClientRect();
        svg.setAttribute('viewBox', '0 0 ' + frame.width + ' ' + frame.height);
        while (handles.firstChild) handles.removeChild(handles.firstChild);
        var d = '';
        for (var i = 0; i < nodes.length - 1; i++) {
          var a = edge(nodes[i], frame, 'right');
          var b = edge(nodes[i + 1], frame, 'left');
          // Le fil passe sous le nœud intermédiaire pour que l'impulsion continue.
          d += (i === 0 ? 'M' : ' L') + a.x + ',' + a.y + ' ' + curve(a, b);
          el('circle', { 'class': 'wire-handle', cx: a.x, cy: a.y, r: 4 }, handles);
          el('circle', { 'class': 'wire-handle', cx: b.x, cy: b.y, r: 4 }, handles);
        }
        path.setAttribute('d', d);
      });
    });
  }

  // Onglets des corridors (motif ARIA tabs : flèches, Début, Fin).
  function initTabs() {
    var group = document.querySelector('[data-corridor-tabs]');
    if (!group) return;
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    panels.forEach(function (p) { if (p.hasAttribute('data-tab-hidden')) p.hidden = true; });
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length, next = null;
        if (k === 'ArrowDown' || k === 'ArrowRight') next = (i + 1) % n;
        else if (k === 'ArrowUp' || k === 'ArrowLeft') next = (i - 1 + n) % n;
        else if (k === 'Home') next = 0;
        else if (k === 'End') next = n - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });
  }

  function init() { initReveal(); initCanvas(); initFlows(); initTabs(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
