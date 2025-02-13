
import { SecurityCategory } from "../../types/security";

export const osData: SecurityCategory = {
  id: "os",
  title: "OS Hardening",
  description: "Strengthen your operating system security",
  icon: "laptop",
  items: [
    {
      id: "os-1",
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
      id: "os-2",
      title: "Use antivirus software",
      description: "Install and maintain updated antivirus protection",
      completed: false,
      level: "essential",
      details: "Install reputable antivirus software and keep it updated. Enable real-time protection to guard against malware, ransomware, and other threats."
    },
    {
      id: "os-3",
      title: "Enable disk encryption",
      description: "Encrypt your system drive",
      completed: false,
      level: "recommended",
      details: "Use built-in disk encryption tools like BitLocker (Windows) or FileVault (Mac) to protect your data in case of device theft.",
      links: [
        { text: "BitLocker Guide", url: "https://support.microsoft.com/en-us/windows/turn-on-device-encryption-0c453637-bc88-5f74-5105-741561aae838" }
      ]
    },
    {
      id: "os-4",
      title: "Regular system updates",
      description: "Keep your OS and software up to date",
      completed: false,
      level: "essential",
      details: "Enable automatic updates for your operating system and regularly update all installed software to patch security vulnerabilities."
    },
    {
      id: "os-5",
      title: "Secure boot settings",
      description: "Enable secure boot in BIOS/UEFI",
      completed: false,
      level: "recommended",
      details: "Enable Secure Boot in your system's BIOS/UEFI settings to prevent unauthorized boot code from executing."
    },
    {
      id: "os-6",
      title: "Guest account control",
      description: "Disable or restrict guest accounts",
      completed: false,
      level: "optional",
      details: "Disable guest accounts or apply strict permissions to prevent unauthorized system access."
    }
  ],
};
