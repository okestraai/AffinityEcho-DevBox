
import { StatsCardSkeleton } from '../../../Helper/SkeletonLoader';

interface NooksStatsProps {
  activeNooks: number;
  anonymousUsers: number;
  totalMessageParticipants
: number;
  loading?: boolean;
}

export function NooksStats({ activeNooks, anonymousUsers, totalMessageParticipants
, loading }: NooksStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
        <div className="text-3xl font-bold text-purple-600 mb-1">{activeNooks}</div>
        <div className="text-sm text-gray-600 font-medium">Active Nooks</div>
      </div>
      <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
        <div className="text-3xl font-bold text-blue-600 mb-1">{anonymousUsers}</div>
        <div className="text-sm text-gray-600 font-medium">Anonymous Users</div>
      </div>
      <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
        <div className="text-3xl font-bold text-green-600 mb-1">{totalMessageParticipants
}</div>
        <div className="text-sm text-gray-600 font-medium">Total Nook Interactors</div>
      </div>
      <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all">
        <div className="text-3xl font-bold text-indigo-600 mb-1">100%</div>
        <div className="text-sm text-gray-600 font-medium">Anonymous</div>
      </div>
    </div>
  );
}