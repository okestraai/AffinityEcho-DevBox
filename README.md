
Project Overview
AffinityEcho is an anonymous-first professional networking platform for underrepresented communities in tech. It combines forums, mentorship, job referrals, and secure messaging with a unique progressive identity reveal system where all interactions start anonymous and users control when to reveal their real identity.

Tech Stack
Frontend:

React 18.3.1 + TypeScript 5.5.3
Vite 5.4.2 (build tool)
React Router 7.9.5
Tailwind CSS 3.4.1
Lucide React (icons)
Backend Integration:

Supabase (PostgreSQL, Auth, Real-time subscriptions)
Socket.IO (WebSocket messaging)
Axios (HTTP client with interceptors)
vLLM service (Llama 3.1 8B for AI insights)
Core Features
1. Forums (TopicDetailPage.tsx)
Anonymous discussions with 4 reaction types (seen, validated, inspired, heard)
Nested comment threads
Real-time updates via Supabase subscriptions
Global and affinity-scoped topics
2. Okestra AI (OkestraPanel.tsx)
NEW FEATURE - AI-powered thread analysis providing:

TL;DR summaries
Key themes identification
Consensus/disagreement detection
Personalized action items
Safety flags (PII, self-harm, harassment detection)
User-aware context (different insights for topic authors vs. community members)
3. Mentorship (MentorshipView.tsx)
Mentor/mentee profile creation with expertise, industries, availability
AI-powered matching and compatibility scoring
Advanced filtering (career level, expertise, location, affinity tags)
Direct mentorship requests
Anonymous chat with identity reveal option
Follow system
4. Messaging (MessagesView.tsx)
Anonymous messaging with encrypted content
Progressive identity reveal (mutual consent required)
Real-time delivery via WebSocket
Typing indicators
Read receipts
5. Referral Marketplace
Two-track system: job seeker requests + employee offers
Connection requests with identity reveal
Status tracking
6. Nooks (NooksView.tsx)
Specialized interest groups (company, identity, role, or interest-based)
Private membership with join requests
7. Notifications
Real-time dropdown with unread count
Color-coded by type (forum, mentorship, referral, messages)
Action buttons (accept/decline)
Architecture Highlights
State Management
AuthContext (src/contexts/AuthContext.tsx) - Global authentication state
Local component state for features
Supabase real-time subscriptions for notifications
API Layer (api/)
Dedicated API files per domain:

authApis.ts - Authentication
forumApis.ts - Forums
mentorshipApis.ts - Mentorship
messaging.ts - Messages & identity reveal
nookApis.ts - Nooks
referralsApis.ts - Referrals
Real-time Services
WebSocket (websocket.service.ts) - Messaging, presence, typing indicators
Supabase subscriptions - Notifications, forum updates
Key Patterns
Request/response interceptor for auth tokens
Centralized error handling with toast notifications
Error boundaries for crash prevention
Progressive enhancement with fallbacks
Recent Development (Git Status)
Active development areas:

✅ Okestra LLM integration (new AI insights panel)
✅ Mentorship chat system (dedicated chat view)
✅ WebSocket real-time messaging service
✅ Identity reveal system
✅ Message modals and UI enhancements
✅ Onboarding flow improvements
New files added:

OKESTRA_LLM_PAYLOAD_SPEC.md - LLM integration spec
OkestraPanel.tsx - AI insights panel
okestraLLM.ts - LLM analysis logic
websocket.service.ts - Real-time service
MentorshipChatView.tsx - Mentorship chat
Security & Privacy
✅ Anonymous by default - No real names exposed initially

✅ Progressive identity reveal - Mutual consent required

✅ Message encryption - Encrypted content field

✅ Supabase RLS policies - Row-level security

✅ Token-based auth - Access + refresh tokens

✅ Safety detection - LLM flags PII, threats, self-harm content

Project Structure

src/
├── components/
│   ├── auth/              # Authentication screens
│   ├── dashboard/         # Main features (Forum, Mentorship, Messages, Nooks)
│   ├── Modals/           # Feature-specific modals
│   └── onboarding/       # Onboarding flow
├── contexts/             # React Context (AuthContext)
├── lib/                  # Utilities (Supabase, LLM, notifications)
├── services/             # WebSocket service
├── routes/               # Routing configuration
└── Helper/               # Error boundaries, toast, interceptors

api/                      # Backend API calls
supabase/migrations/      # Database schema
Strengths
✅ Clear separation of concerns (API, UI, state)

✅ Privacy-first architecture baked into every feature

✅ Modern tech stack with real-time capabilities

✅ Sophisticated LLM integration with user-aware context

✅ Type-safe codebase (TypeScript throughout)

✅ Scalable API layer

Areas for Enhancement
State management could benefit from Redux/Zustand for complex app state
Some loose any types (especially in modals)
Form validation library (Zod/Yup) not yet integrated
No visible test files (Jest/Vitest setup)
Could benefit from code splitting at route level
Overall Assessment: This is a well-architected, feature-rich application with a clear mission to serve underrepresented professionals in tech. The codebase demonstrates thoughtful design patterns, modern development practices, and active ongoing development with recent AI capabilities and real-time messaging features.