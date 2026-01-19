import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Heart,
  Bookmark,
  Share2,
  Users as UsersIcon,
  FileText,
  X,
  ThumbsUp,
  MoreHorizontal,
  Globe,
  Send,
  Zap,
  Eye,
  Clock,
  Flame,
  Building,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";
import { UserProfileModal } from "../../Modals/UserProfileModal";
import { ViewersModal } from "../../Modals/ViewersModal";
import { InlineCommentInput } from "../Forum/InlineCommentInput";

interface FeedItem {
  id: string;
  content_type: "topic" | "nook" | "post";
  content_id: string;
  user_id: string;
  author: {
    display_name: string;
    avatar_url?: string;
    bio?: string;
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
  created_at: string;
  user_has_liked?: boolean;
  user_has_bookmarked?: boolean;
  privacy?: "public" | "connections" | "private";
}

const DUMMY_FEED_DATA: FeedItem[] = [
  {
    id: "1",
    content_type: "topic",
    content_id: "topic-123",
    user_id: "user1",
    author: {
      display_name: "Anonymous Phoenix",
      bio: "Tech enthusiast | Mentor",
    },
    content: {
      title: "How do you handle imposter syndrome in senior roles?",
      text: "I recently got promoted to a senior position and I'm feeling overwhelmed. Even though I've been in tech for 8 years, I constantly feel like I don't belong here. Has anyone else experienced this? How did you overcome it?",
      forum_name: "Career Growth",
      tags: ["career", "mental-health", "advice"],
    },
    engagement: {
      likes: 156,
      comments: 43,
      seen: 892,
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    content_type: "nook",
    content_id: "nook-456",
    user_id: "user2",
    author: {
      display_name: "Silent Warrior",
      bio: "Software Engineer | Career Coach",
    },
    content: {
      title: "Morning Motivation",
      text: "Just a reminder that your journey is unique. Don't compare your chapter 1 to someone else's chapter 20. Keep pushing forward! 💪",
      nook_name: "Daily Inspiration",
      nook_urgency: "medium",
      nook_scope: "global",
      nook_temperature: "warm",
      nook_members: 15,
      nook_time_left: "18h 42m",
    },
    engagement: {
      likes: 234,
      comments: 18,
    },
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    content_type: "topic",
    content_id: "topic-789",
    user_id: "user3",
    author: {
      display_name: "Brave Soul",
      bio: "UX Designer",
    },
    content: {
      title: "Tips for transitioning from design to product management?",
      text: "I've been working as a UX designer for 5 years and I'm considering a move into product management. Would love to hear from anyone who made a similar transition. What skills did you need to develop? Any resources you'd recommend?",
      forum_name: "Career Transitions",
      tags: ["career-change", "product-management", "design"],
    },
    engagement: {
      likes: 89,
      comments: 32,
      seen: 456,
    },
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    content_type: "post",
    content_id: "post-101",
    user_id: "user4",
    author: {
      display_name: "Rising Star",
      bio: "Full Stack Developer",
    },
    content: {
      text: "Celebrating a small win today - my code review feedback was actually positive! After months of learning and improving, it feels amazing to be recognized. To anyone struggling right now: keep going, progress isn't always visible but it's happening. 🎉",
    },
    engagement: {
      likes: 342,
      comments: 56,
      shares: 12,
      seen: 892,
    },
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    content_type: "topic",
    content_id: "topic-202",
    user_id: "user5",
    author: {
      display_name: "Quiet Champion",
      bio: "Engineering Manager",
    },
    content: {
      title:
        "How to give constructive feedback without demotivating team members?",
      text: "I'm a new manager and I struggle with giving negative feedback. I want to help my team improve but I'm worried about hurting morale. How do you balance being honest with being supportive?",
      forum_name: "Leadership & Management",
      tags: ["management", "feedback", "leadership"],
    },
    engagement: {
      likes: 127,
      comments: 67,
      seen: 678,
    },
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "6",
    content_type: "nook",
    content_id: "nook-303",
    user_id: "user6",
    author: {
      display_name: "Hidden Gem",
      bio: "Data Analyst",
    },
    content: {
      title: "Weekend Wins",
      text: "Share your professional wins from this week! Big or small, let's celebrate together. I'll start: I finally automated that boring task that was taking 2 hours every day. Now it runs in 5 minutes! 🚀",
      nook_name: "Weekly Reflections",
      nook_urgency: "low",
      nook_scope: "company",
      nook_temperature: "hot",
      nook_members: 23,
      nook_time_left: "21h 15m",
    },
    engagement: {
      likes: 198,
      comments: 87,
    },
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "7",
    content_type: "topic",
    content_id: "topic-404",
    user_id: "user7",
    author: {
      display_name: "Mystery Maven",
      bio: "Product Designer",
    },
    content: {
      title: "Resources for learning system design?",
      text: "I'm preparing for senior engineer interviews and need to brush up on system design. What are the best resources you've used? Looking for both theoretical knowledge and practical examples.",
      forum_name: "Tech Skills",
      tags: ["system-design", "interview-prep", "learning"],
    },
    engagement: {
      likes: 213,
      comments: 94,
      seen: 1234,
    },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "8",
    content_type: "post",
    content_id: "post-505",
    user_id: "user8",
    author: {
      display_name: "Anonymous Ace",
      bio: "DevOps Engineer",
    },
    content: {
      text: "PSA: Take your lunch breaks. Take your vacation days. Your productivity will thank you. I learned this the hard way after burning out last year. Your company will survive without you for an hour or a week. You won't survive without taking care of yourself. 💚",
    },
    engagement: {
      likes: 567,
      comments: 123,
      shares: 45,
      seen: 1543,
    },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "9",
    content_type: "nook",
    content_id: "nook-404",
    user_id: "user9",
    author: {
      display_name: "Shadow Knight",
      bio: "Security Engineer",
    },
    content: {
      title: "Workplace Microaggressions",
      text: "Safe space to share and process daily microaggressions. You're not alone in experiencing these subtle but damaging interactions. Let's support each other.",
      nook_name: "Support Circle",
      nook_urgency: "high",
      nook_scope: "company",
      nook_temperature: "hot",
      nook_members: 8,
      nook_time_left: "4h 32m",
    },
    engagement: {
      likes: 178,
      comments: 71,
    },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "10",
    content_type: "topic",
    content_id: "topic-505",
    user_id: "user10",
    author: {
      display_name: "Veiled Visionary",
      bio: "Startup Founder",
    },
    content: {
      title: "Balancing startup life with personal relationships",
      text: "How do you manage to maintain meaningful relationships when building a startup? I feel like I'm constantly choosing between my company and my loved ones. Any advice from founders who've found a balance?",
      forum_name: "Entrepreneurship",
      tags: ["work-life-balance", "startup", "relationships"],
    },
    engagement: {
      likes: 289,
      comments: 134,
      seen: 987,
    },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function FeedsView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>(DUMMY_FEED_DATA);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
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

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url, bio")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: postContent,
        post_type: "post",
        privacy: "public",
      });

      if (error) throw error;

      setPostContent("");
      setShowCreatePost(false);
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
    navigate("/dashboard/messages", { state: { startChatWith: userId } });
  };

  const handleLike = (itemId: string) => {
    setFeedItems(
      feedItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            user_has_liked: !item.user_has_liked,
            engagement: {
              ...item.engagement,
              likes: item.user_has_liked
                ? item.engagement.likes - 1
                : item.engagement.likes + 1,
            },
          };
        }
        return item;
      })
    );
  };

  const handleBookmark = (itemId: string) => {
    setFeedItems(
      feedItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            user_has_bookmarked: !item.user_has_bookmarked,
          };
        }
        return item;
      })
    );
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

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          url: shareUrl,
        });
        setFeedItems(
          feedItems.map((i) => {
            if (i.id === itemId && i.engagement.shares !== undefined) {
              return {
                ...i,
                engagement: {
                  ...i.engagement,
                  shares: i.engagement.shares + 1,
                },
              };
            }
            return i;
          })
        );
      } catch (error) {
        console.log("Share cancelled or failed");
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
      setFeedItems(
        feedItems.map((i) => {
          if (i.id === itemId && i.engagement.shares !== undefined) {
            return {
              ...i,
              engagement: {
                ...i.engagement,
                shares: i.engagement.shares + 1,
              },
            };
          }
          return i;
        })
      );
    }
  };

  const handleCommentClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCommentId(activeCommentId === itemId ? null : itemId);
  };

  const handleCommentSubmit = async (itemId: string, comment: string) => {
    console.log("Comment submitted for item:", itemId, "Comment:", comment);
    setFeedItems(
      feedItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            engagement: {
              ...item.engagement,
              comments: item.engagement.comments + 1,
            },
          };
        }
        return item;
      })
    );
    setActiveCommentId(null);
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.display_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(
                  userProfile?.display_name || "User"
                )}`}
              >
                {(userProfile?.display_name || "U").charAt(0).toUpperCase()}
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
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.display_name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${getAvatarColor(
                      userProfile?.display_name || "User"
                    )}`}
                  >
                    {(userProfile?.display_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {userProfile?.display_name || "Anonymous User"}
                  </h3>
                  <p className="text-sm text-gray-500">Sharing publicly</p>
                </div>
              </div>

              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
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
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                            {item.content.text}
                          </p>
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
                      <p className="text-gray-600 line-clamp-2 mb-3">
                        {item.content.text}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleUserClick(item.user_id)}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          {item.author.avatar_url ? (
                            <img
                              src={item.author.avatar_url}
                              alt={item.author.display_name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(
                                item.author.display_name
                              )}`}
                            >
                              {item.author.display_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{item.author.display_name}</span>
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
                              item.engagement.seen,
                              e
                            )
                          }
                          className="flex items-center gap-2 text-sm hover:text-green-600 transition-colors text-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{formatNumber(item.engagement.seen)}</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => handleLikeClick(item.id, e)}
                        className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors text-gray-600"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{formatNumber(item.engagement.likes)}</span>
                      </button>
                      <button
                        onClick={(e) => handleCommentClick(item.id, e)}
                        className={`flex items-center gap-2 text-sm hover:text-blue-600 transition-colors ${
                          activeCommentId === item.id
                            ? "text-blue-600 font-semibold"
                            : "text-gray-600"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>
                          {formatNumber(item.engagement.comments)} comments
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
                    <InlineCommentInput
                      onSubmit={(comment) =>
                        handleCommentSubmit(item.id, comment)
                      }
                      onCancel={handleCommentCancel}
                      placeholder="Share your thoughts on this topic..."
                    />
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
                      <button
                        onClick={() => handleUserClick(item.user_id)}
                        className="flex-shrink-0"
                      >
                        {item.author.avatar_url ? (
                          <img
                            src={item.author.avatar_url}
                            alt={item.author.display_name}
                            className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-blue-500 transition-all"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-blue-500 transition-all ${getAvatarColor(
                              item.author.display_name
                            )}`}
                          >
                            {item.author.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleUserClick(item.user_id)}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {item.author.display_name}
                          </button>
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
                    <p className="text-gray-800 leading-relaxed">
                      {item.content.text}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => handleLikeClick(item.id, e)}
                        className="flex items-center gap-1 hover:underline"
                      >
                        <ThumbsUp className="w-4 h-4 text-blue-500 fill-blue-500" />
                        <span>{formatNumber(item.engagement.likes)}</span>
                      </button>
                      {item.engagement.seen !== undefined && (
                        <button
                          onClick={(e) =>
                            handleViewersClick(
                              item.id,
                              item.content_type,
                              item.engagement.seen,
                              e
                            )
                          }
                          className="flex items-center gap-1 hover:text-green-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{formatNumber(item.engagement.seen)}</span>
                        </button>
                      )}
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

                <div className="px-4 py-2 border-t border-gray-100">
                  <div className="flex items-center justify-around">
                    <button
                      onClick={(e) => handleLikeClick(item.id, e)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-1 justify-center ${
                        item.user_has_liked
                          ? "text-blue-600 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          item.user_has_liked ? "fill-blue-600" : ""
                        }`}
                      />
                      <span>Like</span>
                    </button>
                    <button
                      onClick={(e) => handleCommentClick(item.id, e)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-1 justify-center ${
                        activeCommentId === item.id
                          ? "text-blue-600 font-semibold bg-blue-50"
                          : "text-gray-600"
                      }`}
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Comment</span>
                    </button>
                    <button
                      onClick={(e) => handleShare(item.id, e)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors flex-1 justify-center"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(item.id);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-1 justify-center ${
                        item.user_has_bookmarked
                          ? "text-amber-600 font-semibold"
                          : "text-gray-600"
                      }`}
                      title={item.user_has_bookmarked ? "Saved" : "Save"}
                    >
                      <Bookmark
                        className={`w-5 h-5 ${
                          item.user_has_bookmarked ? "fill-amber-600" : ""
                        }`}
                      />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                {activeCommentId === item.id && (
                  <InlineCommentInput
                    onSubmit={(comment) =>
                      handleCommentSubmit(item.id, comment)
                    }
                    onCancel={handleCommentCancel}
                    placeholder="Write a comment..."
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {feedItems.length > 0 && (
        <div className="mt-6 text-center">
          <button className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 font-medium">
            Load more
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
