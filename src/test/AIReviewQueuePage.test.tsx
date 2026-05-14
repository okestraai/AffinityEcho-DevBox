import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIReviewQueuePage } from '../admin/pages/AIReviewQueuePage';
import { renderWithRouter } from './testUtils';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', role: 'super_admin', username: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('../admin/hooks/usePermission', () => ({
  usePermission: () => ({ hasPermission: () => true, isSuperAdmin: true }),
}));

vi.mock('../Helper/ShowToast', () => ({ showToast: vi.fn() }));

vi.mock('../constants/messages', () => ({
  MSG: { ADMIN: {
    AI_REVIEW_LOAD_FAILED: 'Load failed',
    AI_REVIEW_STATS_FAILED: 'Stats failed',
    AI_REVIEW_RESOLVED: 'Resolved',
    AI_REVIEW_RESOLVE_FAILED: 'Resolve failed',
  }},
}));

vi.mock('../admin/utils/apiError', () => ({
  getApiError: (_e: unknown, f: string) => f,
}));

const mocks = vi.hoisted(() => ({
  getQueue: vi.fn(),
  getStats: vi.fn(),
  resolve: vi.fn(),
}));

vi.mock('../../api/adminApis', () => ({
  GetAIReviewQueue: mocks.getQueue,
  GetAIReviewStats: mocks.getStats,
  ResolveReviewItem: mocks.resolve,
}));

const mkItem = (overrides = {}) => ({
  id: 'review-1',
  content_type: 'feed_post',
  content_id: 'post-1',
  content_preview: 'Some flagged content here',
  content_title: null,
  author: { id: 'user-1', username: 'FreeBear5645' },
  priority: 'high',
  reason: 'high_severity_hide',
  current_state: 'hidden',
  ai_verdict: {
    verdict: 'hide', confidence: 0.87, severity: 'high',
    categories: ['harassment'],
    rationale: 'Targeted personal attack with profanity.',
    userFacingReason: 'Flagged for harassment.',
  },
  ai_payload: {
    subject: { type: 'feed_post', id: 'post-1', authorId: 'user-1', authorIsAnonymous: false, content: 'Some flagged content here', createdAt: '2026-05-14T11:05:45Z', mentions: [], attachments: [] },
    parentChain: [],
    authorSignals: { accountAgeDays: 84, priorFlagsAgainstAuthor: 0, priorRemovalsAgainstAuthor: 0, postsLast24h: 0 },
    policyVersion: '2026-05-12.v1',
  },
  available_actions: ['reverse'],
  status: 'pending',
  resolved_by: null, resolved_by_username: null,
  resolution: null, resolved_at: null,
  created_at: '2026-05-14T11:05:50Z',
  ...overrides,
});

const mkStats = () => ({
  queue: {
    pending: 8, resolved: 145,
    byPriority: { urgent: 1, high: 3, normal: 4, low: 0 },
    byState: { hidden: 5, visible: 3 },
  },
});

describe('AIReviewQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQueue.mockResolvedValue({ data: [mkItem()], pagination: { total: 1 } });
    mocks.getStats.mockResolvedValue(mkStats());
  });

  it('renders header, stats cards and queue items', async () => {
    renderWithRouter(<AIReviewQueuePage />);
    expect(screen.getByText('AI Review Queue')).toBeInTheDocument();

    await waitFor(() => { expect(screen.getByText('8')).toBeInTheDocument(); });
    expect(screen.getByText('145')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('@FreeBear5645')).toBeInTheDocument();
  });

  it('shows empty state when queue is clear', async () => {
    mocks.getQueue.mockResolvedValue({ data: [], pagination: { total: 0 } });
    renderWithRouter(<AIReviewQueuePage />);
    await waitFor(() => { expect(screen.getByText('Queue is clear')).toBeInTheDocument(); });
  });

  it('shows Reverse button for hidden items', async () => {
    renderWithRouter(<AIReviewQueuePage />);
    await waitFor(() => { expect(screen.getByText('Reverse')).toBeInTheDocument(); });
  });

  it('shows Confirm/Hide buttons for visible escalated items', async () => {
    mocks.getQueue.mockResolvedValue({
      data: [mkItem({ current_state: 'visible', ai_verdict: { verdict: 'escalate', confidence: 0.55, severity: 'medium', categories: ['advice'], rationale: 'Uncertain.', userFacingReason: null }, available_actions: ['confirm', 'hide'] })],
      pagination: { total: 1 },
    });
    renderWithRouter(<AIReviewQueuePage />);
    await waitFor(() => { expect(screen.getByText('Confirm Safe')).toBeInTheDocument(); });
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('opens resolve modal and submits', async () => {
    mocks.resolve.mockResolvedValue({ success: true });
    renderWithRouter(<AIReviewQueuePage />);
    await waitFor(() => { expect(screen.getByText('Reverse')).toBeInTheDocument(); });

    await userEvent.click(screen.getByText('Reverse'));
    await waitFor(() => { expect(screen.getByText('Reverse AI Decision')).toBeInTheDocument(); });

    const textarea = screen.getByPlaceholderText('Why are you taking this action?');
    await userEvent.type(textarea, 'Legitimate venting');
    await userEvent.click(screen.getAllByText('Reverse').at(-1)!);

    await waitFor(() => {
      expect(mocks.resolve).toHaveBeenCalledWith('review-1', { action: 'reverse', reason: 'Legitimate venting' });
    });
  });

  it('expands row to show rationale', async () => {
    renderWithRouter(<AIReviewQueuePage />);
    await waitFor(() => { expect(screen.getByText('87%')).toBeInTheDocument(); });

    await userEvent.click(screen.getByText('87%'));
    await waitFor(() => {
      expect(screen.getByText('Targeted personal attack with profanity.')).toBeInTheDocument();
    });
    expect(screen.getByText('Author Signals')).toBeInTheDocument();
    expect(screen.getByText('Account Age')).toBeInTheDocument();
    expect(screen.getByText('84d')).toBeInTheDocument();
    expect(screen.getByText('Prior Flags')).toBeInTheDocument();
  });

  it('renders tab navigation with 4 tabs', async () => {
    renderWithRouter(<AIReviewQueuePage />);
    expect(screen.getByText('Review Queue')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Disagreements')).toBeInTheDocument();
  });

  it('applies status filter', async () => {
    renderWithRouter(<AIReviewQueuePage />);
    await waitFor(() => { expect(mocks.getQueue).toHaveBeenCalled(); });

    await userEvent.selectOptions(screen.getByTitle('Filter by status'), 'resolved');
    await waitFor(() => {
      expect(mocks.getQueue).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved' }));
    });
  });
});
