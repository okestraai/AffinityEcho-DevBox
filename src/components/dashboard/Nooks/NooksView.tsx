// ============================================================================
// NooksView.tsx - Main container with isolated actions
// ============================================================================
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

// Import all child components
import { NooksHero } from "./NooksHero";
import { NooksStats } from "./NooksStats";
import { NooksFilters } from "./NooksFilters";
import { NooksGrid } from "./NooksGrid";
import { NookDetail } from "./NookDetails";
import { CreateNookModal } from "../../Modals/NooksModals/CreateNookModal";
import { CreateNookCTA } from "./CreateNookCTA";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { UserProfileModal } from "../../Modals/UserProfileModal";

// Import API functions
import {
  GetNooks,
  GetNookMetrics,
  GetNookById,
} from "../../../../api/nookApis";

// Logging utility
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [NooksView.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [NooksView.${component}] ${message}`);
  }
};

export function NooksView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNook, setSelectedNook] = useState<string | null>(null);
  const [selectedNookData, setSelectedNookData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "all">("grid");
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Data State
  const [displayedNooks, setDisplayedNooks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeNooks: 0,
    anonymousUsers: 0,
    totalMessageParticipants: 0,
  });

  // Loading States
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [nookDetailLoading, setNookDetailLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Filter State
  const [filters, setFilters] = useState({
    urgency: "all" as "all" | "high" | "medium" | "low",
    scope: "all" as "all" | "company" | "global",
    temperature: "all" as "all" | "hot" | "warm" | "cool",
    hashtag: "",
  });

  const NOOKS_PER_PAGE = 8;

  // ========================================================================
  // INITIAL DATA FETCHING
  // ========================================================================

  useEffect(() => {
    log("NooksView", "Component initialized");
    fetchStats();
    fetchNooks(1, true); // Initial load
  }, []);

  // ========================================================================
  // STATS FETCHING - ISOLATED
  // ========================================================================

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await GetNookMetrics();

      if (response.success && response.data?.success) {
        const data = response.data.data;
        setStats({
          activeNooks: data.activeNooks || 0,
          anonymousUsers: data.anonymousUsers || 0,
          totalMessageParticipants: data.totalMessageParticipants || 0,
        });
        log("fetchStats", "Stats loaded", data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  // ========================================================================
  // NOOKS FETCHING
  // ========================================================================

  const fetchNooks = async (page: number = 1, replace: boolean = false) => {
    try {
      setLoading(true);

      // Build filter object
      const filterParams: any = {
        page,
        limit: NOOKS_PER_PAGE,
        sortBy: "last_activity_at",
        sortOrder: "desc",
      };

      // Add filters only if they're not 'all'
      if (filters.urgency !== "all") filterParams.urgency = filters.urgency;
      if (filters.scope !== "all") filterParams.scope = filters.scope;
      if (filters.temperature !== "all")
        filterParams.temperature = filters.temperature;
      if (filters.hashtag) filterParams.hashtag = filters.hashtag;

      const response = await GetNooks(filterParams);

      if (response.success && response.data?.success) {
        const data = response.data.data;
        const newNooks = data.nooks || [];
        const pagination = data.pagination;

        if (replace) {
          setDisplayedNooks(newNooks);
        } else {
          setDisplayedNooks((prev) => [...prev, ...newNooks]);
        }

        setTotalPages(pagination.totalPages);
        setTotalCount(pagination.total);
        setCurrentPage(pagination.page);
        setHasMore(pagination.page < pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching nooks:", error);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // NOOK DETAIL FETCHING
  // ========================================================================

  const fetchNookDetail = async (nookId: string) => {
    try {
      setNookDetailLoading(true);
      log("fetchNookDetail", "Fetching nook detail", { nookId });

      const response = await GetNookById(nookId);

      if (response.success && response.data?.success) {
        const nookData = {
          ...response.data.data.nook,
          isMember: response.data.data.isMember,
          isCreator: response.data.data.isCreator,
        };

        setSelectedNookData(nookData);
        log("fetchNookDetail", "Nook detail loaded", nookData);
      }
    } catch (error) {
      console.error("Error fetching nook detail:", error);
      // If error, go back to list
      setSelectedNook(null);
      setSelectedNookData(null);
    } finally {
      setNookDetailLoading(false);
    }
  };

  // ========================================================================
  // ISOLATED REFRESH HANDLER - Called from NookDetail
  // ========================================================================

  const handleNookUpdated = async () => {
    try {
      log("handleNookUpdated", "Refreshing stats only");
      // Only refresh stats, not the entire nooks list
      await fetchStats();
    } catch (error) {
      console.error("Error refreshing after nook update:", error);
    }
  };

  // ========================================================================
  // FILTER HANDLING
  // ========================================================================

  useEffect(() => {
    // Reset pagination and refetch when filters change
    if (viewMode === "all") {
      log("NooksView", "Filters changed, refetching", filters);
      setCurrentPage(1);
      fetchNooks(1, true);
    }
  }, [filters, viewMode]);

  const resetFilters = () => {
    setFilters({
      urgency: "all",
      scope: "all",
      temperature: "all",
      hashtag: "",
    });
  };

  // ========================================================================
  // PAGINATION & INFINITE SCROLL
  // ========================================================================

  const loadMoreNooks = useCallback(async () => {
    if (loading || !hasMore) return;

    log("loadMoreNooks", "Loading more nooks", {
      currentPage,
      displayedCount: displayedNooks.length,
    });

    await fetchNooks(currentPage + 1, false);
  }, [loading, hasMore, currentPage, displayedNooks.length, filters]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (viewMode !== "all") return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          log("IntersectionObserver", "Loading trigger activated");
          loadMoreNooks();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [viewMode, hasMore, loading, loadMoreNooks]);

  // ========================================================================
  // VIEW MODE HANDLING
  // ========================================================================

  const handleViewModeChange = (mode: "grid" | "all") => {
    setViewMode(mode);

    if (mode === "all" && displayedNooks.length === 0) {
      // Load nooks when switching to "all" view if not loaded yet
      fetchNooks(1, true);
    }
  };

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handleUserClick = (userId: string) => {
    if (user?.id === userId) {
      navigate("/dashboard/profile");
    } else {
      setSelectedUserId(userId);
      setShowUserProfile(true);
    }
  };

  const handleChatUser = (userId: string) => {
    setShowUserProfile(false);
    log("handleChatUser", "Chat initiated", { userId });
    // TODO: Navigate to chat or open chat modal
    // navigate(`/dashboard/messages/${userId}`);
  };

  const handleNookClick = (nookId: string) => {
    setSelectedNook(nookId);
    fetchNookDetail(nookId);
    log("handleNookClick", "Opening nook", { nookId });
  };

  const handleBackFromDetail = () => {
    setSelectedNook(null);
    setSelectedNookData(null);
    // Refresh the nooks list and stats
    fetchNooks(1, true);
    fetchStats();
  };

  const handleCreateSuccess = () => {
    log("handleCreateSuccess", "Nook created successfully");
    // Refresh nooks list and stats
    fetchNooks(1, true);
    fetchStats();
  };

  // ========================================================================
  // RENDER LOGIC
  // ========================================================================

  // Show first 4 nooks in grid mode, or all displayed nooks in "all" mode
  const nooksToDisplay =
    viewMode === "grid" ? displayedNooks.slice(0, 4) : displayedNooks;

  // Render Nook Detail View
  if (selectedNook && selectedNookData) {
    if (nookDetailLoading) {
      return (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading nook...</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <NookDetail
          nook={selectedNookData}
          userAvatar={user?.avatar || "?"}
          currentUserId={user?.id || ""}
          onBack={handleBackFromDetail}
          onUserClick={handleUserClick}
          onNookUpdated={handleNookUpdated}
        />

        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={selectedUserId || ""}
          onChat={handleChatUser}
        />
      </>
    );
  }

  // Render Main Nooks View
  return (
    <div className="max-w-6xl mx-auto">
      <NooksHero />

      <NooksStats
        activeNooks={stats.activeNooks}
        anonymousUsers={stats.anonymousUsers}
        totalMessageParticipants={stats.totalMessageParticipants}
        loading={statsLoading}
      />

      {viewMode === "all" && (
        <NooksFilters
          filters={filters}
          onFilterChange={setFilters}
          onReset={resetFilters}
        />
      )}

      <NooksGrid
        nooks={nooksToDisplay}
        viewMode={viewMode}
        totalCount={totalCount}
        onNookClick={handleNookClick}
        onCreateClick={() => setShowCreateModal(true)}
        onViewModeChange={handleViewModeChange}
        onResetFilters={resetFilters}
        loading={loading && displayedNooks.length === 0}
      />

      {viewMode === "all" && (
        <InfiniteScrollLoader
          loading={loading && displayedNooks.length > 0}
          hasMore={hasMore}
          displayedCount={displayedNooks.length}
          loadingRef={loadingRef}
        />
      )}

      <CreateNookCTA onCreateClick={() => setShowCreateModal(true)} />

      <CreateNookModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ""}
        onChat={handleChatUser}
      />
    </div>
  );
}
