// NewChatModal.tsx
import React, { useState, useEffect } from "react";
import { resolveDisplayName } from "../../../utils/nameUtils";
import {
  Search,
  X,
  UserPlus,
  MessageCircle,
  Filter,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { GetConnectableUsers, GetUserSuggestions } from "../../../../api/messaging";
import { CreateConversation } from "../../../../api/messaging";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export function NewChatModal({
  isOpen,
  onClose,
  onConversationCreated,
}: NewChatModalProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"all" | "mentor" | "mentee">(
    "all",
  );
  const [filters, setFilters] = useState({
    excludeExisting: true,
    limit: 20,
    offset: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
      if (search) {
        loadUsers();
      } else {
        setUsers([]);
      }
    }
  }, [isOpen, search, selectedRole]);

  const loadSuggestions = async () => {
    try {
      const data = await GetUserSuggestions(5);
      setSuggestions(data?.suggestions || []);
    } catch {
      // Silent failure for suggestions
    }
  };

  const loadUsers = async () => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const data = await GetConnectableUsers({
        search: search.trim(),
        limit: filters.limit,
        offset: filters.offset,
        exclude_existing: filters.excludeExisting,
        role: selectedRole === "all" ? undefined : selectedRole,
      });
      setUsers(data?.users || []);
    } catch {
      // Silent failure for user search
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (userId: string) => {
    try {
      const data = await CreateConversation({
        other_user_id: userId,
        context_type: "regular",
        initial_message: "",
      });

      if (data?.id) {
        onConversationCreated(data.id);
        onClose();
      }
    } catch {
      // Silent failure for conversation creation
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md md:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Chat</h2>
              <p className="text-sm text-gray-500">
                Find and connect with users
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username, job title, or skills..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedRole("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedRole === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setSelectedRole("mentor")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedRole === "mentor"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Mentors
            </button>
            <button
              onClick={() => setSelectedRole("mentee")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedRole === "mentee"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Mentees
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!search && suggestions.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Suggestions for you
                </h3>
                <span className="text-xs text-gray-500">
                  Based on your profile
                </span>
              </div>
              <div className="space-y-3">
                {suggestions.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                    onClick={() => handleStartChat(user.id)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-xl">
                      {user.avatar || "👤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {resolveDisplayName(user.display_name, user.username)}
                        </h4>
                        {user.is_active_mentor && !user.is_active_mentee && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            Mentor
                          </span>
                        )}
                        {user.is_active_mentee && !user.is_active_mentor && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Mentee
                          </span>
                        )}
                        {user.is_active_mentor && user.is_active_mentee && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Both
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {user.job_title || "Professional"}
                        {user.company_encrypted &&
                          ` • ${user.company_encrypted}`}
                      </p>
                      {user.skills && user.skills.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {user.skills.slice(0, 3).map((skill: string) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 3 && (
                            <span className="px-2 py-0.5 text-gray-500 text-xs">
                              +{user.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {search && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Search Results
                </h3>
                <span className="text-xs text-gray-500">
                  {users.length} users found
                </span>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-gray-500">Searching users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-1">
                    No users found
                  </h4>
                  <p className="text-sm text-gray-500">
                    Try a different search term or adjust your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-gray-200"
                      onClick={() => handleStartChat(user.id)}
                    >
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-2xl">
                          {user.avatar || "👤"}
                        </div>
                        {user.mutual_connections > 0 && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-xs text-white font-bold">
                              {user.mutual_connections}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {resolveDisplayName(user.display_name, user.username)}
                          </h4>
                          {user.is_active_mentor && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              Mentor
                            </span>
                          )}
                          {user.is_active_mentee && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Mentee
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 truncate">
                          {user.job_title || "Professional"}
                          {user.company_encrypted &&
                            ` at ${user.company_encrypted}`}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          {user.skills?.slice(0, 2).map((skill: string) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {user.skills && user.skills.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{user.skills.length - 2} more
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-500">
                              Active {getTimeAgo(user.last_active_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(user.id);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 min-h-[44px]"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!search && suggestions.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <h4 className="font-medium text-gray-900 mb-1">
                Start searching
              </h4>
              <p className="text-sm text-gray-500">
                Enter a name, job title, or skills to find users to connect with
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function for time ago display
function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return "recently";
  }
}
