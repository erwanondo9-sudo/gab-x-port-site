# Génère les pages de présentation (annonces, services, fonctionnement, publier,
# confidentialite, 404) avec l’en-tête, le pied de page et les icônes de index.html.
# Usage : python tools/build-pages.py .
import io, os, re, sys

ROOT = sys.argv[1]
index = io.open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
SPRITE = re.search(r'(<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">.*?</svg>\n)', index, re.S).group(1)

def ic(name, cls=''):
    return '<svg aria-hidden="true"%s><use href="#i-%s"/></svg>' % (' class="%s"' % cls if cls else '', name)

def page(slug, title, description, current, body):
    nav = [('/annonces.html', 'Annonces'), ('/services.html', 'Services'), ('/fonctionnement.html', 'Comment ça marche'), ('/publier.html', 'Publier')]
    nav_html = ''.join('<a href="%s"%s>%s</a>' % (h, ' aria-current="page"' if h == current else '', t) for h, t in nav)
    return '''<!doctype html>
<html lang="fr" data-theme="light" data-theme-mode="system">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>%(title)s</title>
<meta name="description" content="%(description)s">
<meta name="theme-color" content="#f5f6f2">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Gab X-Port">
<meta property="og:title" content="%(title)s">
<meta property="og:description" content="%(description)s">
<link rel="canonical" href="%(canonical)s">
<meta property="og:url" content="%(canonical)s">
<meta property="og:image" content="https://gx-gab-x-port.vercel.app/assets/img/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/svg+xml" href="/assets/img/app-icon.svg">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/gx.css">
<script src="/assets/js/theme.js"></script>
</head>
<body class="has-tabbar">
%(sprite)s
<a class="skip-link" href="#contenu">Aller au contenu</a>
<div class="app-shell">
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="Gab X-Port, accueil">
      <img class="logo-dark" src="/assets/img/logo-ink.svg" alt="" width="205" height="44">
      <img class="logo-light" src="/logo-gabxport.svg" alt="" width="205" height="44">
    </a>
    <nav class="main-nav" aria-label="Navigation principale">%(nav)s</nav>
    <div class="header-actions">
      <button type="button" class="btn btn-ghost btn-icon theme-toggle" data-theme-toggle aria-label="Changer de thème">
        <svg data-icon="system" aria-hidden="true"><use href="#i-monitor"/></svg>
        <svg data-icon="light" aria-hidden="true"><use href="#i-sun"/></svg>
        <svg data-icon="dark" aria-hidden="true"><use href="#i-moon"/></svg>
      </button>
      <a class="btn btn-primary" href="/#annonces"><span class="label-long">Voir les annonces</span><span class="label-short">Annonces</span></a>
    </div>
  </div>
</header>
<main id="contenu" tabindex="-1">
%(body)s
</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand brand-on-dark" href="/" aria-label="Gab X-Port, accueil"><img class="logo-light" src="/logo-gabxport.svg" alt="" width="205" height="44"></a>
        <p>La passerelle digitale entre le Gabon et l’international. Gab X-Port met en relation clients, entreprises et indépendants pour développer des échanges et des partenariats.</p>
      </div>
      <div>
        <h2>Plateforme</h2>
        <ul class="footer-links">
          <li><a href="/#annonces">Toutes les annonces</a></li>
          <li><a href="/fonctionnement.html">Comment ça marche</a></li>
          <li><a href="/services.html">Nos services</a></li>
        </ul>
      </div>
      <div>
        <h2>Professionnels</h2>
        <ul class="footer-links">
          <li><a href="/publier.html">Publier une annonce</a></li>
          <li><a href="/?modal=signup&amp;type=company">Créer un compte entreprise</a></li>
          <li><a href="/?modal=signup&amp;type=independent">Créer un compte indépendant</a></li>
        </ul>
      </div>
      <div>
        <h2>Aide</h2>
        <ul class="footer-links">
          <li><a href="/#faq">Questions fréquentes</a></li>
          <li><a href="/?modal=contact">Nous contacter</a></li>
          <li><a href="/confidentialite.html">Confidentialité et conditions</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Gab X-Port</span>
      <span>Plateforme de mise en relation : ni transitaire, ni commissionnaire en douane, ni intermédiaire de paiement.</span>
    </div>
  </div>
</footer>
</div>
<nav class="tabbar" aria-label="Navigation mobile">
  <a href="/"><svg aria-hidden="true"><use href="#i-home"/></svg><span>Accueil</span></a>
  <a href="/#annonces"><svg aria-hidden="true"><use href="#i-grid"/></svg><span>Annonces</span></a>
  <a href="/#favoris"><svg aria-hidden="true"><use href="#i-heart"/></svg><span>Favoris</span></a>
  <a href="/#historique"><svg aria-hidden="true"><use href="#i-history"/></svg><span>Historique</span></a>
  <a href="/#espace-personnel"><svg aria-hidden="true"><use href="#i-login"/></svg><span>Compte</span></a>
</nav>
</body>
</html>
''' % dict(title=title, description=description, sprite=SPRITE, nav=nav_html, body=body,
           canonical='https://gx-gab-x-port.vercel.app/' + ('' if slug == 'index' else slug + '.html'))

def hero(eyebrow, h1, lead, ctas=''):
    return '''<section class="page-hero">
  <div class="container">
    <h1>%s</h1>
    <p class="lead">%s</p>
    %s
  </div>
</section>''' % (h1, lead, ('<div class="hero-ctas">%s</div>' % ctas) if ctas else '')

def features(items):
    return '<div class="feature-grid">' + ''.join(
        '<article class="feature"><h3>%s<span>%s</span></h3><p>%s</p></article>' % (ic(i), t, p) for i, t, p in items) + '</div>'

def section(inner, alt=False, head=None):
    h = ''
    if head:
        h = '<div class="section-head"><div><h2>%s</h2></div></div>' % head[1]
    return '<section class="section%s"><div class="container">%s%s</div></section>' % (' section-alt' if alt else '', h, inner)

NOTICE = '<p class="notice">Gab X-Port est une plateforme de mise en relation. Elle n’agit pas comme transitaire, transporteur, commissionnaire en douane ni intermédiaire de paiement : les accords, prix, livraisons et paiements sont convenus directement entre les membres.</p>'

def cta(title, text, href, label):
    return '<section class="section-tight"><div class="container"><div class="cta-band"><div><h2>%s</h2><p>%s</p></div><a class="btn btn-primary btn-lg" href="%s">%s %s</a></div></div></section>' % (title, text, href, label, ic('arrow-right'))

pages = {}

pages['annonces.html'] = page('annonces', 'Annonces de services Gabon ⇄ International | Gab X-Port',
  'Transport, logistique, pièces automobiles, agroalimentaire, matériaux : parcourez les annonces de professionnels entre le Gabon, la France, le Maroc, le Sénégal et la Chine.',
  '/annonces.html',
  hero('Explorer la plateforme', 'Toutes les annonces de services',
       'Découvrez les offres publiées par des entreprises et des indépendants, au Gabon et sur les marchés internationaux. Filtrez par corridor et par secteur, puis contactez directement l’annonceur.',
       '<a class="btn btn-accent btn-lg" href="/#annonces">%s Parcourir les annonces</a><a class="btn btn-on-dark btn-lg" href="/publier.html">Publier une annonce</a>' % ic('search')) +
  section('<div class="corridors">' + ''.join(
      '<a class="corridor" href="/#annonces"><span class="route-codes" aria-hidden="true"><b>%s</b><svg><use href="#i-arrows"/></svg><b>GA</b></span><strong>%s ⇄ Gabon</strong><small>%s</small><svg class="arrow" aria-hidden="true"><use href="#i-arrow-right"/></svg></a>' % (c, n, d)
      for c, n, d in [('FR', 'France', 'Fret, pièces, équipements et services.'), ('MA', 'Maroc', 'Transport, agroalimentaire et matériaux.'), ('SN', 'Sénégal', 'Échanges en Afrique de l’Ouest et centrale.'), ('CN', 'Chine', 'Sourcing, achats groupés, acheminement.')]) + '</div>',
      head=('Corridors commerciaux', 'Des échanges dans les deux sens')) +
  section(features([
      ('route', 'Transport & logistique', 'Fret maritime et aérien, groupage, coordination de livraison et dédouanement via des partenaires.'),
      ('briefcase', 'Automobile & pièces', 'Recherche de références, fourniture de pièces détachées et préparation à l’export.'),
      ('layers', 'Agroalimentaire', 'Produits agricoles, demandes de grossistes et approvisionnement en volume.'),
      ('building', 'Équipements & matériaux', 'Matériaux de construction, équipements professionnels et demandes de devis.'),
      ('globe', 'Bois & matières premières', 'Mise en relation autour des filières bois et matières premières.'),
      ('handshake', 'Autres services', 'Conseil, représentation commerciale, sourcing et accompagnement.')]),
      alt=True, head=('Secteurs', 'Les services proposés')) +
  cta('Consultez les offres disponibles', 'Créez un compte pour voir le détail des annonces et contacter les professionnels.', '/#annonces', 'Voir les annonces'))

pages['services.html'] = page('services', 'Nos services | Gab X-Port',
  'Gab X-Port facilite la mise en relation directe entre clients, entreprises et indépendants : visibilité professionnelle, contact WhatsApp ou e-mail, statistiques d’annonces.',
  '/services.html',
  hero('Nos services', 'Une passerelle pour vos échanges internationaux',
       'Gab X-Port réunit les clients, les entreprises et les indépendants qui travaillent entre le Gabon et le reste du monde, et les met en relation directe.',
       '<a class="btn btn-accent btn-lg" href="/?modal=signup">Créer un compte</a><a class="btn btn-on-dark btn-lg" href="/#annonces">Voir les annonces</a>') +
  section(features([
      ('handshake', 'Mise en relation', 'Identifiez des professionnels par corridor et par secteur, et présentez-leur directement votre besoin.'),
      ('building', 'Visibilité professionnelle', 'Publiez vos services avec jusqu’à 10 photos et un profil professionnel public.'),
      ('chat', 'Contact direct', 'Les clients vous écrivent sur WhatsApp ou par e-mail, selon le canal que vous choisissez.'),
      ('eye', 'Statistiques privées', 'Suivez le nombre de comptes uniques ayant consulté vos annonces et les mises en favori.'),
      ('heart', 'Favoris synchronisés', 'Enregistrez des annonces et retrouvez-les sur tous vos appareils.'),
      ('shield', 'Données maîtrisées', 'Votre e-mail de connexion n’est jamais affiché, et vous pouvez supprimer votre compte à tout moment.')]),
      head=('Ce que nous proposons', 'Tout pour trouver le bon partenaire')) +
  section(NOTICE, alt=True) +
  cta('Vous êtes un professionnel ?', 'Publiez votre premier service en quelques minutes.', '/publier.html', 'Publier une annonce'))

pages['fonctionnement.html'] = page('fonctionnement', 'Comment ça marche | Gab X-Port',
  'Créez un compte, explorez ou publiez des annonces, puis échangez directement avec les professionnels. Le fonctionnement de Gab X-Port en trois étapes.',
  '/fonctionnement.html',
  hero('Guide utilisateur', 'Comment ça marche ?', 'Un parcours simple pour trouver un partenaire ou faire connaître votre activité, sans intermédiaire.') +
  section('<ol class="steps">' + ''.join('<li class="step"><span class="step-num">%d</span><h3>%s</h3><p>%s</p></li>' % (i + 1, t, p) for i, (t, p) in enumerate([
      ('Créez votre compte', 'Inscription avec une adresse e-mail. Choisissez Client, Entreprise ou Indépendant.'),
      ('Parcourez les annonces', 'Filtrez par corridor et par secteur, comparez les offres et consultez le profil de chaque professionnel.'),
      ('Contactez directement', 'Un clic ouvre WhatsApp ou votre messagerie, avec un message pré-rempli. Vous convenez des modalités ensemble.')])) + '</ol>',
      head=('Pour les clients', 'Trouver un professionnel')) +
  section('<ol class="steps">' + ''.join('<li class="step"><span class="step-num">%d</span><h3>%s</h3><p>%s</p></li>' % (i + 1, t, p) for i, (t, p) in enumerate([
      ('Ouvrez un compte pro', 'Compte Entreprise ou Indépendant, puis renseignez votre canal de contact : WhatsApp ou e-mail.'),
      ('Publiez vos services', 'Titre, corridor, secteur, description et jusqu’à 10 photos. L’annonce est visible immédiatement.'),
      ('Suivez vos résultats', 'Vues uniques et mises en favori dans votre espace, et contacts directs des clients intéressés.')])) + '</ol>',
      alt=True, head=('Pour les professionnels', 'Être visible')) +
  section(NOTICE) +
  cta('Prêt à commencer ?', 'Clients, entreprises et indépendants : un compte suffit pour consulter et publier.', '/?modal=signup', 'Créer un compte'))

pages['publier.html'] = page('publier', 'Publier une annonce | Gab X-Port',
  'Entreprises et indépendants : publiez vos services sur Gab X-Port et soyez contactés par des clients au Gabon et à l’international.',
  '/publier.html',
  hero('Espace professionnel', 'Publiez votre annonce',
       'Présentez vos services aux clients du Gabon et de l’international. La publication est réservée aux comptes Entreprise et Indépendant.',
       '<a class="btn btn-accent btn-lg" href="/?modal=publish">%s Publier une annonce</a><a class="btn btn-on-dark btn-lg" href="/?modal=signup&amp;type=company">Créer un compte pro</a>' % ic('plus')) +
  section(features([
      ('image', 'Décrivez votre offre', 'Titre clair, corridor, secteur, zone d’intervention, délais et conditions. Ajoutez jusqu’à 10 photos.'),
      ('globe', 'Rendez-vous visible', 'Votre annonce apparaît immédiatement dans le catalogue et sur votre profil professionnel.'),
      ('chat', 'Recevez des contacts', 'Les clients intéressés vous écrivent directement, sur WhatsApp ou par e-mail.')]),
      head=('En trois étapes', 'Comment publier')) +
  cta('Votre compte est prêt ?', 'Connectez-vous pour accéder au formulaire de publication.', '/?modal=publish', 'Publier maintenant'))

LEGAL = [
  ('objet', 'Objet du service', ['Gab X-Port est une plateforme en ligne de mise en relation entre des clients, des entreprises et des professionnels indépendants intéressés par des échanges commerciaux entre le Gabon et les marchés internationaux.', 'Les présentes conditions encadrent l’utilisation du site. En créant un compte, vous les acceptez.']),
  ('role', 'Rôle de Gab X-Port', ['Gab X-Port n’est ni transitaire, ni transporteur, ni commissionnaire en douane, ni intermédiaire de paiement. La plateforme ne reçoit aucun fonds et n’est pas partie aux accords conclus entre les membres.', 'Les membres restent seuls responsables de leurs échanges, de la vérification de leurs interlocuteurs, de leurs accords, de leurs paiements et de l’exécution des prestations.']),
  ('compte', 'Compte et sécurité', ['Chaque membre fournit des informations exactes et garde son mot de passe confidentiel. Trois types de comptes existent : Client, Entreprise et Indépendant. Seuls les comptes Entreprise et Indépendant peuvent publier des annonces.']),
  ('annonces', 'Règles de publication', ['Les annonces doivent décrire un service réel et licite, sans contenu trompeur, offensant ou contraire à la loi. Sont notamment interdits : les produits ou services illicites, la contrefaçon, les données personnelles de tiers et toute tentative d’escroquerie.', 'Gab X-Port peut retirer une annonce ou suspendre un compte qui ne respecte pas ces règles.']),
  ('donnees', 'Données collectées', ['<ul><li><strong>Compte :</strong> adresse e-mail, nom ou raison sociale, pays, type de compte.</li><li><strong>Profil professionnel (facultatif) :</strong> numéro WhatsApp ou e-mail de contact, site internet, activité, photo de profil.</li><li><strong>Annonces :</strong> textes et photos publiés.</li><li><strong>Activité :</strong> annonces mises en favori et annonces consultées, pour l’historique et les statistiques privées des annonceurs.</li></ul>']),
  ('usage', 'Utilisation des données', ['Ces données servent uniquement à faire fonctionner le service : gestion du compte, affichage des annonces et des profils professionnels, prise de contact, synchronisation des favoris et de l’historique, statistiques de consultation fournies à l’annonceur. Elles ne sont ni vendues ni utilisées à des fins publicitaires.', 'Votre adresse e-mail de connexion n’est jamais affichée. Seules les coordonnées de contact qu’un professionnel choisit de rendre publiques sont visibles des membres connectés.']),
  ('prestataires', 'Hébergement et prestataires', ['Les comptes, annonces et photos sont hébergés par Supabase (base de données, authentification et stockage). Le site est servi par un hébergeur de fichiers statiques. La bibliothèque Supabase est chargée depuis le réseau jsDelivr ; les polices de caractères sont hébergées avec le site.']),
  ('stockage', 'Stockage local et cookies', ['Le site n’utilise pas de cookies publicitaires ni d’outils de suivi. Il enregistre dans votre navigateur (stockage local) votre session de connexion, votre choix de thème et une copie de vos favoris et de votre historique, pour un affichage immédiat. Ces données sont effacées à la déconnexion, sauf le thème.']),
  ('conservation', 'Durée de conservation et suppression', ['Vous pouvez supprimer votre compte à tout moment depuis « Mon espace ». Le compte est désactivé immédiatement, puis supprimé définitivement avec ses données associées 30 jours plus tard. Une reconnexion pendant ce délai annule la demande.']),
  ('droits', 'Vos droits', ['Vous pouvez accéder à vos données, les rectifier depuis votre espace ou demander leur suppression. Pour toute demande, écrivez à <a href="mailto:gabxport120@gmail.com">gabxport120@gmail.com</a>.']),
  ('contact', 'Contact', ['Pour toute question sur ces conditions ou sur vos données : <a href="mailto:gabxport120@gmail.com">gabxport120@gmail.com</a>.']),
]
legal_body = hero('Informations légales', 'Confidentialité et conditions d’utilisation', 'Les règles d’utilisation de Gab X-Port et la manière dont vos informations sont traitées. Dernière mise à jour : 4 novembre 2026.') + \
  '<section class="section"><div class="container legal-layout"><nav aria-label="Sommaire"><ul class="toc">' + \
  ''.join('<li><a href="#%s">%s</a></li>' % (k, t) for k, t, _ in LEGAL) + '</ul></nav><div class="prose">' + \
  ''.join('<h2 id="%s">%s</h2>%s' % (k, t, ''.join(p if p.startswith('<ul') else '<p>%s</p>' % p for p in ps)) for k, t, ps in LEGAL) + '</div></div></section>'
pages['confidentialite.html'] = page('confidentialite', 'Confidentialité et conditions d’utilisation | Gab X-Port',
  'Conditions d’utilisation de Gab X-Port et politique de confidentialité : données collectées, utilisation, conservation, suppression du compte et vos droits.',
  '/confidentialite.html', legal_body)

pages['404.html'] = page('404', 'Page introuvable | Gab X-Port', 'Cette page n’existe pas ou a été déplacée.', '',
  '<section class="section"><div class="container"><div class="empty-state"><span class="empty-icon">%s</span><h3>Page introuvable</h3><p>Cette page n’existe pas ou a été déplacée. Revenez à l’accueil ou parcourez les annonces.</p><div class="cluster" style="justify-content:center"><a class="btn btn-primary" href="/">Retour à l’accueil</a><a class="btn btn-secondary" href="/#annonces">Voir les annonces</a></div></div></div></section>' % ic('search'))

for name, html in pages.items():
    if name == '404.html':
        # La page 404 ne doit pas être indexée : pas d'URL canonique.
        html = html.replace('<link rel="canonical" href="https://gx-gab-x-port.vercel.app/404.html">\n'
                            '<meta property="og:url" content="https://gx-gab-x-port.vercel.app/404.html">',
                            '<meta name="robots" content="noindex">')
    io.open(os.path.join(ROOT, name), 'w', encoding='utf-8', newline='\n').write(html)
    print(name, len(html))
