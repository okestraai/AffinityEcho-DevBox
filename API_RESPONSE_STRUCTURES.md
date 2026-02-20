# API Response Structures — Frontend Reference



## Feeds

### GET /feeds — Aggregated Feed

Returns mixed content (posts, topics, nooks) with personalized ranking.

**Query Params:**

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `filter` | string | `all` | `all`, `following`, `trending`, `company`, `global` |
| `contentType` | string | `all` | `all`, `post`, `topic`, `nook` |
| `sortBy` | string | `engagement` | `recent`, `popular`, `most_liked`, `most_commented`, `engagement` |
| `company` | string | — | Company name filter |
| `tags` | string[] | — | Tag filter |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "post_uuid-here",
      "content_type": "post",
      "content_id": "uuid-here",
      "user_id": "uuid-here",
      "author": {
        "display_name": "John Doe",
        "username": "johndoe",
        "bio": "Software engineer",
        "avatar": "avatar.png"
      },
      "content": {
        "text": "Post content here",
        "tags": ["tech", "microaggression"]
      },
      "engagement": {
        "likes": 12,
        "comments": 3,
        "shares": 1,
        "seen": 150
      },
      "reaction_counts": {
        "heard": 8,
        "validated": 3,
        "inspired": 1
      },
      "user_liked": false,
      "user_shared": false,
      "user_bookmarked": true,
      "user_reactions": {
        "heard": true,
        "validated": false,
        "inspired": false
      },
      "engagement_score": 45.23,
      "created_at": "2026-02-15T10:00:00Z"
    },
    {
      "id": "topic_uuid-here",
      "content_type": "topic",
      "content_id": "uuid-here",
      "user_id": "uuid-here",
      "author": {
        "display_name": "Jane Smith",
        "username": "janesmith",
        "bio": "Product manager",
        "avatar": "avatar2.png"
      },
      "content": {
        "title": "Topic Title",
        "text": "Topic content",
        "forum_name": "Career Growth",
        "tags": ["career", "leadership"]
      },
      "engagement": {
        "likes": 20,
        "comments": 5,
        "seen": 300
      },
      "reaction_counts": {
        "heard": 10,
        "validated": 6,
        "inspired": 4
      },
      "user_liked": false,
      "user_shared": false,
      "user_bookmarked": false,
      "user_reactions": {
        "heard": false,
        "validated": true,
        "inspired": false
      },
      "engagement_score": 78.5,
      "created_at": "2026-02-14T10:00:00Z"
    },
    {
      "id": "nook_uuid-here",
      "content_type": "nook_message",
      "content_id": "uuid-here",
      "user_id": "uuid-here",
      "author": {
        "display_name": "Anonymous User",
        "username": "user123",
        "bio": "Designer",
        "avatar": "avatar3.png"
      },
      "content": {
        "title": "Nook Title",
        "text": "Nook description",
        "nook_name": "Nook Title",
        "nook_urgency": "medium",
        "nook_scope": "global",
        "nook_temperature": "hot",
        "nook_members": 15,
        "nook_time_left": "18h 30m"
      },
      "engagement": {
        "likes": 0,
        "comments": 42
      },
      "reaction_counts": {
        "heard": 5,
        "validated": 2,
        "inspired": 0
      },
      "user_liked": false,
      "user_shared": false,
      "user_bookmarked": false,
      "user_reactions": {
        "heard": false,
        "validated": false,
        "inspired": false
      },
      "engagement_score": 55.0,
      "created_at": "2026-02-13T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "hasMore": true
  }
}
```

**Key notes for frontend:**
- `author.display_name` = real name if identity reveal accepted, otherwise username
- `content_type` determines the card layout: `"post"`, `"topic"`, or `"nook_message"`
- `user_reactions` tracks which reactions the current user has toggled
- `reaction_counts` provides total counts for each reaction type
- When `filter=trending`, results are time-boxed to last 7 days with acceleration-based scoring
- **User's own content is excluded** — you will NOT see your own posts/topics/nooks in the feed

---

### POST /feeds/:contentType/:contentId/react — Toggle Reaction

Toggle a reaction (heard/validated/inspired) on any feed content.

**URL Params:** `contentType` = `post` | `topic` | `nook_message`, `contentId` = UUID

**Body:**

```json
{
  "reactionType": "heard"
}
```

Valid values: `"heard"`, `"validated"`, `"inspired"`

**Response:**

```json
{
  "success": true,
  "data": {
    "reacted": true,
    "reactionType": "heard",
    "counts": {
      "heard": 9,
      "validated": 3,
      "inspired": 1
    }
  },
  "message": "Reaction added"
}
```

When removing (toggling off):

```json
{
  "success": true,
  "data": {
    "reacted": false,
    "reactionType": "heard",
    "counts": {
      "heard": 8,
      "validated": 3,
      "inspired": 1
    }
  },
  "message": "Reaction removed"
}
```

---

### POST /feeds/:contentType/:contentId/like — Toggle Like (Legacy)

Still available for backward compatibility. Toggle a like on content.

**Response:**

```json
{
  "success": true,
  "data": { "liked": true },
  "message": "Liked successfully"
}
```

---

### POST /feeds/:contentType/:contentId/bookmark — Toggle Bookmark

**Response:**

```json
{
  "success": true,
  "data": { "bookmarked": true },
  "message": "Bookmarked successfully"
}
```

---

### GET /feeds/bookmarks — User Bookmarks

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "content_type": "post",
      "content_id": "uuid",
      "created_at": "2026-02-15T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "hasMore": false }
}
```

---

## Forum Topics

### GET /forum/topics — All Topics

**Query Params:** `forumId`, `scope`, `search`, `sortBy` (`recent` | `popular` | `trending` | `most_commented`), `page`, `limit`

**Response:**

```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "forum_id": "uuid",
        "title": "Topic Title",
        "content": "Topic body text",
        "is_anonymous": false,
        "tags": ["career", "tech"],
        "scope": "global",
        "company_name": null,
        "views_count": 150,
        "comments_count": 12,
        "reaction_seen_count": 20,
        "reaction_validated_count": 8,
        "reaction_inspired_count": 5,
        "reaction_heard_count": 15,
        "is_pinned": false,
        "is_locked": false,
        "created_at": "2026-02-14T10:00:00Z",
        "updated_at": "2026-02-15T10:00:00Z",
        "forum": { "id": "uuid", "name": "Career Growth" },
        "user_profile": {
          "id": "uuid",
          "username": "johndoe",
          "avatar": "avatar.png",
          "bio": "Software engineer",
          "display_name": "John Doe"
        },
        "userReactions": {
          "seen": false,
          "validated": true,
          "inspired": false,
          "heard": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasMore": true
    }
  }
}
```

**Notes:**
- When `sortBy=trending`, results are filtered to the last 7 days and sorted by comment count (most discussed)
- **User's own topics are excluded** from listings
- `display_name` is shown when identity reveal is accepted

---

### GET /forum/topics/my-posts — My Topics (NEW)

Returns topics created by the authenticated user.

**Query Params:** `page` (default 1), `limit` (default 20)

**Response:** Same structure as `GET /forum/topics`

---

### GET /forum/topics/bookmarked — Bookmarked Topics (NEW)

Returns topics bookmarked by the authenticated user.

**Query Params:** `page` (default 1), `limit` (default 20)

**Response:** Same structure as `GET /forum/topics`

---

### POST /forum/topics/:topicId/bookmark — Toggle Topic Bookmark (NEW)

**Response:**

```json
{
  "success": true,
  "data": { "bookmarked": true },
  "message": "Topic bookmarked"
}
```

---

### POST /forum/topics/reactions — Toggle Topic Reaction

**Body:**

```json
{
  "topicId": "uuid",
  "reactionType": "seen"
}
```

Valid types: `"seen"`, `"validated"`, `"inspired"`, `"heard"`

**Response:**

```json
{
  "success": true,
  "data": {
    "action": "added",
    "reaction_type": "seen",
    "counts": {
      "seen": 21,
      "validated": 8,
      "inspired": 5,
      "heard": 15
    }
  }
}
```

---

## Nooks

### GET /nooks — All Nooks

**Query Params:**

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `page` | number | `1` | — |
| `limit` | number | `8` | — |
| `urgency` | string | `all` | `high`, `medium`, `low`, `all` |
| `scope` | string | `all` | `company`, `global`, `all` |
| `temperature` | string | `all` | `hot`, `warm`, `cool`, `all` |
| `hashtag` | string | — | Filter by hashtag |
| `sortBy` | string | `created_at` | `created_at`, `last_activity_at`, `members_count`, `trending` |
| `sortOrder` | string | `desc` | `asc`, `desc` |

**Response:**

```json
{
  "success": true,
  "data": {
    "nooks": [
      {
        "id": "uuid",
        "title": "Workplace Microaggressions",
        "description": "Safe space to discuss...",
        "creator_id": "uuid",
        "urgency": "medium",
        "scope": "global",
        "temperature": "hot",
        "hashtags": ["microaggression", "workplace"],
        "members_count": 15,
        "messages_count": 42,
        "views_count": 200,
        "is_active": true,
        "is_locked": false,
        "expires_at": "2026-02-18T10:00:00Z",
        "created_at": "2026-02-17T10:00:00Z",
        "timeLeft": "18h 30m"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 8,
      "total": 12,
      "totalPages": 2
    }
  }
}
```

**Notes:**
- When `sortBy=trending`, results are filtered to the last 7 days and sorted by `messages_count` (most active)
- **User's own nooks are excluded** from listings

---

### GET /nooks/my-nooks — My Nooks (NEW)

Returns nooks created by the authenticated user.

**Query Params:** `page` (default 1), `limit` (default 8)

**Response:** Same structure as `GET /nooks`

---

### GET /nooks/bookmarked — Bookmarked Nooks (NEW)

Returns nooks bookmarked by the authenticated user.

**Query Params:** `page` (default 1), `limit` (default 8)

**Response:** Same structure as `GET /nooks`

---

### POST /nooks/:id/bookmark — Toggle Nook Bookmark (NEW)

**Response:**

```json
{
  "success": true,
  "data": { "bookmarked": true },
  "message": "Nook bookmarked"
}
```

---

### POST /nooks/messages/:id/reactions — Toggle Nook Message Reaction

**Body:**

```json
{
  "reaction_type": "heard"
}
```

Valid types: `"heard"`, `"validated"`, `"helpful"`, `"supportive"`, `"inspired"` (NEW)

**Response:**

```json
{
  "success": true,
  "data": {
    "action": "added",
    "reaction_type": "inspired",
    "message_id": "uuid"
  }
}
```

---

### GET /nooks/stats — Global Nook Statistics

**Response:**

```json
{
  "success": true,
  "data": {
    "activeNooks": 15,
    "totalNooks": 120,
    "anonymousUsers": 8,
    "messagesToday": 234,
    "hotNooks": 3,
    "totalMessageParticipants": 89
  }
}
```

---

## Mentorship Discover

### GET /mentorship/discover — Discover Profiles

**Query Params:**

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `viewMode` | string | `all` | `all`, `mentors`, `mentees` |
| `search` | string | — | Search by username/bio/title |
| `careerLevel` | string[] | — | Career level filter |
| `expertise` | string[] | — | Expertise areas filter |
| `industries` | string[] | — | Industry filter |
| `affinityTags` | string[] | — | Affinity tag filter |
| `availability` | string | — | `immediate`, `within_week`, `within_month`, `all` |
| `location` | string | — | Location text filter |
| `minMatchScore` | number | — | Minimum match score (0-100) (NEW) |
| `maxMatchScore` | number | — | Maximum match score (0-100) (NEW) |
| `sortBy` | string | `recent` | `recent`, `experience`, `reputation`, `match_score` |
| `sortOrder` | string | `desc` | `asc`, `desc` |
| `page` | number | `1` | — |
| `limit` | number | `20` | — |

**Response:**

```json
{
  "success": true,
  "profiles": [
    {
      "id": "uuid",
      "username": "mentorpro",
      "display_name": "Maria Garcia",
      "avatar": "avatar.png",
      "bio": "Senior engineer with 10 years experience",
      "job_title": "Staff Engineer",
      "location": "San Francisco, CA",
      "years_experience": 10,
      "mentor_expertise": ["Technical Leadership", "Career Development"],
      "mentor_industries": ["Technology", "SaaS"],
      "mentor_availability": "Within 1 week",
      "mentor_response_time": "Within 24 hours",
      "is_active_mentor": true,
      "is_active_mentee": false,
      "mentoring_as": "mentor",
      "career_level": "Senior (8-12 years)",
      "affinity_tags": ["Latino Leaders", "Women in Leadership"],
      "reputation_score": 85,
      "mentorship_sessions_completed": 12,
      "isBookmarked": false,
      "matchScore": 78
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "metadata": {
    "filteredCount": 18,
    "note": "Some results filtered by privacy preferences"
  }
}
```

**Key notes:**
- `display_name` appears when identity reveal is accepted between current user and profile
- `matchScore` is now calculated using the **current user's actual profile data** (expertise, industries, location, career level) — NOT the search query params
- **Existing mentor-mentee pairs are excluded** — you won't see users you're already mentoring with
- Use `minMatchScore`/`maxMatchScore` to filter by match quality

---

### GET /mentorship/discover/filters/options — Filter Options

**Response:**

```json
{
  "success": true,
  "data": {
    "careerLevels": [
      "Entry Level (0-2 years)",
      "Mid-level (3-7 years)",
      "Senior (8-12 years)",
      "Leadership (13+ years)",
      "Executive/C-Suite"
    ],
    "expertiseAreas": [
      "Technical Leadership", "Career Development", "Product Management",
      "Engineering Management", "Startup Founder", "Investor Relations",
      "Marketing Strategy", "Sales Leadership", "UX/UI Design",
      "Data Science", "Cloud Architecture", "DevOps",
      "Mobile Development", "Web Development", "AI/ML",
      "Entrepreneurship", "Workplace Navigation", "Interview Skills",
      "Engineering", "Finance", "Marketing"
    ],
    "industries": [
      "Technology", "Finance", "Healthcare", "Education", "Retail",
      "Manufacturing", "Media & Entertainment", "Real Estate",
      "Transportation", "Energy", "Consulting", "Non-profit",
      "Government", "SaaS", "E-commerce"
    ],
    "affinityTags": [
      "Black Women in Tech", "Latino Leaders", "Women in Leadership",
      "LGBTQ+ in Finance", "Asian Entrepreneurs", "First-Gen College Grads",
      "Working Parents", "Military Veterans", "Disabled Professionals",
      "Immigrant Professionals"
    ],
    "availabilityOptions": [
      "Immediate", "Within 1 week", "Within 2 weeks",
      "Within 1 month", "Within 3 months"
    ],
    "communicationMethods": ["video-calls", "phone-calls", "text-chat", "email"],
    "languages": ["English", "Spanish", "French", "German", "Russian", "Japanese"],
    "matchScoreRanges": [
      { "label": "Excellent (80-100)", "min": 80, "max": 100 },
      { "label": "Good (60-79)", "min": 60, "max": 79 },
      { "label": "Fair (40-59)", "min": 40, "max": 59 },
      { "label": "All", "min": 0, "max": 100 }
    ]
  }
}
```

---

## Notifications

### GET /notifications — Get Notifications

**Query Params:** `is_read` (boolean), `type` (string), `page`, `limit`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "actor_id": "uuid",
      "type": "feed_like",
      "title": "New Reaction",
      "message": "johndoe reacted \"heard\" to your post",
      "action_url": "/feed/posts/uuid",
      "is_read": false,
      "action_taken": false,
      "reference_id": "uuid",
      "reference_type": "post",
      "metadata": { "reactionType": "heard" },
      "created_at": "2026-02-17T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 15, "hasMore": false }
}
```

---

### DELETE /notifications/all — Clear All Notifications (NEW)

Deletes ALL notifications (read and unread) for the authenticated user.

**Request:** No body needed.

**Response:**

```json
{
  "success": true,
  "message": "All notifications cleared",
  "data": { "deleted_count": 42 }
}
```

---

### DELETE /notifications/read/all — Delete Read Notifications

Deletes only read notifications.

**Response:**

```json
{
  "success": true,
  "message": "Read notifications deleted",
  "data": { "deleted_count": 15 }
}
```

---

### GET /notifications/unread-count — Unread Count

**Response:**

```json
{
  "success": true,
  "data": { "count": 5 }
}
```

---

## Uniform Reactions Reference

### Reaction Types Per Content

| Content | Valid Reactions |
|---------|---------------|
| **Feed Posts** | `heard`, `validated`, `inspired` (via `/feeds/post/:id/react`) |
| **Forum Topics** | `seen`, `validated`, `inspired`, `heard` (via `/forum/topics/reactions`) |
| **Nook Messages** | `heard`, `validated`, `helpful`, `supportive`, `inspired` (via `/nooks/messages/:id/reactions`) |
| **Feed Comments** | `helpful` (via existing comment reaction system) |
| **Nook-Level** | `heard`, `validated`, `inspired` (via `/nooks/:id/reactions`) |

### Uniform Icon + Color Standard

```
Heard      ->  Heart       ->  text-red-500    fill-red-500
Validated  ->  ThumbsUp    ->  text-blue-600   fill-blue-600
Inspired   ->  Star        ->  text-yellow-500 fill-yellow-500
Seen       ->  Eye         ->  text-green-600  fill-green-600
Helpful    ->  ThumbsUp    ->  text-green-600  fill-green-600
```

---

## New Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/feeds/:contentType/:contentId/react` | Toggle reaction (heard/validated/inspired) |
| `GET` | `/forum/topics/my-posts` | Get user's own topics |
| `GET` | `/forum/topics/bookmarked` | Get bookmarked topics |
| `POST` | `/forum/topics/:topicId/bookmark` | Toggle topic bookmark |
| `GET` | `/nooks/my-nooks` | Get user's own nooks |
| `GET` | `/nooks/bookmarked` | Get bookmarked nooks |
| `POST` | `/nooks/:id/bookmark` | Toggle nook bookmark |
| `DELETE` | `/notifications/all` | Clear all notifications |

## Updated Endpoints

| Method | Endpoint | Change |
|--------|----------|--------|
| `POST` | `/nooks/messages/:id/reactions` | Now accepts `"inspired"` as reaction_type |
| `GET` | `/feeds` | Response includes `reaction_counts`, `user_reactions` fields |
| `GET` | `/mentorship/discover` | Excludes existing pairs, shows real names, fixed match scoring |
| `GET` | `/mentorship/discover/filters/options` | Includes `matchScoreRanges` |
| `GET` | `/nooks` | Supports `sortBy=trending` (7-day time-box) |
| `GET` | `/forum/topics` | Trending sort is time-boxed to 7 days |
