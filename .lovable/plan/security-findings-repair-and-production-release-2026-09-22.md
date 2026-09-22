# Security findings repair and production release

## What I will fix
- Prevent public subscription requests from replacing an existing subscriber's settings or management link without email ownership proof.
- Escape all user-controlled quiz sharing text before it enters page HTML.
- Validate email tracking IDs against a real sent-email record before recording an event, while keeping tracking pixels and approved link redirects working.
- Remove subscriber email addresses and names from operational logs without reducing delivery diagnostics.
- Restrict test-digest recipients to the signed-in administrator's own email while leaving scheduled subscriber delivery unchanged.
- Keep intentionally public threat articles, feed definitions, and security keywords readable because they power the public threat-intelligence experience.
- Safely resolve the shared production dependency advisory without changing the charting package version that previously broke the app.

## Regression checks before release
- Verify admin access and RSS, Web3, and AI refresh actions.
- Verify new subscription, email verification, management-link, unsubscribe, scheduled digest, and tracking behavior.
- Verify quiz start, completion, scoring, and shared-result rendering, including malicious input tests.
- Run focused type checks, automated tests, production build, backend security checks, and function smoke tests.
- Deploy changed backend functions, publish the app, then verify the live domain and key public pages.

## Technical details
- Preserve service and scheduled-job authorization paths.
- Use non-enumerating responses for subscriber endpoints so account existence is not disclosed.
- Replace raw email logging with event IDs/counts only.
- Add a direct safe runtime override only if it resolves the shared transitive advisory without dependency regressions.
- Mark only findings proven fixed; retain public-data findings as documented intentional behavior rather than weakening public feeds.
