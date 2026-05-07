// src/test/EditProfilePanel.test.tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditProfilePanel } from '../components/dashboard/Profile/EditProfilePanel';
import { renderWithRouter } from './testUtils';

// Mock APIs
vi.mock('../../api/profileApis', () => ({
  GetEditableProfile: vi.fn(),
  UpdateEditableProfile: vi.fn(),
}));

vi.mock('../../api/mentorshipApis', () => ({
  GetFilterOptions: vi.fn(),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../constants/messages', () => ({
  MSG: {
    USER: {
      PROFILE_LOAD_FAILED: 'Load failed',
      PROFILE_UPDATED: 'Profile updated',
      COMPANY_CHANGED: 'Company changed',
      NO_CHANGES: 'No changes',
    },
    AUTH: {
      PROFILE_UPDATE_FAILED: 'Update failed',
    },
  },
}));

import { GetEditableProfile, UpdateEditableProfile } from '../../api/profileApis';
import { GetFilterOptions } from '../../api/mentorshipApis';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../Helper/ShowToast';

const mockedGetEditableProfile = vi.mocked(GetEditableProfile);
const mockedUpdateEditableProfile = vi.mocked(UpdateEditableProfile);
const mockedGetFilterOptions = vi.mocked(GetFilterOptions);
const mockedUseAuth = vi.mocked(useAuth);
const mockedShowToast = vi.mocked(showToast);

const mockProfileData = {
  basic: {
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    avatar: '🚀',
    bio: 'Test bio',
    job_title: 'Engineer',
    location: 'NYC',
    years_experience: 5,
    skills: ['React'],
  },
  company: { company_name: 'TechCorp' },
  identity: {
    career_level: 'Senior (8-12 years)',
    race: 'Asian/Pacific Islander',
    gender: 'Man',
    affinity_tags: [],
  },
};

const mockOnClose = vi.fn();
const mockUpdateUser = vi.fn();
const mockLogout = vi.fn();

function setup(profileOverrides: Record<string, unknown> = {}) {
  mockedUseAuth.mockReturnValue({
    user: { id: 'u1', username: 'johndoe', avatar: '🚀' },
    updateUser: mockUpdateUser,
    logout: mockLogout,
  } as any);

  mockedGetFilterOptions.mockResolvedValue({
    expertiseAreas: ['Leadership', 'Engineering'],
    industries: ['Tech', 'Finance'],
    availabilityOptions: ['Weekly', 'Monthly'],
    languages: ['English', 'Spanish'],
    communicationMethods: ['video-calls', 'chat-messaging'],
  });

  const data = { ...mockProfileData, ...profileOverrides };
  mockedGetEditableProfile.mockResolvedValue({ data });
  mockedUpdateEditableProfile.mockResolvedValue({ data });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EditProfilePanel', () => {
  it('shows loading state initially then renders form', async () => {
    setup();
    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    // Loading state
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();

    // After load
    await waitFor(() => {
      expect(screen.getByText('Edit My Profile')).toBeInTheDocument();
    });
  });

  it('renders basic info fields with data', async () => {
    setup();
    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Edit My Profile')).toBeInTheDocument();
    });

    // Basic info section is expanded by default
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('NYC')).toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', async () => {
    setup();
    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Edit My Profile')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Close edit profile panel'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows toast when saving with no changes', async () => {
    setup();
    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Edit My Profile')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Save'));

    expect(mockedShowToast).toHaveBeenCalledWith('No changes', 'info');
  });

  it('saves basic profile changes successfully', async () => {
    setup();
    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Edit My Profile')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const bioField = screen.getByDisplayValue('Test bio');
    await user.clear(bioField);
    await user.type(bioField, 'Updated bio');

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockedUpdateEditableProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          basic: expect.objectContaining({ bio: 'Updated bio' }),
        })
      );
    });
  });

  it('shows company confirmation modal when company is changed', async () => {
    setup();
    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Edit My Profile')).toBeInTheDocument();
    });

    // Expand company section
    const user = userEvent.setup();
    await user.click(screen.getByText('Company'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('TechCorp')).toBeInTheDocument();
    });

    const companyInput = screen.getByDisplayValue('TechCorp');
    await user.clear(companyInput);
    await user.type(companyInput, 'NewCorp');

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Change Company?')).toBeInTheDocument();
    });
  });

  it('cancels company change from confirmation modal', async () => {
    setup();
    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Edit My Profile')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Company'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('TechCorp')).toBeInTheDocument();
    });

    const companyInput = screen.getByDisplayValue('TechCorp');
    await user.clear(companyInput);
    await user.type(companyInput, 'NewCorp');
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Change Company?')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Change Company?')).not.toBeInTheDocument();
    expect(mockedUpdateEditableProfile).not.toHaveBeenCalled();
  });

  it('confirms company change and logs out', async () => {
    setup();
    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Edit My Profile')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Company'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('TechCorp')).toBeInTheDocument();
    });

    const companyInput = screen.getByDisplayValue('TechCorp');
    await user.clear(companyInput);
    await user.type(companyInput, 'NewCorp');
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Change Company?')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(mockedUpdateEditableProfile).toHaveBeenCalled();
    });
  });

  it('expands and collapses sections', async () => {
    setup();
    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Edit My Profile')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Identity section is collapsed by default
    expect(screen.queryByText('Career Level')).not.toBeInTheDocument();

    await user.click(screen.getByText('Identity'));

    await waitFor(() => {
      expect(screen.getByText('Career Level')).toBeInTheDocument();
    });
  });

  it('shows error toast when profile load fails', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'u1' },
      updateUser: mockUpdateUser,
      logout: mockLogout,
    } as any);

    mockedGetFilterOptions.mockResolvedValue({});
    mockedGetEditableProfile.mockRejectedValue(new Error('Network Error'));

    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith('Load failed', 'error');
    });
  });

  it('shows error toast when save fails', async () => {
    setup();
    mockedUpdateEditableProfile.mockRejectedValue(new Error('Save error'));

    renderWithRouter(<EditProfilePanel onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Edit My Profile')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const bioField = screen.getByDisplayValue('Test bio');
    await user.clear(bioField);
    await user.type(bioField, 'Changed bio');

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith('Update failed', 'error');
    });
  });
});
