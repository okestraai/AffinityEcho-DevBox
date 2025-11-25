// src/components/forums/ForumsView.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { ForumDetailView } from "./ForumDetailView";
import {
  companies,
  globalForums,
  mockTopics,
  mockUserProfiles,
} from "../../../data/mockForums";
import { Topic, UserProfile } from "../../../types/forum";

// Split Views
import { OverviewMode } from "./OverviewMode";
import { CompanyMode } from "./CompanyMode";
import { ForumTopicsMode } from "./ForumTopicsMode";

export function ForumsView() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopicDetail, setShowTopicDetail] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedForum, setSelectedForum] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<
    "overview" | "company" | "forum" | "global" | "forumDetail"
  >("overview");
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"relevant" | "recent" | "popular" | "trending">("relevant");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  // const userCompany = companies.find(c => c.name === currentUser?.demographics.company);

   const userCompany = companies.find(c => c.name === "Google");

  const handleUserClick = (userId: string) => {
    if (currentUser && userId === currentUser.id) return;
    const profile = mockUserProfiles[userId];
    if (profile) {
      setSelectedUserProfile(profile);
      setShowUserProfile(true);
    }
  };

  const handleFollow = () => {};
  const handleUnfollow = () => {};
  const handleChat = () => setShowUserProfile(false);

  const TOPICS_PER_PAGE = 10;

  const getFilteredAndSortedTopics = () => {
    let topics = [...mockTopics];

    if (viewMode === "company" && selectedCompany)
      topics = topics.filter(t => t.companyId === selectedCompany);
    if ((viewMode === "forum" || viewMode === "global") && selectedForum)
      topics = topics.filter(t => t.forumId === selectedForum);
    if (viewMode === "global")
      topics = topics.filter(t => !t.companyId);

    if (timeFilter !== "all") {
      const now = Date.now();
      const thresholds = { today: 86400000, week: 604800000, month: 2592000000 };
      topics = topics.filter(t => now - t.createdAt.getTime() <= thresholds[timeFilter]);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      topics = topics.filter(t =>
        t.title.toLowerCase().includes(term) ||
        t.content.toLowerCase().includes(term) ||
        t.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    const score = (t: Topic) =>
      t.reactions.seen * 1 + t.reactions.validated * 2 + t.reactions.inspired * 3 +
      t.reactions.heard * 2 + t.commentCount * 1.5;

    const totalReactions = (t: Topic) => Object.values(t.reactions).reduce((a, b) => a + b, 0);

    switch (sortBy) {
      case "relevant": topics.sort((a, b) => score(b) - score(a)); break;
      case "recent": topics.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()); break;
      case "popular": topics.sort((a, b) => totalReactions(b) - totalReactions(a)); break;
      case "trending":
        topics.sort((a, b) => {
          const ha = Math.max((Date.now() - a.lastActivity.getTime()) / 3600000, 1);
          const hb = Math.max((Date.now() - b.lastActivity.getTime()) / 3600000, 1);
          return (totalReactions(b) + b.commentCount) / hb - (totalReactions(a) + a.commentCount) / ha;
        });
        break;
    }
    return topics;
  };

  const paginatedTopics = useMemo(() => {
    const filtered = getFilteredAndSortedTopics();
    const start = (currentPage - 1) * TOPICS_PER_PAGE;
    return {
      topics: filtered.slice(start, start + TOPICS_PER_PAGE),
      totalTopics: filtered.length,
      totalPages: Math.ceil(filtered.length / TOPICS_PER_PAGE),
    };
  }, [viewMode, selectedCompany, selectedForum, searchTerm, sortBy, timeFilter, currentPage]);

  const handleReaction = (topicId: string, type: keyof Topic["reactions"], e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Reaction:", type, topicId);
  };

  const handleCompanySelect = (id: string) => {
    setSelectedCompany(id);
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

  const getTimeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
  };

    const handleCommentClick = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCommentId(activeCommentId === topicId ? null : topicId);
  };

  const handleCommentSubmit = async (topicId: string, comment: string) => {
    console.log('Comment submitted for topic:', topicId, 'Comment:', comment);
    setActiveCommentId(null);
  };

  const handleCommentCancel = () => {
    setActiveCommentId(null);
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
    companies,
    globalForums,
    handleFollow,
    handleUnfollow,
    handleChat,
    activeCommentId,
    setActiveCommentId,
    setViewMode
  };

  if (viewMode === "overview") return <OverviewMode {...shared} />;
  if (viewMode === "company" && selectedCompany) return <CompanyMode {...shared} />;
  if (viewMode === "forumDetail" && selectedForum) {
    const forum = [...globalForums, ...companies.flatMap(c => c.forums)].find(f => f.id === selectedForum);
    if (!forum) return null;
    return <ForumDetailView forum={forum} onBack={handleForumBack} />;
  }
  if ((viewMode === "forum" || viewMode === "global") && selectedForum)
    return <ForumTopicsMode {...shared} />;

  return null;
}