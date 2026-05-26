import {
  Heart,
  Star,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Check,
  X,
} from "lucide-react";
import { ClapIcon } from "../../shared/ClapIcon";
import { useState } from "react";
import { resolveAuthorName } from "../../../utils/nameUtils";
import { VerifiedBadge } from "../../shared/VerifiedBadge";
import { ContentMenu } from "../../shared/ContentMenu";
import { useAuth } from "../../../hooks/useAuth";
import { MentionText } from "../../shared/MentionText";
import { MentionTextarea } from "../../shared/MentionTextarea";

interface NookMessageProps {
  message: {
    id: string;
    user_id?: string;
    is_mine?: boolean;
    content: string;
    created_at: string;
    updated_at?: string;
    heard_count: number;
    validated_count: number;
    helpful_count: number;
    user?: {
      avatar: string;
      username: string;
      display_name?: string;
      is_company_verified?: boolean;
    } | null;
    replies?: unknown[];
  };
  currentUserId?: string;
  userReactions?: string[]; // reactions for current user on this message
  onUserClick: (userId: string) => void;
  onReact: (messageId: string, reactionType: string) => void;
  onReply: (messageId: string, messageContent: string) => void;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  onDelete?: (messageId: string) => void;
  isReplying?: boolean;
  onHide?: (messageId: string) => void;
  isNookCreator?: boolean;
}

/** Detects whether a string is an emoji (multi-codepoint or non-ASCII) */
function isEmoji(str: string): boolean {
  if (!str) return false;
  // Emoji are typically surrogate pairs (length > 1 for a single char) or have charCode > 127
  return str.length > 1 || str.charCodeAt(0) > 127;
}

export function NookMessage({
  message,
  currentUserId,
  userReactions = [],
  onUserClick,
  onReact,
  onReply,
  onEdit,
  onDelete,
  isReplying = false,
  onHide,
  isNookCreator,
}: NookMessageProps) {
  const { user: authUser } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);

  const hasReplies = !!message.replies && message.replies.length > 0;
  const isEdited = !!message.updated_at && message.updated_at !== message.created_at;
  const canEdit = onEdit && message.is_mine;
  const canDelete = message.is_mine || isNookCreator;

  // Safe user data with fallbacks
  const user = message.user ?? null;
  const displayName = resolveAuthorName(authUser, message.user_id, user?.display_name, user?.username);
  const avatar = user?.avatar ?? "A"; // fallback character
  const isAnonymous = displayName === "Anonymous" || !user;
  const avatarIsEmoji = isEmoji(avatar);

  const getAvatarColor = (avatarChar: string) => {
    const colors = [
      "from-red-400 to-pink-400",
      "from-blue-400 to-indigo-400",
      "from-green-400 to-emerald-400",
      "from-yellow-400 to-orange-400",
      "from-purple-400 to-pink-400",
      "from-gray-500 to-gray-700",
    ];
    const index = avatarChar.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
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

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === message.content || !onEdit) return;
    setIsSaving(true);
    try {
      await onEdit(message.id, trimmed);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div
      className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm border transition-all duration-200 ${
        isReplying
          ? "border-purple-500 ring-2 ring-purple-100 bg-gradient-to-r from-purple-50 to-white"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Avatar */}
        <button
          onClick={() => !isAnonymous && onUserClick(message.user_id)}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold hover:scale-105 transition-transform ${
            !isAnonymous ? "cursor-pointer" : "cursor-default"
          } shadow-md flex-shrink-0 ${
            avatarIsEmoji
              ? "bg-gray-100 text-base sm:text-xl"
              : `bg-gradient-to-br ${getAvatarColor(avatar)} text-white`
          }`}
          disabled={isAnonymous}
        >
          {avatarIsEmoji ? avatar : avatar[0].toUpperCase()}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => !isAnonymous && onUserClick(message.user_id)}
              className={`font-medium text-gray-900 truncate inline-flex items-center gap-1 ${
                !isAnonymous
                  ? "hover:text-purple-600 cursor-pointer"
                  : "cursor-default"
              } transition-colors`}
              disabled={isAnonymous}
            >
              {displayName}
              {!isAnonymous && user?.is_company_verified && <VerifiedBadge size={18} />}
            </button>
            <span className="text-xs text-gray-400 flex-shrink-0">
              • {getTimeAgo(message.created_at)}
            </span>
            {isEdited && (
              <span className="text-xs text-gray-400 italic flex-shrink-0">(edited)</span>
            )}
            {isReplying && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-auto">
                Replying
              </span>
            )}
            {(canEdit || canDelete) ? (
              <ContentMenu
                isOwner
                onEdit={canEdit ? () => { setEditContent(message.content); setIsEditing(true); } : undefined}
                onDelete={canDelete ? () => onDelete?.(message.id) : undefined}
              />
            ) : (
              <ContentMenu contentType="nook_message" contentId={message.id} onHide={() => onHide?.(message.id)} />
            )}
          </div>

          {isEditing ? (
            <div className="mb-3">
              <MentionTextarea
                value={editContent}
                onChange={setEditContent}
                placeholder="Edit message... Use @ to mention someone"
                className="w-full text-sm text-gray-700 border border-purple-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
                autoFocus
              />
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim() || editContent.trim() === message.content}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-3 h-3" />
                  {isSaving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                <span className="text-xs text-gray-400 ml-auto">⌘↵ to save · Esc to cancel</span>
              </div>
            </div>
          ) : (
            <MentionText
              text={message.content}
              className="text-sm sm:text-base text-gray-700 mb-3 leading-relaxed break-words block"
            />
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <button
                onClick={() => onReact(message.id, "heard")}
                className={`flex items-center gap-1.5 text-xs sm:text-sm transition-all duration-200 hover:scale-110 active:scale-95 px-2 py-1.5 sm:py-1 rounded-md min-h-[36px] sm:min-h-0 ${
                  hasReacted("heard")
                    ? "text-red-500 bg-red-50"
                    : "text-gray-500 hover:text-red-500 hover:bg-red-50"
                }`}
                aria-label="Heard"
                title="Heard"
              >
                <Heart className={`w-4 h-4 transition-transform duration-200 ${hasReacted("heard") ? "fill-red-500 animate-reaction-pop" : ""}`} />
                {getReactionCount("heard") > 0 && (
                  <span>{getReactionCount("heard")}</span>
                )}
              </button>

              <button
                onClick={() => onReact(message.id, "validated")}
                className={`flex items-center gap-1.5 text-xs sm:text-sm transition-all duration-200 hover:scale-110 active:scale-95 px-2 py-1.5 sm:py-1 rounded-md min-h-[36px] sm:min-h-0 ${
                  hasReacted("validated")
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                }`}
                aria-label="Validated"
                title="Validated"
              >
                <ClapIcon className={`w-4 h-4 transition-transform duration-200 ${hasReacted("validated") ? "animate-reaction-pop" : ""}`} />
                {getReactionCount("validated") > 0 && (
                  <span>{getReactionCount("validated")}</span>
                )}
              </button>

              <button
                onClick={() => onReact(message.id, "helpful")}
                className={`flex items-center gap-1.5 text-xs sm:text-sm transition-all duration-200 hover:scale-110 active:scale-95 px-2 py-1.5 sm:py-1 rounded-md min-h-[36px] sm:min-h-0 ${
                  hasReacted("helpful")
                    ? "text-green-600 bg-green-50"
                    : "text-gray-500 hover:text-green-600 hover:bg-green-50"
                }`}
                aria-label="Helpful"
                title="Helpful"
              >
                <Star className={`w-4 h-4 transition-transform duration-200 ${hasReacted("helpful") ? "fill-green-600 animate-reaction-pop" : ""}`} />
                {getReactionCount("helpful") > 0 && (
                  <span>{getReactionCount("helpful")}</span>
                )}
              </button>

              <button
                onClick={() => onReply(message.id, message.content)}
                className={`flex items-center gap-1.5 text-xs sm:text-sm transition-all min-h-[36px] sm:min-h-0 ${
                  isReplying
                    ? "text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1.5 sm:py-1 -mx-2 -my-1 rounded-md font-medium"
                    : "text-gray-500 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 sm:py-1 -mx-2 -my-1 rounded-md"
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
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isReplying={false}
                      isNookCreator={isNookCreator}
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
