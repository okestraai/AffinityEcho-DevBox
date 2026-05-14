import { screen, waitFor } from '@testing-library/react';
import { AIStatsPage } from '../admin/pages/AIStatsPage';
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
  MSG: { ADMIN: { AI_STATS_LOAD_FAILED: 'Stats load failed' } },
}));

vi.mock('../admin/utils/apiError', () => ({
  getApiError: (_e: unknown, f: string) => f,
}));

const mocks = vi.hoisted(() => ({
  getStats: vi.fn(),
}));

vi.mock('../../api/adminApis', () => ({
  GetAIModerationStats: mocks.getStats,
}));

const mkStats = () => ({
  totalDecisions: 1247,
  verdictDistribution: { allowed: 1050, hidden: 156, pending_review: 38, removed: 3 },
  averageConfidence: 0.86,
  hiddenByCategory: { harassment: 72, spam: 45, hate_speech: 18 },
  reversals: { total: 12, reversalRate: '7.7%' },
  reviewQueue: { pending: 8, resolvedToday: 14 },
  contentTypeBreakdown: { feed_post: 420, feed_comment: 380, forum_topic: 150 },
});

describe('AIStatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStats.mockResolvedValue(mkStats());
  });

  it('renders header and stats cards', async () => {
    renderWithRouter(<AIStatsPage />);
    expect(screen.getByText('AI Stats')).toBeInTheDocument();

    await waitFor(() => { expect(screen.getByText('1,247')).toBeInTheDocument(); });
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('7.7%')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders verdict distribution bars', async () => {
    renderWithRouter(<AIStatsPage />);
    await waitFor(() => { expect(screen.getByText('Verdict Distribution')).toBeInTheDocument(); });
    expect(screen.getByText('Allowed')).toBeInTheDocument();
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });

  it('renders hidden by category bars', async () => {
    renderWithRouter(<AIStatsPage />);
    await waitFor(() => { expect(screen.getByText('Hidden by Category')).toBeInTheDocument(); });
    expect(screen.getByText('harassment')).toBeInTheDocument();
    expect(screen.getByText('spam')).toBeInTheDocument();
  });

  it('renders content type breakdown', async () => {
    renderWithRouter(<AIStatsPage />);
    await waitFor(() => { expect(screen.getByText('Decisions by Content Type')).toBeInTheDocument(); });
    expect(screen.getByText('Feed post')).toBeInTheDocument();
    expect(screen.getByText('420')).toBeInTheDocument();
  });

  it('renders 4 tab navigation links', async () => {
    renderWithRouter(<AIStatsPage />);
    expect(screen.getByText('Review Queue')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Disagreements')).toBeInTheDocument();
  });

  it('shows no data message when stats is null', async () => {
    mocks.getStats.mockRejectedValue(new Error('fail'));
    renderWithRouter(<AIStatsPage />);
    await waitFor(() => { expect(screen.getByText('No data available')).toBeInTheDocument(); });
  });
});
