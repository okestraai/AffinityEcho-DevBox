# Uniform Reactions Specification

## Current State — Inconsistencies

| Feature | Reactions Used | Icons | Colors |
|---------|---------------|-------|--------|
| **Feeds** (FeedsView) | Like | Heart | Blue |
| **Forum Topics** (ForumTopicsMode) | Seen, Validated, Inspired, Heard | Eye, ThumbsUp, Star, HeartIcon | Green, Blue, Yellow, Purple |
| **Forum Topics** (OverviewMode) | Seen, Validated, Inspired, Heard | Eye, ThumbsUp, Star, HeartIcon | Green, Blue, Yellow, Purple |
| **Topic Detail** (TopicDetailPage) | Validated, Inspired, Heard | CheckCircle2, Lightbulb, Sparkles | Blue, Purple, Amber |
| **Comments** (CommentsModal) | Helpful | Heart | Red |
| **Nook Messages** (NookMessage) | Heard, Validated, Helpful | Heart, CheckCircle, ThumbsUp | Red, Blue, Green |

### Problems Identified

1. **Inconsistent icon choices** for the same reaction type:
   - "Validated" uses ThumbsUp in topics, CheckCircle2 in detail, CheckCircle in nooks
   - "Inspired" uses Star in topics, Lightbulb in detail
   - "Heard" uses HeartIcon in topics, Sparkles in detail, Heart in nooks

2. **Inconsistent color schemes** for the same reaction type:
   - "Heard" is purple in topics, amber in detail, red in nooks

3. **Missing reactions** in some views:
   - Feeds only has "Like" — no validated/inspired/heard
   - Topic Detail is missing "Seen"
   - Nooks has "Helpful" but no "Inspired" or "Seen"
   - Comments only have "Helpful"

4. **Different naming** for similar concepts:
   - "Like" (feeds) vs "Heard" (forums/nooks) — both use Heart icon

---

## Proposed Uniform Standard

### Core Reactions (All Content Types)

| Reaction | Icon | Active Color | Meaning |
|----------|------|-------------|---------|
| **Heard** | Heart | `text-red-500` / `fill-red-500` | "I relate to this" / "This resonates with me" |
| **Validated** | ThumbsUp | `text-blue-600` / `fill-blue-600` | "I agree" / "This is valid" |
| **Inspired** | Star | `text-yellow-500` / `fill-yellow-500` | "This inspires me" / "Great insight" |

### Additional Reactions (Context-Specific)

| Reaction | Icon | Active Color | Where Used | Meaning |
|----------|------|-------------|------------|---------|
| **Seen** | Eye | `text-green-600` / `fill-green-600` | Forum Topics only | "I've read this" / Acknowledgment |
| **Helpful** | ThumbsUp | `text-green-600` / `fill-green-600` | Comments & Nook Messages only | "This was helpful" |

---

## What to Change Per File

### FeedsView.tsx — ADD Reactions

**Current:** Like (Heart, blue)
**Change to:** Heard (Heart, red), Validated (ThumbsUp, blue), Inspired (Star, yellow)

- **Remove:** "Like" reaction (replace with "Heard")
- **Add:** "Validated" and "Inspired" buttons
- **Keep:** Bookmark, Comment, Share (these are actions, not reactions)

### ForumTopicsMode.tsx — STANDARDIZE Icons/Colors

**Current:** Seen (Eye, green), Validated (ThumbsUp, blue), Inspired (Star, yellow), Heard (HeartIcon, purple)
**Change to:** Seen (Eye, green), Validated (ThumbsUp, blue), Inspired (Star, yellow), Heard (Heart, red)

- **Change:** Heard color from purple to red
- **Keep:** Everything else (already close to standard)

### OverviewMode.tsx — STANDARDIZE Icons/Colors

Same changes as ForumTopicsMode (these are identical reaction sets).

- **Change:** Heard color from purple to red

### TopicDetailPage.tsx — STANDARDIZE Icons + ADD "Seen"

**Current:** Validated (CheckCircle2, blue), Inspired (Lightbulb, purple), Heard (Sparkles, amber)
**Change to:** Seen (Eye, green), Validated (ThumbsUp, blue), Inspired (Star, yellow), Heard (Heart, red)

- **Change:** Validated icon from CheckCircle2 to ThumbsUp
- **Change:** Inspired icon from Lightbulb to Star, color from purple to yellow
- **Change:** Heard icon from Sparkles to Heart, color from amber to red
- **Add:** Seen (Eye, green) reaction

### CommentsModal.tsx — KEEP as-is

**Current:** Helpful (Heart, red)
**Keep:** Comments are a sub-context; "Helpful" is the appropriate single reaction.

- Optionally rename display from "helpful" to "Helpful" (capitalize)
- No other changes needed

### NookMessage.tsx — STANDARDIZE + ADD "Inspired"

**Current:** Heard (Heart, red), Validated (CheckCircle, blue), Helpful (ThumbsUp, green)
**Change to:** Heard (Heart, red), Validated (ThumbsUp, blue), Inspired (Star, yellow), Helpful (ThumbsUp, green)

- **Change:** Validated icon from CheckCircle to ThumbsUp
- **Add:** Inspired (Star, yellow) reaction
- **Keep:** Helpful (context-appropriate for messages)

---

## Uniform Icon + Color Reference

```
Heard      →  Heart       →  text-red-500    fill-red-500
Validated  →  ThumbsUp    →  text-blue-600   fill-blue-600
Inspired   →  Star        →  text-yellow-500 fill-yellow-500
Seen       →  Eye         →  text-green-600  fill-green-600
Helpful    →  ThumbsUp    →  text-green-600  fill-green-600
```

## Animation Standard

All reaction icons use:
- `transition-transform duration-200` on the icon element
- `animate-reaction-pop` class when the reaction is active (toggled on)
- No animation on hover/press of the button itself (icon-only animation)

## Active State Tracking

All reactions should track user state via:
- Topics: `topic.userReactions?.{type}` (boolean)
- Feeds: `item.user_has_{type}` (boolean)
- Nook Messages: `hasReacted("{type}")` (function returning boolean)
- Comments: `comment.user_has_reacted_{type}` or similar (boolean)

## Backend Endpoints Involved

### Existing
- `POST /forum/topics/reactions` — `{ topicId, reactionType: "seen"|"validated"|"inspired"|"heard" }`
- `POST /forum/comments/reactions` — `{ commentId, reactionType: "helpful"|"supportive" }`
- `POST /nooks/messages/{messageId}/reactions` — `{ reactionType: "heard"|"validated"|"helpful" }`
- `POST /feeds/{contentType}/{contentId}/like` — Toggle like (currently the only feed reaction)

### Needed for Uniform Reactions on Feeds

| Endpoint | Description |
|----------|-------------|
| `POST /feeds/{contentType}/{contentId}/react` | **NEW** — Toggle a specific reaction type on feed content |

**Payload:**
```json
{
  "reactionType": "heard" | "validated" | "inspired"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reacted": true,
    "reactionType": "heard",
    "counts": {
      "heard": 12,
      "validated": 5,
      "inspired": 3
    }
  }
}
```

### Needed for "Inspired" on Nook Messages

The existing `POST /nooks/messages/{messageId}/reactions` endpoint needs to accept `"inspired"` as a valid `reactionType` in addition to the current `"heard"`, `"validated"`, `"helpful"`.

---

## Summary of Changes

| File | Remove | Add | Change |
|------|--------|-----|--------|
| FeedsView | "Like" | Heard, Validated, Inspired | Replace like with 3 reactions |
| ForumTopicsMode | — | — | Heard color: purple → red |
| OverviewMode | — | — | Heard color: purple → red |
| TopicDetailPage | — | Seen | Icons + colors to match standard |
| CommentsModal | — | — | No changes |
| NookMessage | — | Inspired | Validated icon: CheckCircle → ThumbsUp |
