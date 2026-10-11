# Documentation

Start with the [repository README](../README.md) for what Digibastion is and
how to run it. Everything else, by what you need:

## How it works

- [PRODUCT_AND_ARCHITECTURE.md](PRODUCT_AND_ARCHITECTURE.md): the whole system,
  from hosting and sources to every edge function, cron job, table and security
  rule.
- [../THREAT_INTEL_FEEDS.md](../THREAT_INTEL_FEEDS.md): each incident source,
  its terms and schedule, the severity and duplicate rules, and how to propose a
  new source.
- [SEO_AND_DISTRIBUTION.md](SEO_AND_DISTRIBUTION.md): how pages get indexed,
  the sitemaps, IndexNow, feeds, per-page HTML, UTM tags and preview images.
- [../edge/cloudflare-worker/README.md](../edge/cloudflare-worker/README.md): the
  optional Cloudflare Worker and how to switch it on.

## Plans and history

- [ROADMAP.md](ROADMAP.md): what is shipped, what comes next, and the decisions
  only the owner can make.
- [IMPLEMENTATION_HISTORY.md](IMPLEMENTATION_HISTORY.md): completed work, by
  date.
- [archive/LOVABLE_PLAN_HISTORY.md](archive/LOVABLE_PLAN_HISTORY.md): a summary
  of the September 2026 Lovable plans.
- `superpowers/` holds the historical working plans and design specs for
  earlier branches. They record what was intended at the time; the code and the
  documents above are the current truth.

## Releasing through Lovable

Each runbook is the prompt and checklist for one release. Run them in Lovable,
in order, after the branch is merged.

- [LOVABLE_SEO_RELEASE.md](LOVABLE_SEO_RELEASE.md): sitemaps, IndexNow, feeds,
  per-page HTML and sharing (branch `seo-aeo-docs`).
- [LOVABLE_PHASE3_RELEASE.md](LOVABLE_PHASE3_RELEASE.md): newsletters, email
  compliance and the 30-minute alert sender.
- [LOVABLE_THREAT_INTEL_REVAMP_RELEASE.md](LOVABLE_THREAT_INTEL_REVAMP_RELEASE.md):
  one record per incident and the new feed page.
- [LOVABLE_TELEGRAM_RELEASE.md](LOVABLE_TELEGRAM_RELEASE.md): Telegram alerts.
- [LOVABLE_SLOWMIST_RELEASE.md](LOVABLE_SLOWMIST_RELEASE.md): the SlowMist
  importer, kept switched off.
- [LOVABLE_QUILLMONITOR_RELEASE.md](LOVABLE_QUILLMONITOR_RELEASE.md): the
  QuillMonitor incremental sync.
- [LOVABLE_WEB3_RELEASE.md](LOVABLE_WEB3_RELEASE.md): the Web3 incident backend.

## Security

- [../SECURITY.md](../SECURITY.md): how to report a vulnerability and what not
  to test.
- [security/2026-09-27-source-review.md](security/2026-09-27-source-review.md):
  the September 2026 source review, with a status note on what is still open.

## Contributing

- [../CONTRIBUTING.md](../CONTRIBUTING.md): setup, the rules the code depends
  on, and how to send a pull request.
- [../AGENTS.md](../AGENTS.md): short architecture rules for coding agents and
  people alike.

## Not documentation

`roadmap.md` at the repository root is Lovable's working task log, not the
roadmap. Lovable writes it; do not edit it by hand. The roadmap is
[ROADMAP.md](ROADMAP.md) in this folder.
