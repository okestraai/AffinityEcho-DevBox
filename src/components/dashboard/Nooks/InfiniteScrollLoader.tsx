import React from 'react';
import { NookCardSkeleton } from '../../../Helper/SkeletonLoader';

interface InfiniteScrollLoaderProps {
  loading: boolean;
  hasMore: boolean;
  displayedCount: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  viewMode?: 'grid' | 'all';
}

export function InfiniteScrollLoader({ 
  loading, 
  hasMore, 
  displayedCount, 
  loadingRef,
  viewMode = 'all'
}: InfiniteScrollLoaderProps) {
  return (
    <div ref={loadingRef}>
      {loading && (
        <div className={`grid gap-6 mb-8 ${viewMode === 'all' ? 'md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'}`}>
          <NookCardSkeleton />
          <NookCardSkeleton />
          {viewMode === 'all' && <NookCardSkeleton />}
        </div>
      )}
      
      {!hasMore && displayedCount > 0 && !loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-full">
            <span className="text-sm font-medium">You've seen all active nooks</span>
          </div>
        </div>
      )}
    </div>
  );
}