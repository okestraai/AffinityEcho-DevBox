// src/admin/components/Skeletons.tsx
import React from 'react';

// ── Generic table row skeleton ────────────────────────────────────────────────

interface TableRowSkeletonProps {
  columns: number;
}

export function TableRowSkeleton({ columns }: TableRowSkeletonProps) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-gray-100 rounded-lg" style={{ width: `${60 + (i % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Moderation: mobile card skeleton ─────────────────────────────────────────

export function MobileCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="space-y-2 flex-1">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-32 h-3 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      </div>
      <div className="w-full h-12 bg-gray-200 rounded" />
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-16 h-6 bg-gray-200 rounded-full" />
        <div className="w-12 h-6 bg-gray-200 rounded-full" />
      </div>
      <div className="flex justify-between pt-2 border-t border-gray-100">
        <div className="w-20 h-3 bg-gray-200 rounded" />
        <div className="flex gap-1">
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Moderation: compact stat card skeleton ────────────────────────────────────

export function CompactStatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 animate-pulse">
      <div className="w-20 h-3 bg-gray-200 rounded mb-2" />
      <div className="w-12 h-8 bg-gray-200 rounded" />
    </div>
  );
}

// ── Dashboard: full stat card skeleton ───────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-2 sm:h-3 w-16 sm:w-20 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="mt-1 sm:mt-2 h-6 sm:h-7 md:h-8 w-12 sm:w-16 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-gray-200 animate-pulse"></div>
      </div>
      <div className="mt-2 sm:mt-3 md:mt-4 h-4 sm:h-5 md:h-6 w-20 sm:w-24 md:w-28 bg-gray-200 rounded-full animate-pulse"></div>
    </div>
  );
}

// ── Dashboard: bar chart skeleton ─────────────────────────────────────────────

export function BarChartSkeleton() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
      <div className="h-3 sm:h-4 w-32 sm:w-40 md:w-48 bg-gray-200 rounded-full animate-pulse mb-3 sm:mb-4 md:mb-5"></div>
      <div className="flex items-end justify-between gap-1" style={{ height: '100px' }}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex flex-col items-center flex-1 gap-1 sm:gap-2">
            <div className="h-3 sm:h-4 w-4 sm:w-5 md:w-6 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-full relative flex-1">
              <div
                className="absolute bottom-0 w-full bg-gray-200 rounded-t-lg animate-pulse"
                style={{ height: `${20 + (i * 7) % 40}px` }}
              ></div>
            </div>
            <div className="h-2 sm:h-3 w-4 sm:w-5 md:w-6 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard: quick actions skeleton ────────────────────────────────────────

export function QuickActionsSkeleton() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
      <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded-full animate-pulse mb-3 sm:mb-4"></div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 sm:h-9 md:h-10 w-24 sm:w-28 md:w-32 bg-gray-200 rounded-lg sm:rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard: recent activity skeleton ──────────────────────────────────────

export function ActivitySkeleton() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-100/80">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg sm:rounded-xl bg-gray-200 animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="h-3 sm:h-4 w-24 sm:w-28 md:w-32 bg-gray-200 rounded-full animate-pulse mb-1 sm:mb-2"></div>
              <div className="h-2 sm:h-3 w-32 sm:w-40 md:w-48 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-4 sm:h-5 md:h-6 w-12 sm:w-14 md:w-16 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
