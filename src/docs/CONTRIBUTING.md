
# Contributing to Security Checklist

This document provides guidelines for contributing new security items to the checklist.

## Item Structure

Each security item should include the following metadata:

```typescript
{
  id: "category-number", // Unique ID following the format category-number (e.g., "auth-1")
  title: "Short Title", // Brief, actionable title
  description: "One-line summary", // Short description for list views
  completed: false, // Initial state is always false
  level: "essential", // One of: "essential", "recommended", "optional", "advanced"
  details: "Full explanation of the security measure", // Detailed guidance
  links: [ // Optional external resources
    { text: "Resource Name", url: "https://example.com" }
  ],
  threatLevels: ["basic", "developer"], // Which threat profiles this item applies to
  dependencies: ["auth-1"], // Optional IDs of items this one depends on
  priority: 1 // Optional priority from 1-5, with 1 being highest
}
```

## Threat Levels

Items can be associated with one or more threat profiles:

- `all`: Applies to everyone
- `basic`: General security for everyday users
- `developer`: For Web3 developers and builders 
- `privacy`: Focus on privacy and anonymity
- `highValue`: For users with significant assets
- `institution`: For organizations and DAOs

## Item Difficulty Levels

- `essential`: Critical security measures everyone should implement
- `recommended`: Important measures that provide significant security benefits
- `optional`: Additional measures for enhanced security
- `advanced`: Complex measures that may require technical expertise

## Adding New Items

1. Identify the appropriate category for your security item
2. Add your item to the corresponding category file in `src/data/categories/`
3. Follow the structure outlined above
4. Update the threat level mappings in `src/data/threatProfiles.ts`

## Writing Guidelines

- Be clear and concise
- Provide actionable guidance
- Include verification steps when applicable
- Link to trustworthy external resources
- Avoid jargon or explain technical terms
- Focus on practical advice over theory

## Review Process

All new security items will be reviewed for:

- Technical accuracy
- Clarity and actionability
- Appropriate categorization and metadata
- Relevance to the target audience

Thank you for contributing to making Web3 more secure for everyone!
