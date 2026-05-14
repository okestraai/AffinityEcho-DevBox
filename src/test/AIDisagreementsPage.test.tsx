import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIDisagreementsPage } from '../admin/pages/AIDisagreementsPage';
import { renderWithRouter } from './testUtils';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', role: 'super_admin', username: 'admin' },
    isAuthenticated: true, isLoading: false,
  }),
}));

vi.mock('../admin/hooks/usePermission', () => ({
  usePermission: () => ({ hasPermission: () => true, isSuperAdmin: true }),
}));

vi.mock('../Helper/ShowToast', () => ({ showToast: vi.fn() }));

vi.mock('../constants/messages', () => ({
  MSG: { ADMIN: { AI_DISAGREEMENTS_LOAD_FAILED: 'Load failed' } },
}));

vi.mock('../admin/utils/apiError', () => ({
  getApiError: (_e: unknown, f: string) => f,
}));

const mocks = vi.hoisted(() => ({
  getDisagreements: vi.fn(),
}));

vi.mock('../../api/adminApis', () => ({
  GetAIDisagreements: mocks.getDisagreements,
}));

const mkItem = () => ({
  id: 'disagree-1',
  content_type: 'feed_post',
  content_id: 'post-1',
  content_preview: 'I think you are mad and not okay...',
  content_title: null,
  author: { id: 'user-1', username: 'FreeBear5645' },
  ai_verdict: {
    verdict: 'hide', confidence: 0.87, severity: 'high',
    categories: ['harassment'],
    rationale: 'Targeted personal attack with profanity.',
  },
  human_resolution: 'reverse',
  human_reason: 'Context shows workplace frustration, not harassment.',
  reversed_by: { id: 'admin-1', username: 'AdminJohn' },
  created_at: '2026-05-14T12:30:00Z',
});

describe('AIDisagreementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDisagreements.mockResolvedValue({ data: [mkItem()], pagination: { total: 1 } });
  });

  it('renders header and disagreement items', async () => {
    renderWithRouter(<AIDisagreementsPage />);
    expect(screen.getByText('AI Disagreements')).toBeInTheDocument();

    await waitFor(() => { expect(screen.getByText('@FreeBear5645')).toBeInTheDocument(); });
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('reverse')).toBeInTheDocument();
    expect(screen.getByText('@AdminJohn')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    mocks.getDisagreements.mockResolvedValue({ data: [], pagination: { total: 0 } });
    renderWithRouter(<AIDisagreementsPage />);
    await waitFor(() => { expect(screen.getByText('No disagreements found')).toBeInTheDocument(); });
    expect(screen.getByText('AI and humans are aligned!')).toBeInTheDocument();
  });

  it('expands row to show AI vs Human detail', async () => {
    renderWithRouter(<AIDisagreementsPage />);
    await waitFor(() => { expect(screen.getByText('87%')).toBeInTheDocument(); });

    await userEvent.click(screen.getByText('87%'));
    await waitFor(() => { expect(screen.getByText('AI Decision')).toBeInTheDocument(); });
    expect(screen.getByText('Human Override')).toBeInTheDocument();
    expect(screen.getByText('Targeted personal attack with profanity.')).toBeInTheDocument();
  });

  it('renders 4 tab navigation links', async () => {
    renderWithRouter(<AIDisagreementsPage />);
    expect(screen.getByText('Review Queue')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Disagreements')).toBeInTheDocument();
  });

  it('applies content type filter', async () => {
    renderWithRouter(<AIDisagreementsPage />);
    await waitFor(() => { expect(mocks.getDisagreements).toHaveBeenCalled(); });

    await userEvent.selectOptions(screen.getByTitle('Filter by content type'), 'forum_topic');
    await waitFor(() => {
      expect(mocks.getDisagreements).toHaveBeenCalledWith(expect.objectContaining({ contentType: 'forum_topic' }));
    });
  });
});
