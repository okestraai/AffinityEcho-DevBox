# LLM Data Access Specification

## Overview
This document defines all available data endpoints and structures that the Okestra LLM can access for analyzing Forum topics and Nooks discussions.

---

## FORUM ENDPOINTS

### **1. Forum Topics**

#### Get Topic by ID
**Endpoint**: `GET /forum/topics/{topicId}`
**API Function**: `GetForumTopicById(topicId)`

**Returns**:
```typescript
{
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  forumId: string;
  companyId?: string;
  scope: 'local' | 'global';
  reactions: {
    seen: number;
    validated: number;
    inspired: number;
    heard: number;
  };
  userReactions: {
    seen: boolean;
    validated: boolean;
    inspired: boolean;
    heard: boolean;
  };
  commentCount: number;
  createdAt: Date;
  lastActivity: Date;
  isPinned: boolean;
  tags: string[];
}
```

#### Get All Comments for a Topic
**Endpoint**: `GET /forum/topics/{topicId}/comments`
**API Function**: `GetAllCommentsForATopic(topicId)`

**Returns**:
```typescript
Comment[] // Array of comments with nested replies
```

#### Get Recent Discussions
**Endpoint**: `GET /forum/recent-discussions/{companyName}`
**API Function**: `GetRecentDiscussions(companyName, filters)`

**Query Parameters**:
- `search?: string` - Search query
- `sortBy?: string` - Sort field
- `timeFilter?: string` - Time range filter
- `isGlobal?: boolean` - Global or local scope
- `category?: string` - Category filter
- `page?: number` - Page number
- `limit?: number` - Items per page

**Returns**: List of recent discussion topics

---

### **2. Forum Comments**

#### Comment Structure
```typescript
{
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  topicId: string;
  reactions: {
    helpful: number;
    supportive: number;
  };
  userReactions: {
    helpful: boolean;
    supportive: boolean;
  };
  createdAt: Date;
  replies: Comment[]; // Nested replies
}
```

#### Create Comment
**Endpoint**: `POST /forum/comments`
**API Function**: `CreateForumTopicsComments(payload)`

**Payload**:
```typescript
{
  topicId: string;
  content: string;
  parentCommentId?: string; // For nested replies
}
```

#### Delete Comment
**Endpoint**: `DELETE /forum/comments/{commentId}`
**API Function**: `DeleteTopicsComments(commentId)`

---

### **3. Forum Reactions**

#### Add Topic Reaction
**Endpoint**: `POST /forum/topics/reactions`
**API Function**: `ForumTopicsReactions(payload)`

**Payload**:
```typescript
{
  topicId: string;
  reactionType: 'seen' | 'validated' | 'inspired' | 'heard';
}
```

#### Add Comment Reaction
**Endpoint**: `POST /forum/comments/reactions`
**API Function**: `TopicsCommentsReactions(payload)`

**Payload**:
```typescript
{
  commentId: string;
  reactionType: 'helpful' | 'supportive';
}
```

---

### **4. Forum Management**

#### Get Forum by ID
**Endpoint**: `GET /forum/{forumId}`
**API Function**: `GetForumById(forumId)`

#### Get Foundation Forums
**Endpoint**: `GET /forum/foundation/{companyName}`
**API Function**: `GetFoundationForums(companyName)`

#### Get User Joined Forums
**Endpoint**: `GET /forum/joined?companyName={companyName}`
**API Function**: `GetUserJoinedForums(companyName)`

#### Join Forum
**Endpoint**: `POST /forum/{forumId}/join`
**API Function**: `UserJoinForum(forumId)`

#### Leave Forum
**Endpoint**: `POST /forum/{forumId}/leave`
**API Function**: `UserLeaveForum(forumId)`

---

### **5. Forum Metrics**

#### Get Local Scope Metrics
**Endpoint**: `GET /forum/metrics/local/{companyName}`
**API Function**: `GetLocalScopeMetrics(companyName)`

#### Get Global Scope Metrics
**Endpoint**: `GET /forum/metrics/global`
**API Function**: `GetGlobalScopeMetrics()`

---

## NOOKS ENDPOINTS

### **1. Nooks Management**

#### Get All Nooks
**Endpoint**: `GET /nooks`
**API Function**: `GetNooks(filters)`

**Query Parameters**:
- `urgency?: 'high' | 'medium' | 'low' | 'all'`
- `scope?: 'company' | 'global' | 'all'`
- `temperature?: 'hot' | 'warm' | 'cool' | 'all'`
- `hashtag?: string`
- `sortBy?: string`
- `sortOrder?: 'asc' | 'desc'`
- `page?: number`
- `limit?: number`

**Returns**:
```typescript
{
  success: boolean;
  data: {
    nooks: Nook[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

#### Get Nook by ID
**Endpoint**: `GET /nooks/{nookId}`
**API Function**: `GetNookById(nookId)`

**Returns**:
```typescript
{
  id: string;
  title: string;
  description: string;
  urgency: string;
  scope: string;
  temperature: string;
  hashtags: string[];
  members_count: number;
  messages_count: number;
  views_count: number;
  last_activity_at: string;
  expires_at: string;
  timeLeft: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
  isMember: boolean;
  isCreator: boolean;
}
```

#### Create Nook
**Endpoint**: `POST /nooks`
**API Function**: `CreateNook(payload)`

**Payload**:
```typescript
{
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  scope: 'global' | 'company';
  hashtags: string[];
}
```

#### Delete Nook
**Endpoint**: `DELETE /nooks/{nookId}`
**API Function**: `DeleteNooksById(nookId)`

---

### **2. Nook Messages**

#### Get Nook Messages
**Endpoint**: `GET /nooks/{nookId}/messages`
**API Function**: `GetNookMessagesByNookId(nookId, filters)`

**Query Parameters**:
- `sortOrder?: 'asc' | 'desc'`
- `page?: number`
- `limit?: number`

**Returns**: Array of messages in the nook

#### Post Message to Nook
**Endpoint**: `POST /nooks/{nookId}/messages`
**API Function**: `PostNookMessageByNookId(nookId, payload)`

**Payload**:
```typescript
{
  content: string;
}
```

#### Delete Nook Message
**Endpoint**: `DELETE /nooks/{nookId}/messages/{messageId}`
**API Function**: `DeleteNooksMessageById(nookId, messageId)`

---

### **3. Nook Members**

#### Join Nook
**Endpoint**: `POST /nooks/{nookId}/members/join`
**API Function**: `JoinNook(nookId, payload)`

**Payload**:
```typescript
{
  // Any required join data
}
```

#### Leave Nook
**Endpoint**: `POST /nooks/{nookId}/members/leave`
**API Function**: `LeaveNook(nookId)`

#### Get Nook Members
**Endpoint**: `GET /nooks/{nookId}/members`
**API Function**: `GetNookMembers(nookId)`

---

### **4. Nook Reactions**

#### Add Nook Reaction (Nook-level)
**Endpoint**: `POST /nooks/{nookId}/reactions`
**API Function**: `addNookReaction(nookId, payload)`

**Payload**:
```typescript
{
  reaction_type: string;
}
```

#### Remove Nook Reaction
**Endpoint**: `DELETE /nooks/{nookId}/reactions?reaction_type={type}`
**API Function**: `removeNookReaction(nookId, reactionType)`

#### Toggle Message Reaction (Recommended)
**Endpoint**: `POST /nooks/messages/{messageId}/reactions`
**API Function**: `toggleMessageReaction(messageId, payload)`

**Payload**:
```typescript
{
  reaction_type: string;
}
```

#### Remove Message Reaction
**Endpoint**: `DELETE /nooks/messages/{messageId}/reactions?reaction_type={type}`
**API Function**: `removeMessageReaction(messageId, reactionType)`

---

### **5. Nook Metrics**

#### Get Nook Metrics
**Endpoint**: `GET /nooks/stats`
**API Function**: `GetNookMetrics()`

**Returns**:
```typescript
{
  activeNooks: number;
  anonymousUsers: number;
  totalMessageParticipants: number;
}
```

#### Flag Message
**Endpoint**: `POST /nooks/{nookId}/flag`
**API Function**: `FlagMessage(nookId)`

---

## DATA STRUCTURES

### Forum Topic (Complete)
```typescript
interface Topic {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  forumId: string;
  companyId?: string;
  scope: 'local' | 'global';
  reactions: {
    seen: number;
    validated: number;
    inspired: number;
    heard: number;
  };
  userReactions: {
    seen: boolean;
    validated: boolean;
    inspired: boolean;
    heard: boolean;
  };
  commentCount: number;
  createdAt: Date;
  lastActivity: Date;
  isPinned: boolean;
  tags: string[];
}
```

### Forum Comment (Complete)
```typescript
interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  topicId: string;
  reactions: {
    helpful: number;
    supportive: number;
  };
  userReactions: {
    helpful: boolean;
    supportive: boolean;
  };
  createdAt: Date;
  replies: Comment[];
}
```

### Nook (Complete)
```typescript
interface Nook {
  id: string;
  title: string;
  description: string;
  urgency: string;
  scope: string;
  temperature: string;
  hashtags: string[];
  members_count: number;
  messages_count: number;
  views_count: number;
  last_activity_at: string;
  expires_at: string;
  timeLeft: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
}
```

---

## USAGE IN LLM ANALYSIS

### Current Implementation
The LLM receives:
1. **Topic Data**: Complete forum topic or nook information
2. **Comments/Messages**: All discussion content
3. **User Context**: Whether user is topic author or engager
4. **Engagement Metrics**: Reactions, views, comment counts

### Available for Future Expansion
- Forum membership data
- User profiles and demographics
- Cross-topic/nook engagement patterns
- Temporal analysis (activity over time)
- Hashtag/tag relationships
- Member interaction networks

---

## AUTHENTICATION

All endpoints require:
- **Access Token**: Retrieved via `TokenUtils.getAccessToken()`
- **Refresh Token**: Retrieved via `TokenUtils.getRefreshToken()`
- **Authorization Header**: `Bearer {accessToken}`

Handled automatically by: `axiosInstance(accessToken, refreshToken)`

---

## ERROR HANDLING

Standard API Response:
```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}
```

All API calls should handle:
- 401 Unauthorized (token refresh)
- 403 Forbidden (insufficient permissions)
- 404 Not Found (resource doesn't exist)
- 500 Server Error (backend issues)