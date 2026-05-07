// src/test/NotificationsView.test.tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationsView } from '../components/dashboard/Notification/NotificationsView';
import { renderWithRouter } from './testUtils';

// Mock APIs
vi.mock('../../api/notificationApis', () => ({
  GetNotifications: vi.fn(),
  MarkNotificationAsRead: vi.fn(),
  MarkAllNotificationsAsRead: vi.fn(),
  DeleteNotification: vi.fn(),
  UpdateNotification: vi.fn(),
  ClearAllNotifications: vi.fn(),
  MarkNotificationGroupRead: vi.fn(),
}));

vi.mock('../../api/messaging', () => ({
  RespondToIdentityReveal: vi.fn(),
}));

vi.mock('../../api/mentorshipApis', () => ({
  RespondToDirectMentorshipRequest: vi.fn(),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/websocket.service', () => ({
  webSocketService: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../constants/messages', () => ({
  MSG: {
    NOTIFICATION: {
      CLEARED: 'All cleared',
      CLEAR_FAILED: 'Clear failed',
      IDENTITY_DECLINED: 'Declined',
      IDENTITY_ACCEPTED: 'Accepted',
      ACTION_FAILED: 'Action failed',
    },
    MENTORSHIP: {
      REQUEST_ACCEPTED: 'Accepted',
      REQUEST_DECLINED: 'Declined',
    },
  },
}));

vi.mock('../Helper/SkeletonLoader', () => ({
  NotificationsSkeleton: () => <div data-testid="notifications-skeleton">Loading...</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import {
  GetNotifications,
  MarkNotificationAsRead,
  MarkAllNotificationsAsRead,
  DeleteNotification as DeleteNotificationApi,
  UpdateNotification,
  ClearAllNotifications,
  MarkNotificationGroupRead,
} from '../../api/notificationApis';
import { RespondToDirectMentorshipRequest } from '../../api/mentorshipApis';
import { RespondToIdentityReveal } from '../../api/messaging';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../Helper/ShowToast';

const mockedGetNotifications = vi.mocked(GetNotifications);
const mockedMarkAsRead = vi.mocked(MarkNotificationAsRead);
const mockedMarkAllRead = vi.mocked(MarkAllNotificationsAsRead);
const mockedDeleteNotification = vi.mocked(DeleteNotificationApi);
const mockedUpdateNotification = vi.mocked(UpdateNotification);
const mockedClearAll = vi.mocked(ClearAllNotifications);
const mockedMarkGroupRead = vi.mocked(MarkNotificationGroupRead);
const mockedRespondMentorship = vi.mocked(RespondToDirectMentorshipRequest);
const mockedRespondReveal = vi.mocked(RespondToIdentityReveal);
const mockedUseAuth = vi.mocked(useAuth);
const mockedShowToast = vi.mocked(showToast);

const mockNotifications = [
  {
    id: 'n1',
    user_id: 'u1',
    actor_id: 'u2',
    type: 'follow',
    title: 'New Follower',
    message: 'Someone followed you',
    action_url: null,
    reference_id: null,
    reference_type: null,
    is_read: false,
    action_taken: false,
    metadata: {},
    created_at: new Date(Date.now() - 60000).toISOString(),
    read_at: null,
  },
  {
    id: 'n2',
    user_id: 'u1',
    actor_id: 'u3',
    type: 'mentorship_request',
    title: 'Mentorship Request',
    message: 'Someone wants to be your mentee',
    action_url: null,
    reference_id: 'req-1',
    reference_type: 'mentorship',
    is_read: true,
    action_taken: false,
    metadata: {},
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read_at: new Date().toISOString(),
  },
  {
    id: 'n3',
    user_id: 'u1',
    actor_id: 'u4',
    type: 'forum_post',
    title: 'New Post',
    message: 'Someone posted in a forum',
    action_url: null,
    reference_id: 'topic-1',
    reference_type: 'topic',
    is_read: true,
    action_taken: false,
    metadata: {},
    created_at: new Date(Date.now() - 86400000).toISOString(),
    read_at: new Date().toISOString(),
  },
];

function setup(overrides: any[] = mockNotifications) {
  mockedUseAuth.mockReturnValue({
    user: { id: 'u1', username: 'TestUser' },
  } as any);

  mockedGetNotifications.mockResolvedValue({
    data: overrides,
    pagination: { page: 1, totalPages: 1 },
  });

  mockedMarkAsRead.mockResolvedValue({ success: true });
  mockedMarkAllRead.mockResolvedValue({ success: true });
  mockedDeleteNotification.mockResolvedValue({ success: true });
  mockedUpdateNotification.mockResolvedValue({ success: true });
  mockedClearAll.mockResolvedValue({ success: true });
  mockedMarkGroupRead.mockResolvedValue({ success: true });
  mockedRespondMentorship.mockResolvedValue({ success: true });
  mockedRespondReveal.mockResolvedValue({ success: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Mock window.confirm
  window.confirm = vi.fn(() => true);
  // Mock window.dispatchEvent
  window.dispatchEvent = vi.fn() as any;
});

describe('NotificationsView', () => {
  it('shows skeleton while loading', () => {
    mockedUseAuth.mockReturnValue({ user: { id: 'u1' } } as any);
    mockedGetNotifications.mockReturnValue(new Promise(() => {})); // never resolves

    renderWithRouter(<NotificationsView />);

    expect(screen.getByTestId('notifications-skeleton')).toBeInTheDocument();
  });

  it('renders notifications after loading', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    expect(screen.getByText('New Follower')).toBeInTheDocument();
    expect(screen.getByText('Mentorship Request')).toBeInTheDocument();
    expect(screen.getByText('New Post')).toBeInTheDocument();
  });

  it('shows unread count', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('1 unread')).toBeInTheDocument();
    });
  });

  it('marks single notification as read on click', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('New Follower')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('New Follower'));

    await waitFor(() => {
      expect(mockedMarkAsRead).toHaveBeenCalledWith('n1');
    });
  });

  it('marks all as read', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('New Follower')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // The button text is "Mark all read" (with "Mark all" hidden on small screens)
    // Find button containing "read" that also has the CheckCircle icon
    const markAllBtn = screen.getAllByRole('button').find(
      btn => btn.textContent?.includes('read') && !btn.textContent?.includes('Mark as read') && !btn.textContent?.includes('Unread')
    );
    expect(markAllBtn).toBeTruthy();
    await user.click(markAllBtn!);

    await waitFor(() => {
      expect(mockedMarkAllRead).toHaveBeenCalled();
    });
  });

  it('clears all notifications', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('New Follower')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Find the "Clear all" / "Clear" button
    const clearBtn = screen.getAllByRole('button').find(
      btn => btn.textContent?.toLowerCase().includes('clear')
    );
    await user.click(clearBtn!);

    await waitFor(() => {
      expect(mockedClearAll).toHaveBeenCalled();
    });

    expect(mockedShowToast).toHaveBeenCalledWith('All cleared', 'success');
  });

  it('deletes a single notification via menu', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('New Follower')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Click the options menu button for first notification
    const menuBtns = screen.getAllByLabelText('Notification options');
    await user.click(menuBtns[0]);

    // Should show menu with Delete
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockedDeleteNotification).toHaveBeenCalledWith('n1');
    });
  });

  it('marks as read via menu for unread notification', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('New Follower')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const menuBtns = screen.getAllByLabelText('Notification options');
    await user.click(menuBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Mark as read')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Mark as read'));

    await waitFor(() => {
      expect(mockedMarkAsRead).toHaveBeenCalledWith('n1');
    });
  });

  it('handles accept mentorship action', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('Mentorship Request')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Find Accept button within the mentorship notification
    const acceptBtns = screen.getAllByText('Accept');
    await user.click(acceptBtns[0]);

    await waitFor(() => {
      expect(mockedRespondMentorship).toHaveBeenCalledWith('req-1', { action: 'accept' });
    });

    expect(mockedShowToast).toHaveBeenCalledWith('Accepted', 'success');
  });

  it('handles decline mentorship action', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('Mentorship Request')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const declineBtns = screen.getAllByText('Decline');
    await user.click(declineBtns[0]);

    await waitFor(() => {
      expect(mockedRespondMentorship).toHaveBeenCalledWith('req-1', { action: 'decline' });
    });

    expect(mockedShowToast).toHaveBeenCalledWith('Declined', 'info');
  });

  it('shows empty state when no notifications', async () => {
    setup([]);
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  it('shows "All caught up!" when filter is unread and none exist', async () => {
    setup([]);
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    expect(screen.getByText('All caught up!')).toBeInTheDocument();
  });

  it('filters by unread tab', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('New Follower')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Click Unread filter tab
    const unreadTab = screen.getAllByRole('button').find(
      btn => btn.textContent?.includes('Unread')
    );
    await user.click(unreadTab!);

    // API should be called again with is_read=false
    await waitFor(() => {
      expect(mockedGetNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ is_read: false })
      );
    });
  });

  it('navigates to correct route on notification click', async () => {
    setup();
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('New Follower')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('New Follower'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/profile?tab=profile');
    });
  });

  it('handles API error gracefully', async () => {
    mockedUseAuth.mockReturnValue({ user: { id: 'u1' } } as any);
    mockedGetNotifications.mockRejectedValue(new Error('Network'));

    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('handles identity reveal accept', async () => {
    const revealNotification = {
      id: 'n4',
      user_id: 'u1',
      actor_id: 'u5',
      type: 'identity_reveal_request',
      title: 'Identity Reveal Request',
      message: 'Someone wants to reveal identity',
      action_url: null,
      reference_id: 'reveal-1',
      reference_type: null,
      is_read: false,
      action_taken: false,
      metadata: { conversation_id: 'conv-1' },
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setup([revealNotification]);
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('Identity Reveal Request')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(mockedRespondReveal).toHaveBeenCalledWith('reveal-1', 'accepted');
    });

    expect(mockedShowToast).toHaveBeenCalledWith('Accepted', 'success');
  });

  it('handles identity reveal decline', async () => {
    const revealNotification = {
      id: 'n4',
      user_id: 'u1',
      actor_id: 'u5',
      type: 'identity_reveal_request',
      title: 'Identity Reveal Request',
      message: 'Someone wants to reveal identity',
      action_url: null,
      reference_id: 'reveal-1',
      reference_type: null,
      is_read: false,
      action_taken: false,
      metadata: {},
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setup([revealNotification]);
    renderWithRouter(<NotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('Identity Reveal Request')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Decline'));

    await waitFor(() => {
      expect(mockedRespondReveal).toHaveBeenCalledWith('reveal-1', 'rejected');
    });

    expect(mockedShowToast).toHaveBeenCalledWith('Declined', 'info');
  });
});
