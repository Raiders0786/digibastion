# Security policy

## Supported version

Security fixes are made against the current `main` branch and the current
production deployments. Historical commits, forks, and self-hosted deployments
are not maintained by the Digibastion team.

## Report a vulnerability privately

Do not open a public issue for a suspected vulnerability, leaked credential,
private user data, or an exploitable error in security guidance.

Use GitHub's **Security → Report a vulnerability** flow if private
vulnerability reporting is available for this repository. Otherwise email
`raiders@digibastion.com` with a subject that begins `[SECURITY]`.

Include only what is needed to reproduce and assess the issue:

- affected product, URL, route, function, or commit;
- impact and the conditions required to reproduce it;
- concise reproduction steps or a minimal proof of concept;
- whether you accessed, modified, or encountered any data;
- suggested remediation, if you have one;
- a safe way to contact you.

Do not send real secrets or third-party personal data in ordinary email. State
that you have sensitive evidence and ask for a safer exchange method.

## Safe testing boundaries

Good-faith research must avoid harming users, data, availability, or unrelated
systems. In particular, do not:

- access, change, download, or retain data that is not yours;
- test account takeover, subscriber or admin workflows with another person's
  account;
- use social engineering, phishing, credential stuffing, or password spraying;
- perform denial-of-service, high-volume automation, or actions that create
  material infrastructure or provider cost;
- send unsolicited email or trigger alerts/digests to other people;
- modify production records, scheduled jobs, configuration, or integrations;
- scan or attack third-party sources linked by Digibastion or customer domains
  shown by VANTAGE;
- publish an exploitable detail before the maintainer has had a reasonable
  opportunity to investigate and remediate it.

Prefer local reproduction, your own test accounts and domains, minimal request
volume, and non-destructive proofs. Stop if you encounter secrets, private
records, or signs of service instability, and report what happened.

## What to expect

Maintainers will try to acknowledge actionable reports, assess impact, and keep
the reporter informed as capacity allows. No response or remediation service
level, bounty, payment, safe-harbor agreement, or public credit is promised.
Disclosure timing should be coordinated case by case, especially when an issue
involves an upstream provider or active user risk.

General product bugs, documentation errors, and feature requests that are not
security-sensitive belong in
[GitHub issues](https://github.com/Raiders0786/digibastion/issues).
