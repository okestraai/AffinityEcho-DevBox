// src/components/Modals/CommentsModal.tsx
import React, { useState, useEffect } from "react";
import { resolveDisplayName } from "../../../utils/nameUtils";
import {
  X,
  MessageCircle,
  Heart,
  ThumbsUp,
  Reply,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  GetAllCommentsForATopic,
  CreateForumTopicsComments,
  TopicsCommentsReactions,
  DeleteTopicsComments,
} from "../../../../api/forumApis";
import { getTimeAgo } from "../../../utils/forumUtils";
import { showToast } from "../../../Helper/ShowToast";
import { MentionTextarea } from "../../shared/MentionTextarea";
import { MentionText } from "../../shared/MentionText";
import { UserProfileModal } from "../UserProfileModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  topic: any | null;
  onUserClick?: (userId: string) => void;
}

export function CommentsModal({ isOpen, onClose, topic, onUserClick }: Props) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      if (!isOpen || !topic?.id) return;

      try {
        setLoading(true);
        const result = await GetAllCommentsForATopic(topic.id);
        setComments(Array.isArray(result) ? result : (result?.comments || []));
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [isOpen, topic?.id]);

  if (!isOpen || !topic) return null;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);

      await CreateForumTopicsComments({
        content: newComment.trim(),
        topicId: topic.id,
        isAnonymous: true,
      });

      // Refresh comments
      const result = await GetAllCommentsForATopic(topic.id);
      setComments(result.data || []);
      setNewComment("");
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      showToast(error.response?.data?.message || "Failed to post comment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;

    try {
      setSubmitting(true);

      await CreateForumTopicsComments({
        content: replyText.trim(),
        topicId: topic.id,
        parentCommentId: parentId,
        isAnonymous: true,
      });

      // Refresh comments
      const result = await GetAllCommentsForATopic(topic.id);
      setComments(result.data || []);
      setReplyText("");
      setReplyingTo(null);
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      showToast(error.response?.data?.message || "Failed to post reply", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentReaction = async (commentId: string) => {
    try {
      await TopicsCommentsReactions({
        commentId,
        reactionType: "helpful",
      });

      // Refresh comments
      const result = await GetAllCommentsForATopic(topic.id);
      setComments(result.data || []);
    } catch (error) {
      console.error("Error reacting to comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await DeleteTopicsComments(commentId);

      // Refresh comments
      const result = await GetAllCommentsForATopic(topic.id);
      setComments(result.data || []);
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      showToast(error.response?.data?.message || "Failed to delete comment", "error");
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleUserClick = (userId: string) => {
    if (user?.id === userId) {
      onClose();
      onUserClick?.(userId);
    } else {
      setSelectedUserId(userId);
      setShowUserProfile(true);
    }
  };

  const renderComment = (comment: any, depth = 0) => {
    const isCurrentUser = user?.id === comment.user_id;
    const replies = comments.filter((c) => c.parent_comment_id === comment.id);
    const hasReplies = replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);

    return (
      <div
        key={comment.id}
        className={`${depth > 0 ? "ml-4 sm:ml-8 border-l-2 border-gray-100 pl-3 sm:pl-4" : ""}`}
      >
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => handleUserClick(comment.user_id)}
              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm hover:bg-blue-200 transition-colors cursor-pointer"
            >
              {comment.user_profile?.avatar || "👤"}
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => handleUserClick(comment.user_id)}
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {resolveDisplayName(comment.user_profile?.display_name, comment.user_profile?.username)}
                </button>
                {isCurrentUser && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    You
                  </span>
                )}
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">
                  {getTimeAgo(comment.created_at)}
                </span>
              </div>

              <MentionText
                text={comment.content}
                className="text-sm text-gray-700 mb-3 leading-relaxed block"
              />

              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <button
                  onClick={() => handleCommentReaction(comment.id)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Heart className="w-3 h-3 transition-transform duration-200" />
                  <span>{comment.reaction_helpful_count || 0} helpful</span>
                </button>

                <button
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
                >
                  <Reply className="w-3 h-3" />
                  <span>Reply</span>
                </button>

                {hasReplies && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    <span>
                      {isExpanded ? "Hide" : "Show"} {replies.length}{" "}
                      {replies.length === 1 ? "reply" : "replies"}
                    </span>
                  </button>
                )}

                {isCurrentUser && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="flex items-center text-xs text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <form
                  onSubmit={(e) => handleSubmitReply(e, comment.id)}
                  className="mt-3 pt-3 border-t border-gray-100"
                >
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs">
                      {user?.username?.[0]?.toUpperCase() || "👤"}
                    </div>
                    <div className="flex-1">
                      <MentionTextarea
                        value={replyText}
                        onChange={setReplyText}
                        placeholder={`Reply to ${
                          resolveDisplayName(comment.user_profile?.display_name, comment.user_profile?.username) || "comment"
                        }... Use @ to mention`}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!replyText.trim() || submitting}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submitting ? "Posting..." : "Reply"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Nested Replies */}
        {hasReplies && isExpanded && (
          <div className="space-y-3">
            {replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootComments = comments.filter((c) => !c.parent_comment_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md md:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {topic?.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="w-4 h-4" />
                <span>{rootComments.length} comments</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading comments...</p>
            </div>
          ) : rootComments.length > 0 ? (
            rootComments.map((comment) => renderComment(comment))
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium text-gray-500 mb-1">
                No comments yet
              </h3>
              <p className="text-sm text-gray-400">
                Be the first to share your thoughts
              </p>
            </div>
          )}
        </div>

        {/* New Comment Form */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <form onSubmit={handleSubmitComment}>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                {user?.username?.[0]?.toUpperCase() || "👤"}
              </div>
              <div className="flex-1">
                <MentionTextarea
                  value={newComment}
                  onChange={setNewComment}
                  placeholder="Share your thoughts or advice... Use @ to mention"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Your comment will be posted anonymously
                  </p>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <Send className="w-3 h-3" />
                    {submitting ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ""}
        onChat={(userId) => {
          setShowUserProfile(false);
          onClose();
          onUserClick?.(userId);
        }}
      />
    </div>
  );
}
