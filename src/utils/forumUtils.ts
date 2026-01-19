// src/utils/forumUtils.ts

/**
 * General formatter for Last Activities timestamps
 * Converts ISO date strings or Date objects to human-readable format
 */
export const formatLastActivity = (
  activity: string | Date | null | undefined
): string => {
  if (!activity) return "No activity";

  try {
    const date = typeof activity === "string" ? new Date(activity) : activity;
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;

    // For dates older than a year, show the actual date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting activity date:", error);
    return "Invalid date";
  }
};

/**
 * Format created date for full display
 */
export const formatCreatedDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting created date:", error);
    return "Invalid date";
  }
};

/**
 * Get time ago string (for comments, posts)
 */
export const getTimeAgo = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const mins = Math.floor((Date.now() - dateObj.getTime()) / 60000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    if (mins < 10080) return `${Math.floor(mins / 1440)}d ago`;
    if (mins < 43200) return `${Math.floor(mins / 10080)}w ago`;

    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        dateObj.getFullYear() !== new Date().getFullYear()
          ? "numeric"
          : undefined,
    });
  } catch (error) {
    console.error("Error getting time ago:", error);
    return "Invalid date";
  }
};

/**
 * Check if a date is within a specific time range
 */
export const isWithinTimeRange = (
  date: string | Date,
  range: "today" | "week" | "month" | "all"
): boolean => {
  if (range === "all") return true;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();

    const thresholds = {
      today: 86400000, // 24 hours
      week: 604800000, // 7 days
      month: 2592000000, // 30 days
    };

    return diffInMs <= thresholds[range];
  } catch (error) {
    console.error("Error checking time range:", error);
    return false;
  }
};

/**
 * Sort topics by different criteria
 */
export const sortTopics = (
  topics: any[],
  sortBy: "relevant" | "recent" | "popular" | "trending"
): any[] => {
  const sorted = [...topics];

  switch (sortBy) {
    case "relevant":
      return sorted.sort((a, b) => {
        const scoreA =
          (a.reactions?.seen || 0) * 1 +
          (a.reactions?.validated || 0) * 2 +
          (a.reactions?.inspired || 0) * 3 +
          (a.reactions?.heard || 0) * 2 +
          (a.commentCount || a.comments_count || 0) * 1.5;

        const scoreB =
          (b.reactions?.seen || 0) * 1 +
          (b.reactions?.validated || 0) * 2 +
          (b.reactions?.inspired || 0) * 3 +
          (b.reactions?.heard || 0) * 2 +
          (b.commentCount || b.comments_count || 0) * 1.5;

        return scoreB - scoreA;
      });

    case "recent":
      return sorted.sort((a, b) => {
        const dateA = new Date(
          a.last_activity_at || a.lastActivity || a.created_at
        ).getTime();
        const dateB = new Date(
          b.last_activity_at || b.lastActivity || b.created_at
        ).getTime();
        return dateB - dateA;
      });

    case "popular":
      return sorted.sort((a, b) => {
        const reactionsA = a.reactions
          ? Object.values(a.reactions).reduce(
              (sum: number, val: any) => sum + (val || 0),
              0
            )
          : 0;
        const reactionsB = b.reactions
          ? Object.values(b.reactions).reduce(
              (sum: number, val: any) => sum + (val || 0),
              0
            )
          : 0;
        return reactionsB - reactionsA;
      });

    case "trending":
      return sorted.sort((a, b) => {
        const now = Date.now();
        const dateA = new Date(
          a.last_activity_at || a.lastActivity || a.created_at
        ).getTime();
        const dateB = new Date(
          b.last_activity_at || b.lastActivity || b.created_at
        ).getTime();

        const hoursA = Math.max((now - dateA) / 3600000, 1);
        const hoursB = Math.max((now - dateB) / 3600000, 1);

        const reactionsA = a.reactions
          ? Object.values(a.reactions).reduce(
              (sum: number, val: any) => sum + (val || 0),
              0
            )
          : 0;
        const reactionsB = b.reactions
          ? Object.values(b.reactions).reduce(
              (sum: number, val: any) => sum + (val || 0),
              0
            )
          : 0;

        const commentsA = a.commentCount || a.comments_count || 0;
        const commentsB = b.commentCount || b.comments_count || 0;

        const scoreA = (reactionsA + commentsA) / hoursA;
        const scoreB = (reactionsB + commentsB) / hoursB;

        return scoreB - scoreA;
      });

    default:
      return sorted;
  }
};

/**
 * Transform API response to frontend format
 */
export const transformTopicFromAPI = (apiTopic: any): any => {
  return {
    id: apiTopic.id,
    title: apiTopic.title,
    content: apiTopic.content,
    author: {
      id: apiTopic.user_id,
      username: apiTopic.user_profile?.username || "Anonymous",
      avatar: apiTopic.user_profile?.avatar || "👤",
    },
    forumId: apiTopic.forum_id,
    companyId: apiTopic.company_name,
    scope: apiTopic.scope,
    isAnonymous: apiTopic.is_anonymous,
    isPinned: apiTopic.is_pinned,
    tags: apiTopic.tags || [],
    link: apiTopic.link,
    reactions: apiTopic.reactions || {
      seen: apiTopic.reaction_seen_count || 0,
      validated: apiTopic.reaction_validated_count || 0,
      inspired: apiTopic.reaction_inspired_count || 0,
      heard: apiTopic.reaction_heard_count || 0,
    },
    userReactions: apiTopic.userReactions || {
      seen: false,
      validated: false,
      inspired: false,
      heard: false,
    },
    commentCount: apiTopic.comments_count || apiTopic.commentCount || 0,
    views: apiTopic.views_count || 0,
    createdAt: apiTopic.created_at,
    lastActivity: apiTopic.last_activity_at,
    forum: apiTopic.forum,
  };
};

/**
 * Transform forum from API format
 */
export const transformForumFromAPI = (apiForum: any): any => {
  return {
    id: apiForum.id,
    name: apiForum.name,
    description: apiForum.description,
    icon: apiForum.icon,
    category: apiForum.category,
    isGlobal: apiForum.is_global,
    companyName: apiForum.company_name,
    topicCount: apiForum.topic_count || 0,
    memberCount: apiForum.member_count || 0,
    lastActivity: formatLastActivity(apiForum.last_activity),
    rules: apiForum.rules || [],
    moderators: apiForum.moderators || [],
    isJoined: apiForum.is_joined || false,
  };
};
