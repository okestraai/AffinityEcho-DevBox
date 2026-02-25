import { Topic, Comment } from '../types/forum';

const OKESTRA_SYSTEM_PROMPT = `You are Okestra, an AI assistant for Affinity Echo—an anonymous-first professional networking platform serving underrepresented communities in tech. Analyze discussion threads and generate actionable insights for career challenges, workplace dynamics, and professional growth.

## PLATFORM CONTEXT

Affinity Echo serves professionals facing underrepresentation, bias, limited networks, and isolation. Features: anonymous Forums, Nooks (temporary ephemeral discussions), Mentorship, Referrals, and encrypted Messaging. All interactions start anonymous—users control identity reveal.

## DATA

- **Forums**: Topics with title, content, author, reactions (seen/validated/inspired/heard), tags. Comments with helpful/supportive reactions. Scope: local (company) or global.
- **Nooks**: Temporary spaces with urgency (high/medium/low), temperature (hot/warm/cool), messages, expiration dates. Scope: global or company.
- **User context**: userType = "primary" (topic author) or "secondary" (engager via comments/reactions).

## TASK

Analyze the thread and generate: (1) concise summary, (2) key themes from discussion content, (3) consensus and disagreements, (4) unresolved open questions, (5) actionable suggestions tailored to userType.

## KEY THEMES

Extract from DISCUSSION CONTENT, not suggested actions. Themes = what people are talking about.
- 1 word preferred, 2 words max (e.g., "Isolation", "Recognition", "Career Growth")
- Must reflect discussion topics (e.g., "Bias", "Burnout"), NOT actions (e.g., "Documentation", "Escalation")
- Identify 3-5 themes with sentiment and supporting comment IDs

## SENTIMENT

Use ONLY: "Positive", "Neutral", "Negative"

- **Positive**: Supportive, encouraging, constructive problem-solving, solidarity—even when discussing challenges
- **Neutral**: Informational, balanced, exploratory, mixed emotions
- **Negative**: Frustration, discouragement, venting without constructive element, hopelessness

Key: Topic negativity ≠ sentiment negativity. A thread about bias can have Positive sentiment if responses are supportive. Advice-giving is Positive/Neutral even if the situation is bad.

- **overallSentiment**: Dominant tone of the entire thread
- **themes[].sentiment**: Tone for that specific topic (can differ from overall)

## ACTION ITEMS

Write as direct second-person imperatives. Rationales must be direct AI insights—NEVER reference commenters, posters, participants, the discussion, or comment IDs (c_001 etc.).

**Format:**
- "action": Short imperative title (3-6 words)
- "rationale": 2-3 sentences explaining WHY this helps. Direct insight only. No "commenters suggested...", "the thread shows...", "based on the discussion...".
- "nextSteps": 3-5 concrete steps with specifics (scripts, timelines, deliverables where helpful)

Good: "Keeping a detailed record of incidents—including dates, times, and witnesses—helps establish patterns and provides concrete evidence if escalation becomes necessary."

**For PRIMARY users (topic authors):**
- Synthesize into clear actions with concrete next steps and timelines ("before your next 1:1", "within 48 hours")
- Acknowledge power dynamics, risks of escalation, and protective measures
- Include both majority and minority viewpoints

**For SECONDARY users (engagers):**
- Identify what specific perspective, experience, or question they can contribute
- Name exactly what to share or ask—never meta-advice like "consider contributing"

**Confidence**: High = broadly supported, low risk. Med = has tradeoffs or context-dependent. Low = speculative or high-risk.

## SAFETY

Flag if detected: PII, SELF_HARM, HARASSMENT, THREAT, CRISIS

## PRIVACY

- Never quote >12 verbatim words from any comment
- Never suggest identity reveal unless in trusted connections context
- Paraphrase and synthesize; protect anonymity

## DOMAIN GUIDANCE

- **Promotion**: "Vague feedback" often signals bias; suggest documentation, sponsorship (not just mentorship), skip-levels
- **Bias/Microaggressions**: Validate patterns; include protective strategies alongside confrontation; acknowledge risks of speaking up; build alliances before escalating
- **Job Search/Referrals**: Leverage platform referral marketplace; emphasize credibility-building
- **Mentorship**: Distinguish mentorship (advice) from sponsorship (advocacy); suggest specific asks
- **Workplace Culture**: "Culture fit" may mask bias; exit planning is valid; document for legal purposes

## OUTPUT SCHEMA

Return ONLY valid JSON. No markdown, no commentary.

{
  "tldr": "1-2 sentence summary",
  "overallSentiment": "Positive | Neutral | Negative",
  "keyThemes": ["TopicWord", "DiscussionTopic"],
  "themes": [
    { "name": "TopicWord", "sentiment": "Positive | Neutral | Negative", "supportingCommentIds": ["c_001"] }
  ],
  "actionItems": [
    {
      "action": "3-6 word imperative",
      "rationale": "Direct AI insight, no references to commenters or comment IDs",
      "nextSteps": ["Step 1", "Step 2", "Step 3"],
      "confidence": "Low | Med | High",
      "category": "Category"
    }
  ],
  "safetyFlags": []
}

Return ONLY the JSON object.`;

interface OkestraLLMResponse {
  tldr: string;
  overallSentiment: string;
  keyThemes: string[];
  themes: {
    name: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    supportingCommentIds: string[];
  }[];
  actionItems: {
    action: string;
    rationale: string;
    nextSteps: string[];
    confidence: 'Low' | 'Med' | 'High';
    category: string;
  }[];
  safetyFlags: string[];
}

function flattenComments(comments: Comment[]): Comment[] {
  const result: Comment[] = [];
  
  const traverse = (commentsList: Comment[]) => {
    commentsList.forEach((comment) => {
      result.push(comment);
      if (comment.replies && comment.replies.length > 0) {
        traverse(comment.replies);
      }
    });
  };
  
  traverse(comments);
  return result;
}

function truncateContent(content: string, maxLength: number = 500): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '...';
}

interface UserContext {
  userId: string;
  userType: string;
  topicAuthorContext?: {
    totalResponsesReceived: number;
    topEngagedCommentIds: string[];
    hasOpenQuestions: boolean;
  };
  engagerContext?: {
    hasCommented: boolean;
    commentIds?: string[];
    hasReacted: boolean;
    reactionTypes?: string[];
  };
}

function buildThreadPayload(topic: Topic, comments: Comment[], currentUserId: string) {
  const allComments = flattenComments(comments);
  
  const commentsPayload = allComments.map((comment, index) => ({
    id: `c_${String(index + 1).padStart(3, '0')}`,
    author: comment.author?.username || 'Anonymous',
    content: truncateContent(comment.content),
    reactions: (comment.reactions?.helpful || 0) + (comment.reactions?.supportive || 0)
  }));

  const isPrimaryUser = topic.author?.id === currentUserId;
  const userType = isPrimaryUser ? 'primary' : 'secondary';

  const userContext: UserContext = {
    userId: currentUserId,
    userType
  };

  if (isPrimaryUser) {
    const topEngagedComments = [...allComments]
      .sort((a, b) => {
        const aReactions = (a.reactions?.helpful || 0) + (a.reactions?.supportive || 0);
        const bReactions = (b.reactions?.helpful || 0) + (b.reactions?.supportive || 0);
        return bReactions - aReactions;
      })
      .slice(0, 5);
    
    const topEngagedIds = topEngagedComments.map((c) => {
      const idx = allComments.indexOf(c);
      return `c_${String(idx + 1).padStart(3, '0')}`;
    });

    const hasQuestionMarks = allComments.some((c) => c.content.includes('?'));

    userContext.topicAuthorContext = {
      totalResponsesReceived: allComments.length,
      topEngagedCommentIds: topEngagedIds,
      hasOpenQuestions: hasQuestionMarks
    };
  } else {
    const userComments = allComments
      .map((comment, index) => ({ comment, originalIndex: index }))
      .filter(({ comment }) => comment.author?.id === currentUserId);

    const userCommentIds = userComments.map(({ originalIndex }) =>
      `c_${String(originalIndex + 1).padStart(3, '0')}`
    );

    const reactionTypes: string[] = [];
    if (topic.userReactions?.seen) reactionTypes.push('seen');
    if (topic.userReactions?.validated) reactionTypes.push('validated');
    if (topic.userReactions?.inspired) reactionTypes.push('inspired');
    if (topic.userReactions?.heard) reactionTypes.push('heard');

    userContext.engagerContext = {
      hasCommented: userComments.length > 0,
      commentIds: userComments.length > 0 ? userCommentIds : undefined,
      hasReacted: reactionTypes.length > 0,
      reactionTypes: reactionTypes.length > 0 ? reactionTypes : undefined
    };
  }

  return {
    userContext,
    topic: {
      title: topic.title,
      content: truncateContent(topic.content, 1000),
      author: topic.author?.username || 'Anonymous',
      tags: topic.tags,
      commentCount: allComments.length
    },
    thread: {
      comments: commentsPayload
    }
  };
}

function getFallbackResponse(): OkestraLLMResponse {
  return {
    tldr: "Analysis unavailable - the AI response could not be processed. Please try again.",
    overallSentiment: "Neutral",
    keyThemes: [],
    themes: [],
    actionItems: [],
    safetyFlags: []
  };
}

function parseJsonResponse(content: string): OkestraLLMResponse {
  let cleanContent = content.trim();
  
  // Remove markdown code fences
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.slice(7);
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.slice(3);
  }
  if (cleanContent.endsWith('```')) {
    cleanContent = cleanContent.slice(0, -3);
  }
  cleanContent = cleanContent.trim();
  
  // Extract JSON object if there's extra text
  const jsonStartIndex = cleanContent.indexOf('{');
  const jsonEndIndex = cleanContent.lastIndexOf('}');
  
  if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex <= jsonStartIndex) {
    console.error('[Okestra] No valid JSON object found in response');
    throw new Error('No JSON object found');
  }
  
  const extractedJson = cleanContent.substring(jsonStartIndex, jsonEndIndex + 1);

  const parsed = JSON.parse(extractedJson);
  
  // Validate and set defaults for required fields
  return {
    tldr: parsed.tldr || "Thread analysis completed.",
    overallSentiment: parsed.overallSentiment || "Neutral",
    keyThemes: Array.isArray(parsed.keyThemes) ? parsed.keyThemes : [],
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    safetyFlags: Array.isArray(parsed.safetyFlags) ? parsed.safetyFlags : [],
  };
}

export async function analyzeThreadWithLLM(
  topic: Topic,
  comments: Comment[],
  currentUserId: string
): Promise<OkestraLLMResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  const threadPayload = buildThreadPayload(topic, comments, currentUserId);

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/okestra-llm`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        threadPayload,
        systemPrompt: OKESTRA_SYSTEM_PROMPT
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMessage = errorData.error || 'Edge Function error: ' + response.status;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Check for error in response
    if (data.error) {
      const errorMsg = data.error.message || String(data.error);
      throw new Error('LLM Error: ' + errorMsg);
    }

    // Verify expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return getFallbackResponse();
    }

    const content = data.choices[0].message.content;

    if (!content) {
      return getFallbackResponse();
    }

    try {
      const parsed = parseJsonResponse(content);
      return parsed;
    } catch {
      return getFallbackResponse();
    }

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error connecting to LLM service');
  }
}