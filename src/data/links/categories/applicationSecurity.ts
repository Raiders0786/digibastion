
import { SecurityCategory } from "../types";

export const applicationSecurity: SecurityCategory = {
  "name": "Application Security",
  "description": "Resources and tools to secure code, third-party dependencies, continuous integration pipelines, and language-specific vulnerabilities.",
  "tools": [
    {
      "title": "GitHub Security & Analysis Settings",
      "url": "https://github.com/settings/security",
      "description": "Enable all optional security and analysis settings on your repositories for better vulnerability detection.",
      "tags": ["github", "CI/CD", "security settings"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Super-Linter",
      "url": "https://github.com/github/super-linter",
      "description": "An all-in-one linter for GitHub Actions to enforce coding standards and detect vulnerabilities.",
      "tags": ["linter", "CI/CD", "code quality"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Semgrep",
      "url": "https://semgrep.dev",
      "description": "A static analysis tool that finds bugs and enforces code standards with customizable rules.",
      "tags": ["static analysis", "code scanning", "security"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "CodeQL",
      "url": "https://codeql.github.com",
      "description": "An advanced code analysis engine that lets you query code as data to detect security issues.",
      "tags": ["code analysis", "security", "query"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Data Theorem Web/Mobile Secure",
      "url": "https://www.datatheorem.com",
      "description": "Tools for scanning web and mobile applications to identify vulnerabilities.",
      "tags": ["web security", "mobile security", "vulnerability scanning"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Language-Specific Scanners & Linters",
      "url": "https://github.com/tldrsec/awesome-secure-defaults",
      "description": "A curated list of secure defaults and language-specific tools such as ASAN, scan-build, cppcheck for C++, SonarSource, phpstan, psalm for PHP, Bandit and pip-audit for Python, Brakeman for Ruby, slither for Solidity, and more.",
      "tags": ["language security", "linters", "scanners"],
      "lastReviewed": "2025-02-26",
      "active": true
    },
    {
      "title": "Testing Handbook by Trail of Bits",
      "url": "https://github.com/trailofbits",
      "description": "Guidance on secure coding practices and security testing strategies.",
      "tags": ["testing", "secure coding", "guidelines"],
      "lastReviewed": "2025-02-26",
      "active": true
    }
  ]
};
