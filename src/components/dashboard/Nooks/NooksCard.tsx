import React from "react";
import { Flame, Zap, Eye } from "lucide-react";

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
  };
  onClick: (id: string) => void;
}

export function NookCard({ nook, onClick }: NookCardProps) {
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
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-t-xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-purple-600 transition-colors">
                {nook.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {nook.description}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-4">
              {getTemperatureIcon(nook.temperature)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {nook.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Nook Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {nook.members_count}
            </div>
            <div className="text-xs text-gray-500 font-medium">Anonymous</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {nook.messages_count}
            </div>
            <div className="text-xs text-gray-500 font-medium">Messages</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {nook.timeLeft}
            </div>
            <div className="text-xs text-gray-500 font-medium">Remaining</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
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
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                nook.scope === "global"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {nook.scope === "global" ? "GLOBAL" : "COMPANY"}
            </span>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Active {nook.lastActivity}
          </span>
        </div>
      </div>
    </div>
  );
}
