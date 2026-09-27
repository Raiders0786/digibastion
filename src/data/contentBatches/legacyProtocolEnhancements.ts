import type { ArticleMeta } from '../articlesData';

export const legacyProtocolEnhancements: Record<string, Partial<ArticleMeta>> = {
  'formal-verification-smart-contracts': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'Formal verification can prove explicit smart-contract properties within a defined model. It is strongest for critical invariants such as solvency, conservation, authorization, and state transitions, but its conclusion is only as complete as the specification and environmental assumptions.',
    keyTakeaways: [
      'A proof establishes a stated property under modeled assumptions; it does not prove that the business requirements, deployment, governance, or integrations are safe.',
      'Start with a small set of high-consequence invariants and version the specification beside the implementation.',
      'Combine formal methods with fuzzing, integration tests, deployment verification, and independent human review.',
    ],
    sources: [
      { title: 'Solidity SMTChecker documentation', publisher: 'Solidity', url: 'https://docs.soliditylang.org/en/latest/smtchecker.html' },
      { title: 'Halmos symbolic testing documentation', publisher: 'a16z crypto', url: 'https://github.com/a16z/halmos' },
      { title: 'Certora Prover documentation', publisher: 'Certora', url: 'https://docs.certora.com/en/latest/' },
    ],
  },
  'defi-smart-contract-audit-checklist': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'A useful DeFi audit challenges asset, accounting, authorization, oracle, upgrade, integration, and operational assumptions against a pinned release. Users should verify the reviewed scope and deployed bytecode rather than treating an audit logo as a guarantee.',
    keyTakeaways: [
      'Scope must include every contract and control that can hold, move, price, pause, or upgrade user assets.',
      'A report is only relevant when the deployed implementation and configuration match the reviewed release.',
      'Audits need defense in depth from caps, delays, monitoring, safe defaults, and rehearsed incident response.',
    ],
    sources: [
      { title: 'Smart Contract Security Verification Standard', publisher: 'OWASP', url: 'https://scs.owasp.org/SCSVS/' },
      { title: 'Smart contract security', publisher: 'ethereum.org', url: 'https://ethereum.org/en/developers/docs/smart-contracts/security/' },
      { title: 'Contracts security utilities', publisher: 'OpenZeppelin', url: 'https://docs.openzeppelin.com/contracts/5.x/api/utils#security' },
    ],
  },
  'smart-contract-fuzzing-guide': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'Smart-contract fuzzing is valuable when a realistic stateful harness asks an engine to break precise invariants across adversarial inputs and call sequences. Foundry and Echidna complement unit tests by producing reproducible counterexamples for accounting and authorization failures.',
    keyTakeaways: [
      'Write invariants independently of implementation details and exercise them with several adversarial actors.',
      'Stateful handlers, realistic token behavior, time changes, callbacks, and preserved seeds matter more than raw case counts.',
      'A passing campaign describes only its harness and configuration; use coverage review and complementary analysis.',
    ],
    sources: [
      { title: 'Invariant testing', publisher: 'Foundry', url: 'https://www.getfoundry.sh/guides/invariant-testing' },
      { title: 'Echidna', publisher: 'Trail of Bits', url: 'https://github.com/crytic/echidna' },
      { title: 'Building Secure Contracts: Echidna', publisher: 'Trail of Bits', url: 'https://secure-contracts.com/program-analysis/echidna/index.html' },
    ],
  },
  'smart-contract-audit-process': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'A smart-contract audit is a time-bounded review of a defined revision and threat model. Strong engagements map assets and trust first, combine manual and automated analysis, verify remediation, and close the final gap by checking production bytecode and configuration.',
    keyTakeaways: [
      'Freeze a deterministic review commit and provide architecture, privilege, invariant, dependency, and deployment documentation.',
      'Track each reproducible finding through remediation or explicit risk acceptance and have fixes independently verified.',
      'Verify runtime bytecode, proxy implementations, initialization, roles, and timelocks after deployment.',
    ],
    sources: [
      { title: 'Smart Contract Security Verification Standard', publisher: 'OWASP', url: 'https://scs.owasp.org/SCSVS/' },
      { title: 'Smart contract security', publisher: 'ethereum.org', url: 'https://ethereum.org/en/developers/docs/smart-contracts/security/' },
      { title: 'Building Secure Contracts', publisher: 'Trail of Bits', url: 'https://secure-contracts.com/' },
    ],
  },
  'layer-2-security-considerations': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'Layer 2 users rely on bridge code, proof and data-availability assumptions, sequencer behavior, upgrades, and escape paths in addition to Ethereum settlement. These protections differ by deployment and can change as rollups upgrade.',
    keyTakeaways: [
      'Evaluate the live bridge, proof system, data availability, forced-inclusion path, upgrade delay, and emergency controls separately.',
      'Use canonical addresses from independent official sources and understand withdrawal finality before depositing.',
      'Settlement on Ethereum does not make sequencer availability, bridge correctness, governance, or user interfaces risk-free.',
    ],
    sources: [
      { title: 'Scaling Ethereum', publisher: 'ethereum.org', url: 'https://ethereum.org/en/developers/docs/scaling/' },
      { title: 'Fault proofs explainer', publisher: 'Optimism', url: 'https://docs.optimism.io/op-stack/fault-proofs/explainer' },
      { title: 'Inside Arbitrum Nitro', publisher: 'Arbitrum', url: 'https://docs.arbitrum.io/how-arbitrum-works/inside-arbitrum-nitro' },
    ],
  },
  'erc20-token-vulnerabilities': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'ERC-20 integrations fail when they assume uniform return values, balances, decimals, approvals, and administrative behavior. Token authors should minimize custom behavior; integrators should explicitly support or reject unusual transfer and supply semantics.',
    keyTakeaways: [
      'Use maintained implementations and safe transfer wrappers, but still model fee, rebase, callback, pause, blacklist, and upgrade behavior.',
      'Credit actual received value where accounting requires it and test rounding, decimals, permits, and nonstandard returns.',
      'Users should verify contract and proxy authority, limit allowances, and treat ticker symbols as untrusted labels.',
    ],
    sources: [
      { title: 'ERC-20 token standard', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-20' },
      { title: 'ERC-20 documentation', publisher: 'OpenZeppelin', url: 'https://docs.openzeppelin.com/contracts/5.x/erc20' },
      { title: 'ERC-2612 permit extension', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-2612' },
    ],
  },
  'flash-loan-attacks-explained': {
    readTime: '9 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'Flash loans provide temporary atomic capital; they do not create the underlying vulnerability. Exploits succeed when manipulable prices, unsafe share accounting, instant governance, or another broken invariant lets temporary liquidity extract persistent value.',
    keyTakeaways: [
      'Design every public operation as if an attacker can access deep temporary liquidity and compose many protocols atomically.',
      'Protect the underlying oracle, accounting, and governance invariant instead of blocking known lenders or contract callers.',
      'Use realistic fork simulation, stateful fuzzing, exposure caps, and safe failure behavior for external data.',
    ],
    sources: [
      { title: 'Flash loans', publisher: 'Aave', url: 'https://aave.com/docs/aave-v3/guides/flash-loans' },
      { title: 'Insecure oracle usage', publisher: 'OWASP', url: 'https://scs.owasp.org/SCWE/SCSVS-ORACLE/SCWE-028/' },
      { title: 'Oracles', publisher: 'Uniswap', url: 'https://docs.uniswap.org/contracts/v2/concepts/core-concepts/oracles' },
    ],
  },
  'account-abstraction-security': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'ERC-4337 smart accounts add programmable authorization and recovery but expand the security boundary to validation code, EntryPoint, bundlers, paymasters, factories, modules, session keys, and upgrades. The complete UserOperation path must preserve intent and replay protection.',
    keyTakeaways: [
      'Bind signatures to the full operation, chain, account, EntryPoint, nonce, and validity window.',
      'Treat modules, recovery, factories, paymasters, and upgrades as alternate authorization paths that require equal scrutiny.',
      'Users should inspect calls and permissions, review session keys, and test recovery before relying on it.',
    ],
    sources: [
      { title: 'ERC-4337 account abstraction', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-4337' },
      { title: 'Account abstraction roadmap', publisher: 'ethereum.org', url: 'https://ethereum.org/en/roadmap/account-abstraction/' },
      { title: 'Account modules', publisher: 'OpenZeppelin', url: 'https://docs.openzeppelin.com/community-contracts/account-modules' },
    ],
  },
  'impermanent-loss-risks': {
    readTime: '9 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'Impermanent loss is an LP position’s shortfall relative to holding the starting assets, before fees and rewards. Net performance depends on the exact pool invariant, price path, liquidity range, fee flow, incentives, costs, and asset failure risk.',
    keyTakeaways: [
      'Compare LP performance with a same-asset hold benchmark and separate fees, incentives, price PnL, gas, and divergence loss.',
      'Concentrated liquidity improves capital efficiency while adding range, rebalancing, and one-sided exposure risk.',
      'Stress depegs, volume decline, incentive expiry, out-of-range time, and exit costs before depositing.',
    ],
    sources: [
      { title: 'Uniswap v2 whitepaper', publisher: 'Uniswap', url: 'https://uniswap.org/whitepaper.pdf' },
      { title: 'Uniswap v3 whitepaper', publisher: 'Uniswap', url: 'https://uniswap.org/whitepaper-v3.pdf' },
      { title: 'Concentrated liquidity', publisher: 'Uniswap', url: 'https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity' },
    ],
  },
  'sandwich-attack-prevention': {
    readTime: '9 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'A sandwich attacker orders trades before and after a visible swap to worsen the victim’s execution and capture the difference. Tight execution bounds, liquid routes, smaller or limit-style orders, and protected submission reduce exposure but introduce trade-offs.',
    keyTakeaways: [
      'Minimum output, maximum input, price impact, route, and deadline define execution risk more reliably than a headline quote.',
      'A high slippage tolerance authorizes a worse result; it does not improve routing or guarantee execution.',
      'Private submission reduces public visibility but adds operator trust, privacy, censorship, and fallback assumptions.',
    ],
    sources: [
      { title: 'Maximal extractable value', publisher: 'ethereum.org', url: 'https://ethereum.org/en/developers/docs/mev/' },
      { title: 'Flashbots Protect overview', publisher: 'Flashbots', url: 'https://docs.flashbots.net/flashbots-protect/overview' },
      { title: 'Swaps', publisher: 'Uniswap', url: 'https://developers.uniswap.org/docs/get-started/concepts/traders/swaps' },
    ],
  },
  'reentrancy-attack-prevention': {
    readTime: '9 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'Reentrancy exploits external control transfer while a system’s state is inconsistent. Secure designs preserve invariants before interaction and test callbacks across every function and contract that shares sensitive state, including read-only paths.',
    keyTakeaways: [
      'Treat every external call, token hook, receiver, callback, and fallback as adversarial code execution.',
      'Use checks-effects-interactions, appropriately scoped guards, and pull payments around explicit invariants.',
      'Test cross-function, cross-contract, callback-token, upgrade, and read-only reentrancy—not only repeated withdrawal.',
    ],
    sources: [
      { title: 'Security considerations: reentrancy', publisher: 'Solidity', url: 'https://docs.soliditylang.org/en/latest/security-considerations.html#reentrancy' },
      { title: 'ReentrancyGuard', publisher: 'OpenZeppelin', url: 'https://docs.openzeppelin.com/contracts/5.x/api/utils#ReentrancyGuard' },
      { title: 'Reentrancy attacks', publisher: 'OWASP', url: 'https://scs.owasp.org/SCWE/SCSVS-CODE/SCWE-046/' },
    ],
  },
  'frontend-attack-vectors': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'A compromised Web3 frontend can construct malicious transactions while unchanged contracts remain secure. Registrar, DNS, source control, CI, hosting, packages, third-party scripts, and administrator sessions all belong inside the transaction-signing trust boundary.',
    keyTakeaways: [
      'Protect every release and domain control plane with phishing-resistant authentication, least privilege, and reviewed changes.',
      'Minimize third-party code, preserve build provenance, monitor deployed bundles, and publish addresses independently.',
      'Users must verify wallet-displayed intent because HTTPS and a familiar interface do not prove a transaction is safe.',
    ],
    sources: [
      { title: 'Implementing phishing-resistant MFA', publisher: 'CISA', url: 'https://www.cisa.gov/resources-tools/resources/implementing-phishing-resistant-mfa' },
      { title: 'Content Security Policy Cheat Sheet', publisher: 'OWASP', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html' },
      { title: 'Registrant protection guide', publisher: 'ICANN', url: 'https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/sac-044-en.pdf' },
    ],
  },
  'blockchain-forensics-basics': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'Blockchain forensics reconstructs asset flows and develops evidence; ledger links alone rarely establish who controls an address. Credible attribution combines onchain analysis with preserved device, service-provider, communication, network, and legal evidence.',
    keyTakeaways: [
      'Preserve transaction hashes, addresses, timestamps, messages, domains, screenshots, and device evidence immediately.',
      'Separate observation from inference and state confidence and alternative explanations for every attribution.',
      'Tracing does not guarantee identification, freezing, or recovery, and recovery scammers frequently target victims again.',
    ],
    sources: [
      { title: 'Internet Crime Complaint Center', publisher: 'Federal Bureau of Investigation', url: 'https://www.ic3.gov/' },
      { title: 'Advisory on illicit convertible virtual currency activity', publisher: 'FinCEN', url: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2019-a003' },
      { title: 'Virtual assets red-flag indicators', publisher: 'FATF', url: 'https://www.fatf-gafi.org/en/publications/Methodsandtrends/Virtual-assets-red-flag-indicators.html' },
    ],
  },
  'npm-supply-chain-attacks-crypto': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'NPM supply-chain attacks abuse packages, maintainers, dependencies, tokens, build hooks, or copied code to enter trusted applications. Crypto teams need controls spanning publication identity, dependency review, isolated builds, provenance, runtime restrictions, and transaction verification.',
    keyTakeaways: [
      'Minimize packages, enforce lockfiles, review lockfile changes, and restrict lifecycle scripts in builds without production secrets.',
      'Use phishing-resistant maintainer authentication and short-lived, narrowly scoped or trusted publication workflows.',
      'Provenance establishes origin, not safety; clean rebuilds, review, isolation, monitoring, and wallet-visible intent remain necessary.',
    ],
    sources: [
      { title: 'Generating provenance statements', publisher: 'npm', url: 'https://docs.npmjs.com/generating-provenance-statements' },
      { title: 'Trusted publishing', publisher: 'npm', url: 'https://docs.npmjs.com/trusted-publishers' },
      { title: 'Software Bill of Materials', publisher: 'CISA', url: 'https://www.cisa.gov/sbom' },
    ],
  },
  'rpc-endpoint-security': {
    readTime: '9 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'RPC providers can observe requests, return false or stale state, censor transaction submission, or fail. Production systems should minimize exposed methods, verify chain data, use independent fallbacks, protect privacy, and monitor divergence and availability.',
    keyTakeaways: [
      'Local signing protects keys but does not prove that an endpoint’s balances, nonces, call results, or receipts are truthful.',
      'Never expose administrative, wallet, debug, or unrestricted tracing namespaces on a public node interface.',
      'Compare high-consequence finalized state across independent infrastructure and define safe behavior when providers disagree.',
    ],
    sources: [
      { title: 'Ethereum JSON-RPC API', publisher: 'ethereum.org', url: 'https://ethereum.org/developers/docs/apis/json-rpc/' },
      { title: 'EIP-1474 RPC specification', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-1474' },
      { title: 'Geth RPC server', publisher: 'go-ethereum', url: 'https://geth.ethereum.org/docs/interacting-with-geth/rpc' },
    ],
  },
  'oracle-manipulation-attacks': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'Oracle manipulation exploits external values that are cheap to distort, stale, invalid, or integrated incorrectly. Consumers must validate source liquidity, freshness, decimals, bounds, sequencer state, governance, and safe failure behavior for each protected market.',
    keyTakeaways: [
      'No provider or TWAP duration is universally safe; model manipulation cost and genuine market movement against extractable value.',
      'Reject stale, invalid, wrong-unit, incomplete, and inconsistent responses and handle downtime conservatively.',
      'Bound residual failure with collateral limits, exposure caps, pauses, monitoring, and tested recovery paths.',
    ],
    sources: [
      { title: 'Data feeds API reference', publisher: 'Chainlink', url: 'https://docs.chain.link/data-feeds/api-reference' },
      { title: 'Oracles', publisher: 'Uniswap', url: 'https://developers.uniswap.org/docs/protocols/v2/concepts/oracles' },
      { title: 'Insecure oracle usage', publisher: 'OWASP', url: 'https://scs.owasp.org/SCWE/SCSVS-ORACLE/SCWE-028/' },
    ],
  },
  'dao-governance-attacks': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'DAO attacks acquire or abuse proposal, vote, execution, or administrative authority to perform a harmful but valid action. Secure governance requires historical voting checkpoints, review time, transparent calldata, enforceable delay, constrained emergency powers, and live role monitoring.',
    keyTakeaways: [
      'Prevent voting power acquired in the same transaction from creating and executing an asset-moving proposal.',
      'Decode exact targets, values, calls, upgrades, and role changes instead of trusting proposal titles or forum summaries.',
      'A timelock helps only when it cannot be bypassed and monitoring leaves participants a meaningful cancellation or exit response.',
    ],
    sources: [
      { title: 'Governance', publisher: 'OpenZeppelin', url: 'https://docs.openzeppelin.com/contracts/5.x/governance' },
      { title: 'TimelockController', publisher: 'OpenZeppelin', url: 'https://docs.openzeppelin.com/contracts/5.x/api/governance#TimelockController' },
      { title: 'ERC-5805 voting with delegation', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-5805' },
    ],
  },
  'bridge-security-risks': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'Bridges coordinate escrow, burning, minting, release, or liquidity across independent systems. Their risk includes message verification, validator or proof assumptions, replay protection, connected-chain finality, upgrades, keys, token behavior, and backing reconciliation.',
    keyTakeaways: [
      'Bind each message to both chains, bridge domains, nonce, parties, asset, amount, and version, then enforce one-time execution.',
      'Users should verify canonical contracts and the received asset representation, test small, and understand finality and withdrawal behavior.',
      'Monitor backing, issued supply, validator and role changes, upgrades, message queues, and abnormal transfer velocity.',
    ],
    sources: [
      { title: 'Blockchain bridges', publisher: 'ethereum.org', url: 'https://ethereum.org/en/developers/docs/bridges/' },
      { title: 'Standard bridge specification', publisher: 'Optimism', url: 'https://specs.optimism.io/protocol/bridges.html' },
      { title: 'ERC-5164 cross-chain execution interface', publisher: 'Ethereum Improvement Proposals', url: 'https://eips.ethereum.org/EIPS/eip-5164' },
    ],
  },
  'solidity-security-best-practices': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'Solidity security is a lifecycle: explicit invariants, simple contracts, least privilege, safe external interactions, deterministic builds, layered testing, verified deployments, monitoring, and rehearsed response. Design so one bug, key, or dependency cannot cause immediate total loss.',
    keyTakeaways: [
      'Start with assets, authorities, trust boundaries, and invariants before selecting patterns or tools.',
      'Protect calls, oracles, initialization, upgrades, roles, storage, and unusual tokens with explicit tests and limits.',
      'Combine reviewed libraries and independent assessment with fuzzing, static and symbolic analysis, deployment checks, and operations.',
    ],
    sources: [
      { title: 'Security considerations', publisher: 'Solidity', url: 'https://docs.soliditylang.org/en/latest/security-considerations.html' },
      { title: 'Contracts documentation', publisher: 'OpenZeppelin', url: 'https://docs.openzeppelin.com/contracts/5.x/' },
      { title: 'Smart Contract Security Verification Standard', publisher: 'OWASP', url: 'https://scs.owasp.org/SCSVS/' },
    ],
  },
  'defi-hacks-2024-2025-analysis': {
    readTime: '10 min read',
    modifiedAt: '2026-09-27',
    status: 'published',
    summary: 'The durable lessons from 2024–2025 DeFi incidents are recurring failure classes: key and upgrade abuse, oracle and accounting manipulation, unsafe initialization, bridge verification, callbacks, and compromised frontends or dependencies. Each should become a control and regression test.',
    keyTakeaways: [
      'Analyze the violated invariant, prerequisite authority, first malicious state change, extraction path, and missed detection—not only incident totals.',
      'Reduce how much one credential, transaction, oracle, bridge, or upgrade can move before monitoring and delay can intervene.',
      'Convert relevant public failures into regression tests, live invariant alerts, and rehearsed containment and communication exercises.',
    ],
    sources: [
      { title: 'Smart Contract Top 10', publisher: 'OWASP', url: 'https://scs.owasp.org/sctop10/' },
      { title: 'Smart contract security', publisher: 'ethereum.org', url: 'https://ethereum.org/developers/docs/smart-contracts/security/' },
      { title: 'Cyber alerts', publisher: 'Federal Bureau of Investigation', url: 'https://www.fbi.gov/investigate/cyber/alerts' },
    ],
  },
};
