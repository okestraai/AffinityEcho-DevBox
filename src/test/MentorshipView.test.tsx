// src/test/MentorshipView.test.tsx
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithRouter, mockUser } from './testUtils';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../api/mentorshipApis', () => ({
  CheckUserProfileExist: vi.fn(),
  GetMentorshipMetric: vi.fn(),
  GetMyMentors: vi.fn(),
  GetMyMentees: vi.fn(),
}));

vi.mock('../../api/EncrytionApis', () => ({
  DecryptData: vi.fn(),
}));

vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../constants/messages', () => ({
  MSG: {
    MENTORSHIP: {
      LOAD_FAILED: 'Load failed',
      ACTIVATE_MENTEE_FIRST: 'Activate mentee first',
      ACTIVATE_MENTOR_FIRST: 'Activate mentor first',
    },
  },
}));

vi.mock('../utils/nameUtils', () => ({
  resolveDisplayName: (...names: any[]) => {
    for (const name of names) {
      if (name && name !== 'Anonymous User') return name;
    }
    return 'Anonymous';
  },
}));

vi.mock('../components/shared/VerifiedBadge', () => ({
  VerifiedBadge: () => <span data-testid="verified-badge" />,
}));

vi.mock('../components/Modals/MentorShipModals/MentorshipUserProfileModal', () => ({
  MentorshipUserProfileModal: () => null,
}));

vi.mock('../components/Modals/MentorShipModals/MentorshipRequestModal', () => ({
  MentorshipRequestModal: () => null,
}));

vi.mock('../components/Modals/MentorShipModals/MentorshipProfileModal', () => ({
  MentorshipProfileModal: () => null,
}));

vi.mock('../components/dashboard/Mentorship/FindMentorshipView', () => ({
  FindMentorshipView: () => <div data-testid="find-mentorship-view">Find Mentorship Content</div>,
}));

vi.mock('../types/mentorship', () => ({}));

import { useAuth } from '../hooks/useAuth';
import {
  CheckUserProfileExist,
  GetMentorshipMetric,
  GetMyMentors,
  GetMyMentees,
} from '../../api/mentorshipApis';
import { DecryptData } from '../../api/EncrytionApis';
import { MentorshipView } from '../components/dashboard/Mentorship/MentorshipView';

const mockedUseAuth = vi.mocked(useAuth);
const mockedCheckProfile = vi.mocked(CheckUserProfileExist);
const mockedGetMetrics = vi.mocked(GetMentorshipMetric);
const mockedGetMyMentors = vi.mocked(GetMyMentors);
const mockedGetMyMentees = vi.mocked(GetMyMentees);
const mockedDecrypt = vi.mocked(DecryptData);

const mockProfileResponse = {
  hasProfile: true,
  hasMentorProfile: true,
  hasMenteeProfile: true,
  isActiveMentor: true,
  isActiveMentee: true,
  profileId: 'p-1',
  mentoringAs: 'both' as const,
};

const mockMetrics = {
  total: 10,
  sent: {
    total: 5,
    unread: 1,
    byStatus: { pending: 2, accepted: 2, declined: 1, cancelled: 0 },
    byType: { mentor_requests: 3, mentee_requests: 2 },
  },
  received: {
    total: 5,
    unread: 2,
    byStatus: { pending: 1, accepted: 3, declined: 1, cancelled: 0 },
    byType: { mentor_requests: 2, mentee_requests: 3 },
  },
  totalUnread: 3,
  pendingReceivedUnread: 1,
  recentActivity: { last7Days: 4, last30Days: 10 },
};

const mockMentors = {
  mentors: [
    {
      id: 'conn-1',
      mentor: {
        id: 'user-2',
        username: 'MentorAlice',
        displayName: 'Alice',
        avatar: '🦊',
        jobTitle: 'Senior Dev',
        company: 'TechCorp',
        careerLevel: 'Senior',
        bio: 'Experienced developer',
        mentorProfile: {
          bio: 'Love mentoring',
          expertise: ['React', 'Node'],
          industries: ['Tech'],
          availability: 'weekly',
        },
      },
      connectedSince: '2024-01-15T00:00:00Z',
      matchScore: 85,
    },
  ],
};

const mockMentees = {
  mentees: [],
};

describe('MentorshipView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    } as any);
    mockedCheckProfile.mockResolvedValue(mockProfileResponse);
    mockedGetMetrics.mockResolvedValue(mockMetrics);
    mockedGetMyMentors.mockResolvedValue(mockMentors);
    mockedGetMyMentees.mockResolvedValue(mockMentees);
    mockedDecrypt.mockResolvedValue({ decryptedData: 'Senior' });
  });

  it('renders the mentorship header', async () => {
    renderWithRouter(<MentorshipView />);
    await waitFor(() => {
      expect(screen.getByText('Mentorship')).toBeInTheDocument();
    });
  });

  it('renders subtitle text', async () => {
    renderWithRouter(<MentorshipView />);
    await waitFor(() => {
      expect(screen.getByText('Connect, learn, and grow together')).toBeInTheDocument();
    });
  });

  it('renders three tab buttons', async () => {
    renderWithRouter(<MentorshipView />);
    await waitFor(() => {
      expect(screen.getByText('My Mentors')).toBeInTheDocument();
      expect(screen.getByText('My Mentees')).toBeInTheDocument();
      expect(screen.getByText('Find Mentorship')).toBeInTheDocument();
    });
  });

  it('shows My Mentors view by default', async () => {
    renderWithRouter(<MentorshipView />);
    await waitFor(() => {
      const headings = screen.getAllByText('My Mentors');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows mentor cards when mentors exist', async () => {
    renderWithRouter(<MentorshipView />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Senior Dev')).toBeInTheDocument();
    });
  });

  it('shows mentor expertise tags', async () => {
    renderWithRouter(<MentorshipView />);
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node')).toBeInTheDocument();
    });
  });

  it('shows Message and View Profile buttons for mentors', async () => {
    renderWithRouter(<MentorshipView />);
    await waitFor(() => {
      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByText('View Profile')).toBeInTheDocument();
    });
  });

  it('switches to My Mentees tab', async () => {
    renderWithRouter(<MentorshipView />);

    await waitFor(() => {
      expect(screen.getByText('My Mentees')).toBeInTheDocument();
    });

    const tabButtons = screen.getAllByText('My Mentees');
    fireEvent.click(tabButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/no mentees yet/i) || screen.getByText(/become a mentor/i)).toBeTruthy();
    });
  });

  it('switches to Find Mentorship tab', async () => {
    renderWithRouter(<MentorshipView />);

    await waitFor(() => {
      expect(screen.getByText('Find Mentorship')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Find Mentorship'));

    await waitFor(() => {
      expect(screen.getByTestId('find-mentorship-view')).toBeInTheDocument();
    });
  });

  it('shows empty state when no mentors', async () => {
    mockedGetMyMentors.mockResolvedValue({ mentors: [] });
    renderWithRouter(<MentorshipView />);

    await waitFor(() => {
      expect(screen.getByText(/no mentors yet/i)).toBeInTheDocument();
    });
  });

  it('shows Setup Mentee Profile button when no mentee profile', async () => {
    mockedCheckProfile.mockResolvedValue({
      ...mockProfileResponse,
      hasMenteeProfile: false,
      isActiveMentee: false,
    });
    mockedGetMyMentors.mockResolvedValue({ mentors: [] });
    renderWithRouter(<MentorshipView />);

    await waitFor(() => {
      expect(screen.getByText('Setup Mentee Profile')).toBeInTheDocument();
    });
  });

  it('shows Update Mentee Profile button when mentee profile exists', async () => {
    mockedGetMyMentors.mockResolvedValue(mockMentors);
    renderWithRouter(<MentorshipView />);

    await waitFor(() => {
      expect(screen.getByText('Update Mentee Profile')).toBeInTheDocument();
    });
  });

  it('handles initialization error gracefully', async () => {
    mockedCheckProfile.mockRejectedValue(new Error('Server error'));
    mockedGetMyMentors.mockRejectedValue(new Error('Server error'));
    mockedGetMyMentees.mockRejectedValue(new Error('Server error'));
    mockedGetMetrics.mockRejectedValue(new Error('Server error'));

    renderWithRouter(<MentorshipView />);

    await waitFor(() => {
      expect(screen.getByText('Mentorship')).toBeInTheDocument();
    });
  });

  it('calls all initialization APIs on mount', async () => {
    renderWithRouter(<MentorshipView />);

    await waitFor(() => {
      expect(mockedCheckProfile).toHaveBeenCalled();
      expect(mockedGetMyMentors).toHaveBeenCalled();
      expect(mockedGetMyMentees).toHaveBeenCalled();
      expect(mockedGetMetrics).toHaveBeenCalled();
    });
  });

  it('shows match score for mentors', async () => {
    renderWithRouter(<MentorshipView />);
    await waitFor(() => {
      expect(screen.getByText(/match: 85%/i)).toBeInTheDocument();
    });
  });
});
