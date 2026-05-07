import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForumDetailView } from '../components/dashboard/Forum/ForumDetailView';
import { renderWithRouter, mockUser } from './testUtils';

// ── Mock hooks ───────────────────────────────────────────
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// ── Mock router ──────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ── Mock API modules ─────────────────────────────────────
vi.mock('../../api/forumApis', () => ({
  GetForumById: vi.fn(),
  UserJoinForum: vi.fn(),
  UserLeaveForum: vi.fn(),
  GetUserJoinedForums: vi.fn(),
}));

vi.mock('../../api/EncrytionApis', () => ({
  DecryptData: vi.fn(),
}));

vi.mock('../utils/forumUtils', () => ({
  formatLastActivity: vi.fn(() => '5m ago'),
  transformTopicFromAPI: vi.fn((t: any) => ({
    id: t.id,
    title: t.title,
    content: t.content,
    author: { id: t.user_id, username: t.user_profile?.username || 'Anon', avatar: '👤', display_name: t.user_profile?.display_name },
    user_id: t.user_id,
    forumId: t.forum_id,
    tags: t.tags || [],
    reactions: t.reactions || { seen: 0, validated: 0, inspired: 0, heard: 0 },
    userReactions: { seen: false, validated: false, inspired: false, heard: false },
    commentCount: t.comments_count || 0,
    views: t.views_count || 0,
    createdAt: t.created_at,
    isPinned: t.is_pinned,
  })),
}));

vi.mock('../utils/nameUtils', () => ({
  resolveAuthorName: vi.fn((_u: any, _uid: any, display: any, username: any) => display || username || 'Anonymous'),
}));

vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../constants/messages', () => ({
  MSG: {
    FORUM: {
      JOINED: 'Joined',
      LEFT: 'Left',
      JOIN_FAILED: 'Join failed',
    },
  },
}));

vi.mock('../Helper/SkeletonLoader', () => ({
  ForumCardSkeleton: () => <div data-testid="forum-card-skeleton" />,
}));

vi.mock('../components/Modals/ForumModals/CreateTopicModal', () => ({
  CreateTopicModal: () => null,
}));

vi.mock('../components/shared/ClapIcon', () => ({
  ClapIcon: (props: any) => <span {...props}>clap</span>,
}));
vi.mock('../components/shared/VerifiedBadge', () => ({
  VerifiedBadge: () => null,
}));

// ── Imports after mocks ──────────────────────────────────
import { useAuth } from '../hooks/useAuth';
import {
  GetForumById,
  UserJoinForum,
  UserLeaveForum,
  GetUserJoinedForums,
} from '../../api/forumApis';
import { DecryptData } from '../../api/EncrytionApis';
import { showToast } from '../Helper/ShowToast';

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetForum = vi.mocked(GetForumById);
const mockedJoin = vi.mocked(UserJoinForum);
const mockedLeave = vi.mocked(UserLeaveForum);
const mockedGetJoined = vi.mocked(GetUserJoinedForums);
const mockedDecrypt = vi.mocked(DecryptData);
const mockedShowToast = vi.mocked(showToast);

const baseForum = {
  id: 'f1',
  name: 'Test Forum',
  description: 'A forum for testing',
  icon: '💬',
  memberCount: 42,
  member_count: 42,
  topicCount: 10,
  topic_count: 10,
  lastActivity: '2024-06-01',
  last_activity: '2024-06-01',
  is_global: true,
  rules: ['Be respectful', 'Stay on topic'],
  forum_topics: [
    {
      id: 't1',
      title: 'First Topic',
      content: 'Hello world',
      user_id: 'u1',
      user_profile: { username: 'alice', display_name: 'Alice' },
      forum_id: 'f1',
      tags: ['intro'],
      reactions: { seen: 1, validated: 2, inspired: 0, heard: 0 },
      comments_count: 3,
      views_count: 20,
      created_at: '2024-05-01',
    },
  ],
};

const mockOnBack = vi.fn();
const mockOnMembershipChange = vi.fn().mockResolvedValue(undefined);

function setupDefaultMocks() {
  mockedUseAuth.mockReturnValue({
    user: { ...mockUser, company_encrypted: 'enc123', company_type: 'tech' },
  } as any);
  mockedDecrypt.mockResolvedValue({ decryptedData: 'Acme' });
  mockedGetForum.mockResolvedValue(baseForum);
  mockedGetJoined.mockResolvedValue({ forums: [{ id: 'f1' }] }); // User has joined
  mockedJoin.mockResolvedValue({ success: true });
  mockedLeave.mockResolvedValue({ success: true });
}

describe('ForumDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('shows loading skeleton while fetching', () => {
    mockedGetForum.mockReturnValue(new Promise(() => {}));
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders forum name and description after loading', async () => {
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Test Forum')).toBeInTheDocument();
    });
    expect(screen.getByText('A forum for testing')).toBeInTheDocument();
  });

  it('displays forum stats (members, topics, last activity)', async () => {
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Test Forum')).toBeInTheDocument();
    });
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Topics')).toBeInTheDocument();
    expect(screen.getByText('Last Activity')).toBeInTheDocument();
  });

  it('displays forum guidelines', async () => {
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Forum Guidelines')).toBeInTheDocument();
    });
    expect(screen.getByText('Be respectful')).toBeInTheDocument();
    expect(screen.getByText('Stay on topic')).toBeInTheDocument();
  });

  it('shows "Global Forum" label for global forums', async () => {
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Global Forum')).toBeInTheDocument();
    });
  });

  it('shows topics when user is joined', async () => {
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    await waitFor(() => {
      expect(screen.getByText('First Topic')).toBeInTheDocument();
    });
    expect(screen.getByText('Recent Discussions')).toBeInTheDocument();
  });

  it('shows "Join to participate" when user is not joined', async () => {
    mockedGetJoined.mockResolvedValue({ forums: [] }); // Not joined
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Join to participate')).toBeInTheDocument();
    });
  });

  it('shows "No topics yet" when joined but no topics', async () => {
    mockedGetForum.mockResolvedValue({ ...baseForum, forum_topics: [] });
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    await waitFor(() => {
      expect(screen.getByText('No topics yet')).toBeInTheDocument();
    });
  });

  it('handles join toggle (leave when already joined)', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ForumDetailView
        forum={baseForum as any}
        onBack={mockOnBack}
        onForumMembershipChange={mockOnMembershipChange}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Joined')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Joined'));

    await waitFor(() => {
      expect(mockedLeave).toHaveBeenCalledWith('f1');
      expect(mockedShowToast).toHaveBeenCalledWith('Left', 'success');
    });
  });

  it('handles join toggle (join when not joined)', async () => {
    mockedGetJoined.mockResolvedValue({ forums: [] });
    const user = userEvent.setup();
    renderWithRouter(
      <ForumDetailView
        forum={baseForum as any}
        onBack={mockOnBack}
        onForumMembershipChange={mockOnMembershipChange}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Join to participate')).toBeInTheDocument();
    });

    // Click the inline Join Forum button
    const joinButtons = screen.getAllByText('Join Forum');
    await user.click(joinButtons[0]);

    await waitFor(() => {
      expect(mockedJoin).toHaveBeenCalledWith('f1');
      expect(mockedShowToast).toHaveBeenCalledWith('Joined', 'success');
    });
  });

  it('calls onBack when back button is clicked', async () => {
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Test Forum')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Back to Forums'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('navigates to topic detail on topic click', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    await waitFor(() => {
      expect(screen.getByText('First Topic')).toBeInTheDocument();
    });

    await user.click(screen.getByText('First Topic'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/forums/topic/t1');
  });

  it('shows error toast on join failure', async () => {
    mockedGetJoined.mockResolvedValue({ forums: [] });
    mockedJoin.mockRejectedValue({ response: { data: { message: 'Server error' } } });
    const user = userEvent.setup();
    renderWithRouter(
      <ForumDetailView forum={baseForum as any} onBack={mockOnBack} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Join to participate')).toBeInTheDocument();
    });

    const joinButtons = screen.getAllByText('Join Forum');
    await user.click(joinButtons[0]);

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith('Server error', 'error');
    });
  });
});
