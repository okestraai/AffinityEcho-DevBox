import {
  Heart,
  ThumbsUp,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

interface NookMessageProps {
  message: {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    heard_count: number;
    validated_count: number;
    helpful_count: number;
    user?: {
      avatar: string;
      username: string;
      display_name?: string;
    } | null;
    replies?: any[];
  };
  currentUserId?: string;
  userReactions?: string[]; // reactions for current user on this message
  onUserClick: (userId: string) => void;
  onReact: (messageId: string, reactionType: string) => void;
  onReply: (messageId: string, messageContent: string) => void;
  isReplying?: boolean;
}

export function NookMessage({
  message,
  currentUserId,
  userReactions = [],
  onUserClick,
  onReact,
  onReply,
  isReplying = false,
}: NookMessageProps) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = !!message.replies && message.replies.length > 0;

  // Safe user data with fallbacks
  const user = message.user ?? null;
  const displayName = user?.display_name || user?.username || "Anonymous";
  const avatar = user?.avatar ?? "A"; // fallback character
  const isAnonymous = displayName === "Anonymous" || !user;

  const getAvatarColor = (avatarChar: string) => {
    const colors = [
      "from-red-400 to-pink-400",
      "from-blue-400 to-indigo-400",
      "from-green-400 to-emerald-400",
      "from-yellow-400 to-orange-400",
      "from-purple-400 to-pink-400",
      "from-gray-500 to-gray-700", // extra fallback
    ];
    const index = avatarChar.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const hasReacted = (reactionType: string): boolean => {
    return userReactions.includes(reactionType);
  };

  const getReactionCount = (reactionType: string): number => {
    return (
      {
        heard: message.heard_count || 0,
        validated: message.validated_count || 0,
        helpful: message.helpful_count || 0,
      }[reactionType] || 0
    );
  };

  const toggleReplies = () => setShowReplies(!showReplies);

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border transition-all duration-200 ${
        isReplying
          ? "border-purple-500 ring-2 ring-purple-100 bg-gradient-to-r from-purple-50 to-white"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <button
          onClick={() => !isAnonymous && onUserClick(message.user_id)}
          className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(
            avatar
          )} rounded-full flex items-center justify-center text-white font-bold hover:scale-105 transition-transform ${
            !isAnonymous ? "cursor-pointer" : "cursor-default"
          } shadow-md`}
          disabled={isAnonymous}
        >
          {avatar[0].toUpperCase()}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => !isAnonymous && onUserClick(message.user_id)}
              className={`font-medium text-gray-900 truncate ${
                !isAnonymous
                  ? "hover:text-purple-600 cursor-pointer"
                  : "cursor-default"
              } transition-colors`}
              disabled={isAnonymous}
            >
              {displayName}
            </button>
            <span className="text-xs text-gray-400 flex-shrink-0">
              • {getTimeAgo(message.created_at)}
            </span>
            {isReplying && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-auto">
                Replying
              </span>
            )}
          </div>

          <p className="text-gray-700 mb-3 leading-relaxed break-words">
            {message.content}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onReact(message.id, "heard")}
                className={`flex items-center gap-1.5 text-sm transition-all duration-200 hover:scale-110 active:scale-95 reaction-burst burst-red ${
                  hasReacted("heard")
                    ? "text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 -mx-2 -my-1 rounded-md burst-active"
                    : "text-gray-500 hover:text-red-500 hover:bg-red-50 px-2 py-1 -mx-2 -my-1 rounded-md"
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-all duration-200 ${
                    hasReacted("heard") ? "fill-current text-red-600 animate-reaction-pop" : ""
                  }`}
                />
                <span>
                  {getReactionCount("heard") > 0
                    ? getReactionCount("heard")
                    : ""}
                </span>
                <span className="hidden sm:inline">
                  {hasReacted("heard") ? "Heard ✓" : "Heard"}
                </span>
              </button>

              <button
                onClick={() => onReact(message.id, "validated")}
                className={`flex items-center gap-1.5 text-sm transition-all duration-200 hover:scale-110 active:scale-95 reaction-burst burst-blue ${
                  hasReacted("validated")
                    ? "text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 -mx-2 -my-1 rounded-md burst-active"
                    : "text-gray-500 hover:text-blue-500 hover:bg-blue-50 px-2 py-1 -mx-2 -my-1 rounded-md"
                }`}
              >
                <CheckCircle
                  className={`w-4 h-4 transition-all duration-200 ${
                    hasReacted("validated") ? "fill-current text-blue-600 animate-reaction-pop" : ""
                  }`}
                />
                <span>
                  {getReactionCount("validated") > 0
                    ? getReactionCount("validated")
                    : ""}
                </span>
                <span className="hidden sm:inline">
                  {hasReacted("validated") ? "Validated ✓" : "Validated"}
                </span>
              </button>

              <button
                onClick={() => onReact(message.id, "helpful")}
                className={`flex items-center gap-1.5 text-sm transition-all duration-200 hover:scale-110 active:scale-95 reaction-burst burst-green ${
                  hasReacted("helpful")
                    ? "text-green-600 hover:text-green-700 bg-green-50 px-2 py-1 -mx-2 -my-1 rounded-md burst-active"
                    : "text-gray-500 hover:text-green-500 hover:bg-green-50 px-2 py-1 -mx-2 -my-1 rounded-md"
                }`}
              >
                <ThumbsUp
                  className={`w-4 h-4 transition-all duration-200 ${
                    hasReacted("helpful") ? "fill-current text-green-600 animate-reaction-pop" : ""
                  }`}
                />
                <span>
                  {getReactionCount("helpful") > 0
                    ? getReactionCount("helpful")
                    : ""}
                </span>
                <span className="hidden sm:inline">
                  {hasReacted("helpful") ? "Helpful ✓" : "Helpful"}
                </span>
              </button>

              <button
                onClick={() => onReply(message.id, message.content)}
                className={`flex items-center gap-1.5 text-sm transition-all ${
                  isReplying
                    ? "text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 -mx-2 -my-1 rounded-md font-medium"
                    : "text-gray-500 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 -mx-2 -my-1 rounded-md"
                }`}
              >
                <svg
                  className={`w-4 h-4 ${isReplying ? "fill-current" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                <span>{isReplying ? "Replying" : "Reply"}</span>
              </button>
            </div>

            {hasReplies && (
              <button
                onClick={toggleReplies}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 -mx-2 -my-1 rounded-md transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{message.replies!.length}</span>
                <span className="hidden sm:inline">replies</span>
                {showReplies ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Replies section */}
          {hasReplies && showReplies && (
            <div className="mt-4 space-y-3">
              <div className="border-l-2 border-purple-300 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Replies ({message.replies!.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {message.replies!.map((reply) => (
                    <NookMessage
                      key={reply.id}
                      message={reply}
                      currentUserId={currentUserId}
                      userReactions={userReactions}
                      onUserClick={onUserClick}
                      onReact={onReact}
                      onReply={onReply}
                      isReplying={false} // or pass through if needed
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
