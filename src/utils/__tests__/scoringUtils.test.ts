import { describe, it, expect } from 'vitest';
import { calculatePercentage, calculateSecurityStats, getRelevantItems } from '../scoringUtils';
import { SecurityCategory, SecurityItem } from '../../types/security';

describe('calculatePercentage', () => {
  it('returns 0 for zero total (no NaN)', () => {
    expect(calculatePercentage(0, 0)).toBe(0);
  });

  it('calculates correct percentage', () => {
    expect(calculatePercentage(75, 100)).toBe(75);
    expect(calculatePercentage(1, 3)).toBe(33);
  });

  it('returns 100 for complete', () => {
    expect(calculatePercentage(10, 10)).toBe(100);
  });
});

describe('getRelevantItems', () => {
  const mockCategory: SecurityCategory = {
    id: 'test',
    title: 'Test Category',
    icon: 'Shield',
    description: 'Test',
    items: [
      { id: 'item1', title: 'Item 1', description: '', level: 'essential', completed: false },
      { id: 'item2', title: 'Item 2', description: '', level: 'recommended', completed: true },
      { id: 'item3', title: 'Item 3', description: '', level: 'advanced', completed: false },
    ] as SecurityItem[],
  } as SecurityCategory;

  it('returns all items for "all" threat level', () => {
    const items = getRelevantItems(mockCategory, 'all');
    expect(items).toHaveLength(3);
  });
});

describe('calculateSecurityStats', () => {
  const mockCategories: SecurityCategory[] = [
    {
      id: 'cat1',
      title: 'Cat 1',
      icon: 'Shield',
      description: 'Test',
      items: [
        { id: 'a', title: 'A', description: '', level: 'essential', completed: true },
        { id: 'b', title: 'B', description: '', level: 'essential', completed: false },
        { id: 'c', title: 'C', description: '', level: 'recommended', completed: false },
      ] as SecurityItem[],
    } as SecurityCategory,
  ];

  it('aggregates total and completed across categories', () => {
    const stats = calculateSecurityStats(mockCategories, 'all');
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(1);
  });

  it('counts critical remaining correctly', () => {
    const stats = calculateSecurityStats(mockCategories, 'all');
    expect(stats.criticalRemaining).toBe(1); // 1 incomplete essential
  });

  it('counts recommended remaining correctly', () => {
    const stats = calculateSecurityStats(mockCategories, 'all');
    expect(stats.recommendedRemaining).toBe(1); // 1 incomplete recommended
  });

  it('handles empty categories array', () => {
    const stats = calculateSecurityStats([], 'all');
    expect(stats.total).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.essential).toBe(0);
  });
});
