# Backend New Features Specification

> **Version**: 1.0
> **Last Updated**: February 18, 2026
> **Purpose**: Backend implementation spec for new frontend features

---

## Table of Contents
1. [Aggregated User Content Endpoints](#1-aggregated-user-content-endpoints)
2. [@ Mentions System](#2--mentions-system)
3. [My Cases (Harassment Report Tracking)](#3-my-cases-harassment-report-tracking)
4. [Notification Enhancements](#4-notification-enhancements)

---

## 1. Aggregated User Content Endpoints

The frontend ProfileView now has a "My Activity" tab that shows all user-created content and bookmarked content in one view. Currently the frontend calls multiple endpoints in parallel via `Promise.allSettled`. Ideally, the backend should provide aggregated endpoints to reduce round-trips.

### Current Frontend Approach (Multiple Calls)
```
My Posts tab:    GetUserPosts() + GetMyForumTopics() + GetMyNooks()
Bookmarked tab:  GetBookmarks() + GetBookmarkedForumTopics() + GetBookmarkedNooks()
```

### Proposed Aggregated Endpoints

#### `GET /api/v1/users/me/activity`
Returns all content created by the current user, aggregated across posts, forum topics, and nooks.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `type` | string | `all` | Filter: `all`, `post`, `topic`, `nook` |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "content_type": "post",
        "id": "post_abc123",
        "content": "My post content...",
        "created_at": "2026-02-18T10:00:00Z",
        "reactions": { "like": 5, "helpful": 2, "insightful": 1 },
        "comment_count": 3,
        "view_count": 15,
        "is_bookmarked": false,
        "author": {
          "user_id": "user_xyz",
          "username": "QuietDev123",
          "display_name": "Anonymous User",
          "avatar": null
        }
      },
      {
        "content_type": "topic",
        "id": "topic_def456",
        "title": "How to handle burnout?",
        "content": "Topic body...",
        "forum_id": "forum_abc",
        "forum_name": "Mental Health",
        "created_at": "2026-02-17T08:00:00Z",
        "reactions": { "like": 12, "helpful": 8, "insightful": 3 },
        "comment_count": 7,
        "view_count": 45,
        "is_bookmarked": true,
        "author": {
          "user_id": "user_xyz",
          "username": "QuietDev123",
          "display_name": "Anonymous User",
          "avatar": null
        }
      },
      {
        "content_type": "nook",
        "id": "nook_ghi789",
        "title": "Imposter Syndrome Support",
        "description": "A safe space...",
        "created_at": "2026-02-16T14:00:00Z",
        "member_count": 8,
        "message_count": 23,
        "expires_at": "2026-02-18T14:00:00Z",
        "is_bookmarked": false,
        "author": {
          "user_id": "user_xyz",
          "username": "QuietDev123",
          "display_name": "Anonymous User",
          "avatar": null
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "has_more": true
    }
  }
}
```

#### `GET /api/v1/users/me/bookmarks`
Returns all bookmarked content for the current user, aggregated across posts, topics, and nooks.

**Query Parameters:** Same as `/users/me/activity`

**Response:** Same structure as above, but items are content bookmarked by the user (not necessarily created by them).

### Implementation Notes
- Sort all items by `created_at` descending (most recent first)
- The `content_type` field is the discriminator the frontend uses to render different card styles
- Each item should include `is_bookmarked: boolean` so the frontend can show bookmark state
- If aggregated endpoints are not feasible immediately, the frontend already works with individual endpoints

---

## 2. @ Mentions System

The frontend now supports `@username` mentions in all text inputs (posts, comments, replies, nook messages, direct messages). When a user types `@`, a dropdown appears with user suggestions from `GetConnectableUsers`. The selected username is inserted as `@username` in the text.

### What the Backend Needs to Do

#### 2.1 Parse Mentions from Content

When receiving content that may contain mentions (posts, comments, nook messages, direct messages), the backend should:

1. **Extract mentions** from the text using regex: `/@(\w+)/g`
2. **Resolve usernames** to user IDs
3. **Store mentions** in a mentions table
4. **Create notifications** for mentioned users

#### 2.2 Mentions Storage

**New Table: `mentions`**
```sql
CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentioner_id UUID NOT NULL REFERENCES users(id),
  mentioned_user_id UUID NOT NULL REFERENCES users(id),
  content_type VARCHAR(20) NOT NULL,  -- 'post', 'comment', 'topic_comment', 'nook_message', 'direct_message'
  content_id UUID NOT NULL,            -- ID of the post/comment/message
  context_id UUID,                     -- Parent context: topic_id, nook_id, conversation_id
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(mentioner_id, mentioned_user_id, content_type, content_id)
);

CREATE INDEX idx_mentions_mentioned_user ON mentions(mentioned_user_id, created_at DESC);
CREATE INDEX idx_mentions_content ON mentions(content_type, content_id);
```

#### 2.3 Affected Endpoints (Server-Side Mention Parsing)

These existing endpoints should now parse `@username` from content and create mention records + notifications:

| Endpoint | Content Field | Content Type |
|----------|--------------|--------------|
| `POST /feeds/create` | `content` | `post` |
| `POST /forums/topics/:topicId/comments` | `content` | `topic_comment` |
| `POST /nooks/:nookId/messages` | `content` | `nook_message` |
| `POST /messaging/send` | `content_encrypted` | `direct_message` |

#### 2.4 Mention Notification

When a user is mentioned, create a notification:

```json
{
  "user_id": "<mentioned_user_id>",
  "actor_id": "<mentioner_user_id>",
  "type": "mention",
  "title": "You were mentioned",
  "message": "@QuietDev123 mentioned you in a post",
  "action_url": "/dashboard/feeds/<post_id>",
  "reference_id": "<content_id>",
  "metadata": {
    "content_type": "post",
    "mentioner_username": "QuietDev123"
  }
}
```

**Notification `action_url` by content type:**
| Content Type | Action URL |
|-------------|-----------|
| `post` | `/dashboard/feeds` (scroll to post) |
| `topic_comment` | `/dashboard/forum/topics/<topic_id>` |
| `nook_message` | `/dashboard/nooks/<nook_id>` |
| `direct_message` | `/dashboard/messages?conversation=<conversation_id>` |

#### 2.5 Optional: Mentions API Endpoints

These are optional but nice-to-have:

**`GET /api/v1/users/me/mentions?page=1&limit=20`**
Returns all mentions of the current user (for a "Mentions" tab in notifications).

**Response:**
```json
{
  "success": true,
  "data": {
    "mentions": [
      {
        "id": "mention_abc",
        "mentioner": {
          "user_id": "user_123",
          "username": "TechLead42",
          "avatar": null
        },
        "content_type": "post",
        "content_id": "post_abc",
        "content_preview": "Hey @QuietDev123 check this out...",
        "context_id": null,
        "created_at": "2026-02-18T10:00:00Z",
        "is_read": false
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "has_more": false }
  }
}
```

---

## 3. My Cases (Harassment Report Tracking)

The frontend ProfileView now has a "My Cases" button in the Safety & Support section that navigates to `/dashboard/my-cases`. This allows users to track their harassment reports.

### Required Endpoints

#### `GET /api/v1/users/me/harassment-reports`
Returns all harassment reports filed by the current user.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | string | `all` | Filter: `all`, `pending`, `under_review`, `resolved`, `dismissed` |

**Response:**
```json
{
  "success": true,
  "data": {
    "cases": [
      {
        "id": "report_abc123",
        "status": "under_review",
        "category": "harassment",
        "description": "User sent threatening messages...",
        "reported_user": {
          "user_id": "user_xyz",
          "username": "OffensiveUser99"
        },
        "evidence_urls": ["https://..."],
        "created_at": "2026-02-15T10:00:00Z",
        "updated_at": "2026-02-17T14:00:00Z",
        "admin_notes": null,
        "resolution": null
      }
    ],
    "summary": {
      "total": 3,
      "pending": 1,
      "under_review": 1,
      "resolved": 1,
      "dismissed": 0
    },
    "pagination": { "page": 1, "limit": 20, "total": 3, "has_more": false }
  }
}
```

#### `GET /api/v1/users/me/harassment-reports/:reportId`
Returns details of a specific report.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report_abc123",
    "status": "under_review",
    "category": "harassment",
    "subcategory": "threatening_behavior",
    "description": "User sent threatening messages...",
    "reported_user": {
      "user_id": "user_xyz",
      "username": "OffensiveUser99"
    },
    "evidence_urls": ["https://..."],
    "created_at": "2026-02-15T10:00:00Z",
    "updated_at": "2026-02-17T14:00:00Z",
    "timeline": [
      {
        "event": "report_created",
        "timestamp": "2026-02-15T10:00:00Z",
        "message": "Report submitted"
      },
      {
        "event": "status_changed",
        "timestamp": "2026-02-16T09:00:00Z",
        "message": "Report is now under review by our safety team"
      }
    ],
    "admin_notes": null,
    "resolution": null
  }
}
```

### Report Status Flow
```
pending → under_review → resolved
                       → dismissed
```

### Notification on Status Change

When a report status changes, notify the reporter:

```json
{
  "user_id": "<reporter_user_id>",
  "type": "report_status_update",
  "title": "Report Status Updated",
  "message": "Your harassment report has been updated to: Under Review",
  "action_url": "/dashboard/my-cases/<report_id>",
  "reference_id": "<report_id>",
  "metadata": {
    "old_status": "pending",
    "new_status": "under_review"
  }
}
```

---

## 4. Notification Enhancements

### Current Notification Types (Already Working)

#### Message Send Response (when user A sends a message to user B)

```json
{
  "success": true,
  "data": {
    "message_id": "uuid",
    "conversation_id": "uuid",
    "sent_at": "2026-02-18T19:20:00.000Z",
    "recipient_id": "user-b-uuid",
    "sender_info": {
      "username": "QuietPhoenix1072",
      "avatar": "🌙"
    },
    "chat_type": "direct",
    "message": {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "user-a-uuid",
      "content_encrypted": "encrypted-content",
      "content_type": "text",
      "is_delivered": false,
      "is_read": false,
      "created_at": "2026-02-18T19:20:00.000Z",
      "sender_info": { "username": "QuietPhoenix1072", "avatar": "🌙" }
    }
  },
  "timestamp": "2026-02-18T19:20:00.000Z"
}
```

#### User B's Notification (in notifications list)

```json
{
  "id": "notif-uuid",
  "user_id": "user-b-uuid",
  "actor_id": "user-a-uuid",
  "type": "message_received",
  "title": "New Message",
  "message": "QuietPhoenix1072 sent you a message",
  "action_url": "/messages/conversation-uuid",
  "reference_id": "message-uuid",
  "reference_type": "message",
  "metadata": {
    "conversation_id": "conv-uuid",
    "chat_type": "direct"
  },
  "is_read": false,
  "created_at": "2026-02-18T19:20:00.000Z"
}
```

### New Notification Types to Add

| Type | Trigger | Title | Action URL |
|------|---------|-------|-----------|
| `mention` | User is @mentioned | "You were mentioned" | Varies by content type |
| `report_status_update` | Harassment report status changes | "Report Status Updated" | `/dashboard/my-cases/<id>` |
| `post_reaction` | Someone reacts to user's post | "New reaction on your post" | `/dashboard/feeds` |
| `topic_comment` | Someone comments on user's topic | "New comment on your topic" | `/dashboard/forum/topics/<id>` |
| `nook_reply` | Someone replies in user's nook | "New reply in your nook" | `/dashboard/nooks/<id>` |
| `bookmark_update` | Bookmarked content has new activity | "Activity on bookmarked content" | Varies |

### Notification List Endpoint (Existing)
`GET /api/v1/notifications?page=1&limit=20&type=all`

The `type` filter should support filtering by notification type:
- `all` — all notifications
- `mention` — only mention notifications
- `message_received` — only message notifications
- `report_status_update` — only report updates

---

## Summary of New Backend Work

| Priority | Feature | Endpoints | Complexity |
|----------|---------|-----------|-----------|
| **High** | Mention parsing | Modify 4 existing endpoints | Medium |
| **High** | Mention notifications | New notification type | Low |
| **High** | My Cases list | 2 new endpoints | Medium |
| **Medium** | Aggregated activity | 2 new endpoints | Medium |
| **Medium** | Report status notifications | New notification type | Low |
| **Low** | Mentions list endpoint | 1 new endpoint | Low |
| **Low** | Notification type filtering | Modify existing endpoint | Low |

### Database Changes Required
1. **New `mentions` table** (see Section 2.2)
2. **New notification types**: `mention`, `report_status_update`
3. No schema changes needed for aggregated endpoints (they query existing tables)

### Frontend Status
All frontend components are already built and ready:
- MentionTextarea component sends `@username` in content text
- ProfileView "My Activity" tab works with existing individual endpoints (fallback)
- "My Cases" button routes to `/dashboard/my-cases` (page needs to be built once API is ready)
- NotificationsView already renders all notification types generically
