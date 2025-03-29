
# Contributing to Digibastion

Thank you for your interest in contributing to Digibastion! This document provides guidelines and instructions to help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Adding New Security Items](#adding-new-security-items)
- [Adding New Categories](#adding-new-categories)
- [Adding Tools](#adding-tools)
- [Adding Articles](#adding-articles)
- [Updating Existing Content](#updating-existing-content)
- [Contributing to the Codebase](#contributing-to-the-codebase)
- [Pull Request Process](#pull-request-process)

## Getting Started

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/digibastion.git
   cd digibastion
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/         # UI components
├── data/               # Data files
│   ├── categories/     # Security category definitions
│   ├── links/          # Resource links
│   ├── articles.tsx    # Blog articles
│   ├── securityData.ts # Main security data
│   ├── threatProfiles.ts # Threat profile definitions
├── hooks/              # React hooks
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
```

## Adding New Security Items

Security items are organized by categories. To add a new security item:

1. Find the appropriate category file in `src/data/categories/`
2. Add your item following the existing pattern:

```typescript
{
  id: 'category-X', // Use a unique ID
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
  additionalInfo: 'Any extra information'
}
```

## Adding New Categories

To add a new security category:

1. Create a new file in `src/data/categories/` (e.g., `newCategory.ts`)
2. Use the template file structure provided in `src/templates/categoryTemplate.ts`
3. Add your category to `src/data/securityData.ts`
4. Create threat level mappings in `src/data/threatProfiles.ts`

## Adding Tools

To add new security tools:

1. Open `src/data/tools/categories.ts`
2. Add your tool to the appropriate category following the existing pattern:

```typescript
{
  name: 'Tool Name',
  description: 'Tool description',
  url: 'https://toolwebsite.com',
  category: 'categoryId',
  tags: ['tag1', 'tag2']
}
```

## Adding Articles

To add a new article:

1. Open `src/data/articles.tsx`
2. Add your article following the existing pattern:

```typescript
{
  id: 'unique-slug',
  title: 'Article Title',
  summary: 'Brief description',
  content: <ReactNode>, // JSX content
  date: '2023-01-01',
  category: 'category',
  tags: ['tag1', 'tag2']
}
```

## Updating Existing Content

To update or improve existing content:

1. **For security items**: Locate the item in the appropriate category file in `src/data/categories/`
2. **For tools**: Find the tool in `src/data/links/categories/`
3. **For articles**: Locate the article in `src/data/articles.tsx`

When updating content:
- Preserve the existing ID values to maintain references
- Ensure your changes follow the established data structure
- Run validation with `npm run validate-updates` to check for common issues
- Test your changes in the UI before submitting

For detailed guidance on updating specific types of content, see [src/docs/UPDATING_CONTENT.md](src/docs/UPDATING_CONTENT.md).

## Contributing to the Codebase

For code contributions:

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Follow the code style of the project
3. Write or update tests as necessary
4. Update documentation as needed
5. Submit a pull request

## Pull Request Process

1. Ensure your code passes all tests
2. Update the README.md if necessary
3. The PR should work for all supported browsers

Thank you for contributing to make the web3 space more secure for everyone!
