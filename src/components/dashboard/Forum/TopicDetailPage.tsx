// src/pages/TopicDetailPage.tsx - ISOLATED ACTIONS VERSION
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Heart,
  Eye,
  Lightbulb,
  Bookmark,
  Share2,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { ClapIcon } from "../../shared/ClapIcon";
import { useAuth } from "../../../hooks/useAuth";
import {
  GetForumTopicById,
  ForumTopicsReactions,
  GetAllCommentsForATopic,
  CreateForumTopicsComments,
  TopicsCommentsReactions,
  DeleteTopicsComments,
  ToggleTopicBookmark,
  UpdateForumTopic,
  DeleteForumTopic,
  UpdateTopicComment,
} from "../../../../api/forumApis";
import { shareContent } from "../../../utils/shareUtils";
import { getTimeAgo } from "../../../utils/forumUtils";
import { UserProfileModal } from "../../Modals/UserProfileModal";
import { CommentsSkeleton } from "../../../Helper/SkeletonLoader";
import { showToast } from "../../../Helper/ShowToast";
import { MSG } from "../../../constants/messages";
import { OkestraPanel } from "../OkestraPanel";
import { ViewersModal } from "../../Modals/ViewersModal";
import { resolveAuthorName } from "../../../utils/nameUtils";
import { VerifiedBadge } from "../../shared/VerifiedBadge";
import { ContentMenu } from "../../shared/ContentMenu";
import { MentionTextarea } from "../../shared/MentionTextarea";
import { MentionText } from "../../shared/MentionText";
import { ConfirmModal } from "../../shared/ConfirmModal";

interface ForumComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  parent_comment_id: string | null;
  helpful_count?: number;
  userReactions?: Record<string, boolean | undefined>;
  user_profile?: { avatar?: string; display_name?: string; username?: string; is_company_verified?: boolean };
  author?: { is_company_verified?: boolean };
  replies?: ForumComment[];
  [key: string]: unknown;
}

interface ForumTopic {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  tags?: string[];
  comments_count: number;
  views_count?: number;
  reaction_heard_count?: number;
  reaction_validated_count?: number;
  reaction_inspired_count?: number;
  reactions?: { heard?: number; validated?: number; inspired?: number; seen?: number };
  userReactions?: Record<string, boolean | undefined>;
  user_bookmarked?: boolean;
  user_profile?: { avatar?: string; display_name?: string; username?: string; is_company_verified?: boolean };
  author?: { is_company_verified?: boolean };
  [key: string]: unknown;
}

export function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showOkestraPanel, setShowOkestraPanel] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [visibleCommentCount, setVisibleCommentCount] = useState(15);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const commentSentinelRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // These must be before any early returns (loading/!topic guards)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'topic' | 'comment'; id: string; message: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingTopic, setEditingTopic] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [editTopicContent, setEditTopicContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  // Reset visible count when topic changes
  useEffect(() => { setVisibleCommentCount(15); }, [topicId]);

  // Infinite scroll for comments (client-side since API returns all at once)
  const loadMoreComments = useCallback(() => {
    setVisibleCommentCount((prev) => prev + 15);
  }, []);
  const loadMoreCommentsRef = useRef(loadMoreComments);
  useEffect(() => { loadMoreCommentsRef.current = loadMoreComments; }, [loadMoreComments]);
  useEffect(() => {
    const el = commentSentinelRef.current;
    if (!el) return;
    const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
      if (!node || node === document.body) return null;
      const ov = getComputedStyle(node).overflowY;
      if (ov === "auto" || ov === "scroll") return node;
      return getScrollParent(node.parentElement);
    };
    const root = getScrollParent(el.parentElement);
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreCommentsRef.current(); },
      { threshold: 0, rootMargin: "200px 0px", root }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleBookmark = async () => {
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      await ToggleTopicBookmark(topicId!);
      showToast(!prev ? MSG.FORUM.BOOKMARKED : MSG.FORUM.BOOKMARK_REMOVED, "success");
    } catch {
      setIsBookmarked(prev);
      showToast(MSG.FORUM.BOOKMARK_FAILED, "error");
    }
  };

  // Fetch topic details
  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setLoading(true);
        if (!topicId) return;

        const result = await GetForumTopicById(topicId);
        setTopic(result);
        setIsBookmarked(!!result?.user_bookmarked);
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
        setComments(Array.isArray(result) ? result : (result?.comments || []));
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };

    if (topicId) {
      fetchComments();
    }
  }, [topicId]);



  // Recursively flatten pre-nested comments into a flat array
  const flattenComments = (comments: ForumComment[]): ForumComment[] => {
    const result: ForumComment[] = [];
    for (const c of comments) {
      result.push(c);
      if (c.replies && c.replies.length > 0) {
        result.push(...flattenComments(c.replies));
      }
    }
    return result;
  };

  // Build comment tree from flat array if needed
  const buildCommentTree = (comments: ForumComment[]) => {
    const flatComments = flattenComments(comments);
    const commentMap = new Map<string, ForumComment>();
    const rootComments: ForumComment[] = [];

    // First pass: create map of all comments with empty replies array
    flatComments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
      });
    });

    // Second pass: build tree
    flatComments.forEach((comment) => {
      const node = commentMap.get(comment.id)!;

      if (comment.parent_comment_id && comment.parent_comment_id !== null) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          // Only add if not already in replies
          if (!parent.replies!.some((r: ForumComment) => r.id === node.id)) {
            parent.replies!.push(node);
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-8 animate-pulse">
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

  const handleUserHover = (userId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      handleUserClick(userId);
    }, 400);
  };

  const handleUserHoverLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleShare = async () => {
    if (!topicId) return;
    await shareContent({ contentType: "topic", contentId: topicId, title: topic?.title });
  };

  // ISOLATED TOPIC REACTION - Only updates topic reactions
  const handleReaction = async (reactionType: string) => {
    try {
      // Optimistically update UI
      setTopic((prevTopic) => {
        if (!prevTopic) return prevTopic;
        const reactionKey = `reaction_${reactionType}_count`;
        const currentValue = (prevTopic[reactionKey] as number) || 0;
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
      showToast(MSG.FORUM.REACTION_FAILED, "error");

      // Revert on error
      setTopic((prevTopic) => {
        if (!prevTopic) return prevTopic;
        const reactionKey = `reaction_${reactionType}_count`;
        const currentValue = (prevTopic[reactionKey] as number) || 0;
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

      const payload: { content: string; topicId: string; isAnonymous: boolean; parentCommentId?: string } = {
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
      const freshComments = Array.isArray(result) ? result : (result?.comments || []);

      // Build tree structure
      const nestedComments = buildCommentTree(freshComments);
      setComments(nestedComments);

      // Update topic comment count optimistically
      setTopic((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments_count: (prev.comments_count || 0) + 1,
        };
      });

      setNewComment("");
      setReplyToComment(null);

      // Auto-expand the parent comment if it was a reply
      if (replyToComment) {
        setExpandedComments((prev) => new Set([...prev, replyToComment]));
      }

      showToast(MSG.FORUM.COMMENT_POSTED, "success");
    } catch (error: unknown) {
      console.error("Error submitting comment:", error);
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(
        errMsg || MSG.FORUM.CREATE_COMMENT_FAILED,
        "error",
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  // ISOLATED COMMENT REACTION - Only updates specific comment
  const handleCommentReaction = async (commentId: string) => {
    try {
      // Optimistically update UI
      const updateComments = (commentsList: ForumComment[]): ForumComment[] => {
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
      showToast(MSG.FORUM.REACTION_FAILED, "error");

      // Revert on error
      const revertComments = (commentsList: ForumComment[]): ForumComment[] => {
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
    setDeleteConfirm({
      type: 'comment',
      id: commentId,
      message: 'Delete this comment? All replies under it will also be deleted. This cannot be undone.',
    });
  };

  const executeDeleteComment = async (commentId: string) => {

    try {
      // Optimistically remove comment from UI
      const removeComment = (commentsList: ForumComment[]): ForumComment[] => {
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
      setTopic((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments_count: Math.max(0, (prev.comments_count || 0) - 1),
        };
      });

      // Make API call in background
      await DeleteTopicsComments(commentId);

      showToast(MSG.FORUM.COMMENT_DELETED, "success");
    } catch (error: unknown) {
      console.error("Error deleting comment:", error);
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(
        errMsg || MSG.FORUM.COMMENT_DELETE_FAILED,
        "error",
      );

      // Refresh comments on error to restore accurate state
      const result = await GetAllCommentsForATopic(topicId!);
      const freshComments = Array.isArray(result) ? result : (result?.comments || []);
      const nestedComments = buildCommentTree(freshComments);
      setComments(nestedComments);
    }
  };

  // ── Edit/Delete topic ───────────────────────────────────────────────────
  const handleEditTopic = () => {
    if (!topic) return;
    setEditTopicTitle(topic.title);
    setEditTopicContent(topic.content);
    setEditingTopic(true);
  };

  const handleSaveEditTopic = async () => {
    if (!topic || !editTopicTitle.trim()) return;
    try {
      const res = await UpdateForumTopic(topic.id, {
        title: editTopicTitle.trim(),
        content: editTopicContent.trim(),
      });
      const updated = (res as { data?: ForumTopic })?.data || res;
      setTopic((prev) =>
        prev ? {
          ...prev,
          title: (updated as ForumTopic)?.title || editTopicTitle.trim(),
          content: (updated as ForumTopic)?.content || editTopicContent.trim(),
          is_edited: true,
        } as ForumTopic : prev
      );
      setEditingTopic(false);
      showToast("Topic updated", "success");
    } catch (err: unknown) {
      showToast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update topic", "error");
    }
  };

  const handleDeleteTopic = () => {
    if (!topic) return;
    setDeleteConfirm({
      type: 'topic',
      id: topic.id,
      message: 'Delete this topic? All comments and replies will also be deleted. This cannot be undone.',
    });
  };

  const executeDeleteTopic = async () => {
    if (!topic) return;
    try {
      await DeleteForumTopic(topic.id);
      showToast("Topic deleted", "success");
      navigate("/dashboard/forums");
    } catch (err: unknown) {
      showToast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete topic", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      if (deleteConfirm.type === 'comment') {
        await executeDeleteComment(deleteConfirm.id);
      } else {
        await executeDeleteTopic();
      }
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  };

  // ── Edit comment ───────────────────────────────────────────────────────
  const handleEditComment = async (commentId: string, newContent: string) => {
    setSavingComment(true);
    try {
      await UpdateTopicComment(commentId, { content: newContent });
      const updateInTree = (list: ForumComment[]): ForumComment[] =>
        list.map((c) => {
          if (c.id === commentId) return { ...c, content: newContent, is_edited: true, updated_at: new Date().toISOString() } as ForumComment;
          if (c.replies?.length) return { ...c, replies: updateInTree(c.replies) };
          return c;
        });
      setComments((prev) => updateInTree(prev));
      setEditingCommentId(null);
      showToast("Comment updated", "success");
    } catch (err: unknown) {
      showToast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update comment", "error");
    } finally {
      setSavingComment(false);
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

  const renderComment = (comment: ForumComment, depth: number = 0) => {
    const isAuthor = currentUser?.id === comment.user_id;

    // Use the nested replies from the comment data
    const replies = comment.replies || [];
    const isExpanded = expandedComments.has(comment.id);
    const hasReplies = replies.length > 0;
    const showReplyIndicator = depth < 3; // Limit nesting depth for UI

    return (
      <div
        key={comment.id}
        className={`${depth > 0 ? "ml-4 sm:ml-8 md:ml-12 mt-3 sm:mt-4" : "mt-4 sm:mt-6"}`}
      >
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
          <div className="flex items-start gap-3">
            <button
              onClick={() => handleUserClick(comment.user_id)}
              onMouseEnter={() => handleUserHover(comment.user_id)}
              onMouseLeave={handleUserHoverLeave}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 hover:shadow-lg transition-all"
            >
              {comment.user_profile?.avatar || "👤"}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <button
                  onClick={() => handleUserClick(comment.user_id)}
                  onMouseEnter={() => handleUserHover(comment.user_id)}
                  onMouseLeave={handleUserHoverLeave}
                  className="font-semibold text-gray-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                >
                  {resolveAuthorName(currentUser, comment.user_id, comment.user_profile?.display_name, comment.user_profile?.username)}{" "}
                  {comment.user_profile?.avatar || "👤"}
                  {(comment.user_profile?.is_company_verified ?? comment.author?.is_company_verified) && <VerifiedBadge size={18} />}
                </button>
                {isAuthor && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    You
                  </span>
                )}
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getTimeAgo(comment.created_at as string)}
                  {(comment.is_edited || (comment.updated_at && comment.updated_at !== comment.created_at)) && (
                    <span className="text-xs text-gray-400 italic ml-1">(edited)</span>
                  )}
                </span>
                {isAuthor ? (
                  <ContentMenu
                    isOwner
                    onEdit={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); }}
                    onDelete={() => handleDeleteComment(comment.id)}
                  />
                ) : (
                  <ContentMenu
                    contentType="comment"
                    contentId={comment.id}
                    onHide={() => setComments((prev) => prev.filter((c: any) => c.id !== comment.id))}
                  />
                )}
              </div>

              {editingCommentId === comment.id ? (
                <div className="mb-3">
                  <MentionTextarea
                    value={editCommentText}
                    onChange={setEditCommentText}
                    placeholder="Edit comment... Use @ to mention someone"
                    className="w-full text-sm text-gray-700 border border-purple-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditComment(comment.id, editCommentText.trim())}
                      disabled={savingComment || !editCommentText.trim() || editCommentText.trim() === comment.content}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {savingComment ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCommentId(null)}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <MentionText
                  text={comment.content}
                  className="text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap block"
                />
              )}

              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => handleCommentReaction(comment.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    comment.userReactions?.helpful
                      ? "text-red-500"
                      : "text-gray-500 hover:text-red-500"
                  }`}
                  aria-label="Helpful"
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
                  <span>{replies.length}</span>
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

              </div>
            </div>
          </div>
        </div>

        {/* Show nested replies ONLY when expanded */}
        {hasReplies && isExpanded && showReplyIndicator && (
          <div className="space-y-4 border-l-2 border-gray-100 pl-4 mt-4">
            {replies.map((reply: ForumComment) => renderComment(reply, depth + 1))}
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
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 lg:p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => handleUserClick(topic.user_id)}
                  onMouseEnter={() => handleUserHover(topic.user_id)}
                  onMouseLeave={handleUserHoverLeave}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg hover:shadow-lg transition-all"
                >
                  {topic.user_profile?.avatar || "👤"}
                </button>

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleUserClick(topic.user_id)}
                    onMouseEnter={() => handleUserHover(topic.user_id)}
                    onMouseLeave={handleUserHoverLeave}
                    className="font-bold text-gray-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                  >
                    {resolveAuthorName(currentUser, topic.user_id, topic.user_profile?.display_name, topic.user_profile?.username)}
                    {(topic.user_profile?.is_company_verified ?? topic.author?.is_company_verified) && <VerifiedBadge size={18} />}
                  </button>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{getTimeAgo(topic.created_at)}</span>
                  </div>
                </div>
              </div>

              {topic.user_id === currentUser?.id ? (
                <ContentMenu
                  isOwner
                  isLocked={!!(topic as Record<string, unknown>).is_locked}
                  onEdit={handleEditTopic}
                  onDelete={handleDeleteTopic}
                />
              ) : (
                <ContentMenu contentType="topic" contentId={topic.id} onHide={() => navigate("/dashboard/forums")} />
              )}
            </div>

            {editingTopic ? (
              <div className="mb-4">
                <input
                  type="text"
                  value={editTopicTitle}
                  onChange={(e) => setEditTopicTitle(e.target.value)}
                  className="w-full text-xl sm:text-2xl font-bold text-gray-900 border border-purple-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Topic title"
                  autoFocus
                />
                <MentionTextarea
                  value={editTopicContent}
                  onChange={setEditTopicContent}
                  placeholder="Edit topic content... Use @ to mention someone"
                  className="w-full border border-purple-300 rounded-lg px-3 py-2 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 min-h-[100px]"
                />
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={handleSaveEditTopic}
                    disabled={!editTopicTitle.trim()}
                    className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTopic(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  {topic.title}
                </h1>

                <div className="prose max-w-none mb-6">
                  <MentionText
                    text={topic.content as string}
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg block"
                  />
                  {(topic as Record<string, unknown>).is_edited && (
                    <span className="text-xs text-gray-400 italic">(edited)</span>
                  )}
                </div>
              </>
            )}

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

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 md:pt-6 border-t border-gray-200 gap-3">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-6 flex-wrap">
                <button
                  onClick={() => handleReaction("heard")}
                  className={`flex items-center gap-2 transition-all duration-200 font-medium hover:bg-red-50 hover:scale-110 active:scale-95 px-3 py-2 rounded-lg ${
                    topic.userReactions?.heard
                      ? "text-red-500 bg-red-50"
                      : "text-gray-500 hover:text-red-500"
                  }`}
                  aria-label="Heard"
                >
                  <Heart className={`w-5 h-5 transition-transform duration-200 ${topic.userReactions?.heard ? "fill-red-500 animate-reaction-pop" : ""}`} />
                  <span className="text-sm">{topic.reaction_heard_count || topic.reactions?.heard || 0}</span>
                </button>
                <button
                  onClick={() => handleReaction("validated")}
                  className={`flex items-center gap-2 transition-all duration-200 font-medium hover:bg-blue-50 hover:scale-110 active:scale-95 px-3 py-2 rounded-lg ${
                    topic.userReactions?.validated
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                  aria-label="Validated"
                >
                  <ClapIcon className={`w-5 h-5 transition-transform duration-200 ${topic.userReactions?.validated ? "animate-reaction-pop" : ""}`} />
                  <span className="text-sm">{topic.reaction_validated_count || topic.reactions?.validated || 0}</span>
                </button>
                <button
                  onClick={() => handleReaction("inspired")}
                  className={`flex items-center gap-2 transition-all duration-200 font-medium hover:bg-yellow-50 hover:scale-110 active:scale-95 px-3 py-2 rounded-lg ${
                    topic.userReactions?.inspired
                      ? "text-yellow-500 bg-yellow-50"
                      : "text-gray-500 hover:text-yellow-500"
                  }`}
                  aria-label="Inspired"
                >
                  <Lightbulb className={`w-5 h-5 transition-transform duration-200 ${topic.userReactions?.inspired ? "fill-yellow-500 animate-reaction-pop" : ""}`} />
                  <span className="text-sm">{topic.reaction_inspired_count || topic.reactions?.inspired || 0}</span>
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
                <button
                  onClick={() => setShowOkestraPanel(true)}
                  className="flex items-center gap-2 transition-colors font-medium hover:bg-indigo-50 px-3 py-2 rounded-lg text-gray-500 hover:text-indigo-600 group ml-auto"
                  title="Get AI insights from Okestra"
                >
                  <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                  <span className="text-sm font-medium">AI Insights</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isBookmarked ? "text-amber-600" : "text-gray-600"}`}
                  title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                  aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-amber-600" : ""}`} />
                </button>

                <button
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                  title="Share"
                  aria-label="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
            Comments ({rootComments.length})
          </h2>

          <form
            id="comment-form"
            onSubmit={handleSubmitComment}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 mb-6"
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
                <MentionTextarea
                  value={newComment}
                  onChange={setNewComment}
                  placeholder={
                    replyToComment
                      ? "Write your reply... Use @ to mention"
                      : "Write a comment... Use @ to mention"
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
            {rootComments.slice(0, visibleCommentCount).map((comment) => renderComment(comment))}
          </div>

          {/* Infinite scroll sentinel for comments */}
          <div ref={commentSentinelRef} className="h-8 mt-2 flex items-center justify-center">
            {visibleCommentCount < rootComments.length && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                Loading more comments...
              </div>
            )}
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
            setShowUserProfile(false);
            navigate("/dashboard/messages", { state: { startChatWith: userId, contextType: "regular" } });
          }}
        />
      )}
      {showViewersModal && (
        <ViewersModal
          isOpen={showViewersModal}
          onClose={() => setShowViewersModal(false)}
          contentId={topic.id}
          contentType="topic"
          totalViewers={topic.reactions?.seen || 0}
        />
      )}

      <OkestraPanel
        isOpen={showOkestraPanel}
        onClose={() => setShowOkestraPanel(false)}
        topic={topic as unknown as Parameters<typeof OkestraPanel>[0]['topic']}
        comments={comments as unknown as Parameters<typeof OkestraPanel>[0]['comments']}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.type === 'topic' ? 'Delete Topic' : 'Delete Comment'}
        message={deleteConfirm?.message || ''}
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
