import React from 'react';
import { Link } from 'react-router-dom';

type Source = { title: string; href: string };

type LegacyGuide = {
  title: string;
  answer: string[];
  threatModel: string[];
  mechanics: string[];
  developerChecklist: string[];
  userChecklist: string[];
  verification: string[];
  limits: string[];
  faq: Array<{ question: string; answer: string }>;
  sources: Source[];
  related: Array<{ label: string; to: string }>;
};

const guides: Record<string, LegacyGuide> = {
  'formal-verification-smart-contracts': {
    title: 'Formal verification for smart contracts',
    answer: [
      'Formal verification checks whether a precisely stated property follows from a mathematical model of a contract. It can prove that every modeled execution preserves an invariant, but it cannot prove the informal business idea, deployment configuration, oracle input, administrator behavior, or compiler is safe unless those assumptions are represented correctly.',
      'Use it for a small set of high-consequence properties after ordinary tests work: conservation of assets, authorization boundaries, solvency, monotonic accounting, state-machine transitions, and upgrade compatibility. Treat a proof as evidence about a specification and model—not a certificate that the whole protocol is secure.',
    ],
    threatModel: [
      'A caller chooses adversarial calldata, transaction ordering, value, and reachable contract state.',
      'External contracts return surprising values, revert, reenter, or violate an assumed interface.',
      'Privileged actors misuse allowed powers or an upgrade changes storage and authorization semantics.',
      'The specification omits a real requirement, so the prover establishes the wrong claim perfectly.',
    ],
    mechanics: [
      'A team translates requirements into assertions, invariants, preconditions, postconditions, or temporal rules. A symbolic engine explores classes of inputs rather than a few concrete examples. SMT solvers then search for a counterexample. “Unsat” means no counterexample exists inside the encoded model and bounds; it does not remove assumptions that were abstracted away.',
      'Solidity’s SMTChecker can reason about assertions and arithmetic during compilation. Halmos runs symbolic tests written in Solidity, while rule-oriented systems can express relationships across calls. Different engines make different trade-offs around loops, external calls, unsupported opcodes, and timeouts, so results need interpretation rather than a green-badge workflow.',
    ],
    developerChecklist: [
      'Write invariants in plain language with protocol designers before translating them into tool syntax.',
      'Separate environmental assumptions from properties the implementation must enforce.',
      'Model all privileged roles, pause states, upgrades, tokens with unusual behavior, and adversarial callbacks.',
      'Keep specifications reviewed and versioned beside the code; require proof reruns on relevant changes.',
      'Investigate every counterexample manually, including apparently impossible setup states.',
      'Combine proofs with unit, integration, invariant, differential, and fork tests plus independent review.',
    ],
    userChecklist: [
      'Look for the exact properties proved, code revision, tool version, assumptions, and unresolved rules.',
      'Check whether deployed bytecode and proxy implementation match the reviewed revision.',
      'Do not interpret “formally verified” as proof about governance, keys, frontends, or price feeds.',
      'Prefer reports that publish limitations and counterexample handling, not only a marketing badge.',
    ],
    verification: [
      'Map each financial and authorization requirement to at least one executable property.',
      'Seed deliberate violations and confirm the prover produces understandable counterexamples.',
      'Run properties against every supported compiler profile and upgrade path.',
      'Review solver warnings, timeouts, abstractions, and unreachable-code assumptions as test failures until explained.',
      'Pin the verified commit and compare its build artifact with deployed bytecode.',
    ],
    limits: [
      'Proof coverage ends where the model ends. Gas exhaustion, liveness, MEV, cross-chain messages, economic incentives, and offchain services often require separate models or empirical testing.',
      'Complexity can force abstractions that weaken a claim. A narrowly worded, reproducible proof is more useful than an expansive claim whose assumptions are hidden.',
    ],
    faq: [
      { question: 'Does formal verification replace an audit?', answer: 'No. It excels at explicit properties; human review is still needed to challenge requirements, architecture, integrations, operational controls, and omitted behavior.' },
      { question: 'When should a small team start?', answer: 'After core behavior is stable, begin with one critical invariant and a reproducible command. Expanding from a useful property is better than specifying the entire system at once.' },
    ],
    sources: [
      { title: 'Solidity SMTChecker documentation', href: 'https://docs.soliditylang.org/en/latest/smtchecker.html' },
      { title: 'Halmos symbolic testing documentation', href: 'https://github.com/a16z/halmos' },
      { title: 'Certora Prover documentation', href: 'https://docs.certora.com/en/latest/' },
    ],
    related: [
      { label: 'Smart-contract fuzzing guide', to: '/articles/smart-contract-fuzzing-guide' },
      { label: 'Smart-contract audit process', to: '/articles/smart-contract-audit-process' },
      { label: 'Solidity security practices', to: '/articles/solidity-security-best-practices' },
    ],
  },
  'defi-smart-contract-audit-checklist': {
    title: 'DeFi smart-contract audit checklist',
    answer: [
      'A DeFi audit should test whether assets remain solvent and only authorized state transitions are possible under hostile calls, hostile ordering, abnormal tokens, manipulated prices, governance changes, and operational failure. An audit report alone is not enough: users and teams must verify scope, deployed bytecode, unresolved findings, upgrade powers, and post-audit changes.',
      'For developers, the fastest route to a useful review is a frozen commit, complete architecture and privilege documentation, executable invariants, deterministic builds, and a clean test suite. For depositors, the practical question is not “was it audited?” but “does the deployed system still match what was reviewed, and what can trusted actors change?”',
    ],
    threatModel: [
      'Attackers compose flash liquidity, callbacks, token quirks, and transaction ordering in one atomic transaction.',
      'Oracles become stale, illiquid, unavailable, or manipulable during market stress.',
      'Administrators, guardians, multisigs, or governance execute harmful upgrades or parameter changes.',
      'A correct contract depends on a compromised frontend, bridge, keeper, relayer, or external protocol.',
    ],
    mechanics: [
      'A serious review starts by mapping assets, roles, entry points, external calls, state transitions, and invariants. Reviewers then combine manual code analysis with static analysis, unit and invariant tests, fuzzing, and deployment checks. Findings should state impact, prerequisites, affected lines, proof of concept, and a verifiable remediation.',
      'Scope is decisive. A review of one implementation does not cover proxy administration, deployment scripts, price-feed configuration, frontend signing flows, or later commits unless named. Every excluded dependency becomes an explicit residual risk that the launch decision must accept, mitigate, or postpone.',
    ],
    developerChecklist: [
      'Document asset flows, trust boundaries, roles, emergency actions, upgrade paths, and dependency assumptions.',
      'Define solvency, conservation, authorization, and accounting invariants in executable tests.',
      'Test reentrancy, rounding, stale prices, fee-on-transfer tokens, failed transfers, and adversarial ordering.',
      'Pin compiler and dependencies, remove dead code, and make builds reproducible.',
      'Resolve every finding or publish a reasoned risk acceptance with compensating controls.',
      'Verify production initialization, role assignments, proxy slots, timelocks, and bytecode after deployment.',
    ],
    userChecklist: [
      'Confirm the report names the deployed version and includes all contracts holding or moving funds.',
      'Read unresolved and informational findings; severity labels alone can hide important assumptions.',
      'Inspect who can upgrade, pause, seize, mint, change oracles, or bypass withdrawal paths.',
      'Limit exposure when monitoring, incident response, documentation, or source verification is weak.',
    ],
    verification: [
      'Rebuild from the audited commit and compare implementation bytecode with the deployment.',
      'Trace proxy and beacon implementations rather than checking only the public proxy address.',
      'Exercise boundary values, cross-function sequences, and invariant tests on a production-like fork.',
      'Review changes made after the audit and require focused reassessment for security-sensitive diffs.',
      'Run a launch drill covering pause, oracle failure, key loss, communication, and safe fund recovery.',
    ],
    limits: [
      'An audit is a time-bounded review, not a guarantee. Novel economic behavior may only appear under real liquidity, congestion, governance participation, or integrations that were absent during assessment.',
      'Multiple reports can still share the same blind spots. Defense in depth needs narrow privileges, delay, monitoring, caps, safe defaults, and rehearsed response after launch.',
    ],
    faq: [
      { question: 'How many audits are enough?', answer: 'There is no universal count. Review depth should follow value at risk, novelty, complexity, upgradeability, and prior changes. Independent perspectives help, but scope and remediation matter more than logos.' },
      { question: 'Can users verify an audit without reading Solidity?', answer: 'Yes. They can compare addresses and versions, identify privileged roles, inspect unresolved findings, check monitoring and delays, and start with limited exposure.' },
    ],
    sources: [
      { title: 'OWASP Smart Contract Security Verification Standard', href: 'https://scs.owasp.org/SCSVS/' },
      { title: 'Ethereum smart-contract security guidance', href: 'https://ethereum.org/en/developers/docs/smart-contracts/security/' },
      { title: 'OpenZeppelin security guidance', href: 'https://docs.openzeppelin.com/contracts/5.x/api/utils#security' },
    ],
    related: [
      { label: 'How smart-contract audits work', to: '/articles/smart-contract-audit-process' },
      { label: 'Oracle manipulation defenses', to: '/articles/oracle-manipulation-attacks' },
      { label: 'DeFi exploit patterns', to: '/articles/defi-hacks-2024-2025-analysis' },
    ],
  },
  'smart-contract-fuzzing-guide': {
    title: 'Smart-contract fuzzing with Foundry and Echidna',
    answer: [
      'Smart-contract fuzzing repeatedly generates inputs and call sequences to break properties that should always hold. The valuable artifact is not a large input count; it is a precise invariant, a realistic stateful harness, and a minimized counterexample that developers can reproduce. Foundry integrates fuzz and invariant tests into Solidity workflows, while Echidna specializes in property-based, stateful exploration.',
      'Begin with asset conservation, solvency, authorization, share accounting, and state-machine rules. Give the fuzzer multiple adversarial actors and handler functions that construct valid operations. Then remove artificial assumptions that prevent it from reaching dangerous states.',
    ],
    threatModel: [
      'An attacker selects edge values, zero addresses, maximum integers, and unusual operation sequences.',
      'Several users interleave deposits, borrows, liquidations, transfers, claims, and administrative actions.',
      'A token reenters, charges fees, rebases, returns false, or uses nonstandard decimals.',
      'A narrow harness silently excludes the state or external behavior where the invariant fails.',
    ],
    mechanics: [
      'Stateless fuzzing varies parameters for one test and checks an assertion after each run. Stateful invariant testing generates sequences across a persistent deployment, making it better for accounting drift and cross-function failures. Handlers constrain random bytes into meaningful actions, track ghost variables, and select callers so exploration remains productive without assuming away attacks.',
      'Foundry shrinks failures and records sequences for replay. Echidna evaluates Solidity properties and can use coverage feedback to reach new states. Both need deterministic setup, bounded environmental models, and enough runs and depth to explore useful paths. A passing campaign only describes the tested harness and configuration.',
    ],
    developerChecklist: [
      'State each invariant independently of the current implementation so tests do not repeat the same bug.',
      'Use multiple actors, time changes, block changes, failures, callbacks, and realistic token mocks.',
      'Track expected accounting with simple ghost state and compare it with contract state.',
      'Avoid overusing assumptions; transform inputs into valid ranges and measure rejected calls.',
      'Persist seeds and minimized counterexamples in regression tests.',
      'Run short deterministic campaigns in CI and deeper campaigns on scheduled workers.',
    ],
    userChecklist: [
      'Look for published properties and harnesses rather than claims about a number of fuzz cases.',
      'Check whether testing is stateful and includes roles, upgrades, oracle changes, and odd tokens.',
      'Confirm failures become regression tests and campaigns run against the deployed release.',
      'Remember fuzzing finds counterexamples; it does not prove none exist.',
    ],
    verification: [
      'Introduce a known accounting or access-control defect and ensure the campaign finds it.',
      'Review coverage and call distributions to detect unreachable functions or one dominant action.',
      'Replay minimized sequences under the debugger and convert them into readable unit tests.',
      'Vary seeds, sequence depth, actors, and campaign duration; compare findings rather than one green run.',
      'Run against upgrade migrations and forked integrations where local mocks hide behavior.',
    ],
    limits: [
      'Random exploration struggles with checksums, signatures, deep state prerequisites, and precise economic conditions unless the harness supplies structure. Coverage is evidence of execution, not correctness.',
      'Use static analysis, symbolic execution, formal properties, manual review, and integration tests alongside fuzzing. Each technique exposes different blind spots.',
    ],
    faq: [
      { question: 'Should I use Foundry or Echidna?', answer: 'Use the tool your team will maintain. Foundry fits Solidity unit-test workflows; Echidna offers focused property campaigns. Important protocols often reuse the same invariants in both.' },
      { question: 'How long should fuzzing run?', answer: 'CI should be fast and reproducible, while scheduled campaigns can be deeper. Stop based on risk, stable coverage, and diminishing new behavior—not an arbitrary case count.' },
    ],
    sources: [
      { title: 'Foundry invariant testing reference', href: 'https://www.getfoundry.sh/guides/invariant-testing' },
      { title: 'Echidna documentation and source', href: 'https://github.com/crytic/echidna' },
      { title: 'Trail of Bits secure-contract testing guidance', href: 'https://secure-contracts.com/program-analysis/echidna/index.html' },
    ],
    related: [
      { label: 'Formal verification guide', to: '/articles/formal-verification-smart-contracts' },
      { label: 'Reentrancy testing and prevention', to: '/articles/reentrancy-attack-prevention' },
      { label: 'Audit preparation', to: '/articles/smart-contract-audit-process' },
    ],
  },
  'smart-contract-audit-process': {
    title: 'The smart-contract audit process',
    answer: [
      'A smart-contract audit is an independent, time-bounded review of a defined code revision and its stated assumptions. A good process maps the system first, identifies assets and trust boundaries, reviews code and tests adversarially, reports reproducible findings, verifies fixes, and checks the production deployment. It reduces uncertainty; it never guarantees that a protocol cannot fail.',
      'Preparation determines review quality. Freeze features before the engagement, document architecture and privileges, remove known test failures, provide deployment scripts, and specify the invariants that protect user funds. Every day an auditor spends reconstructing basic intent is a day not spent challenging it.',
    ],
    threatModel: [
      'Untrusted callers combine public functions, callbacks, transaction ordering, and temporary liquidity.',
      'Owners, guardians, and governance use privileges unexpectedly or lose their signing path.',
      'External tokens, bridges, oracles, and protocols deviate from integration assumptions.',
      'Deployment, initialization, proxy, or remediation changes differ from the reviewed code.',
    ],
    mechanics: [
      'Scoping inventories contracts, lines, dependencies, excluded components, review goals, and the exact commit. Reviewers build an architecture and privilege model, run automated checks, trace state changes manually, test hypotheses, and communicate uncertain design questions early. A finding should include impact, likelihood conditions, evidence, and an actionable remediation.',
      'After developers fix issues, reviewers examine the patch and retest the original proof of concept. Production verification then compares bytecode, constructor or initializer parameters, proxy slots, roles, and timelocks. This last step closes the gap between a reviewed repository and the system that actually holds assets.',
    ],
    developerChecklist: [
      'Freeze the review commit and maintain a short change log for any unavoidable modifications.',
      'Provide diagrams, specifications, roles, assumptions, known risks, and supported token behavior.',
      'Make the build deterministic and run linting, tests, coverage, static analysis, and fuzzing first.',
      'Include deployment, initialization, upgrade, oracle, keeper, and emergency-control code in scope.',
      'Answer reviewer questions quickly and preserve design decisions in the final documentation.',
      'Track every finding through fixed, acknowledged, disputed, or accepted status with evidence.',
    ],
    userChecklist: [
      'Read scope, date, commit, exclusions, limitations, and remediation status before the executive summary.',
      'Confirm deployed implementations correspond to the reviewed artifacts.',
      'Identify changes since review and whether they received differential assessment.',
      'Evaluate operational controls, monitoring, caps, delays, and response—not only source code.',
    ],
    verification: [
      'Reproduce high-severity proofs of concept in an isolated test and confirm fixes make them fail safely.',
      'Review remediation diffs for new behavior rather than accepting a changed line count.',
      'Build release artifacts from the pinned commit with locked toolchain versions.',
      'Compare runtime bytecode and proxy implementation slots with published deployment records.',
      'Rehearse privileged actions and emergency procedures using the actual signer and timelock workflow.',
    ],
    limits: [
      'An audit sees a snapshot. New integrations, governance decisions, dependency upgrades, market conditions, and operational compromise can invalidate assumptions immediately afterward.',
      'The report is one control in a lifecycle that also needs secure design, tests, least privilege, disclosure handling, monitoring, and incident response.',
    ],
    faq: [
      { question: 'When is a protocol ready for audit?', answer: 'When core behavior and interfaces are stable, documentation matches code, the test suite is clean, and the team can explain invariants and privileges. Auditing a moving target creates gaps.' },
      { question: 'Should fixes receive another review?', answer: 'Yes. At minimum, reviewers should verify the remediation diff and rerun the exploit or property. Broad redesigns may require a new scope.' },
    ],
    sources: [
      { title: 'OWASP Smart Contract Security Verification Standard', href: 'https://scs.owasp.org/SCSVS/' },
      { title: 'Ethereum smart-contract security', href: 'https://ethereum.org/en/developers/docs/smart-contracts/security/' },
      { title: 'Trail of Bits secure-contract development guidance', href: 'https://secure-contracts.com/' },
    ],
    related: [
      { label: 'DeFi audit checklist', to: '/articles/defi-smart-contract-audit-checklist' },
      { label: 'Smart-contract fuzzing', to: '/articles/smart-contract-fuzzing-guide' },
      { label: 'Solidity security engineering', to: '/articles/solidity-security-best-practices' },
    ],
  },
  'layer-2-security-considerations': {
    title: 'Layer 2 security considerations',
    answer: [
      'Using an Ethereum layer 2 adds security assumptions beyond holding assets on Ethereum itself. Users depend on bridge contracts, rollup proofs, data availability, sequencer behavior, upgrade keys, and a working escape path. “Settles on Ethereum” does not mean every rollup has identical protections or that withdrawals are always immediate.',
      'Before depositing, identify the canonical bridge, proof system and challenge model, upgrade delay, data location, sequencer-failure behavior, and whether users can force transactions or exit without the operator. Keep exposure proportional to the maturity and transparency of those controls.',
    ],
    threatModel: [
      'A faulty or compromised bridge accepts an invalid withdrawal or locks valid deposits.',
      'A sequencer censors, reorders, or temporarily stops transactions and users cannot force inclusion.',
      'An upgrade authority changes verification or bridge logic before users can exit.',
      'Transaction data is unavailable, preventing independent reconstruction of rollup state.',
    ],
    mechanics: [
      'Optimistic rollups post commitments and depend on a dispute window in which invalid state can be challenged. Validity rollups publish commitments plus proofs intended to show correct state transitions. Both still depend on implementation correctness, bridge logic, data availability, and governance. Proof type is only one part of the system.',
      'A sequencer offers fast ordering but may be unavailable or censor users. Robust designs expose a path to submit through layer 1 and a documented escape mechanism. Upgradeable contracts add a separate control plane: the length and enforceability of delays determine whether users can react before security assumptions change.',
    ],
    developerChecklist: [
      'Document proof, data-availability, sequencing, upgrade, bridge, and emergency assumptions separately.',
      'Make forced inclusion and escape paths testable, monitored, and understandable to users.',
      'Use delays and independent authorization for security-critical upgrades and parameter changes.',
      'Test message replay, aliasing, failed relays, reorgs, withdrawal finality, and gas differences.',
      'Publish canonical contract addresses and defend documentation and frontend distribution.',
      'Rehearse sequencer outage, prover failure, compromised keys, and safe communication.',
    ],
    userChecklist: [
      'Use the canonical bridge address from independently verified official documentation.',
      'Understand withdrawal finality and keep layer-1 gas for an emergency path where applicable.',
      'Check current upgrade controls and stage or risk disclosures rather than relying on a network label.',
      'Avoid treating bridged representations and native assets as having identical issuer and recovery risk.',
    ],
    verification: [
      'Verify bridge and rollup contracts on a block explorer and compare them with official records.',
      'Test a small deposit and withdrawal, including the full finality or challenge period.',
      'Inspect whether upgrades are delayed, who can execute them, and whether an emergency bypass exists.',
      'Confirm state data is published where independent nodes can reconstruct it.',
      'Review operator-outage documentation and validate the force-transaction path before an incident.',
    ],
    limits: [
      'Risk changes as systems upgrade and decentralize. A guide cannot replace checking the live implementation, current governance, active proof system, and incident status at the time of a transfer.',
      'Layer-1 settlement does not protect against user phishing, malicious tokens, dapp bugs, compromised devices, or economic losses inside the rollup.',
    ],
    faq: [
      { question: 'Are validity rollups always safer than optimistic rollups?', answer: 'No. Proofs change the correctness model, but bridge code, data availability, upgrades, implementation bugs, operations, and escape mechanisms remain relevant.' },
      { question: 'Can I always withdraw through Ethereum if the sequencer stops?', answer: 'Only if the specific design has a functioning, accessible force-inclusion or escape path. Verify the live contracts and instructions before depending on it.' },
    ],
    sources: [
      { title: 'Ethereum rollup documentation', href: 'https://ethereum.org/en/developers/docs/scaling/' },
      { title: 'Optimism fault-proof documentation', href: 'https://docs.optimism.io/op-stack/fault-proofs/explainer' },
      { title: 'Arbitrum rollup protocol documentation', href: 'https://docs.arbitrum.io/how-arbitrum-works/inside-arbitrum-nitro' },
    ],
    related: [
      { label: 'Bridge security risks', to: '/articles/bridge-security-risks' },
      { label: 'RPC endpoint security', to: '/articles/rpc-endpoint-security' },
      { label: 'Hardware-wallet verification checklist', to: '/articles/best-hardware-wallet-2025' },
    ],
  },
  'erc20-token-vulnerabilities': {
    title: 'ERC-20 token vulnerabilities and integration risks',
    answer: [
      'Most ERC-20 failures come from assuming every token behaves like a simple reference implementation. Integrators must handle missing or false return values, fee-on-transfer and rebasing behavior, unusual decimals, approvals, callbacks in extended standards, privileged minting or freezing, and upgradeability. Token authors should prefer a reviewed implementation and add only necessary behavior.',
      'Solidity 0.8 made checked arithmetic the default for many operations, reducing accidental wraparound outside explicitly unchecked blocks. It did not solve allowance races, broken accounting assumptions, role compromise, unsafe hooks, or integrations that credit the requested amount instead of the amount actually received.',
    ],
    threatModel: [
      'A token returns false, no value, or adversarial data while the caller assumes success.',
      'Transfer fees, rebases, blacklists, pauses, or decimals break protocol accounting.',
      'An owner, minter, upgrader, or sanctions role changes balances or transfer behavior.',
      'Users sign broad allowances that a compromised spender later drains.',
    ],
    mechanics: [
      'ERC-20 defines core methods and events but deployed tokens vary. Some legacy contracts do not return a boolean; others deliberately deduct fees or adjust balances globally. Safe integrations measure pre- and post-transfer balances where appropriate, use wrappers that tolerate return-value variants, and explicitly reject unsupported token classes.',
      'The approval model lets a spender pull funds up to an allowance. Changing a nonzero allowance can be exposed to ordering races, while unlimited approvals increase future blast radius. Permit-style signatures improve usability but add domain separation, nonce, expiry, chain, and phishing concerns that must be tested.',
    ],
    developerChecklist: [
      'Use a maintained ERC-20 implementation and SafeERC20-style wrappers for external tokens.',
      'Document whether fee-on-transfer, rebasing, callback, pausable, blacklist, and upgradeable tokens are supported.',
      'Credit actual received value when accounting requires it; test decimals and rounding explicitly.',
      'Apply least privilege to mint, burn, pause, freeze, rescue, and upgrade roles.',
      'Protect permits with correct nonces, deadlines, domain separators, and replay tests across chains.',
      'Test zero values, maximum values, self-transfers, failed transfers, and malicious token callbacks.',
    ],
    userChecklist: [
      'Review allowances and grant only the amount and duration needed when the wallet supports it.',
      'Check verified source, proxy implementation, supply controls, blacklist powers, and ownership.',
      'Treat a familiar ticker or logo as untrusted; verify the contract address independently.',
      'Revoke obsolete approvals, understanding that revocation cannot recover prior transfers.',
    ],
    verification: [
      'Run conformance tests against the exact implementation and compiler settings.',
      'Integrate mocks for no return, false return, transfer fee, rebase, callback, pause, and blacklist behavior.',
      'Fuzz total-supply and balance-conservation properties, including mint and burn permissions.',
      'Check storage layouts and initialization for upgradeable deployments.',
      'Compare deployed runtime bytecode, roles, supply, and proxy slots with release records.',
    ],
    limits: [
      'Conformance to ERC-20 does not establish economic quality, collateral value, redeemability, issuer solvency, or safe governance. Those are separate questions.',
      'Wrappers can normalize return handling but cannot make a malicious or privileged token safe. Explicit allowlists and exposure caps may still be necessary.',
    ],
    faq: [
      { question: 'Is approve-to-zero required?', answer: 'The ERC notes clients may set allowance to zero before a new value to reduce ordering risk, but contracts must not enforce that UI pattern. Increment/decrement methods or scoped approvals can improve workflows.' },
      { question: 'Are unlimited approvals always unsafe?', answer: 'They trade repeated transactions for persistent exposure. A later spender compromise can use the remaining allowance, so scope and revoke them deliberately.' },
    ],
    sources: [
      { title: 'ERC-20 token standard', href: 'https://eips.ethereum.org/EIPS/eip-20' },
      { title: 'OpenZeppelin ERC-20 documentation', href: 'https://docs.openzeppelin.com/contracts/5.x/erc20' },
      { title: 'ERC-2612 permit extension', href: 'https://eips.ethereum.org/EIPS/eip-2612' },
    ],
    related: [
      { label: 'Solidity security practices', to: '/articles/solidity-security-best-practices' },
      { label: 'Token-approval revocation guide', to: '/articles/revoke-token-approvals-guide' },
      { label: 'DeFi audit checklist', to: '/articles/defi-smart-contract-audit-checklist' },
    ],
  },
  'flash-loan-attacks-explained': {
    title: 'Flash-loan attacks explained',
    answer: [
      'A flash loan is not the vulnerability. It gives an attacker large temporary capital that must be borrowed and repaid within one transaction. The exploit succeeds when a protocol trusts a manipulable price, calculates shares incorrectly, exposes unsafe governance, or violates an accounting invariant. Defend the underlying assumption rather than trying to identify flash-loan funds.',
      'Design every public operation as if any caller can temporarily control deep liquidity and compose many protocols atomically. Use robust price sources, conservative bounds, invariant checks, and circuit breakers that fail safely during abnormal markets.',
    ],
    threatModel: [
      'An attacker borrows temporary liquidity and distorts a thin spot market used as an oracle.',
      'Several swaps, deposits, donations, borrows, liquidations, and repayments occur atomically.',
      'Share or collateral calculations use a transient balance or manipulable exchange rate.',
      'A governance snapshot or vote counts instantly borrowed voting power.',
    ],
    mechanics: [
      'The lender transfers assets to a receiver contract, calls it, and checks repayment plus a fee before the transaction ends. If repayment fails, the whole transaction reverts. Inside that callback the receiver may trade, manipulate a dependent market, trigger a vulnerable calculation, extract value, unwind trades, and repay.',
      'Atomicity reduces capital and inventory risk for the attacker, but the same exploit logic may work with owned or borrowed capital over multiple blocks. Blocking known lenders or requiring an externally owned account is ineffective and harms legitimate composability.',
    ],
    developerChecklist: [
      'Do not use a single pool spot balance as a price for lending, minting, or liquidation.',
      'Validate freshness, liquidity, deviation, decimals, sign, and failure behavior for price inputs.',
      'Base share accounting on explicit state and test first-depositor, donation, and rounding attacks.',
      'Use time-weighted or independently aggregated signals only after analyzing their manipulation cost and lag.',
      'Delay governance power or take snapshots before proposal execution can benefit.',
      'Add exposure caps, rate limits, pauses, and monitoring that respond to broken invariants.',
    ],
    userChecklist: [
      'Identify which prices and external pools determine collateral and liquidations.',
      'Check whether one transaction can both acquire influence and extract protocol assets.',
      'Prefer transparent caps, oracle fallbacks, monitoring, and delayed governance changes.',
      'Treat high yield in a thin or highly reflexive market as economic risk, not free return.',
    ],
    verification: [
      'Fork realistic liquidity and simulate the maximum profitable distortion, including fees and slippage.',
      'Fuzz transaction sequences around deposits, donations, loans, liquidations, and redemptions.',
      'Test stale, unavailable, zero, negative, and sharply deviating oracle data.',
      'Assert solvency and conservation after every handler action, not only at transaction completion.',
      'Model governance and rate-limit windows across blocks rather than only single calls.',
    ],
    limits: [
      'A TWAP is not automatically safe: a long window adds lag while a short window may be cheap to manipulate. Security depends on liquidity, market structure, update rules, and what happens during outages.',
      'Circuit breakers can reduce losses but introduce availability and privileged-control risks. Their triggers and recovery paths need independent testing.',
    ],
    faq: [
      { question: 'Can a contract detect a flash loan?', answer: 'Not reliably in a general composable system, and detection does not repair the vulnerable assumption. Secure the price, accounting, authorization, or governance rule directly.' },
      { question: 'Should protocols ban contract callers?', answer: 'No. It is bypassable, conflicts with smart wallets, and does not stop capitalized attackers. Explicit invariants are the durable defense.' },
    ],
    sources: [
      { title: 'Aave flash-loan documentation', href: 'https://aave.com/docs/aave-v3/guides/flash-loans' },
      { title: 'OWASP price-oracle manipulation guidance', href: 'https://scs.owasp.org/SCWE/SCSVS-ORACLE/SCWE-028/' },
      { title: 'Uniswap v2 oracle design', href: 'https://docs.uniswap.org/contracts/v2/concepts/core-concepts/oracles' },
    ],
    related: [
      { label: 'Oracle manipulation attacks', to: '/articles/oracle-manipulation-attacks' },
      { label: 'DAO governance attacks', to: '/articles/dao-governance-attacks' },
      { label: 'DeFi exploit patterns', to: '/articles/defi-hacks-2024-2025-analysis' },
    ],
  },
  'account-abstraction-security': {
    title: 'Account abstraction security',
    answer: [
      'ERC-4337 smart accounts can improve security with recovery, batching, spending policies, sponsorship, and multiple authenticators. They also move critical checks into account code and add bundlers, EntryPoint contracts, paymasters, factories, modules, and upgrade controls. Security depends on the complete UserOperation validation and execution path—not the wallet interface alone.',
      'Users should understand who can install modules, change owners, sponsor transactions, or upgrade the account. Developers must bind signatures to the chain, account, nonce, operation, and validity window; separate validation from execution; and ensure recovery cannot silently bypass the normal authorization threshold.',
    ],
    threatModel: [
      'A malicious dapp requests a UserOperation that installs a module or transfers authority.',
      'A signature, session key, or paymaster authorization is replayed outside its intended scope.',
      'Bundlers censor operations or expose them to ordering and denial-of-service behavior.',
      'Recovery guardians, factories, plugins, or upgrade admins become alternate takeover paths.',
    ],
    mechanics: [
      'Under ERC-4337, users sign a UserOperation for an account. Bundlers collect operations and call a canonical EntryPoint, which asks each account to validate and then executes accepted operations. A paymaster may sponsor gas after separate validation. Nonces, deposits, simulation, and validation rules limit replay and denial of service.',
      'The standard provides infrastructure, not one wallet policy. Account implementations decide signature schemes, owners, modules, session keys, recovery, and upgrades. A bug in any of these can authorize a structurally valid operation. Factories and counterfactual deployment add initialization and address-derivation risks.',
    ],
    developerChecklist: [
      'Bind authorization to chain ID, EntryPoint, account, complete call intent, nonce, and validity window.',
      'Use separate nonce domains where parallel policies need them and test replay across chains and upgrades.',
      'Restrict module installation, delegatecall, fallback handlers, owner changes, and upgrade entry points.',
      'Make initialization atomic and prevent factories or observers from claiming an undeployed account.',
      'Limit paymaster exposure with quotas, expiry, caller and target policy, and withdrawal controls.',
      'Test recovery delays, guardian replacement, cancellation, compromise, and loss scenarios.',
    ],
    userChecklist: [
      'Read the wallet display for calls, assets, module changes, spending limits, and expiry before signing.',
      'Know whether the account is upgradeable and which entity controls upgrades and recovery.',
      'Review active session keys and plugins, and remove permissions that are no longer needed.',
      'Keep an independently tested recovery method; sponsorship does not remove the need for chain access.',
    ],
    verification: [
      'Test altered calldata, target, value, chain, nonce, deadline, signature mode, and EntryPoint.',
      'Simulate validation and execution failures through a real bundler-compatible environment.',
      'Fuzz module combinations and assert that no plugin can cross its stated permission boundary.',
      'Verify deterministic addresses, initialization calldata, proxy slots, and implementation code.',
      'Run recovery and emergency-upgrade drills with production-equivalent guardians and delays.',
    ],
    limits: [
      'Smart accounts cannot make malicious transaction intent safe. Rich policies are only useful if the signing interface explains them and the user can revoke them.',
      'Bundler and paymaster diversity can improve availability, but specific wallets may still depend on centralized infrastructure. Document fallback behavior before outages.',
    ],
    faq: [
      { question: 'Can a bundler steal funds?', answer: 'A correct account should reject unauthorized operations regardless of bundler. Bundlers can still censor, delay, reorder, or refuse service, and implementation bugs may make malformed operations dangerous.' },
      { question: 'Are session keys safer than the main key?', answer: 'They can reduce blast radius only when target, function, value, rate, chain, and expiry limits are enforced onchain and revocation works.' },
    ],
    sources: [
      { title: 'ERC-4337 account abstraction specification', href: 'https://eips.ethereum.org/EIPS/eip-4337' },
      { title: 'Ethereum account-abstraction documentation', href: 'https://ethereum.org/en/roadmap/account-abstraction/' },
      { title: 'OpenZeppelin community account modules', href: 'https://docs.openzeppelin.com/community-contracts/account-modules' },
    ],
    related: [
      { label: 'EIP-7702 wallet delegation', to: '/articles/eip-7702-wallet-delegation-security' },
      { label: 'Clear-signing guide', to: '/articles/clear-signing-erc-7730-guide' },
      { label: 'Wallet approval security', to: '/articles/revoke-token-approvals-guide' },
    ],
  },
  'impermanent-loss-risks': {
    title: 'Impermanent loss and liquidity-provider risk',
    answer: [
      'Impermanent loss is the shortfall between the value of assets held in an automated market maker position and the value of simply holding the same starting assets, before fees and other rewards. It grows when relative prices diverge. The word “impermanent” is misleading: withdrawing realizes the difference, and prices may never return.',
      'LP return must be evaluated after trading fees, incentives, gas, rebalancing, token price changes, adverse selection, smart-contract risk, oracle risk, and reward-token dilution. A high advertised APR does not show whether the position outperformed holding.',
    ],
    threatModel: [
      'Relative asset prices move sharply or one asset fails, depegs, or becomes illiquid.',
      'Arbitrageurs trade against stale pool prices, leaving LPs with the depreciating asset.',
      'Concentrated liquidity moves out of range and stops earning fees while retaining directional exposure.',
      'Incentives or fee estimates obscure losses measured against the correct hold benchmark.',
    ],
    mechanics: [
      'In a constant-product pool, arbitrage changes token reserves until the pool price approaches the external market. LPs therefore sell some of the outperforming asset and buy the underperforming one. For an equal-value constant-product position, the familiar divergence-loss relationship depends on the price ratio, but real positions also include fees and entry and exit costs.',
      'Concentrated-liquidity positions allocate capital over a chosen price range. They can earn more fees per unit of capital while in range, but require active range decisions and can become entirely one asset at an edge. Comparing only fee APR across ranges ignores this path dependence.',
    ],
    developerChecklist: [
      'Show returns against a clearly defined hold benchmark in the user’s chosen unit.',
      'Separate trading fees, token incentives, price PnL, gas, and divergence loss.',
      'Use manipulation-resistant valuation for deposits, withdrawals, and reward calculations.',
      'Warn about out-of-range positions, depeg scenarios, and one-sided exit exposure.',
      'Test rounding, initial liquidity, donations, fee accounting, and extreme price movement.',
      'Avoid annualizing a short, unusual fee window without prominent assumptions.',
    ],
    userChecklist: [
      'Model price-ratio scenarios, including one asset approaching zero, before depositing.',
      'Compare projected net return with holding, not with a zero-return baseline.',
      'Evaluate pool liquidity, volume quality, fee tier, range, incentives, and exit cost separately.',
      'Do not pair an asset with a “stable” token without analyzing issuer, reserve, and depeg risk.',
    ],
    verification: [
      'Record starting quantities and calculate the current hold benchmark from the same prices.',
      'Reconcile fees and rewards using onchain data rather than dashboard headline rates.',
      'Stress price ratios, volume decline, gas spikes, incentive expiry, and out-of-range time.',
      'Check pool contracts, fee tier, token addresses, and withdrawal route independently.',
      'For protocols, fuzz share accounting across deposits, swaps, fee growth, and withdrawals.',
    ],
    limits: [
      'The simple constant-product formula does not directly describe concentrated, weighted, stable-swap, dynamic-fee, or actively managed pools. Use the exact invariant and fee mechanics.',
      'Historical fees do not forecast future order flow. MEV, toxic flow, market volatility, and competing liquidity can change LP economics quickly.',
    ],
    faq: [
      { question: 'Do fees eliminate impermanent loss?', answer: 'Sometimes fees outweigh divergence loss, sometimes they do not. Net performance depends on the realized price path, volume, fee share, incentives, and costs.' },
      { question: 'Is a stablecoin pair safe from impermanent loss?', answer: 'No. Small divergence may be limited while pegs hold, but a depeg can concentrate the position in the failing asset and create severe loss.' },
    ],
    sources: [
      { title: 'Uniswap v2 whitepaper', href: 'https://uniswap.org/whitepaper.pdf' },
      { title: 'Uniswap v3 whitepaper', href: 'https://uniswap.org/whitepaper-v3.pdf' },
      { title: 'Uniswap liquidity-provider concepts', href: 'https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity' },
    ],
    related: [
      { label: 'Sandwich-attack prevention', to: '/articles/sandwich-attack-prevention' },
      { label: 'Oracle manipulation defenses', to: '/articles/oracle-manipulation-attacks' },
      { label: 'DeFi risk checklist', to: '/articles/defi-smart-contract-audit-checklist' },
    ],
  },
  'sandwich-attack-prevention': {
    title: 'Sandwich-attack prevention',
    answer: [
      'A sandwich attack occurs when an adversary observes a pending swap, trades before it to worsen the victim’s execution, then trades after it to capture part of the price movement. Users reduce exposure with tight slippage limits, small or split orders, liquid routes, limit or intent-based execution, and private submission paths that explicitly protect against harmful ordering.',
      'No setting guarantees protection. Private routing adds trust and availability assumptions, while excessively tight slippage can cause failed transactions in volatile markets. The goal is to cap acceptable execution and minimize information and ordering advantages.',
    ],
    threatModel: [
      'Searchers observe transaction details in a public mempool before inclusion.',
      'A builder, sequencer, or relay can order transactions around a visible swap.',
      'Loose minimum-output settings create room for value extraction.',
      'A thin pool or large price-impacting order makes the sandwich profitable after fees.',
    ],
    mechanics: [
      'The attacker’s first trade moves the pool price against the victim. The victim still executes because its minimum output permits the worse price. The attacker’s second trade reverses the initial position at the victim-influenced price. Profit depends on pool depth, victim size, allowed slippage, gas or builder payments, and competition.',
      'Price impact from the user’s own trade is distinct from slippage tolerance, which defines the worst acceptable result. Setting a high tolerance does not improve routing; it authorizes a wider loss. A deadline limits stale execution but does not itself stop ordering attacks.',
    ],
    developerChecklist: [
      'Require nonzero minimum output or maximum input and a meaningful deadline on every swap path.',
      'Estimate price impact separately from slippage and warn before materially adverse execution.',
      'Offer protected submission or batch and intent designs with documented trust and failure behavior.',
      'Avoid defaults that silently expand tolerance after a failed transaction.',
      'Simulate routes against current state and display asset addresses, route, fees, and expected output.',
      'Monitor execution quality against contemporaneous reference prices and investigate systematic loss.',
    ],
    userChecklist: [
      'Review minimum received, price impact, route, and deadline—not only the quoted output.',
      'Use the lowest practical tolerance and reconsider rather than repeatedly increasing it.',
      'Prefer deeper liquidity, smaller orders, or limit-style execution for price-sensitive trades.',
      'Understand whether “MEV protection” prevents public broadcast and what happens if submission fails.',
    ],
    verification: [
      'Decode calldata and confirm minimum output or maximum input matches the wallet display.',
      'Compare receipt output with the quoted and reference-market price at inclusion.',
      'Use a local fork to simulate front- and back-running around representative trade sizes.',
      'Test protected-order fallback paths to ensure they do not silently rebroadcast publicly.',
      'Measure failure rate and execution quality across volatility rather than optimizing one metric.',
    ],
    limits: [
      'Private submission can reduce public-mempool exposure but may reveal order flow to its operators and cannot remove all builder or sequencer trust. Review its privacy and fallback model.',
      'Splitting trades reduces per-order impact but adds fees and may leak a predictable pattern. Limit orders can also be exposed when triggered.',
    ],
    faq: [
      { question: 'Does setting slippage to zero stop sandwiches?', answer: 'It may make normal execution impossible because state changes between quote and inclusion. Use a tight, informed bound rather than an unusable absolute setting.' },
      { question: 'Is every bad fill a sandwich?', answer: 'No. Volatility, ordinary competition, stale quotes, transfer-tax tokens, routing, and the user’s own price impact can also produce poor execution. Inspect ordering and traces.' },
    ],
    sources: [
      { title: 'Ethereum MEV documentation', href: 'https://ethereum.org/en/developers/docs/mev/' },
      { title: 'Flashbots Protect documentation', href: 'https://docs.flashbots.net/flashbots-protect/overview' },
      { title: 'Uniswap trade execution concepts', href: 'https://developers.uniswap.org/docs/get-started/concepts/traders/swaps' },
    ],
    related: [
      { label: 'Impermanent-loss risks', to: '/articles/impermanent-loss-risks' },
      { label: 'RPC endpoint security', to: '/articles/rpc-endpoint-security' },
      { label: 'Hardware-wallet verification checklist', to: '/articles/best-hardware-wallet-2025' },
    ],
  },
  'reentrancy-attack-prevention': {
    title: 'Reentrancy-attack prevention',
    answer: [
      'Reentrancy happens when a contract makes an external call before restoring its invariants and the recipient calls back into the same system. Prevent it by designing state transitions so internal accounting is finalized before interaction, using a correctly scoped reentrancy guard where needed, preferring pull-based payments, and testing callbacks across every related entry point.',
      'The classic same-function withdrawal is only one form. Cross-function, cross-contract, read-only, and token-hook reentrancy can exploit shared state even when the original function is guarded. The invariant—not the function name—is the correct protection boundary.',
    ],
    threatModel: [
      'Any external call target, token, receiver hook, fallback, or callback behaves adversarially.',
      'A callback enters a different function that reads or mutates temporarily inconsistent state.',
      'Another protocol reads an intermediate price or balance during a callback.',
      'An upgrade adds a new entry point outside the original guard or changes call ordering.',
    ],
    mechanics: [
      'EVM calls transfer control. If contract A sends value or calls token or protocol B, B can execute arbitrary code and call A again before A resumes. When A updates a balance after that call, the nested invocation may observe the old balance and withdraw or borrow repeatedly.',
      'Checks-effects-interactions validates inputs, commits all internal effects, and only then interacts externally. A mutex rejects nested guarded entry. Neither is automatic: state shared across functions must be updated together, and a guard on one function does not protect an unguarded sibling or an external read used elsewhere.',
    ],
    developerChecklist: [
      'Inventory every external call, including token hooks, safe transfers, callbacks, and native-value sends.',
      'Write the invariant that must hold at each interaction boundary and commit effects first.',
      'Apply guards across all entry points sharing sensitive state, not only the obvious withdrawal.',
      'Use pull payments and bounded failure handling instead of pushing funds through arbitrary receivers.',
      'Avoid relying on transfer gas stipends or EOA-only checks as a security boundary.',
      'Review upgrade and module additions for new callbacks and shared-state paths.',
    ],
    userChecklist: [
      'Check whether the system handles callback-capable tokens and integrations explicitly.',
      'Look for invariant and malicious-receiver tests, not only a ReentrancyGuard import.',
      'Review emergency pause and withdrawal design for situations where an external receiver reverts.',
      'Treat unaudited integrations as part of the protocol’s attack surface.',
    ],
    verification: [
      'Build malicious receivers that reenter every reachable function at each external-call site.',
      'Assert conservation and solvency during callbacks, not only after the outer call returns.',
      'Fuzz stateful sequences with several actors and callback-capable token mocks.',
      'Test read-only callbacks against spot prices, share values, and downstream consumers.',
      'Run static analysis, then manually inspect each reported and unreported external-call boundary.',
    ],
    limits: [
      'A mutex can block valid composition or create denial-of-service if scoped badly. It also cannot repair stale-state reads in other contracts or protect functions it does not cover.',
      'Checks-effects-interactions may be difficult when an external result is needed before final accounting. In that case, isolate the interaction and revalidate state and authority afterward.',
    ],
    faq: [
      { question: 'Does Solidity transfer prevent reentrancy?', answer: 'Do not depend on a fixed gas stipend. Gas costs and call patterns change, and token callbacks bypass that assumption. Use explicit state and authorization controls.' },
      { question: 'Can view functions be reentrant?', answer: 'A view cannot mutate its own state, but it can expose an inconsistent intermediate value that another protocol trusts during a callback. This is read-only reentrancy.' },
    ],
    sources: [
      { title: 'Solidity security considerations', href: 'https://docs.soliditylang.org/en/latest/security-considerations.html#reentrancy' },
      { title: 'OpenZeppelin ReentrancyGuard documentation', href: 'https://docs.openzeppelin.com/contracts/5.x/api/utils#ReentrancyGuard' },
      { title: 'OWASP reentrancy guidance', href: 'https://scs.owasp.org/SCWE/SCSVS-CODE/SCWE-046/' },
    ],
    related: [
      { label: 'Solidity security practices', to: '/articles/solidity-security-best-practices' },
      { label: 'Smart-contract fuzzing', to: '/articles/smart-contract-fuzzing-guide' },
      { label: 'Audit process', to: '/articles/smart-contract-audit-process' },
    ],
  },
  'frontend-attack-vectors': {
    title: 'Frontend attack vectors in Web3',
    answer: [
      'A secure smart contract does not protect users when its official frontend, domain, dependencies, analytics, deployment credentials, or wallet-connection flow is compromised. A hostile interface can substitute addresses, change calldata, request approvals, or route users to a counterfeit site while the contract remains unchanged.',
      'Treat the web delivery pipeline as part of the transaction-signing boundary. Protect registrar, DNS, source control, CI, hosting, package publication, content management, and administrator sessions with phishing-resistant authentication, least privilege, reviewed releases, and independent monitoring.',
    ],
    threatModel: [
      'An attacker takes over a domain, DNS account, hosting project, CI token, or maintainer session.',
      'A compromised dependency or tag injects wallet-draining code during build or runtime.',
      'Third-party scripts, support widgets, analytics, or content systems gain same-origin execution.',
      'The interface displays benign intent while constructing different calldata or recipient addresses.',
    ],
    mechanics: [
      'Browsers execute the code delivered for the current origin. TLS protects transport to the domain but cannot help when the registrar, DNS, CDN, hosting account, or valid release pipeline has been taken over. Wallet confirmation is the final independent checkpoint only if it decodes the true action clearly.',
      'Modern frontends also inherit transitive dependencies and build hooks. A malicious package can steal environment secrets or alter artifacts, while a compromised runtime script can target connected wallets selectively. Reproducible builds and content-security policy reduce risk but do not replace privileged-account security.',
    ],
    developerChecklist: [
      'Use hardware-backed phishing-resistant MFA for registrar, DNS, source, CI, hosting, and package accounts.',
      'Separate roles, require reviewed production changes, and rotate narrowly scoped deployment credentials.',
      'Pin dependencies and actions, review lockfile changes, restrict install scripts, and preserve build provenance.',
      'Minimize third-party scripts and enforce a tested Content Security Policy and integrity where applicable.',
      'Publish contract addresses through multiple independent channels and make transactions human-readable.',
      'Monitor DNS, certificates, releases, bundles, approval destinations, and unexpected wallet requests.',
    ],
    userChecklist: [
      'Open dapps from a saved verified address, not ads, direct messages, or search-result lookalikes.',
      'Verify wallet-displayed target, action, assets, amount, permission, and chain before approval.',
      'Reject blind-signing or unexplained upgrade, permit, delegation, and approval requests.',
      'During an incident warning, stop interaction; disconnecting alone does not revoke onchain approvals.',
    ],
    verification: [
      'Build release artifacts in a clean environment and compare hashes with deployed assets.',
      'Test CSP in enforcement mode and inventory every origin with script or connection permission.',
      'Monitor Certificate Transparency and authoritative DNS records from independent networks.',
      'Exercise domain, CI, package, and cloud-account recovery without relying on the compromised channel.',
      'Simulate malicious address substitution and confirm wallet displays and transaction policy expose it.',
    ],
    limits: [
      'Decentralized hosting does not secure DNS, release signing, mutable pointers, browser extensions, or the local device. Every resolution and update layer needs a threat model.',
      'Transaction simulation may miss state changes, private order flow, unsupported calls, or a compromised simulator. It is supporting evidence, not authorization.',
    ],
    faq: [
      { question: 'Does HTTPS prove a dapp is legitimate?', answer: 'No. HTTPS proves control of a certificate for the visited domain. A lookalike domain or compromised official account can still serve malicious code over valid HTTPS.' },
      { question: 'Does disconnecting a wallet stop a drainer?', answer: 'It stops that page from requesting new interactions locally, but existing approvals and signatures may remain usable. Review and revoke them onchain from a trusted interface.' },
    ],
    sources: [
      { title: 'CISA phishing-resistant MFA guidance', href: 'https://www.cisa.gov/resources-tools/resources/implementing-phishing-resistant-mfa' },
      { title: 'OWASP Content Security Policy cheat sheet', href: 'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html' },
      { title: 'ICANN domain registration protection guide', href: 'https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/sac-044-en.pdf' },
    ],
    related: [
      { label: 'DNS security for dapps', to: '/articles/dns-domain-security-web3-dapps' },
      { label: 'NPM supply-chain attacks', to: '/articles/npm-supply-chain-attacks-crypto' },
      { label: 'Clear-signing guide', to: '/articles/clear-signing-erc-7730-guide' },
    ],
  },
  'blockchain-forensics-basics': {
    title: 'Blockchain forensics basics',
    answer: [
      'Blockchain forensics traces transactions and develops evidence about control, flow, and exposure; it does not identify a person merely because addresses are connected. Investigators combine public-ledger records with exchange records, device evidence, communications, network data, and legal process. Asset recovery is possible in some cases but never guaranteed.',
      'Victims should act quickly: preserve wallet addresses, transaction hashes, timestamps, screenshots, messages, domains, and device logs; report through the relevant law-enforcement and exchange channels; and avoid “recovery” agents who demand seed phrases or upfront crypto.',
    ],
    threatModel: [
      'An attacker moves funds through many addresses, swaps, bridges, services, and chains.',
      'Address clustering creates false attribution when shared infrastructure or contracts are misunderstood.',
      'Evidence is altered, lost, publicly disclosed too early, or collected without a defensible chain of custody.',
      'Scammers impersonate investigators or exchanges and victimize the original target again.',
    ],
    mechanics: [
      'Investigators follow transaction inputs, outputs, logs, token transfers, contract calls, and cross-chain messages. Heuristics may group addresses based on common control signals, but smart contracts, exchanges, batching, mixers, bridges, and account abstraction complicate interpretation. Each analytic conclusion needs a confidence level and alternative explanation.',
      'Attribution usually comes from offchain evidence: an exchange may connect a deposit address to an account; a seized device may contain keys; infrastructure records may link a service; or communications may prove control. Legal authority, jurisdiction, and provider retention determine which records can be obtained.',
    ],
    developerChecklist: [
      'Log security-relevant administrative actions without storing secrets or unnecessary personal data.',
      'Maintain contract, deployment, signer, bridge, and service-provider records with reliable timestamps.',
      'Prepare an incident evidence form for addresses, hashes, block numbers, domains, and communications.',
      'Preserve original records read-only and hash exported evidence before analysis.',
      'Separate observations from inference and record the basis and confidence for every attribution.',
      'Establish lawful escalation contacts with exchanges, issuers, infrastructure providers, and authorities.',
    ],
    userChecklist: [
      'Do not delete messages, reinstall devices, or continue using a possibly compromised wallet.',
      'Record transaction hashes and addresses as text, not only screenshots.',
      'Use official reporting paths and independently verify anyone claiming they can freeze or recover funds.',
      'Never provide a seed phrase, private key, remote access, or advance “unlock” payment.',
    ],
    verification: [
      'Confirm hashes and addresses on more than one independent node or explorer.',
      'Decode contract calls and distinguish transfers from approvals, mints, burns, and internal accounting.',
      'Validate bridge events on both origin and destination chains before asserting continuity.',
      'Document heuristic uncertainty and seek corroborating offchain evidence for attribution.',
      'Preserve tool versions, queries, exports, timestamps, and evidence hashes for reproducibility.',
    ],
    limits: [
      'Public ledgers can show movement without showing beneficial ownership. Privacy systems, offchain transfers, centralized ledgers, and cross-chain activity can reduce visibility or break a trace.',
      'Freezing and recovery require control by an issuer, custodian, protocol, or authority and depend on timing and law. An analyst cannot reverse a final transaction.',
    ],
    faq: [
      { question: 'Can stolen crypto always be traced?', answer: 'Transactions may remain visible, but linking flows across services and to a person can be difficult or impossible. Visibility is not the same as attribution or recovery.' },
      { question: 'Should I confront the suspected attacker?', answer: 'Usually no. Preserve evidence and coordinate with qualified counsel or authorities. Contact can alert the attacker, create safety risk, or disrupt lawful requests.' },
    ],
    sources: [
      { title: 'FBI Internet Crime Complaint Center', href: 'https://www.ic3.gov/' },
      { title: 'FinCEN advisory on illicit convertible virtual currency activity', href: 'https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2019-a003' },
      { title: 'FATF virtual-asset red-flag indicators', href: 'https://www.fatf-gafi.org/en/publications/Methodsandtrends/Virtual-assets-red-flag-indicators.html' },
    ],
    related: [
      { label: 'Crypto incident-response playbook', to: '/articles/crypto-hack-response-playbook' },
      { label: 'Wallet compromise response', to: '/articles/crypto-hack-response-playbook' },
      { label: 'Support-scam defense', to: '/articles/coinbase-data-theft-support-scam-defense' },
    ],
  },
  'npm-supply-chain-attacks-crypto': {
    title: 'NPM supply-chain attacks against crypto applications',
    answer: [
      'NPM supply-chain attacks compromise a package, maintainer, dependency, registry token, build step, or copied code so malicious logic enters a trusted application. Crypto frontends are especially sensitive because injected code can replace transaction destinations, request approvals, or steal secrets. Lockfiles help reproducibility but do not prove a selected version is safe.',
      'Reduce risk with minimal dependencies, reviewed lockfile changes, pinned CI actions, restricted lifecycle scripts, phishing-resistant maintainer authentication, short-lived publication credentials, provenance, isolated builds, secret separation, and runtime controls that make malicious transactions visible.',
    ],
    threatModel: [
      'A maintainer account or automation token publishes a malicious version.',
      'Typosquatting, dependency confusion, or an unreviewed new package enters the graph.',
      'Install or build scripts steal environment variables or modify generated artifacts.',
      'A transitive dependency changes behavior without direct application-code review.',
    ],
    mechanics: [
      'Package managers resolve a graph from manifests, registries, and lockfiles, then may execute lifecycle scripts with developer or CI permissions. A malicious package can act during installation or ship code that runs in the browser or server. Semver ranges and automated updates can spread a compromised release quickly.',
      'Provenance can connect a package publication to a source workflow, while signatures and hashes protect integrity. These controls answer where an artifact came from, not whether its source is benign. Review, isolation, least privilege, and behavior-level transaction protections remain necessary.',
    ],
    developerChecklist: [
      'Remove unnecessary packages and evaluate maintainer, ownership, release, and dependency changes.',
      'Use clean installs from committed lockfiles and review every lockfile diff.',
      'Disable or allowlist lifecycle scripts where feasible; isolate builds from production secrets.',
      'Use trusted publishing or short-lived scoped tokens with phishing-resistant maintainer MFA.',
      'Generate an SBOM, monitor advisories, and define an emergency dependency replacement path.',
      'Pin CI actions and toolchains, preserve provenance, and compare release artifacts with clean rebuilds.',
    ],
    userChecklist: [
      'Verify transaction intent on the wallet, because a compromised frontend can look normal.',
      'Avoid blind signing and broad approvals, especially immediately after an unexplained interface update.',
      'Use bookmarked official domains and pause when the project reports a release or frontend incident.',
      'Revoke affected approvals from a trusted interface after confirming the incident scope.',
    ],
    verification: [
      'Inventory direct and transitive dependencies, versions, scripts, maintainers, and registry sources.',
      'Rebuild in an isolated environment without secrets and compare output hashes.',
      'Inspect newly introduced minified code, network destinations, wallet methods, and dynamic loaders.',
      'Test whether CI tokens can publish, alter releases, or access unrelated repositories.',
      'Practice yanking or overriding a package and rebuilding a known-good release under time pressure.',
    ],
    limits: [
      'Vulnerability scanners mainly match known advisories and suspicious patterns. They can miss a targeted, newly compromised package or malicious but syntactically ordinary behavior.',
      'Vendoring code can reduce registry availability risk but transfers patching and review responsibility to the project. It is not automatically safer.',
    ],
    faq: [
      { question: 'Does npm audit prevent supply-chain attacks?', answer: 'No. It reports known advisories for resolved dependencies. It does not establish maintainer integrity, inspect every build behavior, or guarantee a new release is benign.' },
      { question: 'Should teams pin every version?', answer: 'Applications should commit and enforce lockfiles. Pinning improves reproducibility, but teams still need a deliberate, tested process to receive security updates.' },
    ],
    sources: [
      { title: 'npm package provenance documentation', href: 'https://docs.npmjs.com/generating-provenance-statements' },
      { title: 'npm trusted publishing documentation', href: 'https://docs.npmjs.com/trusted-publishers' },
      { title: 'CISA software bill of materials resources', href: 'https://www.cisa.gov/sbom' },
    ],
    related: [
      { label: 'Frontend attack vectors', to: '/articles/frontend-attack-vectors' },
      { label: 'Dapp domain security', to: '/articles/dns-domain-security-web3-dapps' },
      { label: 'Infostealer response', to: '/articles/browser-wallet-infostealer-malware-response' },
    ],
  },
  'rpc-endpoint-security': {
    title: 'RPC endpoint security',
    answer: [
      'An RPC endpoint is a trust, privacy, and availability boundary. A provider sees IP addresses and query patterns, can return stale or false data, omit pending transactions, censor submissions, or become unavailable. Signing locally prevents the provider from learning the private key, but it does not guarantee truthful chain data or successful broadcast.',
      'Use authenticated and rate-limited endpoints, restrict dangerous node APIs, verify chain identity, compare security-critical reads across independent providers or a local node, protect transport, and monitor lag and divergence. Public production endpoints should never expose administrative, wallet, debug, or unrestricted tracing methods.',
    ],
    threatModel: [
      'An untrusted or compromised provider lies about balances, nonces, fee data, receipts, or contract state.',
      'Observers correlate IP addresses and request patterns with wallet addresses and activity.',
      'Attackers exhaust unauthenticated methods or exploit exposed node administration APIs.',
      'A single provider outage or censorship policy prevents reads or transaction submission.',
    ],
    mechanics: [
      'Ethereum JSON-RPC exposes methods for chain queries and transaction submission. Applications commonly trust one endpoint for chain ID, block head, eth_call results, gas estimation, logs, and receipts. TLS protects traffic in transit, but the endpoint still chooses its response and learns the queries.',
      'A local execution client can independently verify state under its sync assumptions. Multiple remote providers reduce single-provider failure but can share infrastructure or correlated software. Quorum checks are most useful for high-consequence reads, with explicit handling for normal head lag and reorganization.',
    ],
    developerChecklist: [
      'Expose only required methods through an authenticated proxy with quotas, size limits, and timeouts.',
      'Keep admin, personal, wallet, debug, and broad trace namespaces off public interfaces.',
      'Validate chain ID, block freshness, finality requirements, and response shape before use.',
      'Use independent fallback providers and define safe behavior when their answers diverge.',
      'Sign locally, protect logs from addresses or raw transactions, and minimize retained query data.',
      'Monitor latency, errors, block lag, peer health, censorship indicators, and provider failover.',
    ],
    userChecklist: [
      'Use wallet endpoints from known sources; an arbitrary custom RPC can observe and mislead.',
      'Verify the chain and contract address when adding a network manually.',
      'Broadcast through an alternative endpoint if a transaction disappears, without signing conflicting intent blindly.',
      'For high-value verification, compare a second provider or independently operated node.',
    ],
    verification: [
      'Scan the exposed namespace from outside the trusted network and confirm admin methods are blocked.',
      'Compare finalized block hashes and critical eth_call results across independent clients or providers.',
      'Test stale heads, malformed results, rate limits, timeouts, reorgs, and provider outage behavior.',
      'Verify TLS names and proxy routing; reject silent fallback to cleartext or the wrong network.',
      'Review logs, analytics, and support tooling for unnecessary wallet and IP correlation.',
    ],
    limits: [
      'Provider diversity is not full independence when services share cloud regions, client implementations, upstream nodes, or policy. Document correlated dependencies.',
      'Running a node improves verification and privacy control but adds patching, resource, peer, backup, and monitoring responsibility. Misconfigured local RPC remains dangerous.',
    ],
    faq: [
      { question: 'Can an RPC provider steal my private key?', answer: 'A correctly designed wallet signs locally and never sends the key. A provider can still manipulate data or submission, and a malicious wallet or remote signer is a separate risk.' },
      { question: 'Does a VPN make RPC private?', answer: 'It hides the original IP from the RPC provider but transfers that network visibility to the VPN and does not hide queried addresses or fix false responses.' },
    ],
    sources: [
      { title: 'Ethereum JSON-RPC documentation', href: 'https://ethereum.org/developers/docs/apis/json-rpc/' },
      { title: 'EIP-1474 remote procedure call specification', href: 'https://eips.ethereum.org/EIPS/eip-1474' },
      { title: 'Geth HTTP server security guidance', href: 'https://geth.ethereum.org/docs/interacting-with-geth/rpc' },
    ],
    related: [
      { label: 'Layer 2 security', to: '/articles/layer-2-security-considerations' },
      { label: 'Sandwich-attack prevention', to: '/articles/sandwich-attack-prevention' },
      { label: 'Blockchain privacy practices', to: '/articles/privacy-security-web3-opsec' },
    ],
  },
  'oracle-manipulation-attacks': {
    title: 'Oracle manipulation attacks',
    answer: [
      'Oracle manipulation occurs when a protocol accepts a price or external value that an attacker can distort, delay, or selectively withhold, then uses it for minting, borrowing, liquidation, settlement, or accounting. Secure designs validate source quality, liquidity, freshness, decimals, bounds, sequencer status, and failure behavior—and limit loss if every check still fails.',
      'No brand name or TWAP period is universally safe. The oracle must be evaluated against the protected value, market depth, update rules, manipulation cost, correlated dependencies, and how quickly genuine prices can move.',
    ],
    threatModel: [
      'Temporary capital moves a thin source market enough to profit from a dependent protocol.',
      'A feed is stale, paused, returns an invalid value, or resumes after downtime with unsafe timing.',
      'Decimal, quote direction, wrapper, or unit mistakes create a large but apparently valid price.',
      'Governance or privileged actors replace an aggregator, threshold, or source maliciously.',
    ],
    mechanics: [
      'Spot oracles expose the current state of one venue and may be changed within a transaction. Time-weighted prices average observations over a window, increasing manipulation cost but adding lag. Aggregated feeds collect observations under their own node, market, heartbeat, and deviation assumptions. Each is a different trust model.',
      'Consumers often fail at integration: they ignore timestamps, use the wrong decimals, invert a pair, trust an unsupported asset route, or continue after sequencer downtime. A safe consumer checks all response fields, applies explicit freshness and deviation policy, and enters a conservative state when data is unavailable.',
    ],
    developerChecklist: [
      'Document source venues, aggregation, update triggers, heartbeat, decimals, quote direction, and admin controls.',
      'Reject stale, zero, negative, incomplete, out-of-range, and inconsistent values.',
      'Check layer-2 sequencer status and a recovery grace period where the feed design requires it.',
      'Avoid circular pricing where collateral and its oracle depend on the same fragile liquidity.',
      'Use caps, conservative collateral factors, withdrawal limits, and pauses to bound oracle failure.',
      'Monitor feed age, deviations, source liquidity, configuration changes, and fallback activation.',
    ],
    userChecklist: [
      'Identify the exact feed or pool used for each collateral and liability.',
      'Check whether the source stays liquid during stress and how quickly it updates.',
      'Understand what happens when the feed stops: pause, last price, fallback, or unrestricted operation.',
      'Treat admin-controlled source changes and weak delays as material protocol risk.',
    ],
    verification: [
      'Fork live liquidity and simulate manipulation costs against maximum extractable protocol value.',
      'Test stale, missing, negative, zero, extreme, wrong-decimal, and inverted responses.',
      'Model genuine rapid price moves to ensure deviation checks do not create unsafe stale pricing.',
      'Verify feed addresses and configuration separately for every chain and market.',
      'Exercise fallback and recovery after sequencer or oracle downtime with production timing.',
    ],
    limits: [
      'More sources can add resilience but also correlated infrastructure, governance, or market dependencies. Medianization cannot make uniformly bad inputs correct.',
      'Fallbacks may disagree exactly during stress. The protocol needs a defined conservative outcome rather than an arbitrary source order.',
    ],
    faq: [
      { question: 'Is a Chainlink feed automatically safe?', answer: 'No oracle is automatic. Consumers must use the correct feed, validate timestamps and values, understand update parameters, and bound consequences for the specific market.' },
      { question: 'How long should a TWAP window be?', answer: 'There is no universal duration. Longer windows cost more to manipulate but respond more slowly. Model liquidity, volatility, block production, and protected value.' },
    ],
    sources: [
      { title: 'Chainlink data-feed API reference', href: 'https://docs.chain.link/data-feeds/api-reference' },
      { title: 'Uniswap v2 oracle documentation', href: 'https://developers.uniswap.org/docs/protocols/v2/concepts/oracles' },
      { title: 'OWASP oracle manipulation weakness', href: 'https://scs.owasp.org/SCWE/SCSVS-ORACLE/SCWE-028/' },
    ],
    related: [
      { label: 'Flash-loan attacks', to: '/articles/flash-loan-attacks-explained' },
      { label: 'DeFi audit checklist', to: '/articles/defi-smart-contract-audit-checklist' },
      { label: 'DeFi exploit patterns', to: '/articles/defi-hacks-2024-2025-analysis' },
    ],
  },
  'dao-governance-attacks': {
    title: 'DAO governance attacks',
    answer: [
      'A DAO governance attack obtains or abuses enough proposal, voting, execution, or administrative power to make the system perform a harmful but procedurally valid action. Defenses must cover the whole lifecycle: eligibility, delegation, snapshots, quorum, proposal content, voting delay and period, timelock, cancellation, execution, upgrades, and emergency powers.',
      'Do not let voting power acquired in the same transaction create and execute an asset-moving proposal. Use historical checkpoints, meaningful delay, proposal thresholds, timelocked execution, constrained executors, and monitoring that gives participants time to inspect exact calldata.',
    ],
    threatModel: [
      'Borrowed or purchased voting power satisfies a snapshot, quorum, or proposal threshold.',
      'A superficially benign proposal contains malicious calldata, delegatecall, or upgrade behavior.',
      'Delegates, multisigs, guardians, or timelock roles are compromised or collude.',
      'Low participation lets a concentrated minority pass high-impact changes.',
    ],
    mechanics: [
      'Token governance typically records voting-power checkpoints and reads a past block or timestamp to prevent balance changes during voting. A governor counts votes and queues successful proposals into a timelock. The timelock delays execution and may restrict which address can propose, execute, or cancel operations.',
      'These components are only as safe as their configuration. An immediate snapshot may include transient power; a short voting window reduces review; an open executor can be intentional but changes operational assumptions; and a guardian able to upgrade or bypass delay may dominate token voting.',
    ],
    developerChecklist: [
      'Use historical voting-power checkpoints and prevent same-transaction acquisition and execution.',
      'Set proposal, quorum, voting, and delay parameters from adversarial participation scenarios.',
      'Decode and publish every target, value, signature, calldata field, and expected state change.',
      'Place treasury and upgrade actions behind an enforceable timelock with monitored roles.',
      'Constrain emergency powers by scope, duration, transparency, and independent authorization.',
      'Test cancellation, duplicate operations, nonce or salt collisions, role loss, and timelock recovery.',
    ],
    userChecklist: [
      'Review executable calldata rather than relying on a title, forum summary, or delegate statement.',
      'Check delegation concentration, quorum history, treasury exposure, and privileged bypass roles.',
      'Monitor both proposal creation and queued execution; the final payload may be the decisive artifact.',
      'Know how much time exists to exit or organize after a proposal succeeds.',
    ],
    verification: [
      'Simulate proposal execution on a fork and compare balances, implementations, roles, and parameters.',
      'Test vote checkpoints against transfers, delegation changes, flash borrowing, and timestamp boundaries.',
      'Enumerate timelock proposer, executor, canceller, and admin roles from live chain state.',
      'Assert that upgrades and treasury transfers cannot bypass the documented delay.',
      'Run governance incident drills covering malicious proposal, key compromise, and lost quorum.',
    ],
    limits: [
      'Long delays improve reaction time but slow urgent fixes. Guardians speed response but create concentrated power. The trade-off should be explicit, limited, and observable.',
      'Governance cannot force token holders to participate or understand code. Delegation and specialist review help but introduce their own accountability and concentration risks.',
    ],
    faq: [
      { question: 'Do snapshots stop flash-loan voting?', answer: 'Historical checkpoints prevent power acquired after the chosen time from counting, but weak timing, lending markets, delegated power, or multi-block borrowing can still matter.' },
      { question: 'Is a timelock enough?', answer: 'No. It creates reaction time only if users monitor proposals, the delay cannot be bypassed, and there is a meaningful response such as cancellation or exit.' },
    ],
    sources: [
      { title: 'OpenZeppelin governance documentation', href: 'https://docs.openzeppelin.com/contracts/5.x/governance' },
      { title: 'OpenZeppelin TimelockController documentation', href: 'https://docs.openzeppelin.com/contracts/5.x/api/governance#TimelockController' },
      { title: 'ERC-5805 voting with delegation', href: 'https://eips.ethereum.org/EIPS/eip-5805' },
    ],
    related: [
      { label: 'Flash-loan attacks', to: '/articles/flash-loan-attacks-explained' },
      { label: 'Multisignature wallet setup', to: '/articles/multi-signature-wallet-setup' },
      { label: 'DeFi audit checklist', to: '/articles/defi-smart-contract-audit-checklist' },
    ],
  },
  'bridge-security-risks': {
    title: 'Cross-chain bridge security risks',
    answer: [
      'A bridge does not move the same asset between chains; it locks, burns, escrows, or observes value on one system and causes a representation or release on another. Security depends on message verification, validator or proof assumptions, replay protection, contract upgrades, key management, rate limits, token accounting, and every connected chain.',
      'Users should prefer the canonical route for the destination, verify contracts independently, test with a small amount, understand finality and withdrawal delays, and avoid leaving more value bridged than needed. “Trustless” is not a substitute for reading the actual verification and upgrade model.',
    ],
    threatModel: [
      'Validators, signers, light clients, relayers, or proof systems accept a forged message.',
      'A message is replayed, delivered twice, executed out of order, or interpreted on the wrong chain.',
      'Bridge contracts or upgrade keys are compromised and release escrowed assets.',
      'A connected chain reorganizes, halts, or has weaker finality than the bridge assumes.',
    ],
    mechanics: [
      'Lock-and-mint bridges escrow an asset and mint a representation elsewhere; burn-and-release reverses that path. Liquidity networks may instead rebalance pools. The destination must decide that a source event is final and authentic, using multisignatures, external validators, light clients, optimistic challenge, or validity proofs.',
      'Wrapped supply should correspond to backing or a defined issuer promise. Failure can occur in message parsing, signature thresholds, validator rotation, proof verification, decimal conversion, replay domains, token behavior, or privileged upgrades. A secure core cannot compensate for an unsafe remote chain.',
    ],
    developerChecklist: [
      'Bind messages to source and destination chain, bridge, nonce, sender, recipient, asset, amount, and version.',
      'Enforce one-time execution and safe ordering; test duplicates, reorgs, delays, and partial failure.',
      'Use independent, hardware-protected authorization with delayed signer and implementation changes.',
      'Cap flow and exposure by asset and period; pause safely when backing or messages diverge.',
      'Account for decimals, fees, fee-on-transfer, rebasing, blacklist, and nonstandard return behavior.',
      'Monitor backing, wrapped supply, queued messages, validator changes, upgrades, and abnormal velocity.',
    ],
    userChecklist: [
      'Confirm both source and destination contract addresses through official independent channels.',
      'Understand whether the received token is canonical, third-party wrapped, or liquidity-issued.',
      'Check expected finality, challenge, fee, and recovery behavior before transferring.',
      'Send a small test and verify receipt before a larger transfer; a test does not guarantee future safety.',
    ],
    verification: [
      'Trace a message end to end and validate every domain, nonce, event, proof, and execution check.',
      'Fuzz malformed messages, duplicate delivery, wrong-chain proofs, signature sets, and decimal boundaries.',
      'Reconcile locked backing and issued supply across all supported routes and assets.',
      'Inspect live validator thresholds, upgrade roles, delays, pause rights, and emergency withdrawal paths.',
      'Run chain halt, deep reorg, signer compromise, relayer outage, and destination failure exercises.',
    ],
    limits: [
      'Canonical bridges can reduce ambiguity but may inherit rollup governance and upgrade risks. Third-party bridges may offer faster liquidity while introducing additional counterparties and representations.',
      'Rate limits bound velocity, not all loss, and pauses can trap legitimate users. Recovery and communication plans matter as much as the trigger.',
    ],
    faq: [
      { question: 'Are proof-based bridges trustless?', answer: 'Proofs reduce some external-validator trust, but users still depend on verifier correctness, source consensus and data, contracts, upgrades, operations, and destination-chain behavior.' },
      { question: 'Why can a bridged token lose its peg?', answer: 'Its value depends on redeemability, backing, bridge solvency, liquidity, issuer controls, and confidence. A failure in any of these can separate it from the source asset.' },
    ],
    sources: [
      { title: 'Ethereum bridge documentation', href: 'https://ethereum.org/en/developers/docs/bridges/' },
      { title: 'Optimism standard bridge specification', href: 'https://specs.optimism.io/protocol/bridges.html' },
      { title: 'ERC-5164 cross-chain execution interface', href: 'https://eips.ethereum.org/EIPS/eip-5164' },
    ],
    related: [
      { label: 'Layer 2 security', to: '/articles/layer-2-security-considerations' },
      { label: 'Blockchain forensics basics', to: '/articles/blockchain-forensics-basics' },
      { label: 'DeFi exploit patterns', to: '/articles/defi-hacks-2024-2025-analysis' },
    ],
  },
  'solidity-security-best-practices': {
    title: 'Solidity security engineering',
    answer: [
      'Secure Solidity comes from explicit invariants, minimal privilege, simple state transitions, safe external interactions, reproducible builds, adversarial testing, controlled deployment, monitoring, and incident readiness. No modifier, library, audit, or static analyzer is sufficient alone. Design the system so one bug, key, oracle, or dependency cannot immediately lose all assets.',
      'Start with a written asset and authority model. Prefer well-reviewed libraries, pin the compiler and dependencies, keep contracts small, validate every trust boundary, and make dangerous administrative actions delayed, observable, and reversible where possible.',
    ],
    threatModel: [
      'Attackers choose calls, values, order, callbacks, temporary liquidity, and unusual token behavior.',
      'Privileged keys are compromised, misused, or lost; upgrade logic changes trusted assumptions.',
      'Oracles, bridges, keepers, sequencers, and integrated protocols fail or return adversarial data.',
      'Deployment parameters, proxy initialization, or operational configuration differ from tested code.',
    ],
    mechanics: [
      'Contracts expose public state transitions on a shared adversarial machine. Transactions are ordered by block builders or sequencers, calls can transfer control, arithmetic and rounding affect value, and all permanent data is observable. Access checks protect roles, not intent; an authorized call can still be harmful.',
      'Security engineering layers prevention and containment. Checks-effects-interactions and guards protect callbacks; pull patterns isolate recipients; oracle validation protects external data; caps and delays limit blast radius; invariants and fuzzing challenge accounting; monitoring detects drift; rehearsed response handles residual failure.',
    ],
    developerChecklist: [
      'Specify asset conservation, solvency, authorization, accounting, and state-machine invariants.',
      'Use maintained libraries and exact compiler and dependency versions; review all custom assembly.',
      'Apply least privilege, two-step role transfer, multisignature control, and delays for critical changes.',
      'Validate external return values and oracle freshness; expect reverts, callbacks, and nonstandard tokens.',
      'Protect initialization, storage layouts, implementation contracts, and upgrade authorization.',
      'Combine unit, integration, fuzz, invariant, static, symbolic, and independent review.',
    ],
    userChecklist: [
      'Inspect verified source, implementation address, owner roles, upgrade delay, pause powers, and caps.',
      'Check that the deployed release matches reviewed code and that recent changes received assessment.',
      'Understand oracle, token, bridge, and keeper dependencies before depositing.',
      'Use limited approvals and exposure; audits reduce risk but do not transfer it away.',
    ],
    verification: [
      'Build deterministically and compare runtime bytecode, constructor or initializer inputs, and libraries.',
      'Fuzz invariants with multiple actors, callbacks, time changes, odd tokens, and boundary values.',
      'Run static analyzers and manually triage every result and critical path.',
      'Test upgrades from every supported version and verify storage compatibility and reinitialization blocks.',
      'Exercise pause, unpause, role rotation, oracle failure, cap activation, and safe recovery on a fork.',
    ],
    limits: [
      'Onchain correctness cannot secure compromised frontends, signers, governance participants, dependencies, or flawed economic incentives. Include them in the system threat model.',
      'Immutability removes upgrade-key risk but also removes in-place repair. Upgradeability enables response while adding storage, initialization, governance, and key risk.',
    ],
    faq: [
      { question: 'Is the latest Solidity compiler always safest?', answer: 'Use a supported release and review its known bugs and breaking changes. Pin the chosen version and test the exact optimizer and EVM settings used for deployment.' },
      { question: 'Should every contract be pausable?', answer: 'No. Pause logic adds privilege and complexity. Use it when a clearly defined emergency state can reduce harm without trapping users unnecessarily, and test recovery.' },
    ],
    sources: [
      { title: 'Solidity security considerations', href: 'https://docs.soliditylang.org/en/latest/security-considerations.html' },
      { title: 'OpenZeppelin Contracts documentation', href: 'https://docs.openzeppelin.com/contracts/5.x/' },
      { title: 'OWASP Smart Contract Security Verification Standard', href: 'https://scs.owasp.org/SCSVS/' },
    ],
    related: [
      { label: 'Reentrancy prevention', to: '/articles/reentrancy-attack-prevention' },
      { label: 'Smart-contract audit process', to: '/articles/smart-contract-audit-process' },
      { label: 'Formal verification', to: '/articles/formal-verification-smart-contracts' },
    ],
  },
  'defi-hacks-2024-2025-analysis': {
    title: 'DeFi exploit patterns from 2024–2025',
    answer: [
      'The useful lesson from 2024–2025 DeFi incidents is not a loss leaderboard. Recurring failure classes were compromised or overpowered keys, unsafe upgrades and initialization, oracle and accounting manipulation, bridge or cross-chain verification flaws, reentrancy and callback mistakes, and compromised interfaces or dependencies. Teams should turn each class into a concrete invariant, control, monitor, and response exercise.',
      'Incident names and totals age quickly and can be disputed. Durable prevention comes from asking how assets leave, which authority can change the rules, which external data is trusted, and how much damage one transaction or key can cause.',
    ],
    threatModel: [
      'A valid privileged signature performs a malicious upgrade, transfer, role change, or configuration.',
      'Temporary liquidity and transaction ordering break oracle, share, or liquidation assumptions.',
      'A bridge, callback, token, frontend, or dependency violates its expected behavior.',
      'Detection is late and emergency controls are untested, centralized, or unable to contain flow.',
    ],
    mechanics: [
      'Many exploits chain ordinary capabilities. An attacker obtains one role or misleading signature, installs or calls logic through an allowed path, moves value through a composable market, and exits across assets or chains. Code-level and operational failures therefore should not be analyzed separately.',
      'Postmortems are most valuable when they identify the violated invariant, prerequisite access, first malicious state change, extraction path, detection signal, containment action, and why existing tests or controls missed it. Copying an isolated patch without this causal chain often preserves the underlying weakness.',
    ],
    developerChecklist: [
      'Inventory every role, signer, module, upgrade path, oracle, bridge, token, keeper, and frontend dependency.',
      'Require independent authorization and delay for upgrades, treasury moves, and security-parameter changes.',
      'Define and monitor solvency, backing, supply, privilege, oracle-age, and outflow invariants.',
      'Test callbacks, temporary liquidity, donations, rounding, initialization, replay, and cross-chain domains.',
      'Cap exposure and velocity so detection and response have time to work.',
      'Practice containment, communications, evidence preservation, signer rotation, and safe restoration.',
    ],
    userChecklist: [
      'Evaluate current deployment controls and dependencies, not a protocol’s old audit count.',
      'Check whether upgrades and privileged transfers are delayed, visible, and independently authorized.',
      'Limit approvals and deposits when caps, monitoring, incident disclosures, or exit routes are weak.',
      'During an incident, rely on independently verified official channels and avoid rushed recovery links.',
    ],
    verification: [
      'Convert each relevant public incident into a regression test or explicit threat-model decision.',
      'Simulate one-key compromise and determine the maximum immediate loss before controls intervene.',
      'Fork production state to test oracle shock, bridge halt, liquidity exit, pause, and upgrade rollback.',
      'Alert on invariant deviation and privileged intent before execution where timelocks permit it.',
      'Reconcile deployed bytecode, roles, parameters, and monitoring after every release.',
    ],
    limits: [
      'Public reports are incomplete and differ in terminology, attribution, and loss accounting. This guide deliberately avoids treating aggregate figures as precise evidence.',
      'Past patterns guide testing but attackers adapt. Novel business logic and integrations deserve first-principles analysis rather than checklist compliance alone.',
    ],
    faq: [
      { question: 'Are most DeFi attacks smart-contract bugs?', answer: 'Not necessarily. Key compromise, malicious approvals, frontend and supply-chain compromise, governance, and configuration can use correct code to produce unauthorized outcomes.' },
      { question: 'What is the highest-value first control?', answer: 'Map assets and authorities, then reduce how much one transaction or credential can move. That makes prevention, detection, and response more effective together.' },
    ],
    sources: [
      { title: 'OWASP Smart Contract Top 10', href: 'https://scs.owasp.org/sctop10/' },
      { title: 'Ethereum smart-contract security guidance', href: 'https://ethereum.org/developers/docs/smart-contracts/security/' },
      { title: 'FBI cyber alerts', href: 'https://www.fbi.gov/investigate/cyber/alerts' },
    ],
    related: [
      { label: 'DeFi audit checklist', to: '/articles/defi-smart-contract-audit-checklist' },
      { label: 'Bridge security risks', to: '/articles/bridge-security-risks' },
      { label: 'Oracle manipulation', to: '/articles/oracle-manipulation-attacks' },
    ],
  },
};

const SourceLink = ({ source }: { source: Source }) => (
  <a className="text-primary underline underline-offset-4 hover:text-primary/80" href={source.href} target="_blank" rel="noopener noreferrer">
    {source.title}
  </a>
);

const Checklist = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-3 pl-6">
    {items.map((item) => <li key={item}>{item}</li>)}
  </ul>
);

const LegacyGuideContent = ({ guide }: { guide: LegacyGuide }) => (
  <div className="space-y-8">
    <section className="rounded-xl border border-border/60 bg-card/50 p-6">
      <h2 className="mb-4 text-2xl font-bold">The direct answer: {guide.title}</h2>
      {guide.answer.map((paragraph) => <p className="mb-4 last:mb-0" key={paragraph}>{paragraph}</p>)}
    </section>

    <section>
      <h2 className="mb-4 text-2xl font-bold">Threat model: what can go wrong?</h2>
      <Checklist items={guide.threatModel} />
    </section>

    <section>
      <h2 className="mb-4 text-2xl font-bold">How the failure mode works</h2>
      {guide.mechanics.map((paragraph) => <p className="mb-4 last:mb-0" key={paragraph}>{paragraph}</p>)}
    </section>

    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg bg-card/50 p-6">
        <h2 className="mb-4 text-2xl font-bold">Developer and protocol checklist</h2>
        <Checklist items={guide.developerChecklist} />
      </div>
      <div className="rounded-lg bg-card/50 p-6">
        <h2 className="mb-4 text-2xl font-bold">User and reviewer checklist</h2>
        <Checklist items={guide.userChecklist} />
      </div>
    </section>

    <section>
      <h2 className="mb-4 text-2xl font-bold">How to verify the controls</h2>
      <ol className="list-decimal space-y-3 pl-6">
        {guide.verification.map((item) => <li key={item}>{item}</li>)}
      </ol>
    </section>

    <section>
      <h2 className="mb-4 text-2xl font-bold">Limits and residual risk</h2>
      {guide.limits.map((paragraph) => <p className="mb-4 last:mb-0" key={paragraph}>{paragraph}</p>)}
    </section>

    <section>
      <h2 className="mb-4 text-2xl font-bold">Frequently asked questions</h2>
      <div className="space-y-5">
        {guide.faq.map((item) => (
          <div key={item.question}>
            <h3 className="mb-2 text-xl font-semibold">{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="rounded-xl border border-border/60 bg-card/50 p-6">
      <h2 className="mb-4 text-2xl font-bold">Primary references</h2>
      <ul className="list-disc space-y-2 pl-6">
        {guide.sources.map((source) => <li key={source.href}><SourceLink source={source} /></li>)}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        Verify live deployments and current documentation before acting; standards and implementations can change after publication.
      </p>
    </section>

    <section>
      <h2 className="mb-4 text-2xl font-bold">Continue the security review</h2>
      <ul className="list-disc space-y-2 pl-6">
        {guide.related.map((item) => <li key={item.to}><Link className="text-primary underline underline-offset-4" to={item.to}>{item.label}</Link></li>)}
      </ul>
    </section>
  </div>
);

const componentFor = (slug: string): React.FC => {
  const Component = () => <LegacyGuideContent guide={guides[slug]} />;
  return Component;
};

export const legacyProtocolContentMap: Record<string, React.FC> = Object.fromEntries(
  Object.keys(guides).map((slug) => [slug, componentFor(slug)]),
);
