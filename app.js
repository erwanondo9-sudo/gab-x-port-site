/* ==========================================================================
   GAB X-PORT — Application (index.html)
   Supabase : auth, listings, favoris, historique, métriques, profils,
   messagerie, membres fondateurs, suppression de compte.
   Aucun gestionnaire inline : toutes les actions passent par [data-action].
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------- Configuration */

  // URL du projet et clé PUBLIQUE uniquement. Ne jamais mettre ici une clé
  // service_role / sb_secret : ce fichier est lisible par tous les visiteurs.
  var SUPABASE_URL = 'https://dgglsjmhjeaggxcsbwby.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_8JhF2kELEsS7l04sNK_nfA__BM3goLp';

  // La messagerie interne est prête mais masquée : le contact se fait par
  // WhatsApp ou e-mail. Passer à true pour l'afficher dans la navigation.
  var FEATURES = { messaging: false };

  var CONTACT_EMAIL = 'gabxport120@gmail.com';
  var PUBLISHER_TYPES = ['compagnie', 'company', 'exportateur', 'independent'];
  var COMPANY_TYPES = ['compagnie', 'company'];
  var MAX_PHOTOS = 10;
  var MAX_PHOTO_BYTES = 5 * 1024 * 1024;
  var PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  var supabaseClient = window.supabase && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

  /* ------------------------------------------------------ Référentiels */

  var DIRECTION_LABELS = {
    'fr-ga': 'France → Gabon', 'ga-fr': 'Gabon → France',
    'ma-ga': 'Maroc → Gabon', 'ga-ma': 'Gabon → Maroc',
    'sn-ga': 'Sénégal → Gabon', 'ga-sn': 'Gabon → Sénégal',
    'cn-ga': 'Chine → Gabon', 'ga-cn': 'Gabon → Chine',
    'international-ga': 'International → Gabon', 'ga-international': 'Gabon → International',
    'both': 'International ⇄ Gabon'
  };
  var CORRIDORS = [
    { value: 'fr~ga', label: 'France ⇄ Gabon' },
    { value: 'ma~ga', label: 'Maroc ⇄ Gabon' },
    { value: 'sn~ga', label: 'Sénégal ⇄ Gabon' },
    { value: 'cn~ga', label: 'Chine ⇄ Gabon' }
  ];
  var KNOWN_DIRECTIONS = ['fr-ga', 'ga-fr', 'ma-ga', 'ga-ma', 'sn-ga', 'ga-sn', 'cn-ga', 'ga-cn'];
  var CATEGORIES = ['Transport & logistique', 'Automobile & pièces', 'Agroalimentaire', 'Bois & matières premières', 'Équipements & matériaux', 'Autres services'];
  var COUNTRIES = ['Gabon', 'France', 'Maroc', 'Sénégal', 'Chine', 'Autre'];

  /* ---------------------------------------------------------- Utilitaires */

  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }
  function byId(id) { return document.getElementById(id); }

  // Échappement HTML : toute donnée venant de la base ou d'un membre passe ici.
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(name, extra) { return '<svg aria-hidden="true"' + (extra || '') + '><use href="#i-' + name + '"/></svg>'; }
  function isSafeId(id) { return /^[A-Za-z0-9_-]{1,64}$/.test(String(id || '')); }
  function initials(name) {
    return (String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('') || 'GX').toUpperCase();
  }
  function formatDate(value, withTime) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d)) return '';
    return withTime
      ? d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function plural(n, one, many) { return n + ' ' + (n > 1 ? many : one); }
  function directionLabel(value) { return DIRECTION_LABELS[value] || 'International ⇄ Gabon'; }
  // Signature : le corridor écrit comme une étiquette de fret (FR → GA).
  function directionCode(value) {
    var codes = { fr: 'FR', ga: 'GA', ma: 'MA', sn: 'SN', cn: 'CN', international: 'INTL' };
    var parts = String(value || '').split('-');
    if (parts.length === 2 && codes[parts[0]] && codes[parts[1]]) return codes[parts[0]] + ' → ' + codes[parts[1]];
    return 'INTL ⇄ GA';
  }
  function routeTag(value) {
    return '<span class="route-tag"><span aria-hidden="true">' + esc(directionCode(value)) + '</span><span class="visually-hidden">' + esc(directionLabel(value)) + '</span></span>';
  }
  function accountLabel(type) {
    return ({ client: 'Client', exportateur: 'Indépendant', independent: 'Indépendant', compagnie: 'Entreprise', company: 'Entreprise' })[type] || 'Membre Gab X-Port';
  }
  // N'affiche que les photos hébergées dans le stockage Supabase du projet.
  function safePhotoUrl(url) {
    var s = String(url || '');
    return s.indexOf(SUPABASE_URL + '/storage/v1/object/public/') === 0 ? s : '';
  }
  function isMissingRpc(error) { return !!error && (error.code === 'PGRST202' || /Could not find the function/i.test(error.message || '')); }
  function storageGet(key, fallback) { try { var v = localStorage.getItem(key); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function storageSet(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* navigation privée */ } }
  function storageRemove(key) { try { localStorage.removeItem(key); } catch (e) { /* navigation privée */ } }

  // Messages d'erreur Supabase traduits pour l'utilisateur.
  function friendlyError(err, fallback) {
    var m = String((err && (err.message || err.error_description)) || '');
    if (/Invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.';
    if (/Email not confirmed/i.test(m)) return 'Confirmez votre adresse e-mail grâce au lien reçu, puis reconnectez-vous.';
    if (/User already registered|already been registered/i.test(m)) return 'Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe.';
    if (/Password should be|weak password/i.test(m)) return 'Mot de passe trop faible : utilisez au moins 10 caractères, avec lettres et chiffres.';
    if (/rate limit|too many|security purposes/i.test(m)) return 'Trop de tentatives. Patientez une minute avant de réessayer.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Connexion au service impossible. Vérifiez votre connexion internet.';
    if (/JWT|session/i.test(m) && /expired|missing|invalid/i.test(m)) return 'Votre session a expiré. Reconnectez-vous.';
    if (/New password should be different/i.test(m)) return 'Le nouveau mot de passe doit être différent de l’ancien.';
    if (/réservée|obligatoires|maximum|dépasse|refusée|Authentification/i.test(m)) return m;
    return fallback || 'Une erreur est survenue. Réessayez dans quelques instants.';
  }

  /* --------------------------------------------------------- État global */

  var state = {
    user: null,
    listings: [],
    listingsStatus: 'loading', // loading | ready | error
    filters: { q: '', direction: 'all', category: 'all' },
    currentListingId: null,
    pendingHash: null,
    lastHash: '#accueil'
  };
  var FAVORITES_STORAGE_KEY = 'gabxport-favorites';
  var FAVORITES_MIGRATED_KEY = 'gabxport-favorites-migrated';
  var LISTING_HISTORY_KEY = 'gabxport-listing-history';
  var HISTORY_MIGRATED_KEY = 'gabxport-history-migrated';
  var favoriteListingIds = (function () { try { return JSON.parse(storageGet(FAVORITES_STORAGE_KEY, '[]')).map(String); } catch (e) { return []; } })();
  var favoritesRevision = 0;
  var historyRevision = 0;
  var accountSyncTask = null;

  function role() { var u = state.user; return (u && ((u.user_metadata && u.user_metadata.account_type) || (u.app_metadata && u.app_metadata.account_type))) || ''; }
  function isPublisher() { return !!state.user && PUBLISHER_TYPES.indexOf(role()) >= 0; }

  async function getCurrentAuthUser() {
    if (!supabaseClient) return null;
    var result = await supabaseClient.auth.getSession();
    state.user = (result.data && result.data.session && result.data.session.user) || null;
    return state.user;
  }

  /* -------------------------------------------------------------- Toasts */

  function showToast(message, type) {
    var region = byId('toastRegion');
    if (!region) return;
    var toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' is-error' : '');
    toast.innerHTML = icon(type === 'error' ? 'alert' : 'check-circle') + '<span></span>';
    toast.lastChild.textContent = message;
    region.appendChild(toast);
    while (region.children.length > 3) region.removeChild(region.firstChild);
    setTimeout(function () {
      toast.classList.add('is-leaving');
      setTimeout(function () { toast.remove(); }, 260);
    }, type === 'error' ? 6500 : 4200);
  }

  function setAlert(el, message, type) {
    if (typeof el === 'string') el = byId(el);
    if (!el) return;
    el.className = 'alert' + (message ? ' alert-' + (type || 'info') : '');
    el.innerHTML = message ? icon(type === 'error' ? 'alert' : type === 'success' ? 'check-circle' : 'info') + '<span></span>' : '';
    if (message) el.lastChild.textContent = message;
  }

  function setBusy(button, busy) {
    if (!button) return;
    button.disabled = !!busy;
    if (busy) button.setAttribute('aria-busy', 'true'); else button.removeAttribute('aria-busy');
  }

  /* ---------------------------------------------------------- Modales */

  var MODAL_COPY = {
    login: ['Se connecter', 'Accédez à votre espace, à vos favoris et aux coordonnées des professionnels.'],
    signup: ['Créer un compte', 'Un seul compte pour consulter les annonces, contacter les professionnels et publier.'],
    resetPassword: ['Nouveau mot de passe', 'Choisissez un nouveau mot de passe pour votre compte Gab X-Port.'],
    publish: ['Publier une annonce', 'Présentez votre service aux clients du Gabon et de l’international.'],
    contact: ['Nous contacter', 'Une question, un partenariat ? L’équipe Gab X-Port vous répond par e-mail.'],
    confirm: ['Confirmer', '']
  };
  var lastFocus = null;
  var confirmResolver = null;

  function openModal(which, options) {
    options = options || {};
    var modal = byId('modal');
    var panel = $('.modal-panel', modal);
    var copy = MODAL_COPY[which] || MODAL_COPY.contact;
    if (!modal.classList.contains('is-open')) lastFocus = document.activeElement;
    byId('modalTitle').textContent = options.title || copy[0];
    byId('modalSubtitle').textContent = options.subtitle != null ? options.subtitle : copy[1];
    byId('modalSubtitle').hidden = !(options.subtitle != null ? options.subtitle : copy[1]);
    $$('[data-modal]', modal).forEach(function (el) { el.hidden = el.getAttribute('data-modal') !== which; });
    panel.classList.toggle('is-wide', which === 'publish');
    panel.classList.toggle('is-small', which === 'confirm' || which === 'login' || which === 'resetPassword');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-modal');
    $('.modal-body', modal).scrollTop = 0;
    if (which === 'signup') updateSignupFields();
    requestAnimationFrame(function () {
      var target = $('[data-modal="' + which + '"] input:not([type="hidden"]):not([type="radio"]):not([type="file"]), [data-modal="' + which + '"] button.btn-primary', modal);
      if (target && window.matchMedia('(hover: hover)').matches) target.focus(); else panel.focus();
    });
  }

  function closeModal() {
    var modal = byId('modal');
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('has-modal');
    if (confirmResolver) { confirmResolver(false); confirmResolver = null; }
    state.pendingAction = null; state.pendingHash = null;
    if (lastFocus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignoré */ } }
  }

  function confirmDialog(message, options) {
    options = options || {};
    return new Promise(function (resolve) {
      if (confirmResolver) confirmResolver(false);
      byId('confirmMessage').textContent = message;
      var ok = byId('confirmOk');
      ok.textContent = options.confirmLabel || 'Confirmer';
      ok.className = 'btn ' + (options.danger ? 'btn-danger-solid' : 'btn-primary');
      openModal('confirm', { title: options.title || 'Confirmer', subtitle: '' });
      confirmResolver = resolve;
      setTimeout(function () { ok.focus(); }, 30);
    });
  }

  function trapFocus(event) {
    var modal = byId('modal');
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
    if (event.key !== 'Tab') return;
    var focusables = $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', $('.modal-panel', modal))
      .filter(function (el) { return el.offsetParent !== null; });
    if (!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  async function openPublish() {
    var user = await getCurrentAuthUser();
    if (!user) {
      state.pendingAction = 'publish';
      openModal('login', { subtitle: 'Connectez-vous avec un compte Entreprise ou Indépendant pour publier.' });
      return;
    }
    if (!isPublisher()) { showToast('La publication est réservée aux comptes Entreprise et Indépendant.', 'error'); return; }
    var company = byId('fCompany');
    var meta = user.user_metadata || {};
    if (company && !company.value) company.value = meta.company_name || meta.full_name || '';
    setAlert('listingFeedback', '');
    openModal('publish');
  }

  /* ---------------------------------------------------- Listes déroulantes */

  function fillSelects() {
    $$('select[data-direction-options]').forEach(function (select) {
      var html;
      if (select.hasAttribute('data-publish')) {
        html = KNOWN_DIRECTIONS.map(function (d) { return '<option value="' + d + '">' + esc(DIRECTION_LABELS[d]) + '</option>'; }).join('') +
          '<option value="both">Autres / multidestination</option>';
      } else {
        html = '<option value="all">Tous les corridors</option>' +
          '<optgroup label="Dans les deux sens">' + CORRIDORS.map(function (c) { return '<option value="' + c.value + '">' + esc(c.label) + '</option>'; }).join('') + '</optgroup>' +
          '<optgroup label="Sens précis">' + KNOWN_DIRECTIONS.map(function (d) { return '<option value="' + d + '">' + esc(DIRECTION_LABELS[d]) + '</option>'; }).join('') + '</optgroup>' +
          '<option value="other">Autres corridors</option>';
      }
      select.innerHTML = html;
    });
    $$('select[data-category-options]').forEach(function (select) {
      select.innerHTML = (select.hasAttribute('data-with-all') ? '<option value="all">Tous les secteurs</option>' : '') +
        CATEGORIES.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
    });
    $$('select[data-country-options]').forEach(function (select) {
      select.innerHTML = COUNTRIES.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
    });
  }

  /* ---------------------------------------------------------- Annonces */

  function mapListing(row) {
    var photos = (Array.isArray(row.photo_urls) ? row.photo_urls : []).map(safePhotoUrl).filter(Boolean);
    var single = safePhotoUrl(row.photo_url);
    if (!photos.length && single) photos.push(single);
    return {
      id: String(row.id), title: row.title, company: row.company, category: row.category, direction: row.direction,
      desc: row.description, city: row.city, type: row.listing_type || 'Service', price: row.price || 'À discuter',
      photoUrls: photos, ownerId: row.owner_id ? String(row.owner_id) : '', createdAt: row.created_at, status: row.status
    };
  }
  function findListing(id) { return state.listings.filter(function (x) { return x.id === String(id); })[0] || null; }

  var LISTING_COLUMNS = 'id,owner_id,title,company,category,direction,description,city,listing_type,price,photo_urls,status,created_at';

  async function loadListings() {
    if (!supabaseClient) { state.listingsStatus = 'error'; renderAllListings(); return; }
    state.listingsStatus = state.listings.length ? 'ready' : 'loading';
    var query = function (columns) {
      return supabaseClient.from('listings').select(columns).eq('status', 'published').order('created_at', { ascending: false });
    };
    var result = await query(LISTING_COLUMNS);
    // Base dont le schéma diffère (colonne absente) : on relit toutes les colonnes visibles.
    if (result.error && result.error.code === '42703') result = await query('*');
    if (result.error) {
      console.error('Chargement des annonces', result.error);
      state.listingsStatus = 'error';
      renderAllListings();
      return;
    }
    state.listings = (result.data || []).map(mapListing);
    state.listingsStatus = 'ready';
    if (state.user) {
      try {
        var fav = await supabaseClient.rpc('get_my_listing_favorites');
        if (!fav.error) { favoriteListingIds = (fav.data || []).map(String); cacheFavorites(); }
      } catch (e) { console.warn('Chargement des favoris synchronisés', e); }
    }
    renderAllListings();
    if (state.currentListingId && location.hash.indexOf('#annonce/') === 0) showListingRoute(state.currentListingId);
  }

  function matchesDirection(actual, selected) {
    if (selected === 'all') return true;
    if (selected === 'other') return KNOWN_DIRECTIONS.indexOf(actual) < 0;
    if (selected.indexOf('~') > 0) {
      var parts = selected.split('~');
      return actual === parts[0] + '-' + parts[1] || actual === parts[1] + '-' + parts[0];
    }
    return actual === selected;
  }

  function filteredListings() {
    var f = state.filters, q = f.q.trim().toLowerCase();
    return state.listings.filter(function (x) {
      return (!q || [x.title, x.company, x.desc, x.city, x.category].join(' ').toLowerCase().indexOf(q) >= 0) &&
        matchesDirection(x.direction || '', f.direction) &&
        (f.category === 'all' || x.category === f.category);
    });
  }

  function skeletonCards(n) {
    var html = '';
    for (var i = 0; i < n; i++) html += '<div class="listing-card skeleton-card" aria-hidden="true"><div class="skeleton sk-media"></div><div class="skeleton sk-title"></div><div class="skeleton sk-line"></div><div class="skeleton sk-line w60"></div><div class="skeleton sk-line w40"></div></div>';
    return html;
  }

  function emptyState(iconName, title, text, actionHtml, isError) {
    return '<div class="empty-state' + (isError ? ' is-error' : '') + '"><span class="empty-icon">' + icon(iconName) + '</span><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (actionHtml || '') + '</div>';
  }

  function listingErrorState() {
    return emptyState('alert', 'Impossible de charger les annonces', 'Le service est momentanément indisponible ou votre connexion est interrompue.', '<button type="button" class="btn btn-secondary" data-action="reload-listings">Réessayer</button>', true);
  }

  function mediaHtml(x) {
    if (x.photoUrls.length) {
      return '<div class="listing-media"><img src="' + esc(x.photoUrls[0]) + '" alt="" loading="lazy" decoding="async">' +
        (x.photoUrls.length > 1 ? '<span class="photo-count">' + icon('image') + x.photoUrls.length + '</span>' : '') + '</div>';
    }
    // Sans photo : la route du corridor sur le canevas (jamais une photo qu'on prendrait pour celle de l'annonce).
    return '<div class="listing-media"><div class="media-placeholder">' + routeTag(x.direction) + '</div></div>';
  }

  // variant : default | history | owner | compact
  function listingCardHtml(x, variant, extra) {
    extra = extra || {};
    var visited = variant === 'default' && (extra.visited || visitedIds()).has(x.id);
    var id = esc(x.id);
    var isFav = favoriteListingIds.indexOf(x.id) >= 0;
    var badges = '<span class="badge">' + esc(x.type || 'Service') + '</span>' +
      (visited ? '<span class="badge badge-neutral">' + icon('eye', ' width="12" height="12"') + 'Consultée</span>' : '') +
      (variant === 'history' && extra.viewedAt ? '<span class="badge badge-neutral">Vue le ' + esc(formatDate(extra.viewedAt, true)) + '</span>' : '');
    var fav = variant === 'owner' ? '' :
      '<button type="button" class="fav-btn" data-action="toggle-favorite" data-id="' + id + '" aria-pressed="' + isFav + '" aria-label="' + (isFav ? 'Retirer des favoris' : 'Ajouter aux favoris') + ' : ' + esc(x.title) + '">' + icon('heart') + '</button>';
    var foot;
    if (variant === 'owner') {
      var s = extra.stats || { views: 0, favorites: 0 };
      foot = '<div class="listing-foot"><div class="metrics"><span class="metric">' + icon('eye') + '<strong>' + s.views + '</strong> ' + (s.views > 1 ? 'vues' : 'vue') + '</span><span class="metric">' + icon('heart') + '<strong>' + s.favorites + '</strong> favori' + (s.favorites > 1 ? 's' : '') + '</span></div>' +
        '<div class="actions"><button type="button" class="btn btn-danger btn-sm" data-action="delete-listing" data-id="' + id + '">' + icon('trash') + 'Supprimer</button></div></div>';
    } else {
      foot = '<div class="listing-foot"><span class="company">' + esc(x.company || 'Professionnel') + '</span><span class="price">' + esc(x.price || 'À discuter') + '</span></div>';
    }
    return '<article class="listing-card' + (variant === 'compact' ? ' is-compact' : '') + '">' + fav + mediaHtml(x) +
      '<div class="listing-body"><div class="listing-badges">' + badges + '</div>' +
      '<h3><button type="button" data-action="open-listing" data-id="' + id + '">' + esc(x.title) + '</button></h3>' +
      '<p class="listing-desc">' + esc(x.desc) + '</p>' +
      '<div class="listing-meta">' + (x.photoUrls.length ? routeTag(x.direction) : '') + '<span>' + icon('layers') + esc(x.category || 'Service') + '</span>' + (x.city ? '<span>' + icon('pin') + esc(x.city) + '</span>' : '') + '</div></div>' +
      foot + '</article>';
  }

  function renderListings() {
    var grid = byId('listingGrid');
    if (!grid) return;
    var count = byId('resultsCount');
    var f = state.filters;
    var active = f.q || f.direction !== 'all' || f.category !== 'all';
    byId('resetFilters').hidden = !active;
    grid.setAttribute('aria-busy', state.listingsStatus === 'loading' ? 'true' : 'false');
    if (state.listingsStatus === 'loading') { grid.innerHTML = skeletonCards(6); count.textContent = 'Chargement des annonces…'; return; }
    if (state.listingsStatus === 'error') { grid.innerHTML = listingErrorState(); count.textContent = ''; return; }
    var items = filteredListings();
    count.textContent = items.length ? plural(items.length, 'annonce', 'annonces') + (active ? ' correspondant à votre recherche' : ' disponibles') : '';
    if (!items.length) {
      grid.innerHTML = active
        ? emptyState('search', 'Aucune annonce ne correspond', 'Essayez un autre mot-clé, un autre corridor ou un autre secteur.', '<button type="button" class="btn btn-secondary" data-action="reset-filters">Effacer les filtres</button>')
        : emptyState('grid', 'Aucune annonce pour le moment', 'Les premières offres arrivent. Vous êtes un professionnel ? Publiez la vôtre.', '<button type="button" class="btn btn-primary" data-action="open-publish">Publier une annonce</button>');
      return;
    }
    var visited = visitedIds();
    grid.innerHTML = items.map(function (x) { return listingCardHtml(x, 'default', { visited: visited }); }).join('');
  }

  function renderLatest() {
    var grid = byId('latestGrid');
    if (!grid) return;
    grid.setAttribute('aria-busy', state.listingsStatus === 'loading' ? 'true' : 'false');
    if (state.listingsStatus === 'loading') { grid.innerHTML = skeletonCards(3); return; }
    if (state.listingsStatus === 'error') { grid.innerHTML = listingErrorState(); return; }
    var items = state.listings.slice(0, 6);
    var visited = visitedIds();
    var pioneer = items.length && items.length < 3 && (!state.user || isPublisher())
      ? '<article class="pioneer-card"><h3>Votre service a sa place ici</h3><p>Vous proposez du transport, des pièces ou des produits entre le Gabon et l’international ? Publiez votre annonce : elle apparaîtra parmi les premières.</p><button type="button" class="btn btn-primary" data-action="open-publish">Publier une annonce</button></article>'
      : '';
    grid.innerHTML = items.length
      ? items.map(function (x) { return listingCardHtml(x, 'default', { visited: visited }); }).join('') + pioneer
      : emptyState('grid', 'Les premières annonces arrivent', 'Soyez parmi les premiers professionnels visibles sur Gab X-Port.', '<button type="button" class="btn btn-primary" data-action="open-publish">Publier une annonce</button>');
  }

  function renderAllListings() { renderListings(); renderLatest(); renderFavorites(); renderHistory(); }

  function applyFilters(partial) {
    Object.keys(partial || {}).forEach(function (k) { state.filters[k] = partial[k]; });
    byId('q').value = state.filters.q;
    byId('direction').value = state.filters.direction;
    byId('category').value = state.filters.category;
    renderListings();
  }

  /* ----------------------------------------------------- Favoris (sync) */

  function cacheFavorites() { storageSet(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteListingIds)); }

  async function toggleFavorite(id) {
    id = String(id);
    var isFavorite = favoriteListingIds.indexOf(id) >= 0;
    favoriteListingIds = isFavorite ? favoriteListingIds.filter(function (x) { return x !== id; }) : favoriteListingIds.concat(id);
    favoritesRevision++;
    cacheFavorites();
    $$('.fav-btn[data-id="' + id + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(!isFavorite));
      b.setAttribute('aria-label', (isFavorite ? 'Ajouter aux favoris' : 'Retirer des favoris'));
    });
    if (byId('view-favoris').classList.contains('is-active')) renderFavorites();
    try {
      var user = await getCurrentAuthUser();
      if (user && supabaseClient) {
        var res = await supabaseClient.rpc('set_listing_favorite', { p_listing_id: id, p_is_favorite: !isFavorite });
        if (res.error) throw res.error;
        showToast(isFavorite ? 'Annonce retirée des favoris.' : 'Ajoutée aux favoris, sur tous vos appareils.');
      } else {
        showToast(isFavorite ? 'Annonce retirée des favoris.' : 'Ajoutée aux favoris. Connectez-vous pour les retrouver sur vos autres appareils.');
      }
    } catch (err) {
      console.error('Synchronisation favori', err);
      showToast('Favori enregistré sur cet appareil, mais la synchronisation a échoué.', 'error');
    }
  }

  function renderFavorites() {
    var grid = byId('favoriteGrid');
    if (!grid) return;
    if (state.listingsStatus === 'loading') { grid.innerHTML = skeletonCards(3); return; }
    if (state.listingsStatus === 'error') { grid.innerHTML = listingErrorState(); return; }
    var items = state.listings.filter(function (x) { return favoriteListingIds.indexOf(x.id) >= 0; });
    grid.innerHTML = items.length
      ? items.map(function (x) { return listingCardHtml(x, 'default'); }).join('')
      : emptyState('heart', 'Aucun favori pour le moment', 'Touchez le cœur d’une annonce pour la retrouver ici.', '<a class="btn btn-primary" href="#annonces">Parcourir les annonces</a>');
  }

  /* --------------------------------------------------- Historique (sync) */

  function getListingHistory() {
    try {
      var raw = JSON.parse(storageGet(LISTING_HISTORY_KEY, '[]'));
      return Array.isArray(raw) ? raw.filter(function (v) { return v && v.id; }).slice(0, 100) : [];
    } catch (e) { return []; }
  }
  function cacheHistory(history) { storageSet(LISTING_HISTORY_KEY, JSON.stringify(history.slice(0, 100))); }
  function visitedIds() { return new Set(getListingHistory().map(function (v) { return String(v.id); })); }
  function recordListingVisit(listing) {
    var history = getListingHistory().filter(function (v) { return String(v.id) !== listing.id; });
    history.unshift({ id: listing.id, viewedAt: new Date().toISOString() });
    historyRevision++;
    cacheHistory(history);
  }

  function renderHistory() {
    var grid = byId('historyGrid');
    if (!grid) return;
    if (state.listingsStatus === 'loading') { grid.innerHTML = skeletonCards(3); return; }
    var items = getListingHistory().map(function (v) { return { listing: findListing(v.id), viewedAt: v.viewedAt }; }).filter(function (v) { return v.listing; });
    byId('clearHistoryBtn').hidden = !items.length;
    grid.innerHTML = items.length
      ? items.map(function (v) { return listingCardHtml(v.listing, 'history', { viewedAt: v.viewedAt }); }).join('')
      : emptyState('history', 'Aucune annonce consultée', 'Les annonces que vous ouvrez apparaîtront ici, pour les retrouver facilement.', '<a class="btn btn-primary" href="#annonces">Parcourir les annonces</a>');
  }

  async function clearListingHistory() {
    var ok = await confirmDialog('Effacer tout votre historique de consultation ? Cette action s’applique à tous vos appareils.', { title: 'Effacer l’historique', confirmLabel: 'Effacer', danger: true });
    if (!ok) return;
    closeModal();
    try {
      if (supabaseClient && state.user) {
        var res = await supabaseClient.rpc('clear_my_listing_history');
        if (res.error && !isMissingRpc(res.error)) console.warn('Effacement de l’historique distant', res.error);
      }
    } catch (err) { console.warn('Effacement de l’historique distant', err); }
    storageRemove(LISTING_HISTORY_KEY);
    storageSet(HISTORY_MIGRATED_KEY, '1');
    historyRevision++;
    renderHistory(); renderListings(); renderLatest();
    showToast('Historique effacé.');
  }

  // SYNCHRONISATION MULTI-APPAREILS
  // Le stockage local sert de cache immédiat ; le compte Supabase est la
  // source de vérité après un premier envoi des données locales.
  async function pushLocalFavoritesOnce() {
    if (storageGet(FAVORITES_MIGRATED_KEY) === '1') return true;
    var pending = favoriteListingIds.slice();
    if (pending.length) {
      var errors = await Promise.all(pending.map(function (id) {
        return supabaseClient.rpc('set_listing_favorite', { p_listing_id: id, p_is_favorite: true }).then(function (r) { return r.error; }).catch(function (e) { return e; });
      }));
      if (errors.some(Boolean)) return false;
    }
    storageSet(FAVORITES_MIGRATED_KEY, '1');
    return true;
  }
  async function pushLocalHistoryOnce() {
    if (storageGet(HISTORY_MIGRATED_KEY) === '1') return true;
    var pending = getListingHistory().map(function (v) { return String(v.id); });
    if (pending.length) {
      var errors = await Promise.all(pending.map(function (id) {
        return supabaseClient.rpc('record_listing_view', { p_listing_id: id }).then(function (r) { return r.error; }).catch(function (e) { return e; });
      }));
      if (errors.some(Boolean)) return false;
    }
    storageSet(HISTORY_MIGRATED_KEY, '1');
    return true;
  }
  function syncAccountState() {
    if (!supabaseClient || !state.user) return Promise.resolve();
    if (accountSyncTask) return accountSyncTask;
    accountSyncTask = (async function () {
      var favoritesStart = favoritesRevision, historyStart = historyRevision;
      var favoritesSynced = await pushLocalFavoritesOnce();
      var historySynced = await pushLocalHistoryOnce();
      var results = await Promise.allSettled([supabaseClient.rpc('get_my_listing_favorites'), supabaseClient.rpc('get_my_listing_history')]);
      var fav = results[0], hist = results[1];
      if (fav.status === 'fulfilled' && !fav.value.error && favoritesRevision === favoritesStart) {
        var remote = (fav.value.data || []).map(String);
        favoriteListingIds = favoritesSynced ? remote : Array.from(new Set(remote.concat(favoriteListingIds)));
        cacheFavorites();
      }
      if (hist.status === 'fulfilled' && !hist.value.error && historyRevision === historyStart) {
        var remoteHistory = (hist.value.data || []).map(function (row) { return { id: String(row.listing_id), viewedAt: row.viewed_at }; }).filter(function (v) { return v.id; });
        var merged = historySynced ? remoteHistory : Array.from(new Map(remoteHistory.concat(getListingHistory()).map(function (v) { return [v.id, v]; })).values());
        cacheHistory(merged.sort(function (a, b) { return String(b.viewedAt).localeCompare(String(a.viewedAt)); }));
      } else if (hist.status === 'fulfilled' && hist.value.error && !isMissingRpc(hist.value.error)) {
        console.info('Historique distant indisponible', hist.value.error);
      }
      renderAllListings();
    })().catch(function (err) { console.warn('Synchronisation du compte', err); }).finally(function () { accountSyncTask = null; });
    return accountSyncTask;
  }
  // À la déconnexion, un autre compte sur le même appareil ne doit pas
  // retrouver les favoris et l'historique du précédent.
  function clearAccountCaches() {
    favoriteListingIds = [];
    [FAVORITES_STORAGE_KEY, LISTING_HISTORY_KEY, FAVORITES_MIGRATED_KEY, HISTORY_MIGRATED_KEY].forEach(storageRemove);
    renderAllListings();
  }

  /* ------------------------------------------------- Détail d'une annonce */

  function renderListingDetail(id) {
    var panel = byId('listingDetail');
    var x = findListing(id);
    var view = byId('view-annonce');
    if (!x) {
      view.classList.remove('has-contact-bar');
      panel.innerHTML = state.listingsStatus === 'loading'
        ? '<div class="listing-grid">' + skeletonCards(1) + '</div>'
        : emptyState('search', 'Annonce introuvable', 'Cette annonce a peut-être été retirée par son auteur.', '<a class="btn btn-primary" href="#annonces">Voir les annonces</a>');
      return;
    }
    document.title = x.title + ' | Gab X-Port';
    var isFav = favoriteListingIds.indexOf(x.id) >= 0;
    var own = state.user && state.user.id === x.ownerId;
    var photos = x.photoUrls;
    var gallery = photos.length
      ? '<div class="gallery"><div class="gallery-main"><img id="galleryMain" src="' + esc(photos[0]) + '" alt="Photo 1 : ' + esc(x.title) + '"></div>' +
        (photos.length > 1 ? '<div class="gallery-thumbs" role="list">' + photos.map(function (url, i) {
          return '<button type="button" role="listitem" data-action="gallery" data-index="' + i + '" aria-label="Afficher la photo ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '><img src="' + esc(url) + '" alt="" loading="lazy"></button>';
        }).join('') + '</div>' : '') + '</div>'
      : '';
    var contactBtn = own
      ? '<a class="btn btn-secondary btn-block" href="#espace-personnel">Gérer mes annonces</a>'
      : '<button type="button" class="btn btn-primary btn-lg btn-block" data-action="contact-listing" data-id="' + esc(x.id) + '">' + icon('chat') + 'Contacter l’annonceur</button>';
    panel.innerHTML =
      '<button type="button" class="back-link" data-action="back">' + icon('arrow-left') + 'Retour aux annonces</button>' +
      '<div class="detail">' +
        '<article>' + gallery +
          '<div class="listing-badges" style="margin-bottom:12px"><span class="badge">' + esc(x.type) + '</span><span class="badge badge-neutral">Publiée le ' + esc(formatDate(x.createdAt) || 'date non précisée') + '</span></div>' +
          '<h1>' + esc(x.title) + '</h1>' +
          '<p class="detail-company">' + esc(x.company) + '</p>' +
          '<div class="facts">' +
            '<div class="fact"><small>Corridor</small><strong><span class="route-tag" aria-hidden="true">' + esc(directionCode(x.direction)) + '</span> ' + esc(directionLabel(x.direction)) + '</strong></div>' +
            '<div class="fact"><small>Secteur</small><strong>' + esc(x.category) + '</strong></div>' +
            '<div class="fact"><small>Localisation</small><strong>' + esc(x.city || 'Non précisée') + '</strong></div>' +
            '<div class="fact"><small>Prix / conditions</small><strong>' + esc(x.price) + '</strong></div>' +
          '</div>' +
          '<h2 style="font-size:var(--text-xl);margin-bottom:12px">Description</h2>' +
          '<p class="description">' + esc(x.desc) + '</p>' +
        '</article>' +
        '<aside class="detail-aside">' +
          '<div class="card"><span class="muted small">Prix / conditions</span><span class="price-big">' + esc(x.price) + '</span>' + contactBtn +
            '<button type="button" class="btn btn-secondary btn-block" data-action="toggle-favorite" data-id="' + esc(x.id) + '" aria-pressed="' + isFav + '">' + icon('heart') + (isFav ? 'Dans vos favoris' : 'Ajouter aux favoris') + '</button></div>' +
          '<div class="card"><strong>' + esc(x.company || 'Professionnel') + '</strong><p class="small">Consultez le profil professionnel de l’annonceur et ses autres services.</p>' +
            (x.ownerId ? '<a class="btn btn-secondary btn-block" href="#profil/' + esc(x.ownerId) + '">Voir le profil</a>' : '') + '</div>' +
          '<div class="alert alert-info">' + icon('shield') + '<span>Gab X-Port met les membres en relation. Vérifiez l’identité de votre interlocuteur et ne versez jamais d’acompte sans garantie écrite.</span></div>' +
        '</aside>' +
      '</div>' +
      (own ? '' : '<div class="contact-bar"><button type="button" class="btn btn-primary btn-lg" data-action="contact-listing" data-id="' + esc(x.id) + '">' + icon('chat') + 'Contacter</button><button type="button" class="btn btn-secondary btn-lg btn-icon" data-action="toggle-favorite" data-id="' + esc(x.id) + '" aria-pressed="' + isFav + '" aria-label="Favori">' + icon('heart') + '</button></div>');
    view.classList.toggle('has-contact-bar', !own);
  }

  async function openListing(id) {
    if (!isSafeId(id)) return;
    location.hash = '#annonce/' + id;
  }

  async function showListingRoute(id) {
    state.currentListingId = id;
    renderListingDetail(id);
    var x = findListing(id);
    if (!x) return;
    recordListingVisit(x);
    if (supabaseClient && state.user && x.ownerId && x.ownerId !== state.user.id) {
      supabaseClient.rpc('record_listing_view', { p_listing_id: x.id }).then(function (r) { if (r.error) console.warn('Comptage de consultation', r.error); });
    }
  }

  async function contactListing(id) {
    var x = findListing(id);
    if (!x) return;
    if (!x.ownerId) { showToast('Le profil de l’annonceur est introuvable.', 'error'); return; }
    var user = await getCurrentAuthUser();
    if (!user) { state.pendingHash = '#annonce/' + x.id; openModal('login'); return; }
    if (user.id === x.ownerId) { showToast('Vous ne pouvez pas contacter votre propre annonce.', 'error'); return; }
    await openDirectContact(x.ownerId, x.title);
  }

  async function openDirectContact(ownerId, listingTitle) {
    if (!ownerId || !supabaseClient) { showToast('Les coordonnées de ce professionnel ne sont pas disponibles.', 'error'); return; }
    // Fenêtre ouverte immédiatement (geste utilisateur) pour éviter le blocage des popups sur mobile.
    var win = window.open('', '_blank');
    try {
      var result = await supabaseClient.rpc('get_public_offerer_profile', { p_user_id: ownerId }).maybeSingle();
      if (result.error) throw result.error;
      var p = result.data;
      if (!p) throw new Error('Profil professionnel introuvable.');
      var message = 'Bonjour ' + (p.display_name || '') + ', je vous contacte via Gab X-Port' + (listingTitle ? ' au sujet de votre annonce « ' + listingTitle + ' »' : '') + '. Pouvez-vous me donner plus d’informations ?';
      var url;
      if (p.contact_method === 'email') {
        var email = String(p.contact_email || '').trim();
        if (!email) throw new Error('Ce professionnel n’a pas renseigné d’adresse e-mail de contact.');
        url = 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent('Prise de contact via Gab X-Port') + '&body=' + encodeURIComponent(message);
        if (win) win.close();
        window.location.href = url;
        return;
      }
      var phone = String(p.whatsapp_phone || p.professional_phone || '').replace(/[^0-9]/g, '');
      if (!phone) throw new Error('Ce professionnel n’a pas renseigné de numéro WhatsApp.');
      url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
      if (win) { win.opener = null; win.location.href = url; } else window.location.href = url;
    } catch (e) {
      if (win) win.close();
      console.error('Contact direct', e);
      showToast(e.message && /renseigné|introuvable/.test(e.message) ? e.message : 'Impossible de préparer le contact. Réessayez.', 'error');
    }
  }

  /* ------------------------------------------------- Profil professionnel */

  async function renderOffererProfile(ownerId) {
    var content = byId('offererProfileContent');
    if (!supabaseClient) { content.innerHTML = emptyState('alert', 'Service indisponible', 'Le service de profil est momentanément indisponible.', '', true); return; }
    content.innerHTML = '<div class="card"><div class="skeleton" style="height:72px;width:72px;border-radius:16px"></div><div class="skeleton" style="height:22px;width:50%;margin-top:16px"></div><div class="skeleton" style="height:14px;width:30%;margin-top:10px"></div></div>';
    try {
      var result = await supabaseClient.rpc('get_public_offerer_profile', { p_user_id: ownerId }).maybeSingle();
      if (result.error) throw result.error;
      var p = result.data;
      if (!p) { content.innerHTML = emptyState('user', 'Profil introuvable', 'Ce profil n’existe pas ou n’est pas public.', '<a class="btn btn-primary" href="#annonces">Voir les annonces</a>'); return; }
      var name = p.display_name || 'Membre Gab X-Port';
      document.title = name + ' | Gab X-Port';
      var isCompany = COMPANY_TYPES.indexOf(p.account_type) >= 0;
      var offers = state.listings.filter(function (x) { return x.ownerId === String(ownerId); });
      var website = p.company_website ? String(p.company_website) : '';
      var websiteUrl = /^https?:\/\//i.test(website) ? website : '';
      var own = state.user && state.user.id === String(ownerId);
      content.innerHTML =
        '<div class="card"><div class="profile-head"><span class="avatar avatar-xl">' + esc(initials(name)) + '</span><div style="min-width:0;flex:1"><span class="badge">' + icon(isCompany ? 'building' : 'briefcase', ' width="12" height="12"') + esc(accountLabel(p.account_type)) + '</span><h1 style="margin-top:8px;overflow-wrap:anywhere">' + esc(name) + '</h1><p class="muted">' + esc(p.country || 'Pays non renseigné') + '</p></div>' +
        (own ? '' : '<button type="button" class="btn btn-primary btn-lg" data-action="contact-offerer" data-id="' + esc(ownerId) + '">' + icon('chat') + 'Contacter</button>') + '</div>' +
        '<div class="facts" style="margin-bottom:0"><div class="fact"><small>Type de membre</small><strong>' + esc(accountLabel(p.account_type)) + '</strong></div><div class="fact"><small>Services publiés</small><strong>' + offers.length + '</strong></div><div class="fact"><small>Contact</small><strong>' + (p.contact_method === 'email' ? 'E-mail' : 'WhatsApp') + '</strong></div>' +
        (websiteUrl ? '<div class="fact"><small>Site internet</small><strong><a href="' + esc(websiteUrl) + '" target="_blank" rel="noopener noreferrer nofollow">' + esc(website.replace(/^https?:\/\//i, '')) + '</a></strong></div>' : '') + '</div></div>' +
        '<div class="card" style="margin-top:20px"><h2 style="font-size:var(--text-xl);margin-bottom:8px">Présentation</h2><p>' + esc(p.activity || (isCompany ? 'Entreprise inscrite sur Gab X-Port.' : 'Professionnel indépendant inscrit sur Gab X-Port.')) + '</p><p class="hint" style="margin-top:12px">Les adresses privées et les e-mails de connexion ne sont jamais affichés.</p></div>' +
        '<h2 style="font-size:var(--text-xl);margin:32px 0 16px">Services publiés</h2>' +
        (offers.length ? '<div class="listing-grid">' + offers.map(function (x) { return listingCardHtml(x, 'default'); }).join('') + '</div>' : emptyState('grid', 'Aucune annonce en ligne', 'Ce professionnel n’a pas d’annonce publiée actuellement.'));
    } catch (e) {
      console.error('Profil offreur', e);
      content.innerHTML = emptyState('alert', 'Impossible de charger ce profil', 'Réessayez dans quelques instants.', '<button type="button" class="btn btn-secondary" data-action="reload-route">Réessayer</button>', true);
    }
  }

  /* ------------------------------------------------------- Publication */

  var selectedPhotos = [];

  function renderPhotoPreviews() {
    var preview = byId('fPhotoPreview');
    $$('img', preview).forEach(function (img) { URL.revokeObjectURL(img.src); });
    preview.innerHTML = '';
    selectedPhotos.forEach(function (file, i) {
      var fig = document.createElement('figure');
      var img = document.createElement('img');
      img.alt = 'Aperçu : ' + file.name;
      img.src = URL.createObjectURL(file);
      var cap = document.createElement('figcaption');
      cap.textContent = i === 0 ? 'Couverture' : String(i + 1);
      fig.appendChild(img); fig.appendChild(cap);
      preview.appendChild(fig);
    });
  }

  function onPhotosSelected(event) {
    var files = Array.prototype.slice.call(event.target.files || []);
    if (files.length > MAX_PHOTOS) { event.target.value = ''; selectedPhotos = []; renderPhotoPreviews(); setAlert('listingFeedback', 'Vous pouvez ajouter ' + MAX_PHOTOS + ' photos maximum.', 'error'); return; }
    if (files.some(function (f) { return PHOTO_TYPES.indexOf(f.type) < 0 || f.size > MAX_PHOTO_BYTES; })) {
      event.target.value = ''; selectedPhotos = []; renderPhotoPreviews();
      setAlert('listingFeedback', 'Chaque photo doit être en JPG, PNG ou WebP et faire 5 Mo maximum.', 'error');
      return;
    }
    setAlert('listingFeedback', '');
    selectedPhotos = files;
    renderPhotoPreviews();
  }

  async function callCreateListing(args) {
    var res = await supabaseClient.rpc('create_listing', args);
    // Compatibilité : ancienne signature sans p_photo_url.
    if (res.error && isMissingRpc(res.error) && 'p_photo_url' in args) {
      var retry = Object.assign({}, args);
      delete retry.p_photo_url;
      res = await supabaseClient.rpc('create_listing', retry);
    }
    return res;
  }

  async function submitListing(e) {
    e.preventDefault();
    var form = e.target, button = $('button[type="submit"]', form);
    if (!supabaseClient) { setAlert('listingFeedback', 'Le service est momentanément indisponible.', 'error'); return; }
    var user = await getCurrentAuthUser();
    if (!user) { closeModal(); state.pendingAction = 'publish'; openModal('login'); return; }
    if (!isPublisher()) { setAlert('listingFeedback', 'La publication est réservée aux comptes Entreprise et Indépendant.', 'error'); return; }
    if (!validateForm(form, 'listingFeedback')) return;
    var payload = {
      title: byId('fTitle').value.trim(), company: byId('fCompany').value.trim(), category: byId('fCategory').value,
      direction: byId('fDirection').value, description: byId('fDesc').value.trim(), city: byId('fCity').value.trim()
    };
    setBusy(button, true);
    setAlert('listingFeedback', selectedPhotos.length ? 'Envoi des photos…' : 'Publication en cours…', 'info');
    var uploaded = [];
    try {
      var photoUrls = [];
      for (var i = 0; i < selectedPhotos.length; i++) {
        var file = selectedPhotos[i];
        var ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        var path = user.id + '/' + crypto.randomUUID() + '.' + ext;
        setAlert('listingFeedback', 'Envoi de la photo ' + (i + 1) + ' sur ' + selectedPhotos.length + '…', 'info');
        var up = await supabaseClient.storage.from('listing-photos').upload(path, file, { contentType: file.type, upsert: false });
        if (up.error) throw up.error;
        uploaded.push(path);
        photoUrls.push(supabaseClient.storage.from('listing-photos').getPublicUrl(path).data.publicUrl);
      }
      var res = await callCreateListing({
        p_title: payload.title, p_company: payload.company, p_category: payload.category, p_direction: payload.direction,
        p_description: payload.description, p_city: payload.city, p_listing_type: 'Service', p_price: 'À discuter',
        p_photo_url: photoUrls[0] || null, p_photo_urls: photoUrls
      });
      if (res.error) throw res.error;
      form.reset(); selectedPhotos = []; renderPhotoPreviews(); updateCounters();
      setAlert('listingFeedback', '');
      closeModal();
      state.filters = { q: '', direction: 'all', category: 'all' };
      await loadListings();
      location.hash = '#espace-personnel';
      renderPersonalListings(user);
      showToast('Annonce publiée' + (photoUrls.length ? ' avec ' + plural(photoUrls.length, 'photo', 'photos') : '') + '.');
    } catch (err) {
      if (uploaded.length) { try { await supabaseClient.storage.from('listing-photos').remove(uploaded); } catch (c) { console.warn('Nettoyage photos temporaires', c); } }
      console.error('Publication annonce', err);
      setAlert('listingFeedback', 'Publication impossible : ' + friendlyError(err, 'vérifiez les champs et réessayez.'), 'error');
    } finally { setBusy(button, false); }
  }

  function updateCounters() {
    $$('[data-counter-for]').forEach(function (c) {
      var input = byId(c.getAttribute('data-counter-for'));
      if (input) c.textContent = input.value.length + ' / ' + input.maxLength;
    });
  }

  // Validation native avec messages en français, sans bulles du navigateur.
  function validateForm(form, feedbackId) {
    var invalid = null;
    $$('input, select, textarea', form).forEach(function (el) {
      if (el.closest('[hidden]') || el.type === 'file' || el.type === 'radio') return;
      var ok = el.checkValidity();
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !invalid) invalid = el;
    });
    if (!invalid) { if (feedbackId) setAlert(feedbackId, ''); return true; }
    var label = invalid.id ? $('label[for="' + invalid.id + '"]', form) : null;
    var name = label ? label.textContent.replace(/\(facultatif.*\)/i, '').trim() : 'Ce champ';
    var msg = invalid.validity.valueMissing ? '« ' + name + ' » est obligatoire.'
      : invalid.validity.typeMismatch && invalid.type === 'email' ? 'Saisissez une adresse e-mail valide.'
      : invalid.validity.typeMismatch && invalid.type === 'url' ? 'Saisissez une adresse web complète, commençant par https://'
      : invalid.validity.tooShort ? '« ' + name + ' » doit contenir au moins ' + invalid.minLength + ' caractères.'
      : '« ' + name + ' » n’est pas valide.';
    if (feedbackId) setAlert(feedbackId, msg, 'error');
    invalid.focus();
    return false;
  }

  /* --------------------------------------------- Inscription / connexion */

  var ACCOUNT_HINTS = {
    client: 'Consultez les annonces, enregistrez vos favoris et contactez les professionnels.',
    company: 'Publiez les services de votre entreprise et suivez leurs statistiques.',
    independent: 'Présentez votre activité d’indépendant et publiez vos offres.'
  };

  function signupType() { var r = $('input[name="accountType"]:checked'); return r ? r.value : 'client'; }

  function updateSignupFields() {
    var type = signupType();
    var company = type === 'company', independent = type === 'independent';
    $$('[data-signup="person"]').forEach(function (el) { el.hidden = company; $('input', el).required = !company; });
    $$('[data-signup="company"]').forEach(function (el) { el.hidden = !company; });
    $$('[data-signup="independent"]').forEach(function (el) { el.hidden = !independent; });
    $$('[data-signup="pro"]').forEach(function (el) { el.hidden = !(company || independent); });
    byId('sCompanyName').required = company;
    byId('sIndependentActivity').required = independent;
    byId('accountTypeHint').textContent = ACCOUNT_HINTS[type];
  }

  function openSignup(type) {
    if (type) { var radio = $('input[name="accountType"][value="' + type + '"]'); if (radio) radio.checked = true; }
    setAlert('signupFeedback', '');
    openModal('signup');
  }

  async function ensureCompanyRecord(user) {
    if (!supabaseClient || !user || (user.user_metadata && user.user_metadata.account_type) !== 'compagnie') return;
    var meta = user.user_metadata || {};
    var lookup = await supabaseClient.from('companies').select('id').eq('owner_id', user.id).maybeSingle();
    if (lookup.error) throw lookup.error;
    if (lookup.data) return;
    var legalName = String(meta.company_name || '').trim();
    if (!legalName) return;
    var insert = await supabaseClient.from('companies').insert({
      owner_id: user.id, legal_name: legalName,
      registration_number: String(meta.registration_number || '').trim() || null,
      country: String(meta.country || 'France'),
      registered_address: String(meta.company_address || '').trim() || null,
      representative_role: String(meta.representative_role || '').trim() || null
    });
    if (insert.error) throw insert.error;
  }

  async function submitSignup(e) {
    e.preventDefault();
    var form = e.target, button = $('button[type="submit"]', form);
    if (!supabaseClient) { setAlert('signupFeedback', 'Le service de compte est momentanément indisponible.', 'error'); return; }
    if (!validateForm(form, 'signupFeedback')) return;
    var type = signupType(), company = type === 'company', independent = type === 'independent';
    var fullName = byId('sFullName').value.trim().replace(/\s+/g, ' ');
    var companyName = byId('sCompanyName').value.trim();
    var email = byId('sEmail').value.trim().toLowerCase(), password = byId('sPassword').value;
    var phone = (company || independent) ? byId('sPhone').value.trim() : '';
    if (password.length < 10) { setAlert('signupFeedback', 'Choisissez un mot de passe de 10 caractères minimum.', 'error'); byId('sPassword').focus(); return; }
    var website = company ? byId('sCompanyWebsite').value.trim() : '';
    if (website && !/^https?:\/\//i.test(website)) { setAlert('signupFeedback', 'Le site internet doit commencer par https://', 'error'); return; }
    // Les clés de métadonnées sont lues par les fonctions SQL (profils, membres fondateurs) : ne pas les renommer.
    var metadata = {
      account_type: type === 'client' ? 'client' : (independent ? 'exportateur' : 'compagnie'),
      full_name: company ? companyName : fullName,
      phone: phone,
      country: byId('sCountry').value,
      independent_activity: independent ? byId('sIndependentActivity').value.trim() : '',
      independent_country: independent ? byId('sIndependentCountry').value : '',
      company_name: company ? companyName : '',
      representative_role: '',
      company_address: '',
      company_phone: company ? phone : '',
      company_website: website
    };
    if (phone) metadata.public_whatsapp_phone = phone;
    setBusy(button, true);
    try {
      var res = await supabaseClient.auth.signUp({ email: email, password: password, options: { data: metadata } });
      if (res.error) throw res.error;
      if (res.data.session && res.data.user) { try { await ensureCompanyRecord(res.data.user); } catch (err) { console.error('Profil entreprise à compléter', err); } }
      if (res.data.session) {
        form.reset(); updateSignupFields();
        closeModal();
        showToast('Compte créé. Vous êtes connecté.');
      } else {
        // Le formulaire reste rempli (sauf le mot de passe) pour corriger l'adresse si besoin.
        byId('sPassword').value = '';
        state.lastSignupEmail = email;
        showSignupFollowup(email);
      }
    } catch (err) {
      console.error('Inscription', err);
      setAlert('signupFeedback', friendlyError(err, 'Inscription impossible. Vérifiez les champs et réessayez.'), 'error');
    } finally { setBusy(button, false); }
  }

  function showSignupFollowup(email) {
    var box = byId('signupFeedback');
    setAlert(box, 'Compte créé. Un e-mail de confirmation vient d’être envoyé à ' + email + ' : cliquez sur le lien pour activer votre compte. Pensez à vérifier les courriers indésirables.', 'success');
    var actions = document.createElement('div');
    actions.className = 'signup-followup';
    actions.innerHTML = '<button type="button" class="btn btn-secondary btn-sm" data-action="resend-confirmation">Renvoyer l’e-mail</button><button type="button" class="btn btn-ghost btn-sm" data-action="edit-signup-email">Mauvaise adresse ? Modifier</button>';
    box.lastChild.appendChild(actions);
  }

  async function resendConfirmation(button) {
    var email = state.lastSignupEmail;
    if (!email || !supabaseClient) return;
    setBusy(button, true);
    try {
      var res = await supabaseClient.auth.resend({ type: 'signup', email: email });
      if (res.error) throw res.error;
      showToast('E-mail de confirmation renvoyé à ' + email + '.');
      // Supabase limite les renvois : on évite les clics répétés pendant une minute.
      setTimeout(function () { button.disabled = false; button.textContent = 'Renvoyer l’e-mail'; }, 60000);
      button.removeAttribute('aria-busy');
      button.disabled = true;
      button.textContent = 'E-mail renvoyé';
      return;
    } catch (err) {
      showToast('Renvoi impossible : ' + friendlyError(err, 'réessayez dans une minute.'), 'error');
    }
    setBusy(button, false);
  }

  // Fautes de frappe fréquentes dans les adresses e-mail.
  var EMAIL_DOMAIN_FIXES = {
    'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmai.com': 'gmail.com', 'gnail.com': 'gmail.com',
    'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmial.fr': 'hotmail.fr', 'hotmal.fr': 'hotmail.fr',
    'yaho.fr': 'yahoo.fr', 'yahooo.fr': 'yahoo.fr', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com',
    'outlok.com': 'outlook.com', 'outllok.com': 'outlook.com', 'outlook.co': 'outlook.com', 'outlok.fr': 'outlook.fr',
    'iclod.com': 'icloud.com', 'icoud.com': 'icloud.com', 'orage.fr': 'orange.fr', 'ornage.fr': 'orange.fr'
  };

  function suggestEmail() {
    var input = byId('sEmail'), hint = byId('sEmailSuggest');
    var value = input.value.trim().toLowerCase();
    var at = value.lastIndexOf('@');
    var fixed = at > 0 ? EMAIL_DOMAIN_FIXES[value.slice(at + 1)] : null;
    if (!fixed) { hint.hidden = true; hint.textContent = ''; return; }
    var suggestion = value.slice(0, at + 1) + fixed;
    hint.textContent = 'Vouliez-vous dire ' + suggestion + ' ? ';
    var apply = document.createElement('button');
    apply.type = 'button'; apply.className = 'link-btn'; apply.textContent = 'Corriger';
    apply.addEventListener('click', function () { input.value = suggestion; hint.hidden = true; input.focus(); });
    hint.appendChild(apply);
    hint.hidden = false;
  }

  async function submitLogin(e) {
    e.preventDefault();
    var form = e.target, button = $('button[type="submit"]', form);
    if (!supabaseClient) { setAlert('loginFeedback', 'La connexion au service est indisponible. Réessayez dans quelques instants.', 'error'); return; }
    if (!validateForm(form, 'loginFeedback')) return;
    var email = byId('lEmail').value.trim().toLowerCase(), password = byId('lPassword').value;
    setBusy(button, true);
    setAlert('loginFeedback', '');
    try {
      var res = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
      if (res.error) throw res.error;
      if (!res.data || !res.data.user) throw new Error('Email not confirmed');
      state.user = res.data.user;
      updateAuthNavigation();
      form.reset();
      var pendingAction = state.pendingAction, pendingHash = state.pendingHash;
      closeModal();
      showToast('Vous êtes connecté.');
      // Tâches secondaires : elles ne doivent pas bloquer l'ouverture de la session.
      ensureCompanyRecord(res.data.user).catch(function (err) { console.error('Profil entreprise à compléter', err); });
      if (pendingAction === 'publish') { openPublish(); return; }
      if (pendingHash) { if (location.hash === pendingHash) route(); else location.hash = pendingHash; return; }
      if (location.hash === '#espace-personnel') route(); else location.hash = '#espace-personnel';
    } catch (err) {
      console.error('Connexion', err);
      setAlert('loginFeedback', friendlyError(err, 'Connexion impossible. Vérifiez votre e-mail et votre mot de passe.'), 'error');
    } finally { setBusy(button, false); }
  }

  async function sendPasswordReset(button) {
    var input = byId('lEmail');
    var email = input.value.trim().toLowerCase();
    if (!email || !input.checkValidity()) { setAlert('loginFeedback', 'Saisissez votre adresse e-mail ci-dessus, puis cliquez à nouveau sur « Mot de passe oublié ? ».', 'info'); input.focus(); return; }
    if (!supabaseClient) { setAlert('loginFeedback', 'Le service de compte est indisponible.', 'error'); return; }
    button.disabled = true;
    try {
      var res = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (res.error) throw res.error;
      setAlert('loginFeedback', 'Si un compte existe avec cette adresse, un lien de réinitialisation vient d’être envoyé. Vérifiez aussi vos courriers indésirables.', 'success');
    } catch (err) {
      setAlert('loginFeedback', 'Envoi impossible : ' + friendlyError(err, 'réessayez plus tard.'), 'error');
    } finally { button.disabled = false; }
  }

  async function submitResetPassword(e) {
    e.preventDefault();
    var form = e.target, button = $('button[type="submit"]', form);
    var password = byId('newAccountPassword').value;
    if (password.length < 10) { setAlert('resetPasswordFeedback', 'Le mot de passe doit contenir au moins 10 caractères.', 'error'); return; }
    setBusy(button, true);
    try {
      var res = await supabaseClient.auth.updateUser({ password: password });
      if (res.error) throw res.error;
      form.reset();
      setAlert('resetPasswordFeedback', 'Mot de passe modifié. Vous êtes connecté.', 'success');
      setTimeout(function () { closeModal(); location.hash = '#espace-personnel'; }, 1200);
    } catch (err) {
      setAlert('resetPasswordFeedback', friendlyError(err, 'Impossible de modifier le mot de passe.'), 'error');
    } finally { setBusy(button, false); }
  }

  async function submitContact(e) {
    e.preventDefault();
    var form = e.target, button = $('button[type="submit"]', form);
    if (!validateForm(form, 'contactFeedback')) return;
    var payload = { name: byId('cName').value.trim(), email: byId('cEmail').value.trim(), subject: byId('cSubject').value.trim(), message: byId('cMessage').value.trim() };
    setBusy(button, true);
    try {
      if (!supabaseClient) throw new Error('indisponible');
      var res = await supabaseClient.functions.invoke('contact-form', { body: payload });
      if (res.error || !res.data || !res.data.ok) throw res.error || new Error('envoi');
      form.reset();
      setAlert('contactFeedback', 'Message envoyé. Nous vous répondrons par e-mail dans les meilleurs délais.', 'success');
    } catch (err) {
      console.warn('Formulaire de contact', err);
      // Repli : le message est préparé dans la messagerie du visiteur.
      var mailto = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Gab X-Port : ' + payload.subject) + '&body=' + encodeURIComponent(payload.message + '\n\n' + payload.name + ' — ' + payload.email);
      var box = byId('contactFeedback');
      setAlert(box, 'L’envoi direct est indisponible pour le moment. Votre message est prêt à partir depuis votre messagerie :', 'warning');
      var link = document.createElement('a');
      link.href = mailto; link.className = 'btn btn-secondary btn-sm'; link.textContent = 'Ouvrir ma messagerie';
      link.style.marginLeft = 'auto';
      box.appendChild(link);
    } finally { setBusy(button, false); }
  }

  async function logoutAccount() {
    if (!supabaseClient) return;
    var res = await supabaseClient.auth.signOut();
    if (res.error) { showToast('Déconnexion impossible : ' + friendlyError(res.error), 'error'); return; }
    state.user = null;
    updateAuthNavigation();
    location.hash = '#accueil';
    showToast('Vous êtes déconnecté.');
  }

  async function requestAccountDeactivation() {
    if (!supabaseClient) return;
    var ok = await confirmDialog('Votre compte sera désactivé immédiatement puis supprimé définitivement dans 30 jours, avec ses annonces et ses données. Si vous vous reconnectez avant cette date, la suppression est annulée.', { title: 'Supprimer votre compte ?', confirmLabel: 'Désactiver mon compte', danger: true });
    if (!ok) return;
    closeModal();
    var button = byId('deactivateAccountBtn');
    setBusy(button, true);
    try {
      var user = await getCurrentAuthUser();
      if (!user) throw new Error('Connectez-vous pour continuer.');
      var res = await supabaseClient.rpc('request_account_deletion');
      if (res.error) throw res.error;
      await supabaseClient.auth.signOut();
      state.user = null;
      updateAuthNavigation();
      location.hash = '#accueil';
      showToast('Compte désactivé. Suppression définitive dans 30 jours, sauf reconnexion d’ici là.');
    } catch (err) {
      showToast('Désactivation impossible : ' + friendlyError(err, 'réessayez plus tard.'), 'error');
    } finally { setBusy(button, false); }
  }

  /* ---------------------------------------------------- Espace personnel */

  async function loadFoundingMemberStatus(accountType) {
    var panel = byId('foundingMemberPanel');
    panel.hidden = true;
    if (!supabaseClient || !state.user || COMPANY_TYPES.indexOf(accountType) < 0) return;
    try {
      // RPC sécurisée : Supabase ne retourne que le statut lié à auth.uid().
      var res = await supabaseClient.rpc('get_my_founding_member_status');
      if (res.error) throw res.error;
      var row = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!row || !row.is_founding_member || row.benefit_status !== 'active') return;
      var free = row.benefit_tier === 'founder_free';
      byId('foundingMemberTitle').textContent = free ? 'Membre fondateur — Cercle des 5' : 'Partenaire fondateur — Cercle des 15';
      byId('foundingMemberDescription').textContent = free
        ? 'Votre entreprise fait partie des 5 premières inscrites. Son statut de fondatrice est conservé pour l’application des avantages prévus au lancement de la monétisation.'
        : 'Votre entreprise fait partie des 10 entreprises suivantes. La réduction de 50 % prévue sera associée à ce compte au lancement de la monétisation.';
      panel.hidden = false;
    } catch (err) { console.warn('Statut membre fondateur non disponible', err); }
  }

  function setAvatar(url, name) {
    var safe = safePhotoUrl(String(url || '').split('?')[0]) ? url : '';
    $$('[data-avatar]').forEach(function (el) {
      var img = $('img', el);
      var letters = $('[data-avatar-initials]', el);
      if (letters) letters.textContent = initials(name);
      if (safe) {
        if (!img) { img = document.createElement('img'); img.alt = ''; el.appendChild(img); }
        img.src = safe;
      } else if (img) img.remove();
    });
  }

  async function loadPersonalSpace() {
    var status = byId('accountStatus');
    var user = state.user;
    if (!supabaseClient || !user) return;
    var meta = user.user_metadata || {};
    byId('accountEmail').value = user.email || '';
    byId('accountDisplayEmail').textContent = user.email || '';
    setAlert(status, '');
    var profile = null;
    var res = await supabaseClient.from('profiles').select('full_name,phone,country,account_type').eq('id', user.id).maybeSingle();
    if (res.error) { console.error('Chargement du profil', res.error); setAlert(status, 'Impossible de charger le profil : ' + friendlyError(res.error), 'error'); }
    else profile = res.data;
    var accountType = (profile && profile.account_type) || meta.account_type || '';
    var isCompany = COMPANY_TYPES.indexOf(accountType) >= 0;
    var isIndependent = accountType === 'exportateur' || accountType === 'independent';
    var fullName = isCompany ? (meta.company_name || (profile && profile.full_name) || meta.full_name || '') : ((profile && profile.full_name) || meta.full_name || '');
    $('label[for="accountFullName"]').textContent = isCompany ? 'Nom de l’entreprise' : 'Nom complet';
    byId('accountFullName').value = fullName;
    byId('companyProfileFields').hidden = !isCompany;
    byId('accountCompanyWebsite').value = meta.company_website || '';
    var country = (profile && profile.country) || meta.country || 'Gabon';
    var countrySelect = byId('accountCountry');
    if (!$$('option', countrySelect).some(function (o) { return o.value === country; })) {
      var extra = document.createElement('option');
      extra.value = country; extra.textContent = country;
      countrySelect.insertBefore(extra, countrySelect.lastElementChild);
    }
    countrySelect.value = country;
    byId('publicContactMethod').value = meta.public_contact_method === 'email' ? 'email' : 'whatsapp';
    syncContactFields();
    byId('publicWhatsAppPhone').value = meta.public_whatsapp_phone || meta.company_phone || meta.phone || (profile && profile.phone) || '';
    byId('publicContactEmail').value = meta.public_contact_email || '';
    byId('independentProfileFields').hidden = !isIndependent;
    byId('independentActivityProfile').value = meta.independent_activity || '';
    byId('accountDisplayName').textContent = fullName || 'Membre Gab X-Port';
    byId('accountTypeBadge').textContent = accountLabel(accountType);
    setAvatar(meta.avatar_url, fullName);
    loadFoundingMemberStatus(accountType);
    if (isPublisher()) renderPersonalListings(user);
  }

  function syncContactFields() {
    var email = byId('publicContactMethod').value === 'email';
    byId('whatsappContactField').hidden = email;
    byId('emailContactField').hidden = !email;
    byId('publicContactEmail').required = email && isPublisher();
  }

  async function submitProfile(e) {
    e.preventDefault();
    var form = e.target, status = byId('accountStatus'), button = $('button[type="submit"]', form);
    var user = await getCurrentAuthUser();
    if (!supabaseClient || !user) { setAlert(status, 'Connectez-vous avant de modifier votre profil.', 'error'); return; }
    if (!validateForm(form, 'accountStatus')) return;
    var payload = { full_name: byId('accountFullName').value.trim(), country: byId('accountCountry').value };
    setBusy(button, true);
    try {
      var res = await supabaseClient.from('profiles').update(payload).eq('id', user.id);
      if (res.error) throw res.error;
      var currentType = role();
      var data = {
        public_contact_method: byId('publicContactMethod').value,
        public_whatsapp_phone: byId('publicWhatsAppPhone').value.trim(),
        public_contact_email: byId('publicContactEmail').value.trim()
      };
      if (currentType === 'exportateur') data.independent_activity = byId('independentActivityProfile').value.trim();
      else if (COMPANY_TYPES.indexOf(currentType) >= 0) {
        data.full_name = payload.full_name; data.company_name = payload.full_name;
        data.company_website = byId('accountCompanyWebsite').value.trim();
      }
      var meta = await supabaseClient.auth.updateUser({ data: data });
      if (meta.error) throw meta.error;
      if (meta.data && meta.data.user) state.user = meta.data.user;
      byId('accountDisplayName').textContent = payload.full_name;
      updateAuthNavigation();
      setAlert(status, 'Profil enregistré.', 'success');
      showToast('Votre profil a été mis à jour.');
    } catch (err) {
      console.error('Mise à jour du profil', err);
      setAlert(status, 'Enregistrement impossible : ' + friendlyError(err), 'error');
    } finally { setBusy(button, false); }
  }

  async function uploadAvatar(e) {
    var input = e.target, file = input.files && input.files[0];
    if (!file) return;
    var status = byId('accountStatus');
    if (PHOTO_TYPES.indexOf(file.type) < 0) { setAlert(status, 'Format accepté : JPG, PNG ou WebP.', 'error'); input.value = ''; return; }
    if (file.size > MAX_PHOTO_BYTES) { setAlert(status, 'La photo doit faire 5 Mo maximum.', 'error'); input.value = ''; return; }
    var user = await getCurrentAuthUser();
    if (!user) { setAlert(status, 'Connectez-vous pour ajouter une photo.', 'error'); return; }
    setAlert(status, 'Envoi de la photo…', 'info');
    try {
      var ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      var path = user.id + '/avatar.' + ext;
      var up = await supabaseClient.storage.from('profile-photos').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
      if (up.error) throw up.error;
      var avatarUrl = supabaseClient.storage.from('profile-photos').getPublicUrl(path).data.publicUrl + '?v=' + Date.now();
      var res = await supabaseClient.auth.updateUser({ data: { avatar_url: avatarUrl } });
      if (res.error) throw res.error;
      if (res.data && res.data.user) state.user = res.data.user;
      setAvatar(avatarUrl, byId('accountFullName').value);
      setAlert(status, 'Photo de profil mise à jour.', 'success');
    } catch (err) {
      console.error('Photo de profil', err);
      setAlert(status, 'Impossible d’ajouter la photo : ' + friendlyError(err, 'vérifiez votre connexion.'), 'error');
    } finally { input.value = ''; }
  }

  async function renderPersonalListings(user) {
    var container = byId('personalListings');
    if (!container || !user || !supabaseClient) return;
    container.innerHTML = skeletonCards(2);
    var res = await supabaseClient.from('listings').select(LISTING_COLUMNS).eq('owner_id', user.id).order('created_at', { ascending: false });
    if (res.error && res.error.code === '42703') res = await supabaseClient.from('listings').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    if (res.error) { container.innerHTML = emptyState('alert', 'Impossible de charger vos annonces', friendlyError(res.error), '', true); return; }
    var rows = res.data || [];
    if (!rows.length) {
      container.innerHTML = emptyState('grid', 'Aucune annonce publiée', 'Publiez votre premier service : il sera visible immédiatement par tous les visiteurs.', '<button type="button" class="btn btn-accent" data-action="open-publish">Publier ma première annonce</button>');
      return;
    }
    var metricsById = {};
    try {
      var metrics = await supabaseClient.rpc('get_my_listing_metrics');
      if (metrics.error) throw metrics.error;
      (metrics.data || []).forEach(function (m) { metricsById[String(m.listing_id)] = { views: Number(m.views_count) || 0, favorites: Number(m.favorites_count) || 0 }; });
    } catch (err) { console.warn('Statistiques des annonces indisponibles', err); }
    container.innerHTML = rows.map(function (row) {
      var x = mapListing(row);
      return listingCardHtml(x, 'owner', { stats: metricsById[x.id] || { views: 0, favorites: 0 } });
    }).join('');
  }

  async function deleteListing(id) {
    var ok = await confirmDialog('Cette annonce sera retirée définitivement de Gab X-Port.', { title: 'Supprimer l’annonce ?', confirmLabel: 'Supprimer', danger: true });
    if (!ok) return;
    closeModal();
    var res = await supabaseClient.from('listings').delete().eq('id', id);
    if (res.error) { showToast('Suppression impossible : ' + friendlyError(res.error), 'error'); return; }
    state.listings = state.listings.filter(function (x) { return x.id !== String(id); });
    renderAllListings();
    if (state.user) await renderPersonalListings(state.user);
    showToast('Annonce supprimée.');
  }

  /* ----------------------------------------------------------- Messagerie */

  var chat = { activeId: null, rows: [], messages: [], channel: null };

  async function loadChats(keepSelection) {
    var list = byId('chatList');
    if (!supabaseClient || !state.user) { list.innerHTML = '<p class="chat-empty">Connectez-vous pour voir vos conversations.</p>'; chat.rows = []; chat.activeId = null; renderActiveChat(); return; }
    try {
      var user = state.user;
      var res = await supabaseClient.from('conversations').select('id,participant_1,participant_2,subject,created_at').order('created_at', { ascending: false });
      if (res.error) throw res.error;
      var rows = res.data || [];
      var otherIds = Array.from(new Set(rows.map(function (c) { return c.participant_1 === user.id ? c.participant_2 : c.participant_1; })));
      var profiles = [];
      if (otherIds.length) { var p = await supabaseClient.rpc('get_conversation_contacts', { contact_ids: otherIds }); if (!p.error) profiles = p.data || []; }
      chat.rows = rows.map(function (c) {
        var other = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        return Object.assign({}, c, { otherId: other, otherProfile: profiles.filter(function (pr) { return pr.id === other; })[0] });
      });
      if (!keepSelection || !chat.rows.some(function (c) { return c.id === chat.activeId; })) chat.activeId = window.innerWidth > 900 && chat.rows[0] ? chat.rows[0].id : null;
      renderChatList();
      if (chat.activeId) { await loadMessages(chat.activeId); subscribeChat(); } else renderActiveChat();
    } catch (e) { console.error(e); showToast('Impossible de charger les conversations : ' + friendlyError(e), 'error'); }
  }

  function renderChatList() {
    var list = byId('chatList');
    if (!chat.rows.length) { list.innerHTML = '<p class="chat-empty">Aucune conversation. Recherchez un membre ci-dessus pour démarrer un échange.</p>'; return; }
    list.innerHTML = chat.rows.map(function (c) {
      var name = (c.otherProfile && c.otherProfile.full_name) || 'Membre Gab X-Port';
      var last = chat.messages.filter(function (m) { return m.conversation_id === c.id; }).slice(-1)[0];
      return '<button type="button" class="chat-thread" data-action="select-chat" data-id="' + esc(c.id) + '"' + (c.id === chat.activeId ? ' aria-current="true"' : '') + '><span class="avatar">' + esc(initials(name)) + '</span><span><strong>' + esc(name) + '</strong><small>' + esc((last && last.body) || c.subject || 'Démarrer la discussion') + '</small></span></button>';
    }).join('');
  }

  async function loadMessages(conversationId) {
    try {
      var res = await supabaseClient.from('messages').select('id,conversation_id,sender_id,body,created_at,read_at').eq('conversation_id', conversationId).order('created_at', { ascending: true });
      if (res.error) throw res.error;
      chat.messages = chat.messages.filter(function (m) { return m.conversation_id !== conversationId; }).concat(res.data || []);
      var unread = (res.data || []).filter(function (m) { return m.sender_id !== state.user.id && !m.read_at; }).map(function (m) { return m.id; });
      if (unread.length) {
        var now = new Date().toISOString();
        var up = await supabaseClient.from('messages').update({ read_at: now }).in('id', unread);
        if (up.error) console.warn('Lecture non marquée', up.error);
        else chat.messages = chat.messages.map(function (m) { return unread.indexOf(m.id) >= 0 ? Object.assign({}, m, { read_at: now }) : m; });
      }
      renderActiveChat(); renderChatList();
    } catch (e) { console.error(e); showToast('Impossible de charger les messages : ' + friendlyError(e), 'error'); }
  }

  function renderActiveChat() {
    var c = chat.rows.filter(function (x) { return x.id === chat.activeId; })[0];
    var box = byId('chatMessages'), input = byId('chatInput'), send = $('#chatCompose button[type="submit"]');
    byId('messaging').classList.toggle('is-reading', !!c);
    if (!c) {
      byId('chatPartner').textContent = 'Aucune conversation sélectionnée';
      byId('chatSubtitle').textContent = 'Choisissez une conversation à gauche';
      box.innerHTML = '<div class="chat-empty">Vos messages privés apparaîtront ici.</div>';
      input.disabled = true; send.disabled = true; return;
    }
    var name = (c.otherProfile && c.otherProfile.full_name) || 'Membre Gab X-Port';
    byId('chatPartner').textContent = name;
    byId('chatSubtitle').textContent = accountLabel(c.otherProfile && c.otherProfile.account_type) + ' · échange privé';
    var msgs = chat.messages.filter(function (m) { return m.conversation_id === c.id; });
    box.innerHTML = msgs.length ? msgs.map(function (m) {
      var mine = m.sender_id === state.user.id;
      return '<div class="bubble ' + (mine ? 'me' : 'them') + '">' + esc(m.body) + '<span class="time">' + esc(formatDate(m.created_at, true)) + (mine ? ' · ' + (m.read_at ? 'Lu' : 'Envoyé') : '') + '</span></div>';
    }).join('') : '<div class="chat-empty">Démarrez la conversation en envoyant votre premier message.</div>';
    box.scrollTop = box.scrollHeight;
    input.disabled = false; send.disabled = false;
  }

  function subscribeChat() {
    if (!supabaseClient || !chat.activeId) return;
    if (chat.channel) { supabaseClient.removeChannel(chat.channel); chat.channel = null; }
    var id = chat.activeId;
    chat.channel = supabaseClient.channel('gabxport-chat-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + id }, function () { if (chat.activeId === id) loadMessages(id); })
      .subscribe();
  }

  async function searchContacts(e) {
    e.preventDefault();
    var term = byId('chatSearch').value.trim(), results = byId('chatResults');
    if (term.length < 2) { results.innerHTML = '<p class="hint">Saisissez au moins 2 caractères.</p>'; return; }
    try {
      var res = await supabaseClient.rpc('search_contact_profiles', { search_text: term });
      if (res.error) throw res.error;
      var matches = (res.data || []).filter(function (p) { return p.id !== state.user.id; });
      results.innerHTML = matches.length ? matches.slice(0, 8).map(function (p) {
        return '<button type="button" class="chat-thread" data-action="start-chat" data-id="' + esc(p.id) + '"><span class="avatar">' + esc(initials(p.full_name)) + '</span><span><strong>' + esc(p.full_name) + '</strong><small>' + esc(accountLabel(p.account_type)) + (p.country ? ' · ' + esc(p.country) : '') + '</small></span></button>';
      }).join('') : '<p class="hint">Aucun membre trouvé pour « ' + esc(term) + ' ».</p>';
    } catch (err) { results.innerHTML = '<p class="hint">Recherche indisponible.</p>'; console.error(err); }
  }

  async function startConversation(otherId) {
    var user = state.user;
    if (!user || !isSafeId(otherId) || otherId === user.id) return;
    try {
      var pair = [user.id, otherId].sort();
      var found = await supabaseClient.from('conversations').select('id').eq('participant_1', pair[0]).eq('participant_2', pair[1]).maybeSingle();
      if (found.error) throw found.error;
      var id = found.data && found.data.id;
      if (!id) {
        var created = await supabaseClient.from('conversations').insert({ participant_1: pair[0], participant_2: pair[1], created_by: user.id, subject: 'Mise en relation Gab X-Port' }).select('id').single();
        if (created.error && created.error.code === '23505') {
          var retry = await supabaseClient.from('conversations').select('id').eq('participant_1', pair[0]).eq('participant_2', pair[1]).single();
          if (retry.error) throw retry.error;
          id = retry.data.id;
        } else if (created.error) throw created.error;
        else id = created.data.id;
      }
      byId('chatResults').innerHTML = ''; byId('chatSearch').value = '';
      await loadChats(false);
      chat.activeId = id;
      renderChatList();
      await loadMessages(id); subscribeChat();
    } catch (e) { console.error(e); showToast('Impossible de démarrer la conversation : ' + friendlyError(e), 'error'); }
  }

  async function sendMessage(e) {
    e.preventDefault();
    var input = byId('chatInput'), body = input.value.trim();
    if (!body || !state.user) return;
    var c = chat.rows.filter(function (x) { return x.id === chat.activeId; })[0];
    if (!c) return;
    var button = $('button[type="submit"]', e.target);
    setBusy(button, true);
    try {
      var res = await supabaseClient.from('messages').insert({ conversation_id: c.id, sender_id: state.user.id, body: body });
      if (res.error) throw res.error;
      input.value = '';
      // Avec l'abonnement temps réel, l'insertion recharge déjà la conversation.
      if (!chat.channel) await loadMessages(c.id);
    } catch (err) { console.error(err); showToast('Message non envoyé : ' + friendlyError(err), 'error'); }
    finally { setBusy(button, false); input.focus(); }
  }

  /* --------------------------------------------------- Navigation (SPA) */

  var AUTH_VIEWS = { 'espace-personnel': true, 'messagerie': true, 'annonce': true };

  function parseHash() {
    var raw = (location.hash || '').replace(/^#/, '');
    try { raw = decodeURIComponent(raw); } catch (e) { raw = ''; }
    var parts = raw.split('/');
    var name = parts[0] || 'accueil';
    var param = parts[1] || '';
    var aliases = { accueil: 'home', home: 'home', faq: 'home', 'comment-ca-marche': 'home', entreprises: 'annonces', accompagnement: 'home' };
    return { view: aliases[name] || name, anchor: (name === 'faq' || name === 'comment-ca-marche') ? name : '', param: param };
  }

  function setActiveView(name) {
    $$('.view').forEach(function (v) { v.classList.toggle('is-active', v.id === 'view-' + name); });
    var navName = name === 'annonce' ? 'annonces' : name === 'profil-offreur' ? 'annonces' : name;
    $$('[data-view]').forEach(function (a) {
      if (a.closest('.footer-links') || a.classList.contains('brand') || a.closest('.section-head') || a.closest('.account-nav')) return;
      if (a.getAttribute('data-view') === navName) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $$('.view-title').forEach(function (h) {
      if (h.closest('.view.is-active')) { h.setAttribute('role', 'heading'); h.setAttribute('aria-level', '1'); }
      else { h.removeAttribute('role'); h.removeAttribute('aria-level'); }
    });
    var view = byId('view-' + name);
    if (view && view.getAttribute('data-title') && name !== 'annonce' && name !== 'profil-offreur') document.title = view.getAttribute('data-title');
  }

  async function route() {
    var r = parseHash();
    var known = { home: 1, annonces: 1, annonce: 1, favoris: 1, historique: 1, 'espace-personnel': 1, messagerie: FEATURES.messaging ? 1 : 0, profil: 1 };
    if (!known[r.view]) { history.replaceState(null, '', '#accueil'); r = { view: 'home', anchor: '', param: '' }; }
    if ((r.view === 'annonce' || r.view === 'profil') && !isSafeId(r.param)) { location.replace('#annonces'); return; }

    if (AUTH_VIEWS[r.view] || r.view === 'profil') {
      var user = await getCurrentAuthUser();
      if (!user) {
        state.pendingHash = location.hash;
        var fallback = state.lastHash && state.lastHash !== location.hash ? state.lastHash : '#annonces';
        history.replaceState(null, '', fallback);
        if (!$('.view.is-active')) setActiveView(parseHash().view);
        openModal('login', { subtitle: r.view === 'annonce' ? 'Créez un compte ou connectez-vous pour consulter le détail des annonces et contacter les professionnels.' : undefined });
        return;
      }
    }

    var viewName = r.view === 'profil' ? 'profil-offreur' : r.view;
    var previous = $('.view.is-active');
    setActiveView(viewName);
    state.lastHash = location.hash || '#accueil';

    if (r.view === 'annonces') renderListings();
    if (r.view === 'favoris') { renderFavorites(); syncAccountState(); }
    if (r.view === 'historique') { renderHistory(); syncAccountState(); }
    if (r.view === 'annonce') showListingRoute(r.param);
    if (r.view === 'profil') renderOffererProfile(r.param);
    if (r.view === 'espace-personnel') loadPersonalSpace();
    if (r.view === 'messagerie') loadChats(true);

    if (r.anchor) {
      var target = byId(r.anchor);
      if (target) requestAnimationFrame(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    } else if (previous !== byId('view-' + viewName) || r.view === 'annonce' || r.view === 'profil') {
      window.scrollTo(0, 0);
    }
  }

  function goBack() {
    if (state.navCount > 0) history.back();
    else location.hash = '#annonces';
  }

  /* ------------------------------------------------- Session et en-tête */

  function updateAuthNavigation() {
    var user = state.user, connected = !!user;
    var meta = (user && user.user_metadata) || {};
    $$('[data-auth="guest"]').forEach(function (el) { el.hidden = connected; });
    $$('[data-auth="member"]').forEach(function (el) { el.hidden = !connected; });
    $$('[data-requires="publisher"]').forEach(function (el) { el.hidden = !isPublisher(); });
    $$('[data-feature="messaging"]').forEach(function (el) { el.hidden = !(FEATURES.messaging && connected); });
    var proBand = $('[data-pro-band]');
    if (proBand) proBand.hidden = connected && role() !== 'client';
    var name = meta.company_name || meta.full_name || (user && user.email) || 'Mon espace';
    $$('[data-account-name]').forEach(function (el) { el.textContent = connected ? name.split(' ')[0] : 'Mon espace'; });
    if (connected) setAvatar(meta.avatar_url, name);
  }

  function initAuth() {
    if (!supabaseClient) { updateAuthNavigation(); return Promise.resolve(); }
    supabaseClient.auth.onAuthStateChange(function (event, session) {
      var hadUser = !!state.user;
      state.user = (session && session.user) || null;
      if (event === 'PASSWORD_RECOVERY') setTimeout(function () { openModal('resetPassword'); }, 0);
      if (event === 'SIGNED_IN' && session && session.user) {
        setTimeout(function () {
          supabaseClient.rpc('cancel_account_deletion').then(function (r) { if (r.error) console.warn('Annulation de la suppression programmée', r.error); });
          syncAccountState();
        }, 0);
      }
      if (event === 'SIGNED_OUT') {
        clearAccountCaches();
        if (chat.channel) { supabaseClient.removeChannel(chat.channel); chat.channel = null; }
        var v = parseHash().view;
        if (hadUser && (AUTH_VIEWS[v] || v === 'profil')) location.hash = '#accueil';
      }
      updateAuthNavigation();
    });
    return supabaseClient.auth.getSession().then(function (res) {
      state.user = (res.data && res.data.session && res.data.session.user) || null;
      updateAuthNavigation();
      if (state.user) {
        syncAccountState();
        ensureCompanyRecord(state.user).catch(function (err) { console.error('Profil entreprise à compléter', err); });
      }
    });
  }

  /* ------------------------------------------------------------ En-tête */

  function onScroll() {
    var header = byId('siteHeader');
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 4);
  }

  /* -------------------------------------------- Délégation des actions */

  var ACTIONS = {
    'open-login': function () { setAlert('loginFeedback', ''); openModal('login'); },
    'open-signup': function (el) { openSignup(el.getAttribute('data-account-type')); },
    'open-publish': function () { openPublish(); },
    'open-contact': function () { setAlert('contactFeedback', ''); openModal('contact'); },
    'close-modal': closeModal,
    'confirm-ok': function () { var r = confirmResolver; confirmResolver = null; if (r) r(true); },
    'confirm-cancel': function () { closeModal(); },
    'toggle-password': function (el) {
      var input = $('input', el.parentNode), show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      el.setAttribute('aria-pressed', String(show));
      el.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
      $('use', el).setAttribute('href', show ? '#i-eye-off' : '#i-eye');
    },
    'send-password-reset': function (el) { sendPasswordReset(el); },
    'resend-confirmation': function (el) { resendConfirmation(el); },
    'edit-signup-email': function () { setAlert('signupFeedback', ''); var input = byId('sEmail'); input.focus(); input.select(); },
    'toggle-favorite': function (el) { toggleFavorite(el.getAttribute('data-id')).then(function () { if (parseHash().view === 'annonce') renderListingDetail(state.currentListingId); }); },
    'open-listing': function (el) { openListing(el.getAttribute('data-id')); },
    'contact-listing': function (el) { contactListing(el.getAttribute('data-id')); },
    'contact-offerer': function (el) { openDirectContact(el.getAttribute('data-id'), ''); },
    'gallery': function (el) {
      var index = Number(el.getAttribute('data-index'));
      var x = findListing(state.currentListingId);
      if (!x || !x.photoUrls[index]) return;
      byId('galleryMain').src = x.photoUrls[index];
      byId('galleryMain').alt = 'Photo ' + (index + 1) + ' : ' + x.title;
      $$('.gallery-thumbs button').forEach(function (b) { if (b === el) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    },
    'back': goBack,
    'filter-corridor': function (el) { state.filters = { q: '', direction: el.getAttribute('data-direction'), category: 'all' }; applyFilters({}); location.hash = '#annonces'; },
    'reset-filters': function () { applyFilters({ q: '', direction: 'all', category: 'all' }); },
    'reload-listings': function () { state.listingsStatus = 'loading'; renderAllListings(); loadListings(); },
    'reload-route': route,
    'clear-history': clearListingHistory,
    'delete-listing': function (el) { deleteListing(el.getAttribute('data-id')); },
    'logout': logoutAccount,
    'deactivate-account': requestAccountDeactivation,
    'select-chat': function (el) { chat.activeId = el.getAttribute('data-id'); renderChatList(); loadMessages(chat.activeId).then(subscribeChat); },
    'start-chat': function (el) { startConversation(el.getAttribute('data-id')); },
    'chat-back': function () { chat.activeId = null; renderActiveChat(); renderChatList(); }
  };

  function onClick(event) {
    var el = event.target.closest('[data-action]');
    if (el && ACTIONS[el.getAttribute('data-action')]) {
      if (el.tagName === 'A') event.preventDefault();
      ACTIONS[el.getAttribute('data-action')](el, event);
      return;
    }
    // Lien vers la vue déjà affichée : hashchange ne se déclenche pas.
    var link = event.target.closest('a[href^="#"]');
    if (link && link.getAttribute('href') === location.hash) { event.preventDefault(); route(); }
    if (event.target === byId('modal')) closeModal();
  }

  /* ------------------------------------------------------- Démarrage */

  function bindForms() {
    byId('loginForm').addEventListener('submit', submitLogin);
    byId('signupForm').addEventListener('submit', submitSignup);
    byId('resetPasswordForm').addEventListener('submit', submitResetPassword);
    byId('listingForm').addEventListener('submit', submitListing);
    byId('contactForm').addEventListener('submit', submitContact);
    byId('accountProfileForm').addEventListener('submit', submitProfile);
    byId('chatCompose').addEventListener('submit', sendMessage);
    byId('chatSearchForm').addEventListener('submit', searchContacts);
    byId('chatInput').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(hover: hover)').matches) { e.preventDefault(); byId('chatCompose').requestSubmit(); } });
    byId('fPhoto').addEventListener('change', onPhotosSelected);
    byId('sEmail').addEventListener('blur', suggestEmail);
    byId('sEmail').addEventListener('input', function () { if (!byId('sEmailSuggest').hidden) suggestEmail(); });
    byId('accountPhotoInput').addEventListener('change', uploadAvatar);
    byId('publicContactMethod').addEventListener('change', syncContactFields);
    $$('input[name="accountType"]').forEach(function (r) { r.addEventListener('change', updateSignupFields); });
    $$('[data-counter-for]').forEach(function (c) { var input = byId(c.getAttribute('data-counter-for')); if (input) input.addEventListener('input', updateCounters); });
    var drop = byId('photoDropzone');
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('is-over'); }); });
    $$('input, select, textarea').forEach(function (el) { el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true' && el.checkValidity()) el.setAttribute('aria-invalid', 'false'); }); });

    byId('heroSearch').addEventListener('submit', function (e) {
      e.preventDefault();
      state.filters = { q: byId('heroQuery').value.trim(), direction: byId('heroDirection').value, category: 'all' };
      applyFilters({});
      location.hash = '#annonces';
    });
    byId('searchForm').addEventListener('submit', function (e) {
      e.preventDefault();
      applyFilters({ q: byId('q').value, direction: byId('direction').value, category: byId('category').value });
    });
    var debounce;
    byId('q').addEventListener('input', function () { clearTimeout(debounce); debounce = setTimeout(function () { applyFilters({ q: byId('q').value }); }, 220); });
    byId('direction').addEventListener('change', function () { applyFilters({ direction: byId('direction').value }); });
    byId('category').addEventListener('change', function () { applyFilters({ category: byId('category').value }); });
  }

  async function init() {
    fillSelects();
    updateSignupFields();
    updateCounters();
    bindForms();
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', trapFocus);
    window.addEventListener('scroll', onScroll, { passive: true });
    state.navCount = 0;
    window.addEventListener('hashchange', function () { state.navCount++; closeModal(); route(); });
    onScroll();
    renderAllListings();

    if (!supabaseClient) showToast('Le service est momentanément indisponible. Certaines fonctions sont désactivées.', 'error');
    await initAuth();
    await route();
    loadListings();

    var params = new URLSearchParams(location.search);
    var requested = params.get('modal');
    if (requested) {
      history.replaceState(null, '', location.pathname + location.hash);
      if (requested === 'publish') openPublish();
      else if (requested === 'contact') ACTIONS['open-contact']();
      else if (requested === 'login') ACTIONS['open-login']();
      else if (requested === 'signup') openSignup(['client', 'company', 'independent'].indexOf(params.get('type')) >= 0 ? params.get('type') : null);
    }

    window.addEventListener('focus', function () { if (state.user) syncAccountState(); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && state.user) syncAccountState(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
