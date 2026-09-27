import type React from 'react';
import { Link } from 'react-router-dom';

interface GuideData {
  answer: string;
  mechanics: string[];
  signals: string[];
  prevention: string[];
  response: string[];
  limits: string;
  faqs: Array<{ question: string; answer: string }>;
  related: Array<{ label: string; to: string }>;
  sources: Array<{ label: string; href: string }>;
}

const Guide = ({ data }: { data: GuideData }) => (
  <div className="space-y-8">
    <section className="bg-card/50 border border-border/60 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">The short answer</h2>
      <p className="text-lg leading-relaxed">{data.answer}</p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">How the scheme works</h2>
      <ol className="list-decimal pl-6 space-y-3">
        {data.mechanics.map((item) => <li key={item}>{item}</li>)}
      </ol>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Warning signs to investigate</h2>
      <ul className="list-disc pl-6 space-y-3">
        {data.signals.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        A warning sign is a reason to slow down and verify, not proof by itself. Consider the full set of permissions,
        incentives, technical controls, and independently verifiable facts.
      </p>
    </section>

    <section className="bg-primary/10 border border-primary/20 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">Prevention checklist</h2>
      <ul className="list-disc pl-6 space-y-3">
        {data.prevention.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">If you may have been targeted</h2>
      <ol className="list-decimal pl-6 space-y-3">
        {data.response.map((item) => <li key={item}>{item}</li>)}
      </ol>
      <p className="mt-4">
        Do not pay anyone who guarantees recovery or asks for an advance fee. Blockchain transfers may be irreversible,
        but quick reporting can still help an exchange, issuer, platform, or law-enforcement investigation.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Limits of this guidance</h2>
      <p>{data.limits}</p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
      <div className="space-y-5">
        {data.faqs.map(({ question, answer }) => (
          <div key={question}>
            <h3 className="text-xl font-semibold mb-2">{question}</h3>
            <p>{answer}</p>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Continue your security review</h2>
      <p>
        {data.related.map((item, index) => (
          <span key={item.to}>
            {index > 0 ? ' · ' : ''}<Link className="text-primary underline" to={item.to}>{item.label}</Link>
          </span>
        ))}
      </p>
    </section>

    <section className="text-sm text-muted-foreground">
      <h2 className="text-xl font-bold text-foreground mb-3">Primary references</h2>
      <p className="space-x-2">
        {data.sources.map((source, index) => (
          <span key={source.href}>
            {index > 0 ? ' · ' : ''}<a className="text-primary underline" href={source.href} target="_blank" rel="noopener noreferrer">{source.label}</a>
          </span>
        ))}
      </p>
    </section>
  </div>
);

const guides: Record<string, GuideData> = {
  'soft-rug-vs-hard-rug': {
    answer: 'A hard rug is an abrupt, deliberately enabled extraction: insiders remove liquidity, mint or transfer assets through privileged contract controls, or otherwise make the market unusable. A soft rug is a slower exit in which insiders sell undisclosed allocations, stop delivering, drain attention and treasury value, or abandon a project while continuing promotional claims. The labels are informal, and neither one can be diagnosed from price decline alone. Focus on verifiable control, disclosures, transactions, and conduct rather than the name attached to the loss.',
    mechanics: [
      'Promoters create demand using a token, collection, roadmap, yield claim, or community story while retaining economic or technical control that buyers may not understand.',
      'In a hard-rug pattern, an administrator may remove liquidity, change fees, block transfers, mint supply, upgrade code, or use an undisclosed key. The exit is sudden because the capability already existed.',
      'In a soft-rug pattern, insiders may steadily sell allocations, divert treasury assets, reduce development, or replace concrete milestones with repeated marketing. Each act can appear ordinary in isolation.',
      'Thin liquidity and concentrated ownership magnify the result. A quoted price does not mean holders can sell a large position near that price.',
      'After confidence breaks, impersonators often offer support or recovery. That follow-on contact is a separate fraud risk and should not receive money, keys, or signatures.',
    ],
    signals: [
      'One wallet or a connected cluster controls a large share of supply, liquidity tokens, treasury assets, or governance votes.',
      'Upgrade, pause, blacklist, mint, fee, or withdrawal powers are controlled by one key with no delay or transparent policy.',
      'Vesting, insider allocations, market-making arrangements, and treasury spending are missing or cannot be reconciled on-chain.',
      'The team discourages questions, removes critics, changes wallet addresses, or uses guaranteed-return and artificial-urgency claims.',
      'Liquidity is shallow, temporarily locked, or paired mainly against the project’s own volatile token.',
      'Development claims cannot be matched to releases, repositories, audits, governance records, or named accountable operators.',
    ],
    prevention: [
      'Read verified contract code and identify every privileged role, upgrade path, fee setting, mint function, and emergency control.',
      'Map deployer, treasury, liquidity, vesting, and major-holder addresses; treat unknown links as uncertainty, not reassurance.',
      'Check lock beneficiary, amount, unlock date, and contract—not a screenshot or a “liquidity locked” badge.',
      'Size exposure for a total loss and test realistic exit liquidity before relying on displayed valuation.',
      'Separate a credible team identity from contract safety: either can fail independently.',
      'Keep approval permissions narrow and use a separate wallet for speculative interactions.',
    ],
    response: [
      'Stop new deposits and do not average down because a promoter promises an imminent fix.',
      'Preserve transaction hashes, contract and wallet addresses, promotional statements, governance posts, and timestamps.',
      'Review active token and NFT approvals; revoke unnecessary permissions through a trusted interface when safe to do so.',
      'Notify any involved exchange or stablecoin issuer through its official channel and submit a report to the appropriate national authority.',
      'Warn others with facts and addresses, avoiding claims you cannot substantiate or instructions that could expose more wallets.',
    ],
    limits: 'Open-source code, audits, named founders, multisignatures, and locked liquidity can reduce particular risks but do not prove honesty or eliminate operational, governance, market, or legal risk. Conversely, a failed project is not automatically a rug pull. Attribution requires evidence of intent and control that public observers may not possess.',
    faqs: [
      { question: 'Is an abandoned project always a soft rug?', answer: 'No. Businesses fail and teams stop work for many reasons. Undisclosed insider selling, misleading claims, diversion of funds, and concealment make an exit more suspicious, but “soft rug” remains a descriptive label rather than a technical verdict.' },
      { question: 'Does renounced ownership prevent a hard rug?', answer: 'No. It may remove one administrator function while leaving concentrated supply, removable liquidity, external dependencies, preconfigured fees, alternate privileged roles, or exploitable logic. Verify the exact contract state and dependencies.' },
    ],
    related: [{ label: 'Rug-pull warning signs', to: '/articles/rug-pull-warning-signs' }, { label: 'Locked liquidity explained', to: '/articles/locked-liquidity-explained' }],
    sources: [{ label: 'SEC: Crypto Asset and Cyber Enforcement Actions', href: 'https://www.sec.gov/enforcement-litigation/crypto-assets-cyber-enforcement-actions' }, { label: 'CFTC: Digital Asset and Commodity Fraud', href: 'https://www.cftc.gov/LearnAndProtect/DigitalAssetRisks/index.htm' }],
  },
  'twitter-crypto-impersonation': {
    answer: 'An X/Twitter crypto impersonation scam copies a person, project, exchange, or support account to push a fake giveaway, a malicious connection page, a fraudulent investment, or a request for credentials. A display name, profile image, follower count, reply position, or verification mark is not proof of identity. Verify the exact handle and destination through a second channel you already trust, and never treat an unsolicited reply or direct message as official support.',
    mechanics: [
      'The attacker copies branding and chooses a handle that differs by a character, added word, or Unicode lookalike; compromised real accounts may also be repurposed.',
      'Bots place replies beneath popular posts so the fraud appears in a trusted conversation. Other campaigns buy ads or use a verified-looking account to manufacture authority.',
      'The message creates urgency around an airdrop, migration, security incident, presale, refund, or support case and sends the reader to a lookalike domain.',
      'The destination may request a seed phrase, exchange login, remote access, wallet connection, approval, or opaque signature. A giveaway variant asks the victim to send funds first.',
      'After a loss, another account may pose as an investigator or recovery specialist and request more money or sensitive evidence.',
    ],
    signals: [
      'The exact @handle, account creation history, older posts, language, or linked domain differs from the organization’s established records.',
      'A supposed moderator or executive contacts you first and moves quickly to a private message, Telegram, WhatsApp, or screen-sharing session.',
      'The post promises guaranteed returns, doubles deposits, demands a “verification” transfer, or says a claim expires in minutes.',
      'The linked hostname uses extra words, hyphens, unfamiliar top-level domains, URL shorteners, or sponsored search redirects.',
      'Replies repeat nearly identical praise, suppress questions, or direct every concern to a single “support” account.',
      'The site requests a recovery phrase, private key, authenticator code, unlimited token approval, or transaction unrelated to the stated task.',
    ],
    prevention: [
      'Open the project from a saved bookmark or independently typed official site; use its published social links to confirm the account.',
      'Compare the entire handle and domain character by character. Do not rely on the avatar, display name, or badge.',
      'Disable unsolicited direct messages where practical and assume support will not ask for a seed phrase or remote-control access.',
      'Preview wallet requests on a trusted interface and reject unexplained approvals, permits, and typed-data signatures.',
      'Use a low-value interaction wallet for claims and keep long-term assets isolated.',
      'Report impersonation to X and to the impersonated organization using channels listed on its official website.',
    ],
    response: [
      'Leave the site, disconnect the wallet session, and preserve the post URL, handle, domain, screenshots, and transaction details.',
      'If credentials were entered, change them from a clean device, secure the email account, terminate sessions, and replace reused passwords.',
      'If a seed phrase or private key was disclosed, treat that wallet as compromised and move remaining assets using a clean device and verified destination.',
      'Review approvals and recent signatures; revoke unnecessary permissions, understanding that revocation cannot undo a completed transfer.',
      'Report the account and domain to the platform, financial providers involved, and the relevant fraud-reporting authority.',
    ],
    limits: 'Legitimate projects sometimes change handles, domains, or communications practices, and compromised accounts may retain their history and badge. No single profile check is decisive. Platform reports may reduce exposure but cannot guarantee removal, restitution, or identification of the operator.',
    faqs: [
      { question: 'Does a blue or gold check prove the account is safe?', answer: 'No. Verification can indicate a platform status, not that every post or linked site is trustworthy. Accounts can be imitated, purchased, or compromised. Confirm identity through independent official records.' },
      { question: 'Can merely viewing a post drain a wallet?', answer: 'Ordinary viewing does not authorize a blockchain transfer. The danger usually begins when a person visits a malicious site, installs software, shares secrets, or signs a transaction or message. Browser and device exploits are a separate risk.' },
    ],
    related: [{ label: 'Fake-airdrop guide', to: '/articles/fake-airdrop-scams' }, { label: 'Web3 social engineering', to: '/articles/social-engineering-web3' }],
    sources: [{ label: 'X: Authenticity policy', href: 'https://help.x.com/en/rules-and-policies/platform-manipulation' }, { label: 'FTC: How to recognize and avoid phishing scams', href: 'https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams' }],
  },
  'setapprovalforall-risks': {
    answer: 'setApprovalForAll is a standard ERC-721 and ERC-1155 permission that lets an operator manage every token from a particular collection held by your address. It is not automatically malicious—marketplaces use operator approvals—but approving the wrong operator can let that address transfer covered NFTs without a new approval from you. Read the operator and collection, verify why broad access is necessary, and reject unexpected requests. Revocation limits future use but cannot reverse assets already transferred.',
    mechanics: [
      'An NFT application asks the wallet to call setApprovalForAll(operator, true) on a collection contract. The collection records that operator as authorized for the owner.',
      'For ERC-721, the operator may transfer any of the owner’s tokens in that collection. ERC-1155 defines a similar all-assets operator permission for that contract.',
      'A malicious claim, mint, marketplace clone, or compromised frontend substitutes an attacker-controlled operator while presenting the request as verification or login.',
      'Once confirmed on-chain, the operator can call the collection’s transfer function. The victim need not sign a separate transfer for each NFT.',
      'The scope is contract-specific, not every NFT in every wallet, but a valuable collection can still be lost in one authorization.',
    ],
    signals: [
      'A site requests setApprovalForAll merely to view holdings, verify ownership, join a allowlist, receive support, or cancel an unrelated listing.',
      'The wallet cannot identify the operator, the collection contract differs from the expected collection, or the interface hides decoded details.',
      'The request arrives through an unsolicited direct message, reply, advertisement, or “urgent migration” announcement.',
      'The operator is a fresh address or unverified contract with no connection to the official marketplace documentation.',
      'A site asks for repeated approvals after failures or pressures you to disable wallet warnings.',
      'Your approval history contains operators for services you no longer use or no longer recognize.',
    ],
    prevention: [
      'Reach marketplaces from a bookmark and confirm the chain, NFT collection contract, operator address, and decoded method before approval.',
      'Prefer per-token approval when supported and appropriate; broad convenience creates broader exposure.',
      'Store high-value NFTs in a vault wallet that does not browse, claim airdrops, or interact with experimental applications.',
      'Review active operator approvals regularly using a reputable explorer or wallet interface reached independently.',
      'Reject blind-signing prompts and move to a wallet or signing device that displays meaningful transaction data.',
      'Remember that disconnecting a site does not revoke an on-chain approval.',
    ],
    response: [
      'Stop interacting with the suspected site and capture its URL, requested operator, collection contract, and transaction hash.',
      'Revoke the operator on the correct chain through the collection, a reputable explorer, or a trusted approval-management interface.',
      'If the wallet’s seed phrase is exposed, revoking one operator is insufficient; migrate remaining assets to a new wallet created safely.',
      'Check other collections, fungible-token allowances, permit signatures, and recent transfers for a wider compromise.',
      'Report the address and domain to the marketplace, wallet provider, hosting provider, and relevant law-enforcement channel.',
    ],
    limits: 'A current approval list is only a snapshot and may omit off-chain signatures that have not yet been submitted. Gas costs, chain congestion, and malicious transaction ordering can complicate response. Approval tools also introduce phishing risk, so validate their domain and the exact revocation transaction.',
    faqs: [
      { question: 'Does setApprovalForAll expose my seed phrase?', answer: 'No. It grants a contract-level operator permission; it does not reveal the private key. The resulting transfer authority can still be extremely damaging for the covered collection.' },
      { question: 'Does disconnecting the dapp cancel approval?', answer: 'No. Disconnecting removes the site’s local wallet session. The authorization remains in the NFT contract until an on-chain revocation succeeds or the operator otherwise loses authority.' },
    ],
    related: [{ label: 'Ice phishing explained', to: '/articles/ice-phishing-explained' }, { label: 'NFT scam warning signs', to: '/articles/nft-scam-red-flags' }],
    sources: [{ label: 'EIP-721: Non-Fungible Token Standard', href: 'https://eips.ethereum.org/EIPS/eip-721' }, { label: 'EIP-1155: Multi Token Standard', href: 'https://eips.ethereum.org/EIPS/eip-1155' }],
  },
  'locked-liquidity-explained': {
    answer: 'Locked liquidity means specified liquidity-provider tokens or a position are held by a locker contract until stated conditions are met. It can make one simple exit—immediately withdrawing that particular liquidity—harder for the locker beneficiary. It does not prove the token is safe, the lock covers meaningful liquidity, or insiders cannot extract value another way. Verify the lock on-chain, then assess contract powers, ownership concentration, unlock terms, treasury control, and actual market depth separately.',
    mechanics: [
      'A project supplies two assets to an automated-market-maker pool and receives a representation of its liquidity position.',
      'That position is deposited into a time-lock or vesting contract, which records the asset, owner or beneficiary, amount, and release rules.',
      'Promoters publish a lock link or badge. Buyers may incorrectly treat this narrow control as a general audit or guarantee.',
      'At expiry, the beneficiary can usually recover the position and withdraw liquidity. Some lockers allow transfer, migration, extension, or emergency behavior that must be understood.',
      'Even during the lock, token minting, taxes, blacklist logic, upgrades, concentrated insider sales, other pools, or compromised keys can damage holders.',
    ],
    signals: [
      'The proof is a screenshot rather than a transaction and contract state on the correct chain.',
      'Only a small portion of liquidity is locked, the duration is short, or the unlock date precedes promised milestones.',
      'Liquidity is paired with another insider-controlled or illiquid asset, so the quoted value is circular.',
      'The token contract can mint, block selling, change fees, redirect transfers, upgrade implementation, or exempt insider addresses.',
      'Most supply is concentrated outside transparent vesting, allowing holders to sell into the locked pool.',
      'The pool has little executable depth despite a large fully diluted valuation or promotional “locked value” claim.',
    ],
    prevention: [
      'Open the pool and locker contracts from independent explorer records and verify chain, token addresses, position, amount, beneficiary, and unlock rules.',
      'Compare locked liquidity with total liquidity across every material pool and network.',
      'Inspect privileged token and proxy controls, including who controls multisignature keys and whether changes have a time delay.',
      'Review supply distribution, vesting, treasury wallets, fee exemptions, and transfers among related wallets.',
      'Estimate price impact for the position you might need to sell; do not confuse a displayed spot price with exit capacity.',
      'Treat locks as one data point and size any position for complete loss.',
    ],
    response: [
      'If facts change, stop adding funds and preserve locker, pool, token, deployer, treasury, and major-holder addresses.',
      'Record promotional lock claims and the on-chain state with timestamps so later changes can be compared.',
      'Do not rush into a thin pool without reviewing price impact and transaction settings; panic transactions can create additional loss.',
      'Revoke unneeded token permissions if you interacted with a suspicious application, using a trusted tool and verified chain.',
      'Report deceptive claims and transactions to relevant platforms and authorities without paying a private “recovery” service.',
    ],
    limits: 'Liquidity design varies among constant-product pools, concentrated-liquidity positions, chains, and lockers. Public records can show code and transactions but may not reveal common ownership or off-chain agreements. A long lock can reduce immediate withdrawal risk while leaving market, oracle, governance, custody, and fraud risks intact.',
    faqs: [
      { question: 'Is 100% locked liquidity safe?', answer: 'Not necessarily. “100%” needs a denominator, and it says nothing about minting, taxes, proxy upgrades, concentrated supply, alternate pools, or the quality of the paired asset.' },
      { question: 'Is burned liquidity stronger than locked liquidity?', answer: 'Sending a position to an unusable address may make recovery difficult, but it still protects only that position. It can also prevent legitimate migration. Review the whole system, not the label.' },
    ],
    related: [{ label: 'Soft rugs vs hard rugs', to: '/articles/soft-rug-vs-hard-rug' }, { label: 'Smart-contract audit process', to: '/articles/smart-contract-audit-process' }],
    sources: [{ label: 'CFTC: Digital asset risks', href: 'https://www.cftc.gov/LearnAndProtect/DigitalAssetRisks/index.htm' }, { label: 'Investor.gov: Crypto asset securities', href: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/crypto-assets' }],
  },
  'honeypot-tokens-detection': {
    answer: 'A honeypot token lets users buy or receive the asset but prevents or economically punishes ordinary selling through contract logic, transfer rules, extreme fees, address lists, or a manipulated trading path. A successful small purchase is not a safety test. Before trading, verify the exact token and pool, inspect sell-related behavior and privileged controls, review independent transactions, and assume automated scanners can miss conditional or upgradeable traps.',
    mechanics: [
      'Promoters seed a pool and advertise rapid price growth, low market capitalization, celebrity attention, or an urgent launch.',
      'Victims can buy, which creates convincing chart activity. Transfers from the pool may be allowed while transfers back are restricted.',
      'The contract may blacklist buyers, whitelist only insider sellers, change fees after launch, impose impossible limits, or call external logic controlled by the deployer.',
      'Some designs permit small test sales and later activate restrictions; others charge a sell tax so high that a practical exit is impossible.',
      'Insiders sell through exempt wallets or remove value while buyers remain trapped, then abandon or replace the promotion.',
    ],
    signals: [
      'Verified source is absent, mismatched, proxy-based without clear implementation, or imports opaque external contracts.',
      'An owner can change tax, trading status, maximum transaction, blacklist, router, exemptions, or transfer logic without delay.',
      'Recent buyers rarely sell successfully, or successful sellers are connected to deployer and promotional wallets.',
      'The pool, token address, or chain shared in promotions differs from official or explorer records.',
      'Liquidity is shallow and ownership is concentrated even though charts show aggressive volume.',
      'A scanner gives a green label but cannot explain upgradeability, simulated conditions, or the authority behind privileged functions.',
    ],
    prevention: [
      'Confirm the contract address from multiple independent official records; token names and symbols are not unique.',
      'Read verified code and current contract state, including proxy implementation and every role that can change transfer behavior.',
      'Inspect real buys and sells on the explorer and check whether seller addresses are ordinary buyers or privileged wallets.',
      'Use simulation as supporting evidence only; state-dependent restrictions may change after the simulation.',
      'Evaluate pool depth, holder concentration, liquidity control, and realistic price impact before considering any trade.',
      'Keep speculative tokens and approvals away from a wallet holding long-term assets.',
    ],
    response: [
      'Stop buying and avoid repeatedly raising slippage or granting new approvals to force a sale.',
      'Preserve the token, pool, router, deployer, owner, implementation, transaction hashes, and promotional URLs.',
      'Revoke unnecessary allowances to suspicious routers or spenders; revocation does not make an unsellable token sellable.',
      'Report the contract and promotion to the relevant exchange, wallet, explorer, social platform, and fraud authority.',
      'Reject anyone asking for a fee, seed phrase, or remote access to “unlock” the token.',
    ],
    limits: 'Transfer restrictions can exist for anti-bot controls, compliance, launches, or broken code, so failure to sell does not alone prove criminal intent. Simulations depend on a specific block and transaction context. Tokens can upgrade or change state after review, and public analytics may misclassify internal trades or related wallets.',
    faqs: [
      { question: 'Can I test by buying a tiny amount?', answer: 'That limits trade size but does not prove later sales will work. Logic can allow selected amounts, early blocks, or whitelisted paths and change afterward. A test also exposes the wallet to approvals and malicious interfaces.' },
      { question: 'Will higher slippage fix the sale?', answer: 'Only if ordinary price movement or fees caused the failure. With blacklist or transfer logic, higher slippage will not restore permission and may worsen execution if a trade does succeed.' },
    ],
    related: [{ label: 'Token impersonation guide', to: '/articles/crypto-address-poisoning-token-impersonation' }, { label: 'Rug-pull warning signs', to: '/articles/rug-pull-warning-signs' }],
    sources: [{ label: 'ethereum.org: How to identify scam tokens', href: 'https://ethereum.org/guides/how-to-id-scam-tokens/' }, { label: 'FBI: Cryptocurrency token impersonation scam', href: 'https://www.fbi.gov/contact-us/field-offices/denver/news/fbi-warns-of-cryptocurrency-token-impersonation-scam' }],
  },
  'crypto-job-scams': {
    answer: 'A crypto job scam uses a fake recruiter, interview, coding exercise, payroll setup, or remote-work task to steal money, credentials, wallet access, or company systems. Some campaigns ask applicants to pay or move cryptocurrency; others deliver malware in a repository, meeting application, document, or “assessment.” Verify the employer through contact information you found independently, isolate untrusted code, and never use a work test on a machine or wallet that can reach valuable assets.',
    mechanics: [
      'The attacker copies a real company or recruiter profile and approaches through LinkedIn, email, Telegram, Discord, or a job board with unusually fast progress.',
      'A polished interview may be followed by a repository, package, video-call fix, document macro, or application that executes attacker-controlled code.',
      'Alternative schemes send a fake check, request equipment purchases, collect identity documents, or ask the worker to receive and forward funds or cryptocurrency.',
      'Malware steals browser sessions, developer tokens, cloud credentials, password stores, wallet files, and clipboard data, extending impact to the employer.',
      'The attacker may maintain conversation after compromise to delay detection or pose as support when the malicious file fails.',
    ],
    signals: [
      'The sender uses a free or lookalike domain and cannot be confirmed through the employer’s independently located careers page.',
      'Hiring occurs without normal interviews, references, written role details, or contact with identifiable staff.',
      'The applicant must pay for equipment, training, background checks, unlocking wages, or cryptocurrency deposits.',
      'An assessment requires disabling security tools, installing an unknown meeting client, running package-install scripts, or entering secrets.',
      'Compensation is implausible, urgency is extreme, or the job mainly involves moving money through personal accounts.',
      'Repository history, package names, contributors, and instructions do not align with the claimed organization.',
    ],
    prevention: [
      'Navigate to the company’s official careers site independently and call or email a published contact to confirm the role and recruiter.',
      'Inspect assignments as hostile: use a disposable, isolated environment with no wallets, SSH keys, browser sessions, or production access.',
      'Do not paste cloud tokens, seed phrases, private keys, or company credentials into a test project.',
      'Verify package names and lockfiles before installation; do not override operating-system or endpoint warnings for an interview.',
      'Never pay to obtain a job or use personal accounts to transfer an employer’s funds.',
      'For teams, issue minimal-access assessment devices and rehearse credential rotation for developer compromise.',
    ],
    response: [
      'Disconnect a suspected device from networks without continuing to inspect malicious files on it.',
      'Notify the employer security team and rotate exposed credentials from a separate clean device, prioritizing email, identity provider, source control, cloud, and wallets.',
      'Preserve recruiter identifiers, headers, chat logs, repository URL, filenames, hashes, payment addresses, and transaction details.',
      'Review sessions, access logs, deployments, package publication, and wallet activity for actions taken with stolen credentials.',
      'Report the job listing and accounts to the real company, hosting platforms, financial providers, and national cybercrime authority.',
    ],
    limits: 'Remote employers legitimately use repositories, contractors, cryptocurrency compensation, and asynchronous interviews. Those facts alone do not establish fraud. Sandboxes reduce risk but are not perfect, particularly when users copy files or credentials between environments. Organizational incident response should follow the company’s own containment and evidence procedures.',
    faqs: [
      { question: 'Is a coding assessment from GitHub safe?', answer: 'No repository host guarantees the code is benign. Review the account and history, inspect scripts and dependencies, and run only in an isolated environment without secrets or valuable network access.' },
      { question: 'Should an employer send a check for equipment?', answer: 'Treat check-and-reimbursement requests with caution. The FTC warns that fake checks can appear available before being reversed, leaving the recipient responsible for money sent onward.' },
    ],
    related: [{ label: 'npm supply-chain attacks', to: '/articles/npm-supply-chain-attacks-crypto' }, { label: 'Phishing prevention', to: '/articles/crypto-phishing-attacks-prevention' }],
    sources: [{ label: 'FBI/IC3: Work-from-home scams and cryptocurrency', href: 'https://www.ic3.gov/PSA/2024/PSA240604' }, { label: 'FTC: Job scams', href: 'https://consumer.ftc.gov/articles/job-scams' }],
  },
  'discord-crypto-scams': {
    answer: 'Discord crypto scams exploit trust in a community through fake moderator direct messages, compromised administrator accounts, malicious bots, counterfeit verification, and urgent mint or support links. A message appearing inside a real server can still be hostile. Assume staff will not ask for a seed phrase, private key, payment to fix support, or an unexplained signature. Confirm announcements through the project’s independently verified website and at least one separate official channel.',
    mechanics: [
      'An attacker clones a moderator profile, joins a public server, or compromises an account, bot, webhook, or staff session.',
      'The attacker creates urgency around a limited mint, token claim, migration, security incident, giveaway, or account verification.',
      'Victims are directed to a lookalike site, QR code, bot command, or private support ticket that requests login details, wallet connection, approval, or payment.',
      'A compromised announcement channel can make the link look official; deleted questions and coordinated reactions manufacture consensus.',
      'The attacker transfers approved assets or takes over the victim’s Discord account, then uses it to target more community members.',
    ],
    signals: [
      'A moderator contacts you first by direct message, especially after you ask for support in a public channel.',
      'The announcement contradicts the project website, appears only on Discord, or uses a newly registered domain.',
      'A bot asks for a seed phrase, private key, exchange code, QR login, remote access, or payment.',
      'The server suddenly disables discussion while pushing an urgent claim or changes a familiar link without explanation.',
      'A staff profile has a slightly different username, role, account age, mutual-server history, or writing style.',
      'The wallet request is an unlimited approval, operator authorization, permit, or opaque signature unrelated to the stated action.',
    ],
    prevention: [
      'Disable direct messages from server members where practical and accept support only through the project’s published process.',
      'Use unique passwords and phishing-resistant MFA for Discord and the email account that can recover it.',
      'Reach project links from a bookmark or verified website, then compare an announcement across independent channels.',
      'Do not scan login QR codes sent by another person or authorize unfamiliar applications and bots.',
      'Use a separate low-value wallet for community claims and read every decoded signature or transaction.',
      'Server operators should minimize bot permissions, protect webhooks, require strong MFA, and maintain an out-of-band incident channel.',
    ],
    response: [
      'Stop interaction and preserve message links, user IDs, server and channel IDs, domains, screenshots, and wallet transactions.',
      'Change Discord and email credentials from a clean device, enable stronger MFA, review sessions, and remove unknown authorized apps.',
      'If a wallet secret was disclosed, migrate remaining assets to a wallet generated safely; if only an approval was signed, review and revoke it.',
      'Notify real server staff through a separately verified channel so they can contain compromised roles, bots, or announcements.',
      'Report the account and server content to Discord and submit financial loss details to the appropriate authority.',
    ],
    limits: 'A legitimate server can be compromised without the project itself being fraudulent, while a fake server may look highly active. Roles, badges, reactions, member counts, and channel history are weak identity signals. Revoking an approval or removing a Discord app does not reverse completed transfers.',
    faqs: [
      { question: 'Do Discord moderators ever need my seed phrase?', answer: 'No. A recovery phrase controls the wallet and is not required to verify identity, open a ticket, resolve a mint, or receive an airdrop.' },
      { question: 'Is a link safe if an administrator posted it?', answer: 'Not necessarily. Administrator accounts, bots, and webhooks can be compromised. Cross-check the exact domain through the official website and another established channel.' },
    ],
    related: [{ label: 'Fake-airdrop scams', to: '/articles/fake-airdrop-scams' }, { label: 'Wallet-drainer response', to: '/articles/ice-phishing-explained' }],
    sources: [{ label: 'Discord Safety: Common scams', href: 'https://discord.com/safety/common-scams-what-to-look-out-for' }, { label: 'CISA: Recognize and report phishing', href: 'https://www.cisa.gov/secure-our-world/recognize-and-report-phishing' }],
  },
  'rug-pull-warning-signs': {
    answer: 'The strongest rug-pull warning signs are hidden or concentrated control: a few parties can withdraw liquidity, mint or dump supply, upgrade contracts, change fees, block transfers, or spend treasury funds without effective checks. Marketing signals—anonymous founders, hype, or a fast roadmap—are not decisive alone. Review on-chain permissions, liquidity and ownership, disclosures, and exit capacity together. No checklist can certify a project, so exposure should remain survivable.',
    mechanics: [
      'Promoters create a token or NFT narrative and use social activity, incentives, partnerships, or yield claims to attract liquidity.',
      'Control remains with deployer, treasury, upgrade administrator, governance bloc, or connected wallets, often behind technical complexity.',
      'Buyers enter a thin market. Displayed price and valuation rise even though only limited liquidity could support exits.',
      'Insiders remove liquidity, exercise privileged functions, sell concentrated allocations, drain treasury value, or simply cease work after fundraising.',
      'Confusion after the event creates openings for fake support, replacement-token migrations, and recovery scams.',
    ],
    signals: [
      'Contract ownership, proxy administration, minting, pausing, blacklist, tax, or rescue functions are not clearly documented.',
      'One party controls critical keys, governance votes, treasury, liquidity position, and public communications.',
      'Token supply and NFT holdings are concentrated or vesting claims do not match on-chain contracts.',
      'Audits are missing, obsolete, outside scope, unverifiable, or presented as a guarantee rather than a limited review.',
      'Guaranteed returns, referral pressure, artificial countdowns, paid engagement, and hostility to basic verification dominate communication.',
      'Liquidity is shallow, briefly locked, paired with an insider asset, or materially smaller than the position buyers may need to exit.',
    ],
    prevention: [
      'Identify exact contracts on the correct chain and trace deployer, owner, proxy admin, treasury, liquidity, vesting, and major-holder addresses.',
      'List every privileged action, who can perform it, whether a multisignature and delay apply, and how users learn of changes.',
      'Check whether audit scope and commit match deployed bytecode and whether serious findings were resolved.',
      'Review actual pool depth, holder distribution, unlock schedules, treasury movements, and successful sells.',
      'Verify partnerships and team claims at the claimed counterparty’s official source.',
      'Use minimal approvals, isolate speculative activity, and never invest funds needed for essential expenses.',
    ],
    response: [
      'Stop adding capital and do not follow a hurried migration link posted by the same channel.',
      'Preserve contract and wallet addresses, transaction hashes, websites, claims, audit files, governance posts, and chat records.',
      'Revoke unneeded approvals and move unaffected assets only after confirming whether the wallet key itself is compromised.',
      'Notify exchanges, issuers, marketplaces, and stablecoin providers involved using their official incident channels.',
      'Report to the relevant securities, commodities, consumer-protection, or cybercrime authority and avoid guaranteed-recovery services.',
    ],
    limits: 'Decentralized projects can have anonymous contributors and experimental governance without fraudulent intent; visible teams can still commit fraud. Audits, multisignatures, locks, and timelocks reduce selected risks but depend on scope and implementation. Public blockchain analysis rarely proves who controls a wallet or what they intended.',
    faqs: [
      { question: 'Does a smart-contract audit mean a project cannot rug?', answer: 'No. An audit is a scoped review at a point in time. It may exclude economics, key custody, upgrades, frontend compromise, later changes, insider behavior, or market liquidity.' },
      { question: 'Is an anonymous team automatically a scam?', answer: 'No, but limited accountability increases verification and enforcement uncertainty. Offset that uncertainty with transparent code, constrained controls, credible governance, verifiable delivery, and conservative exposure.' },
    ],
    related: [{ label: 'Soft rug vs hard rug', to: '/articles/soft-rug-vs-hard-rug' }, { label: 'Honeypot token detection', to: '/articles/honeypot-tokens-detection' }],
    sources: [{ label: 'Investor.gov: Crypto investment scams', href: 'https://www.investor.gov/protect-your-investments/fraud/types-fraud/crypto-investment-scams' }, { label: 'CFTC: Digital asset risks', href: 'https://www.cftc.gov/LearnAndProtect/DigitalAssetRisks/index.htm' }],
  },
  'social-engineering-web3': {
    answer: 'Web3 social engineering persuades a person to reveal a secret, install software, send assets, or authorize a harmful transaction by exploiting urgency, authority, scarcity, fear, helpfulness, or social proof. The blockchain does not verify that the human understood a signature. The most reliable defense is a repeatable pause-and-verify process: use an independent contact path, decode the requested action, separate high-value assets, and let no message override custody rules.',
    mechanics: [
      'An attacker researches public wallet activity, employment, communities, contacts, and interests to make a pretext credible.',
      'They impersonate support, a founder, recruiter, investor, colleague, friend, law officer, or romantic contact using a new or compromised account.',
      'A time-sensitive problem or opportunity narrows attention: hacked account, frozen funds, urgent governance vote, airdrop, job, tax, or secret investment.',
      'The target is moved to a site, call, remote-access tool, file, or wallet prompt and is coached past warnings.',
      'The attacker uses the first compromise for transfers, credential theft, workplace intrusion, and follow-on targeting of contacts.',
    ],
    signals: [
      'An unsolicited contact knows public details but resists verification through the organization’s published channel.',
      'The request must remain secret, bypass normal review, happen immediately, or avoid a colleague who would normally approve it.',
      'Authority is asserted through titles, badges, jargon, wallet balances, or fabricated screenshots rather than independently verifiable records.',
      'The proposed fix requires a seed phrase, authentication code, remote access, test transfer, tax, or “safe wallet” supplied by the contact.',
      'The transaction or signature has broader permissions than the story requires.',
      'The contact becomes hostile, flattering, or emotionally intense when you pause.',
    ],
    prevention: [
      'Create non-negotiable rules: never disclose wallet seeds or private keys; never approve emergency transfers from a message alone.',
      'Verify identity through a saved phone number, official website, or established in-person channel—not contact details supplied in the request.',
      'Decode the destination, asset, amount, network, method, permissions, and expiry on an independent trusted display.',
      'Require a second person and a cooling-off period for high-value or unusual actions.',
      'Keep treasury and long-term wallets separate from browsing, messaging, email, and experimental applications.',
      'Rehearse incident scenarios so staff can report a mistake promptly without fear or blame.',
    ],
    response: [
      'End contact without announcing every defensive step, and preserve messages, call details, accounts, domains, files, and transaction data.',
      'Use a clean device to secure email and identity accounts, terminate sessions, rotate credentials, and notify workplace security if relevant.',
      'Determine whether the compromise involved a site session, on-chain approval, signature, malware, or exposed seed; each requires different containment.',
      'Contact financial providers and affected counterparties through official channels and report the event promptly.',
      'Support the affected person without blame; shame delays reporting and gives attackers more time.',
    ],
    limits: 'No psychological profile reliably identifies every scam, and informed people are still vulnerable under pressure or when a trusted account is compromised. Technical controls can reduce consequences but cannot validate every off-chain claim. Incident advice depends on the specific chain, account, device, and organization.',
    faqs: [
      { question: 'Why do experienced users fall for these attacks?', answer: 'Attackers target context, workload, trust, and timing—not intelligence. Familiar interfaces and compromised real accounts can make a request fit expectations. Processes that create time and independent review are stronger than confidence alone.' },
      { question: 'Is signing a message harmless?', answer: 'No. Some signatures are login challenges, while others authorize token use, orders, permits, or structured actions. Verify the domain, readable statement, chain, contract, scope, nonce, and expiry.' },
    ],
    related: [{ label: 'Web3 OpSec playbook', to: '/articles/privacy-security-web3-opsec' }, { label: 'Crypto job scams', to: '/articles/crypto-job-scams' }],
    sources: [{ label: 'CISA: Recognize and report phishing', href: 'https://www.cisa.gov/secure-our-world/recognize-and-report-phishing' }, { label: 'FTC: Cryptocurrency scams', href: 'https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams' }],
  },
  'nft-scam-red-flags': {
    answer: 'NFT scam risk is highest when ownership and permissions are unclear: copied art, counterfeit collection contracts, concentrated holdings, unverifiable creators, privileged metadata or mint controls, broad marketplace approvals, and hype unsupported by delivery. An NFT’s image, collection name, marketplace badge, floor price, or community size does not prove provenance or value. Verify the exact contract and creator link, review permissions and distribution, and use a separate wallet before minting or trading.',
    mechanics: [
      'Scammers copy artwork and branding, deploy a lookalike collection, or compromise a real project’s social or frontend account.',
      'They create apparent demand with wash trading, coordinated wallets, paid promotion, fake allowlists, and time-limited mint pressure.',
      'The mint or marketplace clone requests payment, setApprovalForAll, token allowance, or opaque signature that exceeds the stated action.',
      'Buyers receive counterfeit or mutable metadata, cannot obtain promised benefits, or see insiders sell into manufactured demand.',
      'Follow-on phishing offers migration, rarity upgrades, staking, refunds, or recovery to holders already identified on-chain.',
    ],
    signals: [
      'The contract is not linked from a creator-controlled official source, or the same name appears across several unrelated contracts.',
      'Artwork or metadata is copied, hosted on mutable infrastructure without disclosure, or can be changed by one administrator.',
      'Ownership and trading are concentrated among wallets with circular transfers or common funding sources.',
      'The team relies on guaranteed appreciation, celebrity claims, fake scarcity, and countdown pressure rather than verifiable rights and delivery.',
      'Minting asks for a broad operator approval or token allowance that is unnecessary for receiving the NFT.',
      'Rights to art, commercial use, royalties, refunds, roadmap benefits, and custody are vague or contradict platform records.',
    ],
    prevention: [
      'Confirm chain and contract address from the creator’s established domain and compare marketplace collection records.',
      'Review creator wallet, deployment history, holder distribution, metadata controls, proxy upgradeability, mint authority, and withdrawal roles.',
      'Search for earlier publication of the art and verify partnership claims at the named partner’s source.',
      'Read the exact approval, payment, and signature; a mint should not silently authorize transfer of an existing collection.',
      'Use a low-value mint wallet and keep valuable NFTs in a vault that never interacts with unsolicited links.',
      'Treat floor price and volume as manipulable, and buy only with funds you can lose completely.',
    ],
    response: [
      'Stop using the mint or marketplace page and preserve the contract, token ID, URL, transaction, signature, and promotional records.',
      'Review and revoke malicious NFT operator approvals and fungible-token allowances through a verified interface.',
      'If the seed phrase was exposed, move unaffected assets to a clean wallet; approval revocation alone cannot restore key security.',
      'Report counterfeit art or collection records to the marketplace, creator, hosting provider, and platform without trusting replies to your report.',
      'Document loss for the relevant cybercrime or consumer authority and reject guaranteed recovery offers.',
    ],
    limits: 'Pseudonymous creators, mutable metadata, high ownership concentration, and volatile prices can exist in legitimate experimental projects. Marketplace verification policies differ and can change. Public trades do not necessarily reveal beneficial ownership, so apparent independent demand may be coordinated.',
    faqs: [
      { question: 'Does marketplace verification guarantee authenticity?', answer: 'No. A badge is a platform signal under its current policy, not a guarantee of copyright, contract safety, future delivery, price, or account security. Confirm the collection contract independently.' },
      { question: 'Can an NFT appear in my wallet without consent?', answer: 'Yes. Anyone may be able to send an NFT to a public address. Do not follow links in unsolicited metadata or interact with it merely to remove it; hiding it in the wallet interface is often safer.' },
    ],
    related: [{ label: 'setApprovalForAll risks', to: '/articles/setapprovalforall-risks' }, { label: 'NFT marketplace security', to: '/articles/nft-marketplace-security' }],
    sources: [{ label: 'EIP-721: NFT standard', href: 'https://eips.ethereum.org/EIPS/eip-721' }, { label: 'FTC: NFTs and scams', href: 'https://consumer.ftc.gov/consumer-alerts/2022/08/what-know-about-non-fungible-tokens-nfts-and-scams' }],
  },
  'ice-phishing-explained': {
    answer: 'Ice phishing tricks a wallet owner into granting authority rather than directly stealing the private key. The victim signs an approval, operator permission, permit, order, or other message that lets an attacker move assets later. Because the signature may resemble a routine login or claim, always inspect who receives authority, which asset and amount it covers, the chain, expiry, and executable action. Disconnecting the site is not revocation, and a completed transfer cannot be undone by revoking afterward.',
    mechanics: [
      'A phishing site imitates an airdrop, marketplace, exchange, staking portal, token migration, support tool, or wallet verification page.',
      'The wallet prompt requests an ERC-20 allowance, NFT operator approval, permit-style signature, marketplace order, or opaque message.',
      'The authorization points to an attacker or malicious contract but is described as harmless verification, connection, simulation, or gasless claim.',
      'The attacker submits or exercises the authority immediately or waits until the wallet receives a valuable asset.',
      'The victim may disconnect the application and assume safety even though on-chain approval or usable signature remains.',
    ],
    signals: [
      'A site requires wallet authorization to resolve support, prove age, unlock an account, cancel a transaction, or receive an unsolicited token.',
      'The spender, operator, verifying contract, chain, token, amount, nonce, or expiry is missing or does not match the intended action.',
      'The request grants unlimited value or all-collection access for a one-time task.',
      'The wallet shows raw hex, blind signing, risk warnings, or a simulation with unexpected outgoing assets.',
      'The domain arrived through an ad, direct message, compromised social account, or search result instead of a bookmark.',
      'The caller coaches you to ignore warnings, repeat failed signatures, or install another wallet.',
    ],
    prevention: [
      'Use saved official domains and confirm the contract and spender against current project documentation.',
      'Reject any prompt whose decoded effect you cannot explain, including message signatures that are not on-chain transactions yet.',
      'Prefer exact allowances and short expiries where supported; remove permissions after use.',
      'Keep savings in a vault wallet that never signs claims, marketplace listings, or experimental application messages.',
      'Use wallets and signing devices that show human-readable transaction and typed-data details.',
      'Review approvals on every used chain and remember that site disconnection changes only the local session.',
    ],
    response: [
      'Close the site and preserve the URL, wallet prompt, signature, transaction hash, chain, contract, spender, and token details.',
      'Revoke affected on-chain approvals through a verified explorer or trusted tool, checking the transaction carefully.',
      'Move valuable assets if a reusable off-chain signature remains dangerous or if the wallet key may be compromised; obtain chain-specific help from a trusted incident responder.',
      'Secure any phished account credentials and scan or rebuild the device if untrusted software was installed.',
      'Report the domain and addresses to wallet, platform, exchange, issuer, and relevant authorities.',
    ],
    limits: 'Signature effects vary across token standards, applications, chains, and contract implementations. A revocation may race an attacker and may not invalidate every off-chain order or signature. Public approval checkers can omit permissions on other networks or novel contracts, so absence from one dashboard is not proof of safety.',
    faqs: [
      { question: 'Can a message signature move assets?', answer: 'It can authorize a later action if a contract or application interprets it that way. Typed-data permits and marketplace orders are common examples. “No gas” does not mean “no authority.”' },
      { question: 'Will moving assets back later be safe?', answer: 'Only after the cause is understood and removed. A compromised seed remains compromised, and a malicious operator may still act on a collection or token if approval persists.' },
    ],
    related: [{ label: 'Token approval management', to: '/articles/revoke-token-approvals-guide' }, { label: 'setApprovalForAll risks', to: '/articles/setapprovalforall-risks' }],
    sources: [{ label: 'EIP-20: Token approvals', href: 'https://eips.ethereum.org/EIPS/eip-20' }, { label: 'EIP-712: Typed structured data', href: 'https://eips.ethereum.org/EIPS/eip-712' }],
  },
  'romance-scams-crypto': {
    answer: 'A crypto romance scam builds emotional trust, then introduces a fake investment, trading, mining, or liquidity opportunity. The website may show fabricated profits and even permit a small withdrawal before demanding larger deposits, taxes, or release fees. Stop sending money, do not pay to unlock a balance, preserve communications and transaction records, and report promptly. Approach affected people without blame: the manipulation is deliberate, sustained, and often performed by organized groups.',
    mechanics: [
      'A stranger starts contact on a dating app, social platform, text message, or “wrong number” exchange and develops frequent, personal conversation.',
      'The person avoids verifiable in-person contact while using photos, video snippets, life stories, and apparent wealth to build credibility.',
      'Cryptocurrency is introduced as a shared interest or expert-guided opportunity, and the target is directed to a specific app or website.',
      'The platform displays gains controlled by the scammer. A small withdrawal may work, encouraging a much larger deposit or loans.',
      'When withdrawal is requested, supposed customer service demands taxes, verification funds, insurance, or another fee; later, recovery scammers may re-target the victim.',
    ],
    signals: [
      'The relationship becomes intense quickly, but meetings and independently verifiable details remain unavailable.',
      'The contact insists on one unfamiliar investment platform and offers to coach every transfer or screen interaction.',
      'Returns appear smooth or guaranteed and cannot be reconciled with independent market data or regulated account statements.',
      'Withdrawals require new money, tax sent to a private wallet, “liquidity proof,” or a minimum balance.',
      'The person discourages discussion with family, financial professionals, or the user’s own exchange support.',
      'Wallet addresses, websites, corporate registrations, testimonials, and support staff all originate from the same contact network.',
    ],
    prevention: [
      'Never make an investment decision because an online romantic contact recommends or manages it.',
      'Verify identity through independent records and reverse-image search, understanding that video and documents can also be manipulated.',
      'Check registration claims directly with the relevant financial regulator and contact firms through independently located details.',
      'Do not share screens, one-time codes, identity documents, wallet seeds, or remote-control access.',
      'Discuss substantial transfers with a trusted person who is not part of the relationship.',
      'Treat any payment required to release an investment balance as a reason to stop and verify with authorities.',
    ],
    response: [
      'Stop all payments and contact involved banks, exchanges, card issuers, or stablecoin providers immediately through official channels.',
      'Preserve profiles, phone numbers, messages, images, voice notes, domains, account statements, wallet addresses, and transaction hashes before blocking.',
      'Secure email, financial, social, and exchange accounts; remove remote-access tools and rotate credentials from a clean device.',
      'Report the profile to the platform and the fraud to national consumer-protection and cybercrime authorities.',
      'Tell a trusted person and seek emotional support. Do not engage anyone who guarantees recovery or requests an upfront payment.',
    ],
    limits: 'No single relationship pattern proves fraud, and a reverse-image result or company registration does not establish legitimacy. Authorities and financial providers may be unable to recover transferred cryptocurrency. Reporting remains worthwhile because it can connect addresses, domains, accounts, and other victims.',
    faqs: [
      { question: 'Should I pay the platform’s tax to withdraw?', answer: 'No. Stop and contact the relevant tax authority and financial provider independently. Fraudulent platforms invent taxes and release fees; another payment usually increases the loss.' },
      { question: 'How should I help a friend who may be targeted?', answer: 'Stay calm and avoid ridicule or ultimatums. Ask them to pause transfers, independently verify the platform, preserve evidence, and speak with their bank or exchange and an official fraud-reporting service.' },
    ],
    related: [{ label: 'Crypto scam recovery steps', to: '/articles/cryptocurrency-scam-recovery-steps-recovery-scams' }, { label: 'Web3 social engineering', to: '/articles/social-engineering-web3' }],
    sources: [{ label: 'FTC: What to know about romance scams', href: 'https://consumer.ftc.gov/articles/what-know-about-romance-scams' }, { label: 'FBI: Cryptocurrency investment fraud', href: 'https://www.fbi.gov/how-we-can-help-you/victim-services/national-crimes-and-victim-resources/cryptocurrency-investment-fraud' }],
  },
  'fake-airdrop-scams': {
    answer: 'A fake airdrop uses an unsolicited token, social post, advertisement, direct message, or counterfeit claim site to obtain money, credentials, wallet approvals, or signatures. A token appearing in a wallet does not prove it is valuable or safe. Find any real distribution from the project’s independently verified website, confirm the exact chain and contract, and inspect every wallet request. Never enter a recovery phrase or pay a deposit, tax, or activation fee to claim an airdrop.',
    mechanics: [
      'Attackers announce a claim through impersonated or compromised accounts, search ads, direct messages, or tokens sent to public addresses.',
      'The message uses scarcity or eligibility to direct holders to a lookalike domain or to a URL embedded in token metadata.',
      'The site requests wallet connection followed by an allowance, NFT operator approval, permit, token transfer, or opaque signature.',
      'A giveaway version asks the claimant to send funds first for validation, gas, tax, matching, or activation.',
      'Once authority or funds are obtained, the attacker transfers assets and may reuse victim accounts or wallet history for follow-on scams.',
    ],
    signals: [
      'The only announcement is a reply, ad, direct message, unfamiliar calendar invitation, wallet token, or NFT description.',
      'The domain differs from the established project site or was reached through a shortened or redirected link.',
      'Claiming requires a seed phrase, private key, exchange login, remote access, or sending cryptocurrency first.',
      'The wallet prompt grants unlimited spending, all-NFT operator access, or authority over assets unrelated to the advertised token.',
      'A countdown, “connect to check,” celebrity quote, or high token price replaces published eligibility and contract details.',
      'The token has a copied name or symbol, no verified contract source, shallow liquidity, or links controlled by an unknown deployer.',
    ],
    prevention: [
      'Start from a bookmark or independently typed project domain and confirm the claim in multiple established official channels.',
      'Verify chain, distribution contract, token contract, eligibility rules, and claim deadline against official documentation.',
      'Read the decoded transaction or typed message and reject permissions that do not match receipt of the stated asset.',
      'Never interact with links embedded in unsolicited token or NFT metadata.',
      'Use a separate low-value claim wallet and keep long-term holdings isolated from promotional activity.',
      'Remember that legitimate gas is paid through the wallet transaction, not by sending a deposit to a support address.',
    ],
    response: [
      'Leave the site and preserve the domain, account, token and claim contracts, requested spender, signature, and transactions.',
      'Review and revoke affected allowances or operator permissions through a trusted interface on every relevant chain.',
      'If a seed phrase was entered, create a clean wallet on a trusted device and migrate remaining assets; do not reuse the phrase.',
      'Secure any phished email, social, or exchange accounts and end unknown sessions.',
      'Report the domain and addresses to the genuine project, wallet provider, social platform, financial providers, and relevant authority.',
    ],
    limits: 'Legitimate distributions vary: some use claims, snapshots, attestations, or delegated eligibility, and contract interfaces differ across chains. Airdrop simulation and approval dashboards may not understand every custom contract. No tool can guarantee that a future token has value or that governance will remain trustworthy.',
    faqs: [
      { question: 'Can an unsolicited token drain my wallet by itself?', answer: 'Receiving a standard token does not normally authorize outgoing assets. Risk rises when you visit its link, approve a spender, sign a message, or trade through a malicious contract or interface.' },
      { question: 'Is a gasless claim automatically safe?', answer: 'No. Gasless flows often rely on signatures that another party submits. Read the structured data, verifying contract, action, value, nonce, and expiry before signing.' },
    ],
    related: [{ label: 'Ice phishing explained', to: '/articles/ice-phishing-explained' }, { label: 'Token impersonation guide', to: '/articles/crypto-address-poisoning-token-impersonation' }],
    sources: [{ label: 'ethereum.org: Scam prevention', href: 'https://ethereum.org/security/' }, { label: 'FTC: Cryptocurrency scams', href: 'https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams' }],
  },
};

const makeGuide = (slug: string): React.FC => {
  const Component = () => <Guide data={guides[slug]} />;
  Component.displayName = `${slug.replace(/(^|-)([a-z])/g, (_, __, letter: string) => letter.toUpperCase())}Content`;
  return Component;
};

export const legacyScamContentMap: Record<string, React.FC> = Object.fromEntries(
  Object.keys(guides).map((slug) => [slug, makeGuide(slug)]),
);
