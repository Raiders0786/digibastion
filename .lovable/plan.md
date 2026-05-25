## Goal
Add a legitimate, SEO-optimized **Services** section to digibastion.com so Qubes Forums (and other directories) can verify the paid OpSec consulting offering. Lead with one fully built service page — **OpSec Consulting** — co-delivered by Raiders + Cryptonian16, with a Cal.com booking CTA.

## Information architecture

New routes:
```
/services                   → Services hub (overview of all offerings)
/services/opsec-consulting  → Full OpSec service page (the flagship, P0)
```

Navbar: add **Services** link (desktop nav + mobile bottom nav + hamburger).
Footer: add a **Services** column linking to the hub and the OpSec page.

Future-ready: hub is built as a grid so we can drop in `/services/dns-domain-monitoring`, `/services/threat-intel-retainer`, etc., later without restructuring.

## Page 1 — `/services` (hub)

Sections:
1. **Hero** — "Security services for teams that can't afford to get hacked." Subhead positions DigiBastion as open-source first, with paid expert services on top.
2. **Why work with us** — 3 trust pillars: Ethereum Foundation ESP grant recipient, open-source platform powering the work, named researchers (not anonymous).
3. **Service cards grid** — OpSec Consulting (Available now), DNS & Domain Security Monitoring (Coming soon — links to scanner waitlist), Threat Intel Retainer (Coming soon).
4. **How engagements work** — 4-step strip: Discovery call → Scoped assessment → Remediation report → Optional retainer.
5. **CTA band** — "Book a free 30-min discovery call" → cal.com/raiders.

## Page 2 — `/services/opsec-consulting` (flagship, P0)

Structured to educate → build trust → convert.

1. **Hero**
   - H1: "Web3 OpSec Consulting — Threat Modeling, Device Hardening, Qubes Pathway"
   - Subhead positioning + dual CTAs: **Book a discovery call** (cal.com/raiders) + **Browse free OpSec checklist** (`/category/opsec`).
   - Trust strip under hero: "ESP 2025 grant · Open-source · 50+ protocols monitored".

2. **The threat landscape (May 2026)** — short, scannable cards referencing recent incidents pulled from our own threat intel categories (no fabricated stats). Themes:
   - DPRK recruiter / fake-VC playbook still landing (LinkedIn / Telegram / fake meeting clients).
   - Clipboard hijackers + infostealers on macOS with signed payloads.
   - Unlimited token approvals & address-poisoning drains.
   - Hardware wallet supply-chain & firmware concerns.
   Each card ends with "How we address this in an engagement."

3. **What an engagement covers** — checklist-style: wallet & approval review, key storage & multisig posture, device & browser compartmentalization, Qubes OS pathway, phishing / social-engineering drills, incident response runbook.

4. **Process** — 4 steps: Discovery (free 30 min) → Posture audit → Prioritized remediation report → Optional retainer / IR on call.

5. **Packages** — three tiers, all "Contact for quote" (no prices to keep flexibility):
   - **Baseline Audit** — solo holders / small teams.
   - **Full Posture Review** — funds, DAOs, founders. *Most popular.*
   - **Advisory Retainer** — ongoing monitoring + incident response.

6. **Who you'll work with** — two profile cards, **Raiders first**, then **Cryptonian16**:
   - **Raiders** — Founder, DigiBastion. Security researcher; builds the platform and leads engagements. Links: X (@__Raiders), GitHub.
   - **Cryptonian16** — OpSec Guru. Security expert specializing in operational security practices and threat mitigation. Link: X (@SolenyaResearch).
   Copy frames them as a small focused team ("We're a two-person OpSec team…").

7. **FAQ** (SEO + objection handling) — 6 Qs: NDA?, remote vs in-person, do you take custody of anything (no), Qubes required?, response time for retainer clients, refund policy.

8. **Final CTA** — large band: "Book a free 30-minute discovery call" → cal.com/raiders, secondary "Email us" → `/contact`.

## About page edits (`src/pages/About.tsx`)

- **Cryptonian16** card: keep as-is in Contributors, AND add a small note "Also delivers OpSec engagements with us — see /services/opsec-consulting".
- **Ridham Bhagat** card: change role label from "DNS Security Scanner" subtitle wording to "Contributor — DNS module research". Description softened to "Contributes to research on the DNS & domain security module."
- No other contributor changes.

## SEO

- Per-page `MetaTags` with unique title/description/keywords:
  - Services hub — title: "Security Services — Web3 OpSec, DNS Monitoring & Threat Intel | DigiBastion"
  - OpSec page — title: "Web3 OpSec Consulting — Threat Modeling & Qubes Hardening | DigiBastion"
- JSON-LD on the OpSec page:
  - `Service` schema (provider = Organization DigiBastion, serviceType "Operational Security Consulting", areaServed Worldwide).
  - `FAQPage` schema mirroring the FAQ section.
  - `BreadcrumbList` Home → Services → OpSec Consulting.
- Internal links: hub ↔ OpSec page ↔ `/category/opsec` ↔ `/threat-intel` ↔ `/articles`.
- Add both new routes to `public/sitemap.xml`.
- Canonical URLs via existing MetaTags utility (already supports `canonical`).
- All Cal.com links: `rel="noopener noreferrer"`, `target="_blank"`, tracked with simple inline label (no extra analytics deps).

## Navigation + entry points

- `Navbar.tsx`: add "Services" between Tools and Threat Intel.
- `MobileBottomNav.tsx`: add Services entry (or replace the lowest-priority slot — to confirm during build).
- `Footer.tsx`: new **Services** column with links to hub + OpSec.
- `Index.tsx`: add a small "Need expert help? See our services" link near the Security Presets area (one-line, non-intrusive).

## Technical notes

- New files:
  - `src/pages/Services.tsx`
  - `src/pages/services/OpsecConsulting.tsx`
  - `src/data/services.ts` (typed array so future services are data-driven)
  - `src/components/services/ServiceCard.tsx`
  - `src/components/services/BookCallCTA.tsx` (reusable Cal.com button)
- Routes added to `src/App.tsx` with `<MetaTags />` wrappers (matching existing pattern).
- Cal.com link kept as a plain anchor for now (`https://cal.com/raiders`); we can swap to the Cal embed widget later if you want inline scheduling.
- Use existing design tokens only (no new colors); follow the dark/light theme system already in place.
- Wrap new pages in `ErrorBoundary` pattern already used elsewhere; declare hooks before any conditional returns.

## Out of scope (call out for later)

- Pricing display (kept as "Contact for quote" per the reference site model).
- Cal.com inline embed (anchor link for now).
- Stripe/Paddle for paid bookings (services are quote-based).
- Additional service pages (DNS Monitoring, Threat Intel Retainer) — stubbed as "Coming soon" cards on the hub.

## Acceptance

- `/services` and `/services/opsec-consulting` render, are linked from Navbar + Footer, and appear in sitemap.
- OpSec page lists Raiders first, then Cryptonian16, with correct bios + links.
- About page reflects the Ridham wording change and the Cryptonian16 OpSec-team note.
- Each new page has unique title/description; OpSec page ships Service + FAQ + Breadcrumb JSON-LD.
- Qubes Forum reviewer visiting digibastion.com/services/opsec-consulting sees a clear, branded, in-domain advertisement of the paid OpSec offering.
