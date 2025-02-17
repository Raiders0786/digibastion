
import { SecurityCategory } from "../../types/security";

export const developersData: SecurityCategory = {
  id: "developers",
  title: "Developer Security",
  description: "Security best practices for Web3 developers",
  icon: "code",
  items: [
    {
      id: "dev-1",
      title: "Secure Code Repository Access",
      description: "Implement proper access controls for code",
      completed: false,
      level: "essential",
      details: "Use strong authentication, 2FA, and proper permission management for all code repositories and development environments.",
      links: [
        { text: "GitHub Security", url: "https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa" }
      ]
    },
    {
      id: "dev-2",
      title: "Smart Contract Security",
      description: "Follow smart contract security best practices",
      completed: false,
      level: "essential",
      details: "Implement proper testing, auditing, and security measures in smart contract development. Use security tools and follow established patterns.",
      links: [
        { text: "Smart Contract Best Practices", url: "https://consensys.github.io/smart-contract-best-practices/" }
      ]
    },
    {
      id: "dev-3",
      title: "Secure Development Environment",
      description: "Set up a secure development workspace",
      completed: false,
      level: "recommended",
      details: "Use secure development tools, keep software updated, and implement proper security measures in your development environment.",
    },
    {
      id: "dev-4",
      title: "Code Review Process",
      description: "Establish secure code review practices",
      completed: false,
      level: "recommended",
      details: "Implement thorough code review processes with security checkpoints and automated security scanning.",
      links: [
        { text: "Security Review Guide", url: "https://www.sonarqube.org/features/security/" }
      ]
    },
    {
      id: "dev-5",
      title: "API Security",
      description: "Secure API endpoints and interactions",
      completed: false,
      level: "essential",
      details: "Implement proper API security measures including authentication, rate limiting, and input validation.",
    }
  ],
  longDescription: "Ensure the security of your development process and code through proper security measures and best practices."
};
