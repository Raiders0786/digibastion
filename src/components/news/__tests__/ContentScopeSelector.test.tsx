// @vitest-environment jsdom

import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { ThreatIntelScope } from '@/types/news';
import { ContentScopeSelector } from '@/components/news/ContentScopeSelector';

function Harness() {
  const [scope, setScope] = useState<ThreatIntelScope>('all');
  return (
    <ContentScopeSelector
      value={scope}
      onChange={setScope}
      label="Content coverage"
      showDescription
      idPrefix="test-scope"
    />
  );
}

describe('ContentScopeSelector', () => {
  it('exposes a labelled pressed state and changes scope without a dropdown', () => {
    render(<Harness />);

    const group = screen.getByRole('group', { name: 'Content coverage' });
    const all = screen.getByRole('button', { name: 'All Intelligence' });
    const incidents = screen.getByRole('button', { name: 'Web3 Incidents' });

    expect(group).not.toBeNull();
    expect(all.getAttribute('aria-pressed')).toBe('true');
    expect(incidents.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('News, advisories, disclosures, and published incidents.')).not.toBeNull();

    fireEvent.click(incidents);

    expect(all.getAttribute('aria-pressed')).toBe('false');
    expect(incidents.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Verified and preliminary Web3 exploits, hacks, and security incidents.')).not.toBeNull();
  });
});
