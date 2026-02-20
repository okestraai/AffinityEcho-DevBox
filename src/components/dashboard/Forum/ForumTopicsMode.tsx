// src/components/forums/forum/ForumTopicsMode.tsx - GLOBAL VIEW FIXED
import {
  ArrowLeft,
  Search,
  Plus,
  Filter,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Clock,
  Heart,
  Flame,
  MessageCircle,
  Users,
  TrendingUp,
  Star,
  Eye,
  ThumbsUp,
  Heart as HeartIcon,
  Globe,
  Bookmark,
} from "lucide-react";
import { CreateTopicModal } from "../../Modals/ForumModals/CreateTopicModal";
import { TopicDetailModal } from "../../Modals/ForumModals/TopicDetailModal";
import { UserProfileModal } from "../../Modals/UserProfileModal";
import { formatLastActivity } from "../../../utils/forumUtils";
import { ToggleTopicBookmark } from "../../../../api/forumApis";
import { resolveDisplayName } from "../../../utils/nameUtils";

export function ForumTopicsMode(props: any) {
  const {
    currentUser,
    selectedForum,
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
    handleBackToCompany,
    handleBackToOverview,
    viewMode,
    globalForums,
    foundationForums,
    handleForumSelect,
  } = props;

  const isGlobalView = viewMode === "global";

  const handleBookmarkTopic = async (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ToggleTopicBookmark(topicId);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  console.log(
    "ForumTopicsMode - viewMode:",
    viewMode,
    "selectedForum:",
    selectedForum
  );
  console.log("ForumTopicsMode - globalForums count:", globalForums?.length);

  // If in global view mode and no forum selected, show all global forums
  if (isGlobalView && !selectedForum) {
    console.log("Showing global forums grid");
    return (
      <div className="max-w-6xl mx-auto">
        {/* Global Forums Header */}
        <header className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBackToOverview}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Global Forums
              </h1>
              <p className="text-gray-600">
                Connect with professionals worldwide
              </p>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="Search global forums..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-4 bg-gray-50/80 backdrop-blur-sm rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:bg-white outline-none transition-all border-2 border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-500 font-medium hover:border-gray-300 text-lg"
            />
          </div>
        </header>

        {/* Global Forums Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {globalForums
            .filter((forum: any) =>
              searchTerm
                ? forum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  forum.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase())
                : true
            )
            .map((forum: any) => (
              <button
                key={forum.id}
                onClick={() => handleForumSelect(forum.id)}
                className="text-left bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{forum.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {forum.name}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {forum.description}
                </p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-lg font-bold text-blue-600">
                      {forum.topic_count || 0}
                    </div>
                    <div className="text-xs text-blue-700 font-medium">
                      Topics
                    </div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-lg font-bold text-purple-600">
                      {forum.member_count || 0}
                    </div>
                    <div className="text-xs text-purple-700 font-medium">
                      Members
                    </div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xs font-bold text-green-600">
                      {formatLastActivity(forum.last_activity)}
                    </div>
                    <div className="text-xs text-green-700 font-medium">
                      Last
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                    View Forum
                  </span>
                </div>
              </button>
            ))}
        </div>

        {globalForums.filter((forum: any) =>
          searchTerm
            ? forum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              forum.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
            : true
        ).length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No forums found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </div>
    );
  }

  // Regular forum view with topics
  const isGlobalForum = viewMode === "global";
  const forum = isGlobalForum
    ? globalForums.find((f: any) => f.id === selectedForum)
    : foundationForums.find((f: any) => f.id === selectedForum);

  if (!forum) return null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Forum Header */}
      <header className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={isGlobalForum ? handleBackToOverview : handleBackToCompany}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-4xl">{forum.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{forum.name}</h1>
            <p className="text-gray-600">{forum.description}</p>
            {!isGlobalForum && props.selectedCompany && (
              <p className="text-sm text-purple-600 font-medium">
                {props.selectedCompany}
              </p>
            )}
            {isGlobalForum && (
              <p className="text-sm text-blue-600 font-medium flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Global Forum
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder={`Search ${forum.name} topics...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-4 bg-gray-50/80 backdrop-blur-sm rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:bg-white outline-none transition-all border-2 border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-500 font-medium hover:border-gray-300 text-lg"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 active:scale-95 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-lg whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>New Topic</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { value: "relevant", label: "Relevant", icon: BarChart3 },
              { value: "recent", label: "Recent", icon: Clock },
              { value: "popular", label: "Popular", icon: Heart },
              { value: "trending", label: "Trending", icon: Flame },
            ].map((o) => {
              const Icon = o.icon;
              return (
                <button
                  key={o.value}
                  onClick={() => setSortBy(o.value as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all whitespace-nowrap ${
                    sortBy === o.value
                      ? "bg-purple-50 border-purple-200 text-purple-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Forum Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Topics</span>
          </div>
          <div className="text-3xl font-bold text-purple-600 group-hover:text-purple-700 transition-colors">
            {forum.topicCount || forum.topic_count || 0}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Members</span>
          </div>
          <div className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
            {forum.memberCount || forum.member_count || 0}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </div>
          <div className="text-3xl font-bold text-green-600 group-hover:text-green-700 transition-colors">
            {paginatedTopics.topics.length}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">
              Last Activity
            </span>
          </div>
          <div className="text-lg font-bold text-orange-600 group-hover:text-orange-700 transition-colors">
            {formatLastActivity(forum.lastActivity || forum.last_activity)}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
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

      {/* Topics List */}
      <div className="space-y-6">
        {paginatedTopics.topics
          .map((topic: any) => {
          return (
            <div
              key={topic.id}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-gray-200/50 hover:shadow-lg hover:border-purple-300 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 to-blue-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-start gap-3 md:gap-4 mb-4">
                  <button
                    onClick={() => handleUserClick(topic.user_id)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-lg md:text-xl shadow-sm border border-purple-200/50 flex-shrink-0 hover:bg-blue-200 transition-colors"
                  >
                    {topic.user_profile?.avatar || "👤"}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <button
                        onClick={() => handleUserClick(topic.user_id)}
                        className="text-sm text-purple-700 font-bold bg-gradient-to-r from-purple-100 to-indigo-100 px-3 py-1.5 rounded-full border border-purple-200 hover:text-purple-800 transition-colors"
                      >
                        {resolveDisplayName(topic.user_profile?.display_name, topic.user_profile?.username)}
                      </button>
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
                    <button
                      onClick={() => handleTopicClick(topic)}
                      className="text-base md:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors leading-tight text-left break-words"
                    >
                      {topic.title}
                    </button>
                    <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed line-clamp-2 break-words">
                      {topic.content}
                    </p>
                    {topic.tags && topic.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {topic.tags.slice(0, 3).map((tag: string) => (
                          <button
                            key={tag}
                            onClick={() => handleHashtagClick(tag)}
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
                <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
                  <div className="flex items-center gap-1 md:gap-4 flex-wrap">
                    <button
                      onClick={(e) => handleReaction(topic.id, "seen", e)}
                      className={`flex items-center gap-1 md:gap-2 transition-all duration-200 font-medium hover:bg-green-50 hover:scale-110 active:scale-95 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                        topic.userReactions?.seen
                          ? "text-green-600 bg-green-50"
                          : "text-gray-500 hover:text-green-600"
                      }`}
                    >
                      <Eye className={`w-4 h-4 transition-transform duration-200 ${topic.userReactions?.seen ? "animate-reaction-pop" : ""}`} />
                      <span className="text-sm">
                        {topic.reactions?.seen ||
                          topic.reaction_seen_count ||
                          0}
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleReaction(topic.id, "heard", e)}
                      className={`flex items-center gap-1 md:gap-2 transition-all duration-200 font-medium hover:bg-red-50 hover:scale-110 active:scale-95 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                        topic.userReactions?.heard
                          ? "text-red-500 bg-red-50"
                          : "text-gray-500 hover:text-red-500"
                      }`}
                    >
                      <HeartIcon className={`w-4 h-4 transition-transform duration-200 ${topic.userReactions?.heard ? "fill-red-500 animate-reaction-pop" : ""}`} />
                      <span className="text-sm">
                        {topic.reactions?.heard ||
                          topic.reaction_heard_count ||
                          0}
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleReaction(topic.id, "validated", e)}
                      className={`flex items-center gap-1 md:gap-2 transition-all duration-200 font-medium hover:bg-blue-50 hover:scale-110 active:scale-95 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                        topic.userReactions?.validated
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-500 hover:text-blue-600"
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 transition-transform duration-200 ${topic.userReactions?.validated ? "fill-blue-600 animate-reaction-pop" : ""}`} />
                      <span className="text-sm">
                        {topic.reactions?.validated ||
                          topic.reaction_validated_count ||
                          0}
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleReaction(topic.id, "inspired", e)}
                      className={`flex items-center gap-1 md:gap-2 transition-all duration-200 font-medium hover:bg-yellow-50 hover:scale-110 active:scale-95 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                        topic.userReactions?.inspired
                          ? "text-yellow-500 bg-yellow-50"
                          : "text-gray-500 hover:text-yellow-500"
                      }`}
                    >
                      <Star className={`w-4 h-4 transition-transform duration-200 ${topic.userReactions?.inspired ? "fill-yellow-500 animate-reaction-pop" : ""}`} />
                      <span className="text-sm">
                        {topic.reactions?.inspired ||
                          topic.reaction_inspired_count ||
                          0}
                      </span>
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 md:gap-2 text-gray-500 hover:text-purple-600 transition-colors font-medium hover:bg-purple-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">
                        {topic.commentCount || topic.comments_count || 0}
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleBookmarkTopic(topic.id, e)}
                      className={`flex items-center gap-1 md:gap-2 transition-all duration-200 font-medium hover:scale-110 active:scale-95 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                        topic.user_has_bookmarked
                          ? "text-amber-500 bg-amber-50"
                          : "text-gray-500 hover:text-amber-500 hover:bg-amber-50"
                      }`}
                      title="Bookmark"
                    >
                      <Bookmark className={`w-4 h-4 transition-transform duration-200 ${topic.user_has_bookmarked ? "fill-amber-500 animate-reaction-pop" : ""}`} />
                    </button>
                  </div>
                  <div className="text-xs md:text-sm text-gray-500 w-full md:w-auto mt-2 md:mt-0">
                    Last activity {getTimeAgo(topic.last_activity_at || topic.updated_at || topic.created_at)}
                  </div>
                </div>
              </div>
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
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                {paginatedTopics.totalPages > 5 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => setCurrentPage(paginatedTopics.totalPages)}
                      className={`w-8 h-8 rounded-lg transition-colors ${
                        currentPage === paginatedTopics.totalPages
                          ? "bg-purple-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {paginatedTopics.totalPages}
                    </button>
                  </>
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

      <CreateTopicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTopicCreated={props.handleTopicCreated}
        forumName={forum.name}
        companyId={isGlobalForum ? null : props.selectedCompany}
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
        profile={selectedUserProfile}
        onFollow={props.handleFollow}
        onUnfollow={props.handleUnfollow}
        onChat={props.handleChat}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
