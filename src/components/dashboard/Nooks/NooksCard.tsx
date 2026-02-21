import React from "react";
import { Flame, Zap, Eye, Bookmark } from "lucide-react";

interface NookCardProps {
  nook: {
    id: string;
    title: string;
    description: string;
    members_count: number;
    messages_count: number;
    timeLeft: string;
    lastActivity: string;
    urgency: "high" | "medium" | "low";
    scope: "company" | "global";
    temperature: "hot" | "warm" | "cool";
    hashtags: string[];
    user_has_bookmarked?: boolean;
  };
  onClick: (id: string) => void;
  onBookmark?: (id: string, e: React.MouseEvent) => void;
}

export function NookCard({ nook, onClick, onBookmark }: NookCardProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "from-red-500 to-orange-500";
      case "medium":
        return "from-yellow-500 to-orange-500";
      case "low":
        return "from-blue-500 to-indigo-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };


  const getTemperatureIcon = (temperature: string) => {
    switch (temperature) {
      case "hot":
        return <Flame className="w-4 h-4 text-red-500" />;
      case "warm":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "cool":
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div
      onClick={() => onClick(nook.id)}
      className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      {/* Nook Header */}
      <div className={`bg-gradient-to-r ${getUrgencyColor(nook.urgency)} p-1`}>
        <div className="bg-white/95 backdrop-blur-sm p-3 md:p-4 rounded-t-xl">
          <div className="flex items-start justify-between mb-2 md:mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1 group-hover:text-purple-600 transition-colors truncate">
                {nook.title}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed line-clamp-2">
                {nook.description}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-3 md:ml-4">
              {getTemperatureIcon(nook.temperature)}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
            {nook.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-purple-100 text-purple-700 px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Nook Stats */}
      <div className="p-3 md:p-4">
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-4">
          <div className="text-center">
            <div className="text-base md:text-lg font-bold text-purple-600">
              {nook.members_count}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500 font-medium">Anonymous</div>
          </div>
          <div className="text-center">
            <div className="text-base md:text-lg font-bold text-blue-600">
              {nook.messages_count}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500 font-medium">Messages</div>
          </div>
          <div className="text-center">
            <div className="text-base md:text-lg font-bold text-green-600">
              {nook.timeLeft}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500 font-medium">Remaining</div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
            <span
              className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${
                nook.urgency === "high"
                  ? "bg-red-100 text-red-700"
                  : nook.urgency === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {nook.urgency.toUpperCase()}
            </span>
            <span
              className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${
                nook.scope === "global"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {nook.scope === "global" ? "GLOBAL" : "COMPANY"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <span className="text-[10px] md:text-xs text-gray-400 font-medium hidden sm:inline">
              Active {nook.lastActivity}
            </span>
            {onBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(nook.id, e);
                }}
                className={`p-2.5 md:p-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                  nook.user_has_bookmarked
                    ? "text-amber-500 bg-amber-50"
                    : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                }`}
                title="Bookmark"
              >
                <Bookmark className={`w-4 h-4 transition-transform duration-200 ${nook.user_has_bookmarked ? "fill-amber-500 animate-reaction-pop" : ""}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
