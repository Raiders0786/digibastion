ns# Services Pages — Design Refresh (CPO/CDO Pass)

## Assessment of current state

What's working: structure, copy, SEO, JSON-LD, content density. The information is right.

What's underwhelming:
- **Visual register is generic SaaS** — purple primary on cards, glow shadows, equal-weight everything. Reads like a template, not like a security firm you trust with your keys.
- **No typographic hierarchy** — everything is Inter at similar weights. Hero h1 doesn't feel different from section h2. Nothing earns the eye.
- **Cards are noisy** — `glass-card-hover`, gradient CTA panel, `shadow-glow` on the "popular" package, monospace `[ tags ]`, icons in colored chips. Three or four visual systems competing.
- **Mobile**: hero h1 jumps from `text-3xl` to `text-5xl` with no `text-4xl` step → cramped on 375–414px. Hero CTAs wrap awkwardly. The 4-col process grid collapses to 2 on tablet but stays tight. Trust-pillar row on Services is fine but the breadcrumb + chip + h1 stack has no breathing room on small screens.
- **No anchor moment** — nothing to remember. A visitor scrolls past and forgets which firm this was.

## Design direction: "Quiet authority"

The category cue should be **editorial security firm**, not crypto-startup. Think: long-form research site, lots of negative space, one accent used sparingly, typography doing the talking. Content frames the offer; design gets out of the way.

### Tokens (scoped, no global changes)

- **Display font**: add `Instrument Serif` for h1/h2 only (already a curated pair we use elsewhere). Body stays Inter. Mono stays JetBrains for the `[ tag ]` rails.
- **Accent**: keep the existing `--primary` purple — but use it *once or twice per section max* (a single underline, a single hairline border, the primary CTA). Remove glow shadows and gradient panels.
- **Surfaces**: replace `glass-card-hover` everywhere with a flat `border border-border/60 bg-card/40` and a hairline hover state. No drop shadows on cards.
- **Rhythm**: bump section spacing from `mb-16` to `mb-24 sm:mb-32`. Generous gutters.

### Page-level moves

**Hero (both pages)**
- Two-column on `lg+`: left = eyebrow + serif h1 + lede + CTAs; right = a small "credentials strip" (ESP grant · open-source · named researchers) as a stacked vertical list with hairline dividers.
- Mobile: single column. h1 ramp `text-4xl sm:text-5xl lg:text-6xl`, leading-tight, serif. CTAs full-width on `<sm`, inline on `sm+`.
- Drop the rounded purple chip; use a small uppercase mono eyebrow instead (`OPSEC CONSULTING · NOW BOOKING`).

**Threat landscape (OpSec)**
- Convert from 2×2 colored cards to a **numbered editorial list** (`01 — DPRK recruiter playbook`) with the "How we address it" indented under a left hairline. Reads like a research dossier, not a feature grid.

**What's covered**
- Remove the outer card. Two-column checklist with thin dividers between rows. Lighter, scans faster.

**Process (both pages)**
- Replace 4 cards with a **horizontal stepper** on desktop (numbers + connector line) and a vertical timeline on mobile. One visual, not four boxes.

**Packages**
- Flatten the highlight: drop `shadow-glow` and the floating "MOST POPULAR" pill. Use a subtle `ring-1 ring-primary/30` and a small mono "RECOMMENDED" label inline with the package name. All three cards same weight.

**Team**
- Add monogram avatars (initials in a square, bordered, no fill) so the section has a human anchor without needing photos.

**FAQ**
- Remove the wrapping Card; let the accordion sit on the page with hairline dividers between items. Cleaner.

**Final CTA**
- Drop the gradient panel. Replace with a single centered serif line + button, framed by hairline rules top/bottom. Confident, not loud.

### Responsive QA pass

- Verify all sections at 360, 414, 768, 1024, 1280.
- Ensure no horizontal overflow from the chip row, breadcrumb, or 4-col grids.
- Mobile bottom-nav clearance already handled in Footer (`pb-20`); verify both new pages don't add to it.

## Files to change

- `src/index.css` — add Instrument Serif `@import`, add a `.font-display` utility (no token rename, no theme color changes).
- `tailwind.config.ts` — add `display: ['Instrument Serif', 'serif']` to `fontFamily`.
- `src/pages/Services.tsx` — full presentational rewrite per moves above.
- `src/pages/services/OpsecConsulting.tsx` — full presentational rewrite per moves above. Copy and JSON-LD unchanged.

## Out of scope

- Other pages (Index, About, News, etc.) — untouched.
- New routes, new copy, pricing changes, business logic.
- Backend, SEO content, sitemap.

## Verification

After build, open both routes at desktop and mobile viewports, screenshot and review for: typographic hierarchy, single-accent discipline, no overflow, generous spacing, and that the eye lands on the CTA without effort.
