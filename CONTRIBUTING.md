# Contributing to Digibastion

Digibastion welcomes focused contributions from security practitioners,
developers, designers, technical writers, educators, and people using the
products in the field. You do not need to propose a large feature: correcting
one unsafe instruction or reproducing one mobile problem is valuable.

The repository is source-available under the terms in [`LICENSE`](LICENSE),
which includes a Commons Clause restriction. By contributing, you agree that
your contribution can be distributed under those repository terms.

## Before you begin

- Use a public GitHub issue for bugs, content corrections, and feature ideas.
- Use the private process in [`SECURITY.md`](SECURITY.md) for vulnerabilities,
  leaked credentials, or instructions that could put users at immediate risk.
- Open an issue before work that changes architecture, data models, external
  providers, authentication, email behavior, or several routes.
- Do not include real credentials, subscriber information, private incident
  data, raw provider payloads, or client data in an issue or pull request.

The current priorities are in [`ROADMAP.md`](ROADMAP.md). Architecture and
product boundaries are documented in
[`docs/PRODUCT_AND_ARCHITECTURE.md`](docs/PRODUCT_AND_ARCHITECTURE.md).

## Set up the project

You need Node.js 22.12 or later and npm.

```bash
git clone https://github.com/YOUR-USERNAME/digibastion.git
cd digibastion
cp .env.example .env
# Add publishable VITE_SUPABASE_* values for your own test project.
npm ci
npm run dev
```

Never use production service-role keys or provider credentials for local UI
work. If your change needs private platform access, describe the gap in the
pull request so a maintainer can run that validation.

Before submitting:

```bash
npm run check
```

This runs TypeScript, ESLint, Vitest, and the production build. Also inspect UI
changes at narrow mobile, tablet, and desktop widths, using keyboard navigation
and reduced motion where relevant.

## Good contribution scopes

### Security checklist items

Checklist categories live in `src/data/categories/` and use the
`SecurityItem` type in `src/types/security.ts`.

```typescript
{
  id: 'category-unique-id',
  title: 'Use a security key for important accounts',
  description: 'Short summary shown in list views.',
  completed: false,
  level: 'essential', // essential | recommended | optional | advanced
  details: 'Explain the risk, action, trade-offs, and how to verify it.',
  links: [
    { text: 'Primary documentation', url: 'https://example.com/docs' }
  ],
  threatLevels: ['basic', 'developer'],
  priority: 1
}
```

Use a stable, unique ID; changing an existing ID can break saved progress.
Prefer primary documentation or recognized standards. Avoid absolute safety
claims, unexplained jargon, vendor marketing, and advice that is risky without
context. A new category also needs registration in `src/data/securityData.ts`
and applicable threat-profile mappings in `src/data/threatProfiles.ts`. The
starter structure is in `src/templates/categoryTemplate.ts`.

### Guides and incident analysis

Article metadata lives in `src/data/articlesData.ts`; article bodies are mapped
in `src/data/articleContent.tsx`. Older compatibility articles remain in
`src/data/articlesData.ts` and add its cited body to
`src/data/articleContent.tsx`.

Every article contribution should include:

- a specific reader and problem;
- substantive, original guidance rather than a placeholder or rewritten feed;
- primary sources for technical and incident claims;
- a published and reviewed/modified date that reflects real editorial work;
- uncertainty and scope where facts are still developing;
- a practical next action that exists in Digibastion or VANTAGE;
- no invented loss figures, quotations, clients, credentials, or expertise.

For recent incidents, separate confirmed facts from analysis. Include the
event timeline, affected systems, impact, attack path, mitigations, primary
sources, and lessons. A threat-feed record is not by itself enough evidence for
an editorial article.

### Tools and resources

- Product tools: `src/data/tools/categories.ts`
- Resource directory: `src/data/links/categories/`

Verify the destination, ownership, current product behavior, and security
trade-offs. A listing is not an endorsement. Disclose affiliations and never
add referral tracking without explicit maintainer approval.

### Threat sources

Read [`THREAT_INTEL_FEEDS.md`](THREAT_INTEL_FEEDS.md) first. New providers need
a source-quality case, stable identifiers, a normalization plan, failure and
rate-limit behavior, and a credential/storage review. Providers must remain
isolated server-side and normalize into the existing public feed model.

### Product and UI work

- Use existing semantic design tokens rather than hard-coded light/dark colors.
- Keep content and actions usable at 320 CSS pixels and with 200% zoom.
- Preserve visible focus, meaningful labels, heading order, reduced-motion
  behavior, and screen-reader status feedback.
- Add or update tests for behavior changes.
- Include before/after screenshots for visual changes and list the viewports
  and interaction paths tested.

## Pull request checklist

Keep a pull request narrow enough to review. In its description, include:

- the user problem and why this change is appropriate;
- files and flows changed;
- tests and manual checks performed;
- screenshots for visual changes;
- security, privacy, accessibility, and migration considerations;
- production checks a maintainer must perform because they need private access;
- related issue or roadmap outcome.

Do not mix generated files, unrelated formatting, broad dependency updates,
and product behavior in the same pull request unless they are inseparable.
Maintainers may request changes or decline a proposal; no review time or merge
date is guaranteed.

## Communication

- [GitHub issues](https://github.com/Raiders0786/digibastion/issues) for
  actionable bugs and scoped proposals
- [GitHub discussions](https://github.com/Raiders0786/digibastion/discussions)
  for early ideas and community questions
- [Telegram](https://t.me/digibastion) for community conversation that does not
  contain confidential information

Thank you for helping make the guidance and products more accurate, usable,
and trustworthy.
