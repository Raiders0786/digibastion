
# Contributing to Digibastion

We love your input! We want to make contributing to Digibastion as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Adding new security resources or tools

## Adding New Security Resources

### Resource Format
When adding new security tools or resources to our collection, please follow this format:

```typescript
{
  "title": "Tool Name",
  "url": "https://tool-url.com",
  "description": "A concise description of the tool (max 200 characters)",
  "tags": ["relevant", "tags", "here"],
  "lastReviewed": "YYYY-MM-DD",
  "active": true
}
```

### Categories
Resources are organized into categories. Current categories include:
- Application Security
- Cloud Security
- Personal Security
- Corporate & IT Security
- Cryptocurrency & Wallet Security
- Smart Contract Security
- Private Key Management
- On-Chain Monitoring
- Web3 Ecosystem Best Practices & Guides

### Adding a New Resource

1. Fork the repository
2. Navigate to `src/data/links/securityResources.ts`
3. Add your resource to the appropriate category
4. Ensure all required fields are filled out
5. Submit a Pull Request

### Resource Requirements

1. **Active Maintenance**: The resource should be actively maintained
2. **Relevance**: Must be relevant to Web3/blockchain security
3. **Quality**: Should provide significant value to the community
4. **Accessibility**: Should be accessible to the target audience

### Tags Guidelines

- Use existing tags when possible
- New tags should be:
  - Lowercase
  - Hyphen-separated if multiple words
  - Descriptive and relevant
  - Generic enough to be reusable

## Development Process

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure your code lints
4. Issue that pull request!

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## Examples

Here's an example of adding a new tool:

```typescript
{
  name: "Security Tools",
  description: "Essential security tools for Web3 development",
  tools: [
    {
      title: "New Security Tool",
      url: "https://tool-url.com",
      description: "A comprehensive security testing framework",
      tags: ["security", "testing", "web3"],
      lastReviewed: "2024-02-26",
      active: true
    }
  ]
}
```

## Questions?

Feel free to contact us or open an issue with any questions about contributing!

