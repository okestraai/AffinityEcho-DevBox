// src/Helper/SkeletonLoader.tsx
// Skeleton loaders that match actual component layouts

// ─── Reusable shimmer block ───
const Shimmer = ({ className }: { className?: string }) => (
  <div className={`bg-gray-200 rounded ${className || ''}`} />
);

// ─── FORUM SKELETONS ───

export function TopicsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-gray-200/50 animate-pulse"
        >
          <div className="flex items-start gap-3 md:gap-4 mb-4">
            <Shimmer className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <Shimmer className="h-6 rounded-full w-24" />
                <Shimmer className="h-5 rounded-full w-32" />
              </div>
              <Shimmer className="h-6 w-3/4 mb-2" />
              <Shimmer className="h-4 w-full mb-1" />
              <Shimmer className="h-4 w-5/6" />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <Shimmer className="h-8 rounded-lg w-14" />
            <Shimmer className="h-8 rounded-lg w-14" />
            <Shimmer className="h-8 rounded-lg w-14" />
            <Shimmer className="h-8 rounded-lg w-14" />
            <Shimmer className="h-8 rounded-lg w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ForumCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-gray-200 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shimmer className="w-12 h-12 rounded-xl flex-shrink-0" />
            <Shimmer className="h-6 w-32" />
          </div>
          <Shimmer className="h-4 w-full mb-2" />
          <Shimmer className="h-4 w-3/4 mb-4" />
          <div className="grid grid-cols-3 gap-3">
            <Shimmer className="h-12 rounded-lg" />
            <Shimmer className="h-12 rounded-lg" />
            <Shimmer className="h-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Shimmer className="h-6 w-32 mb-4" />
        <div className="bg-white/90 rounded-xl p-4 border border-gray-200 animate-pulse">
          <Shimmer className="h-6 w-40 mb-2" />
          <div className="grid grid-cols-2 gap-2">
            <Shimmer className="h-4" />
            <Shimmer className="h-4" />
          </div>
        </div>
      </div>
      <div>
        <Shimmer className="h-6 w-40 mb-4" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/90 rounded-xl p-4 border border-gray-200 mb-3 animate-pulse"
          >
            <Shimmer className="h-5 w-32 mb-2" />
            <div className="grid grid-cols-3 gap-2">
              <Shimmer className="h-3" />
              <Shimmer className="h-3" />
              <Shimmer className="h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Shimmer className="h-4 w-32 mb-2" />
              <Shimmer className="h-4 w-full mb-1" />
              <Shimmer className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ForumViewSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-lg border border-gray-200/50 p-4 md:p-8 mb-4 md:mb-8 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6">
          <div className="space-y-3">
            <Shimmer className="h-8 md:h-10 w-48 md:w-64" />
            <Shimmer className="h-5 md:h-6 w-64 md:w-80" />
          </div>
          <Shimmer className="h-10 md:h-12 rounded-xl w-full md:w-40" />
        </div>
        <Shimmer className="h-12 md:h-14 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <Shimmer className="h-8 w-36 md:w-48" />
            <Shimmer className="h-10 rounded-xl w-20 md:w-24" />
          </div>
          <TopicsSkeleton />
        </div>
        <div className="hidden lg:block space-y-6">
          <SidebarSkeleton />
        </div>
      </div>
    </div>
  );
}

// ─── NOOK SKELETONS ───

export function NookCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-1">
        <div className="bg-white/95 p-4 rounded-t-xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
              <Shimmer className="h-5 w-3/4" />
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-4 w-5/6" />
            </div>
            <Shimmer className="ml-4 w-6 h-6 rounded-full flex-shrink-0" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Shimmer className="h-6 rounded-full w-20" />
            <Shimmer className="h-6 rounded-full w-24" />
            <Shimmer className="h-6 rounded-full w-16" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-2">
              <Shimmer className="h-6 w-8 mx-auto" />
              <Shimmer className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shimmer className="h-6 rounded-full w-16" />
            <Shimmer className="h-6 rounded-full w-20" />
          </div>
          <Shimmer className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function NookMessageSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-pulse">
      <div className="flex items-start gap-3">
        <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-3 w-16" />
          </div>
          <div className="space-y-2">
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-11/12" />
            <Shimmer className="h-4 w-4/5" />
          </div>
          <div className="flex items-center gap-4">
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NookDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-4 md:p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <Shimmer className="h-8 bg-white/30 w-32" />
              <Shimmer className="h-6 bg-white/30 w-16" />
            </div>
            <div className="space-y-3">
              <Shimmer className="h-7 bg-white/30 w-3/4" />
              <Shimmer className="h-5 bg-white/30 w-full" />
            </div>
            <div className="flex items-center gap-3 md:gap-4 flex-wrap">
              <Shimmer className="h-7 bg-white/30 rounded-full w-28 md:w-32" />
              <Shimmer className="h-7 bg-white/30 rounded-full w-24 md:w-28" />
              <Shimmer className="h-7 bg-white/30 rounded-full w-28 md:w-32" />
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50">
          <Shimmer className="h-5 w-full" />
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        <NookMessageSkeleton />
        <NookMessageSkeleton />
        <NookMessageSkeleton />
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
        <div className="flex items-start gap-3 md:gap-4">
          <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Shimmer className="h-20 md:h-24 rounded-xl bg-gray-100" />
            <div className="flex items-center justify-between">
              <Shimmer className="h-4 w-32 md:w-48" />
              <Shimmer className="h-9 rounded-xl w-20 md:w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 text-center shadow-lg border border-gray-100 animate-pulse">
      <Shimmer className="h-8 w-16 mx-auto mb-2" />
      <Shimmer className="h-4 w-24 mx-auto" />
    </div>
  );
}

interface NooksGridSkeletonProps {
  viewMode: "grid" | "all";
  count?: number;
}

export function NooksGridSkeleton({ viewMode, count = 4 }: NooksGridSkeletonProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 md:mb-6 animate-pulse">
        <Shimmer className="h-8 w-36 md:w-48" />
        <Shimmer className="h-10 rounded-2xl w-28 md:w-36" />
      </div>
      <div
        className={`grid gap-4 md:gap-6 ${
          viewMode === "all"
            ? "grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {Array.from({ length: count }).map((_, i) => (
          <NookCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── FEED SKELETON ───

export function FeedSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Create post bar */}
      <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 mb-4 md:mb-6 animate-pulse">
        <div className="flex items-center gap-3">
          <Shimmer className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0" />
          <Shimmer className="flex-1 h-10 md:h-12 rounded-full bg-gray-100" />
        </div>
      </div>

      {/* Feed cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div className="p-3 md:p-4">
              <div className="flex items-start gap-3 mb-3">
                <Shimmer className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Shimmer className="h-4 w-24 md:w-28" />
                    <Shimmer className="h-5 w-12 rounded" />
                  </div>
                  <Shimmer className="h-3 w-16 md:w-20 mt-1" />
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-11/12" />
                <Shimmer className="h-4 w-3/4" />
              </div>
            </div>
            <div className="px-3 md:px-4 py-2 border-t border-gray-100">
              <div className="flex items-center justify-around">
                <Shimmer className="h-8 rounded-lg w-12 md:w-16" />
                <Shimmer className="h-8 rounded-lg w-12 md:w-16" />
                <Shimmer className="h-8 rounded-lg w-12 md:w-16" />
                <Shimmer className="h-8 rounded-lg w-12 md:w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROFILE SKELETON — Activity page (My Posts / Bookmarked) ───

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Shimmer className="h-7 md:h-8 w-28 md:w-32" />
            <Shimmer className="h-4 md:h-5 w-44 md:w-52" />
          </div>
          <Shimmer className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4 mt-5">
        {/* Sub-tabs: My Posts / Bookmarked */}
        <div className="grid grid-cols-2 gap-2 mt-5 animate-pulse">
          <Shimmer className="h-12 rounded-xl" />
          <Shimmer className="h-12 rounded-xl" />
        </div>

        {/* Content filter tabs */}
        <div className="grid grid-cols-4 gap-2 animate-pulse">
          <Shimmer className="h-12 rounded-xl" />
          <Shimmer className="h-12 rounded-xl" />
          <Shimmer className="h-12 rounded-xl" />
          <Shimmer className="h-12 rounded-xl" />
        </div>

        {/* Content cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
              <div className="p-3 md:p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Shimmer className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Shimmer className="h-4 w-24" />
                      <Shimmer className="h-5 w-12 rounded" />
                    </div>
                    <Shimmer className="h-3 w-16 mt-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-4 w-5/6" />
                </div>
              </div>
              <div className="px-3 md:px-4 py-2 border-t border-gray-100">
                <div className="flex items-center justify-around">
                  <Shimmer className="h-8 rounded-lg w-12" />
                  <Shimmer className="h-8 rounded-lg w-12" />
                  <Shimmer className="h-8 rounded-lg w-12" />
                  <Shimmer className="h-8 rounded-lg w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE PAGE SKELETON — Hero card + Profile/Follow tabs ───

export function ProfilePageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-center gap-3">
          <Shimmer className="w-9 h-9 rounded-lg" />
          <div className="space-y-2">
            <Shimmer className="h-7 w-28" />
            <Shimmer className="h-4 w-40" />
          </div>
        </div>
      </div>

      <div className="pb-6 animate-pulse">
        {/* Hero Card */}
        <div className="relative overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
          <div className="px-4 -mt-16 relative z-10">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex flex-col items-center -mt-14 mb-4">
                <Shimmer className="w-24 h-24 rounded-2xl border-4 border-white" />
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Shimmer className="h-4 w-32" />
                <Shimmer className="h-6 w-40" />
                <Shimmer className="h-4 w-24" />
                <div className="flex items-center gap-3 mt-2">
                  <Shimmer className="h-7 w-28 rounded-full" />
                  <Shimmer className="h-7 w-24 rounded-full" />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-5 gap-2 mt-6 pt-6 border-t border-gray-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-gray-50">
                    <Shimmer className="h-6 w-8 mx-auto mb-1" />
                    <Shimmer className="h-3 w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile / Follow Tab Switcher */}
        <div className="px-4 mt-4">
          <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1">
            <Shimmer className="h-10 rounded-lg" />
            <Shimmer className="h-10 rounded-lg" />
          </div>
        </div>

        {/* Profile tab content placeholders */}
        <div className="px-4 mt-4 space-y-4">
          {/* Badges */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-2.5 mb-4">
              <Shimmer className="w-8 h-8 rounded-lg" />
              <Shimmer className="h-5 w-40" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-gray-50">
                  <Shimmer className="h-8 w-8 mx-auto mb-2 rounded-full" />
                  <Shimmer className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Impact */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-2.5 mb-4">
              <Shimmer className="w-8 h-8 rounded-lg" />
              <Shimmer className="h-5 w-28" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shimmer className="w-9 h-9 rounded-lg" />
                    <Shimmer className="h-4 w-28" />
                  </div>
                  <Shimmer className="h-5 w-8" />
                </div>
              ))}
            </div>
          </div>

          {/* Communities */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-2.5 mb-4">
              <Shimmer className="w-8 h-8 rounded-lg" />
              <Shimmer className="h-5 w-36" />
            </div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
                  <Shimmer className="w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Shimmer className="h-4 w-32" />
                    <Shimmer className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FOLLOW LIST SKELETON — Following/Followers user cards ───

export function FollowListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Sub-tabs */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Shimmer className="h-12 rounded-xl" />
        <Shimmer className="h-12 rounded-xl" />
      </div>

      {/* User cards */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <Shimmer className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="space-y-1.5">
                  <Shimmer className="h-4 w-28" />
                  <Shimmer className="h-3 w-40" />
                </div>
                <Shimmer className="h-8 w-20 rounded-lg" />
              </div>
              <div className="flex gap-1.5 mt-2">
                <Shimmer className="h-5 w-24 rounded-full" />
                <Shimmer className="h-5 w-20 rounded-full" />
              </div>
              <Shimmer className="h-3 w-36 mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── NOTIFICATIONS SKELETON ───

export function NotificationsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <Shimmer className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0" />
            <div>
              <Shimmer className="h-6 md:h-7 w-32 md:w-40 mb-1" />
              <Shimmer className="h-4 w-20 md:w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shimmer className="w-9 h-9 rounded-lg" />
            <Shimmer className="h-9 rounded-lg w-24 md:w-32" />
          </div>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <Shimmer key={i} className="h-9 rounded-lg w-16 md:w-20 flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Notification items */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse">
            <div className="p-3 md:p-4">
              <div className="flex items-start gap-3">
                <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Shimmer className="h-5 w-36 md:w-48" />
                    <Shimmer className="h-4 w-12 md:w-16 flex-shrink-0" />
                  </div>
                  <Shimmer className="h-4 w-full mb-1" />
                  <Shimmer className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS SKELETON ───

export function SettingsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Privacy & Safety */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <Shimmer className="h-5 w-36 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <Shimmer className="h-4 w-28" />
                <Shimmer className="h-3 w-full max-w-[200px]" />
              </div>
              <Shimmer className="w-11 h-6 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <Shimmer className="h-5 w-28 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Shimmer className="h-4 w-32" />
              <Shimmer className="w-11 h-6 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <Shimmer className="h-5 w-20 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Shimmer key={i} className="h-11 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGES / CHAT SKELETON ───

export function MentorshipChatSkeleton() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-200px)] md:h-screen bg-gray-50">
      {/* Chat header */}
      <div className="bg-white px-3 md:px-4 py-3 md:py-4 border-b border-gray-200 shadow-sm animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <Shimmer className="w-5 h-5 rounded" />
          <Shimmer className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Shimmer className="h-5 w-24 md:w-32" />
              <Shimmer className="h-5 rounded-full w-16 md:w-20" />
            </div>
            <Shimmer className="h-3 w-32 md:w-48" />
          </div>
        </div>
        <Shimmer className="h-10 rounded-lg" />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden p-3 md:p-4 space-y-4">
        <div className="flex justify-start">
          <div className="max-w-[75%] md:max-w-xs">
            <Shimmer className="h-16 rounded-2xl rounded-bl-md w-48 md:w-56" />
            <Shimmer className="h-3 w-16 mt-1" />
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[75%] md:max-w-xs">
            <Shimmer className="h-12 rounded-2xl rounded-br-md w-40 md:w-48" />
            <Shimmer className="h-3 w-16 mt-1 ml-auto" />
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[75%] md:max-w-xs">
            <Shimmer className="h-20 rounded-2xl rounded-bl-md w-52 md:w-64" />
            <Shimmer className="h-3 w-16 mt-1" />
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[75%] md:max-w-xs">
            <Shimmer className="h-10 rounded-2xl rounded-br-md w-32 md:w-40" />
            <Shimmer className="h-3 w-16 mt-1 ml-auto" />
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-200 p-3 md:p-4 shadow-lg animate-pulse">
        <div className="flex gap-2">
          <Shimmer className="flex-1 h-10 md:h-12 rounded-xl bg-gray-100" />
          <Shimmer className="h-10 md:h-12 rounded-xl w-16 md:w-20" />
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGES LIST SKELETON ───

export function MessagesListSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <Shimmer className="h-7 w-28" />
          <Shimmer className="h-9 w-28 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-9 w-16 rounded-lg" />
          <Shimmer className="h-9 w-24 rounded-lg" />
          <Shimmer className="h-9 w-20 rounded-lg" />
        </div>
      </div>
      {/* Conversation list */}
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <Shimmer className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Shimmer className="h-4 w-28" />
                  <Shimmer className="h-3 w-12" />
                </div>
                <Shimmer className="h-3 w-full max-w-[200px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
