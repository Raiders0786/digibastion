
# Contributing to Digibastion

We love your input! We want to make contributing to Digibastion as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Adding new security tools and resources
- Contributing blog articles
- Enhancing security checklists
- Becoming a maintainer

## Adding New Security Resources

### Resource Format
When adding new security tools or resources to our collection, please follow this format:

```json
{
  "title": "Tool Name",
  "url": "https://tool-url.com",
  "description": "A concise description of the tool (max 200 characters)",
  "tags": ["relevant", "tags", "here"],
  "lastReviewed": "YYYY-MM-DD",
  "active": true
}
```

### Adding a New Resource

1. Fork the repository
2. Navigate to `src/data/links/json/` and find the appropriate category file
3. Add your resource to the JSON file
4. Ensure all required fields are filled out
5. Submit a Pull Request

### Resource Requirements

1. **Active Maintenance**: The resource should be actively maintained
2. **Relevance**: Must be relevant to digital and/or Web3 security
3. **Quality**: Should provide significant value to the community
4. **Accessibility**: Should be accessible to the target audience

### Tags Guidelines

- Use existing tags when possible
- New tags should be:
  - Lowercase
  - Hyphen-separated if multiple words
  - Descriptive and relevant
  - Generic enough to be reusable

## Contributing Blog Articles

We welcome contributions to our blog section. To contribute an article:

1. Fork the repository
2. Create a new JSON file in the `src/data/articles/json` directory
3. Follow the article format structure
4. Add your article metadata to the index file
5. Submit a Pull Request

### Article Format

Articles should be informative, well-researched, and provide actionable insights related to digital security. The format should include:

- Title
- Category
- Read time
- Content sections (introduction, main content, conclusion)

## Contributing to Security Checklists

Our security checklists are a core part of Digibastion. To enhance existing checklists or add new ones:

1. Review the current checklists in `src/data/checklists/`
2. Identify gaps or outdated information
3. Fork the repository
4. Make your changes to the appropriate JSON file
5. Submit a Pull Request with a clear explanation of the additions or changes

## Detailed Contribution Guide

For step-by-step instructions on how to contribute without coding experience, please see our [Contributor's Guide](./CONTRIBUTORS_GUIDE.md).

## Development Process

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure your code lints
4. Issue that pull request!

## Support Us

Your contributions help us maintain and improve Digibastion. If you'd like to support us financially, we accept donations in various cryptocurrencies:

Visit our [Support Page](https://digibastion.com/support) to contribute via Ethereum, BSC, Optimism, Polygon, Base, and other networks.
or reach out to discuss at **raiders@digibastion.com**

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## Questions?

Feel free to contact us or open an issue with any questions about contributing!
