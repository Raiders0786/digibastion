
# Contributing to Digibastion

We love your input! We want to make contributing to Digibastion as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Adding new security categories or checklist items

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Adding New Security Categories

1. Create a new file in `src/data/categories/` with your category name
2. Follow the `SecurityCategory` type structure:

```typescript
export interface SecurityCategory {
  id: string;           // Unique identifier
  title: string;        // Display name
  description: string;  // Short description
  icon: string;         // Icon name from lucide-react
  items: SecurityItem[];
}

export interface SecurityItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  level: 'essential' | 'recommended' | 'optional';
  details: string;
  links?: { text: string; url: string }[];
}
```

3. Add your category to `src/data/securityData.ts`

## Testing

Run the test suite:

```bash
npm test
```

### Writing Tests

- Place tests in the `__tests__` directory next to the component
- Follow the naming convention: `ComponentName.test.tsx`
- Use React Testing Library for component tests
- Write meaningful test descriptions

Example test:
```typescript
import { render, screen } from '@testing-library/react';
import { SecurityCard } from './SecurityCard';

describe('SecurityCard', () => {
  it('renders correctly', () => {
    const category = {
      id: 'test',
      title: 'Test Category',
      description: 'Test Description',
      items: []
    };
    
    render(<SecurityCard category={category} />);
    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });
});
```

## Commit Message Format

We follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance tasks

Example:
```
feat(categories): add crypto wallet security checklist

Added new category for cryptocurrency wallet security with essential,
recommended, and optional tasks.

Closes #123
```

## License

By contributing, you agree that your contributions will be licensed under its MIT License with Commons Clause.

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Questions?

Feel free to contact raiders@securequest.dev with any questions about contributing.
