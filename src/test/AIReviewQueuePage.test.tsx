import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIReviewQueuePage } from '../admin/pages/AIReviewQueuePage';
import { renderWithRouter } from './testUtils';

// ── Mock hooks ───────────────────────────────────────────
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
      AI_REVIEW_LOAD_FAILED: 'Load failed',
      AI_REVIEW_STATS_FAILED: 'Stats failed',
      AI_REVIEW_CLAIMED: 'Claimed',
      AI_REVIEW_CLAIM_FAILED: 'Claim failed',
      AI_REVIEW_RESOLVED: 'Resolved',
      AI_REVIEW_RESOLVE_FAILED: 'Resolve failed',
    },
  },
}));

vi.mock('../admin/utils/apiError', () => ({
  getApiError: (_err: unknown, fallback: string) => fallback,
}));

const mocks = vi.hoisted(() => ({
  getQueue: vi.fn(),
  getStats: vi.fn(),
  claim: vi.fn(),
  resolve: vi.fn(),
}));

vi.mock('../../api/adminApis', () => ({
  GetAIReviewQueue: mocks.getQueue,
  GetAIReviewStats: mocks.getStats,
  ClaimReviewItem: mocks.claim,
  ResolveReviewItem: mocks.resolve,
}));

const mockReviewItem = {
  id: 'review-1',
  content_type: 'feed_post',
  content_id: 'post-1',
  priority: 'high',
  reason: 'high_severity_hide',
  ai_verdict: {
    verdict: 'hide',
    confidence: 0.85,
    severity: 'high',
    categories: ['harassment'],
    rationale: 'Targeted harassment detected.',
    userFacingReason: 'Flagged for harassment.',
  },
  ai_payload: {
    subject: {
      type: 'feed_post',
      id: 'post-1',
      authorId: 'user-1',
      authorIsAnonymous: false,
      content: 'Some flagged content here',
      createdAt: '2026-05-12T14:00:00Z',
    },
    parentChain: [],
    container: null,
    authorSignals: {
      accountAgeDays: 10,
      priorFlagsAgainstAuthor: 2,
      priorRemovalsAgainstAuthor: 0,
      postsLast24h: 5,
    },
    policyVersion: '2026-05-12.v1',
  },
  current_state: 'hidden',
  status: 'pending',
  claimed_by: null,
  claimed_by_username: null,
  resolved_by: null,
  resolved_by_username: null,
  resolution: null,
  resolution_reason: null,
  resolved_at: null,
  created_at: '2026-05-12T14:02:15Z',
};

const mockStats = {
  queue: { pending: 23, claimed: 3, resolved: 412, byPriority: { urgent: 1, high: 5, normal: 14, low: 3 } },
  aiPerformance: { totalDecisions: 8547, verdictDistribution: { allowed: 7200, hidden: 890, removed: 45, pending_review: 412 }, reversalRate: '4.2%', totalDisagreements: 17 },
};

describe('AIReviewQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQueue.mockResolvedValue({ data: [mockReviewItem], pagination: { total: 1 } });
    mocks.getStats.mockResolvedValue(mockStats);
  });

  it('renders header and stats cards', async () => {
    renderWithRouter(<AIReviewQueuePage />);
    expect(screen.getByText('AI Review Queue')).toBeInTheDocument();

    await waitFor(() => {
      // Stats values that are unique to the stats cards
      expect(screen.getByText('23')).toBeInTheDocument();
    });
    expect(screen.getByText('4.2%')).toBeInTheDocument();
    expect(screen.getByText('8,547')).toBeInTheDocument();
  });

  it('renders review queue items in table', async () => {
    renderWithRouter(<AIReviewQueuePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Feed post').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('harassment')).toBeInTheDocument();
  });

  it('shows empty state when queue is clear', async () => {
    mocks.getQueue.mockResolvedValue({ data: [], pagination: { total: 0 } });
    renderWithRouter(<AIReviewQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('Queue is clear')).toBeInTheDocument();
    });
  });

  it('shows Claim button for pending items', async () => {
    renderWithRouter(<AIReviewQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('Claim')).toBeInTheDocument();
    });
  });

  it('calls ClaimReviewItem when Claim is clicked', async () => {
    mocks.claim.mockResolvedValue({ success: true });
    renderWithRouter(<AIReviewQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('Claim')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Claim'));

    await waitFor(() => {
      expect(mocks.claim).toHaveBeenCalledWith('review-1');
    });
  });

  it('shows Resolve button for claimed items', async () => {
    mocks.getQueue.mockResolvedValue({
      data: [{ ...mockReviewItem, status: 'claimed', claimed_by: 'admin-1', claimed_by_username: 'admin' }],
      pagination: { total: 1 },
    });
    renderWithRouter(<AIReviewQueuePage />);

    await waitFor(() => {
      // The Resolve button in the actions column (not the tab)
      const resolveButtons = screen.getAllByText('Resolve');
      expect(resolveButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens resolve modal when Resolve action is clicked', async () => {
    mocks.getQueue.mockResolvedValue({
      data: [{ ...mockReviewItem, status: 'claimed', claimed_by: 'admin-1', claimed_by_username: 'admin' }],
      pagination: { total: 1 },
    });
    renderWithRouter(<AIReviewQueuePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Resolve').length).toBeGreaterThanOrEqual(1);
    });

    // Click the first Resolve button (the action button, not the modal button)
    const resolveButtons = screen.getAllByText('Resolve');
    await userEvent.click(resolveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Resolve Review Item')).toBeInTheDocument();
    });
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Reverse')).toBeInTheDocument();
    expect(screen.getByText('Modify')).toBeInTheDocument();
  });

  it('expands row to show detail when clicked', async () => {
    renderWithRouter(<AIReviewQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    // Click the confidence text (unique to table row, not in dropdowns)
    await userEvent.click(screen.getByText('85%'));

    await waitFor(() => {
      expect(screen.getByText('Targeted harassment detected.')).toBeInTheDocument();
    });
    expect(screen.getByText('Some flagged content here')).toBeInTheDocument();
    expect(screen.getByText('Account Age')).toBeInTheDocument();
  });

  it('renders tab navigation links', async () => {
    renderWithRouter(<AIReviewQueuePage />);

    expect(screen.getByText('Review Queue')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Disagreements')).toBeInTheDocument();
  });

  it('applies status filter', async () => {
    renderWithRouter(<AIReviewQueuePage />);

    await waitFor(() => {
      expect(mocks.getQueue).toHaveBeenCalled();
    });

    const statusSelect = screen.getByTitle('Filter by status');
    await userEvent.selectOptions(statusSelect, 'claimed');

    await waitFor(() => {
      expect(mocks.getQueue).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'claimed' }),
      );
    });
  });
});
