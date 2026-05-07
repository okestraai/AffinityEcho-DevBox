// src/test/NookDetails.test.tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NookDetail } from '../components/dashboard/Nooks/NookDetails';
import { renderWithRouter } from './testUtils';

// Mock APIs
vi.mock('../../api/nookApis', () => ({
  GetNookMessagesByNookId: vi.fn(),
  PostNookMessageByNookId: vi.fn(),
  toggleMessageReaction: vi.fn(),
  EditNookMessage: vi.fn(),
}));

vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../constants/messages', () => ({
  MSG: {
    NOOK: {
      POST_FAILED: 'Failed to post',
      REACTION_FAILED: 'Reaction failed',
      EDIT_MSG_FAILED: 'Edit failed',
    },
  },
}));

vi.mock('../Helper/SkeletonLoader', () => ({
  NookMessageSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

// Mock NookMessage component to simplify testing
vi.mock('../components/dashboard/Nooks/NookMessage', () => ({
  NookMessage: (props: any) => (
    <div data-testid={`message-${props.message.id}`}>
      <span>{props.message.content}</span>
      <button
        data-testid={`react-${props.message.id}`}
        onClick={() => props.onReact(props.message.id, 'helpful')}
      >
        React
      </button>
      <button
        data-testid={`reply-${props.message.id}`}
        onClick={() => props.onReply(props.message.id, props.message.content)}
      >
        Reply
      </button>
      <button
        data-testid={`edit-${props.message.id}`}
        onClick={() => props.onEdit(props.message.id, 'edited content')}
      >
        Edit
      </button>
    </div>
  ),
}));

// Mock NookMessageInput
vi.mock('../components/dashboard/Nooks/NookMessageInput', () => ({
  NookMessageInput: (props: any) => (
    <div data-testid="message-input">
      <button
        data-testid="send-message"
        onClick={() => props.onSendMessage('New message text')}
      >
        Send
      </button>
      {props.replyingTo && (
        <button data-testid="cancel-reply" onClick={props.onCancelReply}>
          Cancel Reply
        </button>
      )}
    </div>
  ),
}));

// Mock OkestraPanel
vi.mock('../components/dashboard/OkestraPanel', () => ({
  OkestraPanel: () => null,
}));

import {
  GetNookMessagesByNookId,
  PostNookMessageByNookId,
  toggleMessageReaction,
  EditNookMessage,
} from '../../api/nookApis';
import { showToast } from '../Helper/ShowToast';

const mockedGetMessages = vi.mocked(GetNookMessagesByNookId);
const mockedPostMessage = vi.mocked(PostNookMessageByNookId);
const mockedToggleReaction = vi.mocked(toggleMessageReaction);
const mockedEditMessage = vi.mocked(EditNookMessage);
const mockedShowToast = vi.mocked(showToast);

const mockNook = {
  id: 'nook-1',
  title: 'Test Nook',
  description: 'A test nook description',
  members_count: 10,
  messages_count: 5,
  timeLeft: '2h 30m',
  temperature: 'hot',
  isMember: true,
  isCreator: false,
};

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hello from the nook',
    user_id: 'u2',
    user: { username: 'Anonymous', avatar: '🔒' },
    user_reactions: [],
    helpful_count: 3,
    validated_count: 1,
    replies: [],
    created_at: new Date().toISOString(),
  },
  {
    id: 'msg-2',
    content: 'Second message',
    user_id: 'u1',
    user: { username: 'Anonymous', avatar: '🔒' },
    user_reactions: [{ user_id: 'u1', reaction_type: 'helpful' }],
    helpful_count: 1,
    validated_count: 0,
    replies: [],
    created_at: new Date().toISOString(),
  },
];

const mockOnBack = vi.fn();
const mockOnUserClick = vi.fn();
const mockOnNookUpdated = vi.fn();

function setup(messageOverride?: any[]) {
  mockedGetMessages.mockResolvedValue({
    messages: messageOverride ?? mockMessages,
  });
  mockedPostMessage.mockResolvedValue({ success: true });
  mockedToggleReaction.mockResolvedValue({ success: true });
  mockedEditMessage.mockResolvedValue({ success: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Mock scrollIntoView for jsdom
  Element.prototype.scrollIntoView = vi.fn();
  // Mock scrollTo on elements
  Element.prototype.scrollTo = vi.fn() as any;
});

describe('NookDetail', () => {
  it('renders nook header information', async () => {
    setup();
    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    expect(screen.getByText('Test Nook')).toBeInTheDocument();
    expect(screen.getByText('A test nook description')).toBeInTheDocument();
    // "2h 30m" appears in both "Expires in" and "Auto-deletes in"
    expect(screen.getAllByText(/2h 30m/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/10 anonymous/)).toBeInTheDocument();
  });

  it('loads and displays messages', async () => {
    setup();
    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
    });

    expect(screen.getByText('Hello from the nook')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('shows empty state when no messages', async () => {
    setup([]);
    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Be the first to speak')).toBeInTheDocument();
  });

  it('sends a new message', async () => {
    setup();
    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('send-message')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('send-message'));

    await waitFor(() => {
      expect(mockedPostMessage).toHaveBeenCalledWith('nook-1', {
        content: 'New message text',
        is_anonymous: true,
      });
    });
  });

  it('handles reaction on a message', async () => {
    setup();
    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('react-msg-1')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('react-msg-1'));

    await waitFor(() => {
      expect(mockedToggleReaction).toHaveBeenCalledWith('msg-1', { reaction_type: 'helpful' });
    });
  });

  it('handles reply to a message', async () => {
    setup();
    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('reply-msg-1')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('reply-msg-1'));

    // Should show replying indicator
    await waitFor(() => {
      expect(screen.getByText('Replying to')).toBeInTheDocument();
    });

    // The reply content appears in the replying-to bar
    // "Hello from the nook" appears both in message list and reply bar
    expect(screen.getAllByText('Hello from the nook').length).toBeGreaterThanOrEqual(2);
  });

  it('cancels reply', async () => {
    setup();
    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('reply-msg-1')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('reply-msg-1'));

    await waitFor(() => {
      expect(screen.getByText('Replying to')).toBeInTheDocument();
    });

    // Cancel via the cancel button rendered by NookMessageInput mock
    await user.click(screen.getByTestId('cancel-reply'));

    await waitFor(() => {
      expect(screen.queryByText('Replying to')).not.toBeInTheDocument();
    });
  });

  it('handles edit message', async () => {
    setup();
    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-msg-1')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('edit-msg-1'));

    await waitFor(() => {
      expect(mockedEditMessage).toHaveBeenCalledWith('nook-1', 'msg-1', 'edited content');
    });
  });

  it('navigates back when back button is clicked', async () => {
    setup();
    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    const user = userEvent.setup();
    const backBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Back to Nooks'));
    await user.click(backBtn!);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows error when messages fail to load', async () => {
    mockedGetMessages.mockRejectedValue({
      response: { data: { error: { message: 'Access denied' } } },
    });

    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    });
  });

  it('shows toast when send message fails', async () => {
    setup();
    mockedPostMessage.mockRejectedValue(new Error('Send failed'));

    renderWithRouter(
      <NookDetail
        nook={mockNook}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('send-message')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('send-message'));

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith('Failed to post', 'error');
    });
  });

  it('displays temperature indicator', () => {
    setup();
    renderWithRouter(
      <NookDetail
        nook={{ ...mockNook, temperature: 'warm' }}
        userAvatar="🚀"
        currentUserId="u1"
        onBack={mockOnBack}
        onUserClick={mockOnUserClick}
        onNookUpdated={mockOnNookUpdated}
      />
    );

    expect(screen.getByText('warm')).toBeInTheDocument();
  });
});
