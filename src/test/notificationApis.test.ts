// src/test/notificationApis.test.ts
import {
  CreateNotification,
  GetNotifications,
  MarkNotificationGroupRead,
  GetUnreadCount,
  GetNotificationStats,
  GetNotificationById,
  UpdateNotification,
  MarkNotificationAsRead,
  MarkAllNotificationsAsRead,
  DeleteNotification,
  DeleteAllReadNotifications,
  ClearAllNotifications,
} from '../../api/notificationApis';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../api/base', () => ({
  API_URL: 'https://api.test.com',
  getAuthInstance: () => ({
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  }),
  unwrap: (res: { data: any }) => res.data?.data ?? res.data,
}));

beforeEach(() => {
  vi.clearAllMocks();
  const defaultRes = { data: { data: { success: true } } };
  mockGet.mockResolvedValue(defaultRes);
  mockPost.mockResolvedValue(defaultRes);
  mockPatch.mockResolvedValue(defaultRes);
  mockDelete.mockResolvedValue(defaultRes);
});

// ============================================================================
// CREATE & GET
// ============================================================================
describe('Notification API - Create & Get', () => {
  it('CreateNotification calls POST /notifications', async () => {
    const payload = { user_id: 'u1', type: 'follow', title: 'New follower', message: 'Someone followed you' };
    await CreateNotification(payload);
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/notifications', payload);
  });

  it('GetNotifications with no params omits query string', async () => {
    await GetNotifications();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/notifications');
  });

  it('GetNotifications with all params builds query string', async () => {
    await GetNotifications({ is_read: false, type: 'follow', grouped: true, page: 2, limit: 10 });
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain('is_read=false');
    expect(url).toContain('type=follow');
    expect(url).toContain('grouped=true');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
  });

  it('GetNotifications with is_read=true sends correct value', async () => {
    await GetNotifications({ is_read: true });
    const url = mockGet.mock.calls[0][0] as string;
    expect(url).toContain('is_read=true');
  });

  it('GetUnreadCount calls GET /notifications/unread-count', async () => {
    await GetUnreadCount();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/notifications/unread-count');
  });

  it('GetNotificationStats calls GET /notifications/stats', async () => {
    await GetNotificationStats();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/notifications/stats');
  });

  it('GetNotificationById calls GET /notifications/:id', async () => {
    await GetNotificationById('notif-1');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/notifications/notif-1');
  });
});

// ============================================================================
// UPDATE & MARK READ
// ============================================================================
describe('Notification API - Update & Mark Read', () => {
  it('UpdateNotification calls PATCH /notifications/:id', async () => {
    const payload = { is_read: true, action_taken: true };
    await UpdateNotification('n1', payload);
    expect(mockPatch).toHaveBeenCalledWith('https://api.test.com/notifications/n1', payload);
  });

  it('MarkNotificationAsRead calls PATCH /notifications/:id/read', async () => {
    await MarkNotificationAsRead('n1');
    expect(mockPatch).toHaveBeenCalledWith('https://api.test.com/notifications/n1/read');
  });

  it('MarkAllNotificationsAsRead calls PATCH /notifications/mark-all-read', async () => {
    await MarkAllNotificationsAsRead();
    expect(mockPatch).toHaveBeenCalledWith('https://api.test.com/notifications/mark-all-read');
  });

  it('MarkNotificationGroupRead calls POST with notification_ids', async () => {
    await MarkNotificationGroupRead(['id-1', 'id-2']);
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/notifications/mark-group-read', {
      notification_ids: ['id-1', 'id-2'],
    });
  });
});

// ============================================================================
// DELETE & CLEAR
// ============================================================================
describe('Notification API - Delete & Clear', () => {
  it('DeleteNotification calls DELETE /notifications/:id', async () => {
    await DeleteNotification('n1');
    expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/notifications/n1');
  });

  it('DeleteAllReadNotifications calls DELETE /notifications/read/all', async () => {
    await DeleteAllReadNotifications();
    expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/notifications/read/all');
  });

  it('ClearAllNotifications calls DELETE /notifications/all', async () => {
    await ClearAllNotifications();
    expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/notifications/all');
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
describe('Notification API - Error handling', () => {
  it('propagates errors from GetNotifications', async () => {
    mockGet.mockRejectedValue(new Error('Timeout'));
    await expect(GetNotifications()).rejects.toThrow('Timeout');
  });

  it('propagates errors from CreateNotification', async () => {
    mockPost.mockRejectedValue({ response: { status: 403, data: { message: 'Forbidden' } } });
    await expect(CreateNotification({ user_id: 'u1', type: 'x', title: 't', message: 'm' })).rejects.toEqual(
      expect.objectContaining({ response: expect.objectContaining({ status: 403 }) })
    );
  });

  it('propagates errors from DeleteNotification', async () => {
    mockDelete.mockRejectedValue(new Error('Server Error'));
    await expect(DeleteNotification('n1')).rejects.toThrow('Server Error');
  });
});
