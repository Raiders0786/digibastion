# Digibastion roadmap

Last reviewed: 2026-09-27

This roadmap is organized around user outcomes, not a list of speculative
features. A feature is **shipped** when it exists in the repository and has a
public route or documented operational path. It is **validated** only when its
production behavior has been checked with the required platform access.

## Shipped

| Outcome | Evidence | Validation state |
| --- | --- | --- |
| People can assess and improve personal security | 274 checklist items in 11 categories; `/quiz`, `/category/:categoryId`, `/share`, and `/leaderboard` routes | Public routes and local flows checked; production analytics require owner access |
| People can follow current threats | `/threat-intel`, RSS/Web3/QuillMonitor ingestion functions, alerts, digests, and subscription management | Public feed checked; schedules, email delivery, and private health data require Supabase access |
| People can learn by topic | 57 article entries, 28 tool entries, resources, search, filters, related links, and structured data | Public article index checked; the corpus still needs a source-by-source editorial freshness review |
| Teams can request expert help | `/services`, `/services/opsec-consulting`, `/services/full-stack-review`, and `/contact` | Public routes checked; inquiry and conversion performance require production data |
| Teams can inspect domain trust evidence | [VANTAGE](https://vantage.digibastion.com/) public score previews plus research, knowledge, checks, use cases, and incident notes | Public routes returned successfully on 2026-09-27; authenticated scans and remediation workflows were not tested |
| Operators can manage the platform | Admin analytics, scheduled-job health, ingestion health, and API-key routes | Present in source; requires authorized Supabase access to validate |

Completed repairs and deployment history live in
[`docs/IMPLEMENTATION_HISTORY.md`](docs/IMPLEMENTATION_HISTORY.md). Historical
implementation plans are not the current roadmap.

## Now: make the product understandable and trustworthy

### 1. One clear product system

- Make the main site explain the relationship between Digibastion education,
  threat intelligence, services, and VANTAGE within the first screen and in
  global navigation.
- Give each audience a short path: individual, developer, protocol or company,
  security researcher, and contributor.
- Cross-link relevant checklist items, threat records, guides, services, and
  VANTAGE checks without duplicating the same content on every page.
- Use consistent names, domains, contact details, and product descriptions
  across both properties.

Success evidence: users can choose a relevant next step without opening the
About page; service and VANTAGE referrals can be measured separately.

### 2. Resolve the licensing contradiction

- Current legal text is MIT plus a Commons Clause commercial restriction. That
  makes the repository source-available, not OSI-approved open source.
- Remove remaining “open source” claims from the public application and other
  properties unless the owner replaces the LICENSE with a standard open-source
  license.
- Decide whether the intended model is Commons Clause source-available or an
  unmodified open-source license. Legal text must be changed only by the owner.

Success evidence: LICENSE, website copy, repository badges, contribution copy,
and grant descriptions use the same accurate term.

### 3. Technical SEO foundation before volume

- Ensure every indexable route returns its own title, description, canonical,
  social image, and structured data in the initial HTML response. The live SPA
  currently returns homepage metadata and `/` canonical markup before client
  rendering on several deep routes.
- Generate sitemaps from the canonical route and article inventories, exclude
  private/utility routes, and validate them after every release.
- Add breadcrumb and organization/product relationships where they describe
  visible page content; do not add schema solely to chase rich results.
- Monitor index coverage, canonical selection, Core Web Vitals, and conversions
  in Search Console and first-party analytics.

Success evidence: a sample from every route family has the intended server
response, chosen Google canonical, valid structured data, and no orphan pages.

### 4. Editorial integrity and incident publishing

- Audit all 58 guides for accuracy, primary citations, author/reviewer,
  reviewed date, version-sensitive screenshots, and claims that have aged out.
- Update year-specific titles only when the body has actually been reviewed.
- Publish incident analysis from a repeatable brief: event timeline, affected
  systems, confirmed impact, attack path, detection, mitigations, primary
  sources, uncertainty, and lessons mapped to Digibastion or VANTAGE controls.
- Keep threat-feed aggregation separate from editorial articles. Do not turn
  unverified feed summaries into authoritative incident reports.
- Prefer a smaller, maintained body of useful pages over mass-produced posts.

Success evidence: every indexed guide has substantive unique content, visible
provenance, an owner, a review date, and a relevant next action.

## Next: turn useful visits into durable relationships

### 5. Guided journeys and useful interactions

- Let a visitor choose a goal and receive a short, saveable plan assembled from
  the quiz, checklist, guides, and tools.
- Add plain-language “why this matters,” effort, and verification guidance to
  high-priority controls.
- Offer printable/exportable personal plans without requiring an account.
- Connect organization-facing controls to an appropriate VANTAGE check or
  service review.
- Test keyboard, screen-reader, reduced-motion, low-bandwidth, and small-screen
  behavior as release requirements.

### 6. Services with clear evidence and boundaries

- Define who each service is for, deliverables, prerequisites, exclusions,
  engagement steps, and a useful sample output.
- Add case studies only with client permission and verifiable outcomes; use
  anonymized examples when necessary.
- Route consultations through one trackable, privacy-conscious intake flow.
- Make it clear that educational content and automated checks are not a
  guarantee of security.

### 7. Contribution system

- Label issues by contribution size, skill area, and whether security-domain
  review is required.
- Publish small, reviewable contribution briefs for content corrections,
  source verification, accessibility, mobile QA, testing, and new controls.
- Credit merged contributions accurately without promising rewards, response
  times, or placement that the maintainers cannot guarantee.
- Keep vulnerability reports out of public issues; follow `SECURITY.md`.

## Later: expand only after evidence supports it

- Organization accounts and shared remediation plans.
- VANTAGE portfolio monitoring, integrations, and exports beyond the current
  beta surface.
- Public APIs for stable, intentionally public threat and control data.
- Localization after terminology, update ownership, and review capacity are in
  place.
- Browser or mobile clients only if research shows they solve a problem the
  responsive web products cannot.

## Explicitly not committed

The previous roadmap listed AI source-code analysis, instant supply-chain
monitoring, a browser extension, a native mobile app, and broad CI/CD scanning
against expired calendar dates. They are not current commitments. Any of them
can return as a scoped proposal with an owner, threat model, data sources,
operating cost, maintenance plan, and measurable user need.

## Owner and platform decisions still needed

1. Choose the long-term license model and update public claims accordingly.
2. Confirm which VANTAGE authenticated capabilities are generally available,
   beta-only, or invitation-only.
3. Provide Search Console, analytics, Vercel, Supabase, and email-delivery
   access for production validation.
4. Name editorial and technical reviewers who can approve security guidance
   and recent-incident coverage.
5. Choose the primary service conversion and community feedback channels.

To propose or own an outcome, read [`CONTRIBUTING.md`](CONTRIBUTING.md) and
open a focused issue with evidence, scope, and validation steps.
