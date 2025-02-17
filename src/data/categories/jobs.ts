
import { SecurityCategory } from "../../types/security";

export const jobsData: SecurityCategory = {
  id: "jobs",
  title: "Job Search Security",
  description: "Secure your Web3 job search process",
  icon: "briefcase",
  items: [
    {
      id: "job-1",
      title: "Verify Company Legitimacy",
      description: "Validate Web3 job opportunities",
      completed: false,
      level: "essential",
      details: "Research companies thoroughly, verify team members, and check community feedback before sharing any personal information.",
      links: [
        { text: "Company Verification", url: "https://cryptojobslist.com/blog/how-to-spot-crypto-scams" }
      ]
    },
    {
      id: "job-2",
      title: "Secure Communication Channels",
      description: "Use secure channels for job discussions",
      completed: false,
      level: "essential",
      details: "Communicate through official channels, use encrypted messaging when possible, and verify recruiter identities.",
    },
    {
      id: "job-3",
      title: "Protected Personal Information",
      description: "Safeguard personal data during job search",
      completed: false,
      level: "recommended",
      details: "Be cautious with personal information sharing, use professional email addresses, and protect sensitive documents.",
    },
    {
      id: "job-4",
      title: "Smart Contract Review",
      description: "Review job-related smart contracts",
      completed: false,
      level: "recommended",
      details: "Carefully review any smart contracts related to employment, vesting, or compensation. Seek legal advice when necessary.",
    },
    {
      id: "job-5",
      title: "Network Security",
      description: "Maintain security while networking",
      completed: false,
      level: "optional",
      details: "Use secure practices when networking, attending virtual events, or connecting with potential employers.",
    }
  ],
  longDescription: "Protect yourself during your Web3 job search through proper security measures and verification processes."
};
