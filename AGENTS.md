# Project Architecture Rules

- External threat-intelligence providers use isolated protected ingestion functions that normalize into `news_articles`; this preserves source independence and keeps credentials server-only.
- Provider-specific incident fields live in `news_articles.metadata`; this keeps the public feed schema stable while supporting rich source-aware UI and emails.
- Ingestion functions record sanitized aggregate outcomes in `threat_intel_ingestion_runs`; this provides private operational health without storing provider payloads or credentials.