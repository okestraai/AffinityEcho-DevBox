// src/test/FindMentorshipView.test.tsx
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
  GetMentorsAndMentees: vi.fn(),
  GetFilterOptions: vi.fn(),
  CheckUserProfileExist: vi.fn(),
}));

vi.mock('../../api/EncrytionApis', () => ({
  DecryptData: vi.fn(),
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

vi.mock('../components/Modals/MentorShipModals/DirectMentorshipRequestModal', () => ({
  DirectMentorshipRequestModal: () => null,
}));

vi.mock('../components/Modals/MentorShipModals/MentorshipProfileModal', () => ({
  MentorshipProfileModal: () => null,
}));

vi.mock('../components/Modals/MentorShipModals/MentorshipRequestModal', () => ({
  MentorshipRequestModal: () => null,
}));

vi.mock('../types/mentorship', () => ({}));

import { useAuth } from '../hooks/useAuth';
import {
  GetMentorsAndMentees,
  GetFilterOptions,
  CheckUserProfileExist,
} from '../../api/mentorshipApis';
import { DecryptData } from '../../api/EncrytionApis';
import { FindMentorshipView } from '../components/dashboard/Mentorship/FindMentorshipView';

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetProfiles = vi.mocked(GetMentorsAndMentees);
const mockedGetFilters = vi.mocked(GetFilterOptions);
const mockedCheckProfile = vi.mocked(CheckUserProfileExist);
const mockedDecrypt = vi.mocked(DecryptData);

// The API unwraps to this shape at the component level
const mockProfiles = {
  profiles: [
    {
      id: 'user-2',
      username: 'MentorAlice',
      display_name: 'Alice Mentor',
      avatar: '🦊',
      bio: 'Senior developer with 10 years experience',
      jobTitle: 'Senior Developer',
      job_title: 'Senior Developer',
      company: 'TechCorp',
      company_encrypted: 'enc-company-1',
      careerLevel: 'Senior',
      career_level_encrypted: 'enc-career-1',
      location: 'New York',
      expertise: ['React', 'Node.js'],
      mentor_expertise: ['React', 'Node.js'],
      industries: ['Technology'],
      mentor_industries: ['Technology'],
      mentoringAs: 'mentor' as const,
      availability: 'weekly',
      mentor_availability: 'weekly',
      responseTime: '24h',
      matchScore: 92,
      isAvailable: true,
      totalMentees: 5,
      yearsOfExperience: 10,
      years_experience: 10,
      affinityTags: ['Women in Tech'],
      affinity_tags_encrypted: 'enc-tags-1',
      mentorshipStyle: 'Hands-on',
      mentor_style: 'Hands-on',
      languages: ['English'],
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const mockFilterOptions = {
  careerLevels: ['Junior', 'Mid', 'Senior', 'Lead'],
  expertiseAreas: ['React', 'Node.js', 'Python'],
  industries: ['Technology', 'Finance', 'Healthcare'],
  affinityTags: ['Women in Tech', 'LGBTQ+'],
  availabilityOptions: ['daily', 'weekly', 'biweekly', 'monthly'],
  communicationMethods: ['chat', 'video', 'email'],
  languages: ['English', 'Spanish', 'French'],
  matchScoreRanges: [
    { label: 'High Match', min: 80, max: 100 },
    { label: 'Good Match', min: 60, max: 79 },
  ],
};

describe('FindMentorshipView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    } as any);
    mockedGetProfiles.mockResolvedValue(mockProfiles as any);
    mockedGetFilters.mockResolvedValue(mockFilterOptions);
    mockedCheckProfile.mockResolvedValue({
      hasProfile: true,
      hasMentorProfile: true,
      hasMenteeProfile: true,
      isActiveMentor: true,
      isActiveMentee: true,
      profileId: 'p-1',
    } as any);
    mockedDecrypt.mockResolvedValue({ decryptedData: 'Decrypted Value' });
  });

  it('renders the find mentorship view', async () => {
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText(/search/i) ||
        screen.queryByText(/mentor/i)
      ).toBeTruthy();
    });
  });

  it('fetches profiles on mount', async () => {
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(mockedGetProfiles).toHaveBeenCalled();
    });
  });

  it('fetches filter options on mount', async () => {
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(mockedGetFilters).toHaveBeenCalled();
    });
  });

  it('checks profile existence on mount', async () => {
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(mockedCheckProfile).toHaveBeenCalled();
    });
  });

  it('shows profile cards after loading', async () => {
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(
        screen.queryByText('Alice Mentor') ||
        screen.queryByText('MentorAlice') ||
        screen.queryByText(/senior developer/i)
      ).toBeTruthy();
    });
  });

  it('shows match score on profile cards', async () => {
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(
        screen.queryByText(/92/i) || screen.queryByText(/92%/i)
      ).toBeTruthy();
    });
  });

  it('has a search input', async () => {
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search/i);
      expect(searchInput).toBeTruthy();
    });
  });

  it('shows empty state when no profiles match', async () => {
    mockedGetProfiles.mockResolvedValue({
      profiles: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    } as any);
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(screen.getByText('No profiles found')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    mockedGetProfiles.mockRejectedValue(new Error('Network error'));
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(mockedGetProfiles).toHaveBeenCalled();
    });
  });

  it('handles filter options error gracefully', async () => {
    mockedGetFilters.mockRejectedValue(new Error('Network error'));
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(mockedGetFilters).toHaveBeenCalled();
    });
  });

  it('has view mode toggle buttons', async () => {
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(screen.getByText('Find Mentors')).toBeInTheDocument();
      expect(screen.getByText('Find Mentees')).toBeInTheDocument();
      expect(screen.getByText('View All')).toBeInTheDocument();
    });
  });

  it('decrypts company data for profiles', async () => {
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(mockedDecrypt).toHaveBeenCalled();
    });
  });

  it('has a filter toggle button', async () => {
    renderWithRouter(<FindMentorshipView />);
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });
  });
});
