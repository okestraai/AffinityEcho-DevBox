

export function TopicsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-gray-200/50 animate-pulse"
        >
          <div className="flex items-start gap-3 md:gap-4 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-xl"></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                <div className="h-5 bg-gray-200 rounded-full w-32"></div>
              </div>
              <div className="h-7 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
            <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
            <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ForumCardSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="h-12 bg-gray-200 rounded-lg"></div>
            <div className="h-12 bg-gray-200 rounded-lg"></div>
            <div className="h-12 bg-gray-200 rounded-lg"></div>
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
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="bg-white/90 rounded-xl p-4 border border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      <div>
        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/90 rounded-xl p-4 border border-gray-200 mb-3 animate-pulse"
          >
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
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
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// src/components/Helper/SkeletonLoader.tsx - ADD THIS
export function ForumViewSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-8 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded w-64"></div>
            <div className="h-6 bg-gray-200 rounded w-80"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-xl w-40"></div>
        </div>
        <div className="h-14 bg-gray-200 rounded-2xl"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
          </div>

          {/* Topics Skeleton */}
          <TopicsSkeleton />
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <SidebarSkeleton />
        </div>
      </div>
    </div>
  );
}

export function NookCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse">
      {/* Header Gradient */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-1">
        <div className="bg-white/95 p-4 rounded-t-xl">
          {/* Title and Description */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="ml-4 w-6 h-6 bg-gray-200 rounded-full"></div>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center space-y-2">
            <div className="h-6 bg-gray-200 rounded w-8 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
          <div className="text-center space-y-2">
            <div className="h-6 bg-gray-200 rounded w-8 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
          <div className="text-center space-y-2">
            <div className="h-6 bg-gray-200 rounded w-12 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

export function NookMessageSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-pulse">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>

        <div className="flex-1 space-y-3">
          {/* Username and timestamp */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>

          {/* Message content */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>

          {/* Reaction buttons */}
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NookDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="h-8 bg-white/30 rounded w-32"></div>
              <div className="h-6 bg-white/30 rounded w-16"></div>
            </div>

            <div className="space-y-3">
              <div className="h-7 bg-white/30 rounded w-3/4"></div>
              <div className="h-5 bg-white/30 rounded w-full"></div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-7 bg-white/30 rounded-full w-32"></div>
              <div className="h-7 bg-white/30 rounded-full w-28"></div>
              <div className="h-7 bg-white/30 rounded-full w-32"></div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50">
          <div className="h-5 bg-gray-200 rounded w-full"></div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        <NookMessageSkeleton />
        <NookMessageSkeleton />
        <NookMessageSkeleton />
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="h-24 bg-gray-100 rounded-xl"></div>
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-9 bg-gray-200 rounded-xl w-24"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
    </div>
  );
}

interface NooksGridSkeletonProps {
  viewMode: "grid" | "all";
  count?: number;
}

export function NooksGridSkeleton({
  viewMode,
  count = 4,
}: NooksGridSkeletonProps) {
  return (
    <div className="mb-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="h-10 bg-gray-200 rounded-2xl w-36"></div>
      </div>

      {/* Grid */}
      <div
        className={`grid gap-6 ${
          viewMode === "all"
            ? "md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            : "md:grid-cols-2"
        }`}
      >
        {Array.from({ length: count }).map((_, i) => (
          <NookCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Create post bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 h-12 bg-gray-100 rounded-full"></div>
        </div>
      </div>

      {/* Feed cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                    <div className="h-5 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20 mt-1"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-11/12"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div className="px-4 py-2 border-t border-gray-100">
              <div className="flex items-center justify-around">
                <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-14"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-5 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-white/80 rounded-3xl p-8 border border-gray-200 shadow-lg animate-pulse">
          <div className="text-center mb-4">
            <div className="w-24 h-24 bg-gray-200 rounded-3xl mx-auto mb-4"></div>
            <div className="h-7 bg-gray-200 rounded w-40 mx-auto mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
            <div className="h-8 bg-gray-200 rounded-full w-36 mx-auto"></div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-4 bg-gray-200 rounded w-36"></div>
          </div>
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded w-10 mx-auto mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Mentorship Section */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-gray-200 rounded w-28"></div>
            <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-40 mb-3"></div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="text-center p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Section */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-28 mb-3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-7 bg-gray-200 rounded w-40 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
            <div className="h-9 bg-gray-200 rounded-lg w-32"></div>
          </div>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 bg-gray-200 rounded-lg w-20"></div>
          ))}
        </div>
      </div>

      {/* Notification cards */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="h-5 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Privacy & Safety card */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="h-5 bg-gray-200 rounded w-36 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="w-11 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications card */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="h-5 bg-gray-200 rounded w-28 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="w-11 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Account card */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="h-5 bg-gray-200 rounded w-20 mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-11 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MentorshipChatSkeleton() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col h-screen bg-gray-50">
      {/* Chat header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 shadow-sm animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-5 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        {/* Left message */}
        <div className="flex justify-start">
          <div className="max-w-xs">
            <div className="h-16 bg-gray-200 rounded-2xl rounded-bl-md w-56 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1 animate-pulse"></div>
          </div>
        </div>
        {/* Right message */}
        <div className="flex justify-end">
          <div className="max-w-xs">
            <div className="h-12 bg-gray-200 rounded-2xl rounded-br-md w-48 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1 ml-auto animate-pulse"></div>
          </div>
        </div>
        {/* Left message */}
        <div className="flex justify-start">
          <div className="max-w-xs">
            <div className="h-20 bg-gray-200 rounded-2xl rounded-bl-md w-64 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1 animate-pulse"></div>
          </div>
        </div>
        {/* Right message */}
        <div className="flex justify-end">
          <div className="max-w-xs">
            <div className="h-10 bg-gray-200 rounded-2xl rounded-br-md w-40 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1 ml-auto animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg animate-pulse">
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-gray-100 rounded-xl"></div>
          <div className="h-12 bg-gray-200 rounded-xl w-20"></div>
        </div>
      </div>
    </div>
  );
}
