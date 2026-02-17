export async function testLLMConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('[LLM Test] Starting connection test via Edge Function...');
  console.log('[LLM Test] Configuration:');
  console.log('  - VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.log('  - VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'SET (hidden)' : 'NOT SET');

  if (!supabaseUrl || !supabaseKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
    if (!supabaseKey) missing.push('VITE_SUPABASE_ANON_KEY');

    return {
      success: false,
      message: `Missing environment variables: ${missing.join(', ')}`,
      details: { missing }
    };
  }

  try {
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/okestra-llm`;
    console.log('[LLM Test] Attempting to connect to Edge Function:', edgeFunctionUrl);

    const testPayload = {
      threadPayload: {
        request: { requestId: 'test', timestamp: new Date().toISOString(), userId: 'test' },
        topic: {
          id: 'test',
          title: 'Test Topic',
          content: { body: 'This is a test' },
          author: { displayName: 'Test User', isAnonymous: false },
          tags: ['test'],
          timestamps: { created: new Date().toISOString(), lastActivity: new Date().toISOString() },
          engagement: { views: 0, commentCount: 0, totalReactions: 0, reactionsByType: {} }
        },
        thread: { comments: [], statistics: { totalComments: 0, maxDepth: 0, mostEngaged: [] } },
        weightingHints: { useEngagementAsSignal: true, signalGuidance: [] },
        privacyAndSafety: { redactionRules: [], policyHints: [] }
      },
      systemPrompt: 'You are a helpful assistant. Respond with valid JSON containing: {"tldr": "Test successful", "keyThemes": ["test"], "openQuestions": [], "consensus": [], "disagreements": [], "themes": [], "actionItems": [], "safetyFlags": []}'
    };

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(testPayload)
    });

    console.log('[LLM Test] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(async () => {
        const text = await response.text();
        return { error: text || 'Unknown error' };
      });
      console.error('[LLM Test] Error response:', errorData);

      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        }
      };
    }

    const data = await response.json();
    console.log('[LLM Test] Response data:', data);

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      console.log('[LLM Test] LLM response:', content);

      return {
        success: true,
        message: 'Connection successful! LLM is responding via Edge Function.',
        details: {
          response: content.substring(0, 200),
          model: data.model,
          usage: data.usage,
          via: 'Supabase Edge Function'
        }
      };
    } else {
      return {
        success: false,
        message: 'Unexpected response format from LLM',
        details: data
      };
    }
  } catch (error) {
    console.error('[LLM Test] Connection error:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown connection error',
      details: {
        error: error instanceof Error ? error.toString() : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    };
  }
}

export function logEnvironmentVariables() {
  console.group('[Environment Variables]');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'NOT SET');
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
  console.log('Note: LLM credentials (CF_ACCESS_CLIENT_ID/SECRET) are now securely stored in the Edge Function');
  console.groupEnd();
}
