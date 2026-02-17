// api/profileApis.ts
import { getAuthInstance, API_URL, unwrap } from "./base";

// ============================================================================
// 1. USER PROFILE ENDPOINTS - Base URL: /user
// ============================================================================

/**
 * Get current user profile
 */
export const GetUserProfile = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/user/profile`);
  return unwrap(res);
};

/**
 * Get any user's public profile by ID
 */
export const GetUserProfileById = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/user/${userId}`);
  return unwrap(res);
};

/**
 * Update current user's profile
 */
export const UpdateProfile = async (payload: {
  username?: string;
  avatar?: string;
  bio?: string;
  job_title?: string;
  location?: string;
  skills?: string[];
  linkedin_url?: string;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/user/profile`, payload);
  return unwrap(res);
};

/**
 * Update only avatar
 */
export const UpdateAvatar = async (avatar: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/user/avatar`, { avatar });
  return unwrap(res);
};

/**
 * Update only username
 */
export const UpdateUsername = async (username: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/user/username`, { username });
  return unwrap(res);
};

// ============================================================================
// 2. PROFILE STATISTICS ENDPOINTS
// ============================================================================

/**
 * Get user statistics
 */
export const GetUserStats = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/user/${userId}/stats`);
  return unwrap(res);
};

/**
 * Get user badges
 */
export const GetUserBadges = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/user/${userId}/badges`);
  return unwrap(res);
};

/**
 * Get user activity
 */
export const GetUserActivity = async (
  userId: string,
  filters: {
    type?: "posts" | "comments" | "topics" | "nooks" | "all";
    limit?: number;
    page?: number;
  } = {}
) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  if (filters.type) queryParams.append("type", filters.type);
  if (filters.limit) queryParams.append("limit", filters.limit.toString());
  if (filters.page) queryParams.append("page", filters.page.toString());

  const qs = queryParams.toString();
  const res = await authFetch.get(
    `${API_URL}/user/${userId}/activity${qs ? `?${qs}` : ""}`
  );
  return unwrap(res);
};

// ============================================================================
// 3. PRIVACY & SETTINGS ENDPOINTS
// ============================================================================

/**
 * Get privacy settings
 */
export const GetPrivacySettings = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/user/settings/privacy`);
  return unwrap(res);
};

/**
 * Update privacy settings
 */
export const UpdatePrivacySettings = async (payload: {
  profileVisibility?: "public" | "connections" | "private";
  showEmail?: boolean;
  showCompany?: boolean;
  showLocation?: boolean;
  allowMessagesFrom?: "everyone" | "connections" | "no_one";
  showActivity?: boolean;
  showConnections?: boolean;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(
    `${API_URL}/user/settings/privacy`,
    payload
  );
  return unwrap(res);
};

/**
 * Get notification preferences
 */
export const GetNotificationSettings = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/user/settings/notifications`);
  return unwrap(res);
};

/**
 * Update notification preferences
 */
export const UpdateNotificationSettings = async (payload: {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  notifyOnComment?: boolean;
  notifyOnLike?: boolean;
  notifyOnFollow?: boolean;
  notifyOnMention?: boolean;
  notifyOnMessage?: boolean;
  notifyOnConnectionRequest?: boolean;
  digestFrequency?: "daily" | "weekly" | "never";
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(
    `${API_URL}/user/settings/notifications`,
    payload
  );
  return unwrap(res);
};

// ============================================================================
// 4. ACCOUNT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Change password
 */
export const ChangePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/user/account/change-password`,
    payload
  );
  return unwrap(res);
};

/**
 * Deactivate account
 */
export const DeactivateAccount = async (payload: { reason?: string }) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/user/account/deactivate`,
    payload
  );
  return unwrap(res);
};

/**
 * Reactivate account
 */
export const ReactivateAccount = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/user/account/reactivate`, {
    confirmReactivation: true,
  });
  return unwrap(res);
};

/**
 * Delete account permanently
 */
export const DeleteAccount = async (payload: {
  confirmDeletion: boolean;
  reason?: string;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/user/account`, {
    data: payload,
  });
  return unwrap(res);
};

/**
 * Export user data (GDPR)
 */
export const ExportUserData = async (
  category:
    | "all"
    | "profile"
    | "posts"
    | "comments"
    | "connections"
    | "activity" = "all"
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/user/account/export?category=${category}`
  );
  return unwrap(res);
};

// ============================================================================
// 5. BLOCKED USERS ENDPOINTS
// ============================================================================

/**
 * Get list of blocked users
 */
export const GetBlockedUsers = async (page: number = 1, limit: number = 20) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/user/blocked?page=${page}&limit=${limit}`
  );
  return unwrap(res);
};

/**
 * Block a user
 */
export const BlockUser = async (userId: string, reason?: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/user/${userId}/block`, {
    reason,
  });
  return unwrap(res);
};

/**
 * Unblock a user
 */
export const UnblockUser = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/user/${userId}/block`);
  return unwrap(res);
};

/**
 * Check block status between current user and target user
 */
export const CheckBlockStatus = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/user/${userId}/block/status`);
  return unwrap(res);
};

// ============================================================================
// 6. RESOURCES ENDPOINTS
// ============================================================================

/**
 * Get crisis resources
 */
export const GetCrisisResources = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/user/resources/crisis`);
  return unwrap(res);
};

/**
 * Get community guidelines
 */
export const GetCommunityGuidelines = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/user/resources/community-guidelines`
  );
  return unwrap(res);
};

// ============================================================================
// 7. HARASSMENT REPORT ENDPOINTS
// ============================================================================

/**
 * Submit a harassment report
 */
export const SubmitHarassmentReport = async (payload: {
  incidentType: string;
  description: string;
  date?: string;
  location?: string;
  witnesses?: string;
  evidence?: string;
  reporterType: "victim" | "witness" | "other";
  contactEmail?: string;
  immediateRisk: boolean;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/user/reports/harassment`,
    payload
  );
  return unwrap(res);
};

/**
 * Get my harassment reports
 */
export const GetMyHarassmentReports = async (
  page: number = 1,
  limit: number = 20
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/user/reports/harassment?page=${page}&limit=${limit}`
  );
  return unwrap(res);
};

/**
 * Get harassment report by reference number
 */
export const GetHarassmentReportByRef = async (referenceNumber: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/user/reports/harassment/reference/${referenceNumber}`
  );
  return unwrap(res);
};

/**
 * Get harassment report by ID
 */
export const GetHarassmentReportById = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/user/reports/harassment/${id}`);
  return unwrap(res);
};

// ============================================================================
// 8. MENTORSHIP PROFILE ENDPOINTS (kept for backward compatibility)
// ============================================================================

/**
 * Get mentorship profile
 */
export const GetMentorshipProfile = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/mentorship/profile`);
  return unwrap(res);
};

/**
 * Update mentorship profile
 */
export const UpdateMentorshipProfile = async (payload: {
  isWillingToMentor?: boolean;
  expertise?: string[];
  experience?: string;
  style?: string;
  availability?: string;
  bio?: string;
  maxMentees?: number;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(`${API_URL}/mentorship/profile`, payload);
  return unwrap(res);
};

/**
 * Toggle mentorship availability
 */
export const ToggleMentorshipAvailability = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/mentorship/toggle`);
  return unwrap(res);
};

// ============================================================================
// 9. CONNECTIONS & FOLLOWS ENDPOINTS (kept for backward compatibility)
// ============================================================================

/**
 * Get user's followers
 */
export const GetUserFollowers = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/users/${userId}/followers?page=${page}&limit=${limit}`
  );
  return unwrap(res);
};

/**
 * Get users that this user is following
 */
export const GetUserFollowing = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/users/${userId}/following?page=${page}&limit=${limit}`
  );
  return unwrap(res);
};

/**
 * Follow a user
 */
export const FollowUser = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/users/${userId}/follow`);
  return unwrap(res);
};

/**
 * Unfollow a user
 */
export const UnfollowUser = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/users/${userId}/follow`);
  return unwrap(res);
};

/**
 * Check if current user follows this user
 */
export const CheckFollowingStatus = async (userId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/users/${userId}/following/status`
  );
  return unwrap(res);
};
