import React from 'react';
import { Link } from 'react-router-dom';

const SourceLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary underline underline-offset-4 hover:text-primary/80"
  >
    {children}
  </a>
);

const Eip7702WalletDelegationContent = () => (
  <div className="space-y-8">
    <section className="rounded-xl border border-border/60 bg-card/50 p-6">
      <h2 className="text-2xl font-bold mb-4">The direct answer: is EIP-7702 wallet delegation safe?</h2>
      <p className="text-lg leading-relaxed mb-4">
        EIP-7702 can be used safely when a reputable wallet delegates to a reviewed implementation and makes the
        target and scope understandable. It is not a routine token approval. Delegation makes an existing externally
        owned account execute code from another address, so flawed or malicious delegate code can obtain extensive
        power over the account.
      </p>
      <p>
        The original EOA private key still retains ultimate authority. It can submit ordinary transactions and replace
        or clear the delegation, which is useful for recovery but also means delegation alone does not turn a
        single-key account into a true multisig.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What does EIP-7702 actually do?</h2>
      <p className="mb-4">
        EIP-7702 introduced a type-4 “set code” transaction. Its authorization list contains signed tuples binding a
        chain ID, delegate address, and account nonce. For a valid tuple, the authorizing EOA receives a delegation
        indicator that points execution to the chosen code. Calls execute that code in the context of the user's
        address and storage.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="font-semibold text-lg mb-2">Same address</h3>
          <p>The account can gain smart-account behavior without moving assets to a newly deployed account.</p>
        </div>
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="font-semibold text-lg mb-2">Programmable execution</h3>
          <p>Wallets can support batching, sponsored transactions, session policies, and other account logic.</p>
        </div>
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="font-semibold text-lg mb-2">Replaceable pointer</h3>
          <p>A later authorization can change the target; delegating to the null address resets it.</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What should a wallet user verify before delegating?</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li>
          <strong>Start inside the wallet, not an unsolicited dapp prompt.</strong> Ethereum.org guidance says dapps
          should use standardized wallet interfaces instead of asking users to manage raw EIP-7702 authorizations.
          An unexpected “upgrade,” “activation,” or “migration” signature deserves the same suspicion as a seed-phrase request.
        </li>
        <li>
          <strong>Identify the delegate contract.</strong> Confirm that the address and code are the implementation
          your wallet documents. A familiar brand name displayed by a website is not proof of the onchain target.
        </li>
        <li>
          <strong>Check the chain scope.</strong> A normal chain-specific authorization is safer to reason about than
          a <code className="rounded bg-muted px-1.5 py-0.5">chain_id=0</code> authorization that may apply across EVM chains.
        </li>
        <li>
          <strong>Understand who can upgrade it.</strong> A proxy can make fixes and modular upgrades easier, but adds
          trust in whoever controls upgrades. An immutable target reduces that particular dependency but cannot be patched in place.
        </li>
        <li>
          <strong>Keep a recovery path.</strong> Know how the wallet shows an active delegation and how to replace or
          clear it. Do not test recovery for the first time during an incident.
        </li>
      </ol>
      <div className="mt-5 rounded-lg border border-primary/30 bg-primary/10 p-5">
        <p>
          A hardware wallet confirmation should prominently identify a delegation and its target. If the device shows
          only opaque bytes or the companion app cannot explain the request, reject it and investigate through the
          wallet vendor's independently verified support channel.
        </p>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What must delegate-contract developers secure?</h2>
      <div className="space-y-5">
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Bind every security-sensitive field</h3>
          <p>
            The EIP calls out replay protection, value, gas, target, and calldata as inputs that delegated execution
            may need the account authority to sign. If an authorization omits a meaningful field, a sponsor or attacker
            may be able to replay it, redirect execution, alter value, or deliberately cause failure.
          </p>
        </div>
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Make initialization authorized and atomic</h3>
          <p>
            EIP-7702 sets the pointer without running contract initcode. An observer can front-run an unprotected
            initializer and install their own owner or policy. Require setup parameters to be signed by the EOA—for
            example, an <code className="rounded bg-muted px-1.5 py-0.5">initWithSig</code> design—or constrain setup
            through a correctly validated account-abstraction path.
          </p>
        </div>
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Treat storage as persistent across delegates</h3>
          <p>
            Changing the target does not erase the account's storage. A new implementation can interpret old slots in
            dangerous ways. Document storage namespaces, use collision-resistant layouts such as ERC-7201 where
            appropriate, and test migrations from every supported predecessor.
          </p>
        </div>
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Remove EOA-only assumptions</h3>
          <p>
            Contracts can no longer rely on <code className="rounded bg-muted px-1.5 py-0.5">tx.origin</code> identifying
            a non-programmable account, or on <code className="rounded bg-muted px-1.5 py-0.5">msg.sender == tx.origin</code>
            as a reentrancy defense. Use explicit authorization and established reentrancy protections.
          </p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Implementation checklist for wallets and dapps</h2>
      <ul className="list-disc pl-6 space-y-3">
        <li>Inventory every place that assumes an address with an EOA history cannot execute code.</li>
        <li>Use wallet capability interfaces for outcomes such as batched calls; do not manufacture raw delegation flows in a dapp.</li>
        <li>Allow only reviewed delegate implementations under an explicit wallet trust policy and publish their addresses.</li>
        <li>Display the chain, authority, target, permanence, upgrade model, and recovery or reset path before approval.</li>
        <li>Test signature replay, wrong chain, stale nonce, altered calldata, altered value, griefing, and failed outer execution.</li>
        <li>Test initialization races and storage migration using public-mempool and adversarial ordering assumptions.</li>
        <li>Monitor supported delegate bytecode, proxy admins, upgrades, and abnormal calls from delegated accounts.</li>
        <li>Prepare support guidance for detecting and clearing unexpected delegations without exposing private keys.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What are EIP-7702's limitations?</h2>
      <p className="mb-4">
        EIP-7702 is a capability mechanism, not a complete wallet-security design. It does not certify delegate code,
        guarantee a readable signature prompt, remove the original key's power, or solve recovery by itself. A delegate
        audit reduces known risk but does not prove the absence of bugs or unsafe upgrade governance.
      </p>
      <p>
        Revocation also does not undo transactions already executed, restore stolen assets, or automatically clear
        persistent storage. Chain-wide authorizations create additional deployment-consistency hazards, and relayer-dependent
        implementations can introduce availability or privacy dependencies.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold mb-2">Does EIP-7702 turn my EOA into a multisig?</h3>
          <p>No. A delegate may enforce multisig-like policies for its own execution path, but the original EOA key can still replace the delegation or transact directly.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Is a delegation temporary?</h3>
          <p>The code setting persists until another valid authorization replaces or clears it. Individual permissions implemented by the delegate may have their own expiry.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Can I revoke a malicious delegation?</h3>
          <p>
            The EIP allows the EOA authority to reset delegation to the null address. If compromise is suspected, use a
            clean environment and trusted wallet recovery flow; removing the pointer does not reverse earlier actions.
          </p>
        </div>
      </div>
    </section>

    <section className="rounded-xl bg-card/50 p-6">
      <h2 className="text-2xl font-bold mb-4">Continue strengthening the signing path</h2>
      <p className="mb-3">
        Pair delegation review with the <Link className="text-primary underline underline-offset-4" to="/articles/clear-signing-erc-7730-guide">clear-signing and ERC-7730 guide</Link>,
        then review <Link className="text-primary underline underline-offset-4" to="/articles/revoke-token-approvals-guide">token approval revocation</Link> and
        the <Link className="text-primary underline underline-offset-4" to="/articles/crypto-phishing-attacks-prevention">crypto phishing prevention guide</Link>.
      </p>
      <p>
        For emerging wallet and protocol activity, check the <Link className="text-primary underline underline-offset-4" to="/threat-intel">threat-intelligence feed</Link>.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Primary sources</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><SourceLink href="https://eips.ethereum.org/EIPS/eip-7702">EIP-7702: Set Code for EOAs</SourceLink></li>
        <li><SourceLink href="https://ethereum.org/roadmap/pectra/7702/">ethereum.org: Pectra EIP-7702 guidelines</SourceLink></li>
        <li><SourceLink href="https://blog.ethereum.org/2025/04/23/pectra-mainnet">Ethereum Foundation: Pectra Mainnet Announcement</SourceLink></li>
      </ul>
    </section>
  </div>
);

const ClearSigningErc7730Content = () => (
  <div className="space-y-8">
    <section className="rounded-xl border border-border/60 bg-card/50 p-6">
      <h2 className="text-2xl font-bold mb-4">The direct answer: what are clear signing and ERC-7730?</h2>
      <p className="text-lg leading-relaxed mb-4">
        Clear signing means showing a transaction's human-relevant intent—action, assets, amounts, destinations,
        permissions, and constraints—before the user approves it. ERC-7730 is an open JSON format that supplies the
        context wallets need to turn contract calldata or typed messages into that structured display.
      </p>
      <p>
        It is safer than approving raw hexadecimal data, but it is not a safety verdict. The user still signs the
        underlying transaction, and the wallet must obtain, trust, and correctly apply an accurate descriptor.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Why is an ABI decode not always enough?</h2>
      <p className="mb-4">
        An ABI may reveal a function name and primitive fields without explaining what they mean. A raw integer could
        be a token quantity, timestamp, percentage, or limit; its safe display may require decimals, token identity,
        units, or application-specific semantics. Developer-oriented names can also obscure the action a user cares about.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Opaque or weak display</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Function selector or raw hexadecimal calldata</li>
            <li>Unlabelled addresses and large integers</li>
            <li>A generic “contract interaction” prompt</li>
            <li>A typed field name without its practical consequence</li>
          </ul>
        </div>
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Clear display</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>The action, such as swap, transfer, borrow, or approve</li>
            <li>Human-formatted assets and amounts</li>
            <li>Recipient, spender, protocol, and network context</li>
            <li>Minimum output, deadline, scope, or other safety limits</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">How does an ERC-7730 descriptor work?</h2>
      <p className="mb-4">
        A descriptor accompanies rather than changes the signed data. The ethereum.org implementation tutorial groups
        the document into three main sections:
      </p>
      <ol className="list-decimal pl-6 space-y-4">
        <li><strong>Context</strong> binds the descriptor to specific contract deployments using chain IDs and addresses.</li>
        <li><strong>Metadata</strong> names the owner, contract, and canonical information that can help the wallet identify the integration.</li>
        <li><strong>Display formats</strong> map function signatures or message types to labels, templates, and formatting rules for their fields.</li>
      </ol>
      <p className="mt-4">
        This separation lets an existing contract gain clear-signing support without redeployment. The open registry
        distributes descriptors; independent reviewers can attest to accuracy; each wallet decides which registry,
        descriptor sources, and attestations it trusts.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What should users check on a clear-signing screen?</h2>
      <div className="rounded-lg border border-primary/30 bg-primary/10 p-5 mb-5">
        <p>
          Read the trusted wallet or hardware-device display, not only the dapp webpage. A compromised frontend can
          describe one action while requesting another; the signing surface is where that mismatch can be caught.
        </p>
      </div>
      <ul className="list-disc pl-6 space-y-3">
        <li><strong>Action:</strong> Is this a transfer, swap, approval, permit, deposit, vote, or administrative change?</li>
        <li><strong>Network and protocol:</strong> Are the chain and contract deployment the ones you intended?</li>
        <li><strong>Assets and amounts:</strong> Do token identities, decimal placement, exact input, and minimum output match?</li>
        <li><strong>Counterparty:</strong> Is the recipient, spender, operator, or validator expected?</li>
        <li><strong>Authority:</strong> Is the request spending assets now or granting reusable permission for later?</li>
        <li><strong>Limits:</strong> Check slippage, deadlines, duration, nonce, scope, and any unlimited or wildcard value.</li>
        <li><strong>Completeness:</strong> If material fields are omitted, ambiguous, or shown as unknown, reject and investigate.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Implementation checklist for dapp and protocol teams</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li>
          <strong>Inventory signable operations.</strong> Include direct calls, routers, multicalls, proxy implementations,
          account-abstraction operations, permits, and EIP-712 messages—not just the happy-path transaction.
        </li>
        <li>
          <strong>Verify the contract source and ABI.</strong> The ethereum.org registry workflow requires a verified ABI;
          make sure the descriptor corresponds to deployed execution logic rather than a stale local artifact.
        </li>
        <li>
          <strong>Bind every deployment.</strong> Declare the correct chain ID and contract address for each supported
          deployment. Never assume a familiar address has the same meaning on every chain.
        </li>
        <li>
          <strong>Describe user intent.</strong> Translate fields into action-oriented labels and units. Surface recipients,
          spenders, token addresses, quantities, minimums, expiries, and privilege changes.
        </li>
        <li>
          <strong>Validate and test adversarially.</strong> Use the official validation tooling, then test extreme decimals,
          zero and maximum values, unknown tokens, nested calls, malformed data, proxy upgrades, and misleading names.
        </li>
        <li>
          <strong>Submit and seek independent review.</strong> Registry inclusion distributes a descriptor; attestations
          give wallets additional evidence for their own trust policy.
        </li>
        <li>
          <strong>Own the lifecycle.</strong> Make descriptor review part of releases. A contract upgrade, new router,
          field-semantic change, or deployment can make a formerly accurate display incomplete or wrong.
        </li>
      </ol>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What should wallet teams do?</h2>
      <ul className="list-disc pl-6 space-y-3">
        <li>Define and publish a descriptor-source and attestation trust policy.</li>
        <li>Cryptographically bind the rendered values to the exact bytes the device will sign.</li>
        <li>Show provenance and a clear warning when a descriptor is missing, stale, conflicting, or untrusted.</li>
        <li>Render high-risk authority changes prominently instead of compressing them into a generic summary.</li>
        <li>Fail safely when formatting or metadata lookup fails; never silently substitute reassuring labels.</li>
        <li>Test localization and screen truncation so a critical address, sign, amount, or unit cannot disappear.</li>
        <li>Keep an expert view of raw and decoded fields for independent verification and incident response.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What clear signing cannot guarantee</h2>
      <p className="mb-4">
        ERC-7730 does not inspect all future contract behavior, certify economic safety, detect a stolen key, or prove
        the dapp's business claims. It does not stop a user from approving a clearly displayed malicious action. A
        correct descriptor can still describe interaction with vulnerable or hostile code.
      </p>
      <p>
        Descriptors are supplied alongside transactions rather than embedded in them. That supports old and new
        applications, but creates a distribution and trust problem: a wallet needs a reliable mapping, validation,
        freshness, and conflict policy. Simulations and risk engines can complement the display, but their assumptions
        and state can also be incomplete.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold mb-2">Is ERC-7730 final?</h3>
          <p>At the time of this review, the EIP page labels ERC-7730 as a draft Standards Track ERC. Teams should pin the schema they validate and watch the specification and tooling for changes.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Does the descriptor alter what I sign?</h3>
          <p>No. It supplies formatting context for the underlying calldata or typed message. A secure wallet must ensure the human display remains bound to those exact bytes.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Can existing dapps add clear signing?</h3>
          <p>Yes. Because the descriptor is separate from the contract, teams can describe existing verified deployments without redeploying them.</p>
        </div>
      </div>
    </section>

    <section className="rounded-xl bg-card/50 p-6">
      <h2 className="text-2xl font-bold mb-4">Build defense around the display</h2>
      <p className="mb-3">
        Clear signing is strongest when the delivery path is trustworthy. Use the <Link className="text-primary underline underline-offset-4" to="/articles/dns-domain-security-web3-dapps">DNS and domain security guide</Link> to
        protect the frontend, and the <Link className="text-primary underline underline-offset-4" to="/articles/multi-signature-wallet-setup">multisignature wallet guide</Link> to improve high-value authorization workflows.
      </p>
      <p>
        Users can also review <Link className="text-primary underline underline-offset-4" to="/articles/ice-phishing-explained">ice phishing</Link> and
        <Link className="text-primary underline underline-offset-4" to="/articles/eip-7702-wallet-delegation-security">EIP-7702 delegation security</Link> for two permission models that need especially careful prompts.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Primary sources</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><SourceLink href="https://blog.ethereum.org/2026/05/12/clear-signing-announcement">Ethereum Foundation: Clear Signing announcement</SourceLink></li>
        <li><SourceLink href="https://eips.ethereum.org/EIPS/eip-7730">ERC-7730: Structured Data Clear Signing Format</SourceLink></li>
        <li><SourceLink href="https://ethereum.org/developers/tutorials/clear-signing">ethereum.org: Add clear signing to your protocol</SourceLink></li>
      </ul>
    </section>
  </div>
);

const DnsDomainSecurityWeb3Content = () => (
  <div className="space-y-8">
    <section className="rounded-xl border border-border/60 bg-card/50 p-6">
      <h2 className="text-2xl font-bold mb-4">The direct answer: how should a Web3 team secure its domain?</h2>
      <p className="text-lg leading-relaxed mb-4">
        Treat the official domain as part of the transaction-signing system. Protect registrar, DNS, certificate,
        hosting, and deployment access with strong authentication and least privilege; lock domains against
        unauthorized changes; verify DNS continuously; monitor Certificate Transparency logs; and rehearse a recovery
        process that can warn users through channels outside the affected domain.
      </p>
      <p>
        A secure smart contract does not make a dapp frontend trustworthy. If an attacker redirects the official name
        or changes the served application, users can receive hostile transaction requests from a URL and valid TLS
        certificate that appear legitimate.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What is DNS and domain tampering?</h2>
      <p className="mb-4">
        The Domain Name System maps human-readable names to services. Domain tampering is an unauthorized change to
        registration, name-server delegation, zone records, or related infrastructure that changes where a name
        resolves. Domain hijacking can also involve unauthorized transfer or changes at the registrar.
      </p>
      <p>
        CISA warns that an attacker able to change DNS can redirect traffic and obtain valid certificates for the
        organization's names. Because the browser sees the expected domain and a valid certificate, users may receive
        no certificate warning. In Web3, the counterfeit frontend can then ask wallets to approve malicious calls,
        approvals, permits, or messages while contracts themselves remain unchanged.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Map the complete domain trust boundary</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Control plane</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Registrar and reseller accounts</li>
            <li>Registrant and recovery contact mailboxes</li>
            <li>Authoritative DNS provider and API tokens</li>
            <li>Registry or registrar lock procedures</li>
            <li>DNSSEC keys, DS records, and rollover process</li>
          </ul>
        </div>
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Delivery plane</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>CDN, hosting, object storage, and origin</li>
            <li>TLS certificate issuance and automation</li>
            <li>Source control, CI, and release credentials</li>
            <li>Analytics, tag managers, and third-party scripts</li>
            <li>Wallet connection and RPC configuration</li>
          </ul>
        </div>
      </div>
      <p className="mt-4">
        An inventory should name the owner, provider, authentication method, recovery contact, normal records, expiry,
        and emergency path for every production domain and high-risk subdomain. Forgotten staging names and legacy
        provider delegations are part of the attack surface too.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Prevention checklist for Web3 frontends</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li>
          <strong>Harden every DNS-changing account.</strong> Use unique credentials and phishing-resistant MFA where
          the provider supports it. CISA recommends MFA for registrar, DNS operator, authoritative-server, and related
          management accounts; migrate from providers that cannot support strong controls when feasible.
        </li>
        <li>
          <strong>Separate roles and recovery.</strong> Do not let one daily-use identity control registrar, DNS,
          hosting, source, and recovery email. Restrict API tokens to required zones and actions, and avoid long-lived
          keys in developer laptops or general CI environments.
        </li>
        <li>
          <strong>Apply the right locks.</strong> Registrar locks can prevent routine unauthorized transfer. Higher-value
          registry locks may require stronger out-of-band verification before transfer, deletion, or updates. Document
          exactly what each provider's lock protects and how emergency unlock works.
        </li>
        <li>
          <strong>Enable DNSSEC with an operated rollover plan.</strong> DNSSEC signs DNS data so validating resolvers
          can detect modification. It addresses forged DNS answers, not stolen registrar credentials or a compromised
          frontend. Bad DS records or failed key rollover can also cause an outage, so test ownership and recovery first.
        </li>
        <li>
          <strong>Constrain certificate issuance.</strong> Monitor Certificate Transparency logs for unexpected
          certificates and maintain intentional certificate automation. A certificate is proof of control under the
          certificate authority's process, not proof that the frontend is honest.
        </li>
        <li>
          <strong>Protect deployments as carefully as records.</strong> Require reviewed releases, protected branches,
          short-lived CI credentials, reproducible artifacts where practical, and alerts on unexpected origin or CDN changes.
        </li>
      </ol>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What should you monitor?</h2>
      <div className="space-y-4">
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Registration and delegation</h3>
          <p>Alert on registrar status, name servers, registrant contacts where visible, expiry, lock removal, transfer events, and DS-record changes.</p>
        </div>
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Authoritative records</h3>
          <p>Compare A, AAAA, CNAME, MX, TXT, CAA, NS, and other critical records against a versioned baseline from multiple networks and resolvers.</p>
        </div>
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Certificates and content</h3>
          <p>Alert on unapproved certificates, certificate-authority changes, frontend artifact hashes, security headers, wallet-connect targets, and transaction destination changes.</p>
        </div>
        <div className="rounded-lg bg-card/50 p-5">
          <h3 className="text-xl font-semibold mb-2">Administrative activity</h3>
          <p>Send provider logins, MFA changes, API-token creation, record edits, and deploy events to a system the monitored account cannot silently rewrite.</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Domain-compromise response playbook</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li><strong>Warn users immediately through independent channels.</strong> Name the affected domains and tell users not to connect wallets or sign. Do not wait for full attribution.</li>
        <li><strong>Freeze change paths.</strong> Contact registrar, registry, DNS, CDN, hosting, and certificate providers using pre-verified emergency contacts. Request protective locks where appropriate.</li>
        <li><strong>Preserve evidence.</strong> Capture registration data, DNS responses, zone history, certificate records, provider audit logs, deployed artifacts, access logs, and exact timestamps before rotating everything.</li>
        <li><strong>Re-establish trusted administration.</strong> Recover accounts from clean devices, remove unknown sessions and tokens, rotate credentials and recovery methods, and verify every privileged identity.</li>
        <li><strong>Restore from a known-good baseline.</strong> Validate name-server delegation, zone records, DNSSEC chain, certificates, origin configuration, and frontend build independently before reopening.</li>
        <li><strong>Assess wallet impact.</strong> Identify malicious addresses, contracts, approvals, signatures, and time windows. Publish verifiable indicators and safe remediation steps without promising asset recovery.</li>
        <li><strong>Continue monitoring after restoration.</strong> DNS caches, lingering sessions, malicious certificates, and stolen deployment credentials can outlast the first fix.</li>
      </ol>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What are the limitations of common controls?</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="p-3">Control</th>
              <th className="p-3">Helps with</th>
              <th className="p-3">Does not solve</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/60">
              <td className="p-3 font-medium">Registrar lock</td>
              <td className="p-3">Unauthorized transfer and some account changes</td>
              <td className="p-3">Every DNS-provider or hosting compromise</td>
            </tr>
            <tr className="border-b border-border/60">
              <td className="p-3 font-medium">DNSSEC</td>
              <td className="p-3">Detection of forged DNS data by validating resolvers</td>
              <td className="p-3">Authorized malicious changes or compromised web content</td>
            </tr>
            <tr className="border-b border-border/60">
              <td className="p-3 font-medium">TLS</td>
              <td className="p-3">Encrypted transport to the certificate-authenticated endpoint</td>
              <td className="p-3">A hostile endpoint that controls the name and certificate</td>
            </tr>
            <tr>
              <td className="p-3 font-medium">Content monitoring</td>
              <td className="p-3">Unexpected frontend or configuration changes</td>
              <td className="p-3">Guaranteed detection before the first victim</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold mb-2">Does HTTPS mean a dapp is authentic?</h3>
          <p>No. HTTPS protects transport to the endpoint associated with the certificate. DNS or domain control can let an attacker obtain a valid certificate for a redirected service.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Will DNSSEC stop domain hijacking?</h3>
          <p>No. DNSSEC helps validating resolvers detect forged DNS answers. It cannot rescue compromised registrar credentials, authorized malicious record changes, or a compromised application deployment.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Should a team rely on social media as a backup?</h3>
          <p>Use several pre-established independent channels—status infrastructure, signed releases or messages where appropriate, community channels, and partner contacts. Any single social account can also be compromised.</p>
        </div>
      </div>
    </section>

    <section className="rounded-xl bg-card/50 p-6">
      <h2 className="text-2xl font-bold mb-4">Connect domain controls to wallet safety</h2>
      <p className="mb-3">
        A protected domain still needs an understandable signing flow. Continue with the <Link className="text-primary underline underline-offset-4" to="/articles/clear-signing-erc-7730-guide">clear-signing guide</Link> and
        the <Link className="text-primary underline underline-offset-4" to="/articles/crypto-hack-response-playbook">crypto incident-response playbook</Link>.
      </p>
      <p>
        Teams can use the <Link className="text-primary underline underline-offset-4" to="/articles/solidity-security-best-practices">smart-contract security guide</Link> for the onchain layer and
        monitor the <Link className="text-primary underline underline-offset-4" to="/threat-intel">threat-intelligence feed</Link> for current incidents.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Primary sources</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><SourceLink href="https://www.cisa.gov/sites/default/files/publications/CISAInsights-Cyber-MitigateDNSInfrastructureTampering_S508C.pdf">CISA: Mitigate DNS Infrastructure Tampering</SourceLink></li>
        <li><SourceLink href="https://www.icann.org/en/groups/ssac/documents/sac-044-en.pdf">ICANN SSAC: A Registrant's Guide to Protecting Domain Name Registration Accounts</SourceLink></li>
        <li><SourceLink href="https://www.icann.org/resources/pages/dnssec-2012-02-25-en">ICANN: DNSSEC</SourceLink></li>
      </ul>
    </section>
  </div>
);

export const protocolSecurityContentMap: Record<string, React.FC> = {
  'eip-7702-wallet-delegation-security': Eip7702WalletDelegationContent,
  'clear-signing-erc-7730-guide': ClearSigningErc7730Content,
  'dns-domain-security-web3-dapps': DnsDomainSecurityWeb3Content,
};
