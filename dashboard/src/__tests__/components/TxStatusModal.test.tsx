// dashboard/src/__tests__/components/TxStatusModal.test.tsx
import { render, screen } from '@testing-library/react';
import TxStatusModal from '../../components/TxStatusModal';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

describe('TxStatusModal', () => {
  it('renders signing phase', () => {
    render(
      <TxStatusModal
        state={{ phase: 'signing', label: 'Check-in' }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Awaiting Signature')).toBeInTheDocument();
  });

  it('renders success with signature', () => {
    render(
      <TxStatusModal
        state={{
          phase: 'success',
          signature: 'abc123xyz',
          label: 'Check-in',
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Check-in Successful')).toBeInTheDocument();
  });
});
