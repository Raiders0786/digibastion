
import { SecurityCategory } from "../../types/security";

export const jobsData: SecurityCategory = {
  id: "jobs",
  title: "Job Search Security",
  description: "Secure your Web3 job search process",
  icon: "briefcase",
  items: [
    {
      id: "job-1",
      title: "Identity Verification",
      description: "Verify employers and recruiters",
      completed: false,
      level: "essential",
      details: "Always verify the identity of potential employers and recruiters through official channels and community networks.",
      links: [
        { text: "Job Verification Guide", url: "https://cryptojobslist.com/blog/how-to-tell-if-a-job-post-is-real-or-fake" }
      ]
    },
    {
      id: "job-2",
      title: "Secure Communications",
      description: "Use secure channels",
      completed: false,
      level: "essential",
      details: "Communicate through official channels and use encrypted messaging when discussing sensitive information.",
    },
    {
      id: "job-3",
      title: "Document Security",
      description: "Protect sensitive documents",
      completed: false,
      level: "recommended",
      details: "Secure all job-related documents including resumes, portfolios, and contracts. Use secure sharing methods.",
    },
    {
      id: "job-4",
      title: "Interview Security",
      description: "Secure interview process",
      completed: false,
      level: "essential",
      details: "Verify interview platforms and protect sensitive information during technical interviews and assessments.",
    },
    {
      id: "job-5",
      title: "Contract Review",
      description: "Secure agreement process",
      completed: false,
      level: "recommended",
      details: "Carefully review all contracts and agreements, including smart contract-based compensation arrangements.",
    }
  ],
  longDescription: "Protect yourself during your Web3 job search through proper security measures and verification processes."
};
