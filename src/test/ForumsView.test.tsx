import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForumsView } from '../components/dashboard/Forum/ForumsView';
import { renderWithRouter, mockUser } from './testUtils';

// ── Mock hooks ───────────────────────────────────────────
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// ── Mock API modules ─────────────────────────────────────
vi.mock('../../api/forumApis', () => ({
  GetLocalScopeMetrics: vi.fn(),
  GetGlobalScopeMetrics: vi.fn(),
  GetRecentDiscussions: vi.fn(),
  GetFoundationForums: vi.fn(),
  GetUserJoinedForums: vi.fn(),
  ForumTopicsReactions: vi.fn(),
  CreateForumTopicsComments: vi.fn(),
}));

vi.mock('../../api/EncrytionApis', () => ({
  DecryptData: vi.fn(),
}));

// ── Mock child components to keep tests focused ──────────
vi.mock('../components/dashboard/Forum/OverviewMode', () => ({
  OverviewMode: (props: any) => (
    <div data-testid="overview-mode">
      <span data-testid="search-term">{props.searchTerm}</span>
      <button data-testid="set-search" onClick={() => props.setSearchTerm('test query')}>Search</button>
      <button data-testid="select-company" onClick={() => props.handleCompanySelect('Acme')}>Select Company</button>
      <button data-testid="select-forum" onClick={() => props.handleForumSelect('f1')}>Select Forum</button>
      <button data-testid="view-global" onClick={props.handleViewAllGlobalForums}>View Global</button>
      <span data-testid="view-mode">{props.viewMode}</span>
      <span data-testid="initial-loading">{String(props.initialLoading)}</span>
    </div>
  ),
}));

vi.mock('../components/dashboard/Forum/CompanyMode', () => ({
  CompanyMode: (props: any) => (
    <div data-testid="company-mode">
      <button data-testid="back-overview" onClick={props.handleBackToOverview}>Back</button>
    </div>
  ),
}));

vi.mock('../components/dashboard/Forum/ForumTopicsMode', () => ({
  ForumTopicsMode: (props: any) => <div data-testid="forum-topics-mode" />,
}));

vi.mock('../components/dashboard/Forum/ForumDetailView', () => ({
  ForumDetailView: (props: any) => (
    <div data-testid="forum-detail-view">
      <span>{props.forum?.name}</span>
      <button data-testid="forum-back" onClick={props.onBack}>Back</button>
    </div>
  ),
}));

vi.mock('../Helper/SkeletonLoader', () => ({
  ForumViewSkeleton: () => <div data-testid="forum-skeleton">Loading...</div>,
}));

vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../constants/messages', () => ({
  MSG: {
    FORUM: { REACTION_FAILED: 'Reaction failed', COMMENT_POSTED: 'Posted', CREATE_COMMENT_FAILED: 'Failed', COMMENT_EMPTY: 'Empty' },
    FEED: { COMMENT_EMPTY: 'Empty' },
  },
}));

// ── Imports after mocks ──────────────────────────────────
import { useAuth } from '../hooks/useAuth';
import {
  GetGlobalScopeMetrics,
  GetLocalScopeMetrics,
  GetFoundationForums,
  GetUserJoinedForums,
  GetRecentDiscussions,
} from '../../api/forumApis';
import { DecryptData } from '../../api/EncrytionApis';

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetGlobal = vi.mocked(GetGlobalScopeMetrics);
const mockedGetLocal = vi.mocked(GetLocalScopeMetrics);
const mockedGetFoundation = vi.mocked(GetFoundationForums);
const mockedGetJoined = vi.mocked(GetUserJoinedForums);
const mockedGetDiscussions = vi.mocked(GetRecentDiscussions);
const mockedDecrypt = vi.mocked(DecryptData);

function setupDefaultMocks() {
  mockedUseAuth.mockReturnValue({
    user: { ...mockUser, company_encrypted: 'enc123', company_type: 'tech' },
  } as any);
  mockedDecrypt.mockResolvedValue({ decryptedData: 'Acme' });
  mockedGetGlobal.mockResolvedValue({ forums: [{ id: 'gf1', name: 'Global Forum', icon: '🌍' }] });
  mockedGetLocal.mockResolvedValue({ totalTopics: 5 });
  mockedGetFoundation.mockResolvedValue({ forums: [{ id: 'ff1', name: 'Foundation Forum' }] });
  mockedGetJoined.mockResolvedValue({ forums: [] });
  mockedGetDiscussions.mockResolvedValue({ topics: [] });
}

describe('ForumsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('shows skeleton while loading', () => {
    // Make API calls never resolve
    mockedGetGlobal.mockReturnValue(new Promise(() => {}));
    renderWithRouter(<ForumsView />);
    expect(screen.getByTestId('forum-skeleton')).toBeInTheDocument();
  });

  it('renders overview mode after loading', async () => {
    renderWithRouter(<ForumsView />);
    await waitFor(() => {
      expect(screen.getByTestId('overview-mode')).toBeInTheDocument();
    });
  });

  it('shows error state and retry button on API failure', async () => {
    mockedGetGlobal.mockRejectedValue(new Error('Network error'));
    renderWithRouter(<ForumsView />);
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('decrypts company name on mount', async () => {
    renderWithRouter(<ForumsView />);
    await waitFor(() => {
      expect(mockedDecrypt).toHaveBeenCalledWith({ encryptedData: 'enc123' });
    });
  });

  it('fetches global and local data after company name is resolved', async () => {
    renderWithRouter(<ForumsView />);
    await waitFor(() => {
      expect(mockedGetGlobal).toHaveBeenCalled();
      expect(mockedGetLocal).toHaveBeenCalledWith('Acme');
      expect(mockedGetFoundation).toHaveBeenCalledWith('Acme');
    });
  });

  it('handles user without company_encrypted', async () => {
    mockedUseAuth.mockReturnValue({
      user: { ...mockUser },
    } as any);
    renderWithRouter(<ForumsView />);
    await waitFor(() => {
      expect(screen.getByTestId('overview-mode')).toBeInTheDocument();
    });
    // Should not try to decrypt
    expect(mockedDecrypt).not.toHaveBeenCalled();
  });

  it('uses "Others" as company name when company_type is "other"', async () => {
    mockedUseAuth.mockReturnValue({
      user: { ...mockUser, company_encrypted: 'enc123', company_type: 'other' },
    } as any);
    renderWithRouter(<ForumsView />);
    await waitFor(() => {
      expect(mockedGetLocal).toHaveBeenCalledWith('Others');
    });
  });

  it('switches to company mode when company is selected', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForumsView />);
    await waitFor(() => {
      expect(screen.getByTestId('overview-mode')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('select-company'));
    await waitFor(() => {
      expect(screen.getByTestId('company-mode')).toBeInTheDocument();
    });
  });

  it('switches to global mode when view global is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForumsView />);
    await waitFor(() => {
      expect(screen.getByTestId('overview-mode')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('view-global'));
    await waitFor(() => {
      expect(screen.getByTestId('forum-topics-mode')).toBeInTheDocument();
    });
  });

  it('switches to forum detail view when forum is selected', async () => {
    // Need a global forum with matching id 'f1'
    mockedGetGlobal.mockResolvedValue({
      forums: [{ id: 'f1', name: 'Test Forum', icon: '💬' }],
    });
    const user = userEvent.setup();
    renderWithRouter(<ForumsView />);
    await waitFor(() => {
      expect(screen.getByTestId('overview-mode')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('select-forum'));
    await waitFor(() => {
      expect(screen.getByTestId('forum-detail-view')).toBeInTheDocument();
    });
    expect(screen.getByText('Test Forum')).toBeInTheDocument();
  });

  it('returns to overview from company mode', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForumsView />);
    await waitFor(() => {
      expect(screen.getByTestId('overview-mode')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('select-company'));
    await waitFor(() => {
      expect(screen.getByTestId('company-mode')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('back-overview'));
    await waitFor(() => {
      expect(screen.getByTestId('overview-mode')).toBeInTheDocument();
    });
  });
});
