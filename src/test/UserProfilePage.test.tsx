// src/test/UserProfilePage.test.tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfilePage } from '../components/dashboard/Profile/UserProfilePage';
import { renderWithRouter } from './testUtils';

// Mock APIs
vi.mock('../../api/profileApis', () => ({
  GetFullUserProfile: vi.fn(),
  GetUserProfileById: vi.fn(),
  GetUserStats: vi.fn(),
  CheckFollowingStatus: vi.fn(),
  FollowUser: vi.fn(),
  UnfollowUser: vi.fn(),
}));

vi.mock('../../api/feedApis', () => ({
  ToggleFeedReaction: vi.fn(),
  ToggleBookmark: vi.fn(),
}));

vi.mock('../../api/forumApis', () => ({
  ForumTopicsReactions: vi.fn(),
  ToggleTopicBookmark: vi.fn(),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/nameUtils', () => ({
  resolveDisplayName: (...args: string[]) => args.find(a => a) || 'Unknown',
}));

vi.mock('../components/shared/VerifiedBadge', () => ({
  VerifiedBadge: () => <span data-testid="verified-badge">Verified</span>,
}));

vi.mock('../components/shared/ClapIcon', () => ({
  ClapIcon: (props: any) => <svg data-testid="clap-icon" {...props} />,
}));

vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../constants/messages', () => ({
  MSG: {
    USER: { PROFILE_FAILED: 'Failed', FOLLOW_STATUS_FAILED: 'Follow failed' },
    FEED: { BOOKMARK_REMOVED: 'Removed', BOOKMARKED: 'Bookmarked', BOOKMARK_FAILED: 'Failed' },
    FORUM: { BOOKMARK_REMOVED: 'Removed', BOOKMARKED: 'Bookmarked' },
  },
}));

// Mock react-router-dom params
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ userId: 'user-456' }),
    useNavigate: () => mockNavigate,
  };
});

import { GetFullUserProfile, FollowUser, UnfollowUser } from '../../api/profileApis';
import { useAuth } from '../hooks/useAuth';

const mockedGetFullProfile = vi.mocked(GetFullUserProfile);
const mockedFollowUser = vi.mocked(FollowUser);
const mockedUnfollowUser = vi.mocked(UnfollowUser);
const mockedUseAuth = vi.mocked(useAuth);

const mockProfileData = {
  profile: {
    id: 'user-456',
    username: 'TestTarget',
    display_name: 'Test Target',
    avatar: '🦅',
    bio: 'I am a test user',
    job_title: 'Engineer',
    years_experience: 5,
    skills: ['React', 'TypeScript'],
    location: 'NYC',
    joinedDate: '2024-01-15T00:00:00Z',
    isFollowing: false,
    isFollowedBy: false,
    followersCount: 10,
    followingCount: 20,
    is_company_verified: true,
    affinityTags: ['Women in Tech'],
    stats: {
      postsCreated: 5,
      commentsPosted: 12,
      helpfulReactions: 8,
      reputationScore: 100,
    },
  },
  identity_revealed: false,
  recent_activity: {
    posts: [
      {
        id: 'p1',
        content_id: 'cp1',
        is_anonymous: false,
        content: { text: 'Hello world post', tags: ['test'] },
        engagement: { likes: 3, comments: 1 },
        reaction_counts: { heard: 2, validated: 1, inspired: 0 },
        user_liked: false,
        user_bookmarked: false,
        user_reactions: { heard: false, validated: false, inspired: false },
        created_at: new Date().toISOString(),
      },
    ],
    topics: [
      {
        id: 't1',
        content_id: 'ct1',
        is_anonymous: false,
        content: { title: 'Test Topic', text: 'Topic body', forum_name: 'General', tags: ['discuss'] },
        engagement: { likes: 5, comments: 3 },
        reaction_counts: { seen: 1, heard: 2, validated: 1, inspired: 0 },
        user_liked: false,
        user_bookmarked: false,
        user_reactions: { seen: false, heard: false, validated: false, inspired: false },
        created_at: new Date().toISOString(),
      },
    ],
    nooks: [
      { id: 'nk1', content: { title: 'Test Nook', urgency: 'high', description: 'A nook' }, time_left: '2h' },
    ],
  },
};

function setup(overrides: Record<string, unknown> = {}) {
  mockedUseAuth.mockReturnValue({
    user: { id: 'current-user-99' },
  } as ReturnType<typeof useAuth>);

  mockedGetFullProfile.mockResolvedValue({ data: mockProfileData, ...overrides });
  mockedFollowUser.mockResolvedValue({ success: true });
  mockedUnfollowUser.mockResolvedValue({ success: true });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UserProfilePage', () => {
  it('renders profile data after loading', async () => {
    setup();
    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('@TestTarget')).toBeInTheDocument();
    });

    expect(screen.getByText('I am a test user')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
  });

  it('shows follow/unfollow button for other users', async () => {
    setup();
    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('handles follow action', async () => {
    setup();
    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Follow'));

    await waitFor(() => {
      expect(mockedFollowUser).toHaveBeenCalledWith('user-456');
    });
  });

  it('displays posts tab by default with post content', async () => {
    setup();
    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Hello world post')).toBeInTheDocument();
    });

    expect(screen.getByText('#test')).toBeInTheDocument();
  });

  it('switches to topics tab and shows topics', async () => {
    setup();
    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('@TestTarget')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Click the Topics tab button specifically
    const topicsTab = screen.getAllByText('Topics').find(el => el.tagName === 'BUTTON' || el.closest('button'));
    await user.click(topicsTab!);

    await waitFor(() => {
      expect(screen.getByText('Test Topic')).toBeInTheDocument();
    });

    expect(screen.getByText('Topic body')).toBeInTheDocument();
  });

  it('switches to nooks tab and shows nooks', async () => {
    setup();
    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('@TestTarget')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const nooksTab = screen.getAllByText('Nooks').find(el => el.tagName === 'BUTTON' || el.closest('button'));
    await user.click(nooksTab!);

    await waitFor(() => {
      expect(screen.getByText('Test Nook')).toBeInTheDocument();
    });
  });

  it('shows "Profile not found" when no profile data', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'current-user-99' },
    } as ReturnType<typeof useAuth>);
    mockedGetFullProfile.mockRejectedValue(new Error('Not found'));

    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Profile not found.')).toBeInTheDocument();
    });
  });

  it('navigates back when back button is clicked', async () => {
    setup();
    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('@TestTarget')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // The back button contains ArrowLeft icon + "Back" text
    const backBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Back'));
    await user.click(backBtn!);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to messages when Message button is clicked', async () => {
    setup();
    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Message')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Message'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/messages', {
      state: { startChatWith: 'user-456', contextType: 'regular' },
    });
  });

  it('displays follower and following counts', async () => {
    setup();
    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    expect(screen.getByText('Followers')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('displays stats section', async () => {
    setup();
    renderWithRouter(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Impact')).toBeInTheDocument();
    });

    // Check stats values exist - postsCreated=5, commentsPosted=12
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Rep')).toBeInTheDocument();
  });
});
