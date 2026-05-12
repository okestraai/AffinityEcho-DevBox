import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIDisagreementsPage } from '../admin/pages/AIDisagreementsPage';
import { renderWithRouter } from './testUtils';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', role: 'super_admin', username: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('../admin/hooks/usePermission', () => ({
  usePermission: () => ({
    hasPermission: () => true,
    isSuperAdmin: true,
  }),
}));

vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../constants/messages', () => ({
  MSG: {
    ADMIN: {
      AI_DISAGREEMENTS_LOAD_FAILED: 'Load failed',
    },
  },
}));

vi.mock('../admin/utils/apiError', () => ({
  getApiError: (_err: unknown, fallback: string) => fallback,
}));

const mocks = vi.hoisted(() => ({
  getDisagreements: vi.fn(),
}));

vi.mock('../../api/adminApis', () => ({
  GetAIDisagreements: mocks.getDisagreements,
}));

const mockDisagreement = {
  id: 'disagree-1',
  content_type: 'nook_message',
  content_id: 'msg-1',
  ai_verdict: {
    verdict: 'hide',
    confidence: 0.78,
    severity: 'medium',
    categories: ['harassment'],
    rationale: 'Message could be interpreted as a personal attack.',
    userFacingReason: 'Flagged for potential harassment.',
  },
  human_resolution: 'reverse',
  human_reason: 'Heated but legitimate workplace criticism. Not harassment.',
  resolved_by: 'admin-1',
  created_at: '2026-05-12T16:45:00Z',
};

describe('AIDisagreementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDisagreements.mockResolvedValue({ data: [mockDisagreement], pagination: { total: 1 } });
  });

  it('renders header and disagreement items', async () => {
    renderWithRouter(<AIDisagreementsPage />);
    expect(screen.getByText('AI Disagreements')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Nook message').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('reverse')).toBeInTheDocument();
  });

  it('shows empty state when no disagreements', async () => {
    mocks.getDisagreements.mockResolvedValue({ data: [], pagination: { total: 0 } });
    renderWithRouter(<AIDisagreementsPage />);

    await waitFor(() => {
      expect(screen.getByText('No disagreements found')).toBeInTheDocument();
    });
    expect(screen.getByText('AI and humans are aligned!')).toBeInTheDocument();
  });

  it('expands row to show AI vs Human detail', async () => {
    renderWithRouter(<AIDisagreementsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Nook message').length).toBeGreaterThanOrEqual(1);
    });

    // Click the confidence text (unique to table row, not in dropdowns)
    await userEvent.click(screen.getByText('78%'));

    await waitFor(() => {
      expect(screen.getByText('AI Decision')).toBeInTheDocument();
    });
    expect(screen.getByText('Human Override')).toBeInTheDocument();
    expect(screen.getByText('Message could be interpreted as a personal attack.')).toBeInTheDocument();
    expect(screen.getAllByText('Heated but legitimate workplace criticism. Not harassment.').length).toBeGreaterThanOrEqual(2);
  });

  it('renders tab navigation links', async () => {
    renderWithRouter(<AIDisagreementsPage />);

    expect(screen.getByText('Review Queue')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Disagreements')).toBeInTheDocument();
  });

  it('applies content type filter', async () => {
    renderWithRouter(<AIDisagreementsPage />);

    await waitFor(() => {
      expect(mocks.getDisagreements).toHaveBeenCalled();
    });

    const typeSelect = screen.getByTitle('Filter by content type');
    await userEvent.selectOptions(typeSelect, 'forum_topic');

    await waitFor(() => {
      expect(mocks.getDisagreements).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: 'forum_topic' }),
      );
    });
  });
});
