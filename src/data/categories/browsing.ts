
import { SecurityCategory } from '../../types/security';
import { Globe } from 'lucide-react';

export const browsingData: SecurityCategory = {
  id: 'browsing',
  title: 'Browsing Security',
  description: 'Secure your online browsing experience',
  icon: 'globe',
  items: [
    // Web3-specific browsing security items
    {
      id: 'web-40',
      title: 'Use a Web3-Enabled Browser or dApp Isolation',
      description: 'Secure decentralized interactions with specialized browsers.',
      completed: false,
      level: 'recommended',
      details: 'When accessing decentralized applications, use browsers that offer built-in crypto wallets and dedicated dApp isolation. This helps segregate blockchain interactions from your regular browsing, reducing phishing and data exposure risks.',
      links: [
        { text: 'Brave', url: 'https://brave.com' },
        { text: 'Opera Crypto Browser', url: 'https://www.opera.com/crypto' }
      ]
    },
    // Essential browsing security items
    {
      id: 'web-1',
      title: 'Block Ads',
      description: 'Use an ad blocker to reduce tracking.',
      completed: false,
      level: 'essential',
      details: 'Install an ad blocker like uBlock Origin to stop trackers, malicious ads, and speed up page loading.',
      links: [
        { text: 'uBlock Origin', url: 'https://github.com/gorhill/uBlock' }
      ]
    },
    {
      id: 'web-2',
      title: 'Use a Privacy-Respecting Browser',
      description: 'Choose browsers that protect your data.',
      completed: false,
      level: 'essential',
      details: 'Opt for browsers like Firefox (with privacy tweaks) or Brave instead of data-hungry browsers such as Chrome, Edge, or Safari.',
      links: [
        { text: 'Privacy Guides Browser List', url: 'https://www.privacyguides.org/en/desktop-browsers/' }
      ]
    },
    {
      id: 'web-3',
      title: 'Use a Private Search Engine',
      description: 'Switch to non-tracking search engines.',
      completed: false,
      level: 'essential',
      details: 'Adopt privacy-preserving search engines like DuckDuckGo or Qwant to avoid having your search data tracked.',
      links: [
        { text: 'DuckDuckGo', url: 'https://duckduckgo.com' },
        { text: 'Qwant', url: 'https://qwant.com' }
      ]
    },
    {
      id: 'web-4',
      title: 'Remove Unnecessary Browser Extensions',
      description: 'Limit installed addons to reduce risk.',
      completed: false,
      level: 'essential',
      details: 'Only install extensions you truly need. Unnecessary addons can leak data and increase your browser\'s fingerprint.'
    },
    {
      id: 'web-5',
      title: 'Keep Your Browser Updated',
      description: 'Apply updates to patch vulnerabilities.',
      completed: false,
      level: 'essential',
      details: 'Regularly update your browser to fix security issues and protect against zero-day exploits.'
    },
    {
      id: 'web-6',
      title: 'Use HTTPS Websites',
      description: 'Ensure sites use encrypted connections.',
      completed: false,
      level: 'essential',
      details: 'Only enter data on HTTPS-enabled sites. Remember, a green padlock doesn\'t guarantee legitimacy.'
    },
    {
      id: 'web-7',
      title: 'Enable DNS-over-HTTPS',
      description: 'Encrypt your DNS queries.',
      completed: false,
      level: 'essential',
      details: 'Activate DNS-over-HTTPS (DoH) to secure your DNS lookups from eavesdropping and tampering. Popular options include Cloudflare\'s 1.1.1.1.',
      links: [
        { text: 'Cloudflare 1.1.1.1', url: 'https://1.1.1.1/dns/' }
      ]
    },
    {
      id: 'web-8',
      title: 'Use Browser Containers',
      description: 'Isolate different browsing sessions.',
      completed: false,
      level: 'essential',
      details: 'Use Firefox Containers or separate profiles to compartmentalize work, social, and personal browsing, reducing cross-site tracking.',
      links: [
        { text: 'Firefox Multi-Account Containers', url: 'https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/' }
      ]
    },
    {
      id: 'web-9',
      title: 'Use Incognito/Private Mode',
      description: 'Browse privately on shared devices.',
      completed: false,
      level: 'essential',
      details: 'When using public or untrusted devices, use incognito mode to avoid saving history, cookies, and temporary data.'
    },
    {
      id: 'web-10',
      title: 'Monitor Your Browser Fingerprint',
      description: 'Understand how unique your setup is.',
      completed: false,
      level: 'essential',
      details: 'Visit sites like amiunique.org to assess your browser fingerprint and learn how to reduce its uniqueness.',
      links: [
        { text: 'Am I Unique?', url: 'https://amiunique.org' }
      ]
    },
    {
      id: 'web-11',
      title: 'Manage Your Cookies',
      description: 'Regularly clear cookies to reduce tracking.',
      completed: false,
      level: 'essential',
      details: 'Clearing cookies frequently can help limit persistent tracking and protect session data from being stolen.'
    },
    {
      id: 'web-12',
      title: 'Block Third-Party Cookies',
      description: 'Prevent external sites from tracking you.',
      completed: false,
      level: 'essential',
      details: 'Disable third-party cookies to stop advertisers and analytics services from tracking your web activity.'
    },
    {
      id: 'web-13',
      title: 'Block Third-Party Trackers',
      description: 'Use tools to stop background tracking.',
      completed: false,
      level: 'essential',
      details: 'Install tracker-blocking extensions like Privacy Badger, DuckDuckGo Privacy Essentials, or uBlock Origin to reduce hidden tracking.'
    },
    // Optional browsing security items
    {
      id: 'web-14',
      title: 'Beware of Malicious Redirects',
      description: 'Verify URLs before following redirects.',
      completed: false,
      level: 'optional',
      details: 'Some redirects may be used for phishing. Use tools like Redirect Detective to check the destination of suspicious links.',
      links: [
        { text: 'Redirect Detective', url: 'https://redirectdetective.com' }
      ]
    },
    {
      id: 'web-15',
      title: 'Avoid Browser Sign-in',
      description: 'Don\'t sync personal data with your browser.',
      completed: false,
      level: 'optional',
      details: 'Avoid signing into your browser to limit centralized data collection and reduce your digital footprint.'
    },
    {
      id: 'web-16',
      title: 'Disable Prediction Services',
      description: 'Turn off search and URL predictions.',
      completed: false,
      level: 'optional',
      details: 'Disable prediction services in your browser to stop keystroke data from being sent to search engines.'
    },
    {
      id: 'web-17',
      title: 'Avoid Google Translate Extensions',
      description: 'Limit data collection from translation tools.',
      completed: false,
      level: 'optional',
      details: 'Google Translate extensions can log your input data. Use alternative translation services with better privacy policies.'
    },
    {
      id: 'web-18',
      title: 'Disable Browser Notifications',
      description: 'Stop unsolicited push alerts.',
      completed: false,
      level: 'optional',
      details: 'Turn off browser notifications to reduce exposure to phishing attempts and unwanted interruptions.'
    },
    {
      id: 'web-19',
      title: 'Disable Automatic Downloads',
      description: 'Prevent drive-by download attacks.',
      completed: false,
      level: 'optional',
      details: 'Disable auto-downloads in your browser settings to avoid inadvertently downloading malicious files.'
    },
    {
      id: 'web-20',
      title: 'Restrict Sensor Access',
      description: 'Control websites\' access to device sensors.',
      completed: false,
      level: 'optional',
      details: 'Block or limit websites from accessing device sensors (e.g., accelerometer, gyroscope) unless absolutely necessary.'
    },
    {
      id: 'web-21',
      title: 'Disable Location Services',
      description: 'Stop sites from tracking your physical location.',
      completed: false,
      level: 'optional',
      details: 'Turn off location sharing in your browser to prevent sites from gathering your physical whereabouts.'
    },
    {
      id: 'web-22',
      title: 'Block Camera/Microphone Access',
      description: 'Prevent unauthorized use of your devices.',
      completed: false,
      level: 'optional',
      details: 'Ensure no website has persistent access to your webcam or microphone by managing permissions in your browser settings.'
    },
    {
      id: 'web-23',
      title: 'Disable Browser Password Saving',
      description: 'Avoid storing credentials in the browser.',
      completed: false,
      level: 'optional',
      details: 'Disable the browser\'s built-in password saving to protect your credentials and use a dedicated password manager instead.'
    },
    {
      id: 'web-24',
      title: 'Turn Off Browser Autofill',
      description: 'Prevent accidental exposure of sensitive data.',
      completed: false,
      level: 'optional',
      details: 'Disable autofill for forms to reduce the risk of exposing personal or confidential information.'
    },
    {
      id: 'web-25',
      title: 'Guard Against CSS Exfil Attacks',
      description: 'Mitigate data extraction via CSS.',
      completed: false,
      level: 'optional',
      details: 'Install plugins like CSS Exfil Protection to block attacks that use CSS to exfiltrate data from your browser.'
    },
    {
      id: 'web-26',
      title: 'Deactivate ActiveX Controls',
      description: 'Disable ActiveX to reduce risk.',
      completed: false,
      level: 'optional',
      details: 'Since ActiveX is outdated and poses security risks, disable it in browsers that support this technology.'
    },
    {
      id: 'web-27',
      title: 'Disable WebRTC',
      description: 'Prevent IP leaks through peer-to-peer connections.',
      completed: false,
      level: 'optional',
      details: 'Disable WebRTC in your browser settings to stop exposing your local IP address during communications.'
    },
    {
      id: 'web-28',
      title: 'Spoof Canvas Fingerprint',
      description: 'Obfuscate your browser\'s canvas signature.',
      completed: false,
      level: 'optional',
      details: 'Use extensions like CanvasBlocker to spoof your HTML5 Canvas fingerprint and lower tracking accuracy.'
    },
    {
      id: 'web-29',
      title: 'Spoof User Agent',
      description: 'Change your browser\'s user agent periodically.',
      completed: false,
      level: 'optional',
      details: 'Altering your user agent can help reduce tracking by making it harder for websites to identify your device and browser.'
    },
    {
      id: 'web-30',
      title: 'Disable Do Not Track',
      description: 'Stop sending DNT signals.',
      completed: false,
      level: 'optional',
      details: 'Since the Do Not Track setting is often ignored and can add to your unique fingerprint, consider disabling it.'
    },
    {
      id: 'web-31',
      title: 'Mitigate HSTS Tracking',
      description: 'Reduce risks associated with HSTS super-cookies.',
      completed: false,
      level: 'optional',
      details: 'HSTS can be misused to track you via super-cookies. Disable it in Chromium-based browsers if necessary.'
    },
    {
      id: 'web-32',
      title: 'Disable Automatic Browser Connections',
      description: 'Prevent your browser from calling home.',
      completed: false,
      level: 'optional',
      details: 'Adjust your browser settings to stop automatic connections that send usage data, analytics, or diagnostics.'
    },
    {
      id: 'web-33',
      title: 'Enable First-Party Isolation',
      description: 'Scope browser data to each website.',
      completed: false,
      level: 'optional',
      details: 'Activate First-Party Isolation to restrict cross-site tracking, reducing your online fingerprint.'
    },
    // Advanced browsing security items
    {
      id: 'web-34',
      title: 'Strip Tracking Parameters',
      description: 'Remove tracking info from URLs.',
      completed: false,
      level: 'advanced',
      details: 'Use tools like ClearURLs to automatically remove tracking parameters from URLs, protecting your browsing habits.',
      links: [
        { text: 'ClearURLs', url: 'https://addons.mozilla.org/en-US/firefox/addon/clearurls/' }
      ]
    },
    {
      id: 'web-35',
      title: 'Secure First Launch',
      description: 'Configure privacy settings before browsing.',
      completed: false,
      level: 'advanced',
      details: 'After installing a browser, disconnect from the internet and adjust your privacy settings before going online.'
    },
    {
      id: 'web-36',
      title: 'Use the Tor Browser',
      description: 'Browse anonymously using Tor.',
      completed: false,
      level: 'advanced',
      details: 'Download and use the Tor Browser to encrypt and route your traffic through multiple nodes for maximum anonymity.',
      links: [
        { text: 'Tor Project', url: 'https://www.torproject.org' }
      ]
    },
    {
      id: 'web-37',
      title: 'Disable JavaScript',
      description: 'Reduce potential attack surfaces.',
      completed: false,
      level: 'advanced',
      details: 'Turning off JavaScript can significantly decrease tracking and exposure to certain exploits, though it may break many sites.'
    },
    {
      id: 'web-38',
      title: 'Use a VPN for Browsing',
      description: 'Encrypt your internet traffic.',
      completed: false,
      level: 'advanced',
      details: 'A reliable VPN hides your IP address and encrypts your data. Choose a reputable provider to ensure maximum privacy.',
      links: [
        { text: 'Privacy Guides VPN List', url: 'https://www.privacyguides.org/en/vpn/' }
      ]
    },
    {
      id: 'web-39',
      title: 'Use Privacy-Focused DNS',
      description: 'Opt for DNS providers that respect your privacy.',
      completed: false,
      level: 'advanced',
      details: 'Select DNS resolvers like Quad9 or NextDNS that prioritize user privacy and reduce tracking from DNS queries.',
      links: [
        { text: 'Quad9', url: 'https://www.quad9.net' },
        { text: 'NextDNS', url: 'https://nextdns.io' }
      ]
    }
  ],
  longDescription: 'Your browser is your window to the internet, and it\'s also one of the most common attack vectors for hackers. Securing your browsing habits and setup is essential for maintaining privacy and security online. These measures help protect against tracking, data collection, and various web-based attacks including those targeting Web3 interactions.'
};
