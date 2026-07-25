import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicLeadForm } from '@/components/features/public/lead-form';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'ok', data: { id: 'lead-1' } }),
    })
  );
});

describe('PublicLeadForm', () => {
  it('renders the honeypot field hidden from real users', () => {
    render(<PublicLeadForm />);
    const honeypot = screen.getByLabelText('Leave this field empty', { selector: 'input' });
    expect(honeypot).toHaveAttribute('tabIndex', '-1');
  });

  it('shows a validation error when the name is too short', async () => {
    const user = userEvent.setup();
    render(<PublicLeadForm />);

    await user.type(screen.getByLabelText('Full name'), 'A');
    await user.type(screen.getByLabelText('Work email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /talk to sales/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('submits successfully and shows the confirmation state', async () => {
    const user = userEvent.setup();
    render(<PublicLeadForm />);

    await user.type(screen.getByLabelText('Full name'), 'Jordan Lee');
    await user.type(screen.getByLabelText('Work email'), 'jordan@acme.com');
    await user.click(screen.getByRole('button', { name: /talk to sales/i }));

    await waitFor(() => {
      expect(screen.getByText(/message sent/i)).toBeInTheDocument();
    });
  });
});
