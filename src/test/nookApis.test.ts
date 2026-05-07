// src/test/nookApis.test.ts
import {
  CreateNook,
  GetNooks,
  GetNookMetrics,
  GetNookById,
  DeleteNooksById,
  FlagMessage,
  GetNookMessagesByNookId,
  PostNookMessageByNookId,
  DeleteNooksMessageById,
  JoinNook,
  LeaveNook,
  GetNookMembers,
  addNookReaction,
  removeNookReaction,
  toggleMessageReaction,
  removeMessageReaction,
  GetMyNooks,
  GetBookmarkedNooks,
  ToggleNookBookmark,
  EditNookMessage,
} from '../../api/nookApis';

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

beforeEach(() => {
  vi.clearAllMocks();
  const defaultRes = { data: { data: { success: true } } };
  mockGet.mockResolvedValue(defaultRes);
  mockPost.mockResolvedValue(defaultRes);
  mockPut.mockResolvedValue(defaultRes);
  mockDelete.mockResolvedValue(defaultRes);
});

// ============================================================================
// NOOK CRUD
// ============================================================================
describe('Nook API - CRUD operations', () => {
  it('CreateNook calls POST /nooks', async () => {
    const payload = { title: 'Test Nook', description: 'desc', urgency: 'high' };
    await CreateNook(payload);
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/nooks', payload);
  });

  it('GetNooks with no filters uses defaults page=1&limit=8', async () => {
    await GetNooks();
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('page=1'));
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('limit=8'));
  });

  it('GetNooks with filters builds correct query string', async () => {
    await GetNooks({ urgency: 'high', scope: 'global', temperature: 'hot', hashtag: 'test', sortBy: 'created_at', sortOrder: 'desc', page: 2, limit: 10 });
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain('urgency=high');
    expect(url).toContain('scope=global');
    expect(url).toContain('temperature=hot');
    expect(url).toContain('hashtag=test');
    expect(url).toContain('sortBy=created_at');
    expect(url).toContain('sortOrder=desc');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
  });

  it('GetNookMetrics calls GET /nooks/stats', async () => {
    await GetNookMetrics();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/nooks/stats');
  });

  it('GetNookById calls GET /nooks/:id', async () => {
    await GetNookById('nook-1');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/nooks/nook-1');
  });

  it('DeleteNooksById calls DELETE /nooks/:id', async () => {
    await DeleteNooksById('nook-1');
    expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/nooks/nook-1');
  });

  it('FlagMessage calls POST /nooks/:id/flag', async () => {
    await FlagMessage('nook-1');
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/nooks/nook-1/flag');
  });
});

// ============================================================================
// NOOK MESSAGES
// ============================================================================
describe('Nook API - Messages', () => {
  it('GetNookMessagesByNookId with filters', async () => {
    await GetNookMessagesByNookId('n1', { sortOrder: 'asc', page: 1, limit: 50 });
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain('/nooks/n1/messages');
    expect(url).toContain('sortOrder=asc');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=50');
  });

  it('GetNookMessagesByNookId with no filters omits query', async () => {
    await GetNookMessagesByNookId('n1');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/nooks/n1/messages'));
  });

  it('PostNookMessageByNookId calls POST', async () => {
    const payload = { content: 'hello', is_anonymous: true };
    await PostNookMessageByNookId('n1', payload);
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/nooks/n1/messages', payload);
  });

  it('DeleteNooksMessageById calls DELETE', async () => {
    await DeleteNooksMessageById('n1', 'msg-1');
    expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/nooks/n1/messages/msg-1');
  });

  it('EditNookMessage calls PUT', async () => {
    await EditNookMessage('n1', 'msg-1', 'updated content');
    expect(mockPut).toHaveBeenCalledWith('https://api.test.com/nooks/n1/messages/msg-1', { content: 'updated content' });
  });
});

// ============================================================================
// NOOK MEMBERSHIP
// ============================================================================
describe('Nook API - Membership', () => {
  it('JoinNook calls POST', async () => {
    await JoinNook('n1', { userId: 'u1' });
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/nooks/n1/members/join', { userId: 'u1' });
  });

  it('LeaveNook calls POST', async () => {
    await LeaveNook('n1');
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/nooks/n1/members/leave');
  });

  it('GetNookMembers calls GET', async () => {
    await GetNookMembers('n1');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/nooks/n1/members');
  });
});

// ============================================================================
// REACTIONS
// ============================================================================
describe('Nook API - Reactions', () => {
  it('addNookReaction calls POST', async () => {
    await addNookReaction('n1', { reaction_type: 'like' });
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/nooks/n1/reactions', { reaction_type: 'like' });
  });

  it('removeNookReaction calls DELETE with query param', async () => {
    await removeNookReaction('n1', 'like');
    const url = mockDelete.mock.calls[0][0] as string;
    expect(url).toContain('/nooks/n1/reactions');
    expect(url).toContain('reaction_type=like');
  });

  it('toggleMessageReaction calls POST', async () => {
    await toggleMessageReaction('msg-1', { reaction_type: 'helpful' });
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/nooks/messages/msg-1/reactions', { reaction_type: 'helpful' });
  });

  it('removeMessageReaction calls DELETE with query param', async () => {
    await removeMessageReaction('msg-1', 'helpful');
    const url = mockDelete.mock.calls[0][0] as string;
    expect(url).toContain('/nooks/messages/msg-1/reactions');
    expect(url).toContain('reaction_type=helpful');
  });
});

// ============================================================================
// MY NOOKS & BOOKMARKS
// ============================================================================
describe('Nook API - My Nooks & Bookmarks', () => {
  it('GetMyNooks calls GET with pagination', async () => {
    await GetMyNooks(2, 10);
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/nooks/my-nooks?page=2&limit=10');
  });

  it('GetMyNooks uses defaults', async () => {
    await GetMyNooks();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/nooks/my-nooks?page=1&limit=8');
  });

  it('GetBookmarkedNooks calls GET', async () => {
    await GetBookmarkedNooks(1, 8);
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/nooks/bookmarked?page=1&limit=8');
  });

  it('ToggleNookBookmark calls POST', async () => {
    await ToggleNookBookmark('n1');
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/nooks/n1/bookmark');
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
describe('Nook API - Error handling', () => {
  it('propagates errors from CreateNook', async () => {
    mockPost.mockRejectedValue(new Error('Server Error'));
    await expect(CreateNook({ title: 'x' })).rejects.toThrow('Server Error');
  });

  it('propagates errors from GetNookById', async () => {
    mockGet.mockRejectedValue({ response: { status: 404 } });
    await expect(GetNookById('bad-id')).rejects.toEqual(
      expect.objectContaining({ response: expect.objectContaining({ status: 404 }) })
    );
  });
});
