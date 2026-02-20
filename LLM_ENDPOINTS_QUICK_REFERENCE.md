# LLM Endpoints Quick Reference

## **FORUM ENDPOINTS** ✅ Connected to LLM

### Topics
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `GET /forum/topics/{topicId}` | `GetForumTopicById(topicId)` | Get specific topic with full details |
| `GET /forum/topics/{topicId}/comments` | `GetAllCommentsForATopic(topicId)` | Get all comments for a topic |
| `GET /forum/recent-discussions/{company}` | `GetRecentDiscussions(company, filters)` | Get recent discussions list |
| `POST /forum/topics` | `CreateForumTopic(payload)` | Create new topic |

### Comments
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `POST /forum/comments` | `CreateForumTopicsComments(payload)` | Create comment/reply |
| `DELETE /forum/comments/{commentId}` | `DeleteTopicsComments(commentId)` | Delete comment |

### Reactions
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `POST /forum/topics/reactions` | `ForumTopicsReactions(payload)` | Add topic reaction (seen/validated/inspired/heard) |
| `POST /forum/comments/reactions` | `TopicsCommentsReactions(payload)` | Add comment reaction (helpful/supportive) |

### Forums
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `GET /forum/{forumId}` | `GetForumById(forumId)` | Get specific forum |
| `GET /forum/foundation/{company}` | `GetFoundationForums(company)` | Get foundation forums |
| `GET /forum/joined` | `GetUserJoinedForums(company)` | Get user's joined forums |
| `POST /forum/{forumId}/join` | `UserJoinForum(forumId)` | Join forum |
| `POST /forum/{forumId}/leave` | `UserLeaveForum(forumId)` | Leave forum |

### Metrics
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `GET /forum/metrics/local/{company}` | `GetLocalScopeMetrics(company)` | Get local scope metrics |
| `GET /forum/metrics/global` | `GetGlobalScopeMetrics()` | Get global scope metrics |

---

## **NOOKS ENDPOINTS** ✅ Connected to LLM

### Nooks
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `GET /nooks` | `GetNooks(filters)` | Get all nooks with filtering |
| `GET /nooks/{nookId}` | `GetNookById(nookId)` | Get specific nook details |
| `POST /nooks` | `CreateNook(payload)` | Create new nook |
| `DELETE /nooks/{nookId}` | `DeleteNooksById(nookId)` | Delete nook |
| `GET /nooks/stats` | `GetNookMetrics()` | Get nooks statistics |

### Nook Messages
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `GET /nooks/{nookId}/messages` | `GetNookMessagesByNookId(nookId, filters)` | Get all messages in nook |
| `POST /nooks/{nookId}/messages` | `PostNookMessageByNookId(nookId, payload)` | Post message to nook |
| `DELETE /nooks/{nookId}/messages/{messageId}` | `DeleteNooksMessageById(nookId, messageId)` | Delete nook message |

### Nook Members
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `GET /nooks/{nookId}/members` | `GetNookMembers(nookId)` | Get nook members |
| `POST /nooks/{nookId}/members/join` | `JoinNook(nookId, payload)` | Join nook |
| `POST /nooks/{nookId}/members/leave` | `LeaveNook(nookId)` | Leave nook |

### Nook Reactions
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `POST /nooks/{nookId}/reactions` | `addNookReaction(nookId, payload)` | Add nook-level reaction |
| `DELETE /nooks/{nookId}/reactions` | `removeNookReaction(nookId, type)` | Remove nook-level reaction |
| `POST /nooks/messages/{messageId}/reactions` | `toggleMessageReaction(messageId, payload)` | Toggle message reaction |
| `DELETE /nooks/messages/{messageId}/reactions` | `removeMessageReaction(messageId, type)` | Remove message reaction |
| `POST /nooks/{nookId}/flag` | `FlagMessage(nookId)` | Flag nook for moderation |

---

## **FEED ENDPOINTS**

### Existing Endpoints (Already Implemented)
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `GET /feeds` | `GetFeed(params)` | Get aggregated feed (filter, contentType, sortBy, company, tags, page, limit) |
| `POST /feeds/posts` | `CreatePost(payload)` | Create a new post |
| `GET /feeds/posts/{postId}` | `GetPostById(postId)` | Get a single post by ID |
| `GET /feeds/users/{userId}/posts` | `GetUserPosts(userId, page, limit)` | Get posts by a specific user (used for "My Posts" filter) |
| `PUT /feeds/posts/{postId}` | `UpdatePost(postId, payload)` | Update a post |
| `DELETE /feeds/posts/{postId}` | `DeletePost(postId)` | Delete a post |
| `POST /feeds/{contentType}/{contentId}/like` | `ToggleLike(contentType, contentId)` | Toggle like on content |
| `POST /feeds/{contentType}/{contentId}/bookmark` | `ToggleBookmark(contentType, contentId)` | Toggle bookmark on content |
| `GET /feeds/bookmarks` | `GetBookmarks(page, limit)` | Get user's bookmarks (used for "Bookmarked" filter) |
| `POST /feeds/{contentType}/{contentId}/comments` | `AddComment(contentType, contentId, payload)` | Add comment to content |
| `GET /feeds/{contentType}/{contentId}/comments` | `GetComments(contentType, contentId, page, limit)` | Get comments for content |
| `POST /feeds/{contentType}/{contentId}/share` | `ShareItem(contentType, contentId, payload)` | Share content |
| `DELETE /feeds/{contentType}/{contentId}/share` | `UnshareItem(contentType, contentId)` | Unshare content |

**Frontend "My Posts / Bookmarked / All" filter uses existing endpoints:**
- **All**: `GetFeed({ page, limit })`
- **My Posts**: `GetUserPosts(userId, page, limit)`
- **Bookmarked**: `GetBookmarks(page, limit)`

---

## **CONTENT FILTER ENDPOINTS — Backend TODO**

The frontend now has "All / My Posts / Bookmarked" filter tabs on **Feeds**, **Forum Topics**, and **Nooks**. For Feeds, existing endpoints (`GetUserPosts`, `GetBookmarks`) already support this. For **Forum Topics** and **Nooks**, the following endpoints are needed:

### Forum Topics — New Endpoints Needed

| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `GET /forum/topics/my-posts` | `GetMyForumTopics(page, limit)` | **Get topics created by the authenticated user** |
| `GET /forum/topics/bookmarked` | `GetBookmarkedForumTopics(page, limit)` | **Get topics bookmarked by the authenticated user** |

#### `GET /forum/topics/my-posts`
**Description:** Returns all forum topics created by the authenticated user across all forums.
**Auth:** Bearer token
**Query Params:** `page` (default 1), `limit` (default 20)
**Response:**
```json
{
  "success": true,
  "data": {
    "topics": [...],
    "pagination": { "page": 1, "limit": 20, "total": 5, "hasMore": false }
  }
}
```

#### `GET /forum/topics/bookmarked`
**Description:** Returns all forum topics the authenticated user has bookmarked.
**Auth:** Bearer token
**Query Params:** `page` (default 1), `limit` (default 20)
**Response:** Same shape as `GET /forum/topics/my-posts`

**Note:** The frontend currently does client-side filtering using `topic.user_id === currentUser.id` for "My Posts" and `topic.user_has_bookmarked` for "Bookmarked". Once these server-side endpoints are available, the filtering can be moved to the API level for better performance with large datasets.

### Nooks — New Endpoints Needed

| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `GET /nooks/my-nooks` | `GetMyNooks(page, limit)` | **Get nooks created by the authenticated user** |
| `GET /nooks/bookmarked` | `GetBookmarkedNooks(page, limit)` | **Get nooks bookmarked by the authenticated user** |

#### `GET /nooks/my-nooks`
**Description:** Returns all nooks created by the authenticated user.
**Auth:** Bearer token
**Query Params:** `page` (default 1), `limit` (default 8)
**Response:**
```json
{
  "success": true,
  "data": {
    "nooks": [...],
    "pagination": { "page": 1, "limit": 8, "total": 3, "hasMore": false }
  }
}
```

#### `GET /nooks/bookmarked`
**Description:** Returns all nooks the authenticated user has bookmarked.
**Auth:** Bearer token
**Query Params:** `page` (default 1), `limit` (default 8)
**Response:** Same shape as `GET /nooks/my-nooks`

**Note:** The frontend currently does client-side filtering using `nook.created_by === user.id` for "My Nooks" and `nook.user_has_bookmarked` for "Bookmarked". Once these server-side endpoints are available, the filtering can be moved to the API level.

### Bookmark Toggle — May Need Addition for Topics/Nooks

If bookmark toggling for topics and nooks is not already supported, these endpoints are needed:

| Endpoint | Description |
|----------|-------------|
| `POST /forum/topics/{topicId}/bookmark` | Toggle bookmark on a forum topic |
| `POST /nooks/{nookId}/bookmark` | Toggle bookmark on a nook |

Both should return `{ success: true, data: { bookmarked: true/false } }`.

---

## **NOTIFICATION ENDPOINTS**

### Existing Endpoints (Already Implemented)
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `GET /notifications` | `GetNotifications(params)` | Get user notifications with filters (is_read, type, page, limit) |
| `GET /notifications/unread-count` | `GetUnreadCount()` | Get unread notification count |
| `GET /notifications/stats` | `GetNotificationStats()` | Get notification statistics |
| `GET /notifications/{id}` | `GetNotificationById(id)` | Get single notification by ID |
| `PATCH /notifications/{id}` | `UpdateNotification(id, payload)` | Update notification (is_read, action_taken) |
| `PATCH /notifications/{id}/read` | `MarkNotificationAsRead(id)` | Mark single notification as read |
| `PATCH /notifications/mark-all-read` | `MarkAllNotificationsAsRead()` | Mark all notifications as read |
| `POST /notifications` | `CreateNotification(payload)` | Create a notification (admin/system use) |
| `DELETE /notifications/{id}` | `DeleteNotification(id)` | Delete a single notification |
| `DELETE /notifications/read/all` | `DeleteAllReadNotifications()` | Delete all read notifications |

### NEW Endpoint Needed (Backend TODO)
| Endpoint | API Function | Description |
|----------|-------------|-------------|
| `DELETE /notifications/all` | `ClearAllNotifications()` | **Clear ALL notifications for authenticated user** |

#### `DELETE /notifications/all` — Specification

**Description:** Deletes all notifications (read and unread) for the authenticated user. Used by the "Clear All" button on the notifications page.

**Auth:** Bearer token (same as all other notification endpoints)

**Request:** No body required. User is identified from the auth token.

**Response:**
```json
{
  "success": true,
  "message": "All notifications cleared",
  "data": {
    "deleted_count": 42
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Frontend Usage:**
```typescript
import { ClearAllNotifications } from "api/notificationApis";

// Called when user clicks "Clear all" button (with confirmation dialog)
const handleClearAll = async () => {
  if (!confirm("Are you sure you want to clear all notifications?")) return;
  await ClearAllNotifications();
  setNotifications([]);
};
```

---

## **CURRENT LLM INTEGRATION STATUS**

### ✅ **FORUM - FULLY INTEGRATED**
- **Data Source**: Real API data from backend
- **Components**: TopicDetailPage.tsx → OkestraPanel
- **Flow**:
  1. Frontend calls `GetForumTopicById()` and `GetAllCommentsForATopic()`
  2. Passes Topic + Comments to `analyzeThreadWithLLM()`
  3. LLM analyzes forum discussions and returns insights

### ⚠️ **NOOKS - PARTIALLY INTEGRATED**
- **Data Source**: Real nook data, but MOCK messages for LLM
- **Components**: NooksView.tsx → OkestraPanel
- **Current Issue**: Uses mock comments instead of real `GetNookMessagesByNookId()` data
- **Fix Needed**: Fetch real nook messages before passing to LLM

---

## **FILTER PARAMETERS**

### Forum Filters
```typescript
{
  search?: string;
  sortBy?: string;
  timeFilter?: string;
  isGlobal?: boolean;
  category?: string;
  page?: number;
  limit?: number;
}
```

### Nooks Filters
```typescript
{
  urgency?: 'high' | 'medium' | 'low' | 'all';
  scope?: 'company' | 'global' | 'all';
  temperature?: 'hot' | 'warm' | 'cool' | 'all';
  hashtag?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

---

## **AUTHENTICATION**

All endpoints require authentication via:
```typescript
const accessToken = TokenUtils.getAccessToken();
const refreshToken = TokenUtils.getRefreshToken();
const authInstance = axiosInstance(accessToken, refreshToken);
```

Headers automatically added:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

---

## **DATA FLOW TO LLM**

```
User Action (Click Okestra Icon)
  ↓
Frontend Component (TopicDetailPage / NooksView)
  ↓
API Call (GetForumTopicById / GetNookById)
  ↓
Backend Returns Data (Topic + Comments)
  ↓
buildThreadPayload() - Transforms data
  ↓
analyzeThreadWithLLM() - Calls Supabase Edge Function
  ↓
Supabase Edge Function → vLLM Service
  ↓
LLM Analyzes & Returns Insights
  ↓
OkestraPanel Displays Insights to User
```

---

## **NEXT STEPS TO FULLY INTEGRATE NOOKS**

1. **Fetch Real Nook Messages**:
   ```typescript
   const messagesResponse = await GetNookMessagesByNookId(nookId);
   const messages = messagesResponse.data.messages;
   ```

2. **Transform Messages to Comments Format**:
   ```typescript
   const comments = messages.map(msg => ({
     id: msg.id,
     content: msg.content,
     author: msg.author,
     reactions: msg.reactions,
     createdAt: msg.created_at,
     replies: []
   }));
   ```

3. **Pass to LLM**:
   ```typescript
   <OkestraPanel
     isOpen={showOkestraPanel}
     onClose={() => setShowOkestraPanel(false)}
     topic={nookAsTopicFormat}
     comments={messagesAsComments}
   />
   ```

---

## **API BASE URL**

```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

All endpoints are prefixed with this base URL.
