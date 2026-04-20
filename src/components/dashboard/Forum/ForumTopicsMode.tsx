// src/components/forums/forum/ForumTopicsMode.tsx - GLOBAL VIEW FIXED
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  BarChart3,
  Clock,
  Heart,
  Flame,
  MessageCircle,
  Lightbulb,
  Eye,
  Heart as HeartIcon,
  Globe,
  Bookmark,
} from "lucide-react";
import { ClapIcon } from "../../shared/ClapIcon";
import { CreateTopicModal } from "../../Modals/ForumModals/CreateTopicModal";
import { TopicDetailModal } from "../../Modals/ForumModals/TopicDetailModal";
import { UserProfileModal } from "../../Modals/UserProfileModal";
import { formatLastActivity } from "../../../utils/forumUtils";
import { ToggleTopicBookmark } from "../../../../api/forumApis";
import { showToast } from "../../../Helper/ShowToast";
import { MSG } from "../../../constants/messages";
import { resolveAuthorName } from "../../../utils/nameUtils";
import { VerifiedBadge } from "../../shared/VerifiedBadge";

export function ForumTopicsMode(props: any) {
  const {
    currentUser,
    selectedForum,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    timeFilter,
    setTimeFilter,
    paginatedTopics,
    setCurrentPage,
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
    hasMoreTopics,
    topicsLoading,
  } = props;

  const isGlobalView = viewMode === "global";

  // Infinite scroll sentinel
  const loadMore = useCallback(() => {
    if (!topicsLoading && hasMoreTopics) {
      setCurrentPage((p: number) => p + 1);
    }
  }, [topicsLoading, hasMoreTopics, setCurrentPage]);

  // Keep a stable ref to always have the latest loadMore
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  // Callback ref — runs whenever the sentinel element mounts/unmounts.
  // This solves the issue where the component early-returns (no forum selected yet),
  // so the sentinel isn't in the DOM when the component first mounts.
  const ioRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    // Disconnect any previous observer when the sentinel unmounts or swaps
    ioRef.current?.disconnect();
    ioRef.current = null;
    if (!el) return;
    const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
      if (!node || node === document.body) return null;
      const ov = getComputedStyle(node).overflowY;
      if (ov === "auto" || ov === "scroll") return node;
      return getScrollParent(node.parentElement);
    };
    const root = getScrollParent(el.parentElement);
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreRef.current(); },
      { threshold: 0, rootMargin: "200px 0px", root }
    );
    observer.observe(el);
    ioRef.current = observer;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [bookmarkOverrides, setBookmarkOverrides] = useState<Record<string, boolean>>({});

  const isTopicBookmarked = (topic: any) => {
    if (topic.id in bookmarkOverrides) return bookmarkOverrides[topic.id];
    return !!topic.user_has_bookmarked;
  };

  const handleBookmarkTopic = async (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentState = bookmarkOverrides[topicId] ?? paginatedTopics.topics.find((t: any) => t.id === topicId)?.user_has_bookmarked ?? false;
    setBookmarkOverrides((prev) => ({ ...prev, [topicId]: !currentState }));
    try {
      await ToggleTopicBookmark(topicId);
      showToast(!currentState ? MSG.FORUM.BOOKMARKED : MSG.FORUM.BOOKMARK_REMOVED, "success");
    } catch {
      setBookmarkOverrides((prev) => ({ ...prev, [topicId]: currentState }));
      showToast(MSG.FORUM.BOOKMARK_FAILED, "error");
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
        <header className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-4 md:p-6 lg:p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBackToOverview}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                className="text-left bg-white/90 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{forum.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {forum.name}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2 h-12">
                  {forum.description}
                </p>

                <div className="grid grid-cols-3 gap-3 mb-4 mt-auto">
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
          <div className="text-center py-8 md:py-12">
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
      {/* Slim page header: back + forum name */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={isGlobalForum ? handleBackToOverview : handleBackToCompany}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-2xl flex-shrink-0">{forum.icon}</span>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{forum.name}</h1>
          {isGlobalForum ? (
            <span className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
              <Globe className="w-3 h-3" /> Global Forum
            </span>
          ) : props.selectedCompany ? (
            <span className="text-xs text-purple-600 mt-0.5 block">{props.selectedCompany}</span>
          ) : null}
        </div>
      </div>

      {/* Two-column layout — grid + h-fit is the reliable sticky sidebar pattern */}
      <div className="h-[calc(100svh-10rem)] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6">

        {/* ── Topics column ── */}
        <div className="min-w-0">

          {/* Search + New Topic */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
              <input
                type="text"
                placeholder={`Search ${forum.name} topics...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none transition-all border border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-400 text-sm"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-all shadow font-medium text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Topic
            </button>
          </div>

          {/* Topics list */}
          <div className="space-y-4">
            {paginatedTopics.topics.map((topic: any) => (
              <div
                key={topic.id}
                className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-gray-200/50 hover:shadow-lg hover:border-purple-300 transition-all duration-300 cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 to-blue-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="flex items-start gap-3 mb-3">
                    <button
                      onClick={() => handleUserClick(topic.user_id)}
                      className="w-9 h-9 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-base shadow-sm border border-purple-200/50 flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      {topic.user_profile?.avatar || "👤"}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <button
                          onClick={() => handleUserClick(topic.user_id)}
                          className="text-xs text-purple-700 font-bold bg-gradient-to-r from-purple-100 to-indigo-100 px-2.5 py-1 rounded-full border border-purple-200 hover:text-purple-800 transition-colors inline-flex items-center gap-1"
                        >
                          {resolveAuthorName(currentUser, topic.user_id, topic.user_profile?.display_name, topic.user_profile?.username)}
                          {(topic.user_profile?.is_company_verified ?? topic.author?.is_company_verified) && <VerifiedBadge size={16} />}
                        </button>
                        {topic.is_pinned && (
                          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Star className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        <span className="text-gray-400 text-xs">• {getTimeAgo(topic.created_at)}</span>
                      </div>
                      <button
                        onClick={() => handleTopicClick(topic)}
                        className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-purple-700 transition-colors leading-tight text-left break-words block w-full"
                      >
                        {topic.title}
                      </button>
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2 break-words">
                        {topic.content}
                      </p>
                      {topic.tags && topic.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {topic.tags.slice(0, 3).map((tag: string) => (
                            <button
                              key={tag}
                              onClick={() => handleHashtagClick(tag)}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium hover:text-blue-600 transition-colors"
                            >
                              #{tag}
                            </button>
                          ))}
                          {topic.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{topic.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {[
                        { key: "seen", Icon: Eye, active: "text-green-600 bg-green-50", hover: "hover:text-green-600 hover:bg-green-50", label: "Seen" },
                        { key: "heard", Icon: HeartIcon, active: "text-red-500 bg-red-50", hover: "hover:text-red-500 hover:bg-red-50", label: "Heard" },
                        { key: "validated", Icon: ClapIcon, active: "text-blue-600 bg-blue-50", hover: "hover:text-blue-600 hover:bg-blue-50", label: "Validated" },
                        { key: "inspired", Icon: Lightbulb, active: "text-yellow-500 bg-yellow-50", hover: "hover:text-yellow-500 hover:bg-yellow-50", label: "Inspired" },
                      ].map(({ key, Icon, active, hover, label }) => (
                        <button
                          key={key}
                          onClick={(e) => handleReaction(topic.id, key, e)}
                          className={`flex items-center gap-1 transition-all duration-200 font-medium hover:scale-110 active:scale-95 px-2 py-1.5 rounded-lg text-xs ${
                            topic.userReactions?.[key] ? active : `text-gray-500 ${hover}`
                          }`}
                          aria-label={label}
                        >
                          <Icon className={`w-3.5 h-3.5 ${topic.userReactions?.[key] ? "fill-current" : ""}`} />
                          <span>{topic.reactions?.[key] || topic[`reaction_${key}_count`] || 0}</span>
                        </button>
                      ))}
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-all text-xs"
                        aria-label="Comments"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{topic.commentCount || topic.comments_count || 0}</span>
                      </button>
                      <button
                        onClick={(e) => handleBookmarkTopic(topic.id, e)}
                        className={`flex items-center gap-1 transition-all duration-200 hover:scale-110 active:scale-95 px-2 py-1.5 rounded-lg text-xs ${
                          isTopicBookmarked(topic) ? "text-amber-500 bg-amber-50" : "text-gray-500 hover:text-amber-500 hover:bg-amber-50"
                        }`}
                        aria-label="Bookmark"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isTopicBookmarked(topic) ? "fill-current" : ""}`} />
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">
                      {getTimeAgo(topic.last_activity_at || topic.updated_at || topic.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-10 flex items-center justify-center">
              {topicsLoading && paginatedTopics.topics.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
                  Loading more...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Scope sidebar (sticky, desktop only) ── */}
        <aside className="hidden lg:block sticky top-0 h-fit">
          <div className="flex flex-col gap-4">
          {/* Forum info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{forum.icon}</span>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 truncate">{forum.name}</h2>
                {isGlobalForum ? (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Global Forum
                  </span>
                ) : props.selectedCompany ? (
                  <span className="text-xs text-purple-600">{props.selectedCompany}</span>
                ) : null}
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{forum.description}</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                <div className="text-lg font-bold text-purple-700">{forum.topicCount || forum.topic_count || 0}</div>
                <div className="text-xs text-purple-600 font-medium">Topics</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="text-lg font-bold text-blue-700">{forum.memberCount || forum.member_count || 0}</div>
                <div className="text-xs text-blue-600 font-medium">Members</div>
              </div>
            </div>
          </div>

          {/* Sort scope */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sort By</h3>
            <div className="space-y-1">
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      sortBy === o.value
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time filter */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Time Range</h3>
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
                  className={`p-2 rounded-xl border text-xs font-medium transition-all ${
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

          {/* Last activity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span>Last active {formatLastActivity(forum.lastActivity || forum.last_activity)}</span>
            </div>
          </div>
          </div>
        </aside>
        </div>
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
        userId={selectedUserProfile?.id}
        onChat={props.handleChat}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
