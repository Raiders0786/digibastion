# 🤝 Contributing to Digibastion

<p align="center">
  <strong>Digibastion — Secure the Stack</strong><br/>
  The Open-Source Web3 Security Platform
</p>

<p align="center">
  <a href="https://blog.ethereum.org/2025/12/02/allocation-q3-25#:~:text=Community%20%26%20education-,Digibastion,-Chirag%20Agrawal">
    <img src="https://img.shields.io/badge/Supported%20by-Ethereum%20Foundation%20ESP%202025-6366F1?style=flat-square&logo=ethereum" alt="Ethereum ESP 2025" />
  </a>
</p>

Thank you for your interest in contributing to Digibastion! This document provides guidelines and instructions to help you get started.

---

## 📋 Table of Contents

- [Why Contribute?](#-why-contribute)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Contribution Types](#-contribution-types)
  - [Adding Security Items](#adding-security-items)
  - [Adding New Categories](#adding-new-categories)
  - [Adding Tools](#adding-tools)
  - [Adding Articles](#adding-articles)
  - [Adding Threat Intelligence](#adding-threat-intelligence)
- [Code Contributions](#-code-contributions)
- [Pull Request Process](#-pull-request-process)
- [Recognition](#-recognition)

---

## 🌟 Why Contribute?

Digibastion is a **community-driven security platform** supported by the Ethereum Foundation ESP 2025 grant. By contributing, you're helping to:

- 🛡️ Make Web3 safer for everyone
- 📚 Create accessible security education
- 🔧 Build open-source security tools
- 🌍 Join a global community of security-conscious builders

**All skill levels welcome!** You don't need to be a security expert or developer to contribute.

---

## 🚀 Getting Started

### 1. Fork and Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/digibastion.git
cd digibastion
```

### 2. Install Dependencies

```bash
npm install
# or: yarn install / bun install
```

### 3. Start the Development Server

```bash
npm run dev
# Open http://localhost:8080
```

### 4. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

---

## 📁 Project Structure

```
src/
├── components/         # UI components
│   ├── ui/            # shadcn/ui components
│   ├── opsec/         # OpSec quiz components
│   ├── threat-intel/  # Threat intelligence components
│   └── security-score/ # Scoring components
├── data/               # Data files (easiest to contribute!)
│   ├── categories/     # Security checklist items
│   ├── links/          # Resource links
│   ├── tools/          # Security tools
│   └── articles.tsx    # Blog articles
├── pages/              # Page components
├── types/              # TypeScript types
└── templates/          # Contribution templates
```

---

## 🎯 Contribution Types

### Adding Security Items

Security items are the core of our checklists. To add a new security item:

**1. Find the appropriate category file in `src/data/categories/`**

**2. Add your item following this structure:**

```typescript
{
  id: 'category-X', // Use a unique ID (e.g., 'opsec-15')
  title: 'Item Title',
  priority: 'essential', // Options: 'essential', 'recommended', 'advanced'
  description: 'Description of the item',
  resources: [
    { name: 'Resource Name', url: 'https://example.com' }
  ],
  actions: [
    'Step 1 to complete this item',
    'Step 2 to complete this item'
  ],
  additionalInfo: 'Any extra information',
  threatLevels: ['basic', 'developer', 'privacy'] // Who this applies to
}
```

**3. Test your changes locally**

---

### Adding New Categories

**1. Create a new file in `src/data/categories/` (e.g., `newCategory.ts`)**

**2. Use the template in `src/templates/categoryTemplate.ts`**

**3. Register your category in `src/data/securityData.ts`**

**4. Add threat level mappings in `src/data/threatProfiles.ts`**

---

### Adding Tools

**1. Open `src/data/tools/categories.ts`**

**2. Add your tool:**

```typescript
{
  name: 'Tool Name',
  description: 'What the tool does',
  url: 'https://toolwebsite.com',
  category: 'categoryId',
  tags: ['tag1', 'tag2'],
  recommended: true // Optional: mark as recommended
}
```

---

### Adding Threat Intelligence Feeds

Want to suggest a new RSS/Atom feed source for our threat intel? See the full list of current feeds and contribution guidelines in **[THREAT_INTEL_FEEDS.md](THREAT_INTEL_FEEDS.md)**.

You can:
- **Open an issue** with the feed URL, source name, and category
- **Open a PR** adding the feed to `THREAT_INTEL_FEEDS.md`

---

### Adding Articles

**1. Open `src/data/articles.tsx`**

**2. Add your article:**

```typescript
{
  id: 'unique-slug',
  title: 'Article Title',
  summary: 'Brief description (1-2 sentences)',
  content: <YourJSXContent />,
  date: '2025-01-15',
  category: 'opsec', // e.g., 'opsec', 'wallet', 'defi'
  tags: ['security', 'tutorial']
}
```

---

## 💻 Code Contributions

For code contributions:

1. **Follow the existing code style** — We use TypeScript, React, and Tailwind CSS
2. **Use semantic tokens** — Colors should use design system variables from `index.css`
3. **Write tests when applicable** — Use Vitest + React Testing Library
4. **Update documentation** — Keep README and docs in sync

### Code Style Guidelines

```typescript
// ✅ Good: Use semantic tokens
<div className="bg-background text-foreground">

// ❌ Bad: Direct colors
<div className="bg-white text-black">
```

```typescript
// ✅ Good: Component composition
const SecurityCard = ({ title, items }) => (
  <Card className="glass-card-hover">
    <CardHeader>{title}</CardHeader>
    <CardContent>{items}</CardContent>
  </Card>
);

// ❌ Bad: Inline everything
const SecurityCard = ({ title, items }) => (
  <div style={{ background: '#fff', padding: 20 }}>
    <h2>{title}</h2>
    <ul>{items}</ul>
  </div>
);
```

---

## 📤 Pull Request Process

### Before Submitting

1. ✅ Test your changes locally with `npm run dev`
2. ✅ Run validation with `npm run validate-updates` (if applicable)
3. ✅ Ensure the build passes: `npm run build`
4. ✅ Update documentation if needed

### Submitting

1. **Push your branch**: `git push origin feature/your-feature-name`
2. **Open a Pull Request** on GitHub
3. **Fill out the PR template** with:
   - What you changed
   - Why you changed it
   - Screenshots (if visual changes)
4. **Wait for review** — We'll respond within 48 hours

### Review Criteria

All contributions will be reviewed for:

- ✅ Technical accuracy
- ✅ Code quality and style
- ✅ Security best practices
- ✅ Documentation completeness
- ✅ User experience impact

---

## 🏆 Recognition

All contributors will be:

- 📝 **Listed** in our [Contributors section](https://digibastion.com/about)
- 🎉 **Thanked** in release notes
- 💎 **Featured** for significant contributions

---

## 💬 Need Help?

- **GitHub Issues**: [Ask a question](https://github.com/Raiders0786/digibastion/issues/new)
- **GitHub Discussions**: [Start a discussion](https://github.com/Raiders0786/digibastion/discussions)
- **Telegram**: [Join our community](https://t.me/digibastion)

---

<p align="center">
  <strong>Thank you for helping make Web3 more secure for everyone! 🛡️</strong>
</p>

<p align="center">
  <em>Digibastion — Secure the Stack</em>
</p>
