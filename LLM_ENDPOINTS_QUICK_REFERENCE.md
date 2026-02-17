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
