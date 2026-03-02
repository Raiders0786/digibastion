

## Secure, Revocable API Access for Threat Intel

### Approach: Dedicated Edge Function + Revocable API Keys Table

The cleanest solution is to create a **revocable API key system** with a dedicated edge function that your colleague calls to query threat intel data. You control access entirely from your admin side.

### Architecture

```text
Colleague's Script                     Your Backend
─────────────────                     ─────────────
                                      
POST /functions/v1/threat-intel-api   ┌─────────────────────┐
  Header: x-api-key: <key>     ───►  │ Edge Function        │
                                      │  1. Validate API key │
                                      │  2. Check active/exp │
                                      │  3. Log usage        │
                                      │  4. Return articles  │
                                      └──────────┬──────────┘
                                                 │
                                      ┌──────────▼──────────┐
                                      │ news_articles table  │
                                      │ (read-only query)    │
                                      └─────────────────────┘
```

### What gets built

**1. Database: `api_keys` table**
- Columns: `id`, `key_hash` (SHA-256, never store plaintext), `name` (e.g. "Vladimir - X Bot"), `permissions` (JSONB array like `["read:threat-intel"]`), `is_active` (boolean for instant revocation), `expires_at` (optional expiry), `last_used_at`, `created_by` (admin user_id), `created_at`
- RLS: Only admins can view/manage. No public access.

**2. Edge Function: `threat-intel-api`**
- Accepts `x-api-key` header
- Hashes the incoming key and looks it up in `api_keys`
- Validates: active, not expired
- Updates `last_used_at` for audit trail
- Returns news_articles with filters (category, severity, limit, since date)
- Rate limited (optional: track in table)

**3. Admin UI: API Key Management section**
- Add to existing admin dashboard
- Generate new keys (shown once, then only hash stored)
- List active keys with last-used timestamps
- Toggle active/inactive for instant revocation
- Delete keys permanently

### Security properties
- **Granular**: Permission scoping via JSONB (can add `write:` scopes later)
- **Revocable**: Flip `is_active` to false, or delete the row
- **Auditable**: `last_used_at` tracking shows usage patterns
- **Time-bound**: Optional `expires_at` for automatic expiry
- **Zero plaintext**: Only SHA-256 hash stored in database
- **No direct DB access**: Colleague never touches the database directly

### How your colleague uses it

```bash
curl -X POST https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-api \
  -H "x-api-key: db_live_xxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "severity": "high", "since": "2025-01-01"}'
```

Returns clean JSON with title, summary, severity, tags, link, published_at - everything needed for X posts.

### Revocation flow
1. Go to admin dashboard > API Keys
2. Click "Revoke" next to the key
3. Key is immediately invalid on next request

