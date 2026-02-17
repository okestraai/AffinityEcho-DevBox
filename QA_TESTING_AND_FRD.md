# AffinityEcho - Functional Requirements & QA Testing Guide

> **Version**: 1.0
> **Last Updated**: February 15, 2026
> **Platform**: Web (React + TypeScript + Vite)
> **Audience**: Product Manager, QA Engineers, Stakeholders

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Authentication & Account Management](#2-authentication--account-management)
3. [Onboarding Flow](#3-onboarding-flow)
4. [Dashboard & Navigation](#4-dashboard--navigation)
5. [Feeds](#5-feeds)
6. [Forums](#6-forums)
7. [Nooks (24-Hour Anonymous Rooms)](#7-nooks-24-hour-anonymous-rooms)
8. [Messages & Real-Time Chat](#8-messages--real-time-chat)
9. [Mentorship](#9-mentorship)
10. [Notifications](#10-notifications)
11. [Profile & Settings](#11-profile--settings)
12. [Privacy & Anonymity](#12-privacy--anonymity)
13. [WebSocket & Real-Time Features](#13-websocket--real-time-features)
14. [Cross-Cutting Concerns](#14-cross-cutting-concerns)
15. [Test Case Templates](#15-test-case-templates)

---

## 1. Product Overview

**AffinityEcho** is an anonymous, privacy-first professional community platform that connects employees across companies through shared affinity groups (e.g., "Black Women in Tech", "LGBTQ+ in Finance"). Users participate in forums, mentorship programs, temporary anonymous chat rooms (Nooks), and direct messaging — all under an anonymous identity by default, with optional identity reveal in private conversations.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Anonymity First** | All users have anonymous usernames and emoji avatars by default |
| **Encryption** | Sensitive fields (company, names, career level) are encrypted client-side |
| **Safe Spaces** | Company-scoped and global-scoped spaces with moderation tools |
| **Temporary Content** | Nooks auto-delete after 24 hours |
| **Voluntary Identity Reveal** | Users can request/accept identity reveal only in 1-on-1 chats |

### User Roles

| Role | Description |
|------|-------------|
| **Anonymous User** | Default state — participates with anonymous username/avatar |
| **Mentor** | User who has set up a mentor profile and is available to mentor |
| **Mentee** | User who has set up a mentee profile and is seeking mentorship |
| **Both** | User who has both mentor and mentee profiles |

---

## 2. Authentication & Account Management

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | User can sign up with email and password | P0 |
| AUTH-02 | User can log in with email and password | P0 |
| AUTH-03 | User can log in with Google OAuth | P1 |
| AUTH-04 | User can log in with Facebook OAuth | P1 |
| AUTH-05 | User receives a 6-digit OTP via email after signup | P0 |
| AUTH-06 | User can verify their email with the OTP | P0 |
| AUTH-07 | User can resend OTP if not received | P0 |
| AUTH-08 | User can request a password reset via email | P0 |
| AUTH-09 | User can reset password with OTP + new password | P0 |
| AUTH-10 | User can change password while logged in | P1 |
| AUTH-11 | User can sign out | P0 |
| AUTH-12 | Tokens are stored securely (cookies primary, localStorage fallback) | P0 |
| AUTH-13 | Access token is refreshed automatically when expired | P0 |
| AUTH-14 | Password must meet strength requirements (8+ chars, uppercase, lowercase, number) | P0 |

### 2.2 Test Cases

#### TC-AUTH-01: Email/Password Signup
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page displayed with Sign In / Sign Up toggle |
| 2 | Toggle to "Sign Up" mode | Signup form shown with email, password, confirm password |
| 3 | Enter valid email, password (8+ chars, uppercase, lowercase, number), matching confirm | All fields validated, no errors |
| 4 | Click "Create Account" | Loading indicator shown, API call made |
| 5 | — | Redirect to `/verify-otp` with email passed in state |
| 6 | Check email inbox | OTP email received with 6-digit code |

#### TC-AUTH-02: Email/Password Login
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page displayed |
| 2 | Enter valid email and password | Fields accepted |
| 3 | Click "Sign In" | Loading indicator, API call |
| 4 | — (user has completed onboarding) | Redirect to `/dashboard/feeds` |
| 4a | — (user has NOT completed onboarding) | Redirect to `/onboarding` |

#### TC-AUTH-03: OTP Verification
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Land on `/verify-otp` with email in state | 6-digit OTP input shown |
| 2 | Enter correct 6-digit OTP | Each digit auto-focuses next field |
| 3 | All 6 digits entered | Auto-submit or manual submit triggers verification |
| 4 | — | Success toast, redirect to `/onboarding` (signup) or `/reset-password` (password reset) |

#### TC-AUTH-04: OTP Verification — Invalid OTP
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter incorrect 6-digit OTP | Error message: "Invalid OTP" or similar |
| 2 | — | User can retry with correct OTP |

#### TC-AUTH-05: Resend OTP
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On OTP page, click "Resend OTP" | New OTP sent to email, countdown timer starts |
| 2 | During countdown | "Resend OTP" button disabled |
| 3 | After countdown | Button re-enabled |

#### TC-AUTH-06: Forgot Password Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On login page, click "Forgot password?" | Email input shown |
| 2 | Enter registered email, submit | API sends OTP email |
| 3 | Redirect to OTP verification | OTP page with type=password-reset |
| 4 | Enter correct OTP | Redirect to `/reset-password` |
| 5 | Enter new password + confirm | Password strength meter shown |
| 6 | Submit | Success toast, redirect to `/login` |

#### TC-AUTH-07: Change Password (Logged In)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/change-password` | Form with current password, new password, confirm |
| 2 | Enter current password, valid new password, matching confirm | Validation passes |
| 3 | Click submit | Password changed, session refreshed |
| 4 | — | Redirect to `/dashboard/profile` |

#### TC-AUTH-08: Weak Password Rejected
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter password "abc" (too short) | Strength meter shows weak, submit disabled |
| 2 | Enter password without uppercase | Validation error shown |
| 3 | Enter password without number | Validation error shown |

#### TC-AUTH-09: Social Login (Google)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Continue with Google" | Redirect to Google OAuth consent screen |
| 2 | Authenticate with Google account | Redirect back to app with tokens |
| 3 | — | User logged in, redirect to dashboard or onboarding |

#### TC-AUTH-10: Token Refresh
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Access token expires during session | Axios interceptor detects 401 |
| 2 | — | Refresh token used to get new access token |
| 3 | — | Original request retried with new token |
| 4 | — | User session continues uninterrupted |

---

## 3. Onboarding Flow

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ONB-01 | New users must complete 3-step onboarding before accessing dashboard | P0 |
| ONB-02 | Step 1: User enters demographics (first name, last name, race, gender, career level) | P0 |
| ONB-03 | Step 2: User selects company (predefined list or custom entry) | P0 |
| ONB-04 | Step 3: User selects affinity tags/communities | P0 |
| ONB-05 | User can navigate back/forward between steps | P1 |
| ONB-06 | Progress indicator shows current step (1/3, 2/3, 3/3) | P1 |
| ONB-07 | On completion, foundation forums are auto-created for user's company | P0 |
| ONB-08 | User is redirected to dashboard after completing onboarding | P0 |
| ONB-09 | All demographic fields are optional | P1 |
| ONB-10 | Custom company names are formatted and tagged as type "other" | P1 |

### 3.2 Test Cases

#### TC-ONB-01: Full Onboarding Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | After signup+OTP, land on `/onboarding` | Step 1 displayed (Demographics) with progress 1/3 |
| 2 | Fill in first name, last name, race, gender, career level | All fields accepted (all optional) |
| 3 | Click "Next" | Step 2 displayed (Company) with progress 2/3 |
| 4 | Select company from dropdown | Company selected |
| 5 | Click "Next" | Step 3 displayed (Affinity Tags) with progress 3/3 |
| 6 | Select 2-3 affinity tags | Tags highlighted as selected |
| 7 | Click "Complete" | API call made, loading shown |
| 8 | — | Redirect to `/dashboard/feeds`, success toast |

#### TC-ONB-02: Custom Company Entry
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On Step 2, select "Other" or type a custom company name | Custom input field appears |
| 2 | Type company name (e.g., "Startup XYZ") | Company formatted, type set to "other" |
| 3 | Proceed to Step 3 and complete | Onboarding succeeds with custom company |

#### TC-ONB-03: Navigate Back Between Steps
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete Step 1, advance to Step 2 | Step 2 shown |
| 2 | Click "Back" | Step 1 shown with previously entered data preserved |
| 3 | Click "Next" again | Step 2 shown with previously entered data preserved |

#### TC-ONB-04: Skip Optional Fields
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On Step 1, leave all fields blank | No validation errors |
| 2 | Click "Next" through all steps | All steps pass |
| 3 | Complete onboarding | Onboarding succeeds with empty optional fields |

#### TC-ONB-05: Onboarding Guard
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User who hasn't completed onboarding tries to access `/dashboard` | Redirect to `/onboarding` |
| 2 | User completes onboarding | Can now access `/dashboard` |

---

## 4. Dashboard & Navigation

### 4.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NAV-01 | Dashboard has top navigation bar on all pages | P0 |
| NAV-02 | Bottom navigation bar on mobile devices | P0 |
| NAV-03 | Navigation tabs: Feeds, Forums, Nooks, Messages, Mentorship, Profile, Notifications | P0 |
| NAV-04 | Unread notification count badge on notifications icon (real-time via WebSocket) | P1 |
| NAV-05 | Active tab highlighted in navigation | P1 |
| NAV-06 | All dashboard routes are protected (require auth + onboarding) | P0 |

### 4.2 Test Cases

#### TC-NAV-01: Dashboard Navigation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in and land on dashboard | Top nav visible with all tabs |
| 2 | Click each tab | Correct page loads for each tab |
| 3 | Check active tab indicator | Current tab visually highlighted |

#### TC-NAV-02: Notification Badge
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User has unread notifications | Badge count shown on notification icon |
| 2 | New notification arrives via WebSocket | Badge count increments in real-time |
| 3 | User reads all notifications | Badge disappears |

#### TC-NAV-03: Protected Route Guard
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Unauthenticated user navigates to `/dashboard/feeds` | Redirect to `/login` |
| 2 | Authenticated but un-onboarded user navigates to `/dashboard/feeds` | Redirect to `/onboarding` |

---

## 5. Feeds

### 5.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FEED-01 | User sees an aggregated feed of posts, forum topics, and nooks | P0 |
| FEED-02 | User can create a new post with text content | P0 |
| FEED-03 | User can like/unlike feed items (optimistic UI) | P0 |
| FEED-04 | User can comment on feed items | P0 |
| FEED-05 | User can share feed items (native share API or clipboard) | P1 |
| FEED-06 | User can bookmark/unbookmark feed items | P1 |
| FEED-07 | Clicking on a topic navigates to topic detail page | P0 |
| FEED-08 | Clicking on a nook navigates to nook detail page | P0 |
| FEED-09 | Clicking on a username opens user profile modal | P0 |
| FEED-10 | Feed supports "Load More" pagination | P1 |
| FEED-11 | Feed items show engagement counts (likes, comments, shares) | P0 |
| FEED-12 | User can view who has viewed a post (Viewers modal) | P2 |

### 5.2 Test Cases

#### TC-FEED-01: View Feed
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/feeds` | Feed loads with mix of posts, topics, nooks |
| 2 | Scroll down | More items visible, skeleton loader during fetch |
| 3 | Check each item type | Posts, topics, nooks display differently (proper cards) |

#### TC-FEED-02: Create Post
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Post" or post input area | Post creation form appears |
| 2 | Enter text content | Text accepted |
| 3 | Submit | Post appears at top of feed, success toast |

#### TC-FEED-03: Like/Unlike
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click like button on a feed item | Like count increments immediately (optimistic) |
| 2 | Click like button again | Like count decrements (toggle behavior) |
| 3 | If API fails | Like reverts, error toast shown |

#### TC-FEED-04: Comment on Feed Item
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click comment icon on a feed item | Inline comment input expands |
| 2 | Type comment and submit | Comment count increments, success toast |
| 3 | Click comment icon again | Comment input collapses |

#### TC-FEED-05: Navigate to Topic/Nook Detail
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on a forum topic card in feed | Navigate to `/dashboard/forums/topic/:topicId` |
| 2 | Click on a nook card in feed | Navigate to `/dashboard/nooks/:nookId` |

---

## 6. Forums

### 6.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FORUM-01 | User sees an overview of company forums and global forums | P0 |
| FORUM-02 | Foundation forums are auto-created per company on onboarding | P0 |
| FORUM-03 | User can join or leave forums | P0 |
| FORUM-04 | User can create a new topic (title, content, tags, forum selection) | P0 |
| FORUM-05 | User can view topic details with full content | P0 |
| FORUM-06 | User can react to topics (seen, validated, inspired, heard) | P0 |
| FORUM-07 | User can comment on topics | P0 |
| FORUM-08 | User can reply to comments (nested threading) | P1 |
| FORUM-09 | User can delete their own comments | P1 |
| FORUM-10 | Topics support hashtag filtering | P1 |
| FORUM-11 | Topics can be filtered by sort (recent, popular, trending) and time (today, week, month) | P1 |
| FORUM-12 | Topics display engagement metrics (reactions, comments, views) | P0 |
| FORUM-13 | Clicking a username opens user profile modal (on hover after 400ms or click) | P0 |
| FORUM-14 | Forum sidebar shows company forums, global communities, metrics | P1 |
| FORUM-15 | Company names are decrypted for display | P0 |
| FORUM-16 | User can search topics by keyword | P1 |
| FORUM-17 | AI Insights (Okestra panel) available per topic | P2 |

### 6.2 Test Cases

#### TC-FORUM-01: Forums Overview
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/forums` | Overview mode shown with recent discussions + sidebar |
| 2 | Check sidebar | Company forums section and Global Communities section visible |
| 3 | Check recent discussions | Topic cards shown with author, title, content preview, reactions |

#### TC-FORUM-02: Create Topic
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "New Topic" button | CreateTopicModal opens |
| 2 | Enter title, content, select forum, add tags | All fields accepted |
| 3 | Click submit | Modal closes, topic appears in recent discussions, success toast |

#### TC-FORUM-03: Topic Reactions
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On a topic card, click "Validated" reaction | Validated count increments, button highlighted |
| 2 | Click "Validated" again | Count decrements (toggle) |
| 3 | Click "Inspired" reaction | Inspired count increments independently |
| 4 | If API fails | Reaction reverts, error toast |

#### TC-FORUM-04: Topic Detail Page
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on a topic title/card | Navigate to `/dashboard/forums/topic/:topicId` |
| 2 | Full topic content displayed | Title, content, author, tags, reactions, comments visible |
| 3 | Post a comment | Comment appears in list, count increments |
| 4 | Reply to a comment | Reply nested under parent comment |
| 5 | Delete own comment | Comment removed, count decrements |

#### TC-FORUM-05: User Profile on Hover
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Hover over a username on a topic card | After ~400ms, UserProfileModal opens with that user's profile |
| 2 | Move mouse away quickly (before 400ms) | Modal does NOT open (hover cancelled) |
| 3 | Click on username instead | Modal opens immediately |

#### TC-FORUM-06: Join/Leave Forum
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to a global forum detail | "Join Forum" button visible |
| 2 | Click "Join Forum" | Button changes to "Leave Forum", member count increments |
| 3 | Click "Leave Forum" | Button reverts, member count decrements |

#### TC-FORUM-07: Topic Filters and Search
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Filters" button | Filter panel expands with Sort By + Time Range options |
| 2 | Select "Most Recent" sort | Topics re-ordered by creation date |
| 3 | Select "This Week" time filter | Only topics from this week shown |
| 4 | Type search term in search bar | Topics filtered by keyword |

#### TC-FORUM-08: Comment Threading
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On topic detail, click "Reply" on a comment | Reply indicator shown, input scrolls into view |
| 2 | Type reply and submit | Reply appears nested under parent (indented) |
| 3 | Click "Show 2 replies" | Nested replies expand |
| 4 | Click "Hide 2 replies" | Nested replies collapse |

---

## 7. Nooks (24-Hour Anonymous Rooms)

### 7.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NOOK-01 | User can view all active nooks with filters | P0 |
| NOOK-02 | User can create a new nook (title, description, urgency, scope, hashtags) | P0 |
| NOOK-03 | Nooks auto-delete after 24 hours | P0 |
| NOOK-04 | User can join a nook anonymously | P0 |
| NOOK-05 | User can leave a nook | P0 |
| NOOK-06 | User can post anonymous messages in a nook | P0 |
| NOOK-07 | User can react to nook messages | P1 |
| NOOK-08 | User can flag inappropriate messages | P1 |
| NOOK-09 | Nooks display a countdown timer showing time remaining | P1 |
| NOOK-10 | Nooks have urgency levels: high, medium, low | P0 |
| NOOK-11 | Nooks have scope: company-only or global | P0 |
| NOOK-12 | Nooks have temperature: hot, warm, cool (based on activity) | P1 |
| NOOK-13 | Nooks can be filtered by urgency, scope, temperature, hashtag | P1 |
| NOOK-14 | Nook metrics shown: active nooks, anonymous users, total participants | P2 |
| NOOK-15 | Nook member list shows anonymous avatars (no real usernames) | P0 |

### 7.2 Test Cases

#### TC-NOOK-01: View Nooks List
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/nooks` | Nooks list with filters shown |
| 2 | Check nook cards | Each shows title, description, urgency badge, scope, temperature, hashtags, participant count, countdown |
| 3 | Apply urgency filter (e.g., "High") | Only high-urgency nooks shown |
| 4 | Apply scope filter ("Company") | Only company-scoped nooks shown |

#### TC-NOOK-02: Create Nook
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Nook" button | Create nook modal/form opens |
| 2 | Enter title, description, select urgency, scope, add hashtags | All fields accepted |
| 3 | Submit | Nook created, appears in list, success toast |

#### TC-NOOK-03: Join and Participate in Nook
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on a nook card | Navigate to nook detail page |
| 2 | Click "Join" | User joins anonymously, can now post |
| 3 | Type a message and send | Message appears in nook chat anonymously |
| 4 | Check member list | Anonymous avatars shown, no real usernames |

#### TC-NOOK-04: Nook Auto-Expiry
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe countdown timer on a nook | Timer counts down from 24h creation time |
| 2 | When timer reaches 0 | Nook no longer accessible (404 or redirect) |

#### TC-NOOK-05: Flag Message
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In a nook, click flag icon on a message | Confirmation prompt |
| 2 | Confirm flag | Message flagged for review, success toast |

---

## 8. Messages & Real-Time Chat

### 8.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| MSG-01 | User can view all conversations (grouped: Mentorship Chats + Regular Chats) | P0 |
| MSG-02 | User can start a new conversation by searching for users | P0 |
| MSG-03 | User can send and receive text messages in real-time (WebSocket) | P0 |
| MSG-04 | If WebSocket is unavailable, messages fall back to REST API | P0 |
| MSG-05 | User sees typing indicators when the other user is typing | P1 |
| MSG-06 | User can request identity reveal in a conversation | P1 |
| MSG-07 | Conversation partner can accept or decline identity reveal | P1 |
| MSG-08 | Unread message count shown on conversation cards | P0 |
| MSG-09 | Messages are marked as read when viewed | P0 |
| MSG-10 | Connection status indicator (Connected/Disconnected) shown in header | P1 |
| MSG-11 | Mentorship conversations show "View Mentorship Profile" button that opens profile modal | P1 |
| MSG-12 | Chat type (regular/mentorship) is sent correctly with each message | P0 |
| MSG-13 | User cannot start a conversation with themselves | P0 |
| MSG-14 | Last message preview shown on conversation cards | P1 |

### 8.2 Test Cases

#### TC-MSG-01: View Conversations
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/messages` | Conversations list shown, grouped by Mentorship Chats and Regular Chats |
| 2 | Check each conversation card | Shows other user's avatar, username, last message preview, time ago, unread badge |
| 3 | Mentorship conversations | Orange badge labeled "Mentorship" |

#### TC-MSG-02: Send and Receive Messages
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a conversation | Chat view opens with message history |
| 2 | Type a message and press Enter or click Send | Message appears immediately (own message, right-aligned) |
| 3 | Other user sends a message | Message appears in real-time (left-aligned) |
| 4 | Check connection indicator | Shows "Connected" with green icon |

#### TC-MSG-03: WebSocket Fallback to REST
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Simulate WebSocket disconnection | Connection indicator shows "Disconnected" |
| 2 | Send a message | Message sent via REST API fallback |
| 3 | — | Message still delivered, appears in chat |
| 4 | WebSocket reconnects | Connection indicator returns to "Connected" |

#### TC-MSG-04: Typing Indicator
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In a chat, other user starts typing | "typing..." indicator appears |
| 2 | Other user stops typing (2s timeout) | Indicator disappears |

#### TC-MSG-05: Start New Conversation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "New" button in messages view | New conversation panel expands with search input |
| 2 | Type a username to search | Matching users shown in dropdown |
| 3 | Click on a user | Conversation created, chat view opens |
| 4 | If conversation already exists | Navigate to existing conversation |

#### TC-MSG-06: Identity Reveal Request
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In a chat, click the eye icon (Request Identity Reveal) | Request sent, toast: "Identity reveal request sent" |
| 2 | Other user receives notification | Can accept or decline |
| 3 | Other user accepts | Both users see revealed identity (real username) |
| 4 | Other user declines | Status updated, no identity shown |

#### TC-MSG-07: Mentorship Conversation — View Profile
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open a mentorship conversation | Orange "View Mentorship Profile" button visible in header |
| 2 | Click the button | MentorshipUserProfileModal opens with other user's mentor profile |
| 3 | Close modal | Returns to chat |

#### TC-MSG-08: Chat Type Mismatch Prevention
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send a message in a mentorship conversation | `chat_type: "mentorship"` sent in payload |
| 2 | Send a message in a regular conversation | `chat_type: "regular"` sent in payload |
| 3 | — | No "chat mismatched" errors from backend |

#### TC-MSG-09: Self-Conversation Prevention
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Attempt to start a conversation with yourself | Error toast: appropriate error message |
| 2 | — | Conversation not created |

---

## 9. Mentorship

### 9.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| MENT-01 | User sees three tabs: My Mentors, My Mentees, Find Mentorship | P0 |
| MENT-02 | User can set up a mentor profile (bio, expertise, industries, availability, style, languages) | P0 |
| MENT-03 | User can set up a mentee profile (goals, interests, availability, communication method, urgency) | P0 |
| MENT-04 | User can view AI-powered mentor/mentee suggestions with match scores | P1 |
| MENT-05 | User can filter mentors/mentees by career level, expertise, industries, affinity tags, availability | P1 |
| MENT-06 | User can send direct mentorship requests | P0 |
| MENT-07 | User can accept or decline received mentorship requests | P0 |
| MENT-08 | User can view connected mentors with their profiles | P0 |
| MENT-09 | User can view connected mentees with their profiles | P0 |
| MENT-10 | User can message a mentor/mentee (opens mentorship conversation) | P0 |
| MENT-11 | User can view a mentor/mentee's full profile in a modal | P0 |
| MENT-12 | Mentorship requests show metrics (total, pending, accepted, declined) | P1 |
| MENT-13 | Mentorship cards show expertise, bio, company, job title, match score | P0 |
| MENT-14 | User can follow/unfollow mentor profiles | P2 |
| MENT-15 | Pre-decrypted API responses used for mentor/mentee data (camelCase fields) | P0 |

### 9.2 Test Cases

#### TC-MENT-01: Setup Mentor Profile
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/mentorship` | Mentorship view with three tabs |
| 2 | If no mentor profile exists, "Setup Mentor Profile" prompt shown | Setup button visible |
| 3 | Click setup | MentorshipProfileModal opens |
| 4 | Fill in bio, expertise, industries, availability, style | All fields accepted |
| 5 | Submit | Profile created, mentor tab populated |

#### TC-MENT-02: Setup Mentee Profile
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "My Mentees" tab (or "Setup Mentee Profile" prompt) | Mentee setup shown |
| 2 | Fill in goals, interests, availability, communication method, urgency | All fields accepted |
| 3 | Submit | Mentee profile created |

#### TC-MENT-03: Find Mentorship — AI Suggestions
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Find Mentorship" tab | Suggestions page with AI-powered recommendations |
| 2 | View suggestion cards | Each shows username, avatar, expertise, match score, bio |
| 3 | Apply filters (career level, expertise) | Results filtered accordingly |
| 4 | Search by keyword | Results filtered by search term |

#### TC-MENT-04: Send Mentorship Request
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On a mentor suggestion card, click "Request Mentorship" | DirectMentorshipRequestModal opens |
| 2 | Fill in request message | Text accepted |
| 3 | Submit | Request sent, success toast |
| 4 | Check "Sent Requests" | New request visible with "pending" status |

#### TC-MENT-05: Accept/Decline Mentorship Request
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Messages > Mentorship tab | Received requests list shown |
| 2 | Click "Accept" on a request | Request accepted, mentorship connection established |
| 3 | Check "My Mentors" or "My Mentees" tab | New connection visible |
| 4 | Click "Decline" on a request | Request declined, removed from list |

#### TC-MENT-06: Message Mentor from Card
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On "My Mentors" tab, click "Message" button on a mentor card | Navigate to `/dashboard/messages` with mentorship conversation selected |
| 2 | Chat opens with correct mentorship context | Orange-themed mentorship chat |

#### TC-MENT-07: View Mentor Profile from Card
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On "My Mentors" tab, click "View Profile" on a mentor card | MentorshipUserProfileModal opens |
| 2 | Profile shows: bio, expertise, industries, availability, match score | All fields populated from API |
| 3 | Close modal | Returns to mentorship view |

---

## 10. Notifications

### 10.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NOTIF-01 | User receives real-time notifications via WebSocket | P0 |
| NOTIF-02 | Notification dropdown in header shows latest 10 notifications | P0 |
| NOTIF-03 | Full notifications page shows all notifications | P0 |
| NOTIF-04 | Unread count badge on notification icon in navigation | P0 |
| NOTIF-05 | User can mark individual notifications as read | P1 |
| NOTIF-06 | User can mark all notifications as read | P1 |
| NOTIF-07 | User can delete individual notifications | P2 |
| NOTIF-08 | Notifications have action URLs for quick navigation | P1 |
| NOTIF-09 | Notification types: mentions, likes, comments, messages, mentorship requests, identity reveal | P0 |
| NOTIF-10 | Time ago display on each notification | P1 |
| NOTIF-11 | Real-time badge update (no polling — uses WebSocket `new_notification` event) | P0 |

### 10.2 Test Cases

#### TC-NOTIF-01: Real-Time Notification
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A sends a message to User B | User B receives `new_notification` via WebSocket |
| 2 | Check User B's notification badge | Badge count increments by 1 |
| 3 | Check notification dropdown | New notification prepended at top |

#### TC-NOTIF-02: View Notifications Page
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/notifications` | Full notifications list shown |
| 2 | Each notification shows type, message, time ago | Properly formatted |
| 3 | Click on a notification with an action URL | Navigate to relevant page |

#### TC-NOTIF-03: Mark All as Read
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Mark all as read" | All notifications marked as read |
| 2 | Check unread badge | Badge disappears (count = 0) |

#### TC-NOTIF-04: Delete Notification
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click delete button on a notification | Notification removed from list |
| 2 | — | List updates immediately |

---

## 11. Profile & Settings

### 11.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PROF-01 | User can view their profile (avatar, username, company, career level) | P0 |
| PROF-02 | User can edit their display name (username) | P0 |
| PROF-03 | User sees quick stats (topics created, helpful reactions, nooks joined) | P1 |
| PROF-04 | User sees badges/achievements earned | P2 |
| PROF-05 | User can toggle mentorship availability (mentor/mentee) | P1 |
| PROF-06 | User can setup/edit mentor or mentee profile from profile page | P1 |
| PROF-07 | User sees their communities (company forum + affinity groups) | P1 |
| PROF-08 | User sees private demographics (never shared with others) | P1 |
| PROF-09 | User can update privacy settings (allow messages, show company, show activity) | P1 |
| PROF-10 | User can update notification settings (messages, forum activity, email) | P1 |
| PROF-11 | User can change password from settings | P1 |
| PROF-12 | User can pause (deactivate) their account | P2 |
| PROF-13 | User can delete their account permanently | P2 |
| PROF-14 | User can export their data | P2 |
| PROF-15 | User can view community guidelines | P2 |
| PROF-16 | User can view crisis resources | P2 |
| PROF-17 | User can report harassment | P1 |
| PROF-18 | User can sign out | P0 |

### 11.2 Test Cases

#### TC-PROF-01: View Profile
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/profile` | Profile page with avatar, username, company, career level |
| 2 | Check quick stats | Posts, helpful reactions, nooks joined counts shown |
| 3 | Check badges section | Badges displayed (earned = colored, unearned = grayed) |
| 4 | Check communities section | Company forum and affinity groups listed |

#### TC-PROF-02: Edit Display Name
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In settings, click "Edit Display Name" | Input field appears |
| 2 | Type new username and submit | Username updated, success toast |
| 3 | Check profile header | New username displayed |

#### TC-PROF-03: Privacy Settings
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open settings panel | Privacy & Safety section visible |
| 2 | Toggle "Allow Messages" off | Setting saved, other users can no longer message |
| 3 | Toggle "Show Company" off | Company hidden from profile views |

#### TC-PROF-04: Notification Settings
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open notification settings | Toggle switches for each notification type |
| 2 | Toggle "Forum Activity" off | Setting saved, no more forum notifications |
| 3 | Toggle "Email Notifications" off | Setting saved, no email notifications |

#### TC-PROF-05: Sign Out
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Sign Out" in settings | Confirmation or immediate logout |
| 2 | — | Tokens cleared, redirect to `/login` |
| 3 | Try accessing `/dashboard` | Redirect to `/login` |

#### TC-PROF-06: Delete Account
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Delete Account" in settings | Confirmation dialog with warning |
| 2 | Confirm deletion | Account deleted, tokens cleared, redirect to `/login` |
| 3 | Try logging in with deleted account | Login fails |

#### TC-PROF-07: Report Harassment
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Report Harassment" in safety resources | Report form page opens |
| 2 | Fill in report details and submit | Report submitted, success toast |

---

## 12. Privacy & Anonymity

### 12.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PRIV-01 | All users have anonymous usernames and emoji avatars by default | P0 |
| PRIV-02 | Real names are encrypted and never shown to other users (unless identity revealed) | P0 |
| PRIV-03 | Company names are encrypted client-side using master key | P0 |
| PRIV-04 | Career level and affinity tags are encrypted | P0 |
| PRIV-05 | Identity reveal is opt-in, only in 1-on-1 chats, requires both users' consent | P0 |
| PRIV-06 | Nook participation is fully anonymous (no user IDs shown) | P0 |
| PRIV-07 | Anonymous mode cannot be disabled (always on) | P0 |
| PRIV-08 | Demographics are private (never shared with other users) | P0 |
| PRIV-09 | 24-hour auto-delete for Nooks ensures sensitive topics don't persist | P0 |
| PRIV-10 | Company-scoped nooks only visible to company members | P0 |

### 12.2 Test Cases

#### TC-PRIV-01: Anonymous Profile
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View another user's profile (via modal) | Anonymous username and emoji avatar shown |
| 2 | — | NO real name, NO email, NO personal identifiers visible |

#### TC-PRIV-02: Encrypted Company Name
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On profile page, observe company name | Decrypted and displayed correctly |
| 2 | Check network requests | `company_encrypted` sent in API, not plain text |

#### TC-PRIV-03: Identity Reveal Consent
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A requests identity reveal in chat with User B | User B receives notification |
| 2 | User B declines | Neither user's identity revealed |
| 3 | User B accepts | Both users see each other's real username |

#### TC-PRIV-04: Nook Full Anonymity
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Join a nook and view member list | Only anonymous avatars, no usernames or IDs |
| 2 | Post a message | Message shows anonymous avatar, not real identity |

---

## 13. WebSocket & Real-Time Features

### 13.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| WS-01 | WebSocket connects on dashboard load with token authentication | P0 |
| WS-02 | WebSocket queues operations if not yet authenticated, flushes after auth | P0 |
| WS-03 | Real-time message delivery via `new_message` event | P0 |
| WS-04 | Real-time typing indicators via `typing_start`/`typing_end` events | P1 |
| WS-05 | Real-time notification delivery via `new_notification` event | P0 |
| WS-06 | Connection status tracked (connected + authenticated = "ready") | P0 |
| WS-07 | REST API fallback for message sending when WS not ready | P0 |
| WS-08 | Auto-reconnect on disconnect (5 attempts, exponential backoff) | P0 |
| WS-09 | Token refresh triggers WS reconnection with new token | P0 |
| WS-10 | On auth error, retry with fresh token before disconnecting | P1 |
| WS-11 | Conversation join/leave via `join_conversation`/`leave_conversation` | P0 |
| WS-12 | Message read receipts via `mark_read` event | P1 |

### 13.2 Test Cases

#### TC-WS-01: WebSocket Connection
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in and load dashboard | WebSocket connects |
| 2 | Check connection status | Shows "Connected" (green indicator) in messages view |
| 3 | Check browser console/network | `authenticated` event received |

#### TC-WS-02: Real-Time Messaging
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open same conversation in two browsers (User A and User B) | Both see chat |
| 2 | User A sends a message | User B sees message appear instantly (< 1 second) |
| 3 | User B sends a message | User A sees message appear instantly |

#### TC-WS-03: REST Fallback
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disconnect WebSocket (e.g., disable network briefly) | Connection indicator shows "Disconnected" |
| 2 | Send a message | Message sent via REST API |
| 3 | — | Message still appears in chat for both users |

#### TC-WS-04: Token Refresh + WebSocket Reconnect
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Wait for access token to expire | Axios interceptor refreshes token |
| 2 | — | WebSocket automatically reconnects with new token |
| 3 | — | Real-time features continue working |

#### TC-WS-05: Notification Real-Time Update
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger a notification for the user (e.g., someone likes their post) | `new_notification` event received |
| 2 | Check notification badge | Incremented without page refresh |
| 3 | Check notification dropdown/page | New notification prepended at top |

---

## 14. Cross-Cutting Concerns

### 14.1 Error Handling

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| ERR-01 | API returns 401 (unauthorized) | Token refresh attempted, if fails redirect to login |
| ERR-02 | API returns 429 (rate limit) | Toast: "Too many requests", retry after delay |
| ERR-03 | API returns 500 (server error) | Toast: descriptive error message |
| ERR-04 | Network disconnected | Graceful degradation, reconnect attempts |
| ERR-05 | WebSocket disconnects mid-conversation | Auto-reconnect, queued operations flushed |

### 14.2 Responsive Design

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| RESP-01 | Mobile viewport (< 768px) | Bottom navigation shown, top nav simplified |
| RESP-02 | Tablet viewport (768-1024px) | Adaptive layout, touch-friendly buttons |
| RESP-03 | Desktop viewport (> 1024px) | Full sidebar layout, all features visible |

### 14.3 Loading States

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| LOAD-01 | Conversations loading | Skeleton cards animated |
| LOAD-02 | Messages loading | Skeleton message bubbles |
| LOAD-03 | Topics loading | Skeleton topic cards |
| LOAD-04 | Profile loading | Skeleton profile layout |
| LOAD-05 | User search loading | Skeleton user list |

### 14.4 Toast Notifications

| Type | Usage |
|------|-------|
| **Success** (green) | Actions completed: "Comment posted", "Profile updated", "Request sent" |
| **Error** (red) | Failures: "Failed to send message", "Invalid OTP" |
| **Warning** (yellow) | Cautionary: rate limits, validation issues |

---

## 15. Test Case Templates

### Template A: Feature Test Case

```
Test Case ID: [MODULE]-[NUMBER]
Title: [Brief description]
Priority: P0 / P1 / P2
Preconditions: [Required state before test]
Module: [Feature area]

| Step | Action | Input Data | Expected Result | Actual Result | Status |
|------|--------|------------|-----------------|---------------|--------|
| 1    |        |            |                 |               |        |
| 2    |        |            |                 |               |        |
| 3    |        |            |                 |               |        |

Postconditions: [Expected state after test]
Notes: [Any additional context]
```

### Template B: Bug Report

```
Bug ID: BUG-[NUMBER]
Title: [Brief description]
Severity: Critical / Major / Minor / Cosmetic
Priority: P0 / P1 / P2 / P3
Module: [Feature area]
Environment: [Browser, OS, Screen size]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result: [What should happen]
Actual Result: [What actually happens]
Screenshots/Recordings: [Attach]
Console Errors: [If any]

Additional Context: [Notes]
```

### Template C: Regression Checklist

```
Release: [Version]
Date: [Date]
Tester: [Name]

| # | Test Area | Test Case | Pass/Fail | Notes |
|---|-----------|-----------|-----------|-------|
| 1 | Auth | Login with email/password | | |
| 2 | Auth | Signup + OTP verification | | |
| 3 | Auth | Social login (Google) | | |
| 4 | Auth | Password reset flow | | |
| 5 | Onboarding | Complete 3-step flow | | |
| 6 | Feeds | View feed, create post | | |
| 7 | Feeds | Like/comment/share | | |
| 8 | Forums | View overview, create topic | | |
| 9 | Forums | React to topic, post comment | | |
| 10 | Forums | User profile on hover | | |
| 11 | Nooks | View nooks, create nook | | |
| 12 | Nooks | Join nook, post message | | |
| 13 | Messages | View conversations | | |
| 14 | Messages | Send/receive real-time messages | | |
| 15 | Messages | Identity reveal request | | |
| 16 | Messages | Mentorship profile button | | |
| 17 | Mentorship | View mentors/mentees | | |
| 18 | Mentorship | Send mentorship request | | |
| 19 | Mentorship | Accept/decline request | | |
| 20 | Notifications | Real-time notification | | |
| 21 | Notifications | Mark as read | | |
| 22 | Profile | View profile, edit name | | |
| 23 | Profile | Privacy settings | | |
| 24 | Profile | Sign out | | |
| 25 | WebSocket | Connection + authentication | | |
| 26 | WebSocket | Reconnect after disconnect | | |
| 27 | Privacy | Anonymous display | | |
| 28 | Privacy | Encrypted company name | | |
```

---

## Appendix A: Route Map

| Route | Component | Auth Required | Onboarding Required |
|-------|-----------|---------------|---------------------|
| `/login` | LoginScreen | No | No |
| `/verify-otp` | OTPVerificationPage | No | No |
| `/reset-password` | ResetPasswordPage | No | No |
| `/change-password` | ChangePasswordPage | Yes | No |
| `/onboarding` | OnboardingFlow | Yes | No |
| `/dashboard` | Redirect to `/dashboard/feeds` | Yes | Yes |
| `/dashboard/feeds` | FeedsView | Yes | Yes |
| `/dashboard/forums` | ForumsView | Yes | Yes |
| `/dashboard/forums/topic/:topicId` | TopicDetailPage | Yes | Yes |
| `/dashboard/nooks` | NooksView | Yes | Yes |
| `/dashboard/nooks/:nookId` | NookDetailPage | Yes | Yes |
| `/dashboard/messages` | MessagesView | Yes | Yes |
| `/dashboard/mentorship` | MentorshipView | Yes | Yes |
| `/dashboard/profile` | ProfileView | Yes | Yes |
| `/dashboard/notifications` | NotificationsView | Yes | Yes |
| `/community-guidelines` | CommunityGuidelinesPage | Yes | Yes |
| `/crisis-resources` | CrisisResourcesPage | Yes | Yes |
| `/report-harassment` | ReportHarassmentPage | Yes | Yes |
| `/export-data` | ExportDataPage | Yes | Yes |

## Appendix B: API Endpoint Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/social-login` | OAuth login (Google/Facebook) |
| POST | `/auth/verify-otp` | Verify email OTP |
| POST | `/auth/resend-otp` | Resend OTP |
| POST | `/auth/forgot-password` | Request password reset OTP |
| POST | `/auth/reset-password` | Reset password with OTP |
| POST | `/auth/change-password` | Change password (authenticated) |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/logout` | Logout |
| POST | `/auth/onboarding` | Complete onboarding profile |

### Forums
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/forums/metrics/local/:company` | Company forum metrics |
| GET | `/forums/metrics/global` | Global forum metrics |
| GET | `/forums/recent/:company` | Recent discussions with filters |
| GET | `/forums/foundation/:company` | Company foundation forums |
| GET | `/forums/joined/:company` | User's joined forums |
| POST | `/forums/topics` | Create topic |
| GET | `/forums/topics/:id` | Get topic by ID |
| POST | `/forums/topics/reactions` | Toggle topic reaction |
| POST | `/forums/topics/comments` | Create comment |
| GET | `/forums/topics/:id/comments` | Get topic comments |
| DELETE | `/forums/topics/comments/:id` | Delete comment |

### Mentorship
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mentorship/mentor-profile` | Create mentor profile |
| GET | `/mentorship/mentor-profile` | Get own mentor profile |
| PUT | `/mentorship/mentor-profile` | Update mentor profile |
| POST | `/mentorship/mentee-profile` | Create mentee profile |
| GET | `/mentorship/mentee-profile` | Get own mentee profile |
| GET | `/mentorship/profile/:userId` | Get mentor profile by user ID |
| POST | `/mentorship/requests/direct` | Send direct request |
| GET | `/mentorship/requests` | Get all requests |
| PUT | `/mentorship/requests/:id/respond` | Accept/decline request |
| GET | `/mentorship/search` | Search mentors/mentees |
| GET | `/mentorship/suggestions` | AI-powered suggestions |
| GET | `/mentorship/requests/my-mentors` | Get connected mentors |
| GET | `/mentorship/requests/my-mentees` | Get connected mentees |

### Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messaging/send` | Send message |
| POST | `/messaging/conversations` | Create conversation |
| GET | `/messaging/conversations` | Get conversations |
| GET | `/messaging/conversations/:id/messages` | Get messages |
| POST | `/messaging/conversations/:id/read` | Mark as read |
| POST | `/messaging/identity-reveal/request` | Request identity reveal |
| POST | `/messaging/identity-reveal/respond` | Respond to reveal |
| GET | `/messaging/connectable-users` | Search users for messaging |

### Nooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nooks` | Create nook |
| GET | `/nooks` | Get nooks with filters |
| GET | `/nooks/:id` | Get nook by ID |
| GET | `/nooks/:id/messages` | Get nook messages |
| POST | `/nooks/:id/messages` | Post nook message |
| POST | `/nooks/:id/join` | Join nook |
| POST | `/nooks/:id/leave` | Leave nook |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get notifications |
| GET | `/notifications/unread-count` | Get unread count |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |

---

*This document should be treated as a living document. Update it as new features are added or requirements change.*
