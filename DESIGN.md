---
name: Gab X-Port
description: The route canvas. Gabon wired to its partner ports, on a dark void lit by ember and electric current.
colors:
  void: "#0e0918"
  void-sunken: "#0a0612"
  surface-1: "#1a1624"
  surface-2: "#1b1728"
  surface-3: "#2c2834"
  smoke: "#3e3a46"
  ash: "#d1cece"
  fog: "#a8a2a2"
  white: "#ffffff"
  ember-start: "#fd8925"
  ember-end: "#ff0c00"
  ember-solid: "#ff5a1f"
  ember-ink: "#1a0700"
  ember-icon: "#ff8a5c"
  volt-start: "#077ac7"
  volt-end: "#6b21ef"
  volt-solid: "#5b8cff"
  volt-pulse: "#9ec0ff"
  silver-rail: "#e5e7eb"
  pill-tag: "rgba(163, 163, 163, .14)"
  pill-tag-on: "rgba(163, 163, 163, .2)"
  hairline: "rgba(255, 255, 255, .08)"
  rose-glow: "rgba(175, 106, 140, .46)"
  rose-glow-mid: "rgba(98, 65, 83, .38)"
  ember-glow: "rgba(217, 126, 75, .16)"
  gabon-green: "#009e60"
  gabon-yellow: "#fcd116"
  gabon-blue: "#3a75c4"
  danger: "#ff8a7f"
  success: "#6bd6a2"
  warning: "#f5c46a"
typography:
  display:
    fontFamily: "Stack Sans Headline, Stack Sans Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 1.5rem + 4.4vw, 5.25rem)"
    fontWeight: 300
    lineHeight: 0.9
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Stack Sans Headline, Stack Sans Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.35rem + 2.6vw, 3.25rem)"
    fontWeight: 300
    lineHeight: 0.96
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Stack Sans Headline, Stack Sans Text, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.2rem, 1.1rem + .4vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Stack Sans Text, ui-sans-serif, system-ui, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "clamp(1.0625rem, 1rem + .25vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.018em"
  body:
    fontFamily: "Stack Sans Text, ui-sans-serif, system-ui, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.018em"
  label:
    fontFamily: "Stack Sans Text, ui-sans-serif, system-ui, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.25
  caption:
    fontFamily: "Stack Sans Text, ui-sans-serif, system-ui, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.35
rounded:
  xs: "6px"
  sm: "8px"
  node: "12px"
  xl: "16px"
  2xl: "24px"
  pill: "24px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "20px"
  s-6: "24px"
  s-8: "32px"
  s-10: "40px"
  s-12: "48px"
  s-16: "64px"
  s-20: "80px"
  s-24: "96px"
  gutter: "clamp(16px, 4vw, 32px)"
  section: "clamp(88px, 11vw, 128px)"
  container: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.ember-solid}"
    textColor: "{colors.ember-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
    height: "44px"
  button-primary-lg:
    backgroundColor: "{colors.ember-solid}"
    textColor: "{colors.ember-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 22px"
    height: "50px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "#1f1a2a"
    textColor: "{colors.white}"
  button-frost:
    backgroundColor: "rgba(13, 10, 25, .28)"
    textColor: "{colors.ash}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
  input:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
    height: "48px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ash}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.pill-tag-on}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
  corridor-tab-selected:
    backgroundColor: "{colors.pill-tag}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "52px"
  node:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.white}"
    rounded: "{rounded.node}"
    size: "64px"
  node-hub:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.white}"
    rounded: "{rounded.xl}"
    size: "96px"
  listing-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ash}"
    rounded: "{rounded.xl}"
  card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ash}"
    rounded: "{rounded.2xl}"
    padding: "clamp(18px, 3vw, 28px)"
  canvas-panel:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ash}"
    rounded: "{rounded.2xl}"
  modal-panel:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ash}"
    rounded: "{rounded.2xl}"
  nav-link:
    textColor: "{colors.ash}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
---

# Design System: Gab X-Port

## Overview

**Creative North Star: "The Route Canvas"**

Gab X-Port is drawn as a workflow canvas: Gabon is a live hub node, the four partner ports (France, Maroc, Sénégal, Chine) are nodes wired to it, and every wire is a way to reach a professional. The visual language is the owner-pinned Refero "n8n design system", followed closely and adapted to the brand: a near-black violet void, stepped surfaces, inset-glow nodes and cards, an ember gradient reserved for the action, and electric violet-blue current on wires, links and focus.

The world is dark on every theme. The theme toggle is hidden and the light/dark tokens of the legacy base are all remapped onto the void, so one world serves the public pages and the app views (annonces, favoris, messagerie, compte) alike. Warmth comes from real port photographs, ember light pooled in section corners and a rose glow in the footer, which keeps a developer-tool palette reading as trade and harbour rather than software.

Density is calm on public pages (large light display type, generous section padding) and denser in the app views, which inherit the same surfaces and radii in an operating register. Proof is only what exists: real, credited port photographs; no invented counts, logos or testimonials.

**Key Characteristics:**
- Dark void ground (#0e0918) on every theme; depth by surface step and inset glow, never by drop shadow at rest.
- Ember gradient only on primary actions, with dark ink for contrast.
- Electric current (volt gradient) on wires, active indicators, link underlines and focus rings.
- Node-and-wire geometry recurs: hero canvas, three-node flow, listing placeholders, 404 cut wire.
- Light display weight (300) at tight leading (0.9 to 0.96).
- Real port photographs clipped at 16 to 24px, credited in the footer.

## Colors

A violet-black void with three stepped surfaces, two light greys for text, and two gradients that never trade roles: ember acts, volt connects.

### Primary
- **Ember** (ember-start to ember-end at 30deg): the primary and accent button fill, nothing else. Its flat stand-in, **Ember Solid**, carries accent-color, the legacy `--primary`, and the warm corner glows (at 16 to 22% alpha).
- **Ember Ink**: the label colour on every ember button. White on the light end of the gradient measures about 2.4:1; the dark ink clears WCAG AA.
- **Ember Icon** (#ff8a5c): the warm tint for icons on dark surfaces (flow nodes, offer list, field icons, active tab-bar icon, Favoris in the header).

### Secondary
- **Volt** (volt-start to volt-end at 141deg): route wires, the active-nav underline, the selected corridor-tab dot, mobile route spines. **Volt Solid** is the focus ring, link underline (at 70% alpha), wire handle stroke and modal field focus. **Volt Pulse** is the travelling dot on wires.

### Tertiary
- **Silver Rail** (#e5e7eb): the reference's ghost outline. Full strength on selected chips and secondary-button hover; 30 to 55% alpha at rest.
- **Pill Tag** (rgba(163,163,163,.14), .2 when pressed): the reference's own translucent fill for the selected corridor tab and pressed chip.
- **Rose Glow**: the footer's corner radial, from the reference; also used at .28 on the Professionnels hero.
- **Gabon flag** (green, yellow, blue): only on the Gabon hub node's three-stripe flag and the gold pro-card icon. Brand mark, not a palette.

### Neutral
- **Void**: page ground, header (at 92%), footer, tab bar (at 96%). **Void Sunken** for recessed areas.
- **Surface 1**: cards, nodes, the hero search shell, account chip, legal nav.
- **Surface 2**: canvases and large panels (route canvas, flow canvas, corridor panel, pro panel, modal, toast).
- **Surface 3**: fields, segmented control track, icon wells, ghost hover, media placeholders.
- **Smoke**: header and footer rules, scrollbar thumb.
- **White**: headings and active labels. **Ash**: body text. **Fog**: secondary text, small labels, inactive nav.
- **Hairline** (white at 8%; 6% on canvas edges): internal dividers in lists, FAQ, footer bottom.

### Named Rules
**The Ember Acts Rule.** The ember gradient fills only the primary action of a region. Ember light elsewhere is diffuse corner glow, never a second filled element.

**The Current Connects Rule.** Volt marks connection and attention: wires, active states, link underlines, focus. It never fills a button.

**The Dark Ink Rule.** Text on ember is Ember Ink, never white.

## Typography

**Display Font:** Stack Sans Headline (fallback Stack Sans Text, system sans)
**Body Font:** Stack Sans Text (fallback ui-sans-serif, system-ui, Segoe UI, Roboto, Arial)
**Label/Mono Font:** none distinct; the mono token resolves to Stack Sans Text.

**Character:** One self-hosted grotesque family in two optical cuts. The headline cut at weight 300 and very tight leading gives the reference's airy, large-scale voice; the text cut with slight negative tracking keeps French copy compact and plain.

### Hierarchy
- **Display** (300, clamp 2.75 to 5.25rem, 0.9): every page h1 (home hero, Professionnels, 404, inner-page heroes), one size for all.
- **Headline** (300, clamp 2 to 3.25rem, 0.96): section h2, left-aligned in a 7/5 split with its supporting paragraph on the right. A two-tone h2 may set its second clause in Fog.
- **Title** (400, clamp 1.2 to 1.5rem, 1.2): h3, card and step titles, node codes, modal titles. Corridor panel titles, the closing band and the engagement statement use Headline.
- **Lead** (400, clamp 17 to 19px, 1.5): hero sentences, section intros, FAQ questions; measure capped near 30 to 34rem.
- **Body** (400, 16px, 1.5, -0.018em): Ash on void; running text, flow notes and secondary links; long answers capped at 46rem.
- **Label** (400, 14px): nav, footer links, node labels, header buttons; footer column heads are 14px white sentence case, not uppercase.
- **Caption** (12px, 1.35): node sublabels, photo captions, credits.

### Named Rules
**The Light Weight Rule.** Display and headline are weight 300. Emphasis comes from size and white against Ash, not from bold.

**The Sentence Case Rule.** No uppercase tracked labels; every heading and label is sentence case.

## Layout

A 1200px container with a fluid gutter (clamp 16 to 32px). Sections pad clamp(88px, 11vw, 128px), tight sections clamp(64px, 8vw, 96px). The spacing scale is 4px-based (4 to 96).

Asymmetric splits carry most layouts: hero 5/7, section heads 7/5, corridor panel 3/7 with a 6/5 inner view, pro panel 6/6, help 4/8, 404 7/5. The route canvas bleeds off the right edge of the viewport, rounded only on its left side. The three-node flow staggers its steps downward (0, 72px, 144px) so the wires descend.

Breakpoints: 1080px hides tablet-only header actions; 980px collapses every split to one column and turns corridor tabs into a horizontal scroller above the view; 680px (phone) turns the route canvas into a vertical route list on a volt spine, drops the wire SVG, the port photo and all backdrop blur for performance on mid-range Android, and does the same for the flow canvas.

## Elevation & Depth

Depth is tonal and inset. Surfaces step up from void through surface 1, 2 and 3; cards and nodes are lifted by an inset white hairline with an ember lower edge, and brighten to a stronger inset glow on hover, focus or active. Canvases are recessed rather than raised: an inset 6% white edge and a 22px dot grid. Outset shadows exist only on layers that float over other content.

### Shadow Vocabulary
- **Glow inset** (`box-shadow: inset 0 0 0 1px rgba(255,255,255,.1), inset 0 -1px 0 0 rgba(255,142,93,.3)`): resting cards, nodes, search shell, notices.
- **Glow inset high** (`box-shadow: inset 0 0 0 1px rgba(255,255,255,.16), inset 0 -1px 0 0 rgba(255,142,93,.55), inset 0 -18px 32px -24px rgba(255,110,60,.35)`): hover/active nodes and cards, flow nodes, closing and honest panels, toast.
- **Canvas edge** (`box-shadow: inset 0 0 0 1px rgba(255,255,255,.06)`): route, flow, corridor and pro panels.
- **Float** (`box-shadow: 0 30px 80px -30px rgba(0,0,0,.8)` plus glow inset high): modal panel only.
- **Frost** (`box-shadow: 0 0 8px rgba(0,0,0,.26)` with `backdrop-filter: blur(10px)`): the frosted ghost button resting over the canvas and header.

### Named Rules
**The Inset Lift Rule.** Resting surfaces never carry an outset drop shadow; they rise by surface step and inset glow. Outset shadow is reserved for modals and the frosted button that sits over other content.

**The Corner Glow Rule.** Ember and rose light appear only as soft radial glows anchored in a section corner (hero lower left, closing upper right, footer upper right, Professionnels hero upper right).

## Shapes

Three radius tiers from the reference plus a node tier: 8px for every interactive control (buttons, fields, chips, tabs, nav links), 12px for nodes and icon wells, 16px for listing cards, the search shell and the Gabon hub, 24px for panels, canvases, cards, modals and photographs. Badges and floating captions are 24px pills. Wires are 2px round-capped curves (3px when active), terminated by small surface-3 handles with a volt stroke. Photographs are clipped like product screenshots, at 16px inside the canvas and 24px in panels.

## Components

### Buttons
Quiet, compact, 8px everywhere.
- **Shape:** gently rounded (8px), min-height 44px, 50px for the large size; 1px press-down on active.
- **Primary:** ember gradient fill with Ember Ink label at weight 500 and a faint top highlight (inset 0 1px 0 white at 30%). Hover brightens (brightness 1.08, saturate 1.05) rather than changing hue.
- **Secondary:** transparent with a Silver Rail outline at 55%; hover fills #1f1a2a and the rail goes full.
- **Frost:** the owner-requested liquid-glass ghost: translucent void fill, 10% white border, 10px backdrop blur; hover becomes solid #241f2e. Blur is removed on phone.
- **Ghost / Text link:** Ash text, surface-3 fill or white text on hover.

### Chips
- **Style:** transparent, Silver Rail outline at 30%, Ash text, 8px radius.
- **State:** hover raises the rail to 60% and text to white; pressed takes the Pill Tag fill at .2 with a full Silver Rail outline.

### Cards / Containers
- **Corner Style:** 16px for listing cards, 24px for cards, panels, empty states, notices.
- **Background:** surface 1 for cards; surface 2 for canvases and panels.
- **Shadow Strategy:** glow inset at rest, glow inset high on hover with a 2px lift (see Elevation).
- **Border:** none; the inset hairline replaces it.
- **Internal Padding:** clamp(18px, 3vw, 28px) on cards; clamp(32px, 5vw, 64px) on feature panels.

### Inputs / Fields
- **Style:** surface 3 fill, no visible border, 8px radius, white text, placeholder #8f8a96, min-height 48px (56px in the hero search).
- **Focus:** global 2px Volt Solid outline offset 3px; modal fields add a volt border and a 3px volt halo at 20%; hero fields lighten to #353041.

### Navigation
- **Header:** void at 92% with a smoke bottom rule, no blur, 66px tall. Links are 14px Ash, white on hover; the current page gets a 2px volt-gradient underline bar. Actions on the right: frosted buttons and one ember primary.
- **Mobile:** a bottom tab bar on void at 96% with a smoke top rule; inactive Fog, current white with an Ember Icon glyph.
- **Footer:** void with the rose corner glow, a 2/1/1/1 mega-nav of 14px Fog links, photo credits in 12px below.

### Route Canvas (signature)
A surface-2 panel with a 22px dot grid, bleeding off the right edge. The Gabon hub (96px, 16px radius, flag stripe) sits left; four 64px port nodes (12px radius, short code in display face) sit right, joined by volt-gradient wires along which pulses travel toward Gabon (4.2s loop, hidden under reduced motion). Port nodes are buttons: hover or focus lights their wire to full opacity and 3px and swaps the credited port photo. On phone it becomes a vertical list of 52px nodes on a volt spine.

### Flow Canvas and Corridor Panel
The flow canvas wires three pill-shaped flow nodes (12px radius, Ember Icon glyph, glow inset high) down a staircase. The corridor panel pairs vertical tabs (52px, Pill Tag fill and volt dot when selected) with a photo-and-copy view. Listings without photos show a dotted mini-canvas with a volt wire through a route tag node.

### Motion
One reveal: 18px rise and fade over 640ms on cubic-bezier(.16, 1, .3, 1), from an already-rendered state. State transitions run 150ms; node lifts 300ms on cubic-bezier(.22, 1, .36, 1).

## Do's and Don'ts

### Do:
- **Do** keep the void ground on every page and theme; new app views inherit surfaces 1 to 3, not a light theme.
- **Do** put Ember Ink (#1a0700) on any ember fill.
- **Do** use volt for connection and focus: wires, active underlines, link underlines, the 2px focus outline.
- **Do** express new structure as nodes and wires on a dotted canvas when the content is a route, step or link.
- **Do** lift surfaces with the inset glow; brighten to glow inset high on hover, focus or active.
- **Do** use 8px on controls, 12px on nodes, 16px on cards, 24px on panels and photos.
- **Do** use real, credited port photographs, and collapse heavy canvases to lists without blur on phones (680px and under).

### Don't:
- **Don't** fill anything other than the primary action with the ember gradient, and don't set white text on it.
- **Don't** give resting cards or panels an outset drop shadow; outset shadow belongs to modals and the frosted button only.
- **Don't** set display or headline type bold or uppercase; they are weight 300 in sentence case.
- **Don't** reintroduce the theme toggle or a light palette.
- **Don't** show invented proof: no counts, testimonials or partner logos.
