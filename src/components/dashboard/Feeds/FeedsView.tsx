import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { resolveDisplayName } from "../../../utils/nameUtils";
import {
  MessageSquare,
  Heart,
  Bookmark,
  Share2,
  Users as UsersIcon,
  FileText,
  X,
  ThumbsUp,
  Star,
  MoreHorizontal,
  Globe,
  Send,
  Zap,
  Eye,
  Clock,
  Flame,
  Building,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  GetFeed,
  CreatePost,
  ToggleLike,
  ToggleFeedReaction,
  AddComment,
  GetComments,
  ShareItem,
  ToggleBookmark,
} from "../../../../api/feedApis";
import { GetAllCommentsForATopic, CreateForumTopicsComments } from "../../../../api/forumApis";
import { UserProfileModal } from "../../Modals/UserProfileModal";
import { showToast } from "../../../Helper/ShowToast";
import { ViewersModal } from "../../Modals/ViewersModal";
import { InlineCommentInput } from "../Forum/InlineCommentInput";
import { MentionTextarea } from "../../shared/MentionTextarea";
import { FeedSkeleton } from "../../../Helper/SkeletonLoader";
import { MentionText } from "../../shared/MentionText";

interface FeedItem {
  id: string;
  content_type: "topic" | "nook" | "post";
  content_id: string;
  user_id: string;
  is_anonymous: boolean;
  author: {
    display_name: string;
    username?: string;
    avatar?: string | null;
    bio?: string | null;
  };
  content: {
    title?: string;
    text: string;
    forum_name?: string;
    nook_name?: string;
    tags?: string[];
    nook_urgency?: "high" | "medium" | "low";
    nook_scope?: "company" | "global";
    nook_temperature?: "hot" | "warm" | "cool";
    nook_members?: number;
    nook_time_left?: string;
  };
  engagement: {
    likes: number;
    comments: number;
    shares?: number;
    seen?: number;
  };
  reaction_counts: {
    heard: number;
    validated: number;
    inspired: number;
  };
  user_reactions: {
    heard: boolean;
    validated: boolean;
    inspired: boolean;
  };
  created_at: string;
  user_has_liked?: boolean;
  user_has_bookmarked?: boolean;
  user_has_shared?: boolean;
  privacy?: "public" | "connections" | "private";
}

interface FeedComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
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

export function FeedsView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [selectedViewersItem, setSelectedViewersItem] = useState<{
    id: string;
    type: "post" | "topic" | "nook";
    viewers: number;
  } | null>(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [expandedComments, setExpandedComments] = useState<Record<string, FeedComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFeed(1);
  }, []);

  const isEmojiAvatar = (avatar?: string | null): boolean => {
    if (!avatar || avatar.startsWith("http") || avatar.startsWith("/") || avatar.startsWith("data:")) return false;
    return true; // Emoji or short text like "📦"
  };

  const normalizeFeedItem = (item: any): FeedItem => {
    // Handle flat post structure where content is a string (from /feeds/users/:id/posts)
    const contentIsString = typeof item.content === "string";
    const contentObj = contentIsString ? null : item.content;

    return {
    ...item,
    id: item.id,
    content_type: item.content_type === "nook_message" ? "nook" : (item.content_type ?? "post"),
    content_id: item.content_id ?? item.id,
    user_id: item.user_id,
    is_anonymous: item.is_anonymous ?? false,
    author: {
      display_name: resolveDisplayName(item.author?.display_name, item.author?.username),
      username: item.author?.username,
      avatar: item.author?.avatar || item.author?.avatar_url || null,
      bio: item.author?.bio || null,
    },
    engagement: {
      likes: item.engagement?.likes ?? item.likes_count ?? 0,
      comments: item.engagement?.comments ?? item.comments_count ?? 0,
      shares: item.engagement?.shares ?? item.shares_count,
      seen: item.engagement?.seen ?? item.views_count,
    },
    content: {
      title: contentObj?.title ?? item.title,
      text: contentObj?.text ?? (contentIsString ? item.content : "") ?? "",
      forum_name: contentObj?.forum_name ?? item.forum_name,
      nook_name: contentObj?.nook_name ?? item.nook_name,
      tags: contentObj?.tags ?? item.tags ?? [],
      nook_urgency: contentObj?.nook_urgency ?? item.nook_urgency,
      nook_scope: contentObj?.nook_scope ?? item.nook_scope,
      nook_temperature: contentObj?.nook_temperature ?? item.nook_temperature,
      nook_members: contentObj?.nook_members ?? item.nook_members,
      nook_time_left: contentObj?.nook_time_left ?? item.nook_time_left,
    },
    reaction_counts: {
      heard: item.reaction_counts?.heard ?? 0,
      validated: item.reaction_counts?.validated ?? 0,
      inspired: item.reaction_counts?.inspired ?? 0,
    },
    user_reactions: {
      heard: item.user_reactions?.heard ?? false,
      validated: item.user_reactions?.validated ?? false,
      inspired: item.user_reactions?.inspired ?? false,
    },
    user_has_liked: item.user_has_liked ?? item.user_liked ?? false,
    user_has_bookmarked: item.user_has_bookmarked ?? item.user_bookmarked ?? false,
    user_has_shared: item.user_has_shared ?? item.user_shared ?? false,
  };
  };

  const loadFeed = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await GetFeed({ page, limit: 20 });

      const raw = Array.isArray(response) ? response : (response?.items ?? response?.posts ?? []);
      const items = (Array.isArray(raw) ? raw : []).map(normalizeFeedItem);

      if (page === 1) {
        setFeedItems(items);
      } else {
        setFeedItems((prev) => [...prev, ...items]);
      }

      const pagination = response?.pagination;
      setHasMore(pagination?.hasMore ?? items.length >= 20);
      setCurrentPage(page);
    } catch {
      if (page === 1) setFeedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadFeed(currentPage + 1);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return;

    try {
      setSubmitting(true);
      await CreatePost({
        content: postContent,
        visibility: "global",
      });

      setPostContent("");
      setShowCreatePost(false);
      loadFeed(1);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemClick = (item: FeedItem) => {
    switch (item.content_type) {
      case "topic":
        navigate(`/dashboard/forums/topic/${item.content_id}`);
        break;
      case "nook":
        navigate(`/dashboard/nooks/${item.content_id}`);
        break;
      case "post":
        break;
    }
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserProfileModal(true);
  };

  const handleChat = (userId: string) => {
    navigate("/dashboard/messages", { state: { startChatWith: userId, contextType: "regular" } });
  };

  const handleLike = async (itemId: string) => {
    const item = feedItems.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update — use callback form to avoid stale closure over feedItems
    setFeedItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              user_has_liked: !i.user_has_liked,
              engagement: {
                ...i.engagement,
                likes: i.user_has_liked ? i.engagement.likes - 1 : i.engagement.likes + 1,
              },
            }
          : i
      )
    );

    try {
      const contentType = item.content_type === "nook" ? "nook_message" : item.content_type;
      await ToggleLike(contentType as "post" | "topic" | "nook_message", item.content_id);
    } catch {
      // Revert on failure
      setFeedItems((prev) =>
        prev.map((i) => (i.id === itemId ? item : i))
      );
    }
  };

  const handleReaction = async (itemId: string, reactionType: "heard" | "validated" | "inspired") => {
    const item = feedItems.find((i) => i.id === itemId);
    if (!item) return;

    const wasActive = item.user_reactions[reactionType];

    // Optimistic update
    setFeedItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              user_reactions: { ...i.user_reactions, [reactionType]: !wasActive },
              reaction_counts: {
                ...i.reaction_counts,
                [reactionType]: i.reaction_counts[reactionType] + (wasActive ? -1 : 1),
              },
            }
          : i
      )
    );

    try {
      const contentType = item.content_type === "nook" ? "nook_message" : item.content_type;
      await ToggleFeedReaction(contentType as "post" | "topic" | "nook_message", item.content_id, reactionType);
    } catch {
      // Revert on failure
      setFeedItems((prev) =>
        prev.map((i) => (i.id === itemId ? item : i))
      );
    }
  };

  const handleBookmark = async (itemId: string) => {
    const item = feedItems.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update — use callback form
    setFeedItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, user_has_bookmarked: !i.user_has_bookmarked } : i
      )
    );

    try {
      const contentType = item.content_type === "nook" ? "nook_message" : item.content_type;
      await ToggleBookmark(contentType as "post" | "topic" | "nook_message", item.content_id);
    } catch {
      // Revert on failure
      setFeedItems((prev) =>
        prev.map((i) => (i.id === itemId ? item : i))
      );
    }
  };

  const handleShare = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = feedItems.find((i) => i.id === itemId);
    if (!item) return;

    const shareUrl = `${window.location.origin}/dashboard/feeds`;
    const shareText =
      item.content_type === "topic"
        ? `Check out this topic: ${item.content.title}`
        : `Check out this post`;

    // Call share API
    try {
      const contentType = item.content_type === "nook" ? "nook_message" : item.content_type;
      await ShareItem(contentType as "post" | "topic" | "nook_message", item.content_id);
    } catch {
      // Non-blocking - share API failure shouldn't block native share
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
        setFeedItems(
          feedItems.map((i) => {
            if (i.id === itemId && i.engagement.shares !== undefined) {
              return {
                ...i,
                engagement: { ...i.engagement, shares: i.engagement.shares + 1 },
              };
            }
            return i;
          })
        );
      } catch {
        // Share cancelled or failed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied to clipboard!", "success");
      setFeedItems(
        feedItems.map((i) => {
          if (i.id === itemId && i.engagement.shares !== undefined) {
            return {
              ...i,
              engagement: { ...i.engagement, shares: i.engagement.shares + 1 },
            };
          }
          return i;
        })
      );
    }
  };

  const fetchCommentsForItem = async (item: FeedItem) => {
    setLoadingComments((prev) => ({ ...prev, [item.id]: true }));
    try {
      let raw: any[];

      if (item.content_type === "topic") {
        // Use forum API for topic comments
        const response = await GetAllCommentsForATopic(item.content_id);
        raw = response?.comments ?? (Array.isArray(response) ? response : []);
      } else {
        // Use feed API for post / nook_message comments
        const contentType = item.content_type === "nook" ? "nook_message" : item.content_type;
        const response = await GetComments(
          contentType as "post" | "nook_message",
          item.content_id
        );
        raw = response?.comments ?? (Array.isArray(response) ? response : []);
      }

      const comments: FeedComment[] = Array.isArray(raw) ? raw : [];
      setExpandedComments((prev) => ({ ...prev, [item.id]: comments }));
    } catch {
      setExpandedComments((prev) => ({ ...prev, [item.id]: [] }));
    } finally {
      setLoadingComments((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleCommentClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isOpening = activeCommentId !== itemId;
    setActiveCommentId(isOpening ? itemId : null);

    // Fetch comments when expanding
    if (isOpening) {
      const item = feedItems.find((i) => i.id === itemId);
      if (item && !expandedComments[itemId]) {
        fetchCommentsForItem(item);
      }
    }
  };

  const handleCommentSubmit = async (itemId: string, comment: string) => {
    const item = feedItems.find((i) => i.id === itemId);
    if (!item) return;

    try {
      if (item.content_type === "topic") {
        await CreateForumTopicsComments({
          content: comment,
          topicId: item.content_id,
          isAnonymous: true,
        });
      } else {
        const contentType = item.content_type === "nook" ? "nook_message" : item.content_type;
        await AddComment(contentType as "post" | "nook_message", item.content_id, {
          content: comment,
        });
      }
      setFeedItems(
        feedItems.map((i) => {
          if (i.id === itemId) {
            return {
              ...i,
              engagement: {
                ...i.engagement,
                comments: i.engagement.comments + 1,
              },
            };
          }
          return i;
        })
      );
      // Refresh comments to include the new one
      await fetchCommentsForItem(item);
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  const handleCommentCancel = () => {
    setActiveCommentId(null);
  };

  const handleViewersClick = (
    itemId: string,
    itemType: "post" | "topic" | "nook",
    viewersCount: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedViewersItem({
      id: itemId,
      type: itemType,
      viewers: viewersCount,
    });
    setShowViewersModal(true);
  };

  const handleLikeClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleLike(itemId);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
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

  const getAvatarColor = (displayName: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-pink-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-cyan-500",
    ];
    const index =
      displayName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  const renderAvatar = (avatar: string | null | undefined, displayName: string, size: string = "w-12 h-12", textSize: string = "text-2xl") => {
    if (!avatar) {
      return (
        <div className={`${size} rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(displayName)}`}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      );
    }
    // If avatar is a URL (http, /, data:), render as image
    if (avatar.startsWith("http") || avatar.startsWith("/") || avatar.startsWith("data:")) {
      return (
        <img src={avatar} alt={displayName} className={`${size} rounded-full object-cover`} />
      );
    }
    // Otherwise it's an emoji or short text — render as text
    return (
      <div className={`${size} rounded-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 ${textSize}`}>
        {avatar}
      </div>
    );
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "high":
        return "from-red-500 to-orange-500";
      case "medium":
        return "from-yellow-500 to-amber-500";
      case "low":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getTemperatureIcon = (temperature?: string) => {
    switch (temperature) {
      case "hot":
        return <Flame className="w-4 h-4 text-red-500" />;
      case "warm":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "cool":
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <FeedSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br from-purple-100 to-blue-100">
                {user.avatar}
              </div>
            ) : (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(
                  user?.username || "User"
                )}`}
              >
                {(user?.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <button
              className="flex-1 text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              onClick={() => setShowCreatePost(true)}
            >
              Share your thoughts...
            </button>
          </div>
        </div>
      </div>

      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Share Your Thoughts
              </h2>
              <button
                onClick={() => setShowCreatePost(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                {user?.avatar ? (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex-shrink-0">
                    {user.avatar}
                  </div>
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${getAvatarColor(
                      user?.username || "User"
                    )}`}
                  >
                    {(user?.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user?.username || "Anonymous User"}
                  </h3>
                  <p className="text-sm text-gray-500">Sharing publicly</p>
                </div>
              </div>

              <MentionTextarea
                value={postContent}
                onChange={setPostContent}
                placeholder="What's on your mind? Use @ to mention someone"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                autoFocus
              />

              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Post will appear on your feed timeline
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreatePost(false)}
                    className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={!postContent.trim() || submitting}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {feedItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your feed is empty
            </h3>
            <p className="text-gray-600 mb-6">
              Join forums and follow people to see their content here!
            </p>
            <button
              onClick={() => navigate("/dashboard/forums")}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Explore Forums
            </button>
          </div>
        ) : (
          feedItems.map((item) => {
            if (item.content_type === "nook") {
              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => handleItemClick(item)}
                >
                  <div
                    className={`bg-gradient-to-r ${getUrgencyColor(
                      item.content.nook_urgency
                    )} p-1`}
                  >
                    <div className="bg-white/95 backdrop-blur-sm p-4 rounded-t-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-purple-600" />
                            <span className="text-xs font-medium text-purple-600">
                              Nook
                            </span>
                            {item.content.nook_name && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-xs text-purple-600 font-medium">
                                  {item.content.nook_name}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-purple-600 transition-colors">
                            {item.content.title}
                          </h3>
                          <MentionText
                            text={item.content.text}
                            className="text-gray-600 text-sm leading-relaxed line-clamp-2 block"
                          />
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          {getTemperatureIcon(item.content.nook_temperature)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {item.content.nook_members}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Anonymous
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {item.engagement.comments}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Messages
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {item.content.nook_time_left}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Remaining
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.content.nook_urgency === "high"
                              ? "bg-red-100 text-red-700"
                              : item.content.nook_urgency === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.content.nook_urgency?.toUpperCase()}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                            item.content.nook_scope === "company"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.content.nook_scope === "company" ? (
                            <Building className="w-3 h-3" />
                          ) : (
                            <Globe className="w-3 h-3" />
                          )}
                          {item.content.nook_scope}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.content_type === "topic") {
              return (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">
                          Topic
                        </span>
                        {item.content.forum_name && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-blue-600 font-medium">
                              {item.content.forum_name}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2">
                        {item.content.title}
                      </h3>
                      <MentionText
                        text={item.content.text}
                        className="text-gray-600 line-clamp-2 mb-3 block"
                      />

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUserClick(item.user_id); }}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          {renderAvatar(item.author.avatar, resolveDisplayName(item.author.display_name, item.author.username), "w-6 h-6", "text-sm")}
                          <span>{resolveDisplayName(item.author.display_name, item.author.username)}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeAgo(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      {item.engagement.seen !== undefined && (
                        <button
                          onClick={(e) =>
                            handleViewersClick(
                              item.id,
                              "topic",
                              item.engagement.seen ?? 0,
                              e
                            )
                          }
                          className="flex items-center gap-2 text-sm hover:text-green-600 transition-colors text-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{formatNumber(item.engagement.seen ?? 0)}</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReaction(item.id, "heard"); }}
                        className={`flex items-center gap-1.5 text-sm transition-all duration-200 hover:scale-110 active:scale-95 ${
                          item.user_reactions.heard ? "text-red-500 font-semibold" : "text-gray-600 hover:text-red-500"
                        }`}
                      >
                        <Heart className={`w-4 h-4 transition-transform duration-200 ${item.user_reactions.heard ? "fill-red-500 animate-reaction-pop" : ""}`} />
                        <span>{formatNumber(item.reaction_counts.heard)}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReaction(item.id, "validated"); }}
                        className={`flex items-center gap-1.5 text-sm transition-all duration-200 hover:scale-110 active:scale-95 ${
                          item.user_reactions.validated ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 transition-transform duration-200 ${item.user_reactions.validated ? "fill-blue-600 animate-reaction-pop" : ""}`} />
                        <span>{formatNumber(item.reaction_counts.validated)}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReaction(item.id, "inspired"); }}
                        className={`flex items-center gap-1.5 text-sm transition-all duration-200 hover:scale-110 active:scale-95 ${
                          item.user_reactions.inspired ? "text-yellow-500 font-semibold" : "text-gray-600 hover:text-yellow-500"
                        }`}
                      >
                        <Star className={`w-4 h-4 transition-transform duration-200 ${item.user_reactions.inspired ? "fill-yellow-500 animate-reaction-pop" : ""}`} />
                        <span>{formatNumber(item.reaction_counts.inspired)}</span>
                      </button>
                      <button
                        onClick={(e) => handleCommentClick(item.id, e)}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${
                          activeCommentId === item.id
                            ? "text-blue-600 font-semibold"
                            : "text-gray-600 hover:text-blue-600"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>
                          {formatNumber(item.engagement.comments)}
                        </span>
                      </button>
                    </div>

                    {item.content.tags && item.content.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.content.tags.slice(0, 3).map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/hashtag/${tag}`);
                            }}
                            className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {activeCommentId === item.id && (
                    <div className="border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                      {/* Existing comments */}
                      {loadingComments[item.id] ? (
                        <div className="flex items-center justify-center py-4 gap-2 text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Loading comments...</span>
                        </div>
                      ) : expandedComments[item.id] && expandedComments[item.id].length > 0 ? (
                        <div className="px-4 pt-3 pb-1 space-y-3 max-h-64 overflow-y-auto">
                          {expandedComments[item.id].map((c) => (
                            <div key={c.id} className="flex items-start gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${getAvatarColor(resolveDisplayName(c.author?.display_name, c.user_profile?.display_name, c.user_profile?.username))} text-white`}>
                                {c.author?.avatar || c.user_profile?.avatar || resolveDisplayName(c.author?.display_name, c.user_profile?.display_name, c.user_profile?.username).charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-800">
                                    {resolveDisplayName(c.author?.display_name, c.user_profile?.display_name, c.user_profile?.username)}
                                  </span>
                                  <span className="text-xs text-gray-400">{formatTimeAgo(c.created_at)}</span>
                                </div>
                                <MentionText text={c.content} className="text-sm text-gray-700 leading-relaxed block" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-xs text-gray-400 text-center">No comments yet — be the first!</p>
                        </div>
                      )}
                      <InlineCommentInput
                        onSubmit={(comment) =>
                          handleCommentSubmit(item.id, comment)
                        }
                        onCancel={handleCommentCancel}
                        placeholder="Share your thoughts on this topic..."
                      />
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {item.is_anonymous ? (
                        <div className="flex-shrink-0">
                          {renderAvatar(item.author.avatar, item.author.display_name, "w-12 h-12", "text-2xl")}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUserClick(item.user_id)}
                          className="flex-shrink-0"
                        >
                          {renderAvatar(item.author.avatar, item.author.display_name, "w-12 h-12", "text-2xl")}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.is_anonymous ? (
                            <span className="font-semibold text-gray-900">
                              {item.author.display_name}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleUserClick(item.user_id)}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {item.author.display_name}
                            </button>
                          )}
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">
                            <FileText className="w-4 h-4" />
                            <span>Post</span>
                          </div>
                        </div>
                        {item.author.bio && (
                          <p className="text-sm text-gray-600">
                            {item.author.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                          <span>{formatTimeAgo(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                      <MoreHorizontal className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="mb-3">
                    <MentionText
                      text={item.content.text}
                      className="text-gray-800 leading-relaxed block"
                    />
                  </div>
                </div>

                <div className="px-4 py-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-red-500" />
                        <span>{formatNumber(item.reaction_counts.heard)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                        <span>{formatNumber(item.reaction_counts.validated)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500" />
                        <span>{formatNumber(item.reaction_counts.inspired)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleCommentClick(item.id, e)}
                        className="hover:underline"
                      >
                        {formatNumber(item.engagement.comments)} comments
                      </button>
                      {item.engagement.shares !== undefined && (
                        <button
                          onClick={(e) => handleShare(item.id, e)}
                          className="hover:underline"
                        >
                          {formatNumber(item.engagement.shares)} shares
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-3 sm:px-4 py-2 border-t border-gray-100">
                  <div className="flex items-center justify-around gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReaction(item.id, "heard"); }}
                      className={`p-2 rounded-lg hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 ${
                        item.user_reactions.heard ? "text-red-500 bg-red-50" : "text-gray-500"
                      }`}
                      title="Heard"
                    >
                      <Heart className={`w-5 h-5 transition-transform duration-200 ${item.user_reactions.heard ? "fill-red-500 animate-reaction-pop" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReaction(item.id, "validated"); }}
                      className={`p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 ${
                        item.user_reactions.validated ? "text-blue-600 bg-blue-50" : "text-gray-500"
                      }`}
                      title="Validated"
                    >
                      <ThumbsUp className={`w-5 h-5 transition-transform duration-200 ${item.user_reactions.validated ? "fill-blue-600 animate-reaction-pop" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReaction(item.id, "inspired"); }}
                      className={`p-2 rounded-lg hover:bg-yellow-50 transition-all duration-200 hover:scale-110 active:scale-95 ${
                        item.user_reactions.inspired ? "text-yellow-500 bg-yellow-50" : "text-gray-500"
                      }`}
                      title="Inspired"
                    >
                      <Star className={`w-5 h-5 transition-transform duration-200 ${item.user_reactions.inspired ? "fill-yellow-500 animate-reaction-pop" : ""}`} />
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />
                    <button
                      onClick={(e) => handleCommentClick(item.id, e)}
                      className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                        activeCommentId === item.id ? "text-blue-600 bg-blue-50" : "text-gray-500"
                      }`}
                      title="Comment"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => handleShare(item.id, e)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBookmark(item.id); }}
                      className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 ${
                        item.user_has_bookmarked ? "text-amber-600 bg-amber-50" : "text-gray-500"
                      }`}
                      title={item.user_has_bookmarked ? "Saved" : "Save"}
                    >
                      <Bookmark className={`w-5 h-5 transition-transform duration-200 ${item.user_has_bookmarked ? "fill-amber-600 animate-reaction-pop" : ""}`} />
                    </button>
                  </div>
                </div>

                {activeCommentId === item.id && (
                  <div className="border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                    {/* Existing comments */}
                    {loadingComments[item.id] ? (
                      <div className="flex items-center justify-center py-4 gap-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading comments...</span>
                      </div>
                    ) : expandedComments[item.id] && expandedComments[item.id].length > 0 ? (
                      <div className="px-4 pt-3 pb-1 space-y-3 max-h-64 overflow-y-auto">
                        {expandedComments[item.id].map((c) => (
                          <div key={c.id} className="flex items-start gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${getAvatarColor(c.author?.display_name || c.user_profile?.display_name || c.user_profile?.username || "U")} text-white`}>
                              {c.author?.avatar || c.user_profile?.avatar || (c.author?.display_name || c.user_profile?.display_name || c.user_profile?.username || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-800">
                                  {resolveDisplayName(c.author?.display_name, c.user_profile?.display_name, c.user_profile?.username)}
                                </span>
                                <span className="text-xs text-gray-400">{formatTimeAgo(c.created_at)}</span>
                              </div>
                              <MentionText text={c.content} className="text-sm text-gray-700 leading-relaxed block" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-xs text-gray-400 text-center">No comments yet — be the first!</p>
                      </div>
                    )}
                    <InlineCommentInput
                      onSubmit={(comment) =>
                        handleCommentSubmit(item.id, comment)
                      }
                      onCancel={handleCommentCancel}
                      placeholder="Write a comment..."
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {feedItems.length > 0 && hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 font-medium disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {showViewersModal && selectedViewersItem && (
        <ViewersModal
          isOpen={showViewersModal}
          onClose={() => {
            setShowViewersModal(false);
            setSelectedViewersItem(null);
          }}
          contentId={selectedViewersItem.id}
          contentType={selectedViewersItem.type}
          totalViewers={selectedViewersItem.viewers}
        />
      )}

      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        userId={selectedUserId}
        onChat={handleChat}
      />
    </div>
  );
}
