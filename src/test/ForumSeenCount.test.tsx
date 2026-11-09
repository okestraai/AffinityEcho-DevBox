import { screen } from '@testing-library/react';
import { OverviewMode } from '../components/dashboard/Forum/OverviewMode';
import { renderWithRouter } from './testUtils';

vi.mock('../../api/forumApis', () => ({ ToggleTopicBookmark: vi.fn() }));
vi.mock('../components/Modals/ForumModals/CreateTopicModal', () => ({ CreateTopicModal: () => null }));
vi.mock('../components/Modals/ForumModals/TopicDetailModal', () => ({ TopicDetailModal: () => null }));
vi.mock('../components/Modals/UserProfileModal', () => ({ UserProfileModal: () => null }));
vi.mock('../components/dashboard/OkestraPanel', () => ({ OkestraPanel: () => null }));

// A topic opened 57 times that 3 people reacted "Seen" to.
const topic = {
  id: 't1',
  title: 'Seen is a reaction',
  content: 'Body',
  user_id: 'u2',
  created_at: new Date().toISOString(),
  views_count: 57,
  reactions: { seen: 3, heard: 2, validated: 1, inspired: 0 },
  userReactions: { seen: false, heard: false, validated: false, inspired: false },
  comments_count: 0,
  tags: [],
};

function show() {
  const noop = () => {};
  const props = new Proxy(
    {
      paginatedTopics: { topics: [topic], totalPages: 1, totalTopics: 1 },
      currentPage: 1,
      TOPICS_PER_PAGE: 10,
      globalForums: [],
      userCompany: null,
      searchTerm: '',
      sortBy: 'recent',
      timeFilter: 'all',
      selectedUserProfile: null,
      selectedTopic: null,
      currentUser: { id: 'u1' },
      activeCommentId: null,
      localMetrics: null,
      globalMetrics: null,
      initialLoading: false,
      topicsLoading: false,
      getTimeAgo: () => 'now',
    } as Record<string, unknown>,
    { get: (target, key: string) => (key in target ? target[key] : noop) },
  );
  return renderWithRouter(<OverviewMode {...(props as unknown as React.ComponentProps<typeof OverviewMode>)} />);
}

describe('Forum overview Seen button', () => {
  it('shows how many people reacted Seen, not how many times the topic was opened', () => {
    show();
    const seen = screen.getByRole('button', { name: 'Seen' });
    expect(seen).toHaveTextContent('3');
    expect(seen).not.toHaveTextContent('57');
  });
});
