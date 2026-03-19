import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resolveDisplayName } from "../../../utils/nameUtils";
import {
  ArrowLeft,
  Heart,
  ThumbsUp,
  Star,
  MessageSquare,
  Share2,
  Bookmark,
  FileText,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Reply,
  X,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  GetPostById,
  ToggleFeedReaction,
  AddComment,
  GetComments,
  ToggleBookmark,
} from "../../../../api/feedApis";
import { showToast } from "../../../Helper/ShowToast";
import { shareContent } from "../../../utils/shareUtils";
import { MentionText } from "../../shared/MentionText";
import { InlineCommentInput } from "../Forum/InlineCommentInput";

interface PostComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_comment_id?: string | null;
  parentCommentId?: string | null;
  replies?: PostComment[];
  user_profile?: {
    display_name?: string;
    username?: string;
    avatar?: string;
  };
  author?: {
    display_name?: string;
    avatar?: string;
  };
}

function flattenComments(comments: PostComment[]): PostComment[] {
  const result: PostComment[] = [];
  for (const c of comments) {
    result.push(c);
    if (c.replies && c.replies.length > 0) {
      result.push(...flattenComments(c.replies));
    }
  }
  return result;
}

function buildCommentTree(flatComments: PostComment[]): PostComment[] {
  const map = new Map<string, PostComment & { replies: PostComment[] }>();
  const roots: PostComment[] = [];

  flatComments.forEach((c) => map.set(c.id, { ...c, replies: [] }));

  flatComments.forEach((c) => {
    const node = map.get(c.id)!;
    const parentId = c.parent_comment_id ?? c.parentCommentId;
    if (parentId) {
      const parent = map.get(parentId);
      if (parent) {
        parent.replies.push(node);
        return;
      }
    }
    roots.push(node);
  });

  return roots;
}

export function SinglePostPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  const fetchPost = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const response = await GetPostById(postId);
      const data = response?.post || response;
      setPost(data);
    } catch {
      setError("Post not found or has been removed.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!postId) return;
    try {
      setLoadingComments(true);
      const response = await GetComments("post", postId);
      const raw = response?.comments ?? (Array.isArray(response) ? response : []);
      const arr = Array.isArray(raw) ? raw : [];
      const flat = flattenComments(arr);
      setComments(buildCommentTree(flat));
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleReaction = async (reactionType: "heard" | "validated" | "inspired") => {
    if (!post) return;
    const contentId = post.content_id || post.id;
    const wasActive = post.user_reactions?.[reactionType];
    const currentCount = post.reaction_counts?.[reactionType] ?? post.reactions?.[reactionType] ?? post[`reaction_${reactionType}_count`] ?? 0;
    const delta = wasActive ? -1 : 1;

    setPost((prev: any) => ({
      ...prev,
      user_reactions: { ...prev.user_reactions, [reactionType]: !wasActive },
      reaction_counts: {
        ...prev.reaction_counts,
        [reactionType]: Math.max(0, currentCount + delta),
      },
      [`reaction_${reactionType}_count`]: Math.max(0, currentCount + delta),
    }));

    try {
      await ToggleFeedReaction("post", contentId, reactionType);
    } catch {
      setPost((prev: any) => ({
        ...prev,
        user_reactions: { ...prev.user_reactions, [reactionType]: wasActive },
        reaction_counts: {
          ...prev.reaction_counts,
          [reactionType]: currentCount,
        },
        [`reaction_${reactionType}_count`]: currentCount,
      }));
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    const contentId = post.content_id || post.id;
    const was = post.user_has_bookmarked || post.user_bookmarked;

    setPost((prev: any) => ({ ...prev, user_has_bookmarked: !was, user_bookmarked: !was }));

    try {
      await ToggleBookmark("post", contentId);
    } catch {
      setPost((prev: any) => ({ ...prev, user_has_bookmarked: was, user_bookmarked: was }));
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const contentId = post.content_id || post.id;
    await shareContent({ contentType: "post", contentId, title: post.content?.title });
  };

  const handleCommentSubmit = async (comment: string) => {
    if (!post || !postId) return;
    const contentId = post.content_id || post.id;

    try {
      const payload: any = { content: comment };
      if (replyingTo) payload.parentCommentId = replyingTo.id;
      await AddComment("post", contentId, payload);
      setReplyingTo(null);
      setPost((prev: any) => ({
        ...prev,
        engagement: {
          ...prev.engagement,
          comments: (prev.engagement?.comments ?? prev.comments_count ?? 0) + 1,
        },
        comments_count: (prev.comments_count ?? prev.engagement?.comments ?? 0) + 1,
      }));
      await fetchComments();
    } catch {
      showToast("Failed to post comment.", "error");
    }
  };

  const toggleCommentExpanded = (id: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const getAvatarColor = (name: string) => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-pink-500", "bg-teal-500", "bg-orange-500", "bg-cyan-500"];
    const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const renderCommentNode = (c: PostComment, depth: number): React.ReactNode => {
    const commentName = resolveDisplayName(c.author?.display_name, c.user_profile?.display_name, c.user_profile?.username);
    const replies = c.replies || [];
    const hasReplies = replies.length > 0;
    const isExpanded = expandedComments.has(c.id);
    const canNest = depth < 3;

    return (
      <div key={c.id} className={`${depth > 0 ? "ml-6 mt-2 pl-3 border-l-2 border-purple-100" : ""}`}>
        <div className="flex items-start gap-2">
          <button
            onClick={() => c.user_id && navigate(`/dashboard/profile/${c.user_id}`)}
            className="flex-shrink-0 cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(commentName)} text-white`}>
              {c.author?.avatar || c.user_profile?.avatar || commentName.charAt(0).toUpperCase()}
            </div>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => c.user_id && navigate(`/dashboard/profile/${c.user_id}`)}
                className="text-xs font-semibold text-gray-800 hover:text-blue-600 transition-colors"
              >
                {commentName}
              </button>
              <span className="text-xs text-gray-400">{formatTimeAgo(c.created_at)}</span>
            </div>
            <MentionText text={c.content} className="text-sm text-gray-700 leading-relaxed block" />
            <div className="flex items-center gap-3 mt-1">
              {canNest && (
                <button
                  onClick={() => setReplyingTo({ id: c.id, authorName: commentName })}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </button>
              )}
              {hasReplies && canNest && (
                <button
                  onClick={() => toggleCommentExpanded(c.id)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {isExpanded ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </button>
              )}
            </div>
          </div>
        </div>
        {hasReplies && isExpanded && canNest && (
          <div className="mt-2 space-y-2">
            {replies.map((reply) => renderCommentNode(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderAvatar = (avatar: string | null | undefined, displayName: string, size = "w-12 h-12", textSize = "text-2xl") => {
    if (!avatar) {
      return (
        <div className={`${size} rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(displayName)}`}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      );
    }
    if (avatar.startsWith("http") || avatar.startsWith("/") || avatar.startsWith("data:")) {
      return <img src={avatar} alt={displayName} className={`${size} rounded-full object-cover`} />;
    }
    return (
      <div className={`${size} rounded-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 ${textSize}`}>
        {avatar}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Post not found</h3>
          <p className="text-gray-600 mb-6">{error || "This post may have been removed or is no longer available."}</p>
          <button
            onClick={() => navigate("/dashboard/feeds")}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Feed
          </button>
        </div>
      </div>
    );
  }

  // Normalize post data
  const contentIsString = typeof post.content === "string";
  const contentText = contentIsString ? post.content : (post.content?.text ?? "");
  const contentTitle = contentIsString ? null : post.content?.title;
  const authorName = resolveDisplayName(post.author?.display_name, post.author?.username) || "Anonymous";
  const authorAvatar = post.author?.avatar || post.author?.avatar_url || null;
  const authorId = post.user_id || post.author?.id || null;
  const createdAt = post.created_at;
  const reactionCounts = {
    heard: post.reaction_counts?.heard ?? post.reactions?.heard ?? post.reaction_heard_count ?? 0,
    validated: post.reaction_counts?.validated ?? post.reactions?.validated ?? post.reaction_validated_count ?? 0,
    inspired: post.reaction_counts?.inspired ?? post.reactions?.inspired ?? post.reaction_inspired_count ?? 0,
  };
  const userReactions = {
    heard: post.user_reactions?.heard ?? false,
    validated: post.user_reactions?.validated ?? false,
    inspired: post.user_reactions?.inspired ?? false,
  };
  const commentsCount = post.engagement?.comments ?? post.comments_count ?? 0;
  const sharesCount = post.engagement?.shares ?? post.shares_count;
  const isBookmarked = post.user_has_bookmarked ?? post.user_bookmarked ?? false;
  const tags = (contentIsString ? post.tags : post.content?.tags) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Post card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5">
          {/* Author */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0">
              {renderAvatar(authorAvatar, authorName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => authorId && navigate(`/dashboard/profile/${authorId}`)}
                  className="font-semibold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer"
                >
                  {authorName}
                </button>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Post</span>
                </div>
              </div>
              {createdAt && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimeAgo(createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {contentTitle && (
            <h2 className="text-lg font-bold text-gray-900 mb-2">{contentTitle}</h2>
          )}
          <div className="mb-4">
            <MentionText text={contentText} className="text-gray-800 leading-relaxed block whitespace-pre-wrap" />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag: string, idx: number) => (
                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Engagement stats */}
        <div className="px-4 md:px-5 py-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-500" />
                <span>{formatNumber(reactionCounts.heard)}</span>
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                <span>{formatNumber(reactionCounts.validated)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                <span>{formatNumber(reactionCounts.inspired)}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>{formatNumber(commentsCount)} comments</span>
              {sharesCount !== undefined && (
                <span>{formatNumber(sharesCount)} shares</span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-3 sm:px-5 py-2 border-t border-gray-100">
          <div className="flex items-center justify-around gap-1">
            <button
              onClick={() => handleReaction("heard")}
              className={`p-2 rounded-lg hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 ${
                userReactions.heard ? "text-red-500 bg-red-50" : "text-gray-500"
              }`}
              title="Heard"
            >
              <Heart className={`w-5 h-5 transition-transform duration-200 ${userReactions.heard ? "fill-red-500" : ""}`} />
            </button>
            <button
              onClick={() => handleReaction("validated")}
              className={`p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 ${
                userReactions.validated ? "text-blue-600 bg-blue-50" : "text-gray-500"
              }`}
              title="Validated"
            >
              <ThumbsUp className={`w-5 h-5 transition-transform duration-200 ${userReactions.validated ? "fill-blue-600" : ""}`} />
            </button>
            <button
              onClick={() => handleReaction("inspired")}
              className={`p-2 rounded-lg hover:bg-yellow-50 transition-all duration-200 hover:scale-110 active:scale-95 ${
                userReactions.inspired ? "text-yellow-500 bg-yellow-50" : "text-gray-500"
              }`}
              title="Inspired"
            >
              <Star className={`w-5 h-5 transition-transform duration-200 ${userReactions.inspired ? "fill-yellow-500" : ""}`} />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />
            <button
              onClick={() => setShowComments(!showComments)}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                showComments ? "text-blue-600 bg-blue-50" : "text-gray-500"
              }`}
              title="Comment"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 ${
                isBookmarked ? "text-amber-600 bg-amber-50" : "text-gray-500"
              }`}
              title={isBookmarked ? "Saved" : "Save"}
            >
              <Bookmark className={`w-5 h-5 transition-transform duration-200 ${isBookmarked ? "fill-amber-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="border-t border-gray-100">
            {loadingComments ? (
              <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading comments...</span>
              </div>
            ) : comments.length > 0 ? (
              <div className="px-4 md:px-5 pt-4 pb-2 space-y-3 max-h-64 md:max-h-96 overflow-y-auto">
                {comments.map((c) => renderCommentNode(c, 0))}
              </div>
            ) : (
              <div className="px-4 md:px-5 pt-4 pb-2">
                <p className="text-xs text-gray-400 text-center">No comments yet — be the first!</p>
              </div>
            )}
            {replyingTo && (
              <div className="px-4 py-2 bg-purple-50 border-t border-purple-200 flex items-center justify-between">
                <span className="text-xs text-purple-700 font-medium">
                  Replying to {replyingTo.authorName}
                </span>
                <button onClick={() => setReplyingTo(null)} className="text-purple-500 hover:text-purple-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <InlineCommentInput
              onSubmit={handleCommentSubmit}
              onCancel={() => { setShowComments(false); setReplyingTo(null); }}
              placeholder={replyingTo ? `Reply to ${replyingTo.authorName}...` : "Share your thoughts..."}
            />
          </div>
        )}
      </div>
    </div>
  );
}
