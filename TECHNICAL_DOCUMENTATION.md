# Affinity Echo - Technical Documentation

This document covers the internal architecture, data flows, service layers, and implementation patterns of the Affinity Echo frontend.

For a general overview, features list, and getting started guide, see [README.md](README.md).
For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Authentication System](#authentication-system)
- [HTTP Layer & Axios Interceptor](#http-layer--axios-interceptor)
- [WebSocket Service](#websocket-service)
- [Encryption Service](#encryption-service)
- [Routing & Route Guards](#routing--route-guards)
- [State Management](#state-management)
- [API Layer](#api-layer)
- [Component Architecture](#component-architecture)
- [Error Handling](#error-handling)
- [Performance Optimizations](#performance-optimizations)
- [Environment Configuration](#environment-configuration)
- [Type System](#type-system)
- [Testing Infrastructure](#testing-infrastructure)

---

## System Architecture

### High-Level Overview

```text
Browser
  |
  v
[React App] --HTTP/REST--> [Backend API Server]
     |                          |
     |--WebSocket (socket.io)-->|
     |                          |
     |--Encryption Session----->|
     |                          v
     |                    [PostgreSQL / Supabase]
     v
[Vite Dev Server / Static CDN]
```

### Request Lifecycle

```text
1. Component triggers action (e.g., user clicks "Send Message")
2. Component calls API function from api/*.ts
3. API function calls getAuthInstance() from api/base.ts
4. getAuthInstance() creates Axios instance with current tokens
5. AxiosInterceptor attaches Authorization header
6. Request sent to backend
7. If 401: interceptor queues request, refreshes token, retries
8. Response received → API function returns res.data
9. Component parses response and updates local state
```

---

## Authentication System

### AuthContext (`src/contexts/AuthContext.tsx`)

The `AuthProvider` wraps the entire app and provides authentication state and methods via React Context.

### User State Shape

```typescript
interface User {
  id: string;
  email: string;
  username: string;          // Auto-generated: "BraveEagle4523"
  avatar: string | null;     // Random emoji from 60-item pool
  first_name?: string;
  last_name?: string;
  has_completed_onboarding: boolean;
  demographics: {
    race?: string;
    gender?: string;
    careerLevel?: string;
    company?: string;
    affinityTags?: string[];
  };
}
```

### Exported Context Values

| Value | Type | Description |
| ----- | ---- | ----------- |
| `user` | `User \| null` | Current authenticated user |
| `isAuthenticated` | `boolean` | Whether user is logged in |
| `hasCompletedOnboarding` | `boolean` | Whether user finished onboarding |
| `isLoading` | `boolean` | Auth state loading (initial check) |
| `login(email, password)` | `Promise<void>` | Email/password login |
| `signup(email, password)` | `Promise<void>` | Register with auto-generated identity |
| `socialLogin(provider)` | `Promise<void>` | OAuth redirect (Google/Facebook) |
| `forgotPassword(email)` | `Promise<void>` | Send password reset OTP |
| `logout()` | `void` | Clear tokens, redirect to login |
| `loadUser()` | `Promise<void>` | Fetch current user from API |
| `updateUser(updates)` | `void` | Shallow merge updates into user state |
| `completeOnboarding(data?)` | `Promise<void>` | Refresh user and navigate to dashboard |

### Authentication Flows

**Login:**

```text
login(email, password)
  → API: loginUser({ email, password })
  → Check if account is deactivated
    → If deactivated: show reactivation modal → ReactivateAccount() → proceed
  → TokenUtils.setTokens(access_token, refresh_token)
  → loadUser()
  → Navigate to /dashboard or /onboarding (based on has_completed_onboarding)
```

**Signup:**

```text
signup(email, password)
  → Generate random username: adjective + noun + 4-digit number
  → Generate random avatar: emoji from 60-item pool
  → API: registerUser({ email, password, username, avatar })
  → Navigate to /verify-otp with email in state
```

**Social Login:**

```text
socialLogin("google" | "facebook")
  → API: SocialMediaLogin(provider)
  → Validate redirect URL against whitelist:
    - localhost, 127.0.0.1, google.com, facebook.com
  → window.location.href = redirect_url
```

**Token Lifecycle:**

```text
Initial Load:
  → TokenUtils.hasTokens() ? loadUser() : setIsLoading(false)

Token Storage:
  → Cookies: access_token (7-day), refresh_token (30-day)
  → localStorage: fallback for both tokens

Token Refresh:
  → Handled by AxiosInterceptor (see next section)

Logout:
  → TokenUtils.clearTokens() (removes from cookies + localStorage)
  → Set user = null
  → Navigate to /login
```

### Anonymous Identity Generation

Usernames and avatars are generated at signup time and stored server-side:

```text
Username pool:
  Adjectives: Brave, Quiet, Rising, Bold, True, Free
  Nouns: Lion, Eagle, Wolf, Fox, Phoenix, Bear
  Format: {Adjective}{Noun}{4-digit random}
  Example: "BoldPhoenix7291"

Avatar pool:
  60 emojis (stars, animals, objects, nature)
  Randomly selected at signup
```

---

## HTTP Layer & Axios Interceptor

### AxiosInterceptor (`src/Helper/AxiosInterceptor.tsx`)

Creates a configured Axios instance with automatic token management.

### Request Interceptor

```text
Every outgoing request:
  → If accessToken exists:
    → Set header: Authorization: Bearer {accessToken}
  → Return config
```

### Response Interceptor (401 Handling)

The interceptor implements a token refresh queue pattern to handle concurrent 401 responses:

```text
On 401 response:
  1. Check: !originalRequest._retry AND refreshToken exists
  2. Set _retry = true (prevent infinite loops)
  3. If already refreshing (isRefreshing = true):
     → Queue this request in failedQueue
     → Return Promise that resolves when refresh completes
  4. If not refreshing:
     → Set isRefreshing = true
     → POST /auth/refresh-token { refreshToken }
     → On success:
       a. Store new access_token in cookies (7 days) + localStorage
       b. Reconnect WebSocket: webSocketService.reconnectWithFreshToken()
       c. Process failedQueue with new token
       d. Retry original request with new token
     → On failure:
       a. Reject all queued requests
       b. Clear all tokens (cookies + localStorage)
       c. Redirect: window.location.href = '/login'
     → Finally: isRefreshing = false
```

**Queue Pattern Detail:**

```text
failedQueue = [
  { resolve: (token) => retry(request1), reject: (err) => fail(request1) },
  { resolve: (token) => retry(request2), reject: (err) => fail(request2) },
  ...
]

processQueue(error, token):
  → For each queued item:
    → If error: reject(error)
    → If token: resolve(token)  // triggers retry
  → Clear queue
```

---

## WebSocket Service

### WebSocketService (`src/services/websocket.service.ts`)

Singleton service built on `socket.io-client` for real-time communication.

### Connection Configuration

| Setting | Value |
| ------- | ----- |
| Path | `/ws/socket.io` |
| Transports | `["websocket", "polling"]` |
| Reconnection | `true` |
| Reconnection Attempts | `5` |
| Reconnection Delay | `1000ms` (initial) |
| Reconnection Delay Max | `5000ms` |
| Connection Timeout | `20000ms` |
| Credentials | `withCredentials: true` |

### Authentication Flow

```text
1. connect() called → socket created with { auth: { token } }
2. On "connect" event → emit "authenticate" with token
3. Server responds "authenticated" → _isAuthenticated = true → flush pending ops
4. On "auth_error" → attempt reconnect with fresh token
5. If max attempts reached → disconnect
```

### Event Map

**System Events (Internal):**

| Event | Direction | Trigger |
| ----- | --------- | ------- |
| `connect` | Receive | Socket connected |
| `disconnect` | Receive | Socket disconnected |
| `connect_error` | Receive | Connection failed |
| `authenticated` | Receive | Auth confirmed by server |
| `auth_error` | Receive | Auth rejected by server |

**Application Events (Subscribed):**

| Event | Description |
| ----- | ----------- |
| `new_message` | New message received in conversation |
| `message_sent` | Confirmation that message was sent |
| `message_error` | Message send failure |
| `message_read` | Message read receipt |
| `typing_start` | User started typing |
| `typing_end` | User stopped typing |
| `user_typing` | Typing indicator for a conversation |
| `user_joined` | User joined a conversation |
| `user_left` | User left a conversation |
| `user_online` | User came online |
| `user_offline` | User went offline |
| `online_users` | List of currently online users |
| `new_notification` | Real-time notification |
| `conversation_updated` | Conversation metadata changed |
| `joined_conversation` | Confirmed join to conversation room |
| `pong` | Response to ping |

### Public API

| Method | Description |
| ------ | ----------- |
| `connect()` | Establish socket connection and authenticate |
| `disconnect()` | Manual disconnect, clears pending operations |
| `reconnect()` | Soft reconnect (100ms delay) |
| `reconnectWithFreshToken()` | Hard reconnect after token refresh (200ms delay) |
| `joinConversation(id)` | Join a conversation room |
| `leaveConversation(id)` | Leave a conversation room |
| `sendMessage(payload)` | Send a message (returns boolean) |
| `startTyping(conversationId)` | Emit typing start (throttled 1000ms) |
| `stopTyping(conversationId)` | Emit typing end, clear timeout |
| `cancelTyping(conversationId)` | Clear typing timeout without emitting |
| `markAsRead(messageId, conversationId)` | Mark message as read |
| `ping()` | Heartbeat ping |
| `getUserPresence(userId)` | Request user's online status |
| `subscribeToUser(userId)` | Subscribe to presence changes |
| `unsubscribeFromUser(userId)` | Unsubscribe from presence changes |
| `isConnected()` | Returns socket connection state |
| `isReady()` | Returns `connected && authenticated` |
| `getSocketId()` | Returns socket ID or null |
| `getConnectionStatus()` | Returns full status object |
| `on(event, callback)` | Register event listener |
| `off(event, callback?)` | Remove event listener |

### Pending Operations Queue

When the socket is not yet authenticated, operations are queued and flushed after authentication:

```text
Queued operation types: join, send, leave
Each stores: { type, data, timestamp }

Flush trigger: "authenticated" event
Flush behavior: emits each queued operation in order, then clears queue
Clear triggers: disconnect, reconnect
```

### Typing Indicator Logic

```text
startTyping(conversationId):
  → Check throttle: if last emit < 1000ms ago, skip
  → Emit "typing_start" { conversationId }
  → Set 3000ms auto-timeout → stopTyping(conversationId)
  → Store timeout reference per conversationId

stopTyping(conversationId):
  → Emit "typing_end" { conversationId }
  → Clear stored timeout
```

---

## Encryption Service

### SecureEncryptionService (`src/services/secure-encryption.service.ts`)

Singleton service for session-based message encryption.

### Session Lifecycle

```text
1. initializeSession()
   → POST /api/v1/api/encryption/session
   → Response: { sessionId, expiresAt }
   → Store sessionId + expiresAt on instance

2. Before each encrypt/decrypt:
   → ensureValidSession()
   → If no session or expiry < 5 minutes away:
     → refreshSession() or initializeSession()

3. refreshSession()
   → POST /api/v1/api/encryption/session/refresh { sessionId }
   → Updates expiresAt
   → On failure: falls back to initializeSession()

4. clearSession()
   → Nullifies sessionId + expiresAt (called on logout)
```

### Encrypt/Decrypt Flow

```text
encrypt(data):
  → ensureValidSession()
  → POST /api/v1/api/encryption/encrypt { data, sessionId }
  → Returns encrypted string

decrypt(encryptedData):
  → ensureValidSession()
  → POST /api/v1/api/encryption/decrypt { encryptedData, sessionId }
  → Returns decrypted string

decryptLegacy(encryptedData):
  → POST /api/v1/api/encryption/decrypt/legacy { encryptedData }
  → No session required (backward compatibility)
```

### Public Methods

| Method | Returns | Description |
| ------ | ------- | ----------- |
| `initializeSession()` | `Promise<void>` | Create new encryption session |
| `encrypt(data)` | `Promise<string>` | Encrypt plaintext |
| `decrypt(encryptedData)` | `Promise<string>` | Decrypt ciphertext |
| `decryptLegacy(encryptedData)` | `Promise<string>` | Decrypt without session |
| `checkSession()` | `Promise<boolean>` | Validate current session |
| `refreshSession()` | `Promise<void>` | Extend session expiry |
| `getCurrentSessionId()` | `string \| null` | Get current session ID |
| `clearSession()` | `void` | Nullify session (for logout) |

---

## Routing & Route Guards

### Route Structure (`src/routes/AppRoutes.tsx`)

**Public Routes** (accessible without auth, wrapped in `PublicOnlyRoute`):

| Path | Component | Notes |
| ---- | --------- | ----- |
| `/login` | LoginScreen | Redirects to dashboard if already logged in |
| `/verify-otp` | OTPVerificationPage | Email and password reset verification |
| `/reset-password` | ResetPasswordPage | New password form |
| `/change-password` | ChangePasswordPage | Authenticated password change |

**Conditional Route:**

| Path | Component | Condition |
| ---- | --------- | --------- |
| `/onboarding` | OnboardingFlow | Only if authenticated AND not onboarded |

**Protected Dashboard Routes** (nested under `/dashboard`):

| Path | Component |
| ---- | --------- |
| `/dashboard` | Redirects to `/dashboard/feeds` |
| `/dashboard/feeds` | FeedsView |
| `/dashboard/forums` | ForumsView |
| `/dashboard/forums/topic/:topicId` | TopicDetailPage |
| `/dashboard/nooks` | NooksView |
| `/dashboard/nooks/:nookId` | NookDetailPage |
| `/dashboard/messages` | MessagesView |
| `/dashboard/mentorship` | MentorshipView |
| `/dashboard/find-mentorship` | FindMentorshipView |
| `/dashboard/mentorship-chat` | Redirects to messages |
| `/dashboard/profile` | ProfileView |
| `/dashboard/notifications` | NotificationsView |

**Standalone Protected Pages:**

| Path | Component |
| ---- | --------- |
| `/community-guidelines` | CommunityGuidelinesPage |
| `/crisis-resources` | CrisisResourcesPage |
| `/report-harassment` | ReportHarassmentPage |
| `/export-data` | ExportDataPage |

**Root Redirect Logic (`/`):**

```text
isLoading → render empty div (wait)
isAuthenticated && hasCompletedOnboarding → /dashboard
isAuthenticated && !hasCompletedOnboarding → /onboarding
!isAuthenticated → /login
```

**Catch-all:** `*` redirects to `/`

### ProtectedRoute Guard (`src/routes/ProtectedRoute.tsx`)

```text
1. If isLoading → return null (block render)
2. If !isAuthenticated → Navigate to /login (preserves referrer in state)
3. If !hasCompletedOnboarding AND not on /onboarding → Navigate to /onboarding
4. Otherwise → render children
```

### Code Splitting

All dashboard views use `React.lazy()` with `<Suspense>` fallback:

```typescript
const FeedsView = React.lazy(() =>
  import('../components/dashboard/Feeds/FeedsView')
    .then(m => ({ default: m.FeedsView }))
);
```

The fallback renders a centered loading spinner (`PageLoader` component).

---

## State Management

### Architecture

The app uses a lightweight state architecture:

| Layer | Tool | Scope |
| ----- | ---- | ----- |
| Global auth | React Context (`AuthContext`) | User identity, tokens, auth methods |
| Feature state | `useState` / `useEffect` in each view | Data fetching, UI state per page |
| Real-time updates | WebSocket event listeners | Notifications, messages, typing, presence |
| Cross-component | React Router state + URL params | Navigation, conversation selection |

### Data Fetching Pattern

Each view follows this pattern:

```typescript
function SomeView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await SomeApiCall(filters);
        // Parse response (handle nested structures)
        const items = response?.data?.items || response?.items || [];
        setData(items);
      } catch {
        // Silent or toast error
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filters]);
}
```

### Response Parsing

The backend may return responses in varying shapes. Components handle this with fallback chains:

```typescript
// Common pattern across components:
const items = response?.success && response?.data
  ? (response.data.items || response.data)
  : (Array.isArray(response) ? response : []);
```

The `unwrap()` helper in `api/base.ts` normalizes one layer:

```typescript
export function unwrap(res: any) {
  return res.data?.data ?? res.data;
}
```

---

## API Layer

### Base Configuration (`api/base.ts`)

| Export | Description |
| ------ | ----------- |
| `API_URL` | `import.meta.env.VITE_API_URL` |
| `getAuthInstance()` | Creates Axios instance with current tokens via `AxiosInterceptor(accessToken, refreshToken)` |
| `unwrap(res)` | Extracts nested data: `res.data?.data ?? res.data` |

### API Modules

Each module imports `{ getAuthInstance, API_URL }` from `./base` and exports async functions:

| Module | Endpoint Prefix | Key Functions |
| ------ | --------------- | ------------- |
| `authApis.ts` | `/auth/*` | `loginUser`, `registerUser`, `VerifyOTP`, `ForgotPassword`, `ResetPassword`, `ChangePassword`, `RefreshToken`, `SocialMediaLogin`, `GetCurrentUser`, `CreateOnboardingProfile`, `ReactivateAccount` |
| `feedApis.ts` | `/feeds/*` | `GetAggregatedFeed`, `GetFeedItem`, `ReactToFeedItem` |
| `forumApis.ts` | `/forum/*` | `GetLocalScopeMetrics`, `GetGlobalScopeMetrics`, `GetRecentDiscussions`, `GetFoundationForums`, `GetUserJoinedForums`, `CreateForumTopic`, `GetForumTopicById`, `GetForumById`, `UserJoinForum`, `UserLeaveForum`, `ForumTopicsReactions`, `CreateForumTopicsComments`, `GetAllCommentsForATopic`, `TopicsCommentsReactions`, `DeleteTopicsComments` |
| `mentorshipApis.ts` | `/mentorship/*` | Profile CRUD, matching, request management, follow/unfollow |
| `messaging.ts` | `/messaging/*`, `/conversations/*`, `/identity-reveal/*` | `SendAMessage`, `MarkMessagesAsRead`, `GetMessageUnreadCount`, `SetTypingStatus`, `CreateConversation`, `GetConversations`, `GetSingleConversationMessages`, `DeleteConversation`, `RequestIdentityReveal`, `RespondToIdentityReveal`, `GetIdentityRevealRequests`, `GetIdentityRevealStatusForConversation`, `StartMentorshipChatFromDirectRequest`, `GetConnectableUsers`, `GetUserSuggestions` |
| `nookApis.ts` | `/nooks/*` | `CreateNook`, `GetNooks`, `GetNookMetrics`, `GetNookById`, `DeleteNooksById`, `FlagMessage`, `GetNookMessagesByNookId`, `PostNookMessageByNookId`, `DeleteNooksMessageById`, `JoinNook`, `LeaveNook`, `GetNookMembers`, `addNookReaction`, `removeNookReaction`, `toggleMessageReaction`, `removeMessageReaction` |
| `notificationApis.ts` | `/notifications/*` | `CreateNotification`, `GetNotifications`, `MarkNotificationAsRead`, `DeleteNotification`, `GetUnreadCount` |
| `profileApis.ts` | `/profile/*` | Profile CRUD, `FollowUser`, `UnfollowUser`, `CheckFollowingStatus`, `GetUserStats`, `GetUserBadges`, account deactivation/reactivation |
| `referralsApis.ts` | `/referrals/*` | `GetReferrals`, `GetReferralById`, `ApplyToReferral`, `RespondToReferral` |
| `EncrytionApis.ts` | `/encryption/*` | Session init, encrypt, decrypt |

### Request Pattern

All API functions follow the same structure:

```typescript
export const SomeApiCall = async (params: SomeType) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/endpoint`);
  return res.data;
};
```

---

## Component Architecture

### Layout Hierarchy

```text
App.tsx
├── ErrorBoundary          # Catches render errors, shows recovery UI
├── NetworkStatus          # Shows offline/online banners
└── BrowserRouter
    └── AuthProvider       # Global auth context
        └── AppLayout      # Min-height wrapper
            └── AppRoutes  # Route definitions
                └── DashboardLayout          # Authenticated layout
                    ├── DashboardHeader      # Top nav, notifications, profile
                    ├── <Outlet />           # Lazy-loaded page content
                    ├── BottomNavigation     # Mobile tab bar (md:hidden)
                    └── MentorshipModal      # Global mentorship modal
```

### DashboardLayout (`src/layout/DashboardLayout.tsx`)

Responsibilities:
- Renders header, outlet, and mobile navigation
- Manages notification unread count (fetched on mount)
- Listens to WebSocket `new_notification` events for real-time count updates
- Provides stable callbacks via `useCallback` to prevent child re-renders

### DashboardHeader (`src/components/NavComponent/DashboardHeader.tsx`)

Desktop: Icon-only navigation buttons (Home, Forums, Nooks, Mentorship, Messages) + notification bell + profile button.
Mobile: Hamburger menu that opens a full-width dropdown with labeled nav items.

Navigation items are defined as static module-level constants to avoid re-creation on each render.

### Modal Pattern

Modals follow a consistent pattern:

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  // ... feature-specific props
}

export function SomeModal({ isOpen, onClose, ...props }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        {/* Content */}
        {/* Action buttons */}
      </div>
    </div>
  );
}
```

---

## Error Handling

### ErrorBoundary (`src/Helper/ErrorBoundary.tsx`)

Class component that catches JavaScript errors anywhere in the child component tree.

**Production UI:**
- Purple-themed full-screen layout matching the app brand
- "Something went wrong" message with reassurance ("your data is safe")
- Two action buttons: Reload Page (primary) and Go Home (secondary)
- Help text suggesting cache clear or support contact

**Development UI:**
- Same as production + expandable error details section
- Shows `error.toString()` and full stack trace
- Wrapped in `<details>` element for toggle visibility

**Detection:** Uses `import.meta.env.DEV` (Vite-compatible) instead of `process.env.NODE_ENV`.

### NetworkStatus (`src/components/NetworkStatus.tsx`)

Functional component that monitors browser connectivity:

```text
Offline: Red banner at top (z-[9999]): "You're offline. Check your internet connection."
Online (after being offline): Green banner: "Back online!" — auto-dismisses after 3 seconds.
Normal: Renders nothing.
```

Uses native `navigator.onLine` property and `online`/`offline` window events.

### Toast Notifications (`src/Helper/ShowToast.tsx`)

Centralized toast system built on `react-toastify`:

| Config | Value |
| ------ | ----- |
| Position | `top-center` |
| Auto-close | `5000ms` |
| Theme | Custom: blue background (#004aba), white text |
| Progress bar | White |

**Types and Icons:**

| Type | Color | Icon |
| ---- | ----- | ---- |
| `success` | Green (#28a745) | Checkmark circle |
| `error` | Red (#dc3545) | X circle |
| `warning` | Yellow (#ffc107) | Exclamation circle |
| `info` | Teal (#17a2b8) | Info circle |
| `default` | White/Blue | Dot circle |

**Usage:**

```typescript
showToast("Message text", "success");
showToast({ message: "Error occurred", type: "error" });
```

### Skeleton Loaders (`src/Helper/SkeletonLoader.tsx`)

Pre-built skeleton components for loading states:
- Feed skeleton (card with avatar, text lines, engagement bar)
- Forum skeleton (topic list items)
- Message skeleton (conversation list items)
- Nook skeleton (card grid items)

---

## Performance Optimizations

### Route-Based Code Splitting

All 19 dashboard views use `React.lazy()`:

```typescript
const FeedsView = React.lazy(() =>
  import('../components/dashboard/Feeds/FeedsView')
    .then(m => ({ default: m.FeedsView }))
);
```

**Result:** Initial bundle reduced from ~1,800 KB to ~233 KB entry point.

### Bundle Chunking (`vite.config.ts`)

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],  // 348 KB, cached
        ui: ['lucide-react'],                                  // 30 KB, cached
      },
    },
  },
}
```

### Component-Level Optimizations

| Optimization | Where | What |
| ------------ | ----- | ---- |
| Static arrays hoisted to module scope | `DashboardHeader.tsx`, `AuthContext.tsx` | Navigation items, username pools, avatar emojis — prevents re-creation per render |
| `useCallback` for stable references | `DashboardLayout.tsx` | `handleTabChange`, `closeMentorshipModal` — prevents child re-renders |
| Callback-form setState | `FeedsView.tsx` | `setFeedItems(prev => prev.map(...))` — avoids stale closure bugs |
| Conditional rendering for dev tools | `DashboardLayout.tsx` | `import.meta.env.DEV && <TestLLMButton />` — excluded from production bundle |

---

## Environment Configuration

### Vite Environment Variables

All frontend env vars must be prefixed with `VITE_` to be accessible via `import.meta.env`.

| Variable | Used In | Purpose |
| -------- | ------- | ------- |
| `VITE_API_URL` | `api/base.ts`, `AxiosInterceptor` | Backend API base URL |
| `VITE_API_BASE_URL` | `src/utils/env.ts` | Backend root URL |
| `VITE_WS_URL` | `websocket.service.ts` | WebSocket server URL |
| `VITE_SUPABASE_URL` | `okestraLLM.ts`, `testLLMConnection.ts` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `okestraLLM.ts`, `testLLMConnection.ts` | Supabase public key |

### ENV Helper (`src/utils/env.ts`)

```typescript
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_URL: import.meta.env.VITE_API_URL,
  WS_URL: import.meta.env.VITE_WS_URL,
  IS_DEV: import.meta.env.DEV,
};
```

### Build-Time Behavior

`VITE_` variables are replaced at build time by Vite's define plugin. They are baked into the JavaScript bundle as string literals — they are not read from the environment at runtime.

`import.meta.env.DEV` is `true` during `vite dev` and `false` in `vite build` output. Vite uses this for dead code elimination (e.g., dev-only components are tree-shaken from production bundles).

---

## Type System

### Shared Type Definitions

**`src/types/forum.ts`:**
- `Forum` — Forum metadata (id, name, description, icon, isGlobal, topicCount, memberCount, category, rules, moderators)
- `Topic` — Topic with author, reactions (seen/validated/inspired/heard), user reactions, comment count, tags
- `Comment` — Nested comment with reactions (helpful/supportive) and replies array
- `UserProfile` — User with demographics, stats, badges, mentorship profile
- `Company` — Company with member count and associated forums
- `NookFilters` — Filter options (urgency, scope, temperature, hashtag, sorting, pagination)
- `Nook` — Nook data (title, description, urgency, temperature, hashtags, member count, activity, expiry)
- `NooksResponse` — Paginated API response wrapper for nooks

**`src/types/mentorship.ts`:**
- `MentorProfileData` — Bio, expertise, industries, availability, style, languages, hourly rate
- `MenteeProfileData` — Bio, goals, interests, industries, availability, urgency, topic, style
- `MentorshipStatusData` — Role (mentor/mentee/both), communication method, active flag
- `MentorshipStatsData` — Reputation, sessions, posts, comments, helpful votes, followers
- `MentorshipUserProfile` — Combined profile with match score, experience, availability

### Component-Local Interfaces

Most components define their own interfaces for props and local state (e.g., `UserProfileData`, `UserStats`, `Badge` in `UserProfileModal.tsx`). These are not shared because response shapes vary between endpoints.

---

## Testing Infrastructure

### Stack

| Tool | Purpose |
| ---- | ------- |
| Vitest 4.0 | Test runner (Vite-native, uses same config) |
| @testing-library/react | Component rendering and queries |
| @testing-library/jest-dom | DOM assertion matchers |
| @testing-library/user-event | User interaction simulation |
| jsdom | Browser DOM environment |

### Configuration

**`vite.config.ts`:**

```typescript
test: {
  globals: true,           // describe, it, expect available without imports
  environment: 'jsdom',    // Browser-like DOM
  setupFiles: './src/test/setup.ts',
  css: false,              // Skip CSS processing in tests
}
```

**`tsconfig.app.json`:**

```json
"types": ["vitest/globals"]
```

**`src/test/setup.ts`:**

```typescript
import '@testing-library/jest-dom';  // Adds toBeInTheDocument(), etc.
```

### Test Files

| File | Type | Tests | Coverage |
| ---- | ---- | ----- | -------- |
| `src/utils/cookies.test.ts` | Unit | 8 | CookieUtil: set, get, remove, has, encoding, overwrite, multi-cookie |
| `src/utils/tokenUtils.test.ts` | Unit | 9 | TokenUtils: cookie/localStorage fallback, set/clear, hasTokens |
| `src/components/Modals/UserProfileModal.test.tsx` | Component | 10 | Render states, API data, user interactions, error handling |

### Mocking Patterns

**Module mocking (API layer):**

```typescript
vi.mock('../../../api/profileApis', () => ({
  GetUserProfileById: vi.fn(),
  GetUserStats: vi.fn(),
  // ...
}));
```

**Hook mocking (Auth context):**

```typescript
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
  })),
}));
```

**Async component testing:**

```typescript
render(<Component {...props} />);
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Running Tests

```bash
npm test        # Watch mode
npm run test:run  # Single run (CI)
```
