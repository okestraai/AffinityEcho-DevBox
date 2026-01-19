// src/pages/TopicDetailPage.tsx - ISOLATED ACTIONS VERSION
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Heart,
  Eye,
  ThumbsUp,
  Bookmark,
  Share2,
  MoreVertical,
  Clock,
  Send,
  Flag,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  GetForumTopicById,
  ForumTopicsReactions,
  GetAllCommentsForATopic,
  CreateForumTopicsComments,
  TopicsCommentsReactions,
  DeleteTopicsComments,
} from "../../../../api/forumApis";
import { formatLastActivity, getTimeAgo } from "../../../utils/forumUtils";
import { UserProfileModal } from "../../Modals/UserProfileModal";
import { CommentsSkeleton } from "../../../Helper/SkeletonLoader";
import { showToast } from "../../../Helper/ShowToast";

export function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [topic, setTopic] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch topic details
  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setLoading(true);
        if (!topicId) return;

        const result = await GetForumTopicById(topicId);
        setTopic(result.data);
      } catch (err) {
        console.error("Error fetching topic:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [topicId]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        if (!topicId) return;

        const result = await GetAllCommentsForATopic(topicId);
        setComments(result.data || []);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };

    if (topicId) {
      fetchComments();
    }
  }, [topicId]);

  // Build comment tree from flat array if needed
  const buildCommentTree = (flatComments: any[]) => {
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map of all comments with empty replies array
    flatComments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: comment.replies || [], // Use existing replies if API provides them
      });
    });

    // Second pass: build tree if comments are flat
    flatComments.forEach((comment) => {
      const node = commentMap.get(comment.id);

      if (comment.parent_comment_id && comment.parent_comment_id !== null) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          // Only add if not already in replies
          if (!parent.replies.some((r: any) => r.id === node.id)) {
            parent.replies.push(node);
          }
        }
      } else {
        // Only add root comments once
        if (!rootComments.some((c) => c.id === node.id)) {
          rootComments.push(node);
        }
      }
    });

    return rootComments;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="h-8 w-32 bg-gray-200 rounded mb-6 animate-pulse"></div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="mt-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
            <CommentsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Topic not found
          </h2>
          <button
            onClick={() => navigate("/dashboard/forums")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to Forums
          </button>
        </div>
      </div>
    );
  }

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  // ISOLATED TOPIC REACTION - Only updates topic reactions
  const handleReaction = async (reactionType: string) => {
    try {
      // Optimistically update UI
      setTopic((prevTopic: any) => {
        const reactionKey = `reaction_${reactionType}_count`;
        const currentValue = prevTopic[reactionKey] || 0;
        const isActive = prevTopic.userReactions?.[reactionType];

        return {
          ...prevTopic,
          [reactionKey]: isActive
            ? Math.max(0, currentValue - 1)
            : currentValue + 1,
          userReactions: {
            ...prevTopic.userReactions,
            [reactionType]: !isActive,
          },
        };
      });

      // Make API call in background
      await ForumTopicsReactions({
        topicId: topic.id,
        reactionType,
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      showToast("Failed to update reaction", "error");

      // Revert on error
      setTopic((prevTopic: any) => {
        const reactionKey = `reaction_${reactionType}_count`;
        const currentValue = prevTopic[reactionKey] || 0;
        const isActive = prevTopic.userReactions?.[reactionType];

        return {
          ...prevTopic,
          [reactionKey]: isActive
            ? currentValue + 1
            : Math.max(0, currentValue - 1),
          userReactions: {
            ...prevTopic.userReactions,
            [reactionType]: !isActive,
          },
        };
      });
    }
  };

  // ISOLATED COMMENT SUBMIT - Only updates comments list
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || submittingComment) return;

    try {
      setSubmittingComment(true);

      const payload: any = {
        content: newComment.trim(),
        topicId: topic.id,
        isAnonymous: true,
      };

      // Only add parentCommentId if replying to a comment
      if (replyToComment) {
        payload.parentCommentId = replyToComment;
      }

      await CreateForumTopicsComments(payload);

      // Refresh comments to get updated structure
      const result = await GetAllCommentsForATopic(topicId!);
      const freshComments = result.data || [];

      // Build tree structure
      const nestedComments = buildCommentTree(freshComments);
      setComments(nestedComments);

      // Update topic comment count optimistically
      setTopic((prev: any) => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1,
      }));

      setNewComment("");
      setReplyToComment(null);

      // Auto-expand the parent comment if it was a reply
      if (replyToComment) {
        setExpandedComments((prev) => new Set([...prev, replyToComment]));
      }

      showToast("Comment posted successfully!", "success");
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      showToast(
        error.response?.data?.message || "Failed to post comment",
        "error"
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  // ISOLATED COMMENT REACTION - Only updates specific comment
  const handleCommentReaction = async (commentId: string) => {
    try {
      // Optimistically update UI
      const updateComments = (commentsList: any[]): any[] => {
        return commentsList.map((comment) => {
          if (comment.id === commentId) {
            const isActive = comment.userReactions?.helpful;
            return {
              ...comment,
              helpful_count: isActive
                ? Math.max(0, (comment.helpful_count || 0) - 1)
                : (comment.helpful_count || 0) + 1,
              userReactions: {
                ...comment.userReactions,
                helpful: !isActive,
              },
            };
          }
          // Recursively update nested replies
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateComments(comment.replies),
            };
          }
          return comment;
        });
      };

      setComments((prev) => updateComments(prev));

      // Make API call in background
      await TopicsCommentsReactions({
        commentId,
        reactionType: "helpful",
      });
    } catch (error) {
      console.error("Error reacting to comment:", error);
      showToast("Failed to update reaction", "error");

      // Revert on error
      const revertComments = (commentsList: any[]): any[] => {
        return commentsList.map((comment) => {
          if (comment.id === commentId) {
            const isActive = comment.userReactions?.helpful;
            return {
              ...comment,
              helpful_count: isActive
                ? (comment.helpful_count || 0) + 1
                : Math.max(0, (comment.helpful_count || 0) - 1),
              userReactions: {
                ...comment.userReactions,
                helpful: !isActive,
              },
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: revertComments(comment.replies),
            };
          }
          return comment;
        });
      };

      setComments((prev) => revertComments(prev));
    }
  };

  // ISOLATED COMMENT DELETE - Only removes specific comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      // Optimistically remove comment from UI
      const removeComment = (commentsList: any[]): any[] => {
        return commentsList
          .filter((comment) => comment.id !== commentId)
          .map((comment) => {
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: removeComment(comment.replies),
              };
            }
            return comment;
          });
      };

      setComments((prev) => removeComment(prev));

      // Update topic comment count
      setTopic((prev: any) => ({
        ...prev,
        comments_count: Math.max(0, (prev.comments_count || 0) - 1),
      }));

      // Make API call in background
      await DeleteTopicsComments(commentId);

      showToast("Comment deleted successfully", "success");
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      showToast(
        error.response?.data?.message || "Failed to delete comment",
        "error"
      );

      // Refresh comments on error to restore accurate state
      const result = await GetAllCommentsForATopic(topicId!);
      const freshComments = result.data || [];
      const nestedComments = buildCommentTree(freshComments);
      setComments(nestedComments);
    }
  };

  const toggleCommentExpansion = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const renderComment = (comment: any, depth: number = 0) => {
    const isAuthor = currentUser?.id === comment.user_id;

    // Use the nested replies from the comment data
    const replies = comment.replies || [];
    const isExpanded = expandedComments.has(comment.id);
    const hasReplies = replies.length > 0;
    const showReplyIndicator = depth < 3; // Limit nesting depth for UI

    return (
      <div
        key={comment.id}
        className={`${depth > 0 ? "ml-8 md:ml-12 mt-4" : "mt-6"}`}
      >
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
          <div className="flex items-start gap-3">
            <button
              onClick={() => handleUserClick(comment.user_id)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 hover:shadow-lg transition-all"
            >
              {comment.user_profile?.avatar || "👤"}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <button
                  onClick={() => handleUserClick(comment.user_id)}
                  className="font-semibold text-gray-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                >
                  {comment.user_profile?.username || "Anonymous User"}{" "}
                  {comment.user_profile?.avatar || "👤"}
                </button>
                {isAuthor && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    You
                  </span>
                )}
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getTimeAgo(comment.created_at)}
                </span>
              </div>

              <p className="text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
                {comment.content}
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => handleCommentReaction(comment.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    comment.userReactions?.helpful
                      ? "text-red-500"
                      : "text-gray-500 hover:text-red-500"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>{comment.helpful_count || 0}</span>
                </button>

                <button
                  onClick={() => {
                    setReplyToComment(comment.id);
                    setNewComment(""); // Clear any existing text
                    // Scroll to comment form smoothly
                    document.getElementById("comment-form")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Reply
                </button>

                {hasReplies && showReplyIndicator && (
                  <button
                    onClick={() => toggleCommentExpansion(comment.id)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {isExpanded ? "Hide" : "Show"} {replies.length}{" "}
                    {replies.length === 1 ? "reply" : "replies"}
                  </button>
                )}

                {isAuthor && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Show nested replies ONLY when expanded */}
        {hasReplies && isExpanded && showReplyIndicator && (
          <div className="space-y-4 border-l-2 border-gray-100 pl-4 mt-4">
            {replies.map((reply: any) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Build comment tree for rendering
  const nestedComments = buildCommentTree(comments);
  const rootComments = nestedComments.filter((c) => !c.parent_comment_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate("/dashboard/forums")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Forums
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => handleUserClick(topic.user_id)}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg hover:shadow-lg transition-all"
                >
                  {topic.user_profile?.avatar || "👤"}
                </button>

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleUserClick(topic.user_id)}
                    className="font-bold text-gray-900 hover:text-blue-600 transition-colors block"
                  >
                    {topic.user_profile?.username || "Anonymous User"}
                  </button>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{getTimeAgo(topic.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {showOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        // Implement report functionality
                        console.log("Report topic:", topic.id);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {topic.title}
            </h1>

            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                {topic.content}
              </p>
            </div>

            {topic.tags && topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {topic.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => handleReaction("validated")}
                  className={`flex items-center gap-2 transition-colors ${
                    topic.userReactions?.validated
                      ? "text-blue-500"
                      : "text-gray-600 hover:text-blue-500"
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="font-semibold">
                    {topic.reaction_validated_count || 0}
                  </span>
                </button>

                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold">{topic.comments_count}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-5 h-5" />
                  <span className="font-semibold">
                    {topic.views_count || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                  <Bookmark className="w-5 h-5" />
                </button>

                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({rootComments.length})
          </h2>

          <form
            id="comment-form"
            onSubmit={handleSubmitComment}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6"
          >
            {replyToComment && (
              <div className="mb-4 flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Replying to comment
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyToComment(null)}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {currentUser?.username?.[0]?.toUpperCase() || "👤"}
              </div>

              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    replyToComment
                      ? "Write your reply..."
                      : "Write a comment..."
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />

                <div className="flex justify-between items-center mt-3">
                  <div className="text-sm text-gray-500">
                    Comments are anonymous by default
                  </div>
                  <div className="flex gap-2">
                    {replyToComment && (
                      <button
                        type="button"
                        onClick={() => setReplyToComment(null)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
                      >
                        Cancel Reply
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {submittingComment
                        ? "Posting..."
                        : replyToComment
                        ? "Post Reply"
                        : "Post Comment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            {rootComments.map((comment) => renderComment(comment))}
          </div>

          {rootComments.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No comments yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Be the first to comment!
              </p>
            </div>
          )}
        </div>
      </div>

      {showUserProfile && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showUserProfile}
          onClose={() => {
            setShowUserProfile(false);
            setSelectedUserId(null);
          }}
          onChat={(userId) => {
            console.log("Chat:", userId);
            setShowUserProfile(false);
          }}
        />
      )}
    </div>
  );
}
