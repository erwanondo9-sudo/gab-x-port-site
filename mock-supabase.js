/* Faux client Supabase pour tester l'interface sans toucher à la vraie base.
   Utilisé uniquement par tests/harness.html. Aucune requête réseau.
   Comptes de test (mot de passe : motdepasse123) :
     pro@test.local     → Entreprise, membre fondateur
     client@test.local  → Client */
(function () {
  'use strict';
  var URL_BASE = 'https://dgglsjmhjeaggxcsbwby.supabase.co';
  var PASSWORD = 'motdepasse123';
  var now = Date.now();
  function iso(minutesAgo) { return new Date(now - minutesAgo * 60000).toISOString(); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  var users = {
    'pro@test.local': { id: 'u-pro', email: 'pro@test.local', user_metadata: { account_type: 'compagnie', company_name: 'Atlas Fret International', full_name: 'Atlas Fret International', country: 'Gabon', public_contact_method: 'whatsapp', public_whatsapp_phone: '+241 06 00 00 00' }, app_metadata: {} },
    'client@test.local': { id: 'u-client', email: 'client@test.local', user_metadata: { account_type: 'client', full_name: 'Awa Ndong', country: 'France' }, app_metadata: {} }
  };
  var db = {
    listings: [
      { id: 'l-1', owner_id: 'u-pro', title: 'Fret maritime groupé Le Havre → Libreville', company: 'Atlas Fret International', category: 'Transport & logistique', direction: 'fr-ga', description: 'Groupage conteneur mensuel depuis Le Havre.\nEnlèvement en Île-de-France, dédouanement via partenaire agréé à Owendo.\nDélai indicatif : 5 à 6 semaines.', city: 'Libreville, Gabon', listing_type: 'Service', price: 'Sur devis', photo_urls: [], status: 'published', created_at: iso(60) },
      { id: 'l-2', owner_id: 'u-other', title: 'Pièces détachées Toyota et Nissan — sourcing Dubaï et Japon', company: 'Hexa Auto Export', category: 'Automobile & pièces', direction: 'ga-fr', description: 'Recherche de références sur demande, envoi des photos avant achat.', city: 'Paris, France', listing_type: 'Service', price: 'À discuter', photo_urls: [], status: 'published', created_at: iso(600) },
      { id: 'l-3', owner_id: 'u-other', title: 'Import de produits agroalimentaires du Maroc', company: 'Saveurs Atlas', category: 'Agroalimentaire', direction: 'ma-ga', description: 'Huile d’olive, conserves, épices. Volumes palettisés, certificats sanitaires fournis.', city: 'Casablanca, Maroc', listing_type: 'Service', price: 'À discuter', photo_urls: [], status: 'published', created_at: iso(3000) }
    ],
    profiles: [
      { id: 'u-pro', full_name: 'Atlas Fret International', phone: '', country: 'Gabon', account_type: 'compagnie' },
      { id: 'u-client', full_name: 'Awa Ndong', phone: '', country: 'France', account_type: 'client' },
      { id: 'u-other', full_name: 'Hexa Auto Export', phone: '', country: 'France', account_type: 'compagnie' }
    ],
    companies: [{ id: 1, owner_id: 'u-pro', legal_name: 'Atlas Fret International', country: 'Gabon' }],
    conversations: [],
    messages: [],
    favorites: {},
    views: {}
  };
  var session = null;
  var listeners = [];
  var log = [];
  window.__mock = { db: db, log: log, users: users, failNext: {} };

  function emit(event) { listeners.forEach(function (cb) { cb(event, session ? clone(session) : null); }); }
  function ok(data) { return Promise.resolve({ data: data, error: null }); }
  function fail(message, code) { return Promise.resolve({ data: null, error: { message: message, code: code } }); }
  function uid() { return session && session.user.id; }

  function Query(table) { this.table = table; this.filters = []; this.op = 'select'; this.payload = null; this.wantSingle = null; this.cols = '*'; }
  Query.prototype.select = function (cols) { if (this.op === 'select') this.cols = cols || '*'; this.returning = true; return this; };
  Query.prototype.eq = function (c, v) { this.filters.push(function (r) { return String(r[c]) === String(v); }); return this; };
  Query.prototype.in = function (c, vs) { this.filters.push(function (r) { return vs.map(String).indexOf(String(r[c])) >= 0; }); return this; };
  Query.prototype.order = function (c, o) { this.sort = { c: c, asc: o && o.ascending }; return this; };
  Query.prototype.limit = function () { return this; };
  Query.prototype.maybeSingle = function () { this.wantSingle = 'maybe'; return this; };
  Query.prototype.single = function () { this.wantSingle = 'one'; return this; };
  Query.prototype.insert = function (p) { this.op = 'insert'; this.payload = p; return this; };
  Query.prototype.update = function (p) { this.op = 'update'; this.payload = p; return this; };
  Query.prototype.delete = function () { this.op = 'delete'; return this; };
  Query.prototype.then = function (resolve, reject) { return this.run().then(resolve, reject); };
  Query.prototype.run = function () {
    log.push({ table: this.table, op: this.op });
    var key = this.table + ':' + this.op;
    if (window.__mock.failNext[key]) { var m = window.__mock.failNext[key]; delete window.__mock.failNext[key]; return fail(m); }
    var rows = db[this.table] || [];
    var filters = this.filters;
    var match = function (r) { return filters.every(function (f) { return f(r); }); };
    if (this.op === 'insert') {
      var row = Object.assign({ id: 'id-' + Math.random().toString(36).slice(2, 9), created_at: new Date().toISOString() }, this.payload);
      rows.push(row);
      if (this.table === 'messages') setTimeout(function () { realtime.forEach(function (fn) { fn(); }); }, 10);
      return ok(this.wantSingle ? clone(row) : null);
    }
    if (this.op === 'update') { rows.filter(match).forEach(function (r) { Object.assign(r, this.payload); }, this); return ok(null); }
    if (this.op === 'delete') { db[this.table] = rows.filter(function (r) { return !match(r); }); return ok(null); }
    var out = rows.filter(match);
    if (this.table === 'conversations') out = out.filter(function (c) { return c.participant_1 === uid() || c.participant_2 === uid(); });
    if (this.sort) { var s = this.sort; out = out.slice().sort(function (a, b) { return (String(a[s.c]) < String(b[s.c]) ? -1 : 1) * (s.asc ? 1 : -1); }); }
    out = clone(out);
    if (this.wantSingle) return out.length || this.wantSingle === 'maybe' ? ok(out[0] || null) : fail('Not found', 'PGRST116');
    return ok(out);
  };

  var RPC = {
    get_my_listing_favorites: function () { return Object.keys(db.favorites[uid()] || {}); },
    set_listing_favorite: function (a) { var f = db.favorites[uid()] = db.favorites[uid()] || {}; if (a.p_is_favorite) f[a.p_listing_id] = 1; else delete f[a.p_listing_id]; return null; },
    record_listing_view: function (a) { var v = db.views[uid()] = db.views[uid()] || {}; v[a.p_listing_id] = new Date().toISOString(); return null; },
    get_my_listing_history: function () { var v = db.views[uid()] || {}; return Object.keys(v).map(function (k) { return { listing_id: k, viewed_at: v[k] }; }); },
    clear_my_listing_history: function () { db.views[uid()] = {}; return null; },
    get_my_listing_metrics: function () { return db.listings.filter(function (l) { return l.owner_id === uid(); }).map(function (l) { return { listing_id: l.id, views_count: 12, favorites_count: 3 }; }); },
    get_my_founding_member_status: function () { return uid() === 'u-pro' ? [{ is_founding_member: true, benefit_status: 'active', benefit_tier: 'founder_free', discount_percent: 100 }] : [{ is_founding_member: false }]; },
    get_public_offerer_profile: function (a) {
      var p = db.profiles.filter(function (x) { return x.id === a.p_user_id; })[0];
      if (!p || p.account_type === 'client') return [];
      return [{ id: p.id, display_name: p.full_name, country: p.country, account_type: p.account_type, activity: 'Transport et logistique entre l’Europe et l’Afrique centrale.', company_website: 'https://exemple.test', contact_method: 'whatsapp', whatsapp_phone: '+241 06 00 00 00' }];
    },
    create_listing: function (a) {
      if (['compagnie', 'company', 'exportateur', 'independent'].indexOf(session.user.user_metadata.account_type) < 0) throw new Error('La publication est réservée aux comptes Entreprise et Indépendant');
      db.listings.unshift({ id: 'l-' + Math.random().toString(36).slice(2, 7), owner_id: uid(), title: a.p_title, company: a.p_company, category: a.p_category, direction: a.p_direction, description: a.p_description, city: a.p_city, listing_type: a.p_listing_type, price: a.p_price, photo_urls: a.p_photo_urls || [], status: 'published', created_at: new Date().toISOString() });
      return null;
    },
    request_account_deletion: function () { window.__mock.deletionRequested = true; return null; },
    cancel_account_deletion: function () { window.__mock.deletionRequested = false; return null; },
    search_contact_profiles: function (a) { return db.profiles.filter(function (p) { return p.full_name.toLowerCase().indexOf(a.search_text.toLowerCase()) >= 0; }); },
    get_conversation_contacts: function (a) { return db.profiles.filter(function (p) { return a.contact_ids.indexOf(p.id) >= 0; }); }
  };

  function rpc(name, args) {
    log.push({ rpc: name, args: args });
    var promise = new Promise(function (resolve) {
      setTimeout(function () {
        if (window.__mock.failNext['rpc:' + name]) { var m = window.__mock.failNext['rpc:' + name]; delete window.__mock.failNext['rpc:' + name]; resolve({ data: null, error: { message: m } }); return; }
        if (!RPC[name]) { resolve({ data: null, error: { code: 'PGRST202', message: 'Could not find the function ' + name } }); return; }
        try { resolve({ data: clone(RPC[name](args || {})), error: null }); } catch (e) { resolve({ data: null, error: { message: e.message } }); }
      }, 120);
    });
    promise.maybeSingle = function () { return promise.then(function (r) { return r.error ? r : { data: Array.isArray(r.data) ? (r.data[0] || null) : r.data, error: null }; }); };
    return promise;
  }

  var realtime = [];
  var client = {
    auth: {
      getSession: function () { return ok({ session: session ? clone(session) : null }); },
      getUser: function () { return ok({ user: session ? clone(session.user) : null }); },
      onAuthStateChange: function (cb) { listeners.push(cb); setTimeout(function () { cb('INITIAL_SESSION', session ? clone(session) : null); }, 0); return { data: { subscription: { unsubscribe: function () {} } } }; },
      signInWithPassword: function (c) {
        var u = users[c.email];
        return new Promise(function (resolve) { setTimeout(function () {
          if (!u || c.password !== PASSWORD) { resolve({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } }); return; }
          session = { user: u };
          emit('SIGNED_IN');
          resolve({ data: { user: clone(u), session: clone(session) }, error: null });
        }, 300); });
      },
      signUp: function (c) {
        window.__mock.lastSignUp = clone(c);
        if (users[c.email]) return fail('User already registered');
        return new Promise(function (resolve) { setTimeout(function () { resolve({ data: { user: { id: 'u-new' }, session: null }, error: null }); }, 300); });
      },
      signOut: function () { session = null; emit('SIGNED_OUT'); return Promise.resolve({ error: null }); },
      updateUser: function (p) { if (p.data) Object.assign(session.user.user_metadata, p.data); window.__mock.lastUpdateUser = clone(p); emit('USER_UPDATED'); return ok({ user: clone(session.user) }); },
      resetPasswordForEmail: function (email) { window.__mock.lastReset = email; return Promise.resolve({ error: null }); },
      resend: function (p) { window.__mock.lastResend = clone(p); return Promise.resolve({ data: {}, error: null }); }
    },
    from: function (t) { return new Query(t); },
    rpc: rpc,
    storage: { from: function (bucket) { return {
      upload: function (path) { log.push({ upload: bucket + '/' + path }); return ok({ path: path }); },
      getPublicUrl: function (path) { return { data: { publicUrl: URL_BASE + '/storage/v1/object/public/' + bucket + '/' + path } }; },
      remove: function () { return ok(null); }
    }; } },
    functions: { invoke: function (name, opts) { window.__mock.lastInvoke = { name: name, body: opts && opts.body }; return Promise.resolve({ data: null, error: { message: 'Edge Function returned a non-2xx status code' } }); } },
    channel: function () { return { on: function (a, b, fn) { realtime.push(fn); return this; }, subscribe: function () { return this; } }; },
    removeChannel: function () { realtime.length = 0; }
  };
  window.supabase = { createClient: function () { return client; } };
})();
