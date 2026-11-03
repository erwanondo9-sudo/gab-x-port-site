/* ============================================================================
   GAB X-PORT — FINITION C · interactions
   ----------------------------------------------------------------------------
   Additif et défensif : si ce fichier ne charge pas, le site reste identique.
   Aucune dépendance, aucun impact sur les données ou l'authentification.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ------------------------------------------------------ en-tête au scroll */

  var header = document.querySelector('header.wrap.nav');
  var heroArt = document.querySelector('.gx-hero-art');
  var frame = 0;

  function onScroll() {
    if (frame) return;
    frame = requestAnimationFrame(function () {
      frame = 0;
      var y = window.scrollY || window.pageYOffset || 0;
      if (header) header.classList.toggle('gx-scrolled', y > 6);
      if (heroArt) {
        var shift = reduce.matches ? 0 : Math.min(26, y * 0.055);
        heroArt.style.setProperty('--gx-parallax', shift.toFixed(1) + 'px');
      }
      revealVisible();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --------------------------------------------- apparitions au défilement */

  var SELECTOR = [
    '.view.active .section',
    '.view.active .page-hero',
    '.gx-categories',
    '.gx-proof',
    '.gx-feature-strip',
    '.cta',
    '.gx-proof-grid',
    '.listing',
    '.service',
    '.company-card',
    '.gx-feature',
    '.gx-steps > div',
    '.gx-category-grid button',
    '.panel'
  ].join(',');

  var observer = null;

  function reveal(el) {
    if (!el || el.dataset.gxRevealed === '1') return;
    el.dataset.gxRevealed = '1';
    if (observer) observer.unobserve(el);
    el.classList.add('gx-in');
    // On rend la main aux styles de la carte une fois l'entrée terminée.
    var delay = parseInt(el.style.getPropertyValue('--gx-delay') || '0', 10) || 0;
    window.setTimeout(function () {
      el.classList.remove('gx-reveal');
      el.classList.remove('gx-in');
      el.style.removeProperty('--gx-delay');
    }, 900 + delay);
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
      });
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.01 });
  }

  function inViewport(el) {
    var r = el.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    var w = window.innerWidth || document.documentElement.clientWidth;
    return r.bottom > 0 && r.right > 0 && r.top < h + 80 && r.left < w;
  }

  // Filet de sécurité : si l'observateur tarde (onglet en arrière-plan,
  // navigateur qui throttle, élément déjà à l'écran), on affiche tout ce
  // qui est visible. Le contenu ne peut donc jamais rester invisible.
  function revealVisible() {
    if (reduce.matches) {
      // En mode réduit, on révèle tout sans animation
      var all = document.querySelectorAll('.gx-reveal');
      for (var j = 0; j < all.length; j++) {
        if (all[j].dataset.gxRevealed === '1') continue;
        all[j].dataset.gxRevealed = '1';
        all[j].classList.remove('gx-reveal');
        all[j].classList.remove('gx-in');
        all[j].style.removeProperty('--gx-delay');
      }
      return;
    }
    var nodes = document.querySelectorAll('.gx-reveal:not([data-gx-revealed="1"])');
    for (var i = 0; i < nodes.length; i++) {
      if (inViewport(nodes[i])) reveal(nodes[i]);
    }
    // Filet ultime : si encore des éléments restés (IO bloqué dans certains environnements),
    // on les révèle au bout d'un court délai s'ils sont dans le flux actif.
    if (document.querySelectorAll('.gx-reveal:not([data-gx-revealed="1"])').length) {
      window.setTimeout(function () {
        var rest = document.querySelectorAll('.gx-reveal:not([data-gx-revealed="1"])');
        for (var k = 0; k < rest.length; k++) {
          if (rest[k].closest('.view:not(.active)')) continue;
          if (inViewport(rest[k]) || rest[k].getBoundingClientRect().top < window.innerHeight * 1.2) {
            reveal(rest[k]);
          }
        }
      }, 650);
    }
  }

  function prepareReveals(scope) {
    if (reduce.matches) {
      var nodesR = (scope || document).querySelectorAll(SELECTOR);
      for (var r = 0; r < nodesR.length; r++) {
        var elr = nodesR[r];
        if (elr.dataset.gxSeen === '1') continue;
        elr.dataset.gxSeen = '1';
        elr.classList.add('gx-reveal');
      }
      revealVisible();
      return;
    }
    var nodes = (scope || document).querySelectorAll(SELECTOR);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.dataset.gxSeen === '1') continue;
      el.dataset.gxSeen = '1';
      var parent = el.parentElement;
      var index = parent ? Array.prototype.indexOf.call(parent.children, el) : 0;
      if (index > 0) el.style.setProperty('--gx-delay', Math.min(index, 5) * 55 + 'ms');
      el.classList.add('gx-reveal');
      if (observer) {
        try { observer.observe(el); } catch (e) { /* ignore */ }
      }
      if (inViewport(el)) {
        // Révélation immédiate pour ce qui est déjà à l'écran
        window.setTimeout((function(x){ return function(){ reveal(x); }; })(el), 16);
      }
    }
    window.requestAnimationFrame(revealVisible);
    window.setTimeout(revealVisible, 120);
    window.setTimeout(revealVisible, 400);
    window.setTimeout(revealVisible, 1000);
  }

  /* --------------------------------------------------------- halo du curseur */

  var SPOT = '.listing, .service, .company-card, .panel, .gx-feature, .gx-steps > div,' +
             '.gx-category-grid button, .btn';

  if (finePointer.matches) {
    document.addEventListener('pointermove', function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var el = target.closest(SPOT);
      if (!el) return;
      var box = el.getBoundingClientRect();
      el.style.setProperty('--gx-mx', (event.clientX - box.left).toFixed(0) + 'px');
      el.style.setProperty('--gx-my', (event.clientY - box.top).toFixed(0) + 'px');
    }, { passive: true });
  }

  /* ---------------------------------------- contenu injecté par l'application */

  var pending = 0;
  var mutations = new MutationObserver(function () {
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = 0;
      prepareReveals(document);
    });
  });

  function start() {
    prepareReveals(document);
    mutations.observe(document.body, { childList: true, subtree: true });

    // Chaque changement d'écran peut révéler du contenu jamais observé.
    var originalShowView = window.showView;
    if (typeof originalShowView === 'function') {
      window.showView = function () {
        var result = originalShowView.apply(this, arguments);
        requestAnimationFrame(function () { prepareReveals(document); });
        return result;
      };
    }

    // Si le visiteur demande moins de mouvement en cours de route, on montre tout.
    var onMotionPreference = function () {
      if (!reduce.matches) return;
      var nodes = document.querySelectorAll('.gx-reveal');
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].classList.remove('gx-reveal');
        nodes[i].classList.remove('gx-in');
      }
      if (heroArt) heroArt.style.removeProperty('--gx-parallax');
    };
    if (reduce.addEventListener) reduce.addEventListener('change', onMotionPreference);
    else if (reduce.addListener) reduce.addListener(onMotionPreference);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  window.__gxPolish = { version: 'C', reveal: prepareReveals };
  void root;
})();
