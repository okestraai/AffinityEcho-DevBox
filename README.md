# Affinity Echo

An anonymous-first professional networking platform for underrepresented communities in tech. It combines forums, mentorship, safe spaces (Nooks), and encrypted messaging with a progressive identity reveal system — all interactions start anonymous, and users control when (and if) they reveal their real identity.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-06B6D4?logo=tailwindcss)
![Vitest](https://img.shields.io/badge/Vitest-4.0-6E9F18?logo=vitest)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Authentication Flow](#authentication-flow)
- [API Layer](#api-layer)
- [Real-Time Services](#real-time-services)
- [AI Integration](#ai-integration)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Security & Privacy](#security--privacy)

---

## Features

### Forums
Anonymous discussions organized by company and global scope. Topics support 4 reaction types (seen, validated, inspired, heard), nested comment threads, category filtering, and real-time updates.

### Nooks (Safe Spaces)
Specialized interest groups with urgency levels (high/medium/low), temperature indicators (hot/warm/cool), and hashtag categorization. Users can create, join, and participate in topic-focused safe spaces with real-time messaging.

### Mentorship
Mentor/mentee profile creation with expertise, industries, and availability management. Features AI-powered matching with compatibility scoring, advanced filtering (career level, expertise, affinity tags), direct mentorship requests, and a follow system.

### Encrypted Messaging
Anonymous direct messaging with end-to-end encryption. Supports progressive identity reveal (mutual consent required), real-time delivery via WebSocket, typing indicators, and read receipts. Separate views for regular chats and mentorship conversations.

### Feeds
Aggregated activity feed combining posts, topics, and nook messages. Filterable by scope (all, following, trending, company, global) with sorting options (recent, popular, most liked, most commented).

### Okestra AI Panel
AI-powered thread analysis providing TL;DR summaries, key themes identification, consensus/disagreement detection, personalized action items, and safety flags (PII, self-harm, harassment detection). Context-aware — delivers different insights for topic authors vs. community members.

### Notifications
Real-time notification system with unread count badge, dropdown preview, and full listing page. Color-coded by type (forum, mentorship, messages) with action buttons (accept/decline).

### Profile & Settings
User profile management with activity stats (posts, comments, reputation, topics, nooks), earned badges, privacy toggles (show email, location, connections), and notification preferences. Includes community guidelines, crisis resources, report harassment, and GDPR data export.

### Onboarding
Three-step guided onboarding: Demographics (career level, name) → Company (search or create) → Affinity Tags (community identities). Required before accessing the dashboard.

---

## Tech Stack

### Core

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI library |
| TypeScript | 5.5.3 | Type safety |
| Vite | 5.4.2 | Build tool with HMR |
| React Router | 7.9.5 | Client-side routing with lazy loading |

### Styling

| Technology | Version | Purpose |
|-----------|---------|---------|
| Tailwind CSS | 3.4.1 | Utility-first CSS |
| Lucide React | 0.344.0 | Icon library |

### Communication

| Technology | Version | Purpose |
|-----------|---------|---------|
| Axios | 1.13.2 | HTTP client with request/response interceptors |
| Socket.IO Client | 4.8.3 | WebSocket for real-time messaging and presence |

### Testing

| Technology | Version | Purpose |
|-----------|---------|---------|
| Vitest | 4.0.18 | Test runner (Vite-native) |
| Testing Library | 16.3.2 | React component testing |
| jsdom | 28.1.0 | Browser DOM environment for tests |

### Other

| Technology | Purpose |
|-----------|---------|
| React Toastify | Toast notifications |
| PostCSS + Autoprefixer | CSS processing |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone <repository-url>
cd AffinityEcho
npm install
```

### Development

```bash
# Create .env file with required variables (see Environment Variables section)
cp .env.example .env

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
AffinityEcho/
├── api/                          # Backend API integration layer
│   ├── base.ts                   # Shared auth instance, API_URL, unwrap helper
│   ├── authApis.ts               # Registration, login, OAuth, OTP, password reset
│   ├── feedApis.ts               # Aggregated feed endpoints
│   ├── forumApis.ts              # Forum CRUD, topics, comments, reactions
│   ├── mentorshipApis.ts         # Mentor/mentee profiles, matching, requests
│   ├── messaging.ts              # Conversations, messages, identity reveal
│   ├── nookApis.ts               # Nook CRUD, members, messages, reactions
│   ├── notificationApis.ts       # Notification CRUD, unread count
│   ├── profileApis.ts            # User profiles, follow, stats, badges
│   ├── referralsApis.ts          # Job referrals
│   └── EncrytionApis.ts          # Encryption session management
│
├── public/                       # Static assets
│   └── affinity-echo-logo-hd.png
│
├── src/
│   ├── components/
│   │   ├── auth/                 # Login, OTP, Reset/Change password screens
│   │   ├── dashboard/
│   │   │   ├── Feeds/            # FeedsView
│   │   │   ├── Forum/            # ForumsView, TopicDetailPage, ForumDetailView
│   │   │   ├── Mentorship/       # MentorshipView, FindMentorshipView
│   │   │   ├── Message/          # MessagesView, MentorshipRequestsView
│   │   │   ├── Nooks/            # NooksView, NookDetailPage, NookMessage
│   │   │   ├── Notification/     # NotificationsView
│   │   │   ├── Profile/          # ProfileView, CommunityGuidelines, CrisisResources
│   │   │   └── OkestraPanel.tsx  # AI analysis panel
│   │   ├── Modals/
│   │   │   ├── ForumModals/      # CreateTopic, Comments, TopicDetail
│   │   │   ├── MentorShipModals/ # MentorshipProfile, Requests, UserProfile
│   │   │   ├── MessageModals/    # NewChatModal
│   │   │   ├── UserProfileModal.tsx
│   │   │   └── ViewersModal.tsx
│   │   ├── NavComponent/         # DashboardHeader, BottomNavigation, NotificationsDropdown
│   │   └── onboarding/           # OnboardingFlow (Demographics, Company, Affinity steps)
│   │
│   ├── contexts/                 # AuthContext (global auth state)
│   ├── hooks/                    # useAuth custom hook
│   ├── layout/                   # AppLayout, DashboardLayout
│   ├── routes/                   # AppRoutes, ProtectedRoute, PublicOnlyRoute
│   ├── services/
│   │   ├── websocket.service.ts  # Socket.IO singleton (messaging, presence, typing)
│   │   └── secure-encryption.service.ts  # Session-based encryption
│   ├── lib/                      # okestraLLM, testLLMConnection
│   ├── Helper/                   # AxiosInterceptor, ErrorBoundary, ShowToast, SkeletonLoader
│   ├── utils/                    # tokenUtils, cookies, CompanyFormatter, forumUtils
│   ├── types/                    # forum.ts, mentorship.ts (shared TypeScript interfaces)
│   ├── data/                     # Mock data
│   ├── test/                     # Test setup (setup.ts)
│   ├── App.tsx                   # Root component (ErrorBoundary → Router → AuthProvider)
│   └── main.tsx                  # Entry point
│
├── vite.config.ts                # Build config, code splitting, test environment
├── tailwind.config.js            # Tailwind theme configuration
├── tsconfig.app.json             # TypeScript compiler options
├── package.json
└── DEPLOYMENT.md                 # Deployment guide (AWS, Azure, Vercel, Netlify, Docker)
```

---

## Architecture

### Component Hierarchy

```
App
├── ErrorBoundary
├── BrowserRouter
│   └── AuthProvider (context)
│       └── AppLayout
│           └── AppRoutes
│               ├── PublicOnlyRoute → LoginScreen, OTPVerification, ResetPassword
│               ├── OnboardingFlow (if !has_completed_onboarding)
│               └── ProtectedRoute → DashboardLayout
│                   ├── DashboardHeader
│                   ├── <Outlet /> (lazy-loaded views)
│                   │   ├── FeedsView
│                   │   ├── ForumsView / TopicDetailPage
│                   │   ├── NooksView / NookDetailPage
│                   │   ├── MentorshipView / FindMentorshipView
│                   │   ├── MessagesView / MentorshipRequestsView
│                   │   ├── ProfileView
│                   │   └── NotificationsView
│                   └── BottomNavigation (mobile)
```

### Route-Based Code Splitting

All dashboard views are lazy-loaded with `React.lazy()` and wrapped in `<Suspense>`. This reduces the initial bundle from ~1,800 KB to ~233 KB entry + cached vendor chunks.

### State Management

- **AuthContext** — global authentication state, user data, login/logout/signup methods
- **Component-level state** — each view manages its own data fetching and UI state
- **WebSocket events** — real-time updates pushed to components via event listeners

### Data Flow

```
Component → API function (api/*.ts) → Axios + Auth Interceptor → Backend
                                                                    ↓
Component ← setState ← Response parsing ← Axios interceptor ← Response
```

---

## Authentication Flow

```
New User:
  /login → signup(email, password) → /verify-otp → verifyOTP → /onboarding → /dashboard

Returning User:
  /login → login(email, password) → /dashboard

Social Login:
  /login → socialLogin("google"|"facebook") → OAuth redirect → /onboarding or /dashboard

Password Reset:
  /login → forgotPassword(email) → /verify-otp → /reset-password → /login

Token Refresh:
  401 response → interceptor queues request → RefreshToken() → retry original request
```

**Token Storage:**
- Access token: Cookie (7-day expiry) + localStorage fallback
- Refresh token: Cookie (30-day expiry) + localStorage fallback
- Automatic refresh on 401 via Axios interceptor

**Anonymous Identity:**
- Auto-generated username (e.g., "BraveEagle4523")
- Auto-generated emoji avatar
- Real identity only revealed through mutual consent

---

## API Layer

All API files live in `api/` and import the shared auth instance from `api/base.ts`.

| File | Endpoints | Purpose |
|------|-----------|---------|
| `base.ts` | — | `getAuthInstance()`, `API_URL`, `unwrap()` helper |
| `authApis.ts` | 10 | Signup, login, OAuth, OTP, password reset, token refresh, onboarding |
| `feedApis.ts` | 3 | Feed listing with filters, sorting, pagination |
| `forumApis.ts` | 12 | Forums, topics, comments, reactions, join/leave |
| `mentorshipApis.ts` | 10+ | Profiles, matching, requests, follow, search |
| `messaging.ts` | 14 | Conversations, messages, typing, identity reveal, user discovery |
| `nookApis.ts` | 14 | Nook CRUD, messages, members, reactions (nook-level and message-level) |
| `notificationApis.ts` | 5 | Create, list, mark read, delete, unread count |
| `profileApis.ts` | 10+ | Profile CRUD, follow, stats, badges, account deactivation |
| `referralsApis.ts` | 5 | Referral listing, details, apply, respond |
| `EncrytionApis.ts` | 3 | Encryption session init, encrypt, decrypt |

---

## Real-Time Services

### WebSocket Service (`src/services/websocket.service.ts`)

Singleton `WebSocketService` built on Socket.IO:

- **Connection management** — auto-connect, disconnect, reconnect with exponential backoff (max 5 attempts)
- **Authentication** — token-based auth on connect, auto-refresh on reconnection
- **Events emitted**: `message_received`, `typing_started`, `typing_ended`, `user_online`, `user_offline`, `new_notification`
- **Typing indicators** — debounced with automatic timeout
- **Transport** — WebSocket primary, polling fallback

### Encryption Service (`src/services/secure-encryption.service.ts`)

Singleton `SecureEncryptionService` for message encryption:

- Session-based initialization with expiry tracking
- `encrypt(data)` / `decrypt(encryptedData)` methods
- Automatic session validation before operations

---

## AI Integration

The **Okestra AI Panel** (`src/components/dashboard/OkestraPanel.tsx`) provides thread-level analysis powered by an LLM backend:

- **TL;DR summaries** of discussion threads
- **Key themes** extraction
- **Consensus/disagreement** detection across participants
- **Personalized action items** based on user role (author vs. participant)
- **Safety flags** — detects PII exposure, self-harm language, harassment
- **Context-aware** — adapts output based on who's viewing

Logic lives in `src/lib/okestraLLM.ts`.

---

## Testing

The project uses **Vitest** with **React Testing Library** and **jsdom**.

### Running Tests

```bash
# Watch mode (re-runs on file save)
npm test

# Single run (CI-friendly)
npm run test:run
```

### Test Files

| File | Type | Tests | What it covers |
|------|------|-------|---------------|
| `src/utils/cookies.test.ts` | Unit | 8 | CookieUtil: set, get, remove, has, encoding, multi-cookie |
| `src/utils/tokenUtils.test.ts` | Unit | 9 | TokenUtils: cookie/localStorage fallback, set/clear tokens |
| `src/components/Modals/UserProfileModal.test.tsx` | Component | 10 | Render states, API data display, user interactions, error handling |

### Writing New Tests

Create `*.test.ts` or `*.test.tsx` files next to the source file. Vitest globals (`describe`, `it`, `expect`) are available without imports.

```tsx
// Example: src/utils/myUtil.test.ts
describe('myUtil', () => {
  it('does something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

For component tests, mock API modules and `useAuth`:

```tsx
vi.mock('../../../api/profileApis', () => ({
  GetUserProfileById: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user' } })),
}));
```

---

## Environment Variables

Create a `.env` file in the project root. All variables must be prefixed with `VITE_` to be accessible in the frontend.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL (e.g., `https://api.example.com/api`) |
| `VITE_API_BASE_URL` | Yes | Backend root URL (e.g., `https://api.example.com`) |
| `VITE_WS_URL` | Yes | WebSocket server URL (e.g., `wss://api.example.com`) |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |

> **Note:** `VITE_` variables are embedded at build time into the JS bundle. They are not read at runtime.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI) |

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guides covering:

- **AWS** — S3 + CloudFront with GitHub Actions CI/CD
- **Azure** — Static Web Apps
- **Vercel** — Zero-config deployment
- **Netlify** — With SPA redirect rules
- **Docker** — Nginx container deployable to any cloud

**Quick deploy:**

```bash
npm run build
# Upload dist/ to any static hosting
```

All routes must fall back to `index.html` for client-side routing to work.

---

## Security & Privacy

| Feature | Implementation |
|---------|---------------|
| **Anonymous by default** | Auto-generated usernames and emoji avatars — no real names exposed |
| **Progressive identity reveal** | Mutual consent required — both users must agree to reveal |
| **Message encryption** | Session-based encryption service with encrypted content field |
| **Token-based auth** | Access + refresh tokens in secure cookies with automatic refresh |
| **Error boundaries** | React ErrorBoundary prevents full-app crashes |
| **Safety detection** | AI flags PII exposure, self-harm language, and harassment |
| **GDPR compliance** | Data export functionality for user data portability |

---

## License

This project is proprietary. All rights reserved.
