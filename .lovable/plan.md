# Humanize Services Copy

## Goal
Rewrite all copy on `/services` and `/services/opsec-consulting` so it reads like a senior copywriter sat with Raiders and Cryptonian16 for an afternoon and wrote it. No em dashes. None of the AI tells: "your X. your Y. your Z.", "can't afford a mistake", "don't wait for a breach", "now booking", "secure the stack", "we hard­en your...", "we audit every...", parallel-construction triplets, vague "hands-on expert work".

## Voice
First person plural where natural ("we", "us"). Specific verbs, concrete nouns. Short sentences mixed with one longer one per paragraph. Confident, not salesy. Honest about what we do and don't do. Punctuation: commas, periods, parentheses, the occasional colon. No em dashes anywhere. Hyphens are fine.

## Scope of edits (copy only)
Layout, components, fonts, design tokens, and JSON-LD stay exactly as they are. Only string literals change.

### `src/pages/Services.tsx`
- Hero eyebrow, h1, lede, button labels.
- Service card titles, summaries, bullets.
- "How engagements work" step titles + bodies.
- Credentials list (right rail + mobile).
- Final CTA eyebrow, h2, fineprint.

### `src/pages/services/OpsecConsulting.tsx`
- Hero eyebrow, h1, lede, button labels, right-rail credentials.
- Threat-landscape intro + each of the four entries (title, body, "how we address it").
- "What an engagement covers" bullets.
- Process step titles + bodies.
- Packages: names stay, descriptions and feature bullets get rewritten.
- Team bios for Raiders and Cryptonian16.
- FAQ questions and answers (tone pass, keep the substance).
- Final CTA eyebrow, h2, fineprint.

## Examples of the new register

Hero (Services), instead of "Security work for teams that can't afford a mistake":
> "We do the security work most teams put off until something goes wrong."
> Lede: "DigiBastion is free and open source. If you'd rather have someone who lives in this stuff sit down with you and actually do the review, that's what these engagements are for."

OpSec hero, instead of "Your keys. Your coins. Your sovereignty.":
> "OpSec for people who already know what's at stake."
> Lede: "Most founders and holders we work with don't need to be told the risks. They want a quiet afternoon with someone who can look at their setup and tell them what to change first."

Threat entry, instead of "We harden your inbound-contact workflow...":
> "How we deal with it: we put a second-channel check on every cold inbound, move first-time calls into a throwaway VM, and make a rule that you never install a meeting client you didn't already have."

CTA, instead of "Don't wait for a breach to find out what was missing":
> "If something here lands, book a call. Thirty minutes, no pitch, and you'll know within the first ten whether we're useful to you."

## Out of scope
Other pages, design, JSON-LD, routes, navigation, business logic. Pricing strings ("Contact for quote") stay.

## Verification
After edits, grep both files for em dashes (`—` and `–`) and the banned phrases above. Open both pages at desktop and mobile and read top to bottom.
