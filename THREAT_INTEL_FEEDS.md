# 📡 Threat Intelligence Feed Sources

<p align="center">
  <strong>Digibastion — Secure the Stack</strong><br/>
  Complete list of RSS/Atom feeds powering our Threat Intelligence Feed
</p>

---

## How It Works

Our backend ingestion system runs **every hour** and:

1. Fetches new articles from all active feeds below
2. Deduplicates by URL to avoid repeat entries
3. Decodes HTML entities and strips boilerplate from titles/summaries
4. Auto-categorizes articles based on feed source and keyword matching
5. Stores everything in our database, immediately available on [digibastion.com/news](https://digibastion.com/news)

Subscribers receive email digests (daily/weekly) based on their preferences.

---

## 🔴 Vulnerability Disclosure Feeds (13)

These feeds track CVEs, security advisories, and vulnerability disclosures from major vendors and databases.

| # | Source | Feed URL | Status |
|---|--------|----------|--------|
| 1 | **AWS Security Bulletins** | https://aws.amazon.com/security/security-bulletins/feed/ | ✅ Active |
| 2 | **CISA Alerts** | https://www.cisa.gov/cybersecurity-advisories/all.xml | ✅ Active |
| 3 | **Cisco Security Advisories** | https://sec.cloudapps.cisco.com/security/center/psirtrss20/CiscoSecurityAdvisory.xml | ✅ Active |
| 4 | **Debian Security Advisories** | https://www.debian.org/security/dsa | ✅ Active |
| 5 | **Fortinet PSIRT Advisories** | https://filestore.fortinet.com/fortiguard/rss/ir.xml | ✅ Active |
| 6 | **GKE Security Bulletins** | https://cloud.google.com/feeds/gke-security-bulletins.xml | ✅ Active |
| 7 | **Google Cloud Security Bulletins** | https://cloud.google.com/feeds/google-cloud-security-bulletins.xml | ✅ Active |
| 8 | **Microsoft Security Response Center** | https://api.msrc.microsoft.com/update-guide/rss | ✅ Active |
| 9 | **NVD Analyzed CVEs** | https://nvd.nist.gov/feeds/xml/cve/misc/nvd-rss-analyzed.xml | ✅ Active |
| 10 | **Oracle Critical Patch Updates** | https://www.oracle.com/security-alerts/cpujan2025.html | ⚠️ Disabled (403) |
| 11 | **Red Hat Security Advisories** | https://access.redhat.com/hydra/rest/securitydata/cve.json | ✅ Active |
| 12 | **Ubuntu Security Notices** | https://ubuntu.com/security/notices/rss.xml | ✅ Active |
| 13 | **Vulnerability Spoiler Alert** | https://talkback.sh/resource/rss.xml | ✅ Active |

---

## 🔵 Operational Security Feeds (7)

These feeds cover security news, threat analysis, incident reports, and industry trends.

| # | Source | Feed URL | Status |
|---|--------|----------|--------|
| 1 | **BleepingComputer** | https://www.bleepingcomputer.com/feed/ | ✅ Active |
| 2 | **Dark Reading** | https://www.darkreading.com/rss.xml | ✅ Active |
| 3 | **Krebs on Security** | https://krebsonsecurity.com/feed/ | ✅ Active |
| 4 | **Naked Security (Sophos)** | https://nakedsecurity.sophos.com/feed/ | ✅ Active |
| 5 | **Schneier on Security** | https://www.schneier.com/feed/atom/ | ✅ Active |
| 6 | **SecurityWeek** | https://feeds.feedburner.com/securityweek | ✅ Active |
| 7 | **The Hacker News** | https://feeds.feedburner.com/TheHackersNews | ✅ Active |

---

## 🤝 Suggest a New Feed

We're always looking to expand our coverage! To suggest a new feed source:

1. **Open an issue** — Use the [Feature Request template](https://github.com/Raiders0786/digibastion/issues/new?template=feature_request.md) with the feed URL, source name, and category
2. **Open a PR** — Add the feed details to this document and we'll handle the backend integration

### What makes a good feed source?

- ✅ Reliable RSS/Atom/XML format
- ✅ Regular updates (at least weekly)
- ✅ Security-focused content (vulnerabilities, advisories, threat intel, or OpSec)
- ✅ Reputable source with accurate reporting
- ❌ Paywalled or authentication-required feeds
- ❌ Marketing-heavy content disguised as security news

---

<p align="center">
  <strong>🛡️ Digibastion — Secure the Stack</strong><br/>
  <a href="https://digibastion.com/news">View the live feed →</a>
</p>
