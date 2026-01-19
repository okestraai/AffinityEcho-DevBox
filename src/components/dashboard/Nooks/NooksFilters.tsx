import React from "react";
import { Hash } from "lucide-react";

interface NooksFiltersProps {
  filters: {
    urgency: "all" | "high" | "medium" | "low";
    scope: "all" | "company" | "global";
    temperature: "all" | "hot" | "warm" | "cool";
    hashtag: string;
  };
  onFilterChange: (filters: any) => void;
  onReset: () => void;
}

export function NooksFilters({
  filters,
  onFilterChange,
  onReset,
}: NooksFiltersProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
      <div className="flex items-center gap-4 mb-4">
        <h3 className="font-semibold text-gray-900">Filter Nooks</h3>
        <button
          onClick={onReset}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Urgency Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Urgency
          </label>
          <select
            value={filters.urgency}
            onChange={(e) =>
              onFilterChange({ ...filters, urgency: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
          >
            <option value="all">All Levels</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Scope Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Scope
          </label>
          <select
            value={filters.scope}
            onChange={(e) =>
              onFilterChange({ ...filters, scope: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
          >
            <option value="all">All Scopes</option>
            <option value="company">Company Only</option>
            <option value="global">Global</option>
          </select>
        </div>

        {/* Temperature Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Activity
          </label>
          <select
            value={filters.temperature}
            onChange={(e) =>
              onFilterChange({ ...filters, temperature: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
          >
            <option value="all">All Activity</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">⚡ Warm</option>
            <option value="cool">👁️ Cool</option>
          </select>
        </div>

        {/* Hashtag Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Hashtag
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              value={filters.hashtag}
              onChange={(e) =>
                onFilterChange({ ...filters, hashtag: e.target.value })
              }
              placeholder="Filter by tag"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.urgency !== "all" ||
        filters.scope !== "all" ||
        filters.temperature !== "all" ||
        filters.hashtag) && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          {filters.urgency !== "all" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              Urgency: {filters.urgency}
              <button
                onClick={() => onFilterChange({ ...filters, urgency: "all" })}
              >
                ×
              </button>
            </span>
          )}
          {filters.scope !== "all" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              Scope: {filters.scope}
              <button
                onClick={() => onFilterChange({ ...filters, scope: "all" })}
              >
                ×
              </button>
            </span>
          )}
          {filters.temperature !== "all" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              Activity: {filters.temperature}
              <button
                onClick={() =>
                  onFilterChange({ ...filters, temperature: "all" })
                }
              >
                ×
              </button>
            </span>
          )}
          {filters.hashtag && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              #{filters.hashtag}
              <button
                onClick={() => onFilterChange({ ...filters, hashtag: "" })}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
