import { useState, useEffect } from "react";
import {
  Timer,
  Users,
  MessageCircle,
  Lock,
  Flame,
  Zap,
  Eye,
  AlertCircle,
  ScanEye,
  Sparkles,
} from "lucide-react";
import { NookMessage } from "./NookMessage";
import { NookMessageInput } from "./NookMessageInput";
import {
  GetNookMessagesByNookId,
  PostNookMessageByNookId,
  toggleMessageReaction, // ← Use the toggle function (POST only)
} from "../../../../api/nookApis";

import { NookMessageSkeleton } from "../../../Helper/SkeletonLoader";
import { showToast } from "../../../Helper/ShowToast";
import { OkestraPanel } from '../OkestraPanel';
import { Topic, Comment } from '../../../types/forum';

interface NookDetailProps {
  nook: {
    id: string;
    title: string;
    description: string;
    members_count: number;
    messages_count: number;
    timeLeft: string;
    temperature: string;
    isMember: boolean;
    isCreator: boolean;
  };
  userAvatar: string;
  currentUserId: string;
  onBack: () => void;
  onUserClick: (userId: string) => void;
  onNookUpdated?: () => void;
}

export function NookDetail({
  nook,
  userAvatar,
  currentUserId,
  onBack,
  onUserClick,
  onNookUpdated,
}: NookDetailProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToContent, setReplyingToContent] = useState<string>("");
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>(
    {}
  );
  const [localMemberCount] = useState(nook.members_count);
    const [showOkestraPanel, setShowOkestraPanel] = useState(false);
  const [localMessageCount, setLocalMessageCount] = useState(
    nook.messages_count
  );

  const getTemperatureIcon = (temperature: string) => {
    switch (temperature) {
      case "hot":
        return <Flame className="w-4 h-4 text-red-500" />;
      case "warm":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "cool":
        return <Eye className="w-4 h-4 text-white" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [nook.id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await GetNookMessagesByNookId(nook.id, {
        sortOrder: "asc",
        limit: 50,
      });

      const messagesData = response?.messages || [];
      setMessages(messagesData);

      // Build current user's reactions map
      const reactionsMap: Record<string, string[]> = {};
      messagesData.forEach((msg: any) => {
        if (msg.user_reactions) {
          reactionsMap[msg.id] = msg.user_reactions
            .filter((r: any) => r.user_id === currentUserId)
            .map((r: any) => r.reaction_type);
        } else {
          reactionsMap[msg.id] = [];
        }
      });
      setUserReactions(reactionsMap);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError(err.response?.data?.error?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const payload: any = {
        content,
        is_anonymous: true,
      };

      if (replyingTo) payload.parent_message_id = replyingTo;

      const optimisticId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: optimisticId,
        content,
        user_id: currentUserId,
        nook_id: nook.id,
        created_at: new Date().toISOString(),
        parent_message_id: replyingTo || null,
        heard_count: 0,
        validated_count: 0,
        helpful_count: 0,
        user: { avatar: userAvatar || "?", username: "Anonymous" },
        replies: [],
        user_reactions: [],
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setLocalMessageCount((prev) => prev + 1);
      cancelReply();

      // Auto-scroll
      setTimeout(() => {
        document.querySelector(".space-y-4.mb-6")?.scrollTo({
          top: document.querySelector(".space-y-4.mb-6")!.scrollHeight,
          behavior: "smooth",
        });
      }, 100);

      const response = await PostNookMessageByNookId(nook.id, payload);

      const realMessage = response?.message;
      if (realMessage) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? realMessage : m))
        );
        setUserReactions((prev) => ({ ...prev, [realMessage.id]: [] }));
        onNookUpdated?.();
      } else {
        // Rollback on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setLocalMessageCount((prev) => prev - 1);
        throw new Error("Message send failed");
      }
    } catch (err: any) {
      console.error("Send message error:", err);
      showToast(err.response?.data?.error?.message || "Failed to send message", "error");
      setLocalMessageCount((prev) => prev - 1);
    }
  };

  const handleReact = async (messageId: string, reactionType: string) => {
    const current = userReactions[messageId] || [];
    const isRemoving = current.includes(reactionType);

    // Optimistic update
    setUserReactions((prev) => ({
      ...prev,
      [messageId]: isRemoving
        ? current.filter((r) => r !== reactionType)
        : [...current, reactionType],
    }));

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              [`${reactionType}_count`]:
                (msg[`${reactionType}_count`] || 0) + (isRemoving ? -1 : 1),
            }
          : msg
      )
    );

    try {
      // Use toggle endpoint (same POST for add & remove)
      await toggleMessageReaction(messageId, { reaction_type: reactionType });
    } catch (err: any) {
      console.error("Reaction error:", err);
      showToast(err.response?.data?.error?.message || "Failed to update reaction", "error");

      // Revert on error
      await fetchMessages();
    }
  };

  const handleReply = (messageId: string, content: string) => {
    if (replyingTo === messageId) {
      cancelReply();
    } else {
      setReplyingTo(messageId);
      setReplyingToContent(content);
      setTimeout(() => {
        document.querySelector(".message-input")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyingToContent("");
  };

  // ── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={onBack}
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl"
            >
              ← Back to Nooks
            </button>
            <div className="flex items-center gap-2">
              {getTemperatureIcon(nook.temperature)}
              <span className="capitalize font-medium">{nook.temperature}</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">{nook.title}</h1>
          <p className="text-purple-100 mb-4">{nook.description}</p>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              <span>Expires in {nook.timeLeft}</span>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{localMemberCount} anonymous</span>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{localMessageCount} messages</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
              <ScanEye className="w-3 h-3" />
              <span>{localMessageCount} views</span>
            </div>

             <button
                  onClick={() => setShowOkestraPanel(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all font-medium group"
                  title="Get AI insights from Okestra"
                >
                  <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                  <span className="text-sm">AI Insights</span>
                </button>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border-t border-yellow-200 text-sm text-yellow-800 font-medium flex items-center gap-2">
          <Lock className="w-4 h-4" />
          This nook auto-deletes in {nook.timeLeft} • Messages are anonymous
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4 mb-8">
          <NookMessageSkeleton />
          <NookMessageSkeleton />
          <NookMessageSkeleton />
        </div>
      )}

      {!loading && messages.length > 0 && (
        <div className="space-y-5 mb-8">
          {messages.map((msg) => (
            <NookMessage
              key={msg.id}
              message={msg}
              currentUserId={currentUserId}
              userReactions={userReactions[msg.id] || []}
              onUserClick={onUserClick}
              onReact={handleReact}
              onReply={handleReply}
              isReplying={replyingTo === msg.id}
            />
          ))}
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border mb-8">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-600 mb-2">No messages yet</h3>
          <p className="text-gray-400">Be the first to speak</p>
        </div>
      )}

      {replyingTo && (
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4 rounded-r-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-semibold text-purple-700 uppercase mb-1">
                Replying to
              </div>
              <p className="text-gray-700 line-clamp-2">{replyingToContent}</p>
            </div>
            <button
              onClick={cancelReply}
              className="text-purple-600 hover:text-purple-800 p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="message-input sticky bottom-0 bg-white pt-4 pb-6 border-t">
        <NookMessageInput
          nookId={nook.id}
          userAvatar={userAvatar}
          timeLeft={nook.timeLeft}
          onSendMessage={handleSendMessage}
          replyingTo={replyingTo}
          onCancelReply={cancelReply}
        />
      </div>

      {/* Okestra AI Insights Panel */}
      {showOkestraPanel && (() => {
        // Transform nook data to Topic format
        const topicData: Topic = {
          id: nook.id,
          title: nook.title,
          content: nook.description,
          author: {
            id: 'anonymous',
            username: 'Anonymous',
            avatar: '🔒'
          },
          forumId: 'nook',
          scope: 'global',
          reactions: {
            seen: nook.members_count || 0,
            validated: Math.floor((nook.messages_count || 0) * 0.3),
            inspired: Math.floor((nook.messages_count || 0) * 0.2),
            heard: Math.floor((nook.messages_count || 0) * 0.4)
          },
          userReactions: {
            seen: false,
            validated: false,
            inspired: false,
            heard: false
          },
          commentCount: nook.messages_count || 0,
          createdAt: new Date(),
          lastActivity: new Date(),
          isPinned: false,
          tags: []
        };

        // Transform messages to Comment format
        const commentsData: Comment[] = messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          author: {
            id: msg.user_id || 'anonymous',
            username: msg.user?.username || 'Anonymous',
            avatar: msg.user?.avatar || '🔒'
          },
          topicId: nook.id,
          reactions: {
            helpful: msg.helpful_count || 0,
            supportive: msg.validated_count || 0
          },
          userReactions: {
            helpful: (userReactions[msg.id] || []).includes('helpful'),
            supportive: (userReactions[msg.id] || []).includes('validated')
          },
          createdAt: new Date(msg.created_at),
          replies: msg.replies || []
        }));

        return (
          <OkestraPanel
            isOpen={showOkestraPanel}
            onClose={() => setShowOkestraPanel(false)}
            topic={topicData}
            comments={commentsData}
          />
        );
      })()}
    </div>
  );
}
