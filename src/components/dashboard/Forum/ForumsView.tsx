// src/components/forums/ForumsView.tsx - FIXED VIEW ALL & JOIN/LEAVE UPDATES
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { ForumDetailView } from "./ForumDetailView";
import { Topic, Forum } from "../../../types/forum";
import {
  GetLocalScopeMetrics,
  GetGlobalScopeMetrics,
  GetRecentDiscussions,
  GetFoundationForums,
  GetUserJoinedForums,
  ForumTopicsReactions,
  CreateForumTopicsComments,
} from "../../../../api/forumApis";
import { DecryptData } from "../../../../api/EncrytionApis";

// Split Views
import { OverviewMode } from "./OverviewMode";
import { CompanyMode } from "./CompanyMode";
import { ForumTopicsMode } from "./ForumTopicsMode";
import { ForumViewSkeleton } from "../../../Helper/SkeletonLoader";
import { showToast } from "../../../Helper/ShowToast";

export function ForumsView() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopicDetail, setShowTopicDetail] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedForum, setSelectedForum] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [viewMode, setViewMode] = useState<
    "overview" | "company" | "forum" | "global" | "forumDetail"
  >("overview");
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<
    "relevant" | "recent" | "popular" | "trending"
  >("relevant");
  const [timeFilter, setTimeFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // API State
  const [decryptedCompanyName, setDecryptedCompanyName] = useState<string>("");
  const [companyType, setCompanyType] = useState<string>("");
  const [localMetrics, setLocalMetrics] = useState<any>(null);
  const [globalMetrics, setGlobalMetrics] = useState<any>(null);
  const [recentDiscussions, setRecentDiscussions] = useState<any[]>([]);
  const [foundationForums, setFoundationForums] = useState<any[]>([]);
  const [globalForums, setGlobalForums] = useState<any[]>([]);
  const [userJoinedForums, setUserJoinedForums] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [companyNameResolved, setCompanyNameResolved] = useState(
    !currentUser?.company_encrypted
  );
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCompanyDisplayName = () => {
    if (!decryptedCompanyName) return null;

    if (companyType?.toLowerCase() === "other") {
      return "Others";
    }

    return decryptedCompanyName;
  };

  // Get company name for API calls
  const getCompanyNameForApi = () => {
    if (!decryptedCompanyName) return null;

    // When company type is "other", use "Others" for API calls
    if (companyType?.toLowerCase() === "other") {
      return "Others";
    }

    return decryptedCompanyName;
  };

  // In the shared object:
  const apiCompanyName = getCompanyNameForApi();
  const userCompany = decryptedCompanyName
    ? {
        name: getCompanyDisplayName() || decryptedCompanyName,
        actualName: decryptedCompanyName,
        apiName: apiCompanyName,
        forums: foundationForums,
        displayName: getCompanyDisplayName(),
        actualCompanyName: decryptedCompanyName,
        companyType: companyType,
      }
    : null;

  // Decrypt company name on mount
  useEffect(() => {
    const decryptCompanyName = async () => {
      try {
        if (currentUser?.company_encrypted) {
          const result = await DecryptData({
            encryptedData: currentUser.company_encrypted,
          });
          setDecryptedCompanyName(result.decryptedData);
          setCompanyType(currentUser.company_type || "");
        }
      } catch (err) {
        console.error("Error decrypting company name:", err);
      } finally {
        setCompanyNameResolved(true);
      }
    };

    if (currentUser?.company_encrypted) {
      decryptCompanyName();
    } else {
      setCompanyNameResolved(true);
    }
  }, [currentUser]);

  // Fetch initial data (wait for company name resolution first)
  useEffect(() => {
    if (!companyNameResolved) return;

    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);
        setError(null);

        // Always fetch global metrics
        const globalData = await GetGlobalScopeMetrics();
        setGlobalMetrics(globalData);
        setGlobalForums(globalData?.forums || []);

        // Fetch company-specific data if company name is available
        if (apiCompanyName) {
          const [localData, foundationData, joinedData] = await Promise.all([
            GetLocalScopeMetrics(apiCompanyName),
            GetFoundationForums(apiCompanyName),
            GetUserJoinedForums(apiCompanyName),
          ]);

          setLocalMetrics(localData);
          setFoundationForums(foundationData?.forums || []);
          setUserJoinedForums(Array.isArray(joinedData) ? joinedData : (joinedData?.forums || []));
        }
      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        setError(err.message || "Failed to load forum data");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [apiCompanyName, companyNameResolved]);

  // Fetch recent discussions
  useEffect(() => {
    const fetchRecentDiscussions = async () => {
      try {
        if (!apiCompanyName && viewMode !== "global") return;

        setTopicsLoading(true);

        const filters: any = {
          sortBy: sortBy,
          timeFilter: timeFilter,
          page: currentPage,
          limit: 10,
        };

        if (searchTerm) {
          filters.search = searchTerm;
        }

        if (viewMode === "global") {
          filters.isGlobal = true;
        }

        const data = await GetRecentDiscussions(apiCompanyName || "", filters);
        setRecentDiscussions(data?.topics || []);
      } catch (err) {
        console.error("Error fetching recent discussions:", err);
      } finally {
        setTopicsLoading(false);
      }
    };

    if (!initialLoading) {
      fetchRecentDiscussions();
    }
  }, [
    apiCompanyName,
    sortBy,
    timeFilter,
    searchTerm,
    currentPage,
    viewMode,
    initialLoading,
  ]);

  const handleUserClick = (userId: string) => {
    if (currentUser && userId === currentUser.id) return;
    setSelectedUserProfile({ id: userId });
    setShowUserProfile(true);
  };

  const handleChat = (userId: string) => {
    setShowUserProfile(false);
    navigate("/dashboard/messages", { state: { startChatWith: userId, contextType: "regular" } });
  };

  const TOPICS_PER_PAGE = 10;

  const paginatedTopics = useMemo(() => {
    return {
      topics: recentDiscussions,
      totalTopics: recentDiscussions.length,
      totalPages: Math.ceil(recentDiscussions.length / TOPICS_PER_PAGE),
    };
  }, [recentDiscussions]);

  // ISOLATED REACTION HANDLER - Only updates the specific topic
  const handleReaction = async (
    topicId: string,
    type: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      // Optimistically update UI immediately
      setRecentDiscussions((prev) =>
        prev.map((topic) => {
          if (topic.id === topicId) {
            const updatedReactions = { ...topic.reactions };
            const reactionKey = `reaction_${type}_count`;

            // Toggle the reaction
            if (topic.userReactions?.[type]) {
              updatedReactions[type] = Math.max(
                0,
                (updatedReactions[type] || topic[reactionKey] || 0) - 1
              );
            } else {
              updatedReactions[type] =
                (updatedReactions[type] || topic[reactionKey] || 0) + 1;
            }

            return {
              ...topic,
              reactions: updatedReactions,
              [reactionKey]: updatedReactions[type],
              userReactions: {
                ...topic.userReactions,
                [type]: !topic.userReactions?.[type],
              },
            };
          }
          return topic;
        })
      );

      // Make API call in background
      await ForumTopicsReactions({
        topicId,
        reactionType: type,
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      showToast("Failed to update reaction", "error");

      // Revert optimistic update on error
      setRecentDiscussions((prev) =>
        prev.map((topic) => {
          if (topic.id === topicId) {
            const updatedReactions = { ...topic.reactions };
            const reactionKey = `reaction_${type}_count`;

            // Revert the toggle
            if (!topic.userReactions?.[type]) {
              updatedReactions[type] = Math.max(
                0,
                (updatedReactions[type] || topic[reactionKey] || 0) - 1
              );
            } else {
              updatedReactions[type] =
                (updatedReactions[type] || topic[reactionKey] || 0) + 1;
            }

            return {
              ...topic,
              reactions: updatedReactions,
              [reactionKey]: updatedReactions[type],
              userReactions: {
                ...topic.userReactions,
                [type]: !topic.userReactions?.[type],
              },
            };
          }
          return topic;
        })
      );
    }
  };

  const handleCompanySelect = (id: string) => {
    // When company type is "other", use "Others" as the selected company
    if (companyType?.toLowerCase() === "other") {
      setSelectedCompany("Others");
    } else {
      setSelectedCompany(id);
    }
    setViewMode("company");
    setSelectedForum(null);
    setCurrentPage(1);
  };

  const handleForumSelect = (id: string) => {
    setSelectedForum(id);
    setViewMode("forumDetail");
    setCurrentPage(1);
  };

  const handleForumBack = () => {
    setViewMode(selectedCompany ? "company" : "overview");
    setSelectedForum(null);
  };

  const handleBackToOverview = () => {
    setViewMode("overview");
    setSelectedCompany(null);
    setSelectedForum(null);
    setCurrentPage(1);
  };

  const handleTopicClick = (topic: Topic) => {
    navigate(`/dashboard/forums/topic/${topic.id}`);
  };

  const handleHashtagClick = (tag: string) => {
    setSearchTerm(`#${tag}`);
    setViewMode("overview");
  };

  const getTimeAgo = (date: string | Date | undefined | null) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "N/A";
    const mins = Math.floor((Date.now() - dateObj.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  const handleCommentClick = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent double-click within 300ms
    const now = Date.now();
    if (now - lastClickTime < 300) {
      return;
    }
    setLastClickTime(now);

    setActiveCommentId(activeCommentId === topicId ? null : topicId);
  };

  // ISOLATED COMMENT SUBMIT - Only updates the specific topic's comment count
  const handleCommentSubmit = async (topicId: string, comment: string) => {
    try {
      if (!comment.trim()) {
        showToast("Comment cannot be empty", "error");
        return;
      }

      // Optimistically update comment count
      setRecentDiscussions((prev) =>
        prev.map((topic) => {
          if (topic.id === topicId) {
            return {
              ...topic,
              commentCount:
                (topic.commentCount || topic.comments_count || 0) + 1,
              comments_count:
                (topic.commentCount || topic.comments_count || 0) + 1,
            };
          }
          return topic;
        })
      );

      // Close the comment input
      setActiveCommentId(null);

      // Call the API to create a comment
      await CreateForumTopicsComments({
        topicId: topicId,
        content: comment.trim(),
        isAnonymous: true,
      });

      showToast("Comment posted successfully!", "success");
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      showToast(
        error.response?.data?.message || "Failed to post comment",
        "error"
      );

      // Revert optimistic update on error
      setRecentDiscussions((prev) =>
        prev.map((topic) => {
          if (topic.id === topicId) {
            return {
              ...topic,
              commentCount: Math.max(
                0,
                (topic.commentCount || topic.comments_count || 0) - 1
              ),
              comments_count: Math.max(
                0,
                (topic.commentCount || topic.comments_count || 0) - 1
              ),
            };
          }
          return topic;
        })
      );
    }
  };

  const handleCommentCancel = () => {
    setActiveCommentId(null);
  };

  // Handler for viewing all global forums - FIXED
  const handleViewAllGlobalForums = () => {
    console.log("View all global forums clicked");
    setViewMode("global");
    setSelectedCompany(null);
    setSelectedForum(null); // Clear selected forum to show the grid
    setCurrentPage(1);
  };

  // HANDLER TO REFRESH FORUMS AFTER JOIN/LEAVE
  const handleForumMembershipChange = async () => {
    try {
      console.log("Refreshing forums after membership change...");

      // Refresh foundation forums and joined forums
      if (apiCompanyName) {
        const [foundationData, joinedData] = await Promise.all([
          GetFoundationForums(apiCompanyName),
          GetUserJoinedForums(apiCompanyName),
        ]);

        setFoundationForums(foundationData?.forums || []);
        setUserJoinedForums(Array.isArray(joinedData) ? joinedData : (joinedData?.forums || []));
      }

      // Also refresh global forums
      const globalData = await GetGlobalScopeMetrics();
      setGlobalForums(globalData?.forums || []);

      console.log("Forums refreshed successfully");
    } catch (err) {
      console.error("Error refreshing forums:", err);
    }
  };

  // HANDLER TO REFRESH TOPICS AFTER CREATING NEW TOPIC
  const handleTopicCreated = async () => {
    try {
      console.log("Refreshing topics after creation...");

      // Refresh recent discussions
      const filters: any = {
        sortBy: sortBy,
        timeFilter: timeFilter,
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (viewMode === "global") {
        filters.isGlobal = true;
      }

      const data = await GetRecentDiscussions(apiCompanyName || "", filters);
      setRecentDiscussions(data?.topics || []);

      console.log("Topics refreshed successfully");
    } catch (err) {
      console.error("Error refreshing topics:", err);
    }
  };

  const shared = {
    handleCommentClick,
    handleCommentSubmit,
    handleCommentCancel,
    currentUser,
    userCompany,
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    sortBy,
    setSortBy,
    timeFilter,
    setTimeFilter,
    paginatedTopics,
    currentPage,
    setCurrentPage,
    TOPICS_PER_PAGE,
    showCreateModal,
    setShowCreateModal,
    showTopicDetail,
    setShowTopicDetail,
    showUserProfile,
    setShowUserProfile,
    selectedUserProfile,
    selectedTopic,
    handleUserClick,
    handleReaction,
    handleTopicClick,
    handleHashtagClick,
    getTimeAgo,
    handleBackToOverview,
    handleCompanySelect,
    handleForumSelect,
    selectedCompany,
    selectedForum,
    companies: [],
    globalForums,
    handleChat,
    activeCommentId,
    setActiveCommentId,
    setViewMode,
    viewMode, // FIX: Add viewMode to shared props
    localMetrics,
    globalMetrics,
    foundationForums,
    userJoinedForums,
    topicsLoading,
    initialLoading,
    error,
    handleViewAllGlobalForums,
    handleForumMembershipChange,
    handleTopicCreated, // NEW: Pass topic refresh handler
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show skeleton loading during initial load
  if (initialLoading) {
    return <ForumViewSkeleton />;
  }

  if (viewMode === "overview") return <OverviewMode {...shared} />;
  if (viewMode === "company" && selectedCompany)
    return <CompanyMode {...shared} />;
  if (viewMode === "forumDetail" && selectedForum) {
    const forum = [...globalForums, ...foundationForums].find(
      (f) => f.id === selectedForum
    );
    if (!forum) return null;
    return (
      <ForumDetailView
        forum={forum}
        onBack={handleForumBack}
        onForumMembershipChange={handleForumMembershipChange}
      />
    );
  }
  // FIXED: Check if we're in global mode WITHOUT a selected forum (showing grid)
  if (viewMode === "global") return <ForumTopicsMode {...shared} />;

  return null;
}
