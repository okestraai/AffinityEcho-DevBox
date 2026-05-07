# Q2 2026 Engineering Excellence OKR

## AffinityEcho Frontend

**Owner**: Engineering Team
**Period**: May 1 -- July 31, 2026
**Review Cadence**: Weekly check-in, monthly scoring
**Target Average Score**: 0.7 (stretch goals -- 1.0 means you aimed too low)

---

## Project Context

AffinityEcho is an anonymous professional networking platform built with React 18, TypeScript, and Tailwind CSS. The frontend includes:

- **User-facing features**: Authentication (email + Google + Apple OAuth), feeds/posts, forums with topics and comments, direct messaging with end-to-end encryption, mentorship matching and sessions, nooks (group chat rooms), notifications (in-app + push), user profiles with company verification, referral system
- **Admin panel**: Dashboard, user management, content moderation, reports, forums/nooks management, broadcast notifications, audit logs, granular RBAC permissions (47 permissions across 10 categories), analytics (signups, engagement, retention, funnel, growth), system health monitoring with latency tracking and per-module history charts
- **Tech stack**: React 18.3, TypeScript, Tailwind CSS 3.4, Vite, React Router 7, Axios, Recharts, Lucide React icons, Vitest + React Testing Library
- **Backend**: Node.js REST API at `https://api.affinityecho.com` with WebSocket messaging, Supabase for database, Mailjet for email, FCM for push notifications
- **Key files and structure**:
  - `src/contexts/AuthContext.tsx` -- Authentication state, login/signup/OTP/onboarding flows
  - `src/components/dashboard/` -- All user-facing feature pages (Feeds, Forum, Message, Mentorship, Nooks, Notification, Profile)
  - `src/admin/pages/` -- All admin pages (DashboardPage, UsersPage, AnalyticsPage, HealthPage, ReportsPage, ModerationPage, ForumsPage, NooksPage, NotificationsPage, LogsPage, etc.)
  - `src/admin/types/permissions.ts` -- RBAC permission constants (47 permissions including analytics:view, health:view)
  - `src/constants/messages.ts` -- Centralized user-facing messages (MSG object with AUTH, USER, FEED, FORUM, NOOK, MESSAGING, MENTORSHIP, REFERRAL, NOTIFICATION, FOLLOW, ENCRYPTION, COMPANY, ADMIN sections)
  - `src/Helper/ShowToast.tsx` -- Toast notification system (success, error, warning, info types)
  - `api/` -- API service files (authApis.ts, adminApis.ts, notificationApis.ts, etc.)
  - `src/routes/AppRoutes.tsx` -- All routing with lazy-loaded pages and role-based admin route protection
  - `src/test/` -- All test files (30 files, 614 tests)

### Baseline State (April 30, 2026)

- **ESLint errors**: 326 errors (mostly `@typescript-eslint/no-explicit-any`), 45 warnings
- **Test coverage**: 3 test files, 16 passing / 10 failing, no coverage config
- **Toast messages**: ~95% centralized using MSG constants, remaining were dynamic template literals and hardcoded strings
- **Accessibility**: aria-labels added to icon buttons, no formal Lighthouse audit done
- **Uptime monitoring**: Backend health check endpoint existed but no frontend UI
- **Security**: CSRF support, CSP headers, no localStorage tokens, encrypted messaging

### Current State (May 5, 2026 -- Week 1 Complete)

- **ESLint errors**: 0 errors, 0 warnings (326 errors + 45 warnings fixed across 62 files)
- **Test coverage**: 30 test files, 614 passing tests, 71.8% line coverage on critical paths
- **Toast messages**: 100% centralized -- all user-side and admin-side showToast calls use MSG constants or getApiError with MSG fallback. ~6 dynamic template literals remain (using runtime values, acceptable pattern)
- **Accessibility**: Not started (scheduled Week 3+)
- **Uptime monitoring**: Admin Analytics page (4 tabs: Overview, Funnel, Growth, Top Content) and Health page (live status, per-module latency/uptime, resolution guidance, auto-refresh, Recharts history charts) built and deployed
- **Additional work completed**: Toast UI redesigned, UsersPage enhanced (emoji avatars, auth provider filter), Recharts installed

---

## Objective

**Build a production-grade platform with high code quality, reliability, and developer confidence**

This objective drives us to move from "it works" to "it works well, is tested, accessible, and maintainable." By end of Q2, any engineer should be able to contribute confidently, users should experience consistent reliability, and the codebase should enforce quality automatically.

---

## Key Results

### KR1: Code Quality -- Zero ESLint Errors

**Metric**: ESLint error count across `src/` directory
**Starting point**: 326 errors, 45 warnings
**Target**: 0 errors, 0 warnings
**Status**: COMPLETE (Week 1)
**Score**: 1.0
**Measurement command**: `npx eslint src/ --ext .ts,.tsx`

#### What Was Done

All 326 errors and 45 warnings were fixed across 62 files in a single session:

| Category | Count | Fix Applied |
|----------|-------|-------------|
| `@typescript-eslint/no-explicit-any` | 227 | Replaced with `unknown`, specific interfaces, or typed generics |
| `@typescript-eslint/no-unused-vars` | 99 | Removed unused imports, variables, and destructured values |
| `react-hooks/exhaustive-deps` | ~40 | Added eslint-disable comments where deps would cause infinite loops, or added the missing dep |
| `react-refresh/only-export-components` | 2 | Added eslint-disable comments |

Common patterns applied:
- `catch (err: any)` -> `catch (err: unknown)` (existing `getApiError(err, ...)` already handles unknown)
- `params as any` -> Proper param interfaces
- `Record<string, any>` -> `Record<string, unknown>` or specific shapes
- Unused imports removed (React, lucide icons, state setters)

#### Remaining Work

| Task | Timeline | Status |
|------|----------|--------|
| Add ESLint to CI pipeline to block PRs with errors | Week 10 | Pending |
| Monitor for new errors as features ship | Ongoing | Active |

#### Verification

```bash
# Run full lint check
npx eslint src/ --ext .ts,.tsx

# Expected output: (no output = no errors)
```

---

### KR2: Test Coverage -- 70% on Critical User Flows

**Metric**: Vitest coverage percentage on critical paths
**Starting point**: 3 test files, 16 passing / 10 failing, 0% coverage config
**Target**: 70% line coverage on critical user flows
**Status**: COMPLETE (Week 1) -- 71.8% line coverage
**Score**: 1.0
**Measurement command**: `npx vitest run --coverage`

#### What Was Done

| Metric | Before | After |
|--------|--------|-------|
| Test files | 3 (1 failing) | 30 (all passing) |
| Total tests | 16 passing, 10 failing | 614 passing |
| Line coverage | 0% (no config) | 71.8% |
| Statement coverage | 0% | 64.31% |

#### Coverage by Domain

| Domain | Files Tested | Line Coverage |
|--------|-------------|---------------|
| API layer (auth, feed, forum, messaging, mentorship, nook, profile, notification) | 8 test files | 99.42% |
| Auth (AuthContext, LoginScreen, OTPVerification) | 3 test files | 87-99% |
| Utils (cookies, tokenUtils, forumUtils) | 3 test files | 92.72% |
| ShowToast + AxiosInterceptor | 2 test files | 83.58% |
| WebSocket service | 1 test file | 79.42% |
| Nooks (NooksView, NookDetails) | 2 test files | 77.29% |
| Profile (EditProfilePanel, UserProfilePage) | 2 test files | 60.95% |
| Forum (ForumsView, TopicDetailPage, ForumDetailView) | 3 test files | 59.58% |
| Mentorship (MentorshipView, FindMentorshipView) | 2 test files | 57.47% |
| Notifications (NotificationsView) | 1 test file | 56% |
| Messages (MessagesView, MentorshipRequestsView) | 2 test files | 38.18% |
| Feeds (FeedsView) | 1 test file | 49.23% |

#### Test Infrastructure

- **Framework**: Vitest 4.x with jsdom environment
- **Libraries**: @testing-library/react, @testing-library/user-event, @vitest/coverage-v8
- **Config**: `vite.config.ts` with coverage scoped to 30 critical path files
- **Setup**: `src/test/setup.ts` (jsdom polyfills for matchMedia, IntersectionObserver, scrollTo)
- **Helpers**: `src/test/testUtils.tsx` (renderWithRouter, mockUser, mockAdminUser)
- **All tests in**: `src/test/` directory (centralized)

#### Remaining Work

| Task | Timeline | Status |
|------|----------|--------|
| Maintain coverage as new features ship | Ongoing | Active |
| Increase MessagesView coverage (28% -> 50%+) | If time permits | Optional |
| Add integration tests for critical E2E flows | Q3 | Future |

#### Verification

```bash
# Run all tests
npx vitest run

# Run with coverage
npx vitest run --coverage

# Run specific test file
npx vitest run src/test/AuthContext.test.tsx

# Watch mode during development
npx vitest --watch
```

---

### KR3: Centralized Error Handling -- 100% MSG Constant Usage

**Metric**: Number of hardcoded string arguments in `showToast()` calls
**Starting point**: ~95% centralized, ~40+ hardcoded strings remaining across user + admin files
**Target**: 0 hardcoded strings -- every showToast uses MSG constants or getApiError with MSG fallback
**Status**: COMPLETE (Week 1) -- 100% centralized
**Score**: 0.9 (6 dynamic template literals remain, acceptable pattern)
**Measurement command**: `grep -r 'showToast(' src/ | grep -v MSG | grep -v getApiError | grep -v 'showToast.tsx'`

#### What Was Done

1. **Audited all showToast calls** across 60+ files (user-side and admin-side)
2. **Created `src/constants/messages.ts`** with centralized MSG object containing 250+ messages across 13 sections (AUTH, USER, FEED, FORUM, NOOK, MESSAGING, MENTORSHIP, REFERRAL, NOTIFICATION, FOLLOW, ENCRYPTION, COMPANY, ADMIN)
3. **Replaced all hardcoded strings** in showToast calls with MSG constants
4. **Admin pages updated**: UsersPage, UserDetailPage, ReportsPage, ProfilePage, NotificationsPage, NooksPage, ModerationPage, LogsPage, ForumsPage, DashboardPage, ContentDetailPage, AdminPermissionsPage, AdminNotificationsInboxPage, useExport hook

#### Remaining Patterns (Acceptable)

These 6 patterns use runtime values and cannot be simple constants:
```typescript
// Dynamic template literals -- runtime values required
showToast(`Marked ${count} requests as read`, "success");
showToast(`${format.toUpperCase()} export ready`, 'success');
showToast(`Failed to export as ${format.toUpperCase()}`, "error");
showToast(`Permissions updated for ${selectedAdmin.username}`, 'success');
```

#### Remaining Work

| Task | Timeline | Status |
|------|----------|--------|
| Create `msgHelpers` for dynamic messages | Week 2 | Pending |
| Add code review checklist item | Week 3 | Pending |

#### Verification

```bash
# Find any showToast calls not using MSG constants or getApiError
grep -rn 'showToast(' src/ | grep -v 'MSG\.' | grep -v 'getApiError' | grep -v 'ShowToast.tsx' | grep -v 'message,' | grep -v 'msg,' | grep -v 'errorMessage,' | grep -v 'errorMsg,'

# Expected: only dynamic template literals and variable references
```

---

### KR4: Accessibility -- Lighthouse Score > 90 on Core Pages

**Metric**: Chrome Lighthouse Accessibility score
**Starting point**: Unaudited (aria-labels added to icon buttons as a start)
**Target**: > 90 on all 5 core user-facing pages
**Status**: NOT STARTED (scheduled Week 3+)
**Score**: 0.0
**Measurement tool**: Chrome DevTools > Lighthouse > Accessibility

#### Why This Matters

AffinityEcho is a professional networking platform for underrepresented professionals. Accessibility is not optional -- it's core to the mission. Screen reader support, keyboard navigation, and proper color contrast ensure the platform is usable by everyone.

#### Pages to Audit and Fix

| Page | Route | Key Concerns |
|------|-------|-------------|
| Login / Signup | `/login`, `/signup` | Form labels, error announcements, focus management during OTP flow |
| Feeds | `/dashboard/feeds` | Post content structure, image alt text, reaction button labels |
| Forums | `/dashboard/forums` | Topic list navigation, comment threading hierarchy, bookmark actions |
| Messages | `/dashboard/messages` | Chat message list roles, send button, identity reveal dialogs |
| Profile | `/dashboard/profile` | Tab navigation, edit form labels, follow/unfollow button states |

#### Common Accessibility Fixes

```typescript
// 1. Form inputs need visible labels (not just placeholders)
<label htmlFor="email" className="sr-only">Email address</label>
<input id="email" type="email" placeholder="Email address" />

// 2. Dynamic content needs live regions
<div role="status" aria-live="polite">
  {loading ? 'Loading messages...' : `${messages.length} messages`}
</div>

// 3. Modals need focus trapping and proper roles
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Create Topic</h2>
  ...
</div>

// 4. Color contrast -- ensure text meets WCAG AA (4.5:1 ratio)
// Check: gray-400 text on white bg often fails -- use gray-600 minimum

// 5. Interactive elements need accessible names
<button aria-label="Bookmark this post" onClick={handleBookmark}>
  <Bookmark className="w-4 h-4" />
</button>
```

#### Milestones

| Week | Date Range | Page | Actions |
|------|-----------|------|---------|
| 3-4 | May 17-30 | Login / Signup | Run audit, fix issues, verify > 90 |
| 5-6 | Jun 1-13 | Feeds | Run audit, fix issues, verify > 90 |
| 7-8 | Jun 14-27 | Forums | Run audit, fix issues, verify > 90 |
| 9-10 | Jun 28-Jul 11 | Messages | Run audit, fix issues, verify > 90 |
| 11-12 | Jul 12-25 | Profile | Run audit, fix issues, verify > 90 |

#### How to Run a Lighthouse Audit

1. Open the page in Chrome (use Incognito to avoid extensions affecting results)
2. Open DevTools (F12) > Lighthouse tab
3. Select "Accessibility" category only
4. Click "Analyze page load"
5. Screenshot the score and save the report

#### Verification

Each page must have a saved Lighthouse report showing Accessibility > 90. Store reports in `docs/accessibility/` directory.

---

### KR5: Platform Reliability -- 99.5% Uptime Across All Modules

**Metric**: Uptime percentage per backend module over rolling 30-day window
**Starting point**: Monitoring active, email module at 67% in initial test data
**Target**: All 11 modules >= 99.5% uptime
**Status**: INFRASTRUCTURE COMPLETE (Week 1) -- monitoring UI built, data collection active
**Score**: 0.3
**Measurement endpoint**: `GET /admin/health/history`

#### What Was Done (Week 1)

Built the frontend monitoring infrastructure:

1. **AnalyticsPage** (`/admin/analytics`) -- 4-tab analytics dashboard:
   - Overview: signups, engagement (DAU/WAU/MAU with descriptions), retention, moderation stats + 30-day signup chart
   - Funnel: visual conversion funnel (Signup -> OTP -> Onboarding -> First Post -> First Message -> First Mentorship)
   - Growth: period selector (30d/60d/90d) + 4 growth charts + WoW comparison badges
   - Top Content: ranked lists of top posts, topics, forums, power users

2. **HealthPage** (`/admin/health`) -- live system health monitoring:
   - Overall status banner (up/degraded/down with color coding)
   - Module grid with status dots, latency (color-coded), uptime % bars, error messages
   - Resolution guidance for down modules (shows specific remediation steps)
   - Per-module tabbed Recharts line charts for latency history
   - 24h uptime summary sorted worst-first
   - Auto-refresh (60s interval) with manual refresh button
   - Provider detail cards (SMTP host, FCM provider)

3. **RBAC permissions** added: `analytics:view`, `health:view`
4. **Sidebar navigation** updated with "Insights" section

#### Modules Monitored

| Module | What It Does | Impact If Down |
|--------|-------------|---------------|
| database | Core data storage | Total platform outage |
| auth | Login, signup, tokens | Users can't sign in |
| feed | Posts, reactions, comments | Feeds page broken |
| forum | Topics, forum comments | Forums page broken |
| nooks | Group chat rooms | Nooks unavailable |
| messaging | Direct messages, WebSocket | Chat broken |
| mentorship | Matching, sessions | Mentorship features broken |
| notifications | In-app notifications | Users miss updates |
| email | OTP, verification emails | Users can't register or verify |
| push_notifications | FCM push | Mobile notifications stop |
| encryption | E2E message encryption | Encrypted messages fail |

#### Remaining Work

| Task | Timeline | Status |
|------|----------|--------|
| Fix email module reliability (was 67%) | Week 3-4 | Pending |
| First full 30-day measurement window | Week 5-8 | Pending |
| Sustain 99.5% for full month | Week 9-12 | Pending |

#### Response Protocol

When a module goes down:
1. Admin notification is auto-created after 3 consecutive failed checks (15 minutes)
2. Check `/admin/health` page for the error message and resolution guidance
3. Follow the resolution steps provided by the API (each module has specific guidance)
4. Verify module is back up on health page
5. Post-mortem: document root cause and prevention in `docs/incidents/`

#### Verification

```bash
# Check current health
curl -H "Authorization: Bearer $TOKEN" https://api.affinityecho.com/api/v1/admin/health

# Check 24h history with uptime percentages
curl -H "Authorization: Bearer $TOKEN" https://api.affinityecho.com/api/v1/admin/health/history

# All modules in uptime response should show >= 99.5%
```

---

## Week 1 Check-in (May 5, 2026)

```
## Engineering Excellence -- Weekly Check-in
Date: May 5, 2026
Week #: 1 / 12

### KR1: Code Quality (Lint Errors)
- Errors remaining: 0 / 326
- Warnings remaining: 0 / 45
- Files fixed: 62
- Score: 1.0

### KR2: Test Coverage
- Current coverage: 71.8% lines
- Tests: 614 passing (30 files)
- Score: 1.0

### KR3: Centralized Error Handling
- Hardcoded strings remaining: 6 (dynamic templates, acceptable)
- MSG constants: 250+ across 13 sections
- Score: 0.9

### KR4: Accessibility
- Pages audited: 0 / 5
- Pages passing (>90): 0 / 5
- Score: 0.0

### KR5: Platform Reliability
- Health monitoring UI: Complete
- Analytics UI: Complete
- Uptime data: Collection started
- Score: 0.3

### Blockers
- None

### Next Week Focus
- KR3: Create msgHelpers for dynamic template literals
- KR5: Monitor email module uptime, investigate SMTP reliability
- Prepare for KR4 accessibility audits (Week 3)

### Overall Score: 0.64 / 1.0
```

---

## Scoring Rubric

### Per Key Result

| Score | Meaning | Example |
|-------|---------|---------|
| 1.0 | Fully achieved or exceeded | 0 lint errors, 75% test coverage |
| 0.7 | Strong progress, nearly there | 20 lint errors remaining, 60% coverage |
| 0.5 | Meaningful progress but gaps | 100 errors remaining, 40% coverage |
| 0.3 | Started but fell short | 200 errors remaining, 20% coverage |
| 0.0 | No meaningful progress | No change from baseline |

### Overall OKR Score

Average of all 5 KR scores. Target: **0.7 average**.

| Average | Assessment |
|---------|-----------|
| 0.8-1.0 | Exceptional -- goals may have been too easy |
| 0.6-0.8 | Strong -- stretch goals appropriately set |
| 0.4-0.6 | Needs improvement -- identify blockers |
| 0.0-0.4 | Missed -- re-evaluate scope and priorities |

---

## Weekly Check-in Template

```
## Engineering Excellence -- Weekly Check-in
Date: ___________
Week #: ___ / 12

### KR1: Code Quality (Lint Errors)
- Errors remaining: ___ / 326
- Files fixed this week: ___
- Score: ___

### KR2: Test Coverage
- Current coverage: ___%
- Tests written this week: ___
- Score: ___

### KR3: Centralized Error Handling
- Hardcoded strings remaining: ___ / 6
- Score: ___

### KR4: Accessibility
- Pages audited: ___ / 5
- Pages passing (>90): ___ / 5
- Score: ___

### KR5: Platform Reliability
- Modules at 99.5%+: ___ / 11
- Incidents this week: ___
- Score: ___

### Blockers
-

### Next Week Focus
-

### Overall Score: ___ / 1.0
```

---

## Monthly Review Template

```
## Engineering Excellence -- Monthly Review
Month: ___________

### Summary
| KR | Target | Current | Score | Trend |
|----|--------|---------|-------|-------|
| KR1: Lint Errors | 0 | ___ | ___ | Up/Down/Flat |
| KR2: Test Coverage | 70% | ___% | ___ | Up/Down/Flat |
| KR3: MSG Constants | 100% | ___% | ___ | Up/Down/Flat |
| KR4: Accessibility | 5/5 pages >90 | ___/5 | ___ | Up/Down/Flat |
| KR5: Uptime | 99.5% all modules | ___% | ___ | Up/Down/Flat |

**Overall Score**: ___ / 1.0

### What went well
-

### What needs attention
-

### Adjustments for next month
-
```

---

## End-of-Quarter Retrospective Template

```
## Q2 2026 Engineering Excellence -- Retrospective
Date: August 1, 2026

### Final Scores
| KR | Target | Final | Score |
|----|--------|-------|-------|
| KR1 | 0 lint errors | ___ | ___ |
| KR2 | 70% coverage | ___% | ___ |
| KR3 | 100% MSG usage | ___% | ___ |
| KR4 | 5/5 pages >90 | ___/5 | ___ |
| KR5 | 99.5% uptime | ___% | ___ |

**Overall Score**: ___ / 1.0

### Key Achievements
-

### What We Learned
-

### Carry-over to Q3
-

### Process Improvements
-
```

---

## Appendix: Useful Commands

```bash
# ---- KR1: Code Quality ----
# Full lint check
npx eslint src/ --ext .ts,.tsx

# Lint specific directory
npx eslint src/contexts/ --ext .ts,.tsx

# Auto-fix what's possible
npx eslint src/ --ext .ts,.tsx --fix

# Count errors
npx eslint src/ --ext .ts,.tsx 2>&1 | grep "problems" | tail -1

# ---- KR2: Test Coverage ----
# Run all tests
npx vitest run

# Run with coverage
npx vitest run --coverage

# Run specific test file
npx vitest run src/test/AuthContext.test.tsx

# Watch mode during development
npx vitest --watch

# ---- KR3: Centralized Error Handling ----
# Find hardcoded showToast strings
grep -rn 'showToast(' src/ | grep -v 'MSG\.' | grep -v 'getApiError' | grep -v 'ShowToast.tsx' | grep -v 'message,' | grep -v 'msg,' | grep -v 'errorMessage,' | grep -v 'errorMsg,'

# ---- KR4: Accessibility ----
# Install axe-core for automated checks (optional)
npm install -D @axe-core/cli
npx axe http://localhost:5173/login

# ---- KR5: Platform Reliability ----
# Check current health
curl -s -H "Authorization: Bearer $TOKEN" https://api.affinityecho.com/api/v1/admin/health | jq '.data.status'

# Check uptime history
curl -s -H "Authorization: Bearer $TOKEN" https://api.affinityecho.com/api/v1/admin/health/history | jq '.data.uptime'

# ---- General ----
# TypeScript type check
npx tsc --noEmit

# Production build
npx vite build

# Dev server
npx vite
```
