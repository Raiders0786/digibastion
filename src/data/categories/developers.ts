
import { SecurityCategory } from "../../types/security";

export const developersData: SecurityCategory = {
  id: "developers",
  title: "Developer Security",
  description: "Security best practices for Web3 developers",
  icon: "code",
  items: [
    {
      id: "dev-1",
      title: "Secure Development Environment",
      description: "Set up secure workspace",
      completed: false,
      level: "essential",
      details: "Configure a secure development environment with proper key management, environment variables, and security tools.",
      links: [
        { text: "Security Guide", url: "https://github.com/transmissions11/solcurity" }
      ]
    },
    {
      id: "dev-2",
      title: "Code Repository Security",
      description: "Protect source code",
      completed: false,
      level: "essential",
      details: "Implement strong access controls, 2FA, and secure configuration for all code repositories.",
    },
    {
      id: "dev-3",
      title: "Smart Contract Testing",
      description: "Comprehensive testing",
      completed: false,
      level: "recommended",
      details: "Set up thorough testing environments including unit tests, integration tests, and security-focused test cases.",
    },
    {
      id: "dev-4",
      title: "Audit Preparation",
      description: "Ready code for audits",
      completed: false,
      level: "essential",
      details: "Prepare code for security audits with proper documentation, test coverage, and known issue tracking.",
    },
    {
      id: "dev-5",
      title: "Deployment Security",
      description: "Secure deployment process",
      completed: false,
      level: "recommended",
      details: "Implement secure deployment procedures including proper key management and deployment verification steps.",
    }
  ],
  longDescription: "Ensure the security of your development process and code through proper security measures and best practices."
};
