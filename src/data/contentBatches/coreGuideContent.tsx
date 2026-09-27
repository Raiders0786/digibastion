import React from 'react';

export const coreGuideContentMap: Record<string, React.FC> = {
  'privacy-security-web3-opsec': () => (
    <div className="space-y-8">
      <section className="bg-card/50 border border-border/60 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">The short answer</h2>
        <p className="text-lg leading-relaxed">
          Web3 privacy is not a product you switch on. Public ledgers, wallet interfaces, RPC providers, exchanges,
          applications, and social accounts can each reveal a different part of your activity. Start with a threat
          model, separate activities only when that separation serves a real purpose, and protect the devices and
          accounts that can connect those identities.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">What can expose a wallet owner?</h2>
        <p className="mb-4">
          A blockchain address is pseudonymous, not automatically anonymous. Transfers, token balances, contract
          calls, governance votes, and timestamps are normally public. A regulated exchange may know which customer
          withdrew to an address; a public profile may post an address; and an application or RPC service may observe
          the network request that asked for an address's data. Those separate observations can be combined.
        </p>
        <p>
          Address separation can reduce casual linkage, but it is not a guarantee. Reusing funding sources, moving
          distinctive amounts at similar times, consolidating assets, signing public messages, or using the same
          browser profile can reconnect identities. Make claims about privacy conservatively and assume that public
          transactions may remain analyzable for years.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Build a threat model before choosing tools</h2>
        <p className="mb-4">
          The Electronic Frontier Foundation recommends identifying what you need to protect, from whom, and what
          happens if protection fails. A casual scammer, a stalker, a malicious insider, and a well-resourced targeted
          attacker require different controls. Document the assets at risk, the accounts and people who can reach
          them, the information already public, and the recovery paths that could be abused.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Assets:</strong> wallets, identity records, location, communications, and account-recovery data.</li>
          <li><strong>Likely links:</strong> exchange withdrawals, ENS names, public posts, RPC traffic, and shared devices.</li>
          <li><strong>Consequences:</strong> phishing, extortion, physical targeting, account takeover, or unwanted profiling.</li>
          <li><strong>Constraints:</strong> legal duties, tax records, team workflows, accessibility, and realistic maintenance.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">A practical compartmentalization plan</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-card/50 p-5 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Separate by risk, not theater</h3>
            <p>
              Keep long-term holdings away from everyday dApp activity. Use a low-value interaction wallet for new
              applications, and use a distinct organizational treasury workflow when several people are responsible.
              Do not move funds between compartments casually; every transfer can create a public link.
            </p>
          </div>
          <div className="bg-card/50 p-5 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Separate the surrounding accounts</h3>
            <p>
              Different wallet addresses offer little protection if the same public username, email recovery path,
              browser extensions, or compromised device ties them together. Use a password manager, phishing-resistant
              authentication where available, prompt software updates, and deliberate browser profiles.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Network privacy and wallet interfaces</h2>
        <p className="mb-4">
          Wallets commonly query remote infrastructure. A provider may be able to associate an IP address and request
          history with the blockchain addresses being viewed. Running trusted infrastructure can reduce reliance on a
          third party, but it adds maintenance and does not erase on-chain links. A VPN changes which network can see
          the destination, while moving trust to the VPN provider; it does not make public transactions anonymous.
        </p>
        <p>
          Privacy features are also evolving. Ethereum's published privacy roadmap describes work across private
          payments, reads, proving, identity, and user experience. Evaluate each tool's assumptions, maturity,
          jurisdictional implications, and failure modes instead of treating “privacy” as a universal safety label.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">A repeatable operating routine</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li>Inventory addresses, public identities, recovery accounts, devices, extensions, and RPC providers.</li>
          <li>Decide which links are acceptable and record why each compartment exists.</li>
          <li>Verify transaction destination, network, contract, permissions, and value before signing.</li>
          <li>Review token approvals, connected applications, account sessions, and public disclosures regularly.</li>
          <li>Keep lawful records privately, test recovery procedures, and revise the model after any exposure.</li>
        </ol>
      </section>

      <section className="bg-primary/10 border border-primary/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-3">The durable rule</h2>
        <p>
          Do not promise yourself perfect anonymity. Minimize unnecessary disclosure, make identity links intentional,
          harden the accounts that reveal those links, and keep enough accurate records to respond safely and meet your
          obligations. Privacy engineering works best as an ongoing risk process—not as a one-time tool purchase.
        </p>
      </section>
    </div>
  ),
};
