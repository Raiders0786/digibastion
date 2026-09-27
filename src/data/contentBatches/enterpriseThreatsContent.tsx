import React from 'react';
import { Link } from 'react-router-dom';

const DprkRemoteWorkerRiskContent: React.FC = () => (
  <div className="space-y-8">
    <section className="bg-card/50 border border-border/60 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">The direct answer</h2>
      <p className="text-lg leading-relaxed">
        Crypto and Web3 companies should manage DPRK remote IT worker risk as an insider-risk problem built on
        identity fraud—not as a nationality-guessing exercise. Verify identity repeatedly, issue only managed devices,
        keep production, treasury, signing, and secret access narrowly separated, monitor for remote-control and data-
        exfiltration behavior, and prepare a coordinated HR, legal, security, and law-enforcement response.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What is the threat?</h2>
      <p className="mb-4">
        The FBI warned in January 2025 that North Korean IT workers have used unlawful company access to take
        proprietary data, support cybercrime, and generate revenue. It also described cases in which discovered workers
        held stolen code or data for ransom and copied repositories to personal accounts. In June 2025, the U.S.
        Department of Justice described schemes involving stolen or false identities, fraudulent websites, financial
        accounts, and laptop farms that let overseas workers access company laptops located in the United States.
      </p>
      <p>
        Web3 teams have additional exposure because developers may work near source code, deployment systems, cloud
        credentials, signing workflows, or virtual assets. DOJ allegations include fraudulent employment at a blockchain
        research and development company followed by virtual-currency theft. These are allegations and enforcement
        findings about identified schemes; they do not justify treating ordinary remote workers as presumptively hostile.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">A useful threat model</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card/50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Entry</h3>
          <p>
            Fraudulent or borrowed identity material, reused contact details, front-company references, synthetic video,
            or a staffing intermediary can help a candidate pass a weak remote-hiring process.
          </p>
        </div>
        <div className="bg-card/50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Remote operation</h3>
          <p>
            A company laptop may be relayed through a third party or remotely controlled. The apparent device location
            therefore cannot, by itself, prove who is operating it or where the operator is located.
          </p>
        </div>
        <div className="bg-card/50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Access and collection</h3>
          <p>
            Legitimate developer access can expose repositories, internal messaging, secrets, build systems, customer
            data, session cookies, or production tooling if role boundaries are too broad.
          </p>
        </div>
        <div className="bg-card/50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Monetization and pressure</h3>
          <p>
            Salary can be the objective, while data theft, credential harvesting, virtual-asset theft, or extortion can
            deepen the harm. A worker who is removed may still retain copied data or active sessions.
          </p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Prevention checklist for hiring and onboarding</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li>
          <strong>Make verification consistent and lawful.</strong> Use a documented process for every comparable remote
          role. Cross-check identity and employment evidence through independent channels, with counsel reviewing privacy,
          employment, sanctions, and anti-discrimination obligations in each jurisdiction.
        </li>
        <li>
          <strong>Look for contradictions, not accents or appearance.</strong> Investigate repeated phone numbers or email
          addresses across candidates, duplicated resume language, unexplained changes to payment or delivery details,
          and answers that conflict with claimed location or education. No single indicator proves malicious activity.
        </li>
        <li>
          <strong>Assess live, role-relevant work.</strong> Have interviewers discuss prior decisions and conduct a
          supervised exercise appropriate to the job. Do not ask candidates to run untrusted take-home code; malicious
          recruiting tests are themselves a known crypto-sector risk.
        </li>
        <li>
          <strong>Verify intermediaries.</strong> Contractually require staffing firms to perform robust checks and audit
          whether the person interviewed, onboarded, and performing the work remains the same person.
        </li>
        <li>
          <strong>Ship hardened, managed equipment through a verified process.</strong> Record custody, prohibit unapproved
          remote-access software, disable routine local administrator access, and require endpoint monitoring before the
          device receives company access.
        </li>
      </ol>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Controls after the person is hired</h2>
      <ul className="list-disc pl-6 space-y-3">
        <li><strong>Least privilege:</strong> start with the minimum repositories, environments, secrets, and data needed for current tasks; time-limit elevation.</li>
        <li><strong>Separate custody:</strong> developers should not automatically inherit treasury, validator, deployment, or production-signing authority.</li>
        <li><strong>Protect source and secrets:</strong> block personal cloud synchronization where appropriate, monitor unusual repository cloning, and keep secrets out of source control.</li>
        <li><strong>Re-authenticate sensitive actions:</strong> use phishing-resistant MFA where supported and require independent approval for high-impact changes.</li>
        <li><strong>Monitor behavior:</strong> investigate prohibited remote-desktop tools, concurrent sessions, rapid logins from disparate locations, unusual outbound traffic, and transfers to personal repositories or shared drives.</li>
        <li><strong>Re-verify at meaningful changes:</strong> repeat appropriate checks when devices, payment destinations, location, staffing arrangements, or privileged roles change.</li>
      </ul>
      <p className="mt-4">
        Monitoring should be disclosed, proportionate, access-controlled, and reviewed under applicable law. It should
        create leads for human investigation, not automated guilt by association.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Response steps when you suspect a fraudulent worker</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li><strong>Activate the incident team quietly.</strong> Include security, HR, legal, identity/access, and executive owners. Avoid tipping off the subject before containment is ready.</li>
        <li><strong>Preserve evidence.</strong> Retain identity records, interviews, access logs, device telemetry, repository events, communications, payment changes, and relevant cloud logs with documented handling.</li>
        <li><strong>Contain through approved procedures.</strong> Revoke active sessions and tokens, disable accounts, isolate managed endpoints, rotate secrets the account could reach, and review recent code and deployment changes.</li>
        <li><strong>Assess downstream impact.</strong> Determine which repositories, customer data, build artifacts, keys, signing systems, and counterparties were accessible. Do not assume account disablement removed copied data.</li>
        <li><strong>Report and obtain counsel.</strong> The FBI asks suspected victims to report quickly to IC3 and evaluate network activity from the person and assigned devices. Counsel should guide law-enforcement, regulator, insurer, employee, and customer notifications.</li>
        <li><strong>Recover deliberately.</strong> Rebuild trust from verified devices and identities, validate releases, rotate exposed credentials, and tighten the control that allowed the access.</li>
      </ol>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Limits and frequently asked questions</h2>
      <div className="space-y-5">
        <div><h3 className="text-lg font-semibold mb-2">Can an IP address or video interview confirm identity?</h3><p>No. Each can support a wider verification process, but remote relays, laptop farms, compromised identities, and manipulated media make any single signal inadequate.</p></div>
        <div><h3 className="text-lg font-semibold mb-2">Should we ban remote developers or stablecoin payroll?</h3><p>The cited guidance does not make either control a complete answer. Design controls around identity assurance, access, devices, payment-change verification, and observable behavior.</p></div>
        <div><h3 className="text-lg font-semibold mb-2">Does a suspicious indicator prove DPRK involvement?</h3><p>No. Indicators are prompts to investigate. Attribution and employment action require corroborated evidence, appropriate expertise, and legal review.</p></div>
      </div>
    </section>

    <section className="bg-primary/10 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-3">Continue building the control stack</h2>
      <p>
        Pair this program with the <Link className="text-primary underline" to="/articles/npm-supply-chain-attacks-crypto">npm supply-chain defense guide</Link>,
        {' '}the <Link className="text-primary underline" to="/articles/solidity-security-best-practices">Solidity security guide</Link>, and a rehearsed
        {' '}<Link className="text-primary underline" to="/articles/crypto-hack-response-playbook">crypto incident-response playbook</Link>.
      </p>
    </section>
  </div>
);

const BrowserWalletInfostealerContent: React.FC = () => (
  <div className="space-y-8">
    <section className="bg-card/50 border border-border/60 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">The direct answer</h2>
      <p className="text-lg leading-relaxed">
        Protect a browser wallet by keeping high-value keys off the everyday browsing device, never storing recovery
        phrases or private keys in screenshots or cloud-synced files, limiting extensions and downloads, and using a
        hardware wallet where appropriate. If infostealer infection is suspected, stop using the host, recover accounts
        from a known-clean device, and move assets whose signing secrets may have been exposed to newly generated keys.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Why infostealers are a wallet threat</h2>
      <p className="mb-4">
        The joint FBI and CISA advisory AA25-141B says LummaC2 can exfiltrate sensitive information including financial
        credentials, cryptocurrency wallets, browser extensions, and multifactor-authentication details. Its documented
        behaviors include collecting browser information and communicating with attacker infrastructure. That means a
        browser-wallet incident may extend beyond one extension: email, exchange sessions, password stores, developer
        tokens, and other accounts used on the host can share the same failure domain.
      </p>
      <p>
        A hardware wallet reduces private-key exposure because signing keys remain on the device, but it is not a cure for
        a hostile computer. Malware or a malicious site can still present a deceptive transaction, replace a destination,
        steal unlocked sessions, or trick the user into revealing a recovery phrase. Verify intent and addresses on the
        trusted signing display and keep the recovery phrase offline.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Threat model: what could be exposed?</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card/50 p-5 rounded-lg"><h3 className="text-lg font-semibold mb-2">Wallet secrets</h3><p>A digitally stored recovery phrase, exported private key, wallet backup, extension data, or an unlocked wallet can become a direct asset risk.</p></div>
        <div className="bg-card/50 p-5 rounded-lg"><h3 className="text-lg font-semibold mb-2">Account access</h3><p>Passwords, cookies, active browser sessions, and MFA-related data can let an attacker reach email, exchanges, cloud storage, or developer services.</p></div>
        <div className="bg-card/50 p-5 rounded-lg"><h3 className="text-lg font-semibold mb-2">Transaction intent</h3><p>Even without extracting a hardware-wallet key, a compromised host can misrepresent what the user is about to sign.</p></div>
        <div className="bg-card/50 p-5 rounded-lg"><h3 className="text-lg font-semibold mb-2">Recovery channels</h3><p>Email and cloud-account compromise can undermine password resets, support conversations, notifications, and stored backups.</p></div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Prevention checklist</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li><strong>Keep the recovery phrase offline.</strong> ethereum.org warns against sharing it or taking screenshots, because a screenshot may synchronize to cloud storage. Never type it into a website or “support” form.</li>
        <li><strong>Use separated wallet tiers.</strong> Keep only activity funds in a browser hot wallet. Hold larger or long-term balances behind hardware signing or an appropriately governed multisig.</li>
        <li><strong>Reduce browser exposure.</strong> Install extensions only from verified publisher pages, remove those you no longer use, avoid pirated software and unexpected attachments, and keep the browser and operating system supported and patched.</li>
        <li><strong>Separate sensitive activity.</strong> A dedicated browser profile or managed device for wallet operations reduces cross-contamination from everyday browsing, but separation only helps when extensions, downloads, and accounts are also constrained.</li>
        <li><strong>Verify on the signing device.</strong> Check the chain, destination, amount, and transaction meaning on the hardware-wallet display where possible. Reject blind or unexplained signing requests.</li>
        <li><strong>Constrain dapp authority.</strong> Review approvals before signing, avoid unlimited allowances when a narrower amount works, and periodically revoke permissions you no longer need.</li>
        <li><strong>Prepare clean recovery.</strong> Maintain tested offline backups, current asset and account inventories, trusted contact paths, and a separate device that can be used during an incident.</li>
      </ol>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Suspected infection: respond in this order</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li><strong>Stop sensitive activity on the suspected host.</strong> Disconnect it from networks if doing so will not disrupt a managed investigation. Do not use it to change passwords, create a new wallet, or check balances.</li>
        <li><strong>Use a known-clean device and trusted network.</strong> Secure primary email first, then password manager, exchanges, cloud accounts, developer accounts, and other recovery dependencies. End active sessions and rotate credentials.</li>
        <li><strong>Classify wallet exposure.</strong> If a recovery phrase or private key ever existed digitally on the host, or was entered while compromise may have been active, treat that key as exposed. A hardware wallet whose recovery phrase never touched the host has a different risk profile, but suspicious approvals and transactions still require review.</li>
        <li><strong>Create clean keys and move assets carefully.</strong> Generate replacement keys on a clean hardware device or otherwise trusted environment. Verify the new receive address independently before moving assets. Prioritize according to value, exploitability, and current evidence; rushed signing on the infected host can worsen the incident.</li>
        <li><strong>Revoke residual authority.</strong> Remove token approvals, disconnect sessions, rotate exchange API keys, invalidate developer tokens, and review smart-account delegates or session keys associated with the exposed wallet.</li>
        <li><strong>Preserve and investigate.</strong> For an organizational device, contact the security team before wiping it. Preserve logs and forensic evidence, check other systems for the same initial-access path, and use current indicators from authoritative advisories as investigative leads.</li>
        <li><strong>Rebuild trust.</strong> Reimage or replace the system under a documented process, patch it, reinstall only required software from verified sources, and restore data without restoring suspect executables or extensions.</li>
      </ol>
    </section>

    <section className="border border-destructive/30 bg-destructive/5 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-3">Do not make these incident mistakes</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Do not type the old recovery phrase into a “wallet checker,” cleanup site, or unsolicited support tool.</li>
        <li>Do not assume antivirus quarantine proves that credentials and sessions were not already stolen.</li>
        <li>Do not restore a compromised wallet by importing its old phrase into a new extension and call it rotated.</li>
        <li>Do not publish live forensic details, addresses, or evidence before considering attacker awareness and privacy.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Limits and frequently asked questions</h2>
      <div className="space-y-5">
        <div><h3 className="text-lg font-semibold mb-2">Does a hardware wallet make an infected PC safe?</h3><p>No. It keeps keys off the computer when used correctly, but a compromised interface can still mislead the signer. Verify details on the hardware device.</p></div>
        <div><h3 className="text-lg font-semibold mb-2">Is changing the wallet password enough?</h3><p>No. A local wallet password protects a particular encrypted store; it cannot make an already copied recovery phrase or private key secret again.</p></div>
        <div><h3 className="text-lg font-semibold mb-2">Should I wipe the device immediately?</h3><p>For a personal device with no investigative need, rebuilding is often part of recovery. For a company or material-loss incident, coordinate evidence preservation first.</p></div>
      </div>
    </section>

    <section className="bg-primary/10 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-3">Related Digibastion guides</h2>
      <p>
        Review <Link className="text-primary underline" to="/articles/seed-phrase-security-guide">seed phrase storage</Link>,
        {' '}compare <Link className="text-primary underline" to="/articles/hot-wallet-vs-cold-wallet">hot and cold wallets</Link>,
        {' '}and rehearse the <Link className="text-primary underline" to="/articles/crypto-hack-response-playbook">crypto hack response playbook</Link> before you need them.
      </p>
    </section>
  </div>
);

const ExchangeApiKeySecurityContent: React.FC = () => (
  <div className="space-y-8">
    <section className="bg-card/50 border border-border/60 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">The direct answer</h2>
      <p className="text-lg leading-relaxed">
        Secure trading automation by giving each bot and environment a separate, least-privileged API key; disabling
        withdrawal or transfer permissions unless the workflow truly requires them; restricting source IPs where the
        exchange supports it; storing secrets outside code and logs; monitoring every key; and maintaining a fast,
        tested revocation path from a device independent of the bot host.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Why API keys need their own security design</h2>
      <p className="mb-4">
        An API key is a machine credential. Anyone who obtains the full credential set may be able to act with its
        assigned permissions until it is revoked or expires. Google Cloud's general API-key guidance recommends
        restrictions, deleting unnecessary keys, keeping keys out of client code and repositories, isolating keys by
        application and team member, rotating them, and monitoring use. The same lifecycle principles are useful for
        exchange automation, subject to each exchange's exact authentication model.
      </p>
      <p>
        Exchange controls differ. Coinbase Exchange documentation separates view, trade, transfer, and manage permissions
        and requires an IP whitelist during key creation. OKX distinguishes read, trade, and withdraw permissions and
        recommends binding keys to IP addresses. Always verify the current controls in the official documentation and UI
        of the exact venue and account type you use.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Threat model for a trading bot</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card/50 p-5 rounded-lg"><h3 className="text-lg font-semibold mb-2">Secret disclosure</h3><p>Keys leak through repositories, build logs, screenshots, support tickets, shell history, environment dumps, backups, or a compromised developer or server.</p></div>
        <div className="bg-card/50 p-5 rounded-lg"><h3 className="text-lg font-semibold mb-2">Abuse within scope</h3><p>A key without withdrawal access can still create harmful orders, reveal balances and strategy, or move value through trading if its permissions and risk controls allow it.</p></div>
        <div className="bg-card/50 p-5 rounded-lg"><h3 className="text-lg font-semibold mb-2">Pipeline compromise</h3><p>A malicious dependency, CI runner, container image, or deployment operator may read the credential at build or runtime.</p></div>
        <div className="bg-card/50 p-5 rounded-lg"><h3 className="text-lg font-semibold mb-2">Control-plane failure</h3><p>The team may detect abuse but be unable to identify, revoke, or replace the correct key without stopping unrelated systems.</p></div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">A secure architecture checklist</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li><strong>One workload, one key.</strong> Separate production from development, strategy A from strategy B, and bot service from human access. Unique keys make revocation and attribution practical.</li>
        <li><strong>Start with no withdrawal capability.</strong> Grant only the documented read or trade operations the bot needs. If funds must move, use a separate, tightly governed workflow and key rather than adding withdrawal rights to the trading bot.</li>
        <li><strong>Use account boundaries.</strong> Where the venue supports portfolios or subaccounts, isolate bot balances and permissions so one automation failure cannot reach every asset.</li>
        <li><strong>Restrict where credentials can be used.</strong> Bind the key to stable egress IP addresses when supported. Treat allowlisting as defense in depth: a compromised allowed server can still use the key.</li>
        <li><strong>Keep secrets out of source and artifacts.</strong> Inject credentials at runtime from a managed secret store. Prevent them from entering browser code, mobile apps, repositories, container images, test fixtures, crash reports, or logs.</li>
        <li><strong>Limit who and what can retrieve the secret.</strong> The bot runtime should receive only its own key. Developers, CI jobs, observability tools, and support staff should not gain production-secret access by default.</li>
        <li><strong>Add trading guardrails outside the credential.</strong> Apply venue and bot controls for maximum order size, instruments, leverage, daily loss, price deviation, and kill conditions where supported. Permission scope alone does not prevent destructive but authorized trades.</li>
        <li><strong>Monitor by key identity.</strong> Alert on unusual source IPs, permission changes, authentication failures, new instruments, order-rate changes, balance changes, and activity outside expected operating windows.</li>
      </ol>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Key lifecycle and rotation</h2>
      <ul className="list-disc pl-6 space-y-3">
        <li><strong>Inventory:</strong> record owner, bot, venue, account boundary, permissions, IP restrictions, creation date, last use, rotation deadline, and emergency contact—never the secret value in the inventory.</li>
        <li><strong>Issue:</strong> create keys through an approved account, verify scope and restrictions before adding funds, and use a second reviewer for privileged capabilities.</li>
        <li><strong>Deploy:</strong> deliver the secret through the secret-management path, run a minimal-permission test, and confirm that disallowed operations fail.</li>
        <li><strong>Rotate:</strong> create a replacement, deploy it, confirm expected operation, revoke the old key, and verify that the old credential can no longer authenticate.</li>
        <li><strong>Retire:</strong> delete keys when bots, vendors, developers, or environments are decommissioned. An unused credential is avoidable attack surface.</li>
      </ul>
      <p className="mt-4">
        Rotation frequency should reflect venue capability, exposure, and operational risk. A calendar is useful, but
        rotate immediately after suspected disclosure, unauthorized use, access changes, or compromise of a system that
        could read the credential.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Response steps for a suspected key leak</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li><strong>Stop the blast radius.</strong> Disable the bot and revoke the affected key from a trusted administrative device. If key identity is uncertain, revoke the candidate set rather than preserving uptime at the expense of account safety.</li>
        <li><strong>Use venue controls.</strong> Cancel unauthorized or risky open orders, reduce exposure, and contact the exchange through a verified support or institutional channel if activity or access cannot be controlled.</li>
        <li><strong>Preserve evidence.</strong> Retain exchange audit history, key metadata, source IPs, order events, application logs, deployment history, and secret-access logs without copying secrets into the incident ticket.</li>
        <li><strong>Determine the exposure path.</strong> Search repositories and history, CI logs, artifacts, host telemetry, dependency changes, support systems, and staff access. Rotating without closing the leak can expose the replacement.</li>
        <li><strong>Review the account, not just the key.</strong> Inspect permissions, allowlists, account security, linked applications, balances, transfers, orders, and other credentials. Rotate related secrets when the same host or store could access them.</li>
        <li><strong>Restore narrowly.</strong> Issue a new key with the minimum scope and a new secret-delivery path, validate restrictions, then resume at limited capacity while monitoring closely.</li>
      </ol>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Limits and frequently asked questions</h2>
      <div className="space-y-5">
        <div><h3 className="text-lg font-semibold mb-2">Is disabling withdrawals enough?</h3><p>No. It is an important reduction in impact, but trading permission can still create losses or manipulate positions. Add balance isolation and trading guardrails.</p></div>
        <div><h3 className="text-lg font-semibold mb-2">Does an IP allowlist make a leaked key harmless?</h3><p>No. It blocks use from other sources, but an attacker controlling an allowed server or network path may still succeed. Keep all other controls.</p></div>
        <div><h3 className="text-lg font-semibold mb-2">Should secrets be encrypted in a config file?</h3><p>Encryption can help only if decryption authority is better protected. Prefer a managed secret system with workload identity, access logs, and narrowly scoped retrieval over shipping ciphertext and its effective unlock path together.</p></div>
      </div>
    </section>

    <section className="bg-primary/10 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-3">Related Digibastion guides</h2>
      <p>
        Extend the design with <Link className="text-primary underline" to="/articles/cex-security-best-practices">centralized exchange security practices</Link>,
        {' '}the <Link className="text-primary underline" to="/articles/password-manager-crypto-security">password and secret-storage guide</Link>,
        {' '}and the <Link className="text-primary underline" to="/articles/npm-supply-chain-attacks-crypto">software supply-chain defense guide</Link>.
      </p>
    </section>
  </div>
);

export const enterpriseThreatsContentMap: Record<string, React.FC> = {
  'dprk-remote-it-worker-risk-crypto-web3': DprkRemoteWorkerRiskContent,
  'browser-wallet-infostealer-malware-response': BrowserWalletInfostealerContent,
  'exchange-api-key-security-trading-bots': ExchangeApiKeySecurityContent,
};
