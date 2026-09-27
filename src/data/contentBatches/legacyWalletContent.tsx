import React from 'react';
import { Link } from 'react-router-dom';

type LinkItem = { label: string; to: string };
type Threat = { title: string; body: string };
type Question = { question: string; answer: string };
type LegacyArticle = {
  answer: string;
  context: string[];
  threats: Threat[];
  checklist: string[];
  questions: Question[];
  links: LinkItem[];
};

const ArticleBody = ({ article }: { article: LegacyArticle }) => (
  <div className="space-y-8">
    <section className="rounded-xl border border-border/60 bg-card/50 p-6">
      <h2 className="mb-4 text-2xl font-bold">The direct answer</h2>
      <p className="text-lg leading-relaxed">{article.answer}</p>
    </section>

    <section>
      <h2 className="mb-4 text-2xl font-bold">How to think about the risk</h2>
      <div className="space-y-4">
        {article.context.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>

    <section>
      <h2 className="mb-4 text-2xl font-bold">Threat model</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {article.threats.map(({ title, body }) => (
          <div className="rounded-lg bg-card/50 p-5" key={title}>
            <h3 className="mb-2 text-lg font-semibold">{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-4 text-2xl font-bold">Action checklist</h2>
      <ol className="list-decimal space-y-4 pl-6">
        {article.checklist.map((item) => <li key={item}>{item}</li>)}
      </ol>
    </section>

    <section>
      <h2 className="mb-4 text-2xl font-bold">Limits and frequently asked questions</h2>
      <div className="space-y-5">
        {article.questions.map(({ question, answer }) => (
          <div key={question}>
            <h3 className="mb-2 text-lg font-semibold">{question}</h3>
            <p>{answer}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="rounded-xl bg-primary/10 p-6">
      <h2 className="mb-3 text-xl font-bold">Continue strengthening your setup</h2>
      <p>
        {article.links.map((item, index) => (
          <React.Fragment key={item.to}>
            {index > 0 && (index === article.links.length - 1 ? ', and ' : ', ')}
            <Link className="text-primary underline" to={item.to}>{item.label}</Link>
          </React.Fragment>
        ))}.
      </p>
    </section>
  </div>
);

const articles: Record<string, LegacyArticle> = {
  'password-manager-crypto-security': {
    answer: 'Use a reputable, maintained password manager to generate a different random password for every exchange, email, cloud, and wallet-service account. Protect the vault with a memorable master passphrase and phishing-resistant multifactor authentication where available. Keep recovery phrases and raw private keys out of a general-purpose password vault unless a documented, individual threat assessment concludes that the digital copy is safer than every realistic offline option.',
    context: [
      'A password manager reduces password reuse and makes lookalike domains easier to notice because autofill should be scoped to the saved origin. NIST guidance supports allowing password-manager use and emphasizes long passwords, blocklists, rate limiting, and multifactor authentication rather than arbitrary composition tricks. The manager is still a high-value system: compromise of an unlocked vault, its recovery account, or an infected endpoint can expose many credentials at once.',
      'Crypto users must separate account credentials from wallet authority. An exchange password controls an online account; a seed phrase can recreate a self-custody wallet and authorize irreversible transactions. Store exchange recovery codes as deliberately as passwords, but do not assume vault encryption protects material after malware captures an unlocked session or clipboard. The goal is smaller, independently recoverable failure domains—not one digital container holding every secret.',
    ],
    threats: [
      { title: 'Credential reuse and phishing', body: 'A breach at an unrelated service can expose a reused password, while a fake exchange page can collect both password and typed one-time code. Unique passwords limit reuse; FIDO authentication limits relay phishing.' },
      { title: 'Vault or endpoint compromise', body: 'A weak master passphrase, unsafe recovery flow, malicious extension, infostealer, or unattended unlocked device can turn the vault into a single point of compromise.' },
      { title: 'Loss and lockout', body: 'Forgetting the master passphrase or losing every enrolled authenticator can make an otherwise secure vault unavailable. Recovery must be planned and tested without creating an easy bypass.' },
      { title: 'Secret over-consolidation', body: 'Passwords, seed phrases, private keys, identity documents, and recovery codes in one vault give one incident an unnecessarily large blast radius.' },
    ],
    checklist: [
      'Choose a maintained manager with clear security documentation, prompt updates, export and recovery options you understand, and support for your devices. Product popularity alone is not proof of safety.',
      'Create a unique master passphrase, enable the strongest phishing-resistant MFA the service supports, protect the vault account email, and record recovery material in a separate secure location.',
      'Generate a unique random password for every account. Save the exact legitimate domain and launch important accounts from bookmarks or the vault rather than ads, direct messages, or search results.',
      'Configure short, usable auto-lock behavior; keep operating systems, browsers, and the manager updated; remove unneeded extensions; and never approve an unexpected export, recovery, or new-device prompt.',
      'Export an encrypted backup only if you can protect and test it. Inventory which credentials need rotation after a lost device, exposed master secret, or suspected unlocked-vault compromise.',
    ],
    questions: [
      { question: 'Should a seed phrase ever go in a password manager?', answer: 'There is no universal answer, but a routine cloud-synced vault creates correlated digital risk. Most users should keep wallet recovery material offline and private. People facing fire, coercion, accessibility, or geographic risks should document their own trade-off rather than following a slogan.' },
      { question: 'Does autofill stop phishing?', answer: 'It helps when the manager refuses to fill on a different origin, but it is not a guarantee. Attackers can compromise a legitimate site, abuse an authenticated session, or persuade a user to reveal a credential manually.' },
    ],
    links: [
      { label: '2FA setup guide', to: '/articles/2fa-crypto-security-guide' },
      { label: 'seed phrase storage guide', to: '/articles/seed-phrase-security-guide' },
      { label: 'browser-wallet infostealer defense', to: '/articles/browser-wallet-infostealer-malware-response' },
    ],
  },

  '2fa-crypto-security-guide': {
    answer: 'For exchange, email, password-manager, and cloud accounts, use a passkey or FIDO security key when the provider supports it. Register an independent backup authenticator and store recovery codes separately. If FIDO is unavailable, a TOTP authenticator app is generally preferable to SMS, but typed one-time codes can still be phished and relayed. Review the provider\'s recovery path because weak fallback can defeat strong day-to-day login.',
    context: [
      'Multifactor authentication combines independent factors, but not every method resists the same attacks. NIST SP 800-63B explains that manually entered OTPs are not phishing-resistant because a fake verifier can relay them. WebAuthn and FIDO credentials bind authentication to the verifier name, so a lookalike domain cannot simply reuse the response. This distinction matters more than brand rankings between authenticator apps.',
      'MFA protects an online account; it does not validate a withdrawal address, make a wallet signature safe, or protect a disclosed recovery phrase. Attackers also target account recovery, active sessions, email, mobile numbers, and support agents. A complete setup therefore includes backup authenticators, recovery-code custody, session review, transaction controls, and a rehearsed lost-device response.',
    ],
    threats: [
      { title: 'Real-time phishing', body: 'A fake login can capture a password and relay a TOTP or SMS code immediately. FIDO authentication is designed to bind the response to the legitimate verifier.' },
      { title: 'SIM swap and number porting', body: 'An attacker who takes control of a telephone number may receive SMS codes and abuse phone-based account recovery.' },
      { title: 'Push fatigue and support abuse', body: 'Repeated prompts or a persuasive support impersonator may pressure a user to approve access or reset an authenticator.' },
      { title: 'Lockout', body: 'One lost phone or hardware key becomes an availability incident if every backup and recovery code is stored with it.' },
    ],
    checklist: [
      'Secure the primary email and password-manager account first. They often sit behind exchange recovery, so an attacker may bypass a strong exchange login through a weaker dependency.',
      'Enroll from a bookmarked domain or official app. Prefer passkeys or FIDO security keys; otherwise use TOTP. Remove SMS fallback when the provider safely allows it.',
      'Register at least one independent backup method appropriate to the service. Keep the backup device and one-time recovery codes away from the everyday device.',
      'Test each authenticator and the provider\'s recovery process before relying on the account. Record official support routes without putting secrets into support notes.',
      'Enable login, recovery, API-key, and withdrawal alerts. After suspicious activity, revoke sessions, rotate credentials, replace authenticators, and review withdrawal addresses and API keys.',
    ],
    questions: [
      { question: 'Is TOTP unsafe?', answer: 'TOTP is useful and broadly supported, but it is not phishing-resistant. Treat it as a meaningful improvement over password-only login, not as permission to enter a code into a page reached from a message.' },
      { question: 'Are synced passkeys the same as hardware keys?', answer: 'Both can provide phishing-resistant authentication, but their backup, export, physical custody, and recovery properties differ. High-impact accounts benefit from an independent authenticator so one platform account or lost device does not decide availability.' },
    ],
    links: [
      { label: 'passkeys comparison', to: '/articles/passkeys-vs-authenticator-apps-security-keys-crypto' },
      { label: 'SIM-swap prevention', to: '/articles/sim-swap-attack-prevention' },
      { label: 'centralized exchange security', to: '/articles/cex-security-best-practices' },
    ],
  },

  'seed-phrase-security-guide': {
    answer: 'Generate a wallet recovery phrase only inside the trusted wallet flow, never photograph, scan, email, message, type, or paste it into a website, and keep an accurate offline backup protected from both disclosure and physical loss. Anyone with the complete phrase can usually recreate the wallet. Test recovery with the wallet vendor\'s documented process before funding heavily, and treat every unexpected request for the phrase as hostile.',
    context: [
      'BIP-39 defines a mnemonic as a human-readable representation used to derive a deterministic wallet seed; it is not a password reset code controlled by customer support. Wallet implementations, derivation paths, optional passphrases, and backup schemes vary. Record the wallet type and recovery instructions without exposing the secret, and do not “improve” wallet-generated words by inventing a personal sentence.',
      'A backup must survive two competing risks: unauthorized discovery and permanent loss. Fire, flood, theft, coercion, heirs, travel, cognitive decline, and device failure change the answer. Splitting or transforming words ad hoc can add fragile dependencies. Standardized schemes such as SLIP-39 may help supported workflows, but compatibility and recovery testing matter more than cleverness.',
    ],
    threats: [
      { title: 'Remote disclosure', body: 'Cloud photos, notes, email drafts, screen sharing, clipboard monitoring, and fake wallet-support forms can copy the full recovery phrase without stealing the hardware device.' },
      { title: 'Physical discovery', body: 'A visible paper or metal backup may be photographed, removed, or used under coercion. A safe protects against some threats, not everyone with authorized access.' },
      { title: 'Destruction or transcription error', body: 'Paper can degrade and handwriting can be ambiguous; durable media can still be incomplete, mislabeled, or lost. Recovery testing detects process failures.' },
      { title: 'Passphrase dependency', body: 'A BIP-39 passphrase creates different wallets and can improve compartmentalization, but loss or a tiny transcription difference can make the intended wallet unreachable.' },
    ],
    checklist: [
      'Initialize the wallet in a private setting using authentic, updated hardware or software. Confirm the words on the wallet device or official flow; never accept a preprinted phrase.',
      'Make a legible offline backup and verify the exact word order. Record necessary wallet-model and recovery-context information separately without labeling public material with balances.',
      'Select storage locations against your actual hazards and access needs. Avoid putting every copy, device, passphrase, and instruction in the same room or custody chain.',
      'Use standardized secret sharing only when the selected wallets support it and every participant understands recovery. Do not simply divide a BIP-39 list into obvious fragments.',
      'Perform a controlled recovery test with no audience or cameras, then recheck after changing wallet software, backup scheme, key holders, or inheritance arrangements.',
    ],
    questions: [
      { question: 'Is a metal backup automatically safer than paper?', answer: 'It may resist some environmental damage, but it can still be discovered, copied, lost, or recorded incorrectly. Material choice is one control inside a storage and recovery plan.' },
      { question: 'Should I use a BIP-39 passphrase?', answer: 'Only if you can operate and recover it reliably. Every passphrase produces a valid-looking wallet, so a typo may not create an obvious error. Never rely on memory as the only copy for an irreplaceable holding.' },
    ],
    links: [
      { label: 'hardware wallet comparison', to: '/articles/best-hardware-wallet-2025' },
      { label: 'hot versus cold wallet guide', to: '/articles/hot-wallet-vs-cold-wallet' },
      { label: 'physical security planning', to: '/articles/physical-security-crypto' },
    ],
  },

  'mobile-crypto-wallet-security': {
    answer: 'Treat a phone wallet as a daily-use signing device, not a vault with unlimited exposure. Install wallet apps from a verified publisher page, keep the operating system and app current, use a strong device unlock with secure hardware-backed biometrics where appropriate, hide sensitive lock-screen notifications, minimize apps and permissions, and keep long-term holdings under a separate key. A phone backup or biometric does not replace an offline recovery plan.',
    context: [
      'Modern iOS and Android devices provide sandboxing, code signing, secure key storage, and update mechanisms, but their protection depends on supported hardware, current software, lock configuration, and the wallet implementation. A malicious accessibility service, remote-control app, clipboard reader, notification preview, screen-sharing session, or rooted device can expose transaction context even when key material is hardware-backed.',
      'Mobile risk also includes theft and coercion, not only malware. An unlocked session may reveal balances, exchange email, messages, and authentication apps together. Wallet connections and token approvals persist on-chain after a phone is locked or a dapp is disconnected. Separate wallets and account recovery paths keep one stolen or compromised phone from becoming every security factor at once.',
    ],
    threats: [
      { title: 'Malicious or repackaged app', body: 'Fake wallet listings, sideloaded packages, and hostile updates can ask for recovery phrases or change transaction destinations.' },
      { title: 'Device and session compromise', body: 'Theft, shoulder surfing, weak unlock codes, notification previews, remote support tools, or an already unlocked device can expose accounts.' },
      { title: 'Signing deception', body: 'A legitimate wallet may display an opaque contract call or malicious approval. Device security cannot make unclear transaction intent safe.' },
      { title: 'Availability failure', body: 'Loss, damage, an unsupported OS, or a failed update can remove access when recovery material has not been tested independently.' },
    ],
    checklist: [
      'Use a supported device and current OS. Enable automatic security updates, a strong device passcode, short auto-lock, device encryption, and remote-loss features whose account recovery you have secured.',
      'Reach the wallet download through the vendor\'s verified site, confirm the publisher, avoid sideloading, and remove unneeded apps, keyboards, configuration profiles, accessibility services, and device-admin privileges.',
      'Keep recovery phrases offline. Do not photograph them, store them in mobile notes, or enter them after a support message. Test recovery without exposing the funded wallet.',
      'Before signing, verify chain, contract, action, asset, amount, recipient, approval scope, and deadline. Use a separate interaction wallet and periodically revoke permissions no longer needed.',
      'Plan theft response: secure the mobile-platform account and email, preserve necessary evidence, revoke sessions, replace exposed authenticators, and move assets only from a known-clean environment when keys may be compromised.',
    ],
    questions: [
      { question: 'Are biometrics enough?', answer: 'Biometrics can make device unlocking safer and more usable, but they are an activation factor, not a wallet backup. Their coercion and fallback-passcode properties differ by device and jurisdiction.' },
      { question: 'Does airplane mode make a wallet cold?', answer: 'No. A general-purpose phone that reconnects, runs many apps, or once handled secrets remains different from a deliberately isolated signing system. Security depends on the full lifecycle, not a temporary radio setting.' },
    ],
    links: [
      { label: 'clear-signing guide', to: '/articles/clear-signing-erc-7730-guide' },
      { label: 'token approval revocation', to: '/articles/revoke-token-approvals-guide' },
      { label: 'advanced wallet architecture', to: '/articles/advanced-wallet-security' },
    ],
  },

  'vpn-tor-crypto-trading': {
    answer: 'A VPN or Tor can hide your source IP from some counterparties, but neither makes blockchain activity anonymous or authorizes bypassing an exchange\'s terms, sanctions, or local law. For ordinary crypto activity, first secure the endpoint and accounts; then use a trustworthy VPN on hostile networks or Tor for a documented privacy need. Keep one network identity stable during sensitive exchange sessions, because abrupt location changes may trigger fraud controls or recovery reviews.',
    context: [
      'A VPN moves trust from the local network and internet provider to the VPN operator: the destination sees the VPN exit, while the provider can observe connection metadata and possibly traffic not protected by end-to-end encryption. Tor routes traffic through multiple relays so no single relay should know both source and destination, but destination sites can still fingerprint browsers, require identity, correlate timing, or block exits. Tor Browser\'s protections are weakened by custom extensions and configuration changes.',
      'Public blockchains create a separate correlation layer. Reused addresses, exchange deposits, timing, amounts, token approvals, ENS names, and wallet connections can join activity across network sessions. Using privacy software while signing from the same address does not erase that graph. Privacy planning must include endpoint identifiers, account KYC, RPC telemetry, application logs, and on-chain behavior.',
    ],
    threats: [
      { title: 'Local-network observation', body: 'A hostile Wi-Fi operator can see destinations and attack unprotected traffic. HTTPS remains necessary because a VPN is not end-to-end authentication of the exchange or dapp.' },
      { title: 'Provider and exit trust', body: 'A VPN operator sees metadata; a Tor exit can observe plaintext traffic. Marketing claims and “no logs” labels are not substitutes for architecture, audits, and legal context.' },
      { title: 'Account and browser correlation', body: 'Logging into an identified exchange, reusing a browser profile, or exposing fingerprintable settings can connect otherwise separate sessions.' },
      { title: 'On-chain linkage', body: 'Address reuse, common funding, change patterns, bridge activity, and exchange transfers can reveal relationships regardless of source IP.' },
    ],
    checklist: [
      'Write down the observer you are trying to limit: local network, ISP, RPC provider, dapp, exchange, advertiser, or public-chain analyst. Different tools cover different links.',
      'Use HTTPS and verify the domain. Keep the OS, browser, wallet, and VPN or Tor software updated; do not add extensions to Tor Browser or install untrusted “privacy” wallets.',
      'Review exchange rules before connecting. Do not use privacy tools to misrepresent residency or evade compliance controls; an account freeze can become both a security and availability event.',
      'Separate browser profiles and wallets by purpose, avoid address reuse where the protocol permits it, and understand what the RPC endpoint and wallet telemetry collect.',
      'Test for DNS or application leaks without exposing secrets, maintain a safe fallback connection, and stop if changing routes causes unexpected recovery or authentication prompts.',
    ],
    questions: [
      { question: 'Does a VPN make a wallet anonymous?', answer: 'No. It changes who sees the source IP, while the public transaction graph and application accounts remain. It may even create a distinctive or shared exit signal.' },
      { question: 'Should I run a wallet inside Tor Browser?', answer: 'Tor Project advises against adding extensions because they can weaken anonymity. Prefer documented wallet or node support for Tor and keep signing architecture separate from ad hoc browser customization.' },
    ],
    links: [
      { label: 'wallet deanonymization guide', to: '/articles/wallet-address-deanonymization' },
      { label: 'RPC privacy and security', to: '/articles/rpc-endpoint-security' },
      { label: 'Web3 OpSec playbook', to: '/articles/privacy-security-web3-opsec' },
    ],
  },

  'multi-signature-wallet-setup': {
    answer: 'A multisignature wallet is safer only when signers, devices, locations, and verification paths are genuinely independent. Start with a documented policy for who may propose, review, approve, execute, pause, and recover transactions. Choose a threshold that survives realistic loss without letting one compromised person or system authorize value. Verify the wallet deployment, owners, threshold, modules, guards, fallback handlers, and first test transaction from independent interfaces before funding it.',
    context: [
      'Multisig distributes authorization; it does not automatically distribute judgment. If every signer uses the same browser, password manager, chat channel, or compromised frontend, attackers can present the same malicious transaction to all of them. The 2025 Bybit incident demonstrated why authorized signatures are not enough when the signing interface misrepresents transaction logic. Each approver must verify decoded intent using an independent trusted path.',
      'Smart-account multisigs can include powerful extensions. Safe documentation describes modules that may execute transactions without collecting the usual signatures, guards that inspect transactions, and fallback handlers that extend account behavior. Those features can be useful, but they expand the trust boundary. A clean owner list and threshold do not prove that no module or upgrade path can move assets.',
    ],
    threats: [
      { title: 'Correlated signer compromise', body: 'Nominally separate keys add little resilience when controlled from the same endpoint, office, administrator account, or recovery process.' },
      { title: 'Transaction substitution', body: 'A compromised frontend, wallet extension, or proposer can show a familiar recipient while the actual calldata changes owners, modules, or asset destination.' },
      { title: 'Unsafe extensions', body: 'Modules, guards, fallback handlers, bridges, and account upgrades can bypass or alter the expected approval flow.' },
      { title: 'Signer loss and governance deadlock', body: 'Lost keys, unavailable people, legal disputes, or an outdated owner roster can make the wallet unable to act during an incident.' },
    ],
    checklist: [
      'Define the asset scope and threat model first. Record owners, threshold rationale, proposer and executor roles, transaction limits, emergency contacts, and recovery or signer-replacement rules.',
      'Generate signer keys on independently administered devices and networks where practical. Avoid a single operator holding multiple shares or backing every signer up through one account.',
      'Create the wallet from a verified deployment and independently confirm chain, address, implementation, owners, threshold, modules, guards, and fallback handler using more than one data source.',
      'Run low-impact tests for deposits, ordinary transfers, contract calls, signer replacement, and emergency communication. Every signer should verify destination, value, calldata, nonce, and policy before approval.',
      'Monitor configuration changes and executions. Review owners and extensions on a schedule and after personnel, vendor, device, or protocol changes; rehearse recovery without weakening normal authorization.',
    ],
    questions: [
      { question: 'What is the best threshold?', answer: 'There is no universal ratio. Model how many independent compromises an attacker needs and how many losses or absences the organization must survive. Independence and process quality matter as much as the numbers.' },
      { question: 'Is a multisig cold storage?', answer: 'Not necessarily. Signer keys can be hot or cold, and the smart account still depends on contracts, interfaces, and configuration. Describe the actual system rather than treating “multisig” as a security grade.' },
    ],
    links: [
      { label: 'Bybit signing-security analysis', to: '/articles/bybit-hack-2025-signing-security' },
      { label: 'clear-signing guide', to: '/articles/clear-signing-erc-7730-guide' },
      { label: 'crypto incident-response playbook', to: '/articles/crypto-hack-response-playbook' },
    ],
  },

  'physical-security-crypto': {
    answer: 'Protect people before assets. Reduce public disclosure of holdings, separate everyday identity from custody operations, avoid keeping devices and recovery material together, and create a household or team response plan for theft, coercion, fire, travel, medical emergencies, and death. No wallet feature guarantees safety during a physical confrontation: comply when necessary, move to safety, contact local emergency services, and preserve evidence only when doing so does not increase danger.',
    context: [
      'Crypto custody can turn information into physical risk because a transfer may be difficult to reverse and a public address may reveal assets. The threat often begins with ordinary data: a home address from a breach, travel photos, a conference badge, public wallet boasting, delivery packaging, or an identifiable donation. Good operational security lowers how often strangers can connect a person, location, routine, and valuable signing authority.',
      'Physical controls must balance secrecy, availability, and the safety of trusted people. A hidden backup nobody can find may fail during incapacity; a safe known to many people may attract attention; a decoy may escalate violence or create legal and family complications. Use a professional risk assessment for credible threats and coordinate inheritance with qualified legal counsel rather than publishing or improvising access instructions.',
    ],
    threats: [
      { title: 'Target discovery', body: 'Public balances, social posts, data-broker records, domain registrations, delivery details, and breached customer lists can connect holdings to a home or routine.' },
      { title: 'Theft and coercion', body: 'An attacker may seek an unlocked device, recovery phrase, signer participation, or access to another custodian rather than stealing a hardware wallet alone.' },
      { title: 'Environmental loss', body: 'Fire, water, relocation, accidental disposal, and deterioration can destroy colocated devices, backups, and instructions.' },
      { title: 'Continuity failure', body: 'Incapacity, death, travel, or family conflict can make legitimate recovery impossible or expose secrets to people who do not understand the process.' },
    ],
    checklist: [
      'Remove unnecessary public connections between your legal identity, location, balances, wallet addresses, and travel. Review old posts, domain records, delivery routines, and information held by data brokers.',
      'Divide custody so an everyday device or one physical location cannot authorize everything. Keep backup material away from signing devices and avoid carrying more authority than the trip requires.',
      'Harden the home and workplace proportionately with access control, lighting, alarms, visitor practices, and secure document disposal. Do not advertise specific safes, locations, or custody products.',
      'Agree on a safety-first response with household members or signers: code words, emergency contacts, assembly points, what information not to improvise, and when to contact law enforcement or a security professional.',
      'Build a legally reviewed continuity plan. Test that the right people can identify the process without receiving unilateral spending authority, and update it after moves, relationships, health changes, or key rotations.',
    ],
    questions: [
      { question: 'Should I use a decoy wallet?', answer: 'It can create false confidence and may escalate a confrontation if discovered. Consider it only within professional safety planning; never prioritize a deception tactic over getting people out of immediate danger.' },
      { question: 'Where is the best place for a backup?', answer: 'There is no universally safe location. Evaluate unauthorized access, disaster correlation, lawful access, travel, maintenance, and recovery by trusted successors. Avoid describing your chosen locations publicly.' },
    ],
    links: [
      { label: 'seed phrase storage guide', to: '/articles/seed-phrase-security-guide' },
      { label: 'advanced wallet security', to: '/articles/advanced-wallet-security' },
      { label: 'Web3 OpSec guide', to: '/articles/privacy-security-web3-opsec' },
    ],
  },

  'metamask-security-settings': {
    answer: 'Harden MetaMask by installing it only from the official source, keeping the browser and extension current, using a dedicated browser profile, enabling available security alerts, reviewing connected sites, and regularly checking token and NFT approvals on every chain you use. For material holdings, connect a hardware wallet and verify transaction details on its trusted display. Never enter the Secret Recovery Phrase because a website, pop-up, advertisement, or support account asks.',
    context: [
      'MetaMask is a transaction interface as well as a key manager. Disconnecting a site changes the site\'s access to account information and request flow, but does not revoke ERC-20 allowances or NFT operator approvals already recorded on-chain. Conversely, revoking an approval does not remove a hostile extension or repair a disclosed recovery phrase. Identify which permission or secret is actually at risk before choosing a response.',
      'A hardware wallet limits direct key extraction from the browser, yet the browser still prepares the transaction. A compromised frontend can request an approval, transfer, permit, owner change, or contract call that the hardware device faithfully signs. Security alerts and simulations provide useful evidence but are not guarantees. Read the device display, reject blind or unclear signing, and use separate accounts for long-term storage and experimental dapps.',
    ],
    threats: [
      { title: 'Recovery-phrase phishing', body: 'Fake support, cloned websites, and malicious extensions ask users to “synchronize” or “verify” the phrase. Possession of the phrase normally gives wallet control.' },
      { title: 'Malicious permissions', body: 'Token allowances, NFT operator approvals, Permit signatures, and account delegations may grant continuing authority beyond one visible transaction.' },
      { title: 'Browser compromise', body: 'An infostealer, hostile extension, clipboard replacement, injected script, or stolen browser profile can change what the user sees or capture unlocked sessions.' },
      { title: 'Wrong network or contract', body: 'Similar asset names and addresses across chains can lead to approvals or transfers involving an unintended contract or recipient.' },
    ],
    checklist: [
      'Install or update from metamask.io and verify the publisher in the browser store. Remove duplicate or unneeded extensions and isolate wallet use in a dedicated profile.',
      'Use a unique unlock password, short auto-lock, and supported device security. Remember that the local password protects that installation; the recovery phrase can recreate accounts elsewhere.',
      'Enable available security alerts and transaction simulations, but independently verify chain, account, destination, asset, amount, approval scope, deadline, and decoded action.',
      'Review connected sites in MetaMask, then inspect on-chain allowances and NFT operator approvals separately. Revoke only after confirming the chain, asset, spender, and transaction.',
      'If the phrase or private key may be exposed, create fresh keys on a clean system and move unaffected assets deliberately. If only a site permission or allowance is stale, disconnect or revoke the specific authority.',
    ],
    questions: [
      { question: 'Does locking MetaMask revoke approvals?', answer: 'No. Locking protects local use of the extension. On-chain approvals remain until changed by a transaction or otherwise consumed according to the contract.' },
      { question: 'Is a hardware wallet through MetaMask safe?', answer: 'It improves key isolation, but the computer can still propose a malicious transaction. Confirm critical details on the hardware display and do not enable blind signing merely to make an unexplained prompt work.' },
    ],
    links: [
      { label: 'approval revocation guide', to: '/articles/revoke-token-approvals-guide' },
      { label: 'clear-signing guide', to: '/articles/clear-signing-erc-7730-guide' },
      { label: 'wallet incident response', to: '/articles/crypto-hack-response-playbook' },
    ],
  },

  'advanced-wallet-security': {
    answer: 'For high-impact holdings, build a custody system rather than buying one “secure” device. Separate savings, spending, dapp interaction, and organizational treasury keys; keep signing devices independent from transaction-construction devices; require human-readable intent and out-of-band verification; distribute backup and authorization risk; monitor addresses and configuration; and rehearse recovery and emergency migration. Set controls from a written threat model, not from a public balance threshold.',
    context: [
      'Defense in depth means independent controls fail differently. Two hardware wallets connected to the same compromised laptop and backed up in the same safe are not two independent layers. Consider remote malware, malicious transactions, physical coercion, insider collusion, vendor compromise, protocol failure, lost keys, inheritance, and denial of service. Document which control detects or limits each path.',
      'NIST key-management guidance treats cryptographic keys across creation, distribution, storage, use, backup, recovery, rotation, and destruction. Wallet custody needs the same lifecycle discipline, even when the implementation is consumer hardware. Smart accounts and multisigs add contract, module, upgrade, and signer-governance risk; offline keys add transaction-verification and availability risk. Architecture should remain understandable enough to operate during stress.',
    ],
    threats: [
      { title: 'Remote compromise', body: 'Malware, extensions, poisoned updates, cloud recovery, and support impersonation can target keys, sessions, transaction intent, or the operator rather than cryptography.' },
      { title: 'Physical and insider pressure', body: 'A custodian, family member, employee, vendor, or attacker may steal, coerce, or collude. Authorization and recovery should not collapse to one person.' },
      { title: 'Protocol and smart-account failure', body: 'Bugs, malicious upgrades, bridges, modules, account delegation, and token approvals can move value even when signing keys remain secret.' },
      { title: 'Complexity and availability', body: 'An elaborate arrangement may fail because signers forget procedures, backups become incompatible, documentation goes stale, or emergency action requires unavailable people.' },
    ],
    checklist: [
      'Inventory assets, chains, legal owners, operators, recovery requirements, and credible adversaries. Define loss limits and required availability in policy without advertising balances.',
      'Create separate wallet tiers for long-term custody, routine payments, and untrusted dapps. Keep funding links and public identities as private as the use case permits.',
      'Use independently managed signers or hardware devices for high-impact authorization. Decode transaction intent and compare critical details through a second trusted data source.',
      'Control smart-account modules, upgrades, allowances, delegates, RPC endpoints, frontends, and release dependencies. Alert on transfers and configuration changes rather than watching balance alone.',
      'Rehearse lost signer, compromised device, malicious approval, network outage, incapacity, and urgent migration scenarios. Update documentation and backups after every material architecture change.',
    ],
    questions: [
      { question: 'When do I need a multisig?', answer: 'When independent approval and loss tolerance justify the operational and smart-contract complexity. It is often appropriate for teams, but a poorly governed multisig can be weaker than a well-run single-signer system.' },
      { question: 'Should I conceal the entire design?', answer: 'Keep locations, balances, and exploitable details private, but authorized operators and successors need tested documentation. Security that depends only on nobody understanding the architecture is fragile.' },
    ],
    links: [
      { label: 'multisig setup guide', to: '/articles/multi-signature-wallet-setup' },
      { label: 'clear-signing guide', to: '/articles/clear-signing-erc-7730-guide' },
      { label: 'physical security planning', to: '/articles/physical-security-crypto' },
    ],
  },

  'exchange-hack-survival-guide': {
    answer: 'If an exchange reports a breach, outage, insolvency concern, or unauthorized account activity, stop following links in messages and open the official app or a saved bookmark. Preserve notices and account records, secure your email and credentials, revoke suspicious sessions and API keys when the service is reachable, and contact the exchange through its published support route. Do not send funds or pay an upfront fee to anyone promising recovery. Whether withdrawals are safe or available depends on the incident and official instructions.',
    context: [
      '“Exchange hack” can mean very different events: theft from the exchange\'s own wallets, customer credential compromise, support-data theft, API abuse, a frontend incident, withdrawal suspension, or insolvency. The right response depends on whether your authentication factors, personal data, trading permissions, or custodial claim are affected. Avoid making irreversible transfers based on rumors or impersonated announcements.',
      'Customers generally do not control private keys for custodial balances. Asset availability therefore depends on the platform, applicable law, and any insolvency or claims process. Keep proof of account ownership, deposits, withdrawals, trades, balances, communications, and tax basis. Official deadlines and jurisdiction-specific rights require qualified legal or financial advice, not a recovery agent in direct messages.',
    ],
    threats: [
      { title: 'Secondary phishing', body: 'Attackers rapidly imitate exchange notices, status pages, claim portals, and support staff to collect passwords, MFA codes, identity documents, or wallet transfers.' },
      { title: 'Credential and session abuse', body: 'A breach may expose passwords, API tokens, customer records, or active sessions that enable trading, withdrawal, or convincing impersonation.' },
      { title: 'Custody and insolvency', body: 'Even without individual account takeover, withdrawals may pause and customers may become claimants in a legal process with uncertain timing and recovery.' },
      { title: 'Recovery scams', body: 'Fraudsters target known victims with guaranteed recovery, tracing, legal, or government stories and demand advance payment or more personal information.' },
    ],
    checklist: [
      'Confirm the event through the exchange\'s official domain, app, status page, and regulator or law-enforcement notices where applicable. Save copies and timestamps without interacting with unsolicited claim links.',
      'Secure the associated email and password-manager account from a known-clean device. Rotate reused credentials, replace compromised authenticators, and review forwarding rules and recovery details.',
      'Within the official account, capture balances and history, review devices, sessions, withdrawals, addresses, and API keys, and revoke anything unrecognized. Preserve evidence before deleting artifacts.',
      'Follow published withdrawal or claims instructions after verifying addresses and legal context. Make a small test when ordinary transfers are available and never share a seed phrase to “verify ownership.”',
      'Report unauthorized activity promptly to the exchange and appropriate authorities. Reject guaranteed recovery offers and obtain jurisdiction-specific counsel for material claims, tax consequences, or insolvency filings.',
    ],
    questions: [
      { question: 'Should I withdraw immediately?', answer: 'There is no incident-independent answer. Confirm whether withdrawals are operating, whether the destination is yours, and whether the announcement is authentic. Panic can amplify phishing and address-replacement mistakes.' },
      { question: 'Can a blockchain investigator recover funds?', answer: 'Tracing may support an investigation, but it does not grant power to reverse a transaction or guarantee recovery. Treat unsolicited investigators, law firms, and claim agents demanding crypto or upfront fees as high risk.' },
    ],
    links: [
      { label: 'exchange security checklist', to: '/articles/cex-security-best-practices' },
      { label: 'support-scam defense', to: '/articles/coinbase-data-theft-support-scam-defense' },
      { label: 'incident-response playbook', to: '/articles/crypto-hack-response-playbook' },
    ],
  },

  'cex-security-best-practices': {
    answer: 'Secure a centralized exchange account by protecting its email and password-manager dependencies, using a unique password plus passkey or hardware security key, removing weaker fallback where possible, enabling withdrawal-address controls and alerts, restricting API keys, and keeping only the balance needed for your purpose. Verify every support contact through the official app or bookmarked domain. Exchange controls reduce account takeover; they do not remove custodial, legal, operational, or insolvency risk.',
    context: [
      'A CEX controls wallet keys and exposes account functions through web, mobile, support, and API systems. Attackers may target the user, the exchange, a telecom provider, an email inbox, or an API integration. Strong login matters, but so do password reset, identity verification, withdrawal recovery, trusted devices, address books, linked bank accounts, and support agents. Map the complete account lifecycle.',
      'Custodial balances are claims on a service, not equivalent to a self-custody wallet. Regulatory status, segregation, disclosures, and customer protections vary by asset and jurisdiction. Do not assume a familiar brand or proof-of-reserves snapshot guarantees solvency, cybersecurity, or withdrawal availability. Match the amount and duration of custody to why you need the venue.',
    ],
    threats: [
      { title: 'Account takeover', body: 'Credential reuse, phishing, SIM swaps, infostealers, stolen sessions, and weak recovery can let an attacker trade or withdraw under the customer\'s identity.' },
      { title: 'API abuse', body: 'Overbroad keys, exposed secrets, unsafe bots, and unrestricted source addresses can allow unauthorized trading, transfers, or manipulation even without interactive login.' },
      { title: 'Support impersonation', body: 'Personal account data can make a caller convincing. Legitimate support should not need a seed phrase, remote-control session, or transfer to a “safe” wallet.' },
      { title: 'Platform failure', body: 'Exchange wallet theft, internal fraud, outages, freezes, legal action, or insolvency can impair withdrawals independently of customer authentication.' },
    ],
    checklist: [
      'Use a dedicated email alias where practical, unique vault-generated password, and phishing-resistant MFA for both email and exchange. Store independent backup authenticators and recovery codes safely.',
      'Enable new-device, login, recovery, API, trade, and withdrawal notifications. Configure address allowlisting or withdrawal delays if the platform offers them and you understand emergency access trade-offs.',
      'Create API keys only for a defined integration. Grant the minimum scopes, restrict network sources where supported, keep secrets out of repositories and chat, and delete unused keys.',
      'Bookmark official domains and support routes. End unsolicited calls or messages and reopen the case from the app; never install remote-access software or disclose one-time codes on request.',
      'Keep records and a tested destination wallet. Periodically review devices, sessions, addresses, recovery details, and custody exposure; respond to an incident using verified announcements rather than rumors.',
    ],
    questions: [
      { question: 'Are withdrawal allowlists enough?', answer: 'They can limit some account-takeover paths, but their reset process can be attacked and they do not address platform insolvency or exchange-wallet compromise. Protect changes and alerts as carefully as withdrawals.' },
      { question: 'Should I keep nothing on an exchange?', answer: 'That depends on trading, settlement, tax, operational, and self-custody capabilities. Minimize unnecessary exposure, but recognize that unsafe self-custody can create different and sometimes greater risks.' },
    ],
    links: [
      { label: '2FA guide', to: '/articles/2fa-crypto-security-guide' },
      { label: 'CEX versus DEX comparison', to: '/articles/cex-vs-dex-security-comparison' },
      { label: 'exchange incident response', to: '/articles/exchange-hack-survival-guide' },
    ],
  },

  'hot-wallet-vs-cold-wallet': {
    answer: 'A cold wallet generally reduces remote key-extraction risk because signing secrets are generated and used away from an internet-connected general-purpose environment; a hot wallet is more convenient for frequent activity. Neither is categorically safe. Use a hot wallet with limited exposure for routine transactions and dapps, and a separately backed-up hardware or offline signer for long-term holdings. Verify every transaction on the trusted signing display and keep recovery material offline.',
    context: [
      '“Hot” and “cold” describe connectivity and operating practice, not product quality. A hardware wallet attached to a compromised computer may keep its private key secret yet sign a malicious approval the user accepts. An old laptop disconnected after malware infection is not trustworthy cold storage. Conversely, a maintained phone wallet with hardware-backed storage and limited funds may be appropriate for daily use.',
      'The correct architecture follows frequency, recovery needs, transaction complexity, and adversaries. Cold arrangements add physical loss, firmware, backup, compatibility, inheritance, and availability risks. Hot arrangements add malware, browser, cloud, and session risks. Wallet separation reduces blast radius only when keys and recovery paths are separate—not when every wallet derives from the same disclosed seed.',
    ],
    threats: [
      { title: 'Hot-wallet compromise', body: 'Malware, hostile extensions, fake apps, remote access, and unlocked sessions can steal software keys or manipulate transaction requests.' },
      { title: 'Cold-signing deception', body: 'An offline or hardware signer can authorize harmful calldata if the display is incomplete, blind signing is enabled, or the operator does not verify intent.' },
      { title: 'Backup and physical loss', body: 'A cold device can fail or disappear. The recovery phrase then becomes the real custody root and may be destroyed, stolen, or transcribed incorrectly.' },
      { title: 'Operational crossover', body: 'Importing cold keys into a browser, photographing the seed, or using one seed for both daily and savings accounts collapses the intended separation.' },
    ],
    checklist: [
      'List wallet purposes and expected transaction frequency. Assign separate keys for long-term storage, ordinary payments, and higher-risk dapp interaction instead of relying on account labels alone.',
      'Generate long-term keys on a trusted hardware or offline flow, verify device authenticity and updates through official channels, and make a tested offline recovery backup.',
      'Fund a hot wallet only for its current role. Maintain the endpoint, minimize extensions and apps, and review connected sites and on-chain approvals regularly.',
      'Before any signature, confirm chain, asset, amount, recipient, contract, approval scope, and decoded action on the most trustworthy display available. Reject unclear or blind prompts.',
      'Practice transfers in both directions and recovery before a crisis. Never type the cold-wallet seed into a hot wallet merely because the hardware device is temporarily unavailable.',
    ],
    questions: [
      { question: 'Is a hardware wallet always cold?', answer: 'Not by itself. It can isolate keys, but the transaction workflow, firmware, host, backups, and use frequency determine the broader security posture.' },
      { question: 'Do multiple accounts create separate wallets?', answer: 'Accounts derived from the same seed can be separated operationally but still share one recovery root. A disclosed phrase may compromise all of them and on-chain funding can link them.' },
    ],
    links: [
      { label: 'hardware wallet selection guide', to: '/articles/best-hardware-wallet-2025' },
      { label: 'seed phrase security', to: '/articles/seed-phrase-security-guide' },
      { label: 'mobile wallet security', to: '/articles/mobile-crypto-wallet-security' },
    ],
  },

  'blockchain-privacy-tools-2025': {
    answer: 'No single blockchain privacy tool provides anonymity. Start with a threat model, minimize address reuse and public identity links, separate wallets and browser profiles by purpose, use a privacy-preserving network path and RPC when appropriate, and understand the privacy protocol before depositing. Privacy sets shrink when usage is rare or behavior is distinctive, while bridges, exchanges, timing, amounts, wallet telemetry, and later spending can relink activity. Review current legal and platform rules in your jurisdiction before using specialized privacy services.',
    context: [
      'Privacy exists in layers. A network observer may see an IP address; a wallet or RPC provider may see queried accounts; a public ledger shows transactions; a dapp sees browser and connection data; and a regulated intermediary may know legal identity. Tor, a VPN, self-hosted nodes, shielded pools, CoinJoin-style coordination, confidential protocols, and address separation cover different layers and make different trust assumptions.',
      'Protocol design matters. Zcash documents transparent and shielded address types and warns that transaction value, timing, and interaction patterns can affect privacy. Monero uses protocol-level techniques such as ring signatures, stealth addresses, and confidential transactions, but endpoint compromise and off-chain identity can still reveal users. Bitcoin\'s whitepaper itself notes that keeping public keys anonymous and using a new key pair helps, while linkage can still expose related transactions.',
    ],
    threats: [
      { title: 'Ledger analysis', body: 'Address reuse, common-input and change heuristics, exact amounts, timing, approvals, bridge paths, and known service deposits can cluster transactions.' },
      { title: 'Network and RPC observation', body: 'Peers, remote nodes, RPC providers, wallets, and telemetry services may connect IP or device data to queried addresses and submitted transactions.' },
      { title: 'Application fingerprinting', body: 'Cookies, browser fingerprints, wallet identifiers, email, and account logins can join activity even when on-chain addresses differ.' },
      { title: 'Operational and legal exposure', body: 'Distinctive behavior, low anonymity sets, unsafe counterparties, platform restrictions, recordkeeping duties, and changing law can create risks outside cryptography.' },
    ],
    checklist: [
      'Name the observer and data you want to protect, the duration, and the consequences of failure. Do not buy or deploy a tool until you know which layer it addresses.',
      'Avoid public address reuse where the protocol and business purpose allow it. Separate funding, identity, browser profiles, wallets, and RPC queries, while remembering transfers between compartments may relink them.',
      'Read the protocol\'s official privacy assumptions, supported transaction types, wallet requirements, and known leakage. Prefer maintained implementations and verify downloads.',
      'Reduce distinctive timing and amount patterns without breaking law or operational needs. Do not consolidate outputs or send directly to an identified account without understanding the resulting link.',
      'Keep records needed for lawful tax and compliance duties and obtain current jurisdiction-specific advice. Privacy is compatible with accountability, but improvising around platform controls can cause freezes or legal exposure.',
    ],
    questions: [
      { question: 'Are privacy coins anonymous by default?', answer: 'Protocol-level privacy can reduce public visibility, but network, wallet, exchange, device, and behavioral data remain. Guarantees depend on implementation, usage patterns, and the observer.' },
      { question: 'Does using a mixer erase transaction history?', answer: 'No. Inputs and outputs remain part of a public system, and timing, amounts, service records, later consolidation, or endpoint data can support linkage. Specialized services may also carry legal and counterparty risk.' },
    ],
    links: [
      { label: 'wallet deanonymization guide', to: '/articles/wallet-address-deanonymization' },
      { label: 'VPN and Tor trade-offs', to: '/articles/vpn-tor-crypto-trading' },
      { label: 'RPC endpoint security', to: '/articles/rpc-endpoint-security' },
    ],
  },

  'sim-swap-attack-prevention': {
    answer: 'Move high-impact accounts away from SMS authentication and phone-number recovery wherever the provider allows it. Use passkeys or FIDO security keys, protect the carrier account with a unique PIN and port or SIM-change controls, minimize public exposure of the number, and keep offline recovery codes. If service disappears unexpectedly, contact the carrier through a known number while simultaneously securing email, exchange, banking, and password-manager accounts from a trusted device.',
    context: [
      'The FCC describes SIM-swap fraud as impersonating a customer so the carrier reassigns service to an attacker-controlled SIM, while port-out fraud moves the number to another provider. Control of the number can expose calls and texts and may unlock accounts that use SMS for login or recovery. The attack is therefore an identity and account-recovery problem, not a flaw solved only by adding a carrier PIN.',
      'NIST treats the public switched telephone network as a restricted authenticator channel and says manually entered OTPs are not phishing-resistant. Carrier protections differ and can be overridden through legitimate recovery processes, insiders, retail workflows, or stolen identity data. The durable fix is removing the phone number as an authority for valuable accounts, then hardening the number for services that still require it.',
    ],
    threats: [
      { title: 'Carrier impersonation', body: 'Stolen identity data, account details, social engineering, forged documents, or insider assistance may convince a provider to change the SIM or port the number.' },
      { title: 'Recovery-chain takeover', body: 'The number may reset email, which then resets an exchange or password manager. The attacker follows the weakest dependency rather than confronting strong MFA directly.' },
      { title: 'Real-time phishing', body: 'Even without a SIM swap, a fake site or caller can ask the victim to read out an SMS code. A code is not proof that the requester is legitimate.' },
      { title: 'Delayed detection', body: 'Wi-Fi can keep apps appearing normal after cellular service disappears, giving an attacker time to reset linked accounts and hide notices.' },
    ],
    checklist: [
      'Inventory every account that uses the number for sign-in, password reset, alerts, or support verification. Prioritize primary email, password manager, exchanges, banks, and cloud accounts.',
      'Replace SMS with a passkey or hardware security key where supported and add an independent backup. Remove phone recovery only after confirming you can recover safely another way.',
      'Set a unique carrier account PIN and enable available port locks, number locks, or SIM-change notifications. Ask the carrier what recovery can override them and document the official fraud route.',
      'Limit public exposure of the number and carrier details. Treat unsolicited calls about service changes as untrusted and call back using independently obtained contact information.',
      'On unexpected service loss, use a trusted device to contact the carrier, revoke account sessions, rotate exposed credentials, preserve notices, and report unauthorized transfers promptly to affected providers and authorities.',
    ],
    questions: [
      { question: 'Does an eSIM prevent SIM swapping?', answer: 'No. The fraud targets carrier provisioning and number-port processes, which can reassign service without physically stealing a SIM card.' },
      { question: 'Is a separate phone number enough?', answer: 'A nonpublic number reduces some targeting, but it still depends on carrier identity and recovery processes. Use it as a supporting control, not a replacement for phishing-resistant authentication.' },
    ],
    links: [
      { label: '2FA setup guide', to: '/articles/2fa-crypto-security-guide' },
      { label: 'password manager guide', to: '/articles/password-manager-crypto-security' },
      { label: 'exchange account security', to: '/articles/cex-security-best-practices' },
    ],
  },

  'wallet-address-deanonymization': {
    answer: 'A public wallet address is pseudonymous, not anonymous. Someone can connect it to a person through exchange records, public posts, ENS names, payment requests, reused deposit addresses, wallet or RPC telemetry, and transaction-graph patterns. Reduce unnecessary linkage by using separate wallets and addresses for distinct roles, avoiding public balance disclosure, choosing privacy-aware network and RPC paths, and planning funding and later spending together. Once a link is public, creating a new address does not erase the old evidence.',
    context: [
      'Bitcoin\'s whitepaper describes privacy through anonymous public keys but warns that transactions can be linked and that identity disclosure can reveal other activity. Account-based chains make continuity especially visible because balances, contract calls, approvals, NFT holdings, and names accumulate at one address. Analytics can combine deterministic facts with probabilistic heuristics; not every cluster proves common ownership.',
      'Off-chain systems often provide the strongest join. A centralized exchange can associate deposits and withdrawals with verified customers; a merchant sees delivery details; an RPC sees queries from an IP; a dapp sees a wallet connection and browser state; a screenshot may expose an address or distinctive balance. Privacy requires coordination across the transaction graph, endpoint, accounts, network, and communications.',
    ],
    threats: [
      { title: 'Direct attribution', body: 'Publishing an address, signing a public message, using an identifiable name service, or sharing a payment request can explicitly connect identity and wallet.' },
      { title: 'Transaction clustering', body: 'Common funding, change outputs, consolidation, repeated counterparties, exact amounts, timing, and contract usage can suggest that addresses belong together.' },
      { title: 'Service records', body: 'Exchanges, bridges, RPC providers, wallet telemetry, merchants, and dapps may retain identity, IP, device, or transaction records that complement public data.' },
      { title: 'False attribution', body: 'Heuristics can misclassify exchange wallets, smart contracts, CoinJoin participants, relayers, or shared custody. Treat analytical confidence as evidence to test, not proof by itself.' },
    ],
    checklist: [
      'Map existing public links: social profiles, donations, name services, screenshots, exchange flows, NFT profiles, governance votes, and recurring counterparties. Assume archived material persists.',
      'Assign separate wallet roots where true separation matters; labels or accounts under one recovery seed do not prevent compromise and funding transfers can still reveal relationships.',
      'Plan how each wallet receives funds, interacts, pays fees, queries RPC, and eventually exits. A clean address funded directly from an identified account may be attributable immediately.',
      'Use privacy-preserving wallet, node, and network settings that you understand. Disable unnecessary telemetry, separate browser profiles, and avoid checking every compartment through one provider session.',
      'When reviewing an analytical claim, distinguish direct evidence from heuristics and seek corroboration. Do not harass or accuse a person based only on an address cluster.',
    ],
    questions: [
      { question: 'Can I delete a wallet address?', answer: 'No. You can stop using keys, but confirmed public-chain history remains available. Focus on preventing new links and protecting identity rather than promising retroactive erasure.' },
      { question: 'Does a new address solve the problem?', answer: 'Only if funding, spending, network, account, and communication behavior do not reconnect it. Address rotation is useful but insufficient by itself.' },
    ],
    links: [
      { label: 'blockchain privacy tools', to: '/articles/blockchain-privacy-tools-2025' },
      { label: 'VPN and Tor guide', to: '/articles/vpn-tor-crypto-trading' },
      { label: 'blockchain forensics basics', to: '/articles/blockchain-forensics-basics' },
    ],
  },

  'cex-vs-dex-security-comparison': {
    answer: 'A centralized exchange concentrates custody, account, operational, legal, and insolvency risk in an intermediary; a decentralized exchange leaves keys with the user but adds wallet, signing, smart-contract, oracle, frontend, token, and MEV risk. Neither model is inherently safe. Use a CEX when its custody, identity, fiat, and support trade-offs fit the task; use a DEX when you can verify contracts and signatures and accept self-custody responsibility. Limit exposure and use separate wallets in both cases.',
    context: [
      'With a CEX, trades usually update an internal ledger and the venue controls asset wallets. Customers rely on the venue\'s cybersecurity, governance, reserves, access rules, legal entity, and withdrawal operation. Strong MFA protects the customer account but cannot prevent an exchange-level wallet theft, insider event, or insolvency. Applicable protections vary by product and jurisdiction; crypto balances should not be assumed equivalent to insured bank deposits.',
      'With a DEX, a user signs blockchain transactions that interact with contracts and liquidity. This reduces custodial dependence but makes approvals, calldata, routing, price impact, token behavior, smart-contract upgrades, bridges, oracles, and frontends part of the risk. A noncustodial interface can still be compromised, and a transaction that executes exactly as signed can still be economically harmful.',
    ],
    threats: [
      { title: 'CEX trust boundary', body: 'Account takeover, support abuse, API leakage, exchange-wallet theft, insider actions, freezes, outages, and insolvency can affect funds under intermediary control.' },
      { title: 'DEX trust boundary', body: 'Malicious tokens, approvals, smart-contract bugs, compromised interfaces, unsafe routers, oracle manipulation, MEV, and signing mistakes affect self-custody users.' },
      { title: 'Shared risks', body: 'Phishing, fake apps, DNS compromise, malware, deceptive support, volatile assets, and mistaken addresses can affect either path.' },
      { title: 'Recovery mismatch', body: 'CEX support may reverse some internal actions but can be slow or abused; a DEX has no help desk capable of undoing a confirmed public-chain transaction.' },
    ],
    checklist: [
      'Define the job: fiat conversion, active trading, long-term custody, a specific token, private settlement, or protocol participation. Select the narrowest venue and time exposure that serves it.',
      'For a CEX, verify the legal entity and official domain, secure email and login, restrict API keys, enable withdrawal protections, keep records, and maintain a tested self-custody destination.',
      'For a DEX, verify chain, contract, token, router, amount, slippage, minimum received, approval scope, and transaction simulation. Use a separate interaction wallet with limited assets.',
      'For either model, make a small first transaction when the route or destination is new, monitor completion independently, and avoid acting from unsolicited links or urgent support messages.',
      'Reassess lingering balances and approvals after the task. Revoke unneeded permissions, remove unused API keys, export necessary records, and update the incident plan.',
    ],
    questions: [
      { question: 'Is a DEX truly decentralized?', answer: 'It depends on contracts, admin keys, frontends, governance, order routing, sequencers, oracles, and liquidity. Evaluate the actual deployment instead of relying on the label.' },
      { question: 'Can I avoid custody risk completely?', answer: 'Self-custody replaces intermediary custody risk with key, transaction, protocol, physical, and recovery risk. The practical goal is understood and bounded exposure, not zero risk.' },
    ],
    links: [
      { label: 'centralized exchange checklist', to: '/articles/cex-security-best-practices' },
      { label: 'token approval guide', to: '/articles/revoke-token-approvals-guide' },
      { label: 'DeFi audit checklist', to: '/articles/defi-smart-contract-audit-checklist' },
    ],
  },

  'nft-marketplace-security': {
    answer: 'Trade NFTs from a separate wallet with limited assets, reach marketplaces through verified bookmarks, confirm the chain, collection contract, token ID, price, currency, recipient, marketplace contract, and approval scope before signing, and revoke stale operator permissions. Treat offers, private-sale links, Discord support, airdrops, and “verification” prompts as untrusted. A verified collection badge, simulation, hardware wallet, or marketplace warning is evidence—not a guarantee that the asset or transaction is safe.',
    context: [
      'ERC-721 allows an owner to approve one address for a token and to set an operator approval for all of the owner\'s tokens in a collection. Marketplaces need permissions to transfer sold assets, but a malicious or compromised operator can misuse broad authority. Off-chain signed orders can also remain valid until they expire, are cancelled, or are otherwise invalidated under the marketplace protocol.',
      'NFT security includes authenticity and economics as well as custody. Attackers clone artwork and collection pages, compromise project accounts, send deceptive tokens, manipulate bids, and exploit users with signature requests. Metadata and media may be hosted off-chain and can change or disappear. Verify the contract and rights you are buying; token ownership does not automatically grant copyright or guarantee permanent media hosting.',
    ],
    threats: [
      { title: 'Marketplace and support phishing', body: 'Cloned domains, promoted search results, fake Discord staff, and compromised social accounts direct users to connect and sign malicious permissions.' },
      { title: 'Operator approvals and signatures', body: 'setApprovalForAll, token approvals, permits, and signed orders can create authority or obligations that outlast the visible session.' },
      { title: 'Counterfeit collections', body: 'Similar names, copied art, spoofed profiles, and misleading badges can make a different contract appear authentic.' },
      { title: 'Metadata and protocol risk', body: 'Mutable or unavailable media, marketplace contract upgrades, royalty changes, token bugs, and chain or bridge failures can affect value and transferability.' },
    ],
    checklist: [
      'Verify the collection contract from multiple authoritative project channels and the block explorer. Compare token ID and chain; do not rely on artwork, name, floor-price display, or badge alone.',
      'Use a dedicated trading wallet. Keep long-term NFTs and unrelated tokens under separate keys so a marketplace approval or malicious signature has a smaller blast radius.',
      'Read every signature and transaction: action, marketplace, asset, amount, currency, recipient, expiry, nonce, approval target, and whether authority covers one token or an entire collection.',
      'Review active listings, offers, connected sites, and on-chain operator approvals after trading. Cancel or revoke what is no longer needed, understanding that each on-chain change costs fees and must target the correct chain.',
      'If compromise is suspected, stop signing, preserve the URL and transaction hashes, revoke specific approvals from a clean environment, and move unaffected assets to fresh keys when key disclosure is possible.',
    ],
    questions: [
      { question: 'Does disconnecting a marketplace revoke NFT approvals?', answer: 'No. Disconnecting usually changes the site connection; ERC-721 operator approvals remain on-chain until revoked or changed by the owner or contract logic.' },
      { question: 'Is an NFT in a hidden folder dangerous?', answer: 'Simply receiving or viewing an unsolicited token is generally different from following its link, approving an operator, or signing a transaction. Do not interact with it through an unverified site.' },
    ],
    links: [
      { label: 'setApprovalForAll risks', to: '/articles/setapprovalforall-risks' },
      { label: 'wallet incident response', to: '/articles/crypto-hack-response-playbook' },
      { label: 'NFT scam red flags', to: '/articles/nft-scam-red-flags' },
    ],
  },
};

export const legacyWalletContentMap: Record<string, React.FC> = Object.fromEntries(
  Object.entries(articles).map(([slug, article]) => [slug, () => <ArticleBody article={article} />]),
);
