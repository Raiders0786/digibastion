# Project Architecture Rules

- External threat-intelligence providers use isolated protected ingestion functions that normalize into `news_articles`; this preserves source independence and keeps credentials server-only.
- Provider-specific incident fields live in `news_articles.metadata`; this keeps the public feed schema stable while supporting rich source-aware UI and emails.