
import { Plus, Zap } from "lucide-react";
import { NookCard } from "./NooksCard";
import { NooksGridSkeleton } from "../../../Helper/SkeletonLoader";

interface NooksGridProps {
  nooks: any[];
  viewMode: "grid" | "all";
  totalCount: number;
  onNookClick: (id: string) => void;
  onCreateClick: () => void;
  onViewModeChange: (mode: "grid" | "all") => void;
  onResetFilters: () => void;
  loading?: boolean;
}

export function NooksGrid({
  nooks,
  viewMode,
  totalCount,
  onNookClick,
  onCreateClick,
  onViewModeChange,
  onResetFilters,
  loading,
}: NooksGridProps) {
  // Show skeleton on initial load
  if (loading) {
    return (
      <NooksGridSkeleton
        viewMode={viewMode}
        count={viewMode === "grid" ? 4 : 8}
      />
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === "grid"
              ? "Active Conversations"
              : `All Nooks (${totalCount})`}
          </h2>
          {viewMode === "grid" && totalCount > 4 && (
            <button
              onClick={() => onViewModeChange("all")}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm bg-purple-50 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors"
            >
              View All ({totalCount})
            </button>
          )}
          {viewMode === "all" && (
            <button
              onClick={() => onViewModeChange("grid")}
              className="text-gray-600 hover:text-gray-700 font-medium text-sm bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              Back to Grid
            </button>
          )}
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Create Nook
        </button>
      </div>

      <div
        className={`grid gap-6 ${
          viewMode === "all"
            ? "md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            : "md:grid-cols-2"
        }`}
      >
        {nooks.map((nook) => (
          <NookCard key={nook.id} nook={nook} onClick={onNookClick} />
        ))}
      </div>

      {/* No Results Message */}
      {!loading && nooks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-500 mb-1">
            No nooks match your filters
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Try adjusting your filter criteria
          </p>
          <button
            onClick={onResetFilters}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
