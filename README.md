# Digibastion

Digibastion helps people and teams reduce practical security risk before an
incident. The public site combines guided security checklists, an OpSec quiz,
threat intelligence, security guides, curated tools, and professional review
services. VANTAGE extends that work with external domain trust evidence for
Web3 and Web2 teams.

Supported by the [Ethereum Foundation Ecosystem Support Program in
2025](https://blog.ethereum.org/2025/12/02/allocation-q3-25#:~:text=Community%20%26%20education-,Digibastion,-Chirag%20Agrawal).

## Use the products

| Product | Best for | Start here |
| --- | --- | --- |
| Digibastion | Individuals, builders, security teams, and anyone learning practical digital security | [Security checklist](https://www.digibastion.com/), [OpSec quiz](https://www.digibastion.com/quiz), [threat intelligence](https://www.digibastion.com/threat-intel), [guides](https://www.digibastion.com/articles) |
| VANTAGE by Digibastion | Teams that need evidence about DNS, email, TLS, web, frontend, phishing, breach, and Web3 trust paths | [Public overview and score lookup](https://vantage.digibastion.com/), [security checks](https://vantage.digibastion.com/checks/), [use cases](https://vantage.digibastion.com/use-cases/) |
| Security services | Founders and teams that want hands-on OpSec or full-stack security review | [Services](https://www.digibastion.com/services) |

If you are unsure where to begin, take the quiz, complete the essential
checklist items it recommends, and use the threat feed to keep those controls
current. Organizations evaluating a domain should start with VANTAGE.

## What is shipped

The repository currently contains:

- 274 checklist items across 11 security categories, with local progress and
  threat-profile guidance.
- An eight-question OpSec assessment with server-validated scoring,
  shareable results, and a leaderboard.
- A unified threat-intelligence experience for RSS advisories, Web3 incidents,
  and provider-attributed incident records, plus optional email alerts and
  digests.
- 58 security guides covering wallet safety, phishing, DeFi, smart contracts,
  privacy, incident response, and developer security.
- 28 curated security-tool entries and a broader resources directory.
- OpSec consulting and full-stack review service pages.
- Private administration surfaces for analytics, ingestion health, scheduled
  operations, and API-key management.
- VANTAGE, live at `vantage.digibastion.com`, with public score previews,
  private evidence workflows, and research, knowledge, checks, use-case, and
  incident-note libraries.

These counts describe the current source tree, not usage or performance
claims. Live application routes and the VANTAGE pages above were checked on
2026-09-27. Backend job health and private workflows require access to the
owning Supabase and VANTAGE environments.

See [Product and architecture](docs/PRODUCT_AND_ARCHITECTURE.md) for route,
system, data-flow, and deployment details. See [Roadmap](ROADMAP.md) for the
small set of prioritized next outcomes; completed production work is recorded
in [Implementation history](docs/IMPLEMENTATION_HISTORY.md).

## Local development

Requirements:

- Node.js 22.12 or later
- npm
- A Supabase project when testing data-backed features

```bash
git clone https://github.com/Raiders0786/digibastion.git
cd digibastion
cp .env.example .env
# Add your project-specific VITE_SUPABASE_* publishable values.
npm ci
npm run dev
```

The development server is available at `http://localhost:8080`. Run the full
release gate before opening a pull request:

```bash
npm run check
```

`npm run check` runs TypeScript, lint, unit tests, and a production build.
Only Supabase browser/publishable values belong in `.env`. Service-role keys,
cron secrets, feed credentials, and email credentials belong in the relevant
deployment platform's secret store.

## Repository map

```text
api/                         Vercel request handlers
public/                      Static metadata, PWA, crawler, and image assets
src/components/              Shared React UI
src/data/                    Checklist, article, tool, and resource content
src/pages/                   Public, service, subscription, and admin routes
src/integrations/supabase/   Generated database types and browser client
src/utils/                   Shared client utilities
supabase/functions/          Deno Edge Functions
supabase/migrations/         Database schema, policies, functions, and jobs
docs/                        Current architecture and historical operations
```

External threat providers are ingested independently on the server and
normalized into `news_articles`. Provider-specific incident details stay in
`news_articles.metadata`, while sanitized aggregate run outcomes are recorded
in `threat_intel_ingestion_runs`. This keeps credentials and raw provider
payloads out of the public client.

## Contribute

Useful contributions include correcting a security recommendation, reviewing
an article against primary sources, improving mobile or accessible behavior,
adding tests, proposing a reputable threat source, or reproducing a bug.
Start with [CONTRIBUTING.md](CONTRIBUTING.md) and open an issue before a large
or architecture-changing implementation. Product ideas and field reports are
welcome in [GitHub Discussions](https://github.com/Raiders0786/digibastion/discussions).

Please report security vulnerabilities privately as described in
[SECURITY.md](SECURITY.md).

## Community and support

- [GitHub issues](https://github.com/Raiders0786/digibastion/issues)
- [GitHub discussions](https://github.com/Raiders0786/digibastion/discussions)
- [Telegram](https://t.me/digibastion)
- [X / Twitter](https://x.com/__Raiders)
- [Support the project](https://www.digibastion.com/support)

## License

This repository is **source-available**, not OSI-approved open source. The
[LICENSE](LICENSE) contains the MIT text plus a Commons Clause restriction that
prohibits selling, leasing, or providing paid services based on the software
without prior permission. Non-commercial use, modification, and sharing are
allowed subject to the full license terms. Contact `raiders@digibastion.com`
for commercial licensing.

The project owner still needs to decide whether the long-term model should
remain Commons Clause source-available or move to an unmodified open-source
license. Until that decision is made, the LICENSE file controls.
