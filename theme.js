/* Gab X-Port — thème clair / sombre / automatique.
   Chargé de façon synchrone dans <head> pour éviter un flash de couleur.
   Le bouton [data-theme-toggle] fait défiler Auto → Clair → Sombre. */
(function () {
  'use strict';
  var KEY = 'gabxport-theme';
  var MODES = ['system', 'light', 'dark'];
  var LABELS = { system: 'Thème automatique', light: 'Thème clair', dark: 'Thème sombre' };
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function read() {
    try { var v = localStorage.getItem(KEY); return MODES.indexOf(v) >= 0 ? v : 'system'; } catch (e) { return 'system'; }
  }
  function apply(mode) {
    var resolved = mode === 'system' ? (media && media.matches ? 'dark' : 'light') : mode;
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-theme-mode', mode);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0a1322' : '#f5f6f2');
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      var next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      buttons[i].setAttribute('aria-label', LABELS[mode] + ' — passer au ' + LABELS[next].toLowerCase());
      buttons[i].setAttribute('title', LABELS[mode]);
    }
  }

  apply(read());

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('[data-theme-toggle]');
    if (!button) return;
    var next = MODES[(MODES.indexOf(read()) + 1) % MODES.length];
    try { localStorage.setItem(KEY, next); } catch (e) { /* navigation privée */ }
    apply(next);
  });
  /* Pages statiques (sans app.js) : session Supabase présente → « Mon espace » au lieu de « Se connecter ». */
  function showMemberActions() {
    if (document.querySelector('script[src*="app.js"]')) return;
    var member = false;
    try {
      for (var i = 0; i < localStorage.length; i++) { if (/^sb-.+-auth-token$/.test(localStorage.key(i))) { member = true; break; } }
    } catch (e) { /* navigation privée */ }
    if (!member) return;
    var clusters = document.querySelectorAll('.header-actions [data-auth]');
    for (var j = 0; j < clusters.length; j++) clusters[j].hidden = clusters[j].getAttribute('data-auth') !== 'member';
  }

  document.addEventListener('DOMContentLoaded', function () { apply(read()); showMemberActions(); });
  if (media && media.addEventListener) media.addEventListener('change', function () { if (read() === 'system') apply('system'); });
})();
