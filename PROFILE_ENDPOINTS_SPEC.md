# Profile System - Complete Endpoints Specification

> **Version**: 2.0
> **Last Updated**: February 15, 2026
> **API File**: `api/profileApis.ts`
> **Base URL**: `VITE_API_URL` environment variable

## Overview
This document outlines all endpoints for the Profile system including user profile management, settings, privacy, account management, connections, blocking, resources, and harassment reporting.

All endpoints use the shared Axios interceptor (`src/Helper/AxiosInterceptor.tsx`) with automatic token refresh. Responses are unwrapped via a helper that handles double-wrapped responses: `{ success, data: { success, data } }` → `{ success, data }`.

---

## **1. USER PROFILE ENDPOINTS**

> **Base URL**: `/user`

### Get Current User Profile
**Endpoint**: `GET /user/profile`
**API Function**: `GetUserProfile()` ✅ IMPLEMENTED
**Source**: `api/profileApis.ts`
**Description**: Get complete profile of the logged-in user
**Response**:
```typescript
{
  id: string;
  username: string;
  avatar: string;
  email: string;
  bio?: string;
  job_title?: string;
  location?: string;
  skills?: string[];
  linkedin_url?: string;
  demographics: {
    race?: string;
    gender?: string;
    careerLevel?: string;
    company?: string;
    affinityTags?: string[];
  };
  has_completed_onboarding: boolean;
  joinedDate?: string;
}
```

> **Note**: `GetCurrentUser()` in `api/authApis.ts` also fetches the user via `GET /auth/me`. Use `GetUserProfile()` for full profile data; use `GetCurrentUser()` for auth context (onboarding status, session info).

### Get User Profile by ID
**Endpoint**: `GET /user/{userId}`
**API Function**: `GetUserProfileById(userId: string)` ✅ IMPLEMENTED
**Description**: Get public profile of any user (used by UserProfileModal)
**Response**:
```typescript
{
  id: string;
  username: string;
  avatar: string;
  bio?: string;
  demographics?: {
    careerLevel?: string;
    company?: string;
    affinityTags?: string[];
  };
  joinedDate?: string;
}
```

### Update Profile
**Endpoint**: `PATCH /user/profile`
**API Function**: `UpdateProfile(payload)` ✅ IMPLEMENTED
**Description**: Update current user's profile fields
**Payload**:
```typescript
{
  username?: string;
  avatar?: string;
  bio?: string;
  job_title?: string;
  location?: string;
  skills?: string[];
  linkedin_url?: string;
}
```

### Update Avatar
**Endpoint**: `PATCH /user/avatar`
**API Function**: `UpdateAvatar(avatar: string)` ✅ IMPLEMENTED
**Description**: Update only the avatar emoji
**Payload**:
```typescript
{
  avatar: string; // emoji
}
```

### Update Username
**Endpoint**: `PATCH /user/username`
**API Function**: `UpdateUsername(username: string)` ✅ IMPLEMENTED
**Description**: Update only the username
**Payload**:
```typescript
{
  username: string;
}
```

---

## **2. PROFILE STATISTICS ENDPOINTS**

> **Base URL**: `/user/{userId}`

### Get User Stats
**Endpoint**: `GET /user/{userId}/stats`
**API Function**: `GetUserStats(userId: string)` ✅ IMPLEMENTED
**Description**: Get engagement statistics for a user
**Response**:
```typescript
{
  postsCreated: number;
  commentsPosted: number;
  helpfulReactions: number;
  nooksJoined: number;
  topicsCreated?: number;
  mentorshipSessions?: number;
  referralsMade?: number;
  activeDays?: number;
  streakDays?: number;
}
```

### Get User Badges
**Endpoint**: `GET /user/{userId}/badges`
**API Function**: `GetUserBadges(userId: string)` ✅ IMPLEMENTED
**Description**: Get all badges earned by user
**Response**:
```typescript
{
  badges: [
    {
      id: string;
      name: string;
      description?: string;
      icon?: string;
      earned?: boolean;
      earnedAt?: string;
    }
  ]
}
```

### Get User Activity
**Endpoint**: `GET /user/{userId}/activity`
**API Function**: `GetUserActivity(userId: string, filters?)` ✅ IMPLEMENTED
**Description**: Get recent activity for a user
**Query Parameters**:
```typescript
{
  type?: 'posts' | 'comments' | 'topics' | 'nooks' | 'all';
  limit?: number;
  page?: number;
}
```

---

## **3. PRIVACY & SETTINGS ENDPOINTS**

> **Base URL**: `/user/settings`

### Get Privacy Settings
**Endpoint**: `GET /user/settings/privacy`
**API Function**: `GetPrivacySettings()` ✅ IMPLEMENTED
**Description**: Get user's privacy settings
**Response**:
```typescript
{
  profileVisibility: 'public' | 'connections' | 'private';
  showEmail: boolean;
  showCompany: boolean;
  showLocation: boolean;
  allowMessagesFrom: 'everyone' | 'connections' | 'no_one';
  showActivity: boolean;
  showConnections: boolean;
}
```

### Update Privacy Settings
**Endpoint**: `PUT /user/settings/privacy`
**API Function**: `UpdatePrivacySettings(payload)` ✅ IMPLEMENTED
**Description**: Update privacy settings
**Payload**:
```typescript
{
  profileVisibility?: 'public' | 'connections' | 'private';
  showEmail?: boolean;
  showCompany?: boolean;
  showLocation?: boolean;
  allowMessagesFrom?: 'everyone' | 'connections' | 'no_one';
  showActivity?: boolean;
  showConnections?: boolean;
}
```

### Get Notification Settings
**Endpoint**: `GET /user/settings/notifications`
**API Function**: `GetNotificationSettings()` ✅ IMPLEMENTED
**Description**: Get notification preferences
**Response**:
```typescript
{
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyOnComment: boolean;
  notifyOnLike: boolean;
  notifyOnFollow: boolean;
  notifyOnMention: boolean;
  notifyOnMessage: boolean;
  notifyOnConnectionRequest: boolean;
  digestFrequency: 'daily' | 'weekly' | 'never';
}
```

### Update Notification Settings
**Endpoint**: `PUT /user/settings/notifications`
**API Function**: `UpdateNotificationSettings(payload)` ✅ IMPLEMENTED
**Description**: Update notification preferences
**Payload**:
```typescript
{
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  notifyOnComment?: boolean;
  notifyOnLike?: boolean;
  notifyOnFollow?: boolean;
  notifyOnMention?: boolean;
  notifyOnMessage?: boolean;
  notifyOnConnectionRequest?: boolean;
  digestFrequency?: 'daily' | 'weekly' | 'never';
}
```

---

## **4. ACCOUNT MANAGEMENT ENDPOINTS**

> **Base URL**: `/user/account`

### Change Password
**Endpoint**: `POST /user/account/change-password`
**API Function**: `ChangePassword(payload)` ✅ IMPLEMENTED
**Source**: `api/profileApis.ts`
**Description**: Change user password
**Payload**:
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

> **Note**: A separate `ChangePassword()` also exists in `api/authApis.ts` hitting `PATCH /auth/change-password`. The profile version uses the `/user/account` route.

### Deactivate Account
**Endpoint**: `POST /user/account/deactivate`
**API Function**: `DeactivateAccount(payload)` ✅ IMPLEMENTED
**Description**: Temporarily deactivate (pause) account
**Payload**:
```typescript
{
  reason?: string;
}
```

### Reactivate Account
**Endpoint**: `POST /user/account/reactivate`
**API Function**: `ReactivateAccount()` ✅ IMPLEMENTED
**Description**: Reactivate a previously deactivated account
**Payload**:
```typescript
{
  confirmReactivation: true;
}
```

### Delete Account
**Endpoint**: `DELETE /user/account`
**API Function**: `DeleteAccount(payload)` ✅ IMPLEMENTED
**Description**: Permanently delete account
**Payload** (sent as `data` in DELETE request):
```typescript
{
  confirmDeletion: boolean; // must be true
  reason?: string;
}
```

### Export User Data
**Endpoint**: `GET /user/account/export`
**API Function**: `ExportUserData(category?)` ✅ IMPLEMENTED
**Description**: Export user data (GDPR compliance)
**Query Parameters**:
```typescript
category: 'all' | 'profile' | 'posts' | 'comments' | 'connections' | 'activity';
// defaults to 'all'
```

---

## **5. BLOCKED USERS ENDPOINTS**

> **Base URL**: `/user`

### Get Blocked Users
**Endpoint**: `GET /user/blocked`
**API Function**: `GetBlockedUsers(page?, limit?)` ✅ IMPLEMENTED
**Description**: Get paginated list of blocked users
**Query Parameters**: `page` (default 1), `limit` (default 20)

### Block User
**Endpoint**: `POST /user/{userId}/block`
**API Function**: `BlockUser(userId: string, reason?: string)` ✅ IMPLEMENTED
**Description**: Block a user
**Payload**:
```typescript
{
  reason?: string;
}
```

### Unblock User
**Endpoint**: `DELETE /user/{userId}/block`
**API Function**: `UnblockUser(userId: string)` ✅ IMPLEMENTED
**Description**: Unblock a user

### Check Block Status
**Endpoint**: `GET /user/{userId}/block/status`
**API Function**: `CheckBlockStatus(userId: string)` ✅ IMPLEMENTED
**Description**: Check block status between current user and target user
**Response**:
```typescript
{
  isBlocked: boolean;
  blockedByMe: boolean;
  blockedByThem: boolean;
}
```

---

## **6. RESOURCES ENDPOINTS**

> **Base URL**: `/user/resources`

### Get Crisis Resources
**Endpoint**: `GET /user/resources/crisis`
**API Function**: `GetCrisisResources()` ✅ IMPLEMENTED
**Description**: Get crisis resources and helpline information
**Used by**: `CrisisResourcesPage.tsx`

### Get Community Guidelines
**Endpoint**: `GET /user/resources/community-guidelines`
**API Function**: `GetCommunityGuidelines()` ✅ IMPLEMENTED
**Description**: Get community guidelines content
**Used by**: `CommunityGuidelinesPage.tsx`

---

## **7. HARASSMENT REPORT ENDPOINTS**

> **Base URL**: `/user/reports/harassment`

### Submit Harassment Report
**Endpoint**: `POST /user/reports/harassment`
**API Function**: `SubmitHarassmentReport(payload)` ✅ IMPLEMENTED
**Description**: Submit a harassment report
**Used by**: `ReportHarassmentPage.tsx`
**Payload**:
```typescript
{
  incidentType: string;
  description: string;
  date?: string;
  location?: string;
  witnesses?: string;
  evidence?: string;
  reporterType: 'victim' | 'witness' | 'other';
  contactEmail?: string;
  immediateRisk: boolean;
}
```

### Get My Harassment Reports
**Endpoint**: `GET /user/reports/harassment`
**API Function**: `GetMyHarassmentReports(page?, limit?)` ✅ IMPLEMENTED
**Description**: Get paginated list of user's own harassment reports
**Query Parameters**: `page` (default 1), `limit` (default 20)

### Get Harassment Report by Reference Number
**Endpoint**: `GET /user/reports/harassment/reference/{referenceNumber}`
**API Function**: `GetHarassmentReportByRef(referenceNumber: string)` ✅ IMPLEMENTED
**Description**: Look up a report by its reference number

### Get Harassment Report by ID
**Endpoint**: `GET /user/reports/harassment/{id}`
**API Function**: `GetHarassmentReportById(id: string)` ✅ IMPLEMENTED
**Description**: Get a specific report by database ID

---

## **8. MENTORSHIP PROFILE ENDPOINTS**

> **Base URL**: `/mentorship`
> **Note**: These are convenience re-exports in `profileApis.ts`. The full mentorship API lives in `api/mentorshipApis.ts`.

### Get Mentorship Profile
**Endpoint**: `GET /mentorship/profile`
**API Function**: `GetMentorshipProfile()` ✅ IMPLEMENTED
**Description**: Get current user's mentorship profile
**Response**:
```typescript
{
  isWillingToMentor: boolean;
  expertise: string[];
  experience: string;
  style: string;
  availability: string;
  bio: string;
  maxMentees: number;
  currentMentees?: number;
}
```

### Update Mentorship Profile
**Endpoint**: `PUT /mentorship/profile`
**API Function**: `UpdateMentorshipProfile(payload)` ✅ IMPLEMENTED
**Description**: Update mentorship profile
**Payload**:
```typescript
{
  isWillingToMentor?: boolean;
  expertise?: string[];
  experience?: string;
  style?: string;
  availability?: string;
  bio?: string;
  maxMentees?: number;
}
```

### Toggle Mentorship Availability
**Endpoint**: `PATCH /mentorship/toggle`
**API Function**: `ToggleMentorshipAvailability()` ✅ IMPLEMENTED
**Description**: Toggle mentorship on/off
**Response**:
```typescript
{
  isWillingToMentor: boolean;
}
```

---

## **9. CONNECTIONS & FOLLOWS ENDPOINTS**

> **Base URL**: `/users/{userId}`
> **Note**: These are convenience re-exports in `profileApis.ts`. Similar follow/unfollow endpoints also exist in `api/mentorshipApis.ts` under `/mentorship/follow/{userId}`.

### Get Followers
**Endpoint**: `GET /users/{userId}/followers`
**API Function**: `GetUserFollowers(userId, page?, limit?)` ✅ IMPLEMENTED
**Description**: Get users following this user
**Query Parameters**: `page` (default 1), `limit` (default 20)

### Get Following
**Endpoint**: `GET /users/{userId}/following`
**API Function**: `GetUserFollowing(userId, page?, limit?)` ✅ IMPLEMENTED
**Description**: Get users this user is following
**Query Parameters**: `page` (default 1), `limit` (default 20)

### Follow User
**Endpoint**: `POST /users/{userId}/follow`
**API Function**: `FollowUser(userId: string)` ✅ IMPLEMENTED
**Description**: Follow a user

### Unfollow User
**Endpoint**: `DELETE /users/{userId}/follow`
**API Function**: `UnfollowUser(userId: string)` ✅ IMPLEMENTED
**Description**: Unfollow a user

### Check Following Status
**Endpoint**: `GET /users/{userId}/following/status`
**API Function**: `CheckFollowingStatus(userId: string)` ✅ IMPLEMENTED
**Description**: Check if current user follows this user
**Response**:
```typescript
{
  isFollowing: boolean;
}
```

---

## **10. PROFILE VERIFICATION ENDPOINTS**

> **Status**: Not yet implemented. Planned for future release.

### Request Verification
**Endpoint**: `POST /auth/verification/request`
**API Function**: `RequestVerification(payload)` ❌ NOT IMPLEMENTED
**Description**: Request profile verification
**Payload**:
```typescript
{
  verificationType: 'email' | 'employer' | 'linkedin';
  documents?: File[];
}
```

### Get Verification Status
**Endpoint**: `GET /auth/verification/status`
**API Function**: `GetVerificationStatus()` ❌ NOT IMPLEMENTED
**Description**: Get verification status
**Response**:
```typescript
{
  isVerified: boolean;
  verificationType?: string;
  verifiedAt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'none';
}
```

---

## **SUMMARY**

### ✅ **Implemented** (35 endpoints):

| # | Section | Function | Method | Endpoint |
|---|---------|----------|--------|----------|
| 1 | Profile | `GetUserProfile()` | GET | `/user/profile` |
| 2 | Profile | `GetUserProfileById(userId)` | GET | `/user/{userId}` |
| 3 | Profile | `UpdateProfile(payload)` | PATCH | `/user/profile` |
| 4 | Profile | `UpdateAvatar(avatar)` | PATCH | `/user/avatar` |
| 5 | Profile | `UpdateUsername(username)` | PATCH | `/user/username` |
| 6 | Stats | `GetUserStats(userId)` | GET | `/user/{userId}/stats` |
| 7 | Stats | `GetUserBadges(userId)` | GET | `/user/{userId}/badges` |
| 8 | Stats | `GetUserActivity(userId, filters)` | GET | `/user/{userId}/activity` |
| 9 | Privacy | `GetPrivacySettings()` | GET | `/user/settings/privacy` |
| 10 | Privacy | `UpdatePrivacySettings(payload)` | PUT | `/user/settings/privacy` |
| 11 | Notifications | `GetNotificationSettings()` | GET | `/user/settings/notifications` |
| 12 | Notifications | `UpdateNotificationSettings(payload)` | PUT | `/user/settings/notifications` |
| 13 | Account | `ChangePassword(payload)` | POST | `/user/account/change-password` |
| 14 | Account | `DeactivateAccount(payload)` | POST | `/user/account/deactivate` |
| 15 | Account | `ReactivateAccount()` | POST | `/user/account/reactivate` |
| 16 | Account | `DeleteAccount(payload)` | DELETE | `/user/account` |
| 17 | Account | `ExportUserData(category)` | GET | `/user/account/export` |
| 18 | Blocked | `GetBlockedUsers(page, limit)` | GET | `/user/blocked` |
| 19 | Blocked | `BlockUser(userId, reason)` | POST | `/user/{userId}/block` |
| 20 | Blocked | `UnblockUser(userId)` | DELETE | `/user/{userId}/block` |
| 21 | Blocked | `CheckBlockStatus(userId)` | GET | `/user/{userId}/block/status` |
| 22 | Resources | `GetCrisisResources()` | GET | `/user/resources/crisis` |
| 23 | Resources | `GetCommunityGuidelines()` | GET | `/user/resources/community-guidelines` |
| 24 | Reports | `SubmitHarassmentReport(payload)` | POST | `/user/reports/harassment` |
| 25 | Reports | `GetMyHarassmentReports(page, limit)` | GET | `/user/reports/harassment` |
| 26 | Reports | `GetHarassmentReportByRef(ref)` | GET | `/user/reports/harassment/reference/{ref}` |
| 27 | Reports | `GetHarassmentReportById(id)` | GET | `/user/reports/harassment/{id}` |
| 28 | Mentorship | `GetMentorshipProfile()` | GET | `/mentorship/profile` |
| 29 | Mentorship | `UpdateMentorshipProfile(payload)` | PUT | `/mentorship/profile` |
| 30 | Mentorship | `ToggleMentorshipAvailability()` | PATCH | `/mentorship/toggle` |
| 31 | Follows | `GetUserFollowers(userId, page, limit)` | GET | `/users/{userId}/followers` |
| 32 | Follows | `GetUserFollowing(userId, page, limit)` | GET | `/users/{userId}/following` |
| 33 | Follows | `FollowUser(userId)` | POST | `/users/{userId}/follow` |
| 34 | Follows | `UnfollowUser(userId)` | DELETE | `/users/{userId}/follow` |
| 35 | Follows | `CheckFollowingStatus(userId)` | GET | `/users/{userId}/following/status` |

### ❌ **Not Yet Implemented** (2 endpoints):

| # | Section | Function | Endpoint |
|---|---------|----------|----------|
| 1 | Verification | `RequestVerification(payload)` | `POST /auth/verification/request` |
| 2 | Verification | `GetVerificationStatus()` | `GET /auth/verification/status` |

---

## **RELATED API FILES**

| File | Purpose |
|------|---------|
| `api/profileApis.ts` | All profile, settings, account, blocking, resources, reports endpoints |
| `api/authApis.ts` | Auth endpoints (`GetCurrentUser`, `ChangePassword`, login, signup, OTP, onboarding) |
| `api/mentorshipApis.ts` | Full mentorship system (profiles, requests, discover, suggestions, follow) |
| `api/notificationApis.ts` | Notification CRUD, mark-read, unread count, stats |
| `api/messaging.ts` | Conversations, messages, identity reveal, connectable users |
| `api/forumApis.ts` | Forums, topics, comments, reactions |
| `api/nookApis.ts` | Nooks CRUD, messages, join/leave |
| `api/feedApis.ts` | Feed aggregation, posts, likes, comments, bookmarks |
| `api/referralsApis.ts` | Referral system |
| `api/EncrytionApis.ts` | Client-side encryption helpers |

---

## **COMPONENT USAGE MAP**

| Component | Endpoints Used |
|-----------|---------------|
| `ProfileView.tsx` | `GetUserProfile`, `GetUserStats`, `GetUserBadges`, `UpdateProfile`, `UpdateUsername` |
| `UserProfileModal.tsx` | `GetUserProfileById`, `GetUserStats`, `GetUserBadges`, `CheckFollowingStatus`, `FollowUser`, `UnfollowUser` |
| `ChangePasswordPage.tsx` | `ChangePassword` (authApis) |
| `ExportDataPage.tsx` | `ExportUserData` |
| `CommunityGuidelinesPage.tsx` | `GetCommunityGuidelines` |
| `CrisisResourcesPage.tsx` | `GetCrisisResources` |
| `ReportHarassmentPage.tsx` | `SubmitHarassmentReport`, `GetMyHarassmentReports` |
| `MentorshipView.tsx` | `GetMentorshipProfile`, `ToggleMentorshipAvailability` |
| `MentorshipUserProfileModal.tsx` | `GetMentorProfileByUserId` (mentorshipApis) |
| `NotificationsDropdown.tsx` | `GetUnreadCount`, `GetNotifications` (notificationApis) |
| `NotificationsView.tsx` | `GetNotifications`, `MarkNotificationAsRead`, `MarkAllNotificationsAsRead`, `DeleteNotification` (notificationApis) |

---

*This document should be treated as a living document. Update it as new features are added or requirements change.*
