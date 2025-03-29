
# Digibastion - Web3 Security Checklist

![Digibastion Logo](public/og-image.png)

Digibastion is an open-source, comprehensive Web3 security checklist designed to help users improve their personal digital security across crypto, Web3, and traditional web applications.

## Features

- 🔒 **Comprehensive Security Checklist**: Covering everything from wallet security to OS hardening
- 🎯 **Threat Profiles**: Customize security recommendations based on your specific needs
- 📊 **Security Score**: Track your progress with a personalized security score
- 📚 **Educational Resources**: Learn about security best practices with curated resources
- 🛠️ **Tool Recommendations**: Find the right tools for your security needs

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Raiders0786/digibastion.git
   cd digibastion
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:8080`

## Contributing

We welcome contributions from the community! Check out our [Contributing Guide](CONTRIBUTING.md) for detailed instructions on how to contribute.

### Quick Start for Contributors

- **Add a security item**: Add a new item to an existing category in `src/data/categories/`
- **Add a new category**: Create a new file in `src/data/categories/` using the template
- **Add a tool**: Add a new tool entry in `src/data/tools/categories.ts`
- **Add an article**: Add a new article in `src/data/articles.tsx`

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
├── templates/          # Templates for contributors
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you find this project useful, please consider supporting its development:

- Star the repository
- Share with others
- Contribute to the codebase
- [Support us directly](https://www.digibastion.com/support)

## Acknowledgments

- Thanks to all contributors who have helped make this project better
- Special thanks to the Web3 security community for valuable feedback
