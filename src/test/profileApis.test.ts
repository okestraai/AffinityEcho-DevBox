// src/test/profileApis.test.ts
import {
  GetUserProfile,
  GetUserProfileById,
  GetFullUserProfile,
  UpdateProfile,
  UpdateAvatar,
  UpdateUsername,
  GetUserStats,
  GetUserBadges,
  GetUserActivity,
  GetMyActivity,
  GetMyBookmarks,
  GetPrivacySettings,
  UpdatePrivacySettings,
  GetNotificationSettings,
  UpdateNotificationSettings,
  ChangePassword,
  DeactivateAccount,
  ReactivateAccount,
  GetEditableProfile,
  UpdateEditableProfile,
  DeleteAccount,
  ExportUserData,
  GetBlockedUsers,
  BlockUser,
  UnblockUser,
  CheckBlockStatus,
  GetCrisisResources,
  GetCommunityGuidelines,
  SubmitHarassmentReport,
  GetMyHarassmentReports,
  GetHarassmentReportByRef,
  GetHarassmentReportById,
  GetMentorshipProfile,
  UpdateMentorshipProfile,
  ToggleMentorshipAvailability,
  GetUserFollowers,
  GetUserFollowing,
  FollowUser,
  UnfollowUser,
  CheckFollowingStatus,
  SendCompanyVerificationEmail,
  UpdateCompanyVerificationEmail,
  GetCompanyVerificationStatus,
} from '../../api/profileApis';

// Mock the base module
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../api/base', () => ({
  API_URL: 'https://api.test.com',
  getAuthInstance: () => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
  }),
  unwrap: (res: { data: any }) => res.data?.data ?? res.data,
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Default mock response shape
  const defaultRes = { data: { data: { success: true } } };
  mockGet.mockResolvedValue(defaultRes);
  mockPost.mockResolvedValue(defaultRes);
  mockPut.mockResolvedValue(defaultRes);
  mockPatch.mockResolvedValue(defaultRes);
  mockDelete.mockResolvedValue(defaultRes);
});

// ============================================================================
// USER PROFILE
// ============================================================================
describe('Profile API - User Profile endpoints', () => {
  it('GetUserProfile calls GET /user/profile', async () => {
    await GetUserProfile();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/profile');
  });

  it('GetUserProfileById calls GET /user/:id', async () => {
    await GetUserProfileById('abc-123');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/abc-123');
  });

  it('GetFullUserProfile calls GET /user/:id/full-profile', async () => {
    await GetFullUserProfile('abc-123');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/abc-123/full-profile');
  });

  it('UpdateProfile calls PATCH /user/profile', async () => {
    const payload = { username: 'newuser', bio: 'hello' };
    await UpdateProfile(payload);
    expect(mockPatch).toHaveBeenCalledWith('https://api.test.com/user/profile', payload);
  });

  it('UpdateAvatar calls PATCH /user/avatar', async () => {
    await UpdateAvatar('🚀');
    expect(mockPatch).toHaveBeenCalledWith('https://api.test.com/user/avatar', { avatar: '🚀' });
  });

  it('UpdateUsername calls PATCH /user/username', async () => {
    await UpdateUsername('newname');
    expect(mockPatch).toHaveBeenCalledWith('https://api.test.com/user/username', { username: 'newname' });
  });
});

// ============================================================================
// STATS
// ============================================================================
describe('Profile API - Statistics endpoints', () => {
  it('GetUserStats calls GET /user/:id/stats', async () => {
    await GetUserStats('u1');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/u1/stats');
  });

  it('GetUserBadges calls GET /user/:id/badges', async () => {
    await GetUserBadges('u1');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/u1/badges');
  });

  it('GetUserActivity with filters builds query string', async () => {
    await GetUserActivity('u1', { type: 'posts', limit: 10, page: 2 });
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/u1/activity?type=posts&limit=10&page=2');
  });

  it('GetUserActivity with no filters omits query string', async () => {
    await GetUserActivity('u1');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/u1/activity');
  });

  it('GetMyActivity with type=all does not append type param', async () => {
    await GetMyActivity({ type: 'all', page: 1 });
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/me/activity?page=1');
  });

  it('GetMyActivity with specific type appends it', async () => {
    await GetMyActivity({ type: 'posts' });
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/me/activity?type=posts');
  });

  it('GetMyBookmarks with pagination', async () => {
    await GetMyBookmarks({ page: 2, limit: 5 });
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/me/bookmarks?page=2&limit=5');
  });
});

// ============================================================================
// PRIVACY & SETTINGS
// ============================================================================
describe('Profile API - Privacy & Settings endpoints', () => {
  it('GetPrivacySettings calls GET', async () => {
    await GetPrivacySettings();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/settings/privacy');
  });

  it('UpdatePrivacySettings calls PUT', async () => {
    const payload = { showEmail: true };
    await UpdatePrivacySettings(payload);
    expect(mockPut).toHaveBeenCalledWith('https://api.test.com/user/settings/privacy', payload);
  });

  it('GetNotificationSettings calls GET', async () => {
    await GetNotificationSettings();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/settings/notifications');
  });

  it('UpdateNotificationSettings calls PUT', async () => {
    const payload = { emailNotifications: false };
    await UpdateNotificationSettings(payload);
    expect(mockPut).toHaveBeenCalledWith('https://api.test.com/user/settings/notifications', payload);
  });
});

// ============================================================================
// ACCOUNT MANAGEMENT
// ============================================================================
describe('Profile API - Account Management', () => {
  it('ChangePassword calls POST', async () => {
    const payload = { currentPassword: 'old', newPassword: 'new' };
    await ChangePassword(payload);
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/user/account/change-password', payload);
  });

  it('DeactivateAccount calls POST with reason', async () => {
    await DeactivateAccount({ reason: 'break' });
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/user/account/deactivate', { reason: 'break' });
  });

  it('ReactivateAccount calls POST', async () => {
    await ReactivateAccount();
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/user/account/reactivate', { confirmReactivation: true });
  });

  it('DeleteAccount calls DELETE with data', async () => {
    const payload = { confirmDeletion: true, reason: 'leaving' };
    await DeleteAccount(payload);
    expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/user/account', { data: payload });
  });

  it('ExportUserData calls GET with category', async () => {
    await ExportUserData('profile');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/account/export?category=profile');
  });

  it('ExportUserData defaults to all', async () => {
    await ExportUserData();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/account/export?category=all');
  });
});

// ============================================================================
// EDITABLE PROFILE
// ============================================================================
describe('Profile API - Editable Profile', () => {
  it('GetEditableProfile calls GET', async () => {
    await GetEditableProfile();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/profile/edit');
  });

  it('UpdateEditableProfile calls PUT', async () => {
    const payload = { basic: { username: 'test' } };
    await UpdateEditableProfile(payload);
    expect(mockPut).toHaveBeenCalledWith('https://api.test.com/user/profile/edit', payload);
  });
});

// ============================================================================
// BLOCKED USERS
// ============================================================================
describe('Profile API - Blocked Users', () => {
  it('GetBlockedUsers calls GET with pagination', async () => {
    await GetBlockedUsers(2, 10);
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/blocked?page=2&limit=10');
  });

  it('BlockUser calls POST', async () => {
    await BlockUser('u2', 'spam');
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/user/u2/block', { reason: 'spam' });
  });

  it('UnblockUser calls DELETE', async () => {
    await UnblockUser('u2');
    expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/user/u2/block');
  });

  it('CheckBlockStatus calls GET', async () => {
    await CheckBlockStatus('u2');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/u2/block/status');
  });
});

// ============================================================================
// RESOURCES
// ============================================================================
describe('Profile API - Resources', () => {
  it('GetCrisisResources calls GET', async () => {
    await GetCrisisResources();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/resources/crisis');
  });

  it('GetCommunityGuidelines calls GET', async () => {
    await GetCommunityGuidelines();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/resources/community-guidelines');
  });
});

// ============================================================================
// HARASSMENT REPORTS
// ============================================================================
describe('Profile API - Harassment Reports', () => {
  it('SubmitHarassmentReport calls POST', async () => {
    const payload = {
      incidentType: 'verbal',
      description: 'test',
      reporterType: 'victim' as const,
      immediateRisk: false,
    };
    await SubmitHarassmentReport(payload);
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/user/reports/harassment', payload);
  });

  it('GetMyHarassmentReports with status filter', async () => {
    await GetMyHarassmentReports(1, 20, 'submitted');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/reports/harassment?page=1&limit=20&status=submitted');
  });

  it('GetMyHarassmentReports with status=all omits status', async () => {
    await GetMyHarassmentReports(1, 20, 'all');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/reports/harassment?page=1&limit=20');
  });

  it('GetHarassmentReportByRef calls GET', async () => {
    await GetHarassmentReportByRef('REF-001');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/reports/harassment/reference/REF-001');
  });

  it('GetHarassmentReportById calls GET', async () => {
    await GetHarassmentReportById('id-1');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/reports/harassment/id-1');
  });
});

// ============================================================================
// MENTORSHIP PROFILE
// ============================================================================
describe('Profile API - Mentorship Profile', () => {
  it('GetMentorshipProfile calls GET', async () => {
    await GetMentorshipProfile();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/mentorship/profile');
  });

  it('UpdateMentorshipProfile calls PUT', async () => {
    const payload = { isWillingToMentor: true };
    await UpdateMentorshipProfile(payload);
    expect(mockPut).toHaveBeenCalledWith('https://api.test.com/mentorship/profile', payload);
  });

  it('ToggleMentorshipAvailability calls PATCH', async () => {
    await ToggleMentorshipAvailability();
    expect(mockPatch).toHaveBeenCalledWith('https://api.test.com/mentorship/toggle');
  });
});

// ============================================================================
// CONNECTIONS & FOLLOWS
// ============================================================================
describe('Profile API - Connections & Follows', () => {
  it('GetUserFollowers calls GET with pagination', async () => {
    await GetUserFollowers('u1', 2, 10);
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/users/u1/followers?page=2&limit=10');
  });

  it('GetUserFollowing calls GET', async () => {
    await GetUserFollowing('u1');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/users/u1/following?page=1&limit=20');
  });

  it('FollowUser calls POST', async () => {
    await FollowUser('u2');
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/users/u2/follow');
  });

  it('UnfollowUser calls DELETE', async () => {
    await UnfollowUser('u2');
    expect(mockDelete).toHaveBeenCalledWith('https://api.test.com/users/u2/follow');
  });

  it('CheckFollowingStatus calls GET', async () => {
    await CheckFollowingStatus('u2');
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/users/u2/following/status');
  });
});

// ============================================================================
// COMPANY VERIFICATION
// ============================================================================
describe('Profile API - Company Verification', () => {
  it('SendCompanyVerificationEmail calls POST', async () => {
    await SendCompanyVerificationEmail('test@corp.com');
    expect(mockPost).toHaveBeenCalledWith('https://api.test.com/user/verify-company-email', { email: 'test@corp.com' });
  });

  it('UpdateCompanyVerificationEmail calls PUT', async () => {
    await UpdateCompanyVerificationEmail('new@corp.com');
    expect(mockPut).toHaveBeenCalledWith('https://api.test.com/user/company-verification-email', { email: 'new@corp.com' });
  });

  it('GetCompanyVerificationStatus calls GET', async () => {
    await GetCompanyVerificationStatus();
    expect(mockGet).toHaveBeenCalledWith('https://api.test.com/user/company-verification-status');
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
describe('Profile API - Error handling', () => {
  it('propagates network errors', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));
    await expect(GetUserProfile()).rejects.toThrow('Network Error');
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValue({ response: { status: 404, data: { message: 'Not found' } } });
    await expect(GetUserProfileById('bad-id')).rejects.toEqual(
      expect.objectContaining({ response: expect.objectContaining({ status: 404 }) })
    );
  });
});
