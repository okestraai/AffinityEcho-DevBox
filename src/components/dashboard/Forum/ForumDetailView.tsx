// src/components/forums/ForumDetailView.tsx - WITH REFRESH CALLBACK
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  TrendingUp,
  UserPlus,
  UserCheck,
  Shield,
  Info,
  Plus,
  Eye,
  ThumbsUp,
  Clock,
} from "lucide-react";
import {
  GetForumById,
  UserJoinForum,
  UserLeaveForum,
  GetUserJoinedForums,
} from "../../../../api/forumApis";
import { DecryptData } from "../../../../api/EncrytionApis";
import { useAuth } from "../../../hooks/useAuth";
import {
  formatLastActivity,
  transformTopicFromAPI,
} from "../../../utils/forumUtils";
import { CreateTopicModal } from "../../Modals/ForumModals/CreateTopicModal";
import { ForumCardSkeleton } from "../../../Helper/SkeletonLoader";
import { showToast } from "../../../Helper/ShowToast";
import { resolveDisplayName } from "../../../utils/nameUtils";

interface Props {
  forum: any;
  onBack: () => void;
  onForumMembershipChange?: () => Promise<void>; // NEW: Callback to refresh parent
}

export function ForumDetailView({
  forum: initialForum,
  onBack,
  onForumMembershipChange,
}: Props) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [forum, setForum] = useState(initialForum);
  const [isJoined, setIsJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(initialForum.memberCount || 0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingJoinStatus, setCheckingJoinStatus] = useState(false);
  const [joining, setJoining] = useState(false);
  const [decryptedCompanyName, setDecryptedCompanyName] = useState<string>("");
  const [companyType, setCompanyType] = useState<string>("");

  // Determine if this is a global forum or company forum
  const isGlobalForum = !forum.company_name || forum.is_global;

  // Decrypt company name and get company type
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
      }
    };

    decryptCompanyName();
  }, [currentUser]);

  // Get the correct company name for API calls
  const getCompanyNameForApi = useCallback(() => {
    if (!decryptedCompanyName) return null;

    // When company type is "other", use "Others" for API calls
    if (companyType?.toLowerCase() === "other") {
      return "Others";
    }

    return decryptedCompanyName;
  }, [decryptedCompanyName, companyType]);

  // Get company name to use for this forum
  const getForumCompanyName = useCallback(() => {
    // If it's a global forum, we don't need company name
    if (isGlobalForum) return null;

    // If it's a company forum, use the appropriate company name
    return getCompanyNameForApi();
  }, [isGlobalForum, getCompanyNameForApi]);

  // Fetch forum details
  useEffect(() => {
    const fetchForumDetails = async () => {
      try {
        setLoading(true);
        const result = await GetForumById(initialForum.id);
        const forumData = result;

        setForum(forumData);
        setMemberCount(forumData.memberCount || forumData.member_count || 0);

        // Transform topics if available
        if (forumData.forum_topics) {
          const transformedTopics = forumData.forum_topics.map(
            transformTopicFromAPI
          );
          setTopics(transformedTopics);
        }
      } catch (err) {
        console.error("Error fetching forum details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForumDetails();
  }, [initialForum.id]);

  // Check if user has joined this forum - using useCallback to prevent infinite loops
  const checkJoinStatus = useCallback(async () => {
    try {
      setCheckingJoinStatus(true);

      // For global forums, we don't need company name
      // For company forums, we need the correct company name
      const companyNameForApi = getForumCompanyName();

      // If it's a company forum but we don't have company name, skip
      if (!isGlobalForum && !companyNameForApi) {
        console.log("No company name available for company forum check");
        setIsJoined(false);
        return;
      }

      // Get joined forums - pass company name for company forums, null for global
      const result = await GetUserJoinedForums(
        isGlobalForum ? null : companyNameForApi
      );
      const joinedForums = Array.isArray(result) ? result : (result?.forums || []);

      // Check if user is in this forum
      const hasJoined = joinedForums.some((f: any) => f.id === initialForum.id);
      setIsJoined(hasJoined);

      // Also update member count if joined
      if (hasJoined && forum.memberCount) {
        setMemberCount(forum.memberCount);
      }
    } catch (err) {
      console.error("Error checking join status:", err);
      setIsJoined(false);
    } finally {
      setCheckingJoinStatus(false);
    }
  }, [initialForum.id, isGlobalForum, getForumCompanyName, forum.memberCount]);

  // Run checkJoinStatus when dependencies change
  useEffect(() => {
    if (!loading && (isGlobalForum || decryptedCompanyName)) {
      checkJoinStatus();
    }
  }, [loading, isGlobalForum, decryptedCompanyName, checkJoinStatus]);

  // ISOLATED JOIN/LEAVE WITH PARENT REFRESH
  const handleJoinToggle = async () => {
    if (joining) return; // Prevent multiple clicks

    try {
      setJoining(true);

      // Optimistically update UI
      const wasJoined = isJoined;
      setIsJoined(!wasJoined);
      setMemberCount((prev) => (wasJoined ? Math.max(0, prev - 1) : prev + 1));

      // Make API call
      if (wasJoined) {
        await UserLeaveForum(initialForum.id);
        showToast("Left forum successfully", "success");
      } else {
        await UserJoinForum(initialForum.id);
        showToast("Joined forum successfully", "success");
      }

      // Small delay to ensure server has processed the request
      await new Promise((resolve) => setTimeout(resolve, 300));

      // REFRESH PARENT FORUMS LIST
      if (onForumMembershipChange) {
        await onForumMembershipChange();
      }
    } catch (error: any) {
      console.error("Error toggling join status:", error);
      showToast(
        error.response?.data?.message || "Failed to update forum membership",
        "error"
      );

      // Revert optimistic update on error
      setIsJoined(isJoined);
      setMemberCount((prev) => (isJoined ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setJoining(false);
    }
  };

  const forumRules = forum.rules || [
    "Be respectful and professional in all interactions",
    "Share experiences honestly while maintaining privacy",
    "Support others and contribute constructively",
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-32 bg-gray-200 rounded mb-6 animate-pulse"></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-pulse">
          <div className="h-64 bg-gray-200"></div>
        </div>
        <ForumCardSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Forums
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center text-2xl sm:text-4xl flex-shrink-0">
                {forum.icon}
              </div>
              <div className="text-white min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">{forum.name}</h1>
                <p className="text-blue-100 text-sm sm:text-base max-w-2xl">{forum.description}</p>
                {!isGlobalForum && forum.company_name && (
                  <p className="text-blue-200 text-xs sm:text-sm mt-1">
                    Company Forum • {forum.company_name}
                  </p>
                )}
                {isGlobalForum && (
                  <p className="text-blue-200 text-xs sm:text-sm mt-1">Global Forum</p>
                )}
              </div>
            </div>

            <button
              onClick={handleJoinToggle}
              disabled={
                (!isGlobalForum && !decryptedCompanyName) ||
                joining ||
                checkingJoinStatus
              }
              className={`w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 min-h-[44px] ${
                isJoined
                  ? "bg-white text-blue-600 hover:bg-blue-50"
                  : "bg-blue-500 text-white hover:bg-blue-400"
              } ${
                (!isGlobalForum && !decryptedCompanyName) ||
                joining ||
                checkingJoinStatus
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              title={
                !isGlobalForum && !decryptedCompanyName
                  ? "You need to set your company to join company forums"
                  : ""
              }
            >
              {joining || checkingJoinStatus ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {joining ? "Processing..." : "Checking..."}
                </span>
              ) : isJoined ? (
                <>
                  <UserCheck className="w-5 h-5" />
                  Joined
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Join Forum
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white mb-1">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">Members</span>
              </div>
              <div className="text-xl sm:text-3xl font-bold text-white">
                {memberCount.toLocaleString()}
              </div>
            </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white mb-1">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">Topics</span>
              </div>
              <div className="text-xl sm:text-3xl font-bold text-white">
                {forum.topicCount || forum.topic_count || 0}
              </div>
            </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-3 sm:p-4 backdrop-blur-sm col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-white mb-1">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">Last Activity</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white">
                {formatLastActivity(forum.lastActivity || forum.last_activity)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Forum Guidelines
              </h3>
              <ul className="space-y-1">
                {forumRules.map((rule, index) => (
                  <li key={index} className="text-sm text-gray-600 flex gap-2">
                    <span>•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Discussions</h2>

        {isJoined && !joining && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Topic</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      {!isJoined && !checkingJoinStatus && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center mb-6">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Join to participate
          </h3>
          <p className="text-gray-600 mb-4">
            Join this forum to view discussions, create topics, and connect with{" "}
            {memberCount.toLocaleString()} members
            {!isGlobalForum && !decryptedCompanyName && (
              <span className="block text-sm text-orange-600 mt-2">
                Note: You need to set your company in your profile to join
                company forums
              </span>
            )}
          </p>
          <button
            onClick={handleJoinToggle}
            disabled={
              (!isGlobalForum && !decryptedCompanyName) ||
              joining ||
              checkingJoinStatus
            }
            className={`px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2 ${
              (!isGlobalForum && !decryptedCompanyName) ||
              joining ||
              checkingJoinStatus
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {joining || checkingJoinStatus ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {joining ? "Processing..." : "Checking..."}
              </span>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Join Forum
              </>
            )}
          </button>
        </div>
      )}

      {checkingJoinStatus && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center mb-6">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-600">Checking forum membership...</p>
          </div>
        </div>
      )}

      {isJoined && !checkingJoinStatus && (
        <div className="space-y-3">
          {topics.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No topics yet
              </h3>
              <p className="text-gray-600 mb-4">
                Be the first to start a discussion in this forum!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Topic
              </button>
            </div>
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/dashboard/forums/topic/${topic.id}`)}
                className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {topic.isPinned && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
                          Pinned
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                        {topic.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 line-clamp-2 mb-3">
                      {topic.content}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs">
                          {topic.author.avatar}
                        </div>
                        <span>{resolveDisplayName(topic.author.display_name, topic.author.username)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatLastActivity(topic.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-gray-100 gap-2">
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{topic.views}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ThumbsUp className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {topic.reactions.validated}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {topic.commentCount} comments
                      </span>
                    </div>
                  </div>

                  {topic.tags && topic.tags.length > 0 && (
                    <div className="flex gap-2">
                      {topic.tags
                        .slice(0, 3)
                        .map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <CreateTopicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        forumName={forum.name}
        forumId={forum.id}
        companyId={forum.companyId || forum.company_name}
      />
    </div>
  );
}
