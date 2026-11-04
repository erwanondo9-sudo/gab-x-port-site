# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two audiences, served with equal weight (owner, 2026-11-04):
- **Clients**: individuals and businesses in Gabon or abroad who need a transporter, auto parts, a trader or another service on a trade corridor to Gabon, and want to find, compare and contact a professional directly.
- **Professionals**: companies and independents (transport and logistics, auto parts, agrifood, equipment and materials, wood and raw materials, other services) who want clients to find them and write to them.

## Product Purpose
Gab X-Port is a directory and matchmaking platform between the Gabon and international markets. Professionals publish service listings (up to 10 photos, public professional profile); clients browse them by corridor and sector, save favourites, and contact the professional directly. Success at this stage: the first professionals publish, and the first clients reach them.

## Positioning
- Four named corridors: France ⇄ Gabon, Maroc ⇄ Gabon, Sénégal ⇄ Gabon, Chine ⇄ Gabon (plus "other").
- Direct contact: the conversation opens in WhatsApp or e-mail with a pre-filled message; Gab X-Port takes no commission and never holds money.
- It is a matchmaking platform, not a freight forwarder, carrier, customs broker or payment intermediary.

## Operating Context
Contact happens on WhatsApp or by e-mail. Clients compare offers by corridor and sector, then negotiate prices, deposits and delivery directly with the professional. The site recommends checking a professional's registration (RCCM in Gabon, SIRET in France), asking for a written quote and never paying everything upfront.

## Capabilities and Constraints
- Static HTML/CSS/vanilla JS site; `assets/js/app.js` (single-page views on index.html) talks to Supabase for accounts, listings, favourites, history, private statistics and an optional messaging feature. Its DOM hooks (ids, `data-action`, `data-view`, `data-auth`, `data-requires`, template classes) must keep working.
- Account types: Client (browse, favourites, contact), Entreprise and Indépendant (publish).
- Listing details and contact details are reserved for signed-in members.
- Content Security Policy: scripts from self and cdn.jsdelivr.net; fonts, images and styles from self only (plus Supabase for images). Any new font or image must be self-hosted.
- Deployed as a static site on Vercel (`vercel.json`).
- Pages: the owner asked to follow what professional marketplaces do and to remove repetitive pages; the page structure is open for redesign.

## Brand Commitments
- Name: Gab X-Port. Logo files: `/assets/img/logo-ink.svg`, `/logo-gabxport.svg`.
- Language: French, plain and direct.
- Visual reference made binding by the owner: Refero style "n8n design system" (https://styles.refero.design/style/8601c8ef-e1ea-4186-adb2-6f9a74caf436), to be followed closely and adapted to the brand. Earlier owner requests to keep: a liquid-glass button treatment and a dark sign-in card.

## Evidence on Hand
- Real photographs of the corridor ports (Owendo, Le Havre, Tanger Med, Dakar, Shanghai) from Wikimedia Commons, CC BY / BY-SA, in `assets/img/photos/` with `credits.json`; credits must stay on the page.
- No testimonials, customer logos, member counts, volumes or partner names exist yet. Launch stage: none may be invented.

## Product Principles
1. Two doors, one place: a client looking and a professional offering must each find their path within the first screen.
2. The corridor is the unit of the product: every browse, listing and route reads as origin ⇄ Gabon.
3. Direct and honest: say plainly what Gab X-Port does and does not do; no fake proof at launch.
4. Contact is the goal: every listing path ends in a WhatsApp or e-mail conversation.

## Accessibility & Inclusion
Readable on mid-range Android phones over mobile data (many users in Gabon); WCAG AA contrast; full keyboard use; reduced-motion respected.
