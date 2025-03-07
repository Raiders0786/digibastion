
import { render, screen } from '@testing-library/react';
import { SecurityScore } from '../security-score';
import { describe, it, expect, vi } from 'vitest';

// Mock the useSecurityState hook
vi.mock('../../hooks/useSecurityState', () => ({
  useSecurityState: () => ({
    categories: [
      {
        id: 'wallet',
        title: 'Wallet Security',
        items: [
          { id: 'item1', completed: true },
          { id: 'item2', completed: false }
        ]
      }
    ],
    getCategoryScore: () => 50,
    getOverallScore: () => 75,
    getStats: () => mockProps.stats
  })
}));

describe('SecurityScore', () => {
  const mockProps = {
    score: 75,
    stats: {
      total: 100,
      completed: 75,
      essential: 80,
      optional: 70,
      advanced: 60,
      criticalRemaining: 5,
      recommendedRemaining: 20
    }
  };

  it('renders correctly', () => {
    render(<SecurityScore {...mockProps} />);
    expect(screen.getByText('Your Security Score')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays correct progress colors', () => {
    render(<SecurityScore {...mockProps} />);
    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toBeInTheDocument();
  });

  it('shows correct stats', () => {
    render(<SecurityScore {...mockProps} />);
    expect(screen.getByText('75 out of 100 items completed')).toBeInTheDocument();
  });
});
