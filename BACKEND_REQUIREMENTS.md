# Backend Requirements — New Frontend Features

> **Version**: 1.0
> **Date**: February 18, 2026
> **Purpose**: Everything the backend team needs to build for the new frontend features

---

## Table of Contents

1. [User Search for Mentions](#1-user-search-for-mentions)
2. [Mention Parsing & Notifications](#2-mention-parsing--notifications)
3. [Aggregated User Content](#3-aggregated-user-content)
4. [My Cases (Harassment Report Tracking)](#4-my-cases-harassment-report-tracking)
5. [Notification Enhancements](#5-notification-enhancements)
6. [Priority & Effort Summary](#6-priority--effort-summary)

---

## 1. User Search for Mentions

### Problem

The frontend now supports `@username` mentions in all text inputs (posts, comments, nook messages, direct messages). When a user types `@`, a dropdown appears with matching usernames.

Currently, `GetConnectableUsers` (`GET /user-discovery/connectable-users`) is used for the mention search, but this endpoint is designed for chat — it **excludes users who already have a conversation** with the current user. This means existing conversation partners don't appear in mention suggestions.

### New Endpoint Required

#### `GET /user-discovery/search`

A general-purpose user search that returns ALL users matching the query, regardless of conversation status. This is what the frontend will use for `@mention` suggestions.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | Yes | Username or display name prefix to search for |
| `limit` | number | No (default: 5) | Max results to return |

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-uuid-1",
        "username": "QuietPhoenix1072",
        "display_name": "Anonymous User",
        "avatar_emoji": "🌙"
      },
      {
        "id": "user-uuid-2",
        "username": "SilentCoder42",
        "display_name": "Anonymous User",
        "avatar_emoji": "🦊"
      }
    ]
  }
}
```

**Implementation Notes:**

- Search should match against `username` (case-insensitive prefix match)
- Should NOT filter by conversation status, block status with conversation filter, or any chat-specific logic
- SHOULD exclude blocked users (if user A blocked user B, B should not appear in A's mention results)
- Should be fast — this is called on every keystroke (debounced 300ms on frontend) so keep it lightweight
- The frontend calls: `GET /user-discovery/search?search=quiet&limit=5`

**Frontend Code:**

```typescript
// api/messaging.ts
export const SearchUsersForMention = async (filters: {
  search: string;
  limit?: number;
}) => {
  const url = `${API_URL}/user-discovery/search?search=${filters.search}&limit=${filters.limit || 5}`;
  return authFetch.get(url);
};
```

---

## 2. Mention Parsing & Notifications

### What the Frontend Sends

When a user creates content with mentions, the raw text contains `@username`:

```
"Hey @QuietPhoenix1072 check out this post about @SilentCoder42's approach"
```

The frontend sends this raw text in the existing content field — no special formatting.

### What the Backend Needs to Do

#### 2.1 Parse Mentions from Content

When receiving content on these existing endpoints, extract `@username` mentions:

| Existing Endpoint | Content Field | Content Type for Mention Record |
|-------------------|---------------|-------------------------------|
| `POST /feeds/posts` | `content.text` | `post` |
| `POST /forum/comments` | `content` | `topic_comment` |
| `POST /nooks/:nookId/messages` | `content` | `nook_message` |
| `POST /messaging/send` | `content_encrypted` | `direct_message` |

**Parsing logic:**

```
Regex: /@(\w+)/g
```

For each match:
1. Resolve `username` → `user_id` (skip if username doesn't exist)
2. Don't mention yourself (skip if mentioner === mentioned)
3. Store mention record
4. Create notification for mentioned user

#### 2.2 Mentions Table

```sql
CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentioner_id UUID NOT NULL REFERENCES users(id),
  mentioned_user_id UUID NOT NULL REFERENCES users(id),
  content_type VARCHAR(20) NOT NULL,  -- 'post', 'topic_comment', 'nook_message', 'direct_message'
  content_id UUID NOT NULL,            -- ID of the post/comment/message
  context_id UUID,                     -- Parent context: topic_id, nook_id, conversation_id
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(mentioner_id, mentioned_user_id, content_type, content_id)
);

CREATE INDEX idx_mentions_mentioned_user ON mentions(mentioned_user_id, created_at DESC);
CREATE INDEX idx_mentions_content ON mentions(content_type, content_id);
```

#### 2.3 Mention Notification

When a user is mentioned, create a notification:

```json
{
  "user_id": "<mentioned_user_id>",
  "actor_id": "<mentioner_user_id>",
  "type": "mention",
  "title": "You were mentioned",
  "message": "@QuietPhoenix1072 mentioned you in a post",
  "action_url": "/dashboard/feeds",
  "reference_id": "<content_id>",
  "reference_type": "mention",
  "metadata": {
    "content_type": "post",
    "mentioner_username": "QuietPhoenix1072"
  },
  "is_read": false,
  "created_at": "2026-02-18T10:00:00Z"
}
```

**`action_url` by content type:**

| Content Type | action_url |
|-------------|------------|
| `post` | `/dashboard/feeds` |
| `topic_comment` | `/dashboard/forums/topic/<topic_id>` |
| `nook_message` | `/dashboard/nooks/<nook_id>` |
| `direct_message` | `/dashboard/messages?conversation=<conversation_id>` |

---

## 3. Aggregated User Content

### Context

The ProfileView "My Activity" page shows all user-created content (posts + forum topics + nooks) and all bookmarked content in one view. Currently the frontend calls 3 endpoints in parallel per tab via `Promise.allSettled`. This works but is inefficient.

### Current Frontend Approach (Already Working)

```
My Posts tab:    GetUserPosts(userId) + GetMyForumTopics() + GetMyNooks()
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
        "content": { "text": "My post content..." },
        "created_at": "2026-02-18T10:00:00Z",
        "reaction_counts": { "heard": 5, "validated": 2, "inspired": 1 },
        "engagement": { "comments": 3, "shares": 0 },
        "user_reactions": { "heard": false, "validated": false, "inspired": false },
        "user_has_bookmarked": false,
        "author": {
          "user_id": "user_xyz",
          "username": "QuietDev123",
          "display_name": "Anonymous User",
          "avatar": "🌙"
        }
      },
      {
        "content_type": "topic",
        "id": "topic_def456",
        "title": "How to handle burnout?",
        "content": "Topic body...",
        "forum": { "id": "forum_abc", "name": "Mental Health", "icon": "🧠" },
        "created_at": "2026-02-17T08:00:00Z",
        "reactions": { "heard": 12, "validated": 8, "inspired": 3 },
        "views_count": 45,
        "comments_count": 7,
        "user_has_bookmarked": true,
        "tags": ["burnout", "mental-health"],
        "scope": "global",
        "user_profile": {
          "username": "QuietDev123",
          "avatar": "🌙"
        }
      },
      {
        "content_type": "nook",
        "id": "nook_ghi789",
        "title": "Imposter Syndrome Support",
        "description": "A safe space...",
        "created_at": "2026-02-16T14:00:00Z",
        "members_count": 8,
        "messages_count": 23,
        "timeLeft": "2h 30m",
        "urgency": "low",
        "temperature": "warm",
        "scope": "global",
        "hashtags": ["imposter-syndrome"]
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

Same structure as above but returns content bookmarked by the user (not necessarily created by them).

**Query Parameters:** Same as `/users/me/activity`

**Response:** Same structure. Items are bookmarked content with `content_type` discriminator.

### Implementation Notes

- Sort all items by `created_at` descending (most recent first)
- The `content_type` field (`post` | `topic` | `nook`) is the discriminator the frontend uses to render different card styles
- Each item should match the response shape of its individual endpoint (post items match feed post shape, topic items match forum topic shape, nook items match nook shape)
- If these aggregated endpoints are not feasible immediately, the frontend already works with the individual endpoints as a fallback

---

## 4. My Cases (Harassment Report Tracking)

### Context

The ProfileView "My Profile" page has a "My Cases" button in the Safety section that navigates to `/dashboard/my-cases`. The existing endpoints partially support this:

- `GET /user/reports/harassment` — Returns user's reports (already exists)
- `GET /user/reports/harassment/:id` — Returns single report (already exists)

### What's Needed

#### 4.1 Enhanced Report List Response

The existing `GET /user/reports/harassment` should include a summary section:

```json
{
  "success": true,
  "data": {
    "cases": [...],
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

#### 4.2 Report Status Filter

Add `status` query parameter to `GET /user/reports/harassment`:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | `all` | Filter: `all`, `pending`, `under_review`, `resolved`, `dismissed` |

#### 4.3 Report Timeline

The single report endpoint `GET /user/reports/harassment/:id` should include a timeline:

```json
{
  "success": true,
  "data": {
    "id": "report_abc123",
    "status": "under_review",
    "category": "harassment",
    "description": "...",
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
    ]
  }
}
```

#### 4.4 Status Change Notification

When a report status changes, notify the reporter:

```json
{
  "user_id": "<reporter_user_id>",
  "actor_id": null,
  "type": "report_status_update",
  "title": "Report Status Updated",
  "message": "Your harassment report has been updated to: Under Review",
  "action_url": "/dashboard/my-cases/<report_id>",
  "reference_id": "<report_id>",
  "reference_type": "harassment_report",
  "metadata": {
    "old_status": "pending",
    "new_status": "under_review"
  },
  "is_read": false,
  "created_at": "2026-02-17T14:00:00Z"
}
```

---

## 5. Notification Enhancements

### Existing Notification Structure (Working)

When user A sends a message to user B, user B receives:

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

| Type | Trigger | Title | Message Template | action_url |
|------|---------|-------|-----------------|------------|
| `mention` | User is @mentioned in content | "You were mentioned" | "@{actor} mentioned you in a {content_type}" | Varies by content type (see Section 2.3) |
| `report_status_update` | Harassment report status changes | "Report Status Updated" | "Your harassment report has been updated to: {new_status}" | `/dashboard/my-cases/<report_id>` |
| `post_reaction` | Someone reacts to user's post | "New reaction on your post" | "@{actor} reacted to your post" | `/dashboard/feeds` |
| `topic_comment` | Someone comments on user's topic | "New comment on your topic" | "@{actor} commented on your topic" | `/dashboard/forums/topic/<topic_id>` |
| `nook_reply` | Someone replies in user's nook | "New reply in your nook" | "@{actor} replied in your nook" | `/dashboard/nooks/<nook_id>` |

### Notification Type Filtering

The existing `GET /notifications` endpoint should support filtering by `type`:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | `all` | Filter: `all`, `mention`, `message_received`, `report_status_update`, `post_reaction`, `topic_comment`, `nook_reply` |

The frontend already sends: `GET /notifications?page=1&limit=20&type=all`

---

## 6. Priority & Effort Summary

| Priority | Feature | What to Build | Effort |
|----------|---------|---------------|--------|
| **P0 — High** | User search for mentions | `GET /user-discovery/search` — new endpoint | Low |
| **P0 — High** | Mention parsing | Modify 4 existing content creation endpoints to extract `@username` | Medium |
| **P0 — High** | Mention notifications | New `mention` notification type + creation on mention | Low |
| **P1 — Medium** | Aggregated activity | `GET /users/me/activity` — new endpoint | Medium |
| **P1 — Medium** | Aggregated bookmarks | `GET /users/me/bookmarks` — new endpoint | Medium |
| **P1 — Medium** | Report status notifications | New `report_status_update` notification type | Low |
| **P2 — Low** | Report timeline | Add `timeline` array to harassment report detail | Low |
| **P2 — Low** | Report status filter | Add `status` query param to reports list | Low |
| **P2 — Low** | Notification type filter | Add `type` query param to notifications list | Low |
| **P2 — Low** | Reaction/comment notifications | New notification types for post_reaction, topic_comment, nook_reply | Medium |

### Database Changes Required

1. **New `mentions` table** (see Section 2.2)
2. **New notification types**: `mention`, `report_status_update`, `post_reaction`, `topic_comment`, `nook_reply`
3. No schema changes needed for aggregated endpoints (they query existing tables)
4. No schema changes needed for user search (queries existing users table)

### Frontend Status

All frontend components are already built and ready:

- `MentionTextarea` component calls `GET /user-discovery/search` for mention suggestions
- `MentionInput` component (single-line variant) does the same
- ProfileView "My Activity" page works with existing individual endpoints as fallback
- ProfileView "My Cases" button routes to `/dashboard/my-cases`
- NotificationsView renders all notification types generically based on the `type` field
