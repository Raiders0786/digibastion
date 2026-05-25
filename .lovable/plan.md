# Plan: Promote Services in nav + add Full-Stack Security Review

Two related moves. Same bar as the OpSec page: editorial layout, Instrument Serif display, humanized copy, no em dashes, no AI tells, SEO clean.

---

## 1. Navigation swap (Quiz → Services)

**Why:** Services needs a prominent slot for the Qubes listing and for paid work in general. Quiz lives in Resources where the landing page already promotes it (hero card, sidebar, mobile CTA, category list).

**Desktop top bar (`src/components/Navbar.tsx`)**
- Remove the standalone "Quiz" button between Checklists and Threat Intel.
- Add a "Services" button in its place (Briefcase icon, same styling).
- Keep Quiz in the Resources dropdown (add a `{ route: '/quiz', icon: Zap, label: 'OpSec Quiz' }` entry near the top of `resourceItems`).
- Remove Services from `resourceItems` since it now has its own slot.

**Mobile bottom bar (`src/components/MobileBottomNav.tsx`)**
- Currently has both Services and Quiz. Drop Quiz from the bottom tabs (Services stays). Quiz is one tap away inside the Resources/More menu and on the landing page hero.

**Landing page:** no changes needed. `Index.tsx` already surfaces Quiz in the hero card, sidebar, and category strip.

---

## 2. New service page: Full-Stack Security Review

**Route:** `/services/full-stack-review`
**File:** `src/pages/services/FullStackReview.tsx`
**Wire up:** add lazy/eager import + route in `src/App.tsx`; add sitemap entry; surface as the new "02 · Available now" on the Services index (DNS shifts to 03, Threat Intel Retainer to 04, or DNS stays 02 and Full-Stack becomes 02 promoted above DNS — see "Services index" below).

### Positioning (one-liner)
> A senior pair of eyes across your entire crypto product: contracts, infra, app, APIs, cloud, and the controls your auditors and counterparties will eventually ask about.

### Scope of the review
Six tracks, each scoped per engagement. The page presents them as an editorial list with what we look at and how we report it back. No triplets, no "we harden your...".

1. **Smart contracts and onchain logic.** Solidity / Vyper / Move review with an attacker's eye. Re-entrancy patterns, access control, oracle assumptions, upgrade paths, signature replay, donation/inflation attacks on share-based vaults, MEV exposure on user flows. Recent patterns in scope as of May 2026: ERC-7683 cross-chain intent griefing, EIP-7702 delegation misuse, restaking slashing surfaces, account-abstraction paymaster abuse, LST/LRT depeg cascades.
2. **Offchain services and APIs.** Indexers, relayers, signers, keeper bots, webhooks. We look at auth, idempotency, replay windows, queue poisoning, key custody on the server side, what happens when an RPC lies to you.
3. **Frontend and dApp surface.** Wallet connect flows, signature prompts the user can actually read, EIP-712 hygiene, approval UX, dependency supply chain (npm, CDN, font loaders), CSP, subresource integrity, the lookalike-domain story.
4. **Cloud and infra.** AWS / GCP / Cloudflare configs that tend to bite crypto teams: IAM blast radius, KMS usage, secret rotation, SSRF on metadata endpoints, edge function permissions, exposed S3 / R2 buckets, terraform drift.
5. **Identity, access, and people.** Who can deploy, who can sign, who can press the upgrade button, who has prod DB access at 2am. SSO, MFA on the boring accounts (registrar, DNS, GitHub org, Vercel, npm), recovery plans.
6. **Compliance readiness (light touch).** Not a SOC 2 audit. A read on where you are versus what your enterprise customers, market makers, and chain foundations are going to ask for in the next twelve months: SOC 2 Type I scoping, ISO 27001 control gaps, MiCA operational resilience, US state money-transmitter posture if relevant, sanctions screening on counterparties.

### Page structure (mirrors OpSec page)
1. Editorial hero. Eyebrow: `Services · Full-Stack Review`. H1 in Instrument Serif with one italicised primary-color phrase. Lede in body voice. Two CTAs: Book a call + See what we cover.
2. "What we actually look at" — the six tracks above as a numbered editorial list.
3. "What you get back" — a short, honest description of the deliverable: a ranked findings doc, a working session to walk through it, and a remediation checklist your team can actually close out. Optional follow-up retest.
4. "How an engagement runs" — same horizontal stepper as OpSec: intro call, scoping doc + flat fee, review (1-3 weeks depending on surface), readout, optional retest.
5. Packages, flat fee, no hourly games:
   - **Spot Check** — one surface (contracts only, or cloud only, or app only). 1 week. Short ranked findings doc.
   - **Full Review** — all six tracks. 2-3 weeks. Findings doc, working session, 30 day question window.
   - **Embedded** — quarterly review + a Slack/Telegram channel we actually answer in. For teams who want a security person on retainer without hiring one yet.
   Pricing: "Contact for quote" on all three.
6. Team — same two cards as OpSec (Raiders, Cryptonian16) with one-line bios rewritten for this scope ("We have done this on protocols holding nine-figure TVL and on five-person teams two weeks from launch.").
7. FAQ — 5 questions, humanized:
   - Is this an audit I can put on my landing page? (No, this is a review. We will tell you which audit firms to talk to if you need a stamp.)
   - How is this different from a Code4rena contest? (Different shape of work. We sit with your team, look at the whole system, and own the followup. Contests rip through a codebase in parallel and stop there.)
   - Can you sign an NDA? (Yes, mutual, before the first call if you want.)
   - What if you find something serious mid-review? (We tell you the same hour, in writing, with a suggested mitigation. We do not sit on findings.)
   - Do you keep working with us after the report? (If you want. The Embedded package exists because most teams said yes.)
8. Final CTA — same shape as OpSec, copy in the same register.

### Copy rules (same as OpSec page)
- First person plural. Specific verbs. Concrete nouns. One longer sentence per paragraph.
- No em dashes anywhere. Hyphens fine, colons fine, parentheses fine.
- Banned: "secure the stack", "don't wait for a breach", "your X. your Y. your Z.", "harden your", "now booking", "can't afford a mistake", "world-class", "battle-tested", "comprehensive end-to-end".
- Sound like someone who actually does this work talking to a peer, not a marketer.

### SEO
- Title: `Full-Stack Web3 Security Review: Contracts, APIs, Cloud, Compliance | Digibastion`
- Description (under 160): `A senior review across your crypto product: smart contracts, offchain services, dApp, cloud, identity, and compliance readiness. Flat fee, named team, honest report.`
- Canonical: `https://www.digibastion.com/services/full-stack-review`
- JSON-LD: `Service` schema with `provider` = Digibastion `Organization`, `areaServed` = Worldwide, `serviceType` = Security review, `offers` mirroring the three packages.
- Add `<url>` entry to `public/sitemap.xml`.
- Internal links: from `/services` card, from `/services/opsec-consulting` related-services strip (add one), and from `/about`.

### Design
Reuse the Quiet Authority system already in place:
- `font-display` Instrument Serif for h1/h2 with one italic accent in primary.
- Mono uppercase eyebrows at `text-[11px] tracking-[0.18em]`.
- Flat `bg-card/40` surfaces, `border-border/60` hairlines, `ring` not floating shadows on packages.
- Numbered editorial lists (`before:content-['+']` bullets to match OpSec page).
- Horizontal stepper on lg+, vertical on mobile.
- Fully responsive: same `text-[2.75rem] → text-6xl → text-7xl` ramp as OpSec, `px-5 sm:px-8 lg:px-10`.

### Services index (`src/pages/Services.tsx`)
Two options, please pick one when reviewing — default is **A**:
- **A. Promote Full-Stack to 02 (Available now).** Order becomes: 01 OpSec, 02 Full-Stack Review, 03 DNS & Domain Monitoring (coming soon), 04 Threat Intel Retainer (coming soon).
- **B. Keep DNS at 02, add Full-Stack as 04.** Less prominent.

---

## Out of scope
- No changes to landing page, Quiz page itself, or any backend.
- No new dependencies. No design tokens added.
- No pricing numbers committed publicly; all three packages say "Contact for quote".

## Verification
- Grep new file for `—`, `–`, and the banned-phrases list.
- Walk both `/services` and `/services/full-stack-review` at 375px, 768px, 1024px, 1440px.
- Confirm Quiz still reachable from desktop Resources dropdown, mobile More menu, and landing hero.
- Confirm sitemap and JSON-LD render.
