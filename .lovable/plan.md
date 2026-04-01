

# Plan: Add Threat Intel Feed Sources Documentation

## What & Why

People are asking where the RSS feed list lives. The feed list is stored in the database (not in a static file), so it's not directly visible in the repo. We need to add a **`THREAT_INTEL_FEEDS.md`** file at the repo root that documents all 19 feeds, their categories, and how the system works — so contributors and curious users can find it instantly.

## Implementation

### 1. Create `THREAT_INTEL_FEEDS.md` at repo root

A clean, linkable document listing:

- All 19 RSS/Atom feeds organized by category (Vulnerability Disclosure vs Operational Security)
- Feed name, URL, and active status (noting Oracle is disabled due to 403)
- Brief explanation of how the ingestion works (edge function runs hourly, deduplicates, categorizes, stores in DB)
- How to suggest new feeds (open an issue or PR)

**Feed list to include:**

**Vulnerability Disclosure (13 feeds):**
- AWS Security Bulletins
- CISA Alerts
- Cisco Security Advisories
- Debian Security Advisories
- Fortinet PSIRT Advisories
- GKE Security Bulletins
- Google Cloud Security Bulletins
- Microsoft Security Response Center
- NVD Analyzed CVEs
- Oracle Security (disabled — 403)
- Red Hat Security Advisories
- Ubuntu Security Notices
- Vulnerability Spoiler Alert

**Operational Security (6 feeds):**
- BleepingComputer
- Dark Reading
- Krebs on Security
- Naked Security (Sophos)
- SecurityWeek
- The Hacker News

### 2. Add reference in README.md

Add a one-liner + link under the Threat Intelligence section pointing to `THREAT_INTEL_FEEDS.md`.

### 3. Add reference in CONTRIBUTING.md

Add a short section under "Contribution Types" for "Adding Threat Intelligence Feeds" pointing contributors to the doc and explaining they can open an issue/PR to suggest new sources.

---

**Files changed:** 3 — `THREAT_INTEL_FEEDS.md` (new), `README.md` (1 line), `CONTRIBUTING.md` (short section)

**Your answer to people asking:** "The full list of feeds is documented here: `THREAT_INTEL_FEEDS.md` in the repo root. The ingestion runs hourly via a backend function. PRs/issues welcome to suggest new sources."

