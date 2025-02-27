
import { SecurityCategory } from '../../types/security';

export const browsingData: SecurityCategory = {
  id: 'browsing',
  title: 'Browsing Security',
  description: 'Secure your online browsing experience',
  icon: 'browser',
  items: [
    {
      id: 'browser-updates',
      title: 'Keep Browsers Updated',
      description: 'Always use the latest version of browsers to protect against known vulnerabilities',
      completed: false,
      level: 'essential',
      details: 'Most security vulnerabilities are exploited through outdated browsers. Set your browser to auto-update and regularly check for updates. Chrome, Firefox, Safari, and other major browsers release security patches frequently.',
      links: [
        { text: 'Browser Update Checker', url: 'https://browsercheck.qualys.com/' }
      ]
    },
    {
      id: 'extensions-audit',
      title: 'Audit Browser Extensions',
      description: 'Regularly review and remove unnecessary browser extensions',
      completed: false,
      level: 'essential',
      details: 'Extensions can have broad permissions to access your browsing data. Only keep extensions you regularly use and trust. Review the permissions each extension has and remove those that request excessive access.',
      links: [
        { text: 'Chrome Extensions Audit Guide', url: 'https://support.google.com/chrome/answer/2765944' }
      ]
    },
    {
      id: 'privacy-focused-browser',
      title: 'Use a Privacy-Focused Browser',
      description: 'Consider browsers designed with privacy as a priority',
      completed: false,
      level: 'recommended',
      details: 'Browsers like Brave, Firefox (with privacy settings adjusted), or Tor Browser offer enhanced privacy protections by default. These browsers minimize tracking and data collection compared to mainstream options.',
      links: [
        { text: 'Brave Browser', url: 'https://brave.com/' },
        { text: 'Firefox Privacy Settings', url: 'https://support.mozilla.org/en-US/kb/privacy-settings-firefox-desktop' },
        { text: 'Tor Browser', url: 'https://www.torproject.org/' }
      ]
    },
    {
      id: 'cookie-settings',
      title: 'Manage Cookie Settings',
      description: 'Regularly clear cookies and configure cookie permissions',
      completed: false,
      level: 'essential',
      details: 'Cookies can track your browsing habits across websites. Configure your browser to clear cookies when you close it or use extensions that help manage cookies. Consider blocking third-party cookies entirely.',
      links: [
        { text: 'Cookie Settings Guide', url: 'https://www.cookiesandyou.com/' }
      ]
    },
    {
      id: 'private-browsing',
      title: 'Use Private Browsing Mode',
      description: 'Use incognito/private mode for sensitive browsing sessions',
      completed: false,
      level: 'recommended',
      details: 'Private browsing modes don\'t save your browsing history, cookies, site data, or information entered in forms. While not completely anonymous (your ISP can still see your activity), it helps minimize local tracking.',
      links: []
    },
    {
      id: 'vpn-usage',
      title: 'Use a VPN',
      description: 'Enable a reputable VPN service when browsing',
      completed: false,
      level: 'recommended',
      details: 'A Virtual Private Network (VPN) encrypts your internet connection and hides your IP address. Choose a VPN with a no-logs policy, strong encryption, and good performance. Avoid free VPNs that might sell your data.',
      links: [
        { text: 'VPN Comparison Guide', url: 'https://www.privacytools.io/providers/vpn/' }
      ]
    },
    {
      id: 'https-only',
      title: 'Enable HTTPS-Only Mode',
      description: 'Configure your browser to only connect to secure websites',
      completed: false,
      level: 'essential',
      details: 'HTTPS encrypts the connection between your browser and the websites you visit. Most modern browsers have an option to force HTTPS connections, refusing to connect to sites without proper encryption.',
      links: [
        { text: 'HTTPS Everywhere', url: 'https://www.eff.org/https-everywhere' }
      ]
    },
    {
      id: 'tracking-protection',
      title: 'Enable Tracking Protection',
      description: 'Use browser features or extensions that block trackers',
      completed: false,
      level: 'essential',
      details: 'Trackers collect data about your browsing habits across websites. Enable built-in tracking protection in your browser or use extensions like Privacy Badger, uBlock Origin, or DuckDuckGo\'s privacy essentials.',
      links: [
        { text: 'Privacy Badger', url: 'https://privacybadger.org/' },
        { text: 'uBlock Origin', url: 'https://github.com/gorhill/uBlock' }
      ]
    },
    {
      id: 'fingerprinting-protection',
      title: 'Protect Against Fingerprinting',
      description: 'Use tools to prevent browser fingerprinting',
      completed: false,
      level: 'recommended',
      details: 'Browser fingerprinting identifies users based on browser and device characteristics. Use extensions like Canvas Blocker or browser settings that resist fingerprinting techniques.',
      links: [
        { text: 'Fingerprinting Guide', url: 'https://coveryourtracks.eff.org/' }
      ]
    },
    {
      id: 'javascript-settings',
      title: 'Review JavaScript Settings',
      description: 'Consider disabling JavaScript by default or using script blockers',
      completed: false,
      level: 'optional',
      details: 'While disabling JavaScript can break many websites, it can significantly improve security. Consider using extensions like NoScript or uMatrix to control which websites can run scripts, especially for sensitive browsing.',
      links: [
        { text: 'NoScript', url: 'https://noscript.net/' }
      ]
    },
    {
      id: 'search-engine',
      title: 'Use a Privacy-Focused Search Engine',
      description: 'Switch to search engines that don\'t track your searches',
      completed: false,
      level: 'recommended',
      details: 'Search engines like DuckDuckGo, Startpage, or Searx don\'t track your search history or build a profile on you. They provide similar functionality to Google while respecting your privacy.',
      links: [
        { text: 'DuckDuckGo', url: 'https://duckduckgo.com/' },
        { text: 'Startpage', url: 'https://www.startpage.com/' }
      ]
    },
    {
      id: 'phishing-protection',
      title: 'Enable Phishing Protection',
      description: 'Ensure browser phishing and malware protection is active',
      completed: false,
      level: 'essential',
      details: 'Most browsers include protection against phishing sites and malware downloads. Make sure these security features are enabled to avoid visiting fraudulent websites designed to steal your information.',
      links: []
    },
    {
      id: 'avoid-browser-save',
      title: 'Don\'t Save Passwords in Browser',
      description: 'Avoid using browser-based password saving features',
      completed: false,
      level: 'recommended',
      details: 'Browser password managers are generally less secure than dedicated password manager applications. They can be compromised if someone gains access to your device or user profile.',
      links: [
        { text: 'Password Manager Comparison', url: 'https://www.privacytools.io/privacy-services/password-management/' }
      ]
    }
  ],
  longDescription: 'Your browser is your window to the internet, and it\'s also one of the most common attack vectors for hackers. Securing your browsing habits and setup is essential for maintaining privacy and security online. These measures help protect against tracking, data collection, and various web-based attacks.'
};
