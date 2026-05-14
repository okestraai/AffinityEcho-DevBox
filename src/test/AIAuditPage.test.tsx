import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIAuditPage } from '../admin/pages/AIAuditPage';
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
  MSG: { ADMIN: {
    AI_AUDIT_LOAD_FAILED: 'Load failed',
    AI_AUDIT_DETAIL_FAILED: 'Detail failed',
  }},
}));

vi.mock('../admin/utils/apiError', () => ({
  getApiError: (_e: unknown, f: string) => f,
}));

const mocks = vi.hoisted(() => ({
  getAudit: vi.fn(),
  getHistory: vi.fn(),
}));

vi.mock('../../api/adminApis', () => ({
  GetAIAuditTrail: mocks.getAudit,
  GetAIAuditItemHistory: mocks.getHistory,
}));

const mkAudit = () => ({
  id: 'audit-1',
  content_type: 'forum_topic',
  content_id: 'topic-1',
  content_preview: 'Workplace venting about management',
  content_title: null,
  author: { id: 'user-1', username: 'AnonymousBadger' },
  moderation_status: 'allowed',
  moderation_reason: 'No policy violation.',
  moderated_by: 'ai:editorial',
  moderated_at: '2026-05-14T11:05:22Z',
  model_version: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  policy_version: '2026-05-12.v1',
  ai_confidence: 0.92,
  raw_response: { verdict: 'allow', confidence: 0.92, severity: 'none', categories: ['venting'], rationale: 'No policy violation.', userFacingReason: null },
  was_reversed: false,
  created_at: '2026-05-14T11:05:22Z',
});

describe('AIAuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAudit.mockResolvedValue({ data: [mkAudit()], pagination: { total: 1 } });
  });

  it('renders header and audit items', async () => {
    renderWithRouter(<AIAuditPage />);
    expect(screen.getByText('AI Audit Trail')).toBeInTheDocument();

    await waitFor(() => { expect(screen.getByText('@AnonymousBadger')).toBeInTheDocument(); });
    expect(screen.getByText('allowed')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('shows was_reversed badge', async () => {
    mocks.getAudit.mockResolvedValue({ data: [{ ...mkAudit(), was_reversed: true }], pagination: { total: 1 } });
    renderWithRouter(<AIAuditPage />);
    await waitFor(() => { expect(screen.getAllByText('Reversed').length).toBeGreaterThanOrEqual(2); });
  });

  it('shows empty state', async () => {
    mocks.getAudit.mockResolvedValue({ data: [], pagination: { total: 0 } });
    renderWithRouter(<AIAuditPage />);
    await waitFor(() => { expect(screen.getByText('No audit records found')).toBeInTheDocument(); });
  });

  it('opens detail modal with timeline on History click', async () => {
    mocks.getHistory.mockResolvedValue({
      content: { type: 'forum_topic', id: 'topic-1', preview: 'Workplace venting', title: null, author: { id: 'u1', username: 'AnonymousBadger' }, created_at: '2026-05-14T11:05:00Z', current_state: 'visible' },
      moderation_history: [{ action: 'allowed', by: 'ai:editorial', by_username: null, reason: 'No violation.', confidence: 0.92, at: '2026-05-14T11:05:22Z' }],
      review_history: [],
      disagreements: [],
    });
    renderWithRouter(<AIAuditPage />);
    await waitFor(() => { expect(screen.getByText('History')).toBeInTheDocument(); });

    await userEvent.click(screen.getByText('History'));
    await waitFor(() => { expect(screen.getByText('Item History')).toBeInTheDocument(); });
    expect(mocks.getHistory).toHaveBeenCalledWith('forum_topic', 'topic-1');
  });

  it('renders 4 tab navigation links', async () => {
    renderWithRouter(<AIAuditPage />);
    expect(screen.getByText('Review Queue')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('Disagreements')).toBeInTheDocument();
  });

  it('applies content type filter', async () => {
    renderWithRouter(<AIAuditPage />);
    await waitFor(() => { expect(mocks.getAudit).toHaveBeenCalled(); });

    await userEvent.selectOptions(screen.getByTitle('Filter by content type'), 'feed_post');
    await waitFor(() => {
      expect(mocks.getAudit).toHaveBeenCalledWith(expect.objectContaining({ contentType: 'feed_post' }));
    });
  });

  it('applies status filter', async () => {
    renderWithRouter(<AIAuditPage />);
    await waitFor(() => { expect(mocks.getAudit).toHaveBeenCalled(); });

    await userEvent.selectOptions(screen.getByTitle('Filter by status'), 'hidden');
    await waitFor(() => {
      expect(mocks.getAudit).toHaveBeenCalledWith(expect.objectContaining({ status: 'hidden' }));
    });
  });
});
