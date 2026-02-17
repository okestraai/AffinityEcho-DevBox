import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfileModal } from './UserProfileModal';

// Mock API modules
vi.mock('../../../api/profileApis', () => ({
  GetUserProfileById: vi.fn(),
  GetUserStats: vi.fn(),
  GetUserBadges: vi.fn(),
  CheckFollowingStatus: vi.fn(),
  FollowUser: vi.fn(),
  UnfollowUser: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import {
  GetUserProfileById,
  GetUserStats,
  GetUserBadges,
  CheckFollowingStatus,
  FollowUser,
} from '../../../api/profileApis';
import { useAuth } from '../../hooks/useAuth';

const mockedGetProfile = vi.mocked(GetUserProfileById);
const mockedGetStats = vi.mocked(GetUserStats);
const mockedGetBadges = vi.mocked(GetUserBadges);
const mockedCheckFollow = vi.mocked(CheckFollowingStatus);
const mockedFollowUser = vi.mocked(FollowUser);
const mockedUseAuth = vi.mocked(useAuth);

const mockProfile = {
  success: true,
  data: {
    id: 'user-123',
    username: 'AnonymousEagle',
    display_name: 'Brave Eagle',
    avatar: '🦅',
    bio: 'Passionate about tech and mentoring.',
    demographics: {
      careerLevel: 'Senior Engineer',
      company: 'TechCorp',
      affinityTags: ['Women in Tech'],
    },
    joinedDate: '2024-01-15T00:00:00Z',
  },
};

const mockStats = {
  success: true,
  data: {
    postsCreated: 12,
    commentsPosted: 34,
    helpfulReactions: 56,
    reputationScore: 780,
    topicsCreated: 5,
    nooksJoined: 3,
  },
};

const mockBadges = {
  success: true,
  data: {
    badges: [
      { id: 'b1', name: 'Early Adopter', icon: '🌟', earned: true, description: 'Joined early' },
      { id: 'b2', name: 'Helpful', icon: '🤝', earned: true, description: 'Helped others' },
    ],
  },
};

const mockFollowStatus = { success: true, data: { isFollowing: false } };

function setupMocks(overrides: Record<string, any> = {}) {
  mockedUseAuth.mockReturnValue({
    user: { id: 'current-user-99' },
  } as any);

  mockedGetProfile.mockResolvedValue(overrides.profile ?? mockProfile);
  mockedGetStats.mockResolvedValue(overrides.stats ?? mockStats);
  mockedGetBadges.mockResolvedValue(overrides.badges ?? mockBadges);
  mockedCheckFollow.mockResolvedValue(overrides.follow ?? mockFollowStatus);
  mockedFollowUser.mockResolvedValue({ success: true });
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  userId: 'user-123',
  onChat: vi.fn(),
};

describe('UserProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    setupMocks();
    const { container } = render(
      <UserProfileModal {...defaultProps} isOpen={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows loading state initially', () => {
    setupMocks();
    // Make the API hang so we stay in loading
    mockedGetProfile.mockReturnValue(new Promise(() => {}));

    render(<UserProfileModal {...defaultProps} />);
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('renders profile data after fetch', async () => {
    setupMocks();
    render(<UserProfileModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Brave Eagle')).toBeInTheDocument();
    });

    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
    expect(screen.getByText('Passionate about tech and mentoring.')).toBeInTheDocument();
  });

  it('displays user stats', async () => {
    setupMocks();
    render(<UserProfileModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument(); // posts
    });

    expect(screen.getByText('34')).toBeInTheDocument(); // comments
    expect(screen.getByText('56')).toBeInTheDocument(); // helpful
    expect(screen.getByText('780')).toBeInTheDocument(); // reputation
    expect(screen.getByText('5')).toBeInTheDocument(); // topics
    expect(screen.getByText('3')).toBeInTheDocument(); // nooks
  });

  it('displays badges from API', async () => {
    setupMocks();
    render(<UserProfileModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Early Adopter')).toBeInTheDocument();
    });

    // "Helpful" appears as both a stat label and badge name — use getAllByText
    expect(screen.getAllByText('Helpful').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('🌟')).toBeInTheDocument();
    expect(screen.getByText('🤝')).toBeInTheDocument();
  });

  it('shows Follow and Chat buttons for other users', async () => {
    setupMocks();
    render(<UserProfileModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });

    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('hides Follow and Chat buttons on own profile', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-123' }, // same as userId prop
    } as any);
    mockedGetProfile.mockResolvedValue(mockProfile);
    mockedGetStats.mockResolvedValue(mockStats);
    mockedGetBadges.mockResolvedValue(mockBadges);
    mockedCheckFollow.mockResolvedValue(mockFollowStatus);

    render(<UserProfileModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Brave Eagle')).toBeInTheDocument();
    });

    expect(screen.queryByText('Follow')).not.toBeInTheDocument();
    expect(screen.queryByText('Chat')).not.toBeInTheDocument();
  });

  it('calls onChat when Chat button is clicked', async () => {
    setupMocks();
    const user = userEvent.setup();
    render(<UserProfileModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Chat')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Chat'));
    expect(defaultProps.onChat).toHaveBeenCalledWith('user-123');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', async () => {
    setupMocks();
    const user = userEvent.setup();
    render(<UserProfileModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Brave Eagle')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Close profile'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles API errors gracefully without crashing', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'current-user-99' },
    } as any);
    mockedGetProfile.mockRejectedValue(new Error('Network error'));
    mockedGetStats.mockRejectedValue(new Error('Network error'));
    mockedGetBadges.mockRejectedValue(new Error('Network error'));
    mockedCheckFollow.mockRejectedValue(new Error('Network error'));

    render(<UserProfileModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Could not load this profile.')).toBeInTheDocument();
    });
  });
});
