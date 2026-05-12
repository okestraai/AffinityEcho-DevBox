import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIAuditPage } from '../admin/pages/AIAuditPage';
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
      AI_AUDIT_LOAD_FAILED: 'Load failed',
      AI_AUDIT_DETAIL_FAILED: 'Detail failed',
    },
  },
}));

vi.mock('../admin/utils/apiError', () => ({
  getApiError: (_err: unknown, fallback: string) => fallback,
}));

const mocks = vi.hoisted(() => ({
  getAudit: vi.fn(),
  getHistory: vi.fn(),
}));

vi.mock('../../api/adminApis', () => ({
  GetAIAuditTrail: mocks.getAudit,
  GetAIAuditItemHistory: mocks.getHistory,
}));

const mockAuditItem = {
  id: 'audit-1',
  content_type: 'forum_topic',
  content_id: 'topic-1',
  moderation_status: 'allowed',
  moderation_reason: 'No policy violation detected.',
  reports_count: 0,
  moderated_by: 'ai:editorial',
  moderated_at: '2026-05-12T14:05:22Z',
  model_version: 'llama-3.1-8b-instruct-turbo',
  policy_version: '2026-05-12.v1',
  raw_response: {
    verdict: 'allow',
    confidence: 0.92,
    severity: 'none',
    categories: ['venting'],
    rationale: 'No policy violation detected.',
    userFacingReason: null,
  },
  ai_confidence: 0.92,
  created_at: '2026-05-12T14:05:22Z',
  updated_at: '2026-05-12T14:05:22Z',
};

describe('AIAuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAudit.mockResolvedValue({ data: [mockAuditItem], pagination: { total: 1 } });
  });

  it('renders header and audit items', async () => {
    renderWithRouter(<AIAuditPage />);
    expect(screen.getByText('AI Audit Trail')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Forum topic').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('allowed')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('AI: editorial')).toBeInTheDocument();
    expect(screen.getByText('llama-3.1-8b-instruct-turbo')).toBeInTheDocument();
  });

  it('shows empty state when no records', async () => {
    mocks.getAudit.mockResolvedValue({ data: [], pagination: { total: 0 } });
    renderWithRouter(<AIAuditPage />);

    await waitFor(() => {
      expect(screen.getByText('No audit records found')).toBeInTheDocument();
    });
  });

  it('opens detail modal on History click', async () => {
    mocks.getHistory.mockResolvedValue({
      moderation: [mockAuditItem],
      reviews: [],
      disagreements: [],
    });
    renderWithRouter(<AIAuditPage />);

    await waitFor(() => {
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('History'));

    await waitFor(() => {
      expect(screen.getByText('Item History')).toBeInTheDocument();
    });
    expect(screen.getByText('Moderation History')).toBeInTheDocument();
    expect(mocks.getHistory).toHaveBeenCalledWith('forum_topic', 'topic-1');
  });

  it('renders tab navigation links', async () => {
    renderWithRouter(<AIAuditPage />);

    expect(screen.getByText('Review Queue')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Disagreements')).toBeInTheDocument();
  });

  it('applies content type filter', async () => {
    renderWithRouter(<AIAuditPage />);

    await waitFor(() => {
      expect(mocks.getAudit).toHaveBeenCalled();
    });

    const typeSelect = screen.getByTitle('Filter by content type');
    await userEvent.selectOptions(typeSelect, 'feed_post');

    await waitFor(() => {
      expect(mocks.getAudit).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: 'feed_post' }),
      );
    });
  });
});
