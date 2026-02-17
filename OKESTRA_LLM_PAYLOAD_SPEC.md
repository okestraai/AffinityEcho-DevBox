# Okestra LLM Payload Specification

This document describes the payload structure sent to the LLM for thread analysis and the expected response format.

## Overview

When a user clicks the Okestra (sparkles) icon on a topic, the frontend:
1. Gathers the topic and all comments (flattened)
2. Builds a structured payload
3. Sends it to the Supabase Edge Function `okestra-llm`
4. The Edge Function forwards to the self-hosted vLLM service
5. Returns AI-generated insights to display in the Okestra panel

## Request Flow

```
Browser → Edge Function → vLLM Chat Service → LLM Model
        (via Supabase)   (with CF auth)      (Llama 3.1 8B)
```

## User Context

The payload includes a `userContext` field that provides information about who is requesting the insights:

### User Types

- **Primary User**: The original author of the topic. Okestra tailors insights to help them understand the responses they've received and identify actionable next steps based on community feedback.
- **Secondary User**: A community member viewing someone else's topic. Okestra provides insights to help them engage meaningfully with the discussion.

### Primary User Context

When the requester is the topic author, includes:
- `totalResponsesReceived`: Number of comments on their topic
- `topEngagedCommentIds`: IDs of the most-reacted comments (up to 5)
- `hasOpenQuestions`: Whether any comments contain questions

### Secondary User Context

When the requester is viewing another user's topic, includes:
- `hasCommented`: Whether they've already commented
- `commentIds`: IDs of their comments (if any)
- `hasReacted`: Whether they've reacted to the topic
- `reactionTypes`: Types of reactions they've given (seen, validated, inspired, heard)

## Payload Structure

### Edge Function Request

The frontend sends this to `/functions/v1/okestra-llm`:

```json
{
  "threadPayload": { /* see Thread Payload below */ },
  "systemPrompt": "You are Okestra, an AI assistant..."
}
```

### Thread Payload

The `threadPayload` object contains:

```typescript
{
  "request": {
    "requestId": "req_1738163123456",
    "timestamp": "2026-01-29T14:32:03.456Z",
    "userId": "user_12345"
  },
  "userContext": {
    "userId": "user_12345",
    "userType": "secondary",
    "engagerContext": {
      "hasCommented": true,
      "commentIds": ["c_003"],
      "hasReacted": true,
      "reactionTypes": ["validated", "heard"]
    }
  },
  "topic": {
    "id": "topic_uuid",
    "title": "How do I balance work and personal mental health?",
    "content": {
      "body": "I've been struggling to maintain boundaries between work stress and my personal life. Any advice?"
    },
    "author": {
      "displayName": "Alex",
      "isAnonymous": false
    },
    "tags": ["work-life-balance", "mental-health", "stress"],
    "timestamps": {
      "created": "2026-01-28T10:00:00.000Z",
      "lastActivity": "2026-01-29T14:32:03.456Z"
    },
    "engagement": {
      "views": 24,
      "commentCount": 5,
      "totalReactions": 12,
      "reactionsByType": {
        "seen": 24,
        "validated": 6,
        "inspired": 4,
        "heard": 2
      }
    }
  },
  "thread": {
    "comments": [
      {
        "id": "c_001",
        "author": {
          "displayName": "Jordan",
          "isAnonymous": false
        },
        "content": "I've found setting hard boundaries helps. I turn off work notifications after 6pm.",
        "timestamp": "2026-01-28T11:30:00.000Z",
        "reactions": {
          "total": 8
        }
      },
      {
        "id": "c_002",
        "author": {
          "displayName": "Anonymous",
          "isAnonymous": true
        },
        "content": "Therapy helped me a lot. Sometimes professional support is needed to process work stress.",
        "timestamp": "2026-01-28T14:15:00.000Z",
        "reactions": {
          "total": 12
        }
      },
      {
        "id": "c_003",
        "author": {
          "displayName": "Sam",
          "isAnonymous": false
        },
        "content": "I disagree with hard boundaries - sometimes flexibility is important. What if there's an emergency?",
        "timestamp": "2026-01-28T16:45:00.000Z",
        "reactions": {
          "total": 3
        }
      },
      {
        "id": "c_004",
        "author": {
          "displayName": "Morgan",
          "isAnonymous": false
        },
        "content": "Physical exercise really helps me decompress. I run after work to clear my head.",
        "timestamp": "2026-01-29T09:00:00.000Z",
        "reactions": {
          "total": 7
        }
      },
      {
        "id": "c_005",
        "author": {
          "displayName": "Taylor",
          "isAnonymous": false
        },
        "content": "Have you tried mindfulness meditation? There are great apps for beginners.",
        "timestamp": "2026-01-29T13:20:00.000Z",
        "reactions": {
          "total": 5
        }
      }
    ],
    "statistics": {
      "totalComments": 5,
      "maxDepth": 3,
      "mostEngaged": ["c_002", "c_001", "c_004"]
    }
  },
  "weightingHints": {
    "useEngagementAsSignal": true,
    "signalGuidance": [
      "Prioritize summarizing points made in high-reaction comments",
      "Flag disagreements when high-reaction comments conflict"
    ]
  },
  "privacyAndSafety": {
    "redactionRules": ["Do not quote users verbatim beyond 12 words"],
    "policyHints": ["Flag PII, threats, self-harm, or harassment"]
  }
}
```

## System Prompt

```
You are Okestra, an AI assistant for Affinity Echo—an anonymous professional network serving underrepresented communities in tech. You analyze discussion threads and provide personalized, actionable insights.

## User Types
You will receive a `userType` field:
- **primary**: The user authored the original topic. Provide action items focused on THEIR specific situation and how to apply the thread's collective wisdom.
- **secondary**: The user is engaging via comments/reactions. Provide action items focused on how to contribute meaningfully to the conversation and support the community.

## Action Item Guidelines by User Type

### For PRIMARY Users (Topic Authors):
- Actions should directly address the problem/question they raised
- Be specific to their stated context (role, company type, situation)
- Focus on synthesizing the advice they've received
- Include emotional validation where the thread shows support
- Suggest follow-up questions they might ask the community
- Highlight which commenters might be worth connecting with (by ID only)

### For SECONDARY Users (Engagers):
- Actions should focus on conversation contribution
- Suggest what unique perspective they might add
- Identify gaps in the discussion they could fill
- If they've already commented, suggest how to follow up
- Encourage genuine connection-building behaviors
- Warn against performative or unhelpful response patterns

## Domain Context
Affinity Echo users face unique challenges:
- Navigating workplaces where they're underrepresented
- Code-switching and authenticity tensions
- Limited access to informal networks and sponsorship
- Bias in performance evaluation and promotion
- Isolation and "only one in the room" experiences

Ground your advice in this lived reality. Avoid generic career advice that ignores systemic barriers.

## Rules
- Remain empathetic and action-oriented
- Do not hallucinate—only reference what's in the thread
- Respect privacy: no verbatim quotes >12 words
- Use engagement as signal, not truth
- Flag safety concerns (PII, threats, self-harm, harassment)
- Return ONLY valid JSON matching the schema

## Output Schema
{
  "tldr": "string",
  "keyThemes": ["string"],
  "openQuestions": ["string"],
  "consensus": ["string"],
  "disagreements": ["string"],
  "themes": [
    {
      "name": "string",
      "sentiment": "positive | neutral | negative",
      "supportingCommentIds": ["string"]
    }
  ],
  "actionItems": [
    {
      "action": "string",
      "rationale": "string",
      "nextSteps": ["string"],
      "confidence": "Low | Med | High",
      "category": "string",
      "userRelevance": "string (explain why this matters for THIS user specifically)"
    }
  ],
  "safetyFlags": ["string"],
  "conversationHealth": {
    "qualityScore": "Low | Medium | High",
    "suggestions": ["string (for secondary users: how to improve the thread)"]
  }
}

Return ONLY the JSON object. No other text.
```

## Expected LLM Response

### For Primary User (Topic Author)

Based on the example payload above, when the topic author requests insights, the LLM returns:

```json
{
  "tldr": "Discussion about work-life balance strategies, with suggestions ranging from hard boundaries to professional therapy. Some disagreement about flexibility vs. strict limits.",
  "keyThemes": [
    "Setting boundaries",
    "Professional mental health support",
    "Physical exercise",
    "Mindfulness practices"
  ],
  "openQuestions": [
    "How to handle work emergencies while maintaining boundaries?",
    "What specific mindfulness apps are recommended?",
    "Is therapy accessible and affordable?"
  ],
  "consensus": [
    "Managing work stress requires intentional strategies",
    "Physical and mental health practices are beneficial"
  ],
  "disagreements": [
    "Hard boundaries vs. flexible approach to work-life separation"
  ],
  "themes": [
    {
      "name": "Boundary Setting",
      "sentiment": "positive",
      "supportingCommentIds": ["c_001", "c_003"]
    },
    {
      "name": "Professional Support",
      "sentiment": "positive",
      "supportingCommentIds": ["c_002"]
    },
    {
      "name": "Self-Care Practices",
      "sentiment": "positive",
      "supportingCommentIds": ["c_004", "c_005"]
    }
  ],
  "actionItems": [
    {
      "action": "Experiment with boundary setting",
      "rationale": "Multiple users found success with work-life boundaries",
      "nextSteps": [
        "Try turning off notifications after work hours",
        "Communicate boundaries to team",
        "Monitor impact on stress levels"
      ],
      "confidence": "High",
      "category": "Behavioral Change",
      "userRelevance": "Since you asked about balancing work stress with personal life, setting boundaries is the most commonly endorsed approach in your thread with strong support from the community"
    },
    {
      "action": "Explore professional support options",
      "rationale": "Therapy was mentioned as highly effective for processing work stress",
      "nextSteps": [
        "Research therapists or counselors",
        "Check insurance coverage",
        "Schedule initial consultation"
      ],
      "confidence": "Med",
      "category": "Professional Help",
      "userRelevance": "Your question about maintaining mental health suggests you're open to structured support. The anonymous commenter's endorsement shows this worked for someone in a similar position"
    },
    {
      "action": "Start physical exercise routine",
      "rationale": "Physical activity helps decompress and clear mental space",
      "nextSteps": [
        "Choose enjoyable form of exercise",
        "Schedule regular time slots",
        "Start small and build consistency"
      ],
      "confidence": "High",
      "category": "Lifestyle",
      "userRelevance": "This is a concrete, accessible action you can start immediately without requiring external resources or major life changes"
    },
    {
      "action": "Try mindfulness meditation",
      "rationale": "Suggested as beginner-friendly approach",
      "nextSteps": [
        "Download a mindfulness app",
        "Start with 5-10 minute sessions",
        "Practice daily for 2 weeks"
      ],
      "confidence": "Med",
      "category": "Mental Health Practice",
      "userRelevance": "As someone struggling with work stress, this low-barrier practice could help you develop coping mechanisms before stress escalates"
    }
  ],
  "safetyFlags": [],
  "conversationHealth": {
    "qualityScore": "High",
    "suggestions": [
      "The discussion is constructive with diverse perspectives",
      "One area for growth: addressing the emergency/flexibility concern raised by Sam"
    ]
  }
}
```

### For Secondary User (Community Member)

When a community member who has already engaged views the topic, the LLM might return more engagement-focused insights:

```json
{
  "tldr": "Discussion about work-life balance with diverse approaches from hard boundaries to flexible strategies. You've already shared your perspective on flexibility.",
  "keyThemes": [
    "Boundary setting approaches",
    "Professional support resources",
    "Self-care practices",
    "Work emergency handling"
  ],
  "openQuestions": [
    "Are there specific mindfulness apps people recommend?",
    "How do others handle urgent work situations while maintaining boundaries?",
    "What therapists or services are affordable and accessible?"
  ],
  "consensus": [
    "Intentional strategies are needed to manage work stress",
    "Physical and mental wellness practices help"
  ],
  "disagreements": [
    "Your comment about needing flexibility contrasts with others advocating strict boundaries"
  ],
  "themes": [
    {
      "name": "Boundary Flexibility Debate",
      "sentiment": "neutral",
      "supportingCommentIds": ["c_001", "c_003"]
    },
    {
      "name": "Therapy & Professional Help",
      "sentiment": "positive",
      "supportingCommentIds": ["c_002"]
    },
    {
      "name": "Practical Wellness Activities",
      "sentiment": "positive",
      "supportingCommentIds": ["c_004", "c_005"]
    }
  ],
  "actionItems": [
    {
      "action": "Expand on your flexibility perspective",
      "rationale": "Your comment about work emergencies raises a valid counterpoint that others haven't fully addressed",
      "nextSteps": [
        "Share a specific example of when flexibility was crucial",
        "Suggest a balanced approach between boundaries and adaptability",
        "Ask others how they handle genuine emergencies"
      ],
      "confidence": "High",
      "category": "Engagement",
      "userRelevance": "You've already entered the conversation with a contrarian view - deepening it with specifics would add nuance many professionals need but aren't hearing"
    },
    {
      "action": "Connect with the author directly",
      "rationale": "As someone who values flexibility, you might benefit from 1-on-1 conversation to understand their specific situation",
      "nextSteps": [
        "Send a message offering to discuss flexible boundary strategies",
        "Share resources on adaptive time management",
        "Offer to be a sounding board"
      ],
      "confidence": "Med",
      "category": "Networking",
      "userRelevance": "Your validated and heard reactions show you're invested in this topic - a direct conversation could build a meaningful professional connection"
    },
    {
      "action": "Research and share practical resources",
      "rationale": "Multiple people asked about mindfulness apps - you could help by researching and sharing recommendations",
      "nextSteps": [
        "Test 2-3 popular mindfulness apps",
        "Write a brief comparison comment",
        "Include pros/cons for beginners"
      ],
      "confidence": "Med",
      "category": "Value Add",
      "userRelevance": "Since you've already engaged, providing concrete resources would position you as a helpful community member and benefit others who expressed this need"
    }
  ],
  "safetyFlags": [],
  "conversationHealth": {
    "qualityScore": "High",
    "suggestions": [
      "Your flexibility point creates healthy debate - consider elaborating with examples",
      "The thread would benefit from more voices addressing the emergency work question",
      "Consider sharing specific app recommendations since multiple people asked"
    ]
  }
}
```

Note how the secondary user response:
- Acknowledges their prior engagement ("You've already shared...")
- References their specific viewpoint ("your comment about flexibility")
- Suggests ways to deepen their contribution
- Recommends direct connections and resource sharing
- Focuses on how they can add unique value

## Response Processing

The Edge Function returns the raw OpenAI-compatible response:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "{\"tldr\":\"Discussion about work-life balance...\", ...}"
      },
      "finish_reason": "stop"
    }
  ],
  "model": "hugging-quants/Meta-Llama-3.1-8B-Instruct-AWQ-INT4",
  "usage": {
    "prompt_tokens": 1234,
    "completion_tokens": 567,
    "total_tokens": 1801
  }
}
```

The frontend:
1. Extracts `data.choices[0].message.content`
2. Strips markdown code fences if present
3. Parses as JSON
4. Displays insights in the Okestra panel

## Privacy & Safety Features

### Automatic Redaction
- LLM instructed to never quote >12 words verbatim
- Protects user privacy in summaries

### Safety Detection
- LLM flags: PII, threats, self-harm, harassment
- Helps moderators identify concerning content

### Engagement Weighting
- High-reaction comments prioritized in analysis
- Balances between popular and minority viewpoints

## Model Configuration

```typescript
{
  model: "hugging-quants/Meta-Llama-3.1-8B-Instruct-AWQ-INT4",
  messages: [
    { role: "system", content: OKESTRA_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(threadPayload) }
  ],
  max_tokens: 2048,
  temperature: 0.3  // Low temperature for consistent, factual output
}
```

## Error Handling

Common errors and their handling:

| Error | Cause | Frontend Behavior |
|-------|-------|------------------|
| `Failed to fetch` | CORS/Network (fixed by Edge Function) | Shows error in panel |
| `Invalid JSON response` | LLM output not valid JSON | Shows parsing error |
| `Missing credentials` | Edge Function env vars not set | Shows config error |
| `HTTP 401` | Invalid Supabase auth token | Re-authentication needed |
| `HTTP 500` | vLLM service down | Shows service unavailable |

## Testing

Use the "Test LLM" button (bottom right of dashboard) to verify:
- Edge Function connectivity
- Cloudflare Access authentication
- vLLM service availability
- Response parsing

## Example: Primary User Context

When the topic author requests insights, the payload includes:

```json
{
  "userContext": {
    "userId": "user_001",
    "userType": "primary",
    "topicAuthorContext": {
      "totalResponsesReceived": 5,
      "topEngagedCommentIds": ["c_002", "c_001", "c_004"],
      "hasOpenQuestions": true
    }
  }
}
```

The LLM then provides insights tailored to the author:
- Summarizes what their community is saying
- Highlights which responses got the most engagement
- Identifies unanswered questions they might want to address
- Suggests how to advance the conversation

## Example: Secondary User Context

When a community member views someone else's topic, the payload includes:

```json
{
  "userContext": {
    "userId": "user_12345",
    "userType": "secondary",
    "engagerContext": {
      "hasCommented": true,
      "commentIds": ["c_003"],
      "hasReacted": true,
      "reactionTypes": ["validated", "heard"]
    }
  }
}
```

The LLM then provides insights tailored to the viewer:
- Shows how the discussion has evolved since they last engaged
- Suggests ways they could add value with a comment
- Recommends related actions (mentorship connections, resources, etc.)
- Highlights perspectives they might find interesting

## Notes

- **Comments are flattened**: Nested replies are converted to a flat list for simpler LLM processing
- **IDs are normalized**: Comments get sequential IDs (`c_001`, `c_002`, etc.) for easier reference
- **Engagement signals**: Reaction counts help LLM prioritize key points without biasing toward popularity
- **Privacy first**: Anonymity flags and redaction rules protect user identity
- **Stateless**: Each analysis is independent; no conversation history maintained
- **User-aware**: Insights are personalized based on whether the requester is the topic author or a community member
