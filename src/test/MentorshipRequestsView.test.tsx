// src/test/MentorshipRequestsView.test.tsx
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithRouter } from './testUtils';

// Mock APIs - paths relative to THIS test file
vi.mock('../../api/mentorshipApis', () => ({
  GetReceivedDirectMentorshipRequests: vi.fn(),
  GetSentDirectMentorshipRequests: vi.fn(),
  RespondToDirectMentorshipRequest: vi.fn(),
  UpdateMentorshipDirectRequestToRead: vi.fn(),
  DeleteDirectMentorshipRequest: vi.fn(),
  GeAllRequests: vi.fn(),
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
      REQUESTS_FAILED: 'Requests failed',
      REQUEST_ACCEPTED: 'Request accepted',
      REQUEST_DECLINED: 'Request declined',
      REQUEST_CANCELLED: 'Request cancelled',
      ACCEPT_FAILED: 'Accept failed',
      DECLINE_FAILED: 'Decline failed',
      CANCEL_FAILED: 'Cancel failed',
      MARK_READ_FAILED: 'Mark read failed',
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

import {
  GetReceivedDirectMentorshipRequests,
  GetSentDirectMentorshipRequests,
  RespondToDirectMentorshipRequest,
  UpdateMentorshipDirectRequestToRead,
  DeleteDirectMentorshipRequest,
  GeAllRequests,
} from '../../api/mentorshipApis';
import { DecryptData } from '../../api/EncrytionApis';
import { showToast } from '../Helper/ShowToast';
import { MentorshipRequestsView } from '../components/dashboard/Message/MentorshipRequestsView';

const mockedGetReceived = vi.mocked(GetReceivedDirectMentorshipRequests);
const mockedGetSent = vi.mocked(GetSentDirectMentorshipRequests);
const mockedRespond = vi.mocked(RespondToDirectMentorshipRequest);
const mockedMarkRead = vi.mocked(UpdateMentorshipDirectRequestToRead);
const mockedDelete = vi.mocked(DeleteDirectMentorshipRequest);
const mockedGetAll = vi.mocked(GeAllRequests);
const mockedDecrypt = vi.mocked(DecryptData);
const mockedShowToast = vi.mocked(showToast);

const mockReceivedRequests = {
  requests: [
    {
      id: 'req-1',
      requester_id: 'user-2',
      target_user_id: 'user-123',
      request_type: 'mentor_request' as const,
      message: 'Would love to learn from you',
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      is_read_by_target: false,
      requester: {
        id: 'user-2',
        username: 'AliceUser',
        email: 'alice@test.com',
        avatar: '🦊',
        job_title: 'Developer',
        company_encrypted: 'encrypted-company',
        location: 'NYC',
        years_experience: 3,
        mentor_bio: 'Eager learner',
        mentor_expertise: ['React', 'Node'],
        mentor_industries: ['Tech'],
      },
    },
  ],
};

const mockSentRequests = {
  requests: [
    {
      id: 'req-2',
      requester_id: 'user-123',
      target_user_id: 'user-3',
      request_type: 'mentee_request' as const,
      message: 'I can help you learn',
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      is_read_by_target: true,
      target_user: {
        id: 'user-3',
        username: 'BobUser',
        email: 'bob@test.com',
        avatar: '🐻',
        job_title: 'Junior Dev',
        company_encrypted: 'encrypted-company-2',
        location: 'LA',
        years_experience: 1,
        mentor_expertise: ['JavaScript'],
        mentor_industries: ['Startup'],
      },
    },
  ],
};

describe('MentorshipRequestsView', () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetReceived.mockResolvedValue(mockReceivedRequests);
    mockedGetSent.mockResolvedValue(mockSentRequests);
    mockedGetAll.mockResolvedValue({ requests: [] });
    mockedDecrypt.mockResolvedValue({ decryptedData: 'TechCorp' });
    mockedMarkRead.mockResolvedValue({ count: 1 });
  });

  it('renders the header with title', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText('Mentorship Requests')).toBeInTheDocument();
    });
  });

  it('renders tab buttons for Received, Sent, and All', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText('Received')).toBeInTheDocument();
      expect(screen.getByText('Sent')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });
  });

  it('shows received requests by default', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);
    await waitFor(() => {
      expect(mockedGetReceived).toHaveBeenCalledWith('pending');
    });
  });

  it('shows empty state when no received requests', async () => {
    mockedGetReceived.mockResolvedValue({ requests: [] });
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText(/no pending requests/i)).toBeInTheDocument();
    });
  });

  it('renders accept and decline buttons for received requests', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);
    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });
  });

  it('handles accept request', async () => {
    mockedRespond.mockResolvedValue({ success: true });
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(mockedRespond).toHaveBeenCalledWith('req-1', { action: 'accept' });
    });
  });

  it('handles decline request', async () => {
    mockedRespond.mockResolvedValue({ success: true });
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Decline'));

    await waitFor(() => {
      expect(mockedRespond).toHaveBeenCalledWith('req-1', { action: 'decline' });
    });
  });

  it('handles accept failure gracefully', async () => {
    mockedRespond.mockRejectedValue(new Error('Server error'));
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith('Accept failed', 'error');
    });
  });

  it('switches to Sent tab and loads sent requests', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('Sent')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sent'));

    await waitFor(() => {
      expect(mockedGetSent).toHaveBeenCalledWith('pending');
    });
  });

  it('switches to All tab and loads all requests', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('All'));

    await waitFor(() => {
      expect(mockedGetAll).toHaveBeenCalled();
    });
  });

  it('handles fetch error for received requests', async () => {
    mockedGetReceived.mockRejectedValue(new Error('Network error'));
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith('Requests failed', 'error');
    });
  });

  it('calls onBack when back button is clicked', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Back')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalled();
  });

  it('decrypts company data for profiles', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(mockedDecrypt).toHaveBeenCalledWith({
        encryptedData: 'encrypted-company',
      });
    });
  });

  it('marks requests as read automatically for received tab', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(mockedMarkRead).toHaveBeenCalledWith('received');
    });
  });

  it('shows request type text for received request', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText('Wants you as their mentor')).toBeInTheDocument();
    });
  });

  it('displays request message', async () => {
    renderWithRouter(<MentorshipRequestsView onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Would love to learn from you/i)).toBeInTheDocument();
    });
  });
});
