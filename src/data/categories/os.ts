
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
      details: "Configure and enable your system's firewall to protect against unauthorized access."
    },
    {
      id: "os-2",
      title: "Use antivirus software",
      description: "Install and maintain updated antivirus protection",
      completed: false,
      level: "essential",
      details: "Install and maintain updated antivirus software to protect against malware and other threats."
    },
    {
      id: "os-3",
      title: "Enable disk encryption",
      description: "Encrypt your system drive",
      completed: false,
      level: "essential",
      details: "Encrypt your system drive to protect against unauthorized access."
    },
    {
      id: "os-4",
      title: "Regular system updates",
      description: "Keep your OS and software up to date",
      completed: false,
      level: "essential",
      details: "Keep your operating system and software up to date to protect against vulnerabilities."
    }
  ],
};
