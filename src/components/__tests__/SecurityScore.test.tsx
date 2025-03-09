
import { render, screen } from '@testing-library/react';
import { SecurityScore } from '../SecurityScore';
import { describe, it, expect, vi } from 'vitest';
import { useSecurityState } from '../../hooks/useSecurityState';

// Mock the useSecurityState hook
vi.mock('../../hooks/useSecurityState', () => ({
  useSecurityState: () => ({
    categories: [],
    threatLevel: 'all'
  })
}));

// Mock the child components
vi.mock('../security-score/ScoreOverview', () => ({
  ScoreOverview: () => <div data-testid="score-overview">Score Overview Mock</div>
}));

vi.mock('../security-score/ScoreCircles', () => ({
  ScoreCircles: () => <div data-testid="score-circles">Score Circles Mock</div>
}));

vi.mock('../security-score/SecurityTips', () => ({
  SecurityTips: () => <div data-testid="security-tips">Security Tips Mock</div>
}));

vi.mock('../security-score/CategoryOverview', () => ({
  CategoryOverview: () => <div data-testid="category-overview">Category Overview Mock</div>
}));

vi.mock('../security-score/SummaryCards', () => ({
  SummaryCards: () => <div data-testid="summary-cards">Summary Cards Mock</div>
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
    expect(screen.getByTestId('score-overview')).toBeInTheDocument();
    expect(screen.getByTestId('score-circles')).toBeInTheDocument();
    expect(screen.getByTestId('security-tips')).toBeInTheDocument();
    expect(screen.getByTestId('category-overview')).toBeInTheDocument();
    expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
  });
});
