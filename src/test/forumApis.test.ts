import {
  GetLocalScopeMetrics,
  GetGlobalScopeMetrics,
  GetRecentDiscussions,
  GetFoundationForums,
  GetUserJoinedForums,
  CreateForumTopic,
  GetForumTopicById,
  GetForumById,
  UserJoinForum,
  UserLeaveForum,
  ForumTopicsReactions,
  CreateForumTopicsComments,
  GetAllCommentsForATopic,
  TopicsCommentsReactions,
  DeleteTopicsComments,
  GetMyForumTopics,
  GetBookmarkedForumTopics,
  ToggleTopicBookmark,
} from '../../api/forumApis';

// Mock the base module
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../api/base', () => ({
  API_URL: 'https://api.test.com',
  getAuthInstance: () => ({
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  }),
  unwrap: (res: { data: any }) => res.data?.data ?? res.data,
}));

describe('Forum API functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------- GetLocalScopeMetrics ----------
  describe('GetLocalScopeMetrics', () => {
    it('calls the correct URL with company name', async () => {
      mockGet.mockResolvedValue({ data: { data: { totalTopics: 5 } } });
      const result = await GetLocalScopeMetrics('TestCorp');
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/forum/metrics/local/TestCorp');
      expect(result).toEqual({ totalTopics: 5 });
    });

    it('propagates errors', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));
      await expect(GetLocalScopeMetrics('X')).rejects.toThrow('Network error');
    });
  });

  // ---------- GetGlobalScopeMetrics ----------
  describe('GetGlobalScopeMetrics', () => {
    it('calls the correct URL', async () => {
      mockGet.mockResolvedValue({ data: { data: { forums: [] } } });
      const result = await GetGlobalScopeMetrics();
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/forum/metrics/global');
      expect(result).toEqual({ forums: [] });
    });
  });

  // ---------- GetRecentDiscussions ----------
  describe('GetRecentDiscussions', () => {
    it('calls with no filters', async () => {
      mockGet.mockResolvedValue({ data: { data: { topics: [] } } });
      await GetRecentDiscussions('TestCorp');
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/forum/recent-discussions/TestCorp');
    });

    it('appends query params for all filters', async () => {
      mockGet.mockResolvedValue({ data: { data: { topics: [] } } });
      await GetRecentDiscussions('TestCorp', {
        search: 'hello',
        sortBy: 'recent',
        timeFilter: 'week',
        isGlobal: true,
        category: 'general',
        hashtag: 'tech',
        page: 2,
        limit: 10,
      });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('search=hello');
      expect(url).toContain('sortBy=recent');
      expect(url).toContain('timeFilter=week');
      expect(url).toContain('isGlobal=true');
      expect(url).toContain('category=general');
      expect(url).toContain('hashtag=tech');
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });

    it('encodes company name in URL', async () => {
      mockGet.mockResolvedValue({ data: { data: {} } });
      await GetRecentDiscussions('Test Corp & Co');
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('Test%20Corp%20%26%20Co');
    });
  });

  // ---------- GetFoundationForums ----------
  describe('GetFoundationForums', () => {
    it('calls the correct URL', async () => {
      mockGet.mockResolvedValue({ data: { data: { forums: ['f1'] } } });
      const result = await GetFoundationForums('Acme');
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/forum/foundation/Acme');
      expect(result).toEqual({ forums: ['f1'] });
    });
  });

  // ---------- GetUserJoinedForums ----------
  describe('GetUserJoinedForums', () => {
    it('includes companyName query param', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetUserJoinedForums('Acme');
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('companyName=Acme');
    });
  });

  // ---------- CreateForumTopic ----------
  describe('CreateForumTopic', () => {
    it('posts payload to topics endpoint', async () => {
      const payload = { title: 'Test', content: 'body', forumId: 'f1' };
      mockPost.mockResolvedValue({ data: { data: { id: 't1' } } });
      const result = await CreateForumTopic(payload);
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/forum/topics', payload);
      expect(result).toEqual({ id: 't1' });
    });
  });

  // ---------- GetForumTopicById ----------
  describe('GetForumTopicById', () => {
    it('fetches topic by id', async () => {
      mockGet.mockResolvedValue({ data: { data: { id: 't1', title: 'Hi' } } });
      const result = await GetForumTopicById('t1');
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/forum/topics/t1');
      expect(result.title).toBe('Hi');
    });
  });

  // ---------- GetForumById ----------
  describe('GetForumById', () => {
    it('fetches forum by id', async () => {
      mockGet.mockResolvedValue({ data: { data: { id: 'f1', name: 'Forum' } } });
      const result = await GetForumById('f1');
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/forum/f1');
      expect(result.name).toBe('Forum');
    });
  });

  // ---------- UserJoinForum / UserLeaveForum ----------
  describe('UserJoinForum', () => {
    it('posts to join endpoint', async () => {
      mockPost.mockResolvedValue({ data: { data: { success: true } } });
      await UserJoinForum('f1');
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/forum/f1/join');
    });
  });

  describe('UserLeaveForum', () => {
    it('posts to leave endpoint', async () => {
      mockPost.mockResolvedValue({ data: { data: { success: true } } });
      await UserLeaveForum('f1');
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/forum/f1/leave');
    });
  });

  // ---------- ForumTopicsReactions ----------
  describe('ForumTopicsReactions', () => {
    it('posts reaction payload', async () => {
      const payload = { topicId: 't1', reactionType: 'heard' };
      mockPost.mockResolvedValue({ data: { data: { ok: true } } });
      await ForumTopicsReactions(payload);
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/forum/topics/reactions', payload);
    });
  });

  // ---------- CreateForumTopicsComments ----------
  describe('CreateForumTopicsComments', () => {
    it('posts comment payload', async () => {
      const payload = { topicId: 't1', content: 'Nice post' };
      mockPost.mockResolvedValue({ data: { data: { id: 'c1' } } });
      const result = await CreateForumTopicsComments(payload);
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/forum/comments', payload);
      expect(result.id).toBe('c1');
    });
  });

  // ---------- GetAllCommentsForATopic ----------
  describe('GetAllCommentsForATopic', () => {
    it('fetches comments for topic', async () => {
      mockGet.mockResolvedValue({ data: { data: [{ id: 'c1' }] } });
      const result = await GetAllCommentsForATopic('t1');
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/forum/topics/t1/comments');
      expect(result).toEqual([{ id: 'c1' }]);
    });
  });

  // ---------- TopicsCommentsReactions ----------
  describe('TopicsCommentsReactions', () => {
    it('posts comment reaction', async () => {
      const payload = { commentId: 'c1', reactionType: 'helpful' };
      mockPost.mockResolvedValue({ data: { data: { ok: true } } });
      await TopicsCommentsReactions(payload as any);
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/forum/comments/reactions', payload);
    });
  });

  // ---------- DeleteTopicsComments ----------
  describe('DeleteTopicsComments', () => {
    it('deletes comment by id', async () => {
      mockDelete.mockResolvedValue({ data: { data: { deleted: true } } });
      const result = await DeleteTopicsComments('c1');
      expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/forum/comments/c1');
      expect(result.deleted).toBe(true);
    });
  });

  // ---------- GetMyForumTopics ----------
  describe('GetMyForumTopics', () => {
    it('uses default pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetMyForumTopics();
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/forum/topics/my-posts?page=1&limit=20');
    });

    it('uses custom pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetMyForumTopics(3, 10);
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/forum/topics/my-posts?page=3&limit=10');
    });
  });

  // ---------- GetBookmarkedForumTopics ----------
  describe('GetBookmarkedForumTopics', () => {
    it('uses default pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetBookmarkedForumTopics();
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/forum/topics/bookmarked?page=1&limit=20');
    });
  });

  // ---------- ToggleTopicBookmark ----------
  describe('ToggleTopicBookmark', () => {
    it('posts to bookmark endpoint', async () => {
      mockPost.mockResolvedValue({ data: { data: { bookmarked: true } } });
      const result = await ToggleTopicBookmark('t1');
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/forum/topics/t1/bookmark');
      expect(result.bookmarked).toBe(true);
    });
  });
});
