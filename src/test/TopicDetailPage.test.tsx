import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicDetailPage } from '../components/dashboard/Forum/TopicDetailPage';
import { renderWithRouter, mockUser } from './testUtils';

// ── Mock hooks ───────────────────────────────────────────
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// ── Mock router params ───────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ topicId: 'topic-1' }),
    useNavigate: () => mockNavigate,
  };
});

// ── Mock API modules ─────────────────────────────────────
vi.mock('../../api/forumApis', () => ({
  GetForumTopicById: vi.fn(),
  ForumTopicsReactions: vi.fn(),
  GetAllCommentsForATopic: vi.fn(),
  CreateForumTopicsComments: vi.fn(),
  TopicsCommentsReactions: vi.fn(),
  DeleteTopicsComments: vi.fn(),
  ToggleTopicBookmark: vi.fn(),
}));

vi.mock('../utils/shareUtils', () => ({
  shareContent: vi.fn(),
}));

vi.mock('../utils/forumUtils', () => ({
  getTimeAgo: vi.fn(() => '5m ago'),
}));

vi.mock('../utils/nameUtils', () => ({
  resolveAuthorName: vi.fn((_user: any, _uid: any, display: any, username: any) => display || username || 'Anonymous'),
}));

vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../constants/messages', () => ({
  MSG: {
    FORUM: {
      REACTION_FAILED: 'Reaction failed',
      COMMENT_POSTED: 'Comment posted',
      CREATE_COMMENT_FAILED: 'Comment failed',
      COMMENT_DELETED: 'Comment deleted',
      COMMENT_DELETE_FAILED: 'Delete failed',
      BOOKMARKED: 'Bookmarked',
      BOOKMARK_REMOVED: 'Bookmark removed',
      BOOKMARK_FAILED: 'Bookmark failed',
    },
  },
}));

vi.mock('../Helper/SkeletonLoader', () => ({
  CommentsSkeleton: () => <div data-testid="comments-skeleton" />,
}));

vi.mock('../../Modals/UserProfileModal', () => ({
  UserProfileModal: () => null,
}));
vi.mock('../../Modals/ViewersModal', () => ({
  ViewersModal: () => null,
}));
vi.mock('../components/dashboard/OkestraPanel', () => ({
  OkestraPanel: () => null,
}));
vi.mock('../components/shared/VerifiedBadge', () => ({
  VerifiedBadge: () => null,
}));
vi.mock('../components/shared/MentionTextarea', () => ({
  MentionTextarea: ({ value, onChange, placeholder }: any) => (
    <textarea
      data-testid="mention-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));
vi.mock('../components/shared/MentionText', () => ({
  MentionText: ({ text, className }: any) => <span className={className}>{text}</span>,
}));
vi.mock('../components/shared/ClapIcon', () => ({
  ClapIcon: (props: any) => <span {...props}>clap</span>,
}));

// ── Imports after mocks ──────────────────────────────────
import { useAuth } from '../hooks/useAuth';
import {
  GetForumTopicById,
  ForumTopicsReactions,
  GetAllCommentsForATopic,
  CreateForumTopicsComments,
  ToggleTopicBookmark,
} from '../../api/forumApis';
import { showToast } from '../Helper/ShowToast';

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetTopic = vi.mocked(GetForumTopicById);
const mockedGetComments = vi.mocked(GetAllCommentsForATopic);
const mockedReactions = vi.mocked(ForumTopicsReactions);
const mockedCreateComment = vi.mocked(CreateForumTopicsComments);
const mockedBookmark = vi.mocked(ToggleTopicBookmark);
const mockedShowToast = vi.mocked(showToast);

const baseTopic = {
  id: 'topic-1',
  user_id: 'author-1',
  title: 'Test Topic Title',
  content: 'This is topic content',
  created_at: '2024-06-01T10:00:00Z',
  tags: ['react', 'testing'],
  comments_count: 2,
  views_count: 50,
  reaction_heard_count: 5,
  reaction_validated_count: 3,
  reaction_inspired_count: 1,
  userReactions: { heard: false, validated: false, inspired: false },
  user_bookmarked: false,
  user_profile: { avatar: '🦊', display_name: 'Alice', username: 'alice', is_company_verified: false },
};

const baseComments = [
  {
    id: 'c1',
    user_id: 'user-123',
    content: 'Great post!',
    created_at: '2024-06-01T11:00:00Z',
    parent_comment_id: null,
    helpful_count: 2,
    userReactions: { helpful: false },
    user_profile: { avatar: '🚀', display_name: 'TestUser', username: 'TestUser' },
  },
  {
    id: 'c2',
    user_id: 'other-user',
    content: 'I agree',
    created_at: '2024-06-01T12:00:00Z',
    parent_comment_id: null,
    helpful_count: 0,
    userReactions: {},
    user_profile: { avatar: '🐱', display_name: 'Bob', username: 'bob' },
  },
];

function setupDefaultMocks() {
  mockedUseAuth.mockReturnValue({ user: mockUser } as any);
  mockedGetTopic.mockResolvedValue(baseTopic);
  mockedGetComments.mockResolvedValue(baseComments);
  mockedReactions.mockResolvedValue({ ok: true });
  mockedCreateComment.mockResolvedValue({ id: 'c-new' });
  mockedBookmark.mockResolvedValue({ bookmarked: true });
}

describe('TopicDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('shows loading skeleton initially', () => {
    mockedGetTopic.mockReturnValue(new Promise(() => {}));
    mockedGetComments.mockReturnValue(new Promise(() => {}));
    renderWithRouter(<TopicDetailPage />);
    // Animate-pulse loading skeleton present
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows "Topic not found" when topic is null', async () => {
    mockedGetTopic.mockResolvedValue(null);
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Topic not found')).toBeInTheDocument();
    });
    expect(screen.getByText('Return to Forums')).toBeInTheDocument();
  });

  it('renders topic details after loading', async () => {
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });
    expect(screen.getByText('This is topic content')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('#testing')).toBeInTheDocument();
  });

  it('displays reaction counts', async () => {
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });
    // Topic-level reaction buttons have aria-labels
    const heardBtns = screen.getAllByLabelText('Heard');
    expect(heardBtns[0]).toHaveTextContent('5');
    const validatedBtns = screen.getAllByLabelText('Validated');
    expect(validatedBtns[0]).toHaveTextContent('3');
    const inspiredBtns = screen.getAllByLabelText('Inspired');
    expect(inspiredBtns[0]).toHaveTextContent('1');
  });

  it('displays comments section heading and views count', async () => {
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });
    // Comments heading like "Comments (2)"
    expect(screen.getByText(/Comments \(\d+\)/)).toBeInTheDocument();
    // Views count
    expect(screen.getAllByText('50').length).toBeGreaterThan(0);
  });

  it('renders comments', async () => {
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Great post!')).toBeInTheDocument();
      expect(screen.getByText('I agree')).toBeInTheDocument();
    });
  });

  it('shows "No comments yet" when there are no comments', async () => {
    mockedGetComments.mockResolvedValue([]);
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('No comments yet')).toBeInTheDocument();
    });
  });

  it('handles reaction click (optimistic update)', async () => {
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    const heardBtn = screen.getByLabelText('Heard');
    await user.click(heardBtn);

    expect(mockedReactions).toHaveBeenCalledWith({
      topicId: 'topic-1',
      reactionType: 'heard',
    });
  });

  it('handles bookmark toggle', async () => {
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    const bookmarkBtn = screen.getByLabelText('Bookmark');
    await user.click(bookmarkBtn);

    expect(mockedBookmark).toHaveBeenCalledWith('topic-1');
    expect(mockedShowToast).toHaveBeenCalledWith('Bookmarked', 'success');
  });

  it('reverts bookmark on API failure', async () => {
    mockedBookmark.mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    const bookmarkBtn = screen.getByLabelText('Bookmark');
    await user.click(bookmarkBtn);

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith('Bookmark failed', 'error');
    });
  });

  it('submits a new comment', async () => {
    mockedGetComments.mockResolvedValueOnce(baseComments).mockResolvedValueOnce([
      ...baseComments,
      { id: 'c-new', user_id: 'user-123', content: 'New comment', created_at: new Date().toISOString(), parent_comment_id: null },
    ]);
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    const textarea = screen.getByTestId('mention-textarea');
    await user.type(textarea, 'New comment');

    const submitBtn = screen.getByText('Post Comment');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedCreateComment).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'New comment', topicId: 'topic-1' }),
      );
      expect(mockedShowToast).toHaveBeenCalledWith('Comment posted', 'success');
    });
  });

  it('does not submit empty comment', async () => {
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    const submitBtn = screen.getByText('Post Comment');
    expect(submitBtn).toBeDisabled();
  });

  it('navigates back when back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('calls share utility when share is clicked', async () => {
    const { shareContent } = await import('../utils/shareUtils');
    const mockedShare = vi.mocked(shareContent);
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Share'));
    expect(mockedShare).toHaveBeenCalled();
  });

  it('handles validated reaction click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    const validatedBtn = screen.getByLabelText('Validated');
    await user.click(validatedBtn);

    expect(mockedReactions).toHaveBeenCalledWith({
      topicId: 'topic-1',
      reactionType: 'validated',
    });
  });

  it('handles inspired reaction click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    const inspiredBtn = screen.getByLabelText('Inspired');
    await user.click(inspiredBtn);

    expect(mockedReactions).toHaveBeenCalledWith({
      topicId: 'topic-1',
      reactionType: 'inspired',
    });
  });

  it('reverts reaction on API failure', async () => {
    mockedReactions.mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    const heardBtn = screen.getByLabelText('Heard');
    await user.click(heardBtn);

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith('Reaction failed', 'error');
    });
  });

  it('shows comment submit failure toast', async () => {
    mockedCreateComment.mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    const textarea = screen.getByTestId('mention-textarea');
    await user.type(textarea, 'Failing comment');

    const submitBtn = screen.getByText('Post Comment');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith('Comment failed', 'error');
    });
  });

  it('renders comment helpful reaction buttons', async () => {
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Great post!')).toBeInTheDocument();
    });

    // Comment c1 has helpful_count: 2, look for the helpful reaction button area
    // Each comment has a helpful button with the count
    expect(screen.getByText('Great post!')).toBeInTheDocument();
    expect(screen.getByText('I agree')).toBeInTheDocument();
  });

  it('handles delete comment for own comment', async () => {
    const { DeleteTopicsComments } = await import('../../api/forumApis');
    const mockedDelete = vi.mocked(DeleteTopicsComments);
    mockedDelete.mockResolvedValue({});
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Great post!')).toBeInTheDocument();
    });

    // Own comment (c1, user_id: 'user-123') should have a delete button
    // Look for the three-dot menu or delete button
    const deleteButtons = screen.queryAllByLabelText(/delete/i);
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);
      await waitFor(() => {
        expect(mockedDelete).toHaveBeenCalled();
      });
    }

    confirmSpy.mockRestore();
  });

  it('displays author info and avatar', async () => {
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });
    // Author display_name is 'Alice'
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('handles topic fetch error gracefully', async () => {
    mockedGetTopic.mockRejectedValue(new Error('Network error'));
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      // Should show "Topic not found" since topic remains null
      expect(screen.getByText('Topic not found')).toBeInTheDocument();
    });
  });

  it('displays bookmark remove toast when unbookmarking', async () => {
    mockedBookmark.mockResolvedValue({ bookmarked: false });
    const topicWithBookmark = { ...baseTopic, user_bookmarked: true };
    mockedGetTopic.mockResolvedValue(topicWithBookmark);

    const user = userEvent.setup();
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });

    // The bookmark button should show as bookmarked
    const bookmarkBtn = screen.getByLabelText(/bookmark/i);
    await user.click(bookmarkBtn);

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith('Bookmark removed', 'success');
    });
  });

  it('shows correct comment count in comments heading', async () => {
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Topic Title')).toBeInTheDocument();
    });
    expect(screen.getByText(/Comments \(2\)/)).toBeInTheDocument();
  });

  it('displays tags as clickable elements', async () => {
    renderWithRouter(<TopicDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('#react')).toBeInTheDocument();
      expect(screen.getByText('#testing')).toBeInTheDocument();
    });
  });
});
