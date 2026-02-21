import React, { useState, useEffect } from 'react';
import { X, Sparkles, Lightbulb, CheckCircle2, Loader2, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Topic, Comment } from '../../types/forum';
import { analyzeThreadWithLLM } from '../../lib/okestraLLM';
import { useAuth } from '../../hooks/useAuth';

interface OkestraPanelProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic;
  comments: Comment[];
}

interface OkestraInsight {
  summary: string;
  keyThemes: string[];
  actionItems: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    action?: () => void;
    actionType?: 'navigate' | 'external' | 'none';
  }[];
  sentiment: 'positive' | 'neutral' | 'concerned' | 'supportive';
}

export function OkestraPanel({ isOpen, onClose, topic, comments }: OkestraPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<OkestraInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isNook = topic.forumId === 'nook';
  const contentRoute = isNook
    ? `/dashboard/nooks/${topic.id}`
    : `/dashboard/forums/topic/${topic.id}`;
  const contentLabel = isNook ? 'Nook' : 'Topic';

  useEffect(() => {
    if (isOpen && topic) {
      generateInsight();
    }
  }, [isOpen, topic, comments]);

  const generateInsight = async () => {
    setLoading(true);
    setError(null);

    console.log('[OkestraPanel] Starting insight generation...');
    console.log('[OkestraPanel] Topic:', topic.title);
    console.log('[OkestraPanel] Comments count:', comments.length);

    try {
      console.log('[OkestraPanel] Calling analyzeThreadWithLLM...');
      const currentUserId = user?.id || 'anonymous';
      const llmResponse = await analyzeThreadWithLLM(topic, comments, currentUserId);
      console.log('[OkestraPanel] Received LLM response:', llmResponse);

      const transformedInsight: OkestraInsight = {
        summary: llmResponse.tldr,
        keyThemes: llmResponse.keyThemes,
        actionItems: llmResponse.actionItems.map(item => ({
          title: item.action,
          description: item.rationale,
          priority: item.confidence === 'High' ? 'high' : item.confidence === 'Med' ? 'medium' : 'low',
          action: item.category === 'documentation' || item.category === 'process' || item.category === 'communication'
            ? () => {
                onClose();
                navigate(contentRoute);
              }
            : undefined,
          actionType: 'navigate' as const
        })),
        sentiment: determineSentimentFromThemes(llmResponse.themes)
      };

      console.log('[OkestraPanel] Transformed insight:', transformedInsight);
      setInsight(transformedInsight);
    } catch (err) {
      console.error('[OkestraPanel] Failed to generate insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');

      const allComments = getAllComments(comments);
      const totalEngagement = topic.reactions.seen + topic.reactions.validated +
                             topic.reactions.inspired + topic.reactions.heard;

      const fallbackInsight: OkestraInsight = {
        summary: generateSummary(topic, allComments),
        keyThemes: extractKeyThemes(topic, allComments),
        actionItems: generateActionItems(topic, allComments, totalEngagement),
        sentiment: determineSentiment(topic, allComments)
      };

      setInsight(fallbackInsight);
    } finally {
      setLoading(false);
    }
  };

  const getAllComments = (commentsList: Comment[]): Comment[] => {
    const result: Comment[] = [];
    const traverse = (comments: Comment[]) => {
      comments.forEach(comment => {
        result.push(comment);
        if (comment.replies && comment.replies.length > 0) {
          traverse(comment.replies);
        }
      });
    };
    traverse(commentsList);
    return result;
  };

  const generateSummary = (topic: Topic, allComments: Comment[]): string => {
    const commentCount = allComments.length;
    const hasHighEngagement = (topic.reactions.seen + topic.reactions.validated +
                                topic.reactions.inspired + topic.reactions.heard) > 20;

    if (commentCount === 0) {
      return `This topic titled "${topic.title}" focuses on ${topic.tags.join(', ')}. While it hasn't received comments yet, it has generated ${topic.reactions.seen} views and meaningful reactions from the community, indicating strong interest in this subject.`;
    }

    if (commentCount < 3) {
      return `This discussion about "${topic.title}" has sparked initial engagement with ${commentCount} thoughtful response${commentCount === 1 ? '' : 's'}. The conversation explores ${topic.tags.slice(0, 2).join(' and ')}, with community members sharing ${hasHighEngagement ? 'considerable interest' : 'growing interest'} in the topic.`;
    }

    if (commentCount < 10) {
      return `This active discussion on "${topic.title}" has generated ${commentCount} responses, creating a meaningful dialogue around ${topic.tags.slice(0, 2).join(' and ')}. Community members are sharing diverse perspectives, experiences, and insights that enrich the conversation. The engagement level suggests this resonates with many professionals facing similar challenges.`;
    }

    return `This highly engaged discussion on "${topic.title}" has sparked ${commentCount} comments, demonstrating significant community interest. The conversation covers multiple dimensions of ${topic.tags.slice(0, 2).join(' and ')}, with participants actively sharing experiences, offering advice, and building on each other's insights. This level of engagement indicates a topic that deeply resonates across the community.`;
  };

  const extractKeyThemes = (topic: Topic, allComments: Comment[]): string[] => {
    const themes: string[] = [];

    const contentLower = (topic.content + ' ' + allComments.map(c => c.content).join(' ')).toLowerCase();

    const themeKeywords = {
      'Career Advancement': ['promotion', 'career', 'advancement', 'growth', 'level up', 'senior', 'leadership'],
      'Work-Life Balance': ['balance', 'burnout', 'wellbeing', 'mental health', 'stress', 'time', 'overwhelm'],
      'Bias & Inclusion': ['bias', 'microaggression', 'discrimination', 'inclusion', 'diverse', 'equity', 'belonging'],
      'Mentorship': ['mentor', 'guidance', 'advice', 'support', 'learning', 'coaching'],
      'Networking': ['network', 'connect', 'relationship', 'sponsor', 'visibility'],
      'Skill Development': ['skill', 'learn', 'develop', 'improve', 'training', 'course', 'certification'],
      'Compensation': ['salary', 'compensation', 'pay', 'raise', 'equity', 'bonus'],
      'Team Dynamics': ['team', 'collaboration', 'colleague', 'manager', 'culture', 'environment']
    };

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        themes.push(theme);
      }
    });

    const topicThemes = topic.tags.filter(tag =>
      !themes.some(theme => theme.toLowerCase().includes(tag.toLowerCase()))
    ).slice(0, 2);

    themes.push(...topicThemes.map(tag =>
      tag.charAt(0).toUpperCase() + tag.slice(1)
    ));

    return themes.slice(0, 4);
  };

  const generateActionItems = (
    topic: Topic,
    allComments: Comment[],
    engagement: number
  ): OkestraInsight['actionItems'] => {
    const actions: OkestraInsight['actionItems'] = [];
    const contentLower = (topic.content + ' ' + allComments.map(c => c.content).join(' ')).toLowerCase();

    if (allComments.length === 0) {
      actions.push({
        title: 'Start the Conversation',
        description: 'Be the first to share your perspective or experience on this topic. Your insights could help others facing similar situations.',
        priority: 'high',
        action: () => {
          onClose();
          navigate(contentRoute);
        },
        actionType: 'navigate'
      });
    } else if (allComments.length < 3) {
      actions.push({
        title: 'Add Your Voice',
        description: 'This conversation is just beginning. Share your thoughts to help build a richer discussion.',
        priority: 'medium',
        action: () => {
          onClose();
          navigate(contentRoute);
        },
        actionType: 'navigate'
      });
    }

    if (contentLower.includes('advice') || contentLower.includes('help') || contentLower.includes('suggestion')) {
      actions.push({
        title: 'Offer Guidance',
        description: 'The author is seeking advice. If you have relevant experience, consider sharing practical insights or lessons learned.',
        priority: 'high',
        action: () => {
          onClose();
          navigate(contentRoute);
        },
        actionType: 'navigate'
      });
    }

    if (contentLower.includes('mentor') || contentLower.includes('guidance') || contentLower.includes('coaching')) {
      actions.push({
        title: 'Explore Mentorship',
        description: 'This topic relates to mentorship. Visit the Mentorship section to connect with professionals who can provide ongoing guidance.',
        priority: 'high',
        action: () => {
          onClose();
          navigate('/dashboard/mentorship');
        },
        actionType: 'navigate'
      });
    }

    if (contentLower.includes('connect') || contentLower.includes('network') || contentLower.includes('similar')) {
      actions.push({
        title: 'Connect with Participants',
        description: 'Consider reaching out to commenters who shared valuable insights. Building connections strengthens your professional network.',
        priority: 'medium',
        action: () => {
          onClose();
          navigate('/dashboard/messages');
        },
        actionType: 'navigate'
      });
    }

    if (engagement > 15 || allComments.length > 5) {
      actions.push({
        title: 'Follow the Discussion',
        description: 'This is a highly engaging topic. Bookmark it to stay updated as new insights emerge.',
        priority: 'medium',
        action: () => {
          onClose();
          navigate(contentRoute);
        },
        actionType: 'navigate'
      });
    }

    if (topic.tags.some(tag => ['career-growth', 'promotion', 'leadership'].includes(tag.toLowerCase()))) {
      actions.push({
        title: 'Document Insights',
        description: 'This discussion contains valuable career development insights. Consider taking notes for your professional development plan.',
        priority: 'low',
        actionType: 'none'
      });
    }

    if (actions.length === 0) {
      actions.push({
        title: 'Engage Thoughtfully',
        description: 'Read through the discussion carefully and share reactions that validate meaningful contributions.',
        priority: 'medium',
        action: () => {
          onClose();
          navigate(contentRoute);
        },
        actionType: 'navigate'
      });
    }

    return actions.slice(0, 4);
  };

  const determineSentimentFromThemes = (themes: { name: string; sentiment: 'positive' | 'neutral' | 'negative' }[]): OkestraInsight['sentiment'] => {
    if (!themes || themes.length === 0) return 'neutral';

    const sentimentCounts = themes.reduce((acc, theme) => {
      acc[theme.sentiment] = (acc[theme.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (sentimentCounts.positive && sentimentCounts.positive > (sentimentCounts.negative || 0)) {
      return sentimentCounts.positive > 2 ? 'supportive' : 'positive';
    }
    if (sentimentCounts.negative && sentimentCounts.negative > (sentimentCounts.positive || 0)) {
      return 'concerned';
    }
    return 'neutral';
  };

  const determineSentiment = (topic: Topic, allComments: Comment[]): OkestraInsight['sentiment'] => {
    const contentLower = (topic.content + ' ' + allComments.map(c => c.content).join(' ')).toLowerCase();

    const supportiveWords = ['support', 'help', 'understand', 'appreciate', 'thank', 'grateful', 'agree', 'yes', 'definitely'];
    const concernedWords = ['worry', 'concern', 'difficult', 'struggle', 'challenge', 'hard', 'frustrated', 'unfair'];
    const positiveWords = ['great', 'excellent', 'love', 'amazing', 'wonderful', 'excited', 'happy', 'success'];

    const supportiveCount = supportiveWords.filter(word => contentLower.includes(word)).length;
    const concernedCount = concernedWords.filter(word => contentLower.includes(word)).length;
    const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;

    if (supportiveCount > concernedCount && supportiveCount > 2) return 'supportive';
    if (positiveCount > concernedCount && positiveCount > 2) return 'positive';
    if (concernedCount > supportiveCount && concernedCount > 2) return 'concerned';
    return 'neutral';
  };

  const getSentimentColor = (sentiment: OkestraInsight['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'supportive': return 'text-blue-600 bg-blue-50';
      case 'concerned': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end">
      <div
        className="bg-white h-full w-full md:w-[600px] shadow-2xl overflow-y-auto animate-slide-in-right"
        style={{
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}</style>

        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 shadow-lg z-10">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Okestra AI</h2>
                <p className="text-indigo-100 text-xs sm:text-sm">{contentLabel} Insights & Actions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close Okestra panel"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && !loading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 mb-1">Using Fallback Analysis</p>
                  <p className="text-xs text-yellow-700 mb-2">Connected to local analysis. LLM insights will be available when the service is accessible.</p>
                  <details className="text-xs text-yellow-600">
                    <summary className="cursor-pointer font-medium hover:text-yellow-800">Technical Details</summary>
                    <p className="mt-2 font-mono text-[10px] bg-yellow-100 p-2 rounded border border-yellow-300 break-all">
                      {error}
                    </p>
                  </details>
                </div>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Analyzing discussion with AI...</p>
              <p className="text-gray-400 text-sm mt-2">Reading {comments.length} comment{comments.length === 1 ? '' : 's'}</p>
            </div>
          ) : insight ? (
            <>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 sm:p-4 border border-indigo-200">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">{contentLabel} Overview</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{insight.summary}</p>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Sentiment:</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getSentimentColor(insight.sentiment)}`}>
                    {insight.sentiment.charAt(0).toUpperCase() + insight.sentiment.slice(1)}
                  </span>
                </div>
              </div>

              {insight.keyThemes.length > 0 && (
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">Key Themes</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insight.keyThemes.map((theme, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Suggested Actions</h3>
                </div>
                <div className="space-y-3">
                  {insight.actionItems.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => action.action && action.action()}
                      disabled={!action.action}
                      className={`w-full text-left bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-all group ${
                        action.action ? 'cursor-pointer hover:border-indigo-300' : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-6 h-6 rounded-full border-2 ${getPriorityColor(action.priority)} flex items-center justify-center text-xs font-bold`}>
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {action.title}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getPriorityColor(action.priority)}`}>
                              {action.priority}
                            </span>
                            {action.actionType === 'navigate' && (
                              <ArrowRight className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                            )}
                            {action.actionType === 'external' && (
                              <ExternalLink className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 sm:p-4 border border-indigo-200">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-gray-700">
                    <p className="font-medium text-gray-900 mb-1 text-sm sm:text-base">About Okestra AI</p>
                    <p className="text-xs leading-relaxed">
                      Okestra analyzes discussion content, engagement patterns, and community sentiment to provide personalized insights and actionable recommendations. These suggestions are designed to help you engage more meaningfully with the Affinity Echo community.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
