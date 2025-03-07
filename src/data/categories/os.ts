
import { SecurityCategory } from "../../types/security";

export const osData: SecurityCategory = {
  id: "os",
  title: "OS Hardening",
  description: "Strengthen your operating system security",
  icon: "laptop",
  items: [
    // Essential items
    {
      id: "os-1",
      title: "Keep Your System Up-to-Date",
      description: "Install security patches and updates promptly.",
      completed: false,
      level: "essential",
      details: "Regularly update your operating system to apply security patches, improve performance, and fix vulnerabilities."
    },
    {
      id: "os-2",
      title: "Encrypt Your Device",
      description: "Enable full disk encryption.",
      completed: false,
      level: "essential",
      details: "Use tools like BitLocker (Windows), FileVault (macOS), or LUKS (Linux) to encrypt your entire drive and protect data in case of loss or theft."
    },
    {
      id: "os-36",
      title: "Isolate Crypto Wallet & Node Operations",
      description: "Run crypto apps in dedicated environments.",
      completed: false,
      level: "recommended",
      details: "For enhanced security in Web3 contexts, isolate crypto wallet software and blockchain node operations using virtual machines or containers. This prevents vulnerabilities in these applications from impacting your primary system.",
      links: [
        { text: "Docker", url: "https://www.docker.com" }
      ]
    },
    {
      id: "os-3",
      title: "Backup Important Data",
      description: "Maintain secure, encrypted backups.",
      completed: false,
      level: "essential",
      details: "Regularly back up your critical data using encrypted backup solutions such as Cryptomator for cloud files or VeraCrypt for external drives."
    },
    {
      id: "os-4",
      title: "Be Cautious with USB Devices",
      description: "Avoid plugging in untrusted USB devices.",
      completed: false,
      level: "essential",
      details: "USB devices can carry malware. Use tools like CIRCLean to safely sanitize USB drives before use."
    },
    {
      id: "os-5",
      title: "Activate Screen-Lock When Idle",
      description: "Automatically lock your computer when not in use.",
      completed: false,
      level: "essential",
      details: "Configure your system to lock after a short period of inactivity, and require a strong password to unlock."
    },
    {
      id: "os-6",
      title: "Enable firewall",
      description: "Configure and enable system firewall",
      completed: false,
      level: "essential",
      details: "Configure and enable your system's built-in firewall to control incoming and outgoing network traffic. This is your first line of defense against network-based attacks.",
      links: [
        { text: "Windows Firewall Guide", url: "https://support.microsoft.com/en-us/windows/turn-windows-defender-firewall-on-or-off-ec0844f7-aebd-0583-67fe-601ecf5d774f" }
      ]
    },
    {
      id: "os-7",
      title: "Review Your Installed Apps",
      description: "Minimize installed applications.",
      completed: false,
      level: "essential",
      details: "Remove unnecessary applications to reduce the attack surface and limit potential vulnerabilities."
    },
    {
      id: "os-8",
      title: "Manage Application Permissions",
      description: "Control app access to sensitive data.",
      completed: false,
      level: "essential",
      details: "Regularly review and adjust permissions for apps to ensure they don't access more data than necessary."
    },
    {
      id: "os-9",
      title: "Disallow Usage Data to Cloud",
      description: "Limit automatic data syncing.",
      completed: false,
      level: "essential",
      details: "Disable or limit usage data and diagnostic feedback sent to cloud services to protect your privacy."
    },
    {
      id: "os-10",
      title: "Avoid Quick Unlock Methods",
      description: "Use strong passwords over biometrics or short PINs.",
      completed: false,
      level: "essential",
      details: "Opt for strong alphanumeric passwords rather than quick unlock options to enhance device security."
    },
    {
      id: "os-11",
      title: "Power Off Instead of Standby",
      description: "Shut down your device when not in use.",
      completed: false,
      level: "essential",
      details: "Completely power off your computer when not in use, especially if the disk is encrypted, to prevent unauthorized access."
    },
    {
      id: "os-12",
      title: "Use antivirus software",
      description: "Install and maintain updated antivirus protection",
      completed: false,
      level: "essential",
      details: "Install reputable antivirus software and keep it updated. Enable real-time protection to guard against malware, ransomware, and other threats."
    },
    
    // Recommended items
    {
      id: "os-31",
      title: "Enable Secure Boot",
      description: "Prevent unauthorized bootloader modifications.",
      completed: false,
      level: "recommended",
      details: "Turn on Secure Boot in your system's UEFI/BIOS settings to help ensure that only trusted software is loaded during startup."
    },
    
    // Optional items
    {
      id: "os-13",
      title: "Use a Local Account Only",
      description: "Avoid linking your PC to online accounts.",
      completed: false,
      level: "optional",
      details: "Opt for a local user account instead of a Microsoft or Apple account to reduce data syncing and exposure."
    },
    {
      id: "os-14",
      title: "Use Non-Admin Accounts for Daily Tasks",
      description: "Avoid running as a root or admin user.",
      completed: false,
      level: "optional",
      details: "Perform routine tasks using an unprivileged account to limit potential damage from malware or user errors."
    },
    {
      id: "os-15",
      title: "Block Webcam and Microphone",
      description: "Prevent unauthorized access to your camera and mic.",
      completed: false,
      level: "optional",
      details: "Cover your webcam when not in use and disable microphone access for untrusted applications."
    },
    {
      id: "os-16",
      title: "Use a Privacy Screen Filter",
      description: "Protect against shoulder surfing.",
      completed: false,
      level: "optional",
      details: "Apply a screen privacy filter when using your computer in public spaces to obscure onlookers from viewing sensitive information."
    },
    {
      id: "os-17",
      title: "Physically Secure Your Device",
      description: "Prevent unauthorized physical access.",
      completed: false,
      level: "optional",
      details: "Use tools like a Kensington Lock and port blockers to physically secure your laptop in public or shared spaces."
    },
    {
      id: "os-18",
      title: "Avoid Charging from Untrusted Sources",
      description: "Use a power bank or wall charger instead of your PC.",
      completed: false,
      level: "optional",
      details: "Charging from your PC via USB can expose you to data transfer risks; use alternative charging methods when possible."
    },
    {
      id: "os-19",
      title: "Randomize Your Hardware Address on Wi-Fi",
      description: "Change your MAC address to reduce tracking.",
      completed: false,
      level: "optional",
      details: "Randomize or spoof your MAC address on Wi-Fi networks to make it harder for trackers to follow you across locations."
    },
    {
      id: "os-20",
      title: "Disable Unnecessary Sharing Services",
      description: "Turn off network sharing features you don't use.",
      completed: false,
      level: "optional",
      details: "Review and disable any file or printer sharing services to close potential gateways for attackers."
    },
    {
      id: "os-21",
      title: "Protect Against Software Keyloggers",
      description: "Use tools to encrypt keystrokes.",
      completed: false,
      level: "optional",
      details: "Employ software that encrypts your keystrokes or monitors for keylogging activity to prevent credential theft."
    },
    {
      id: "os-22",
      title: "Check for Hardware Keyloggers",
      description: "Inspect your keyboard connections.",
      completed: false,
      level: "optional",
      details: "Be vigilant for any signs of hardware keyloggers, especially when using public or unfamiliar devices."
    },
    {
      id: "os-23",
      title: "Prevent Keystroke Injection Attacks",
      description: "Lock your device when not in use.",
      completed: false,
      level: "optional",
      details: "Always lock your computer when stepping away, and consider tools like USBGuard to protect against malicious USB-based keystroke injections."
    },
    {
      id: "os-24",
      title: "Avoid Commercial 'Free' Antivirus Software",
      description: "Rely on built-in or reputable security tools.",
      completed: false,
      level: "optional",
      details: "Free antivirus solutions may invade your privacy. Instead, use well-reviewed, trusted security software or the built-in OS protections."
    },
    {
      id: "os-6g",
      title: "Guest account control",
      description: "Disable or restrict guest accounts",
      completed: false,
      level: "optional",
      details: "Disable guest accounts or apply strict permissions to prevent unauthorized system access."
    },
    
    // Advanced items
    {
      id: "os-25",
      title: "Periodically Check for Rootkits",
      description: "Scan for deep system infections.",
      completed: false,
      level: "advanced",
      details: "Regularly use tools like chkrootkit or Rootkit Hunter to detect and remove any hidden rootkits that might grant attackers full control."
    },
    {
      id: "os-26",
      title: "Set a BIOS/UEFI Boot Password",
      description: "Add an extra layer before OS boot-up.",
      completed: false,
      level: "advanced",
      details: "Enable a BIOS or UEFI password to help prevent unauthorized changes to boot settings and add a barrier to physical attacks."
    },
    {
      id: "os-27",
      title: "Use a Security-Focused Operating System",
      description: "Consider hardened OS distributions.",
      completed: false,
      level: "advanced",
      details: "Switch to or experiment with security-centric operating systems or distributions such as Qubes OS, Tails, or other privacy-focused Linux distros.",
      links: [
        { text: "Qubes OS", url: "https://www.qubes-os.org" },
        { text: "Tails", url: "https://tails.boum.org" }
      ]
    },
    {
      id: "os-28",
      title: "Utilize Virtual Machines",
      description: "Isolate risky tasks in VMs.",
      completed: false,
      level: "advanced",
      details: "Run suspicious software or browse risky sites within virtual machines to keep your primary OS safe.",
      links: [
        { text: "VirtualBox", url: "https://www.virtualbox.org" }
      ]
    },
    {
      id: "os-29",
      title: "Compartmentalize Your Work",
      description: "Separate programs and data sources.",
      completed: false,
      level: "advanced",
      details: "Isolate different applications and data environments from each other to limit the scope of a breach."
    },
    {
      id: "os-30",
      title: "Disable Unwanted Windows Features",
      description: "Turn off unnecessary background services.",
      completed: false,
      level: "advanced",
      details: "Disable built-in Windows features and services you don't use to reduce resource consumption and potential security risks."
    },
    {
      id: "os-32",
      title: "Secure SSH Access",
      description: "Harden your remote login configuration.",
      completed: false,
      level: "advanced",
      details: "Protect SSH by using key-based authentication, changing default ports, and configuring firewall rules to limit access."
    },
    {
      id: "os-33",
      title: "Close Unused Open Ports",
      description: "Limit services listening on your network.",
      completed: false,
      level: "advanced",
      details: "Disable services and close ports that are not in use to reduce the avenues for remote attacks."
    },
    {
      id: "os-34",
      title: "Implement Mandatory Access Control",
      description: "Restrict privileges and limit process capabilities.",
      completed: false,
      level: "advanced",
      details: "Use security frameworks like SELinux, AppArmor, or other MAC systems to strictly control application access and operations."
    },
    {
      id: "os-35",
      title: "Deploy Canary Tokens",
      description: "Set up alerts for unauthorized access.",
      completed: false,
      level: "advanced",
      details: "Implement canary tokens or honeypots to detect and alert you of suspicious access or data exfiltration attempts.",
      links: [
        { text: "Canary Tokens", url: "https://canarytokens.org" }
      ]
    }
  ],
};
