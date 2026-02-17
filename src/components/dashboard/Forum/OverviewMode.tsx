// src/components/forums/overview/OverviewMode.tsx - FIXED VIEW ALL BUTTON
import {
  Search,
  Plus,
  TrendingUp,
  Filter,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Clock,
  Heart,
  Flame,
  Globe,
  Building,
  ChevronRight,
  MessageCircle,
  Users,
  Star,
  Eye,
  ThumbsUp,
  Heart as HeartIcon,
  Sparkles,
} from "lucide-react";
import { CreateTopicModal } from "../../Modals/ForumModals/CreateTopicModal";
import { TopicDetailModal } from "../../Modals/ForumModals/TopicDetailModal";
import { UserProfileModal } from "../../Modals/UserProfileModal";
import { InlineCommentInput } from "./InlineCommentInput";
import { formatLastActivity } from "../../../utils/forumUtils";
import {
  TopicsSkeleton,
  SidebarSkeleton,
  ForumViewSkeleton,
} from "../../../Helper/SkeletonLoader";
import { OkestraPanel } from "../OkestraPanel";
import { Topic } from "../../../types/forum";
import { useState, useRef } from "react";

export function OverviewMode(props: any) {
  const {
    handleCommentClick,
    handleCommentSubmit,
    handleCommentCancel,
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
    handleCompanySelect,
    handleForumSelect,
    globalForums,
    activeCommentId,
    localMetrics,
    globalMetrics,
    initialLoading,
    topicsLoading,
    handleViewAllGlobalForums, // NEW: Handler for view all button
  } = props;

    const [okestraSelectedTopic, setOkestraSelectedTopic] = useState<Topic | null>(null);
      const [showOkestraPanel, setShowOkestraPanel] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleOkestraClick = (topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    setOkestraSelectedTopic(topic);
    setShowOkestraPanel(true);
  };
  return (
    <div className="max-w-7xl mx-auto">
      {/* === HEADER === */}
      <header className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent tracking-tight mb-2">
              Community Forums
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              Connect across companies and communities
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 active:scale-95 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-lg whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>New Topic</span>
          </button>
        </div>
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
          <input
            type="text"
            placeholder="Search across all forums and companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-4 bg-gray-50/80 backdrop-blur-sm rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:bg-white outline-none transition-all border-2 border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-500 font-medium hover:border-gray-300 text-lg"
          />
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* === LEFT: RECENT TOPICS === */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              Recent Discussions
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6 shadow-sm">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sort By
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        value: "relevant",
                        label: "Most Relevant",
                        icon: BarChart3,
                      },
                      { value: "recent", label: "Most Recent", icon: Clock },
                      { value: "popular", label: "Most Popular", icon: Heart },
                      { value: "trending", label: "Trending", icon: Flame },
                    ].map((o) => {
                      const Icon = o.icon;
                      return (
                        <button
                          key={o.value}
                          onClick={() => setSortBy(o.value as any)}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                            sortBy === o.value
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{o.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Time Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "all", label: "All Time" },
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                    ].map((o) => (
                      <button
                        key={o.value}
                        onClick={() => setTimeFilter(o.value as any)}
                        className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                          timeFilter === o.value
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Topics List with Skeleton Loading */}
          {topicsLoading ? (
            <TopicsSkeleton />
          ) : paginatedTopics.topics.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No topics found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedTopics.topics.map((topic: any) => {
                const avatarEmoji = topic.user_profile?.avatar || "👤";
                const username = topic.user_profile?.display_name || topic.user_profile?.username || "Anonymous";

                return (
                  <div
                    key={topic.id}
                    className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-gray-200/50 hover:shadow-lg hover:border-purple-300 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 to-blue-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div
                      className="relative z-10 cursor-pointer"
                      onClick={() => handleTopicClick(topic)}
                    >
                      <div className="flex items-start gap-3 md:gap-4 mb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserClick(topic.user_id);
                          }}
                          onMouseEnter={() => handleUserHover(topic.user_id)}
                          onMouseLeave={handleUserHoverLeave}
                          className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-lg md:text-xl shadow-sm border border-purple-200/50 flex-shrink-0 hover:bg-blue-200 transition-colors"
                        >
                          {avatarEmoji}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUserClick(topic.user_id);
                              }}
                              onMouseEnter={() => handleUserHover(topic.user_id)}
                              onMouseLeave={handleUserHoverLeave}
                              className="text-sm text-purple-700 font-bold bg-gradient-to-r from-purple-100 to-indigo-100 px-3 py-1.5 rounded-full border border-purple-200 hover:text-purple-800 transition-colors inline-flex items-center gap-1"
                            >
                              {username} {avatarEmoji}
                            </button>
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-medium">
                              {topic.forum?.icon} {topic.forum?.name}
                            </span>
                            {topic.company_name && (
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                                {topic.company_name}
                              </span>
                            )}
                            {topic.scope === "global" && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                                Global
                              </span>
                            )}
                            {topic.is_pinned && (
                              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <Star className="w-3 h-3" /> Pinned
                              </span>
                            )}
                            <span className="text-gray-400 font-medium">•</span>
                            <span className="text-gray-500 font-medium">
                              {getTimeAgo(topic.created_at)}
                            </span>
                          </div>
                          <div className="text-base md:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors leading-tight text-left break-words">
                            {topic.title}
                          </div>
                          <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed line-clamp-2 break-words">
                            {topic.content}
                          </p>
                          {topic.tags && topic.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {topic.tags.slice(0, 3).map((tag: string) => (
                                <button
                                  key={tag}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHashtagClick(tag);
                                  }}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium hover:text-blue-600 transition-colors"
                                >
                                  #{tag}
                                </button>
                              ))}
                              {topic.tags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{topic.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="relative z-20 flex items-center justify-between flex-wrap gap-2 md:gap-4 mt-4">
                        <div className="flex items-center gap-1 md:gap-4 flex-wrap">
                          {/* Reaction buttons */}
                          <button
                            onClick={(e) => handleReaction(topic.id, "seen", e)}
                            className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-green-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                              topic.userReactions?.seen
                                ? "text-green-600"
                                : "text-gray-500 hover:text-green-600"
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">
                              {topic.views_count || 0}
                            </span>
                          </button>
                          <button
                            onClick={(e) =>
                              handleReaction(topic.id, "validated", e)
                            }
                            className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-blue-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                              topic.userReactions?.validated
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-blue-600"
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm">
                              {topic.reactions?.validated ||
                                topic.reaction_validated_count ||
                                0}
                            </span>
                          </button>
                          <button
                            onClick={(e) =>
                              handleReaction(topic.id, "inspired", e)
                            }
                            className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-yellow-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                              topic.userReactions?.inspired
                                ? "text-yellow-600"
                                : "text-gray-500 hover:text-yellow-600"
                            }`}
                          >
                            <Star className="w-4 h-4" />
                            <span className="text-sm">
                              {topic.reactions?.inspired ||
                                topic.reaction_inspired_count ||
                                0}
                            </span>
                          </button>
                          <button
                            onClick={(e) =>
                              handleReaction(topic.id, "heard", e)
                            }
                            className={`flex items-center gap-1 md:gap-2 transition-colors font-medium hover:bg-purple-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                              topic.userReactions?.heard
                                ? "text-purple-600"
                                : "text-gray-500 hover:text-purple-600"
                            }`}
                          >
                            <HeartIcon className="w-4 h-4" />
                            <span className="text-sm">
                              {topic.reactions?.heard ||
                                topic.reaction_heard_count ||
                                0}
                            </span>
                          </button>
                          <button
                            onClick={(e) => handleCommentClick(topic.id, e)}
                            className={`flex items-center gap-1 md:gap-2 transition-colors font-medium px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                              activeCommentId === topic.id
                                ? "text-purple-600 bg-purple-50"
                                : "text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">
                              {topic.commentCount || topic.comments_count || 0}
                            </span>
                          </button>
                          <button
                            onClick={(e) => handleOkestraClick(topic as Topic, e)}
                            className="flex items-center gap-1 md:gap-2 transition-colors font-medium px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                            title="AI Insights"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm hidden md:inline">AI Insights</span>
                          </button>
                        </div>
                        <div className="text-xs md:text-sm text-gray-500 w-full md:w-auto mt-2 md:mt-0">
                          Last activity {getTimeAgo(topic.last_activity_at)}
                        </div>
                      </div>
                    </div>
                    {activeCommentId === topic.id && (
                      <div
                        className="relative z-30 mt-4 pt-4 border-t border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InlineCommentInput
                          onSubmit={(comment) =>
                            handleCommentSubmit(topic.id, comment)
                          }
                          onCancel={handleCommentCancel}
                          placeholder="Share your thoughts on this topic..."
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {paginatedTopics.totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl p-4 border border-gray-200 mt-6 gap-4">
                  <div className="text-xs md:text-sm text-gray-600 text-center md:text-left">
                    Showing {(currentPage - 1) * TOPICS_PER_PAGE + 1}-
                    {Math.min(
                      currentPage * TOPICS_PER_PAGE,
                      paginatedTopics.totalTopics
                    )}{" "}
                    of {paginatedTopics.totalTopics} topics
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, paginatedTopics.totalPages) },
                        (_, i) => {
                          const n = i + 1;
                          return (
                            <button
                              key={n}
                              onClick={() => setCurrentPage(n)}
                              className={`w-8 h-8 rounded-lg transition-colors ${
                                currentPage === n
                                  ? "bg-purple-600 text-white"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {n}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage(
                          Math.min(paginatedTopics.totalPages, currentPage + 1)
                        )
                      }
                      disabled={currentPage === paginatedTopics.totalPages}
                      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* === RIGHT: SIDEBAR === */}
        <div className="space-y-6">
          {initialLoading ? (
            <ForumViewSkeleton />
          ) : (
            <>
              {/* Company */}
              {userCompany && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Building className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Company</h3>
                  </div>
                  <button
                    onClick={() => handleCompanySelect(userCompany.actualName)}
                    className="w-full text-left bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm transition-all group hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-purple-600 to-indigo-600">
                          {userCompany.actualName.substring(0, 2).toUpperCase()}
                        </div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {userCompany.name}
                          {userCompany.companyType?.toLowerCase() ===
                            "other" && (
                            <span className="ml-1 text-base bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                              ({userCompany.actualName})
                            </span>
                          )}
                          <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-medium">
                            You
                          </span>
                        </h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{localMetrics?.totalTopics || 0} topics</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{localMetrics?.totalMembers || 0} members</span>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Global Community */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Global Communities
                  </h3>
                </div>
                <div className="space-y-3">
                  {globalForums.slice(0, 5).map((forum: any) => (
                    <button
                      key={forum.id}
                      onClick={() => handleForumSelect(forum.id)}
                      className="w-full text-left bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{forum.icon}</span>
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {forum.name}
                          </h4>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{forum.topic_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{forum.member_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatLastActivity(forum.last_activity)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  {globalForums.length > 5 && (
                    <button
                      onClick={handleViewAllGlobalForums}
                      className="w-full text-center bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 text-blue-700 font-semibold hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all flex items-center justify-center gap-2 group"
                    >
                      <span>View All {globalForums.length} Forums</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <CreateTopicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTopicCreated={props.handleTopicCreated}
      />
      <TopicDetailModal
        isOpen={showTopicDetail}
        onClose={() => setShowTopicDetail(false)}
        topic={selectedTopic}
        onUserClick={handleUserClick}
      />
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserProfile?.id || ""}
        onChat={props.handleChat}
      />

      {okestraSelectedTopic && (
          <OkestraPanel
            isOpen={showOkestraPanel}
            onClose={() => {
              setShowOkestraPanel(false);
            }}
            topic={okestraSelectedTopic}
            comments={okestraSelectedTopic.comments || []}
          />
        )}
    </div>
  );
}
