import type React from 'react';
import { Link } from 'react-router-dom';

const PasskeysCryptoAccountsContent = () => (
  <div className="space-y-8">
    <section>
      <h2 className="text-2xl font-bold mb-4">What is the difference?</h2>
      <p className="mb-4">
        A <strong>passkey</strong> is a FIDO credential that uses public-key cryptography and is bound to the site
        where it was created. A passkey can be stored on a phone or computer and may sync through a platform account,
        or it can be device-bound. A <strong>hardware security key</strong> is a separate physical authenticator that
        can hold device-bound FIDO credentials. An <strong>authenticator app</strong> usually generates a time-based
        one-time password (TOTP) that you type into the exchange after entering your password.
      </p>
      <p>
        These methods protect sign-in to an exchange, custodian, email account, or other online service. They do not
        protect a self-custody wallet if someone learns its seed phrase or persuades the owner to sign a malicious
        transaction. For that wider problem, start with the <Link className="text-primary underline" to="/articles/privacy-security-web3-opsec">Web3 OpSec guide</Link>.
      </p>
    </section>

    <section className="bg-card/50 border border-border/60 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">The short answer</h2>
      <p className="text-lg leading-relaxed">
        If a crypto service offers a well-implemented passkey or FIDO security-key option, prefer it over a typed
        authenticator-app code. FIDO authentication can stop a fake domain from reusing the authentication response,
        while an attacker can relay a TOTP code in real time. For a high-value account, register two independent FIDO
        authenticators and store the backup safely.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Passkey, security key, or authenticator app?</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-card/50 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-4 text-left">Method</th>
              <th className="p-4 text-left">Main strength</th>
              <th className="p-4 text-left">Main trade-off</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border/50">
              <td className="p-4 font-semibold">Synced passkey</td>
              <td className="p-4">Phishing-resistant sign-in with convenient use across supported devices.</td>
              <td className="p-4">Recovery and device availability depend partly on the account and sync fabric that protects it.</td>
            </tr>
            <tr className="border-t border-border/50">
              <td className="p-4 font-semibold">Hardware security key</td>
              <td className="p-4">Phishing-resistant credential held on a separate physical device.</td>
              <td className="p-4">It can be lost or unavailable, so a separately stored backup authenticator matters.</td>
            </tr>
            <tr className="border-t border-border/50">
              <td className="p-4 font-semibold">TOTP authenticator app</td>
              <td className="p-4">Broad service support and no reliance on SMS delivery.</td>
              <td className="p-4">The typed code is not phishing-resistant and can be captured and relayed.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        NIST SP 800-63B-4 says authenticators that require manual entry of an OTP are not phishing-resistant because
        the output is not bound to the specific authentication session. WebAuthn/FIDO2 provides verifier-name binding.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">A practical setup for a crypto exchange account</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li>
          <strong>Secure the email account first.</strong> Use a passkey or security key there too. Email recovery can
          undermine a strong exchange login if the service lets email reset authenticators.
        </li>
        <li>
          <strong>Enroll from the official service.</strong> Open a saved bookmark or the provider&apos;s official app;
          do not begin from an advertisement, message, or support call.
        </li>
        <li>
          <strong>Register two independent authenticators.</strong> For example, use a daily security key and a backup
          key kept in a separate secure location. If using synced passkeys, consider an additional device-bound key.
        </li>
        <li>
          <strong>Record recovery material offline.</strong> Store provider-issued recovery codes away from the logged-in
          devices. Do not keep the only copy in the email account that it can recover.
        </li>
        <li>
          <strong>Review fallback paths.</strong> Remove SMS or weaker fallback methods when the provider allows it;
          otherwise protect the mobile account and understand that fallback may remain the easiest route in.
        </li>
        <li>
          <strong>Test before relying on it.</strong> Sign out, verify that both authenticators work, and confirm that you
          understand the provider&apos;s lost-device process before moving substantial value onto the account.
        </li>
      </ol>
    </section>

    <section className="bg-primary/10 border border-primary/20 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-3">What passkeys do—and do not—solve</h2>
      <ul className="list-disc pl-6 space-y-3">
        <li>They prevent reuse of the FIDO credential on a lookalike domain.</li>
        <li>They remove a shared password secret from that particular authentication exchange.</li>
        <li>They do not prove that a withdrawal address or wallet transaction is safe.</li>
        <li>They do not stop an attacker who controls an already authenticated session or abuses account recovery.</li>
        <li>They cannot compensate for sharing a wallet seed phrase or private key.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Are synced passkeys less secure than security keys?</h2>
      <p className="mb-4">
        They have different risk and recovery properties. NIST describes synced authentication keys as exportable by
        design and device-bound hardware keys as capable of keeping key material non-exportable. Syncing can improve
        availability across devices, but it makes the security and recovery of the sync account important. A separate
        hardware key offers stronger isolation but creates a physical loss and availability problem.
      </p>
      <p>
        For many individuals, the safest usable arrangement is not an absolutist choice: use phishing-resistant sign-in
        routinely, add an independent backup, and protect every recovery path. Teams with formal custody requirements
        should choose authenticators based on their assurance, device-management, and recovery policies rather than the
        word “passkey” alone.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold mb-2">Is an authenticator app unsafe?</h3>
          <p>
            No. TOTP is generally a meaningful improvement over a password alone and can be preferable to SMS. Its
            limitation is that a convincing phishing page can ask for the current code and immediately relay it. See the
            broader <Link className="text-primary underline" to="/articles/2fa-crypto-security-guide">crypto 2FA guide</Link> for layered account controls.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Does a passkey use my fingerprint as the secret?</h3>
          <p>
            The local biometric or device PIN normally unlocks use of the cryptographic credential on the device; the
            biometric is not sent to the crypto service as the passkey. Exact implementation details depend on the platform.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Should the backup key stay on the same key ring?</h3>
          <p>
            No. That defeats much of the availability benefit. Keep it protected in a separate location and periodically
            confirm it remains registered and usable without exposing it to daily loss or theft.
          </p>
        </div>
      </div>
    </section>

    <section className="text-sm text-muted-foreground">
      <h2 className="text-xl font-bold text-foreground mb-3">Primary references</h2>
      <p>
        This guide is based on <a className="text-primary underline" href="https://pages.nist.gov/800-63-4/sp800-63b/authenticators/" target="_blank" rel="noopener noreferrer">NIST SP 800-63B-4</a> and the <a className="text-primary underline" href="https://fidoalliance.org/passkeys/" target="_blank" rel="noopener noreferrer">FIDO Alliance passkey overview</a>. Provider-specific enrollment, fallback, and recovery behavior should be verified with the provider before use.
      </p>
    </section>
  </div>
);

const AddressPoisoningContent = () => (
  <div className="space-y-8">
    <section>
      <h2 className="text-2xl font-bold mb-4">What is crypto address poisoning?</h2>
      <p className="mb-4">
        Address poisoning is a deception attack in which a criminal causes a lookalike address to appear in a victim&apos;s
        wallet activity. The attacker chooses an address that resembles a familiar recipient—often sharing visible
        characters at the beginning and end—and creates a transaction or token event involving the victim. Later, the
        victim copies the attacker&apos;s address from history and sends real assets to it.
      </p>
      <p>
        The April 2024 FBI warning also describes <strong>token impersonation</strong>: criminals create tokens that
        resemble established assets, then send them from lookalike addresses. The familiar token branding makes the
        activity appear more credible, but it does not make either the sender or the asset legitimate.
      </p>
    </section>

    <section className="bg-card/50 border border-border/60 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">The short answer</h2>
      <p className="text-lg leading-relaxed">
        Never use recent wallet activity as an address book. Retrieve the destination from a previously verified record
        or confirm the complete address through a separate trusted channel. For a token, verify the blockchain network
        and the contract address from the project&apos;s official documentation; a name, logo, symbol, balance, or transfer
        event can be imitated.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">How the attack reaches the wallet history</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li><strong>Observation:</strong> an attacker identifies an address and a recipient it has used.</li>
        <li><strong>Lookalike creation:</strong> the attacker generates an address with similar visible characters.</li>
        <li><strong>History placement:</strong> the attacker creates an on-chain event that causes the lookalike to appear near legitimate activity.</li>
        <li><strong>Human shortcut:</strong> the victim later copies from history or compares only the truncated prefix and suffix.</li>
        <li><strong>Irreversible send:</strong> the signed transaction goes to the attacker-controlled destination.</li>
      </ol>
      <p className="mt-4 text-sm text-muted-foreground">
        Wallets and explorers display activity differently. An unfamiliar zero-value transfer, token transfer, or token
        balance is not proof that the user initiated it or that the address is trusted.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">A safer recipient-verification workflow</h2>
      <div className="space-y-4">
        <div className="bg-card/50 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-2">1. Start from a trusted source</h3>
          <p>
            Use a saved, labeled address that was verified earlier, or obtain a fresh address from the recipient over an
            authenticated channel. Do not copy from a transaction list, unsolicited message, reply, or search result.
          </p>
        </div>
        <div className="bg-card/50 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-2">2. Confirm the network and complete destination</h3>
          <p>
            Check the selected chain and compare the full address, ideally on the signing device as well as the sending
            interface. A matching prefix and suffix is insufficient. For a new counterparty, confirm independently by
            voice, video, or another established channel.
          </p>
        </div>
        <div className="bg-card/50 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-2">3. Use a controlled first transfer when appropriate</h3>
          <p>
            A small test limits the immediate amount at risk, but it does not validate an address by itself. Have the
            intended recipient confirm receipt through the trusted channel before reusing the exact verified address.
          </p>
        </div>
        <div className="bg-card/50 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-2">4. Save the verified destination deliberately</h3>
          <p>
            Add a meaningful address-book label and, where supported, an allowlist or withdrawal delay. Treat any later
            request to change the destination as a new verification event.
          </p>
        </div>
      </div>
    </section>

    <section className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-3">Do not interact with an unsolicited token to “remove” it</h2>
      <p>
        A token appearing in a wallet does not require approval, sale, or transfer. Following a URL in its name or trying
        to redeem it can lead to a malicious site or transaction. Hide unsolicited assets in the wallet interface when
        possible, and investigate by contract address without connecting or signing. If you already approved an unknown
        spender, follow the containment steps in the <Link className="text-primary underline" to="/articles/operation-atlantic-approval-phishing-2026">approval-phishing guide</Link>.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">How do I identify an impersonation token?</h2>
      <ul className="list-disc pl-6 space-y-3">
        <li><strong>Check the contract, not the label.</strong> ERC-20 names and symbols are not unique security identifiers.</li>
        <li><strong>Confirm the chain.</strong> A legitimate project may use different contracts on different networks.</li>
        <li><strong>Use the project&apos;s official records.</strong> Reach documentation from a known domain, then compare its published contract address with the asset in a block explorer.</li>
        <li><strong>Do not trust apparent holders or transfers.</strong> ethereum.org notes that a malicious contract can assign balances to legitimate addresses and emit misleading transfer events.</li>
        <li><strong>Treat explorer warnings as useful, not complete.</strong> A suspicious label is strong reason to stop, but no label is not proof of safety.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What if I already sent to the poisoned address?</h2>
      <p className="mb-4">
        Stop further transfers and preserve the transaction hash, sending and receiving addresses, network, asset,
        amount, time, screenshots, and the activity entry you copied. Contact any involved exchange or custodian through
        its official support channel and report the address to relevant platforms and law enforcement. Do not send a
        second payment to someone who claims it will unlock or reverse the first.
      </p>
      <p>
        If the mistake involved only a destination address, changing passwords does not reverse it. If you also connected
        to a suspicious site, disclosed credentials, or signed approvals, treat that as a separate compromise and secure
        the affected account or wallet immediately. The <Link className="text-primary underline" to="/articles/crypto-hack-response-playbook">crypto incident-response playbook</Link> can help structure containment.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold mb-2">Can an attacker change an address already copied to my clipboard?</h3>
          <p>
            Clipboard-replacement malware is a separate risk with the same outcome. Always compare the destination shown
            by the signing device with the independently verified record, even when the source itself was trusted.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Does a successful test transaction make future transfers safe?</h3>
          <p>
            Only if the intended recipient independently confirms receipt and the exact verified address is reused. Copying
            a new entry from history for the larger transfer reintroduces the poisoning risk.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Can a scam token have the same symbol as a real token?</h3>
          <p>
            Yes. The symbol and name can be duplicated. The contract address on the correct network is the essential
            identifier, and the contract&apos;s behavior still deserves review before interaction.
          </p>
        </div>
      </div>
    </section>

    <section className="text-sm text-muted-foreground">
      <h2 className="text-xl font-bold text-foreground mb-3">Primary references</h2>
      <p>
        The attack description follows the FBI&apos;s <a className="text-primary underline" href="https://www.fbi.gov/contact-us/field-offices/denver/news/fbi-warns-of-cryptocurrency-token-impersonation-scam" target="_blank" rel="noopener noreferrer">2024 token-impersonation warning</a>. Token-verification limitations are grounded in ethereum.org&apos;s <a className="text-primary underline" href="https://ethereum.org/guides/how-to-id-scam-tokens/" target="_blank" rel="noopener noreferrer">scam-token guide</a> and <a className="text-primary underline" href="https://ethereum.org/security/" target="_blank" rel="noopener noreferrer">security guidance</a>.
      </p>
    </section>
  </div>
);

const CryptoScamRecoveryContent = () => (
  <div className="space-y-8">
    <section>
      <h2 className="text-2xl font-bold mb-4">Can stolen cryptocurrency be recovered?</h2>
      <p className="mb-4">
        Sometimes funds are traced, frozen, or recovered through an exchange&apos;s internal process, legal process, or law
        enforcement action—but there is no guaranteed recovery route. A blockchain transfer is not reversed like a card
        chargeback, and speed, destination, jurisdiction, evidence quality, and the receiving service all affect what may
        still be possible.
      </p>
      <p>
        The most useful immediate response is to prevent additional loss, preserve accurate evidence, notify legitimate
        providers through official channels, and report promptly. Do not let embarrassment or pressure from the criminal
        delay action; do not alert the suspected criminal that a report has been filed if authorities advise against it.
      </p>
    </section>

    <section className="bg-card/50 border border-border/60 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">The short answer</h2>
      <p className="text-lg leading-relaxed">
        Stop all payments—including supposed taxes, deposits, unlocking charges, and recovery fees. Secure any exposed
        accounts, save the complete transaction trail, contact the sending and receiving financial providers through
        independently verified channels, and report the fraud promptly. Treat unsolicited recovery offers and guaranteed
        outcomes as likely attempts to victimize you again.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What to do in the first hours</h2>
      <ol className="list-decimal pl-6 space-y-4">
        <li>
          <strong>Stop sending money.</strong> A platform balance, profit screen, support agent, or romantic contact may
          insist that one more payment will release funds. The FBI identifies extra “taxes” and “fees” as part of the scam.
        </li>
        <li>
          <strong>Use a clean communication path.</strong> End contact with the scammer. Navigate independently to the
          official bank, exchange, wallet-provider, or card issuer and report the transaction. Do not use phone numbers,
          links, or support accounts supplied by the suspect.
        </li>
        <li>
          <strong>Contain actual access.</strong> If credentials or one-time codes were disclosed, secure the exchange and
          email accounts from a trusted device, end sessions, and replace compromised authentication. If a seed phrase was
          exposed, treat the wallet as compromised; merely changing a website password will not replace its keys.
        </li>
        <li>
          <strong>Preserve before deleting.</strong> Export chats where possible and capture URLs, profiles, phone numbers,
          email addresses, applications, payment instructions, account screens, and timestamps. Keep original files.
        </li>
        <li>
          <strong>Record the transaction trail.</strong> List each cryptocurrency address, transaction hash, network,
          asset type, amount, date, time, and exchange or financial institution involved.
        </li>
        <li>
          <strong>Report promptly.</strong> In the United States, submit the details to <a className="text-primary underline" href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer">IC3.gov</a> and consider contacting the local FBI field office. Elsewhere, use the applicable national cybercrime or police reporting service.
        </li>
      </ol>
    </section>

    <section className="bg-primary/10 border border-primary/20 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-3">Evidence checklist for a useful report</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Transaction hashes or IDs, wallet addresses, network, asset, amount, date, and time</li>
        <li>Bank, card, payment-app, and exchange transaction references</li>
        <li>Scammer names, usernames, phone numbers, emails, wallet addresses, and profile links</li>
        <li>Domains, application names, advertisements, referral codes, and download sources</li>
        <li>Messages, voice notes, emails, screenshots, and a chronological summary</li>
        <li>Details of any follow-on contact offering recovery</li>
      </ul>
      <p className="mt-4 text-sm">
        The FBI says to report even if some transaction information is unavailable. Provide what you have and add the
        most precise identifiers possible.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">How recovery scams work</h2>
      <p className="mb-4">
        Recovery scammers target people who have already lost money. They may find a public post, buy victim information,
        or be part of the original operation. They pose as blockchain investigators, law firms, government agents, exchange
        staff, or hackers and claim that traced or frozen funds are ready to be returned.
      </p>
      <p>
        The IC3 warns that fraudulent recovery businesses commonly charge an advance fee, then disappear or produce an
        incomplete tracing report and demand more money. A private company may analyze public blockchain activity, but it
        cannot issue a seizure order. An exchange decides under its internal process or responds to valid legal process.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Recovery-offer red flags</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Claims that should stop the conversation</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>A guarantee that all funds will be returned</li>
            <li>A fee, tax, bond, gas deposit, or wallet “validation” payment before release</li>
            <li>A request for a seed phrase, private key, one-time code, or remote device access</li>
            <li>A claim that law enforcement charges victims to investigate</li>
          </ul>
        </div>
        <div className="bg-card/50 p-5 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Independent checks</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Initiate contact using an official directory, not the incoming message</li>
            <li>Verify claimed law-enforcement involvement with the agency&apos;s published office number</li>
            <li>Confirm lawyers through the relevant licensing authority</li>
            <li>Ask for scope, fees, limitations, and legal basis in writing—without granting wallet access</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">What legitimate assistance can and cannot do</h2>
      <p className="mb-4">
        An exchange may preserve account data, review activity, restrict an account under its policies, or respond to legal
        process. Law enforcement may investigate and pursue seizure when evidence and jurisdiction permit. A qualified
        lawyer can advise on civil options. A blockchain analyst can document public transaction flows.
      </p>
      <p>
        None of those capabilities means a provider can promise recovery. Due diligence should focus on verifiable identity,
        authorization, written terms, conflicts, realistic limitations, and whether the provider is asking for secrets or
        control of more assets. Do not confuse a tracing report with legal authority over the destination funds.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold mb-2">Should I pay a tax to withdraw from an investment platform?</h3>
          <p>
            Do not send more cryptocurrency to a suspect platform to unlock a balance. The FBI specifically describes
            arbitrary tax and fee demands as a late stage of cryptocurrency investment fraud. Contact a qualified tax
            professional independently for genuine tax questions.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Can someone hack the blockchain to reverse my transaction?</h3>
          <p>
            A stranger claiming they can reverse a confirmed transaction by hacking, validating, synchronizing, or adding
            gas is describing a recovery scam. Do not connect a wallet, install software, or pay them.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Is reporting worthwhile if recovery is uncertain?</h3>
          <p>
            Yes. Accurate reports can connect related cases and give providers or investigators usable transaction details.
            Reporting is not a recovery guarantee, but silence removes those possibilities and lets the same identifiers
            remain unreported.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">What if I feel overwhelmed?</h3>
          <p>
            Ask a trusted person to help document events and contact official providers, without sharing wallet secrets.
            Financial fraud can be deeply distressing. Personal support and local victim services matter alongside the
            technical response.
          </p>
        </div>
      </div>
    </section>

    <section className="text-sm text-muted-foreground">
      <h2 className="text-xl font-bold text-foreground mb-3">Primary references and scope</h2>
      <p className="mb-3">
        Response steps and report fields are based on the FBI&apos;s <a className="text-primary underline" href="https://www.fbi.gov/how-we-can-help-you/victim-services/national-crimes-and-victim-resources/cryptocurrency-investment-fraud" target="_blank" rel="noopener noreferrer">cryptocurrency investment fraud guidance</a> and the IC3 <a className="text-primary underline" href="https://www.ic3.gov/CrimeInfo/Cryptocurrency" target="_blank" rel="noopener noreferrer">cryptocurrency reporting page</a>. Recovery-scam warnings follow <a className="text-primary underline" href="https://www.ic3.gov/PSA/2023/PSA230811" target="_blank" rel="noopener noreferrer">IC3 Alert I-081123-PSA</a>.
      </p>
      <p>
        This is general safety information, not legal advice or a promise of recovery. Reporting routes cited here are
        U.S.-specific; victims elsewhere should also contact the appropriate local authorities.
      </p>
    </section>
  </div>
);

export const identitySafetyContentMap: Record<string, React.FC> = {
  'passkeys-vs-authenticator-apps-security-keys-crypto': PasskeysCryptoAccountsContent,
  'crypto-address-poisoning-token-impersonation': AddressPoisoningContent,
  'cryptocurrency-scam-recovery-steps-recovery-scams': CryptoScamRecoveryContent,
};
