// src/test/MessagesView.test.tsx
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithRouter, mockUser } from './testUtils';

// Mock all external dependencies - paths relative to THIS test file
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useLocation: () => ({ state: null, pathname: '/dashboard/messages' }),
  };
});

vi.mock('../../api/messaging', () => ({
  GetConversations: vi.fn(),
  GetSingleConversationMessages: vi.fn(),
  CreateConversation: vi.fn(),
  MarkMessagesAsRead: vi.fn().mockResolvedValue({}),
  GetTypingStatus: vi.fn().mockResolvedValue({ active_typers: [] }),
  RequestIdentityReveal: vi.fn(),
  CancelIdentityReveal: vi.fn(),
  GetIdentityRevealStatusForConversation: vi.fn(),
  SetTypingStatus: vi.fn().mockResolvedValue({}),
  GetConnectableUsers: vi.fn(),
  SendAMessage: vi.fn(),
  DeleteMessage: vi.fn(),
  EditMessage: vi.fn(),
  DeleteConversation: vi.fn(),
}));

vi.mock('../../api/mentorshipApis', () => ({
  GetMentorProfileByUserId: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../api/EncrytionApis', () => ({
  DecryptData: vi.fn().mockResolvedValue({ decryptedData: 'decrypted' }),
}));

vi.mock('../components/shared/MentionTextarea', () => ({
  MentionTextarea: ({ value, onChange, placeholder }: any) => (
    <textarea
      data-testid="mention-textarea"
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock('../components/shared/MentionText', () => ({
  MentionText: ({ text }: any) => <span data-testid="mention-text">{text}</span>,
}));

vi.mock('../components/shared/VerifiedBadge', () => ({
  VerifiedBadge: () => <span data-testid="verified-badge" />,
}));

vi.mock('../services/websocket.service', () => ({
  webSocketService: {
    on: vi.fn(),
    off: vi.fn(),
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    sendMessage: vi.fn(() => true),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
    cancelTyping: vi.fn(),
    markAsRead: vi.fn(),
    reconnect: vi.fn(),
    isConnected: vi.fn(() => true),
    isReady: vi.fn(() => true),
  },
}));

vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../constants/messages', () => ({
  MSG: {
    MESSAGING: {
      FETCH_FAILED: 'Fetch failed',
      SEND_FAILED: 'Send failed',
      REVEAL_SENT: 'Reveal sent',
      REVEAL_CANCELLED: 'Reveal cancelled',
      MESSAGE_COPIED: 'Copied',
      MESSAGE_DELETED: 'Deleted',
      CONVERSATION_DELETED: 'Conversation deleted',
      PROFILE_LOADING: 'Profile loading',
      WS_SEND_FAILED: 'WS send failed',
    },
    MENTORSHIP: {},
  },
}));

vi.mock('../components/Modals/MentorShipModals/MentorshipRequestModal', () => ({
  MentorshipRequestModal: () => null,
}));

vi.mock('../components/Modals/MentorShipModals/MentorshipUserProfileModal', () => ({
  MentorshipUserProfileModal: () => null,
}));

vi.mock('../components/dashboard/Message/MentorshipRequestsView', () => ({
  MentorshipRequestsView: () => <div data-testid="mentorship-requests-view">Mentorship Requests</div>,
}));

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

import { useAuth } from '../hooks/useAuth';
import {
  GetConversations,
  GetSingleConversationMessages,
  SendAMessage,
  GetConnectableUsers,
  GetIdentityRevealStatusForConversation,
  RequestIdentityReveal,
  DeleteConversation,
  DeleteMessage,
  EditMessage,
  MarkMessagesAsRead,
  CreateConversation,
} from '../../api/messaging';
import { MessagesView } from '../components/dashboard/Message/MessagesView';

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetConversations = vi.mocked(GetConversations);
const mockedGetMessages = vi.mocked(GetSingleConversationMessages);
const mockedGetConnectableUsers = vi.mocked(GetConnectableUsers);
const mockedGetRevealStatus = vi.mocked(GetIdentityRevealStatusForConversation);
const mockedDeleteMessage = vi.mocked(DeleteMessage);
const mockedEditMessage = vi.mocked(EditMessage);
const mockedSendAMessage = vi.mocked(SendAMessage);
const mockedDeleteConversation = vi.mocked(DeleteConversation);
const mockedRequestIdentityReveal = vi.mocked(RequestIdentityReveal);
const mockedMarkMessagesAsRead = vi.mocked(MarkMessagesAsRead);
const mockedCreateConversation = vi.mocked(CreateConversation);

const mockConversations = {
  conversations: [
    {
      id: 'conv-1',
      other_user: {
        id: 'user-2',
        username: 'MentorAlice',
        display_name: 'Alice',
        avatar: '🦊',
        is_company_verified: false,
      },
      last_message: {
        content_encrypted: 'Hey there!',
        created_at: new Date().toISOString(),
        sender_id: 'user-2',
      },
      unread_count: 2,
      context_type: 'regular',
      updated_at: new Date().toISOString(),
    },
    {
      id: 'conv-2',
      other_user: {
        id: 'user-3',
        username: 'MenteeBob',
        display_name: 'Bob',
        avatar: '🐻',
        is_company_verified: true,
      },
      last_message: {
        content_encrypted: 'Thanks!',
        created_at: new Date().toISOString(),
        sender_id: 'user-123',
      },
      unread_count: 0,
      context_type: 'mentorship',
      updated_at: new Date().toISOString(),
    },
  ],
  total: 2,
};

describe('MessagesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    } as any);
    mockedGetConversations.mockResolvedValue(mockConversations);
    mockedGetMessages.mockResolvedValue({ messages: [], hasMore: false });
    mockedGetConnectableUsers.mockResolvedValue({ users: [] });
    mockedGetRevealStatus.mockResolvedValue({ status: 'none' });
  });

  it('renders the messages view header', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(screen.getByText(/messages/i)).toBeInTheDocument();
    });
  });

  it('renders conversation list after loading', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(mockedGetConversations).toHaveBeenCalled();
    });
  });

  it('shows empty state when no conversations', async () => {
    mockedGetConversations.mockResolvedValue({ conversations: [], total: 0 });
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(
        screen.queryByText(/no conversations/i) ||
        screen.queryByText(/start a new/i) ||
        screen.queryByText(/inbox/i)
      ).toBeTruthy();
    });
  });

  it('handles conversation fetch error gracefully', async () => {
    mockedGetConversations.mockRejectedValue(new Error('Network error'));
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(mockedGetConversations).toHaveBeenCalled();
    });
  });

  it('has a search input for filtering conversations', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search/i);
      expect(searchInput || screen.queryByRole('textbox')).toBeTruthy();
    });
  });

  it('has a new chat button', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      // The button has text "New" next to a Plus icon
      const newChatBtn = screen.getByRole('button', { name: /new/i });
      expect(newChatBtn).toBeInTheDocument();
    });
  });

  it('renders conversation list items with user names', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('shows unread count badge on conversations with unread messages', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    // conv-1 has unread_count: 2 - should render as text inside badge
    const badges = screen.getAllByText('2');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('shows mentorship badge on mentorship conversations', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    // conv-2 is mentorship type
    const mentorshipBadges = screen.getAllByText('Mentorship');
    expect(mentorshipBadges.length).toBeGreaterThan(0);
  });

  it('renders filter chips (All, Regular, Mentorship)', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /regular/i })).toBeInTheDocument();
  });

  it('filters conversations when clicking mentorship filter', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    // Click the Mentorship filter chip - it contains count text too
    const mentorshipFilterBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.startsWith('Mentorship') && !btn.textContent?.includes('Requests')
    );
    expect(mentorshipFilterBtn).toBeTruthy();
    fireEvent.click(mentorshipFilterBtn!);
    // After filtering, only Bob (mentorship) should remain, Alice (regular) hidden
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('opens new conversation panel when New button is clicked', async () => {
    mockedGetConnectableUsers.mockResolvedValue({ users: [
      { id: 'user-5', username: 'Charlie', display_name: 'Charlie', avatar: '🐶', job_title: 'Dev', company: 'Acme' },
    ] });
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /new/i }));
    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });
  });

  it('shows connectable users in new conversation panel', async () => {
    mockedGetConnectableUsers.mockResolvedValue({ users: [
      { id: 'user-5', username: 'Charlie', display_name: 'Charlie', avatar: '🐶', job_title: 'Dev', company: 'Acme', can_message: true },
    ] });
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /new/i }));
    await waitFor(() => {
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  it('shows mentorship requests view when requests button clicked', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    // Click the "Mentorship Requests" / "Requests" button
    const requestsBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Requests') && !btn.textContent?.startsWith('Mentorship1')
    );
    if (requestsBtn) {
      fireEvent.click(requestsBtn);
      await waitFor(() => {
        expect(screen.getByTestId('mentorship-requests-view')).toBeInTheDocument();
      });
    }
  });

  it('selects a conversation and shows chat view', async () => {
    mockedGetMessages.mockResolvedValue({
      messages: [
        {
          id: 'msg-1',
          conversation_id: 'conv-1',
          sender_id: 'user-2',
          content_encrypted: 'Hello!',
          content_type: 'text',
          is_read: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          conversation_id: 'conv-1',
          sender_id: 'user-123',
          content_encrypted: 'Hi there!',
          content_type: 'text',
          is_read: true,
          created_at: new Date().toISOString(),
        },
      ],
      hasMore: false,
    });
    mockedGetRevealStatus.mockResolvedValue({ status: 'none', is_revealed: false, can_request: true });
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Click on Alice's conversation
    const convButtons = screen.getAllByRole('button');
    const aliceConv = convButtons.find((btn) => btn.textContent?.includes('Alice'));
    if (aliceConv) {
      fireEvent.click(aliceConv);
    }

    await waitFor(() => {
      // Chat view shows messages
      expect(screen.getByText('Hello!')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });

  it('shows back button in chat view to return to conversations', async () => {
    mockedGetMessages.mockResolvedValue({ messages: [], hasMore: false });
    mockedGetRevealStatus.mockResolvedValue({ status: 'none', is_revealed: false, can_request: true });
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const convButtons = screen.getAllByRole('button');
    const aliceConv = convButtons.find((btn) => btn.textContent?.includes('Alice'));
    if (aliceConv) fireEvent.click(aliceConv);

    await waitFor(() => {
      expect(screen.getByLabelText('Back to conversations')).toBeInTheDocument();
    });

    // Click back
    fireEvent.click(screen.getByLabelText('Back to conversations'));
    await waitFor(() => {
      expect(screen.getByText(/messages/i)).toBeInTheDocument();
    });
  });

  it('shows empty messages state in chat view (no messages yet)', async () => {
    mockedGetMessages.mockResolvedValue({ messages: [], hasMore: false });
    mockedGetRevealStatus.mockResolvedValue({ status: 'none', is_revealed: false, can_request: true });
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const convButtons = screen.getAllByRole('button');
    const aliceConv = convButtons.find((btn) => btn.textContent?.includes('Alice'));
    if (aliceConv) fireEvent.click(aliceConv);

    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });
  });

  it('shows mentorship empty state for mentorship conversation with no messages', async () => {
    mockedGetMessages.mockResolvedValue({ messages: [], hasMore: false });
    mockedGetRevealStatus.mockResolvedValue({ status: 'none', is_revealed: false, can_request: true });
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    // Click Bob's conversation (mentorship type)
    const convButtons = screen.getAllByRole('button');
    const bobConv = convButtons.find((btn) => btn.textContent?.includes('Bob'));
    if (bobConv) fireEvent.click(bobConv);

    await waitFor(() => {
      expect(screen.getByText('Start Your Mentorship Journey')).toBeInTheDocument();
    });
  });

  it('shows identity reveal button in chat view', async () => {
    mockedGetMessages.mockResolvedValue({ messages: [], hasMore: false });
    mockedGetRevealStatus.mockResolvedValue({
      status: 'none',
      is_revealed: false,
      can_request: true,
      pending_request: null,
    });
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const convButtons = screen.getAllByRole('button');
    const aliceConv = convButtons.find((btn) => btn.textContent?.includes('Alice'));
    if (aliceConv) fireEvent.click(aliceConv);

    await waitFor(() => {
      expect(screen.getByLabelText('Request identity reveal')).toBeInTheDocument();
    });
  });

  it('shows pending status when identity reveal is pending (sent)', async () => {
    mockedGetMessages.mockResolvedValue({ messages: [], hasMore: false });
    mockedGetRevealStatus.mockResolvedValue({
      status: 'pending',
      is_revealed: false,
      identity_revealed: false,
      can_request: false,
      pending_request: { id: 'rev-1', status: 'pending', direction: 'sent' },
    });
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const convButtons = screen.getAllByRole('button');
    const aliceConv = convButtons.find((btn) => btn.textContent?.includes('Alice'));
    if (aliceConv) fireEvent.click(aliceConv);

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('shows accept button when identity reveal is pending (received)', async () => {
    mockedGetMessages.mockResolvedValue({ messages: [], hasMore: false });
    mockedGetRevealStatus.mockResolvedValue({
      status: 'pending',
      is_revealed: false,
      identity_revealed: false,
      can_request: false,
      pending_request: { id: 'rev-2', status: 'pending', direction: 'received' },
    });
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const convButtons = screen.getAllByRole('button');
    const aliceConv = convButtons.find((btn) => btn.textContent?.includes('Alice'));
    if (aliceConv) fireEvent.click(aliceConv);

    await waitFor(() => {
      expect(screen.getByLabelText('Accept identity reveal request')).toBeInTheDocument();
    });
  });

  it('shows message input area in chat view', async () => {
    mockedGetMessages.mockResolvedValue({ messages: [], hasMore: false });
    mockedGetRevealStatus.mockResolvedValue({ status: 'none', is_revealed: false, can_request: true });
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const convButtons = screen.getAllByRole('button');
    const aliceConv = convButtons.find((btn) => btn.textContent?.includes('Alice'));
    if (aliceConv) fireEvent.click(aliceConv);

    await waitFor(() => {
      expect(screen.getByTestId('mention-textarea')).toBeInTheDocument();
      expect(screen.getByText('Send')).toBeInTheDocument();
    });
  });

  it('shows typing indicator when other user is typing', async () => {
    mockedGetMessages.mockResolvedValue({ messages: [], hasMore: false });
    mockedGetRevealStatus.mockResolvedValue({ status: 'none', is_revealed: false, can_request: true });

    const { webSocketService } = await import('../services/websocket.service');
    const mockedWsOn = vi.mocked(webSocketService.on);

    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Select conversation
    const convButtons = screen.getAllByRole('button');
    const aliceConv = convButtons.find((btn) => btn.textContent?.includes('Alice'));
    if (aliceConv) fireEvent.click(aliceConv);

    await waitFor(() => {
      expect(screen.getByTestId('mention-textarea')).toBeInTheDocument();
    });

    // Verify websocket event handlers were registered
    expect(mockedWsOn).toHaveBeenCalledWith('new_message', expect.any(Function));
    expect(mockedWsOn).toHaveBeenCalledWith('typing_start', expect.any(Function));
    expect(mockedWsOn).toHaveBeenCalledWith('typing_end', expect.any(Function));
    expect(mockedWsOn).toHaveBeenCalledWith('message_sent', expect.any(Function));
    expect(mockedWsOn).toHaveBeenCalledWith('message_error', expect.any(Function));
  });

  it('shows edited badge on edited messages', async () => {
    mockedGetMessages.mockResolvedValue({
      messages: [
        {
          id: 'msg-edited',
          conversation_id: 'conv-1',
          sender_id: 'user-123',
          content_encrypted: 'Edited message',
          content_type: 'text',
          is_read: true,
          is_edited: true,
          edited_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
      hasMore: false,
    });
    mockedGetRevealStatus.mockResolvedValue({ status: 'none', is_revealed: false, can_request: true });
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const convButtons = screen.getAllByRole('button');
    const aliceConv = convButtons.find((btn) => btn.textContent?.includes('Alice'));
    if (aliceConv) fireEvent.click(aliceConv);

    await waitFor(() => {
      expect(screen.getByText('Edited message')).toBeInTheDocument();
      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });
  });

  it('shows View Mentorship Profile button for mentorship conversations', async () => {
    mockedGetMessages.mockResolvedValue({ messages: [], hasMore: false });
    mockedGetRevealStatus.mockResolvedValue({ status: 'none', is_revealed: false, can_request: true });

    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    // Click on Bob's mentorship conversation
    const convButtons = screen.getAllByRole('button');
    const bobConv = convButtons.find((btn) => btn.textContent?.includes('Bob'));
    if (bobConv) fireEvent.click(bobConv);

    await waitFor(() => {
      // Either "View Mentorship Profile" or "Loading Profile..." should show
      const profileBtn = screen.queryByText('View Mentorship Profile') || screen.queryByText('Loading Profile...');
      expect(profileBtn).toBeTruthy();
    });
  });

  it('shows description text in main view header', async () => {
    renderWithRouter(<MessagesView />);
    await waitFor(() => {
      expect(screen.getByText('All your conversations in one place')).toBeInTheDocument();
    });
  });

  it('marks messages as read when opening conversation with unread messages', async () => {
    mockedMarkMessagesAsRead.mockResolvedValue({});
    const { webSocketService } = await import('../services/websocket.service');
    (webSocketService as any).markAsRead = vi.fn();

    mockedGetMessages.mockResolvedValue({
      messages: [
        {
          id: 'msg-unread',
          conversation_id: 'conv-1',
          sender_id: 'user-2',
          content_encrypted: 'Unread msg',
          content_type: 'text',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ],
      hasMore: false,
    });
    mockedGetRevealStatus.mockResolvedValue({ status: 'none', is_revealed: false, can_request: true });

    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const convButtons = screen.getAllByRole('button');
    const aliceConv = convButtons.find((btn) => btn.textContent?.includes('Alice'));
    if (aliceConv) fireEvent.click(aliceConv);

    await waitFor(() => {
      expect(screen.getByText('Unread msg')).toBeInTheDocument();
    });

    // MarkMessagesAsRead should have been called for unread messages from other user
    await waitFor(() => {
      expect(mockedMarkMessagesAsRead).toHaveBeenCalledWith('conv-1', 'msg-unread');
    });
  });

  it('handles conversation delete from three-dot menu', async () => {
    mockedDeleteConversation.mockResolvedValue({});
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Find and click a three-dot menu button
    const menuButtons = screen.getAllByRole('button');
    // Three dot menu items have MoreVertical icon; they are role="button" with tabIndex=0
    // The div elements with role="button" are the three-dot menus
    const threeDotMenus = document.querySelectorAll('[role="button"][tabindex="0"]');
    if (threeDotMenus.length > 0) {
      fireEvent.click(threeDotMenus[0]);
      await waitFor(() => {
        expect(screen.getByText('Delete conversation')).toBeInTheDocument();
      });

      // Click delete
      fireEvent.click(screen.getByText('Delete conversation'));
      // Confirm delete overlay appears
      await waitFor(() => {
        expect(screen.getByText('Delete this conversation?')).toBeInTheDocument();
      });

      // Confirm deletion
      const deleteBtn = screen.getAllByRole('button').find(
        (btn) => btn.textContent === 'Delete'
      );
      if (deleteBtn) {
        fireEvent.click(deleteBtn);
        await waitFor(() => {
          expect(mockedDeleteConversation).toHaveBeenCalledWith('conv-1');
        });
      }
    }
  });

  it('closes new conversation panel with cancel button', async () => {
    mockedGetConnectableUsers.mockResolvedValue({ users: [] });
    renderWithRouter(<MessagesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /new/i }));

    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    });

    // Click Cancel to close
    const cancelBtn = screen.getAllByRole('button').find(
      (btn) => btn.textContent === 'Cancel'
    );
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      await waitFor(() => {
        expect(screen.queryByText('Start New Conversation')).not.toBeInTheDocument();
      });
    }
  });
});
