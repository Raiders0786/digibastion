// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuickSubscribeCard } from '@/components/newsletter/QuickSubscribeCard';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    rpc: vi.fn().mockResolvedValue({ data: { count: 10, label: '10+ security professionals' }, error: null }),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

afterEach(cleanup);

describe('QuickSubscribeCard', () => {
  it('offers a sample email instead of a subscriber count', async () => {
    render(<MemoryRouter><QuickSubscribeCard /></MemoryRouter>);

    expect(screen.queryByText(/security professionals/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'See a sample email' }));
    expect(await screen.findByRole('dialog', { name: 'Email Preview' })).not.toBeNull();
  });
});
