
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { StatsCardSkeleton } from '../../../Helper/SkeletonLoader';

interface NooksStatsProps {
  activeNooks: number;
  inANookNow: number;
  allTimeNooksCreated: number;
  allTimeNookInteractions: number;
  loading?: boolean;
}

function StatCard({ value, label, color, tooltip }: { value: number | string; label: string; color: string; tooltip: string }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="relative bg-white rounded-xl md:rounded-2xl p-4 md:p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
      <div className={`text-2xl md:text-3xl font-bold ${color} mb-1`}>{value}</div>
      <div className="flex items-center justify-center gap-1">
        <span className="text-xs md:text-sm text-gray-600 font-medium">{label}</span>
        <button
          type="button"
          onClick={() => setShowTip(!showTip)}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={tooltip}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
      {showTip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap z-10 shadow-lg">
          {tooltip}
        </div>
      )}
    </div>
  );
}

export function NooksStats({ activeNooks, inANookNow, allTimeNooksCreated, allTimeNookInteractions, loading }: NooksStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <StatCard value={activeNooks} label="Active Nooks" color="text-purple-600" tooltip="Nooks currently open and active" />
      <StatCard value={inANookNow} label="In a Nook Now" color="text-blue-600" tooltip="Distinct users currently in active nooks" />
      <StatCard value={allTimeNooksCreated} label="All Time Created" color="text-green-600" tooltip="Total nooks ever created" />
      <StatCard value={allTimeNookInteractions} label="All Time Interactions" color="text-indigo-600" tooltip="Total messages, reactions, and member joins" />
    </div>
  );
}
