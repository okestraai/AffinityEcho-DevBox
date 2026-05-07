import {
  GetFeed,
  CreatePost,
  GetPostById,
  GetUserPosts,
  UpdatePost,
  DeletePost,
  PinPost,
  UnpinPost,
  ToggleLike,
  ToggleFeedReaction,
  AddComment,
  GetComments,
  ShareItem,
  UnshareItem,
  ToggleBookmark,
  GetBookmarks,
} from '../../api/feedApis';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../api/base', () => ({
  API_URL: 'https://api.test.com',
  getAuthInstance: () => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  }),
  unwrap: (res: { data: any }) => res.data?.data ?? res.data,
}));

describe('Feed API functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------- GetFeed ----------
  describe('GetFeed', () => {
    it('calls with no params', async () => {
      mockGet.mockResolvedValue({ data: { data: { items: [] } } });
      await GetFeed();
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/feeds');
    });

    it('appends all query params', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetFeed({
        filter: 'trending',
        contentType: 'post',
        sortBy: 'popular',
        company: 'Acme',
        tags: 'tech,ai',
        page: 2,
        limit: 10,
      });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('filter=trending');
      expect(url).toContain('contentType=post');
      expect(url).toContain('sortBy=popular');
      expect(url).toContain('company=Acme');
      expect(url).toContain('tags=tech%2Cai');
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });

    it('propagates errors', async () => {
      mockGet.mockRejectedValue(new Error('fail'));
      await expect(GetFeed()).rejects.toThrow('fail');
    });
  });

  // ---------- CreatePost ----------
  describe('CreatePost', () => {
    it('posts with required fields', async () => {
      mockPost.mockResolvedValue({ data: { data: { id: 'p1' } } });
      const result = await CreatePost({ content: 'Hello world' });
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/feeds/posts', { content: 'Hello world' });
      expect(result.id).toBe('p1');
    });

    it('includes optional fields', async () => {
      mockPost.mockResolvedValue({ data: { data: { id: 'p2' } } });
      await CreatePost({ content: 'Hi', visibility: 'company', isAnonymous: true, tags: ['a'] });
      expect(mockPost.mock.calls[0][1]).toEqual({
        content: 'Hi',
        visibility: 'company',
        isAnonymous: true,
        tags: ['a'],
      });
    });
  });

  // ---------- GetPostById ----------
  describe('GetPostById', () => {
    it('fetches post by id', async () => {
      mockGet.mockResolvedValue({ data: { data: { id: 'p1', content: 'text' } } });
      const result = await GetPostById('p1');
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/feeds/posts/p1');
      expect(result.content).toBe('text');
    });
  });

  // ---------- GetUserPosts ----------
  describe('GetUserPosts', () => {
    it('uses default pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetUserPosts('u1');
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/feeds/users/u1/posts?page=1&limit=20');
    });

    it('uses custom pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetUserPosts('u1', 3, 5);
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/feeds/users/u1/posts?page=3&limit=5');
    });
  });

  // ---------- UpdatePost ----------
  describe('UpdatePost', () => {
    it('puts update payload', async () => {
      mockPut.mockResolvedValue({ data: { data: { id: 'p1' } } });
      await UpdatePost('p1', { content: 'updated' });
      expect(mockPut).toHaveBeenCalledWith('https://api.test.com/feeds/posts/p1', { content: 'updated' });
    });
  });

  // ---------- DeletePost ----------
  describe('DeletePost', () => {
    it('deletes post', async () => {
      mockDelete.mockResolvedValue({ data: { data: { deleted: true } } });
      const result = await DeletePost('p1');
      expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/feeds/posts/p1');
      expect(result.deleted).toBe(true);
    });
  });

  // ---------- PinPost / UnpinPost ----------
  describe('PinPost', () => {
    it('posts to pin endpoint', async () => {
      mockPost.mockResolvedValue({ data: { data: { pinned: true } } });
      await PinPost('p1');
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/feeds/posts/p1/pin');
    });
  });

  describe('UnpinPost', () => {
    it('deletes pin', async () => {
      mockDelete.mockResolvedValue({ data: { data: { pinned: false } } });
      await UnpinPost('p1');
      expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/feeds/posts/p1/pin');
    });
  });

  // ---------- ToggleLike ----------
  describe('ToggleLike', () => {
    it('posts like for post', async () => {
      mockPost.mockResolvedValue({ data: { data: { liked: true } } });
      await ToggleLike('post', 'p1');
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/feeds/post/p1/like');
    });

    it('posts like for topic', async () => {
      mockPost.mockResolvedValue({ data: { data: {} } });
      await ToggleLike('topic', 't1');
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/feeds/topic/t1/like');
    });
  });

  // ---------- ToggleFeedReaction ----------
  describe('ToggleFeedReaction', () => {
    it('posts reaction with type', async () => {
      mockPost.mockResolvedValue({ data: { data: {} } });
      await ToggleFeedReaction('post', 'p1', 'heard');
      expect(mockPost).toHaveBeenCalledWith(
        'https://api.test.com/feeds/post/p1/react',
        { reactionType: 'heard' },
      );
    });
  });

  // ---------- AddComment ----------
  describe('AddComment', () => {
    it('posts comment to content', async () => {
      mockPost.mockResolvedValue({ data: { data: { id: 'c1' } } });
      await AddComment('post', 'p1', { content: 'Great!' });
      expect(mockPost).toHaveBeenCalledWith(
        'https://api.test.com/feeds/post/p1/comments',
        { content: 'Great!' },
      );
    });

    it('includes parentCommentId for replies', async () => {
      mockPost.mockResolvedValue({ data: { data: { id: 'c2' } } });
      await AddComment('topic', 't1', { content: 'Reply', parentCommentId: 'c1' });
      expect(mockPost.mock.calls[0][1]).toEqual({ content: 'Reply', parentCommentId: 'c1' });
    });
  });

  // ---------- GetComments ----------
  describe('GetComments', () => {
    it('fetches comments with default pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetComments('post', 'p1');
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/feeds/post/p1/comments?page=1&limit=20');
    });

    it('fetches with custom pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetComments('topic', 't1', 2, 5);
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/feeds/topic/t1/comments?page=2&limit=5');
    });
  });

  // ---------- ShareItem / UnshareItem ----------
  describe('ShareItem', () => {
    it('shares with message', async () => {
      mockPost.mockResolvedValue({ data: { data: {} } });
      await ShareItem('post', 'p1', { shareMessage: 'Check this out' });
      expect(mockPost).toHaveBeenCalledWith(
        'https://api.test.com/feeds/post/p1/share',
        { shareMessage: 'Check this out' },
      );
    });

    it('shares without message', async () => {
      mockPost.mockResolvedValue({ data: { data: {} } });
      await ShareItem('post', 'p1');
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/feeds/post/p1/share', {});
    });
  });

  describe('UnshareItem', () => {
    it('deletes share', async () => {
      mockDelete.mockResolvedValue({ data: { data: {} } });
      await UnshareItem('post', 'p1');
      expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/feeds/post/p1/share');
    });
  });

  // ---------- ToggleBookmark ----------
  describe('ToggleBookmark', () => {
    it('posts to bookmark endpoint', async () => {
      mockPost.mockResolvedValue({ data: { data: { bookmarked: true } } });
      await ToggleBookmark('post', 'p1');
      expect(mockPost).toHaveBeenCalledWith('https://api.test.com/feeds/post/p1/bookmark');
    });
  });

  // ---------- GetBookmarks ----------
  describe('GetBookmarks', () => {
    it('uses default pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetBookmarks();
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/feeds/bookmarks?page=1&limit=20');
    });

    it('uses custom pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetBookmarks(2, 5);
      expect(mockGet).toHaveBeenCalledWith('https://api.test.com/feeds/bookmarks?page=2&limit=5');
    });
  });
});
