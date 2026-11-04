# Gab X-Port

Plateforme de mise en relation B2B entre le Gabon et les marchés internationaux.
Site statique (HTML, CSS, JavaScript sans framework) adossé à Supabase.

## Organisation

```
index.html                 Application principale (accueil, annonces, détail, favoris,
                           historique, profils, messagerie, espace membre)
annonces.html, services.html, fonctionnement.html, publier.html,
confidentialite.html, 404.html      Pages de présentation
assets/css/gx.css          Système de design unique : jetons (couleurs, typo, espacements),
                           composants, vues, thème clair/sombre, adaptatif 360 px → grand écran
assets/js/theme.js         Thème Auto / Clair / Sombre (chargé dans <head>)
assets/js/app.js           Logique de l'application et appels Supabase
assets/fonts/              Police Manrope auto-hébergée (licence SIL OFL)
assets/img/                Logo pour fond clair, icônes d'application, image de partage
supabase/migrations/       Migrations SQL datées (ne jamais modifier une migration déjà exécutée)
supabase/audit/            Requêtes de contrôle RLS en lecture seule
tests/                     Banc de test local avec un faux Supabase
tools/build-pages.py       Régénère les pages de présentation (en-tête, pied de page, icônes communs)
vercel.json, _headers      En-têtes de sécurité (CSP…) pour Vercel / Netlify / Cloudflare Pages
```

## À faire dans Supabase (une seule fois)

Dans **Supabase > SQL Editor**, exécuter dans l'ordre :

1. `supabase/migrations/202611040001_listing_photo_compat.sql`
   En production, la lecture des annonces échouait (`column listings.photo_url does not exist`),
   et `create_listing` écrit dans cette colonne. Le nouveau site contourne la lecture, mais la
   publication avec photos a besoin de cette colonne.
2. `supabase/migrations/202611040002_privacy_and_integrity.sql`
   - le profil public ne révèle plus le téléphone d'un compte **Client** ;
   - `create_listing` refuse les photos qui ne viennent pas du dossier du membre dans
     `listing-photos`, et limite la longueur des champs ;
   - un message envoyé ne peut plus être réécrit : seule la confirmation de lecture peut changer.
3. `supabase/audit/rls_audit.sql` (lecture seule) : relire chaque résultat. Les tables
   `profiles`, `companies`, `listings`, `conversations` et `messages` ont été créées en dehors de
   ce dépôt ; leurs policies ne peuvent être vérifiées que là. Le fichier indique ce qu'il faut
   attendre pour chacune.

Aucune table, colonne ou RPC n'a été renommée.

## Réglages à vérifier

- **Domaine** : `robots.txt` et `sitemap.xml` utilisent `https://gx-gab-x-port.vercel.app`
  (l'origine déclarée dans la edge function `contact-form`). À remplacer en cas de domaine personnalisé.
- **Formulaire de contact** : il appelle la edge function `contact-form`. Si elle n'est pas
  déployée ou si `RESEND_API_KEY` n'est pas configurée, le site propose automatiquement
  d'envoyer le message depuis la messagerie du visiteur.
- **Messagerie interne** : prête mais masquée (le contact passe par WhatsApp ou e-mail).
  Pour l'afficher : `FEATURES.messaging = true` en haut de `assets/js/app.js`.
- **Supabase Auth** : vérifier que l'URL du site figure dans *Authentication > URL Configuration*
  (liens de confirmation et de réinitialisation du mot de passe).
- **Stockage** : buckets `listing-photos` et `profile-photos` limités à 5 Mo et aux types
  `image/jpeg`, `image/png`, `image/webp`, avec écriture réservée au dossier `auth.uid()`
  (voir la requête 6 du fichier d'audit).
- **Bibliothèque Supabase** : version figée (`@supabase/supabase-js@2.118.0`) avec contrôle
  d'intégrité (SRI). Pour la mettre à jour, changer la version et recalculer le hash `sha384`.

## Tester en local

```bash
python -m http.server 5173
```

- Site réel (base de production, lecture seule tant qu'on ne se connecte pas) : http://localhost:5173/
- Banc de test avec un faux Supabase, sans aucun appel réseau : http://localhost:5173/tests/harness.html
  Comptes factices (mot de passe `motdepasse123`) : `pro@test.local` (Entreprise, membre fondateur)
  et `client@test.local` (Client). Ajouter `?messaging=1` pour tester la messagerie.

Le dossier `tests/` n'est pas publié (`.vercelignore`).
