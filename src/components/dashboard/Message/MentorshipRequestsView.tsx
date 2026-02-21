import React, { useState, useEffect } from "react";
import { resolveDisplayName } from "../../../utils/nameUtils";
import {
  Clock,
  UserPlus,
  Check,
  X,
  Trash2,
  Loader,
  Inbox,
  ArrowLeft,
  Star,
  MapPin,
  Briefcase,
  Eye,
  ListTodo, // Added for All tab icon
} from "lucide-react";
import {
  GetReceivedDirectMentorshipRequests,
  GetSentDirectMentorshipRequests,
  RespondToDirectMentorshipRequest,
  UpdateMentorshipDirectRequestToRead,
  DeleteDirectMentorshipRequest,
  GeAllRequests, // Added for All tab
  type DirectMentorshipRequest,
} from "../../../../api/mentorshipApis";
import { DecryptData } from "../../../../api/EncrytionApis";
import { showToast } from "../../../Helper/ShowToast";

interface MentorshipRequestsViewProps {
  onBack: () => void;
}

interface DecryptedProfile {
  id: string;
  username: string;
  avatar: string;
  job_title: string;
  company: string;
  bio: string;
  skills: string[];
  location: string;
  years_experience: number;
  career_level?: string;
}

// Extended type to include requestContext from API response
type ExtendedDirectMentorshipRequest = DirectMentorshipRequest & {
  requestContext?: {
    isSent: boolean;
    isReceived: boolean;
    userRole: string;
    otherUser: any;
    isRead: boolean;
  };
};

export function MentorshipRequestsView({
  onBack,
}: MentorshipRequestsViewProps) {
  const [receivedRequests, setReceivedRequests] = useState<
    ExtendedDirectMentorshipRequest[]
  >([]);
  const [sentRequests, setSentRequests] = useState<
    ExtendedDirectMentorshipRequest[]
  >([]);
  const [allRequests, setAllRequests] = useState<
    ExtendedDirectMentorshipRequest[]
  >([]);
  const [decryptedProfiles, setDecryptedProfiles] = useState<
    Record<string, DecryptedProfile>
  >({});
  const [loading, setLoading] = useState({
    received: false,
    sent: false,
    all: false
  });
  const [activeTab, setActiveTab] = useState<"received" | "sent" | "all">("received");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [hasUnreadRequests, setHasUnreadRequests] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  // Mark requests as read function - FIXED VERSION
  const markRequestsAsRead = async () => {
    if (activeTab !== "received") return;

    if (!hasUnreadRequests) return;

    setMarkingAsRead(true);
    try {
      const response = await UpdateMentorshipDirectRequestToRead("received");

      const count = response?.count || 0;

      setReceivedRequests((prev) =>
        prev.map((request) => ({
          ...request,
          is_read_by_target: true,
        }))
      );

      // Also update allRequests if they contain the same requests
      setAllRequests((prev) =>
        prev.map((request) => {
          // Only mark as read if it's a received request
          if (request.requestContext?.isReceived) {
            return {
              ...request,
              is_read_by_target: true,
              requestContext: {
                ...request.requestContext,
                isRead: true
              }
            };
          }
          return request;
        })
      );

      setHasUnreadRequests(false);

      if (count > 0) {
        showToast(`Marked ${count} requests as read`, "success");
      }
    } catch {
      showToast("Failed to mark requests as read", "error");
    } finally {
      setMarkingAsRead(false);
    }
  };

  useEffect(() => {
    if (
      activeTab === "received" &&
      receivedRequests.length > 0 &&
      hasUnreadRequests &&
      !markingAsRead
    ) {
      markRequestsAsRead();
    }
  }, [activeTab, receivedRequests.length, hasUnreadRequests]);

  const fetchRequests = async () => {
    // Set loading state for active tab
    setLoading(prev => ({ ...prev, [activeTab]: true }));
    
    try {
      if (activeTab === "received") {
        const response = await GetReceivedDirectMentorshipRequests("pending");

        let requests: ExtendedDirectMentorshipRequest[] = [];

        if (response?.requests) {
          requests = response.requests;
        } else if (Array.isArray(response)) {
          requests = response;
        }

        setReceivedRequests(requests);

        const unreadCount = requests.filter(
          (request) => !request.is_read_by_target
        ).length;
        setHasUnreadRequests(unreadCount > 0);

        await decryptProfiles(requests, "received");

      } else if (activeTab === "sent") {
        const response = await GetSentDirectMentorshipRequests("pending");

        let requests: ExtendedDirectMentorshipRequest[] = [];

        if (response?.requests) {
          requests = response.requests;
        } else if (Array.isArray(response)) {
          requests = response;
        }

        setSentRequests(requests);

        await decryptProfiles(requests, "sent");
        
      } else if (activeTab === "all") {
        const response = await GeAllRequests();

        let requests: ExtendedDirectMentorshipRequest[] = [];

        if (response?.requests) {
          requests = response.requests;
        } else if (Array.isArray(response)) {
          requests = response;
        }

        setAllRequests(requests);

        // Decrypt profiles for all requests
        await decryptProfiles(requests, "all");
      }
    } catch {
      showToast("Failed to load requests", "error");
      
      // Reset appropriate state based on active tab
      if (activeTab === "received") {
        setReceivedRequests([]);
        setHasUnreadRequests(false);
      } else if (activeTab === "sent") {
        setSentRequests([]);
      } else if (activeTab === "all") {
        setAllRequests([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, [activeTab]: false }));
    }
  };

  const decryptProfiles = async (
    requests: ExtendedDirectMentorshipRequest[],
    tab: "received" | "sent" | "all"
  ) => {
    const newDecryptedProfiles: Record<string, DecryptedProfile> = {};

    for (const request of requests) {
      const requestId = request.id;
      
      // Determine which profile to show based on tab
      let profile;
      if (tab === "received") {
        profile = request.requester;
      } else if (tab === "sent") {
        profile = request.target_user;
      } else if (tab === "all") {
        // For "All" tab, show the other user (not the current user)
        if (request.requestContext?.otherUser) {
          profile = request.requestContext.otherUser;
        } else {
          // Fallback logic if requestContext is not available
          profile = request.requester || request.target_user;
        }
      }

      if (profile) {
        try {
          // Decrypt company if encrypted
          let decryptedCompany = "Unknown Company";
          if (profile.company_encrypted) {
            const companyResult = await DecryptData({
              encryptedData: profile.company_encrypted,
            });
            if (companyResult?.decryptedData) {
              decryptedCompany = companyResult.decryptedData;
            }
          }

          // Decrypt career level if available
          let decryptedCareerLevel = "";
          if (profile.career_level_encrypted) {
            const careerResult = await DecryptData({
              encryptedData: profile.career_level_encrypted,
            });
            if (careerResult?.decryptedData) {
              decryptedCareerLevel = careerResult.decryptedData;
            }
          }

          newDecryptedProfiles[requestId] = {
            id: profile.id,
            username: profile.username || "Unknown User",
            display_name: resolveDisplayName(profile.display_name, profile.username) || "Unknown User",
            avatar: profile.avatar || "👤",
            job_title: profile.job_title || "Professional",
            company: decryptedCompany,
            bio: profile.mentor_bio || "",
            skills: profile.mentor_expertise || [],
            location: profile.location || "",
            years_experience: profile.years_experience || 0,
            career_level: decryptedCareerLevel,
          };
        } catch {
          newDecryptedProfiles[requestId] = {
            id: profile.id,
            username: profile.username || "Unknown User",
            display_name: resolveDisplayName(profile.display_name, profile.username) || "Unknown User",
            avatar: profile.avatar || "👤",
            job_title: profile.job_title || "Professional",
            company: "Company information hidden",
            bio: profile.mentor_bio || "",
            skills: profile.mentor_expertise || [],
            location: profile.location || "",
            years_experience: profile.years_experience || 0,
          };
        }
      }
    }

    setDecryptedProfiles((prev) => ({ ...prev, ...newDecryptedProfiles }));
  };

  const handleAccept = async (requestId: string) => {
    if (processingId) return;

    setProcessingId(requestId);
    try {
      await RespondToDirectMentorshipRequest(requestId, {
        action: "accept",
      });

      setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
      setAllRequests((prev) => prev.filter((r) => r.id !== requestId));
      setDecryptedProfiles((prev) => {
        const newProfiles = { ...prev };
        delete newProfiles[requestId];
        return newProfiles;
      });
      showToast("Mentorship request accepted!", "success");
    } catch {
      showToast("Failed to accept request. Please try again.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (processingId) return;

    setProcessingId(requestId);
    try {
      await RespondToDirectMentorshipRequest(requestId, {
        action: "decline",
      });

      setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
      setAllRequests((prev) => prev.filter((r) => r.id !== requestId));
      setDecryptedProfiles((prev) => {
        const newProfiles = { ...prev };
        delete newProfiles[requestId];
        return newProfiles;
      });
      showToast("Request declined", "success");
    } catch {
      showToast("Failed to decline request. Please try again.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (processingId) return;

    if (!confirm("Are you sure you want to cancel this request?")) return;

    setProcessingId(requestId);
    try {
      await DeleteDirectMentorshipRequest(requestId);

      setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
      setAllRequests((prev) => prev.filter((r) => r.id !== requestId));
      setDecryptedProfiles((prev) => {
        const newProfiles = { ...prev };
        delete newProfiles[requestId];
        return newProfiles;
      });
      showToast("Request cancelled", "success");
    } catch {
      showToast("Failed to cancel request. Please try again.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAsRead || activeTab !== "received") return;

    setMarkingAsRead(true);
    try {
      const response = await UpdateMentorshipDirectRequestToRead("received");

      const count = response?.count || 0;
      showToast(`Marked ${count} requests as read`, "success");

      setReceivedRequests((prev) =>
        prev.map((request) => ({
          ...request,
          is_read_by_target: true,
        }))
      );

      // Also update allRequests
      setAllRequests((prev) =>
        prev.map((request) => {
          if (request.requestContext?.isReceived) {
            return {
              ...request,
              is_read_by_target: true,
              requestContext: {
                ...request.requestContext,
                isRead: true
              }
            };
          }
          return request;
        })
      );

      setHasUnreadRequests(false);
    } catch {
      showToast("Failed to mark requests as read", "error");
    } finally {
      setMarkingAsRead(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "declined":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRequestTypeText = (request: ExtendedDirectMentorshipRequest, tab: "received" | "sent" | "all") => {
    if (tab === "received") {
      return request.request_type === "mentor_request"
        ? "Wants you as their mentor"
        : "Offering to mentor you";
    } else if (tab === "sent") {
      return request.request_type === "mentor_request"
        ? "You requested them as your mentor"
        : "You offered to mentor them";
    } else if (tab === "all") {
      // For "All" tab, use requestContext to determine direction
      if (request.requestContext?.isSent) {
        return request.request_type === "mentor_request"
          ? "You requested them as your mentor"
          : "You offered to mentor them";
      } else if (request.requestContext?.isReceived) {
        return request.request_type === "mentor_request"
          ? "Wants you as their mentor"
          : "Offering to mentor you";
      }
      return request.request_type === "mentor_request"
        ? "Mentor Request"
        : "Mentee Request";
    }
    return "";
  };

  const getCurrentTabRequests = () => {
    switch (activeTab) {
      case "received":
        return receivedRequests;
      case "sent":
        return sentRequests;
      case "all":
        return allRequests;
      default:
        return [];
    }
  };

  const isCurrentTabLoading = () => {
    return loading[activeTab];
  };

  const requestsToShow = getCurrentTabRequests();
  const isLoading = isCurrentTabLoading();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
              <Inbox className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mentorship Requests
              </h1>
              <p className="text-sm text-gray-500">
                Manage incoming and outgoing requests
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => setActiveTab("received")}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "received"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Inbox className="w-4 h-4" />
              Received
              {receivedRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs sm:text-sm">
                  {receivedRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "sent"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Sent
              {sentRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs sm:text-sm">
                  {sentRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "all"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ListTodo className="w-4 h-4" />
              All
              {allRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs sm:text-sm">
                  {allRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Mark All as Read button - only show for received tab */}
          {activeTab === "received" &&
            receivedRequests.length > 0 &&
            hasUnreadRequests && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAsRead}
                className="py-3 px-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markingAsRead ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Mark all as read</span>
                  </>
                )}
              </button>
            )}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : requestsToShow.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
              {activeTab === "all" ? "No requests found" : "No pending requests"}
            </h3>
            <p className="text-gray-500">
              {activeTab === "received"
                ? "You don't have any pending mentorship requests at the moment."
                : activeTab === "sent"
                ? "You haven't sent any mentorship requests yet. Visit the 'Find' tab to discover mentors or mentees."
                : "You don't have any mentorship requests yet. Visit the 'Find' tab to discover mentors or mentees."}
            </p>
          </div>
        ) : (
          requestsToShow.map((request) => {
            const decryptedProfile = decryptedProfiles[request.id];

            const profile = decryptedProfile || {
              id: request.id,
              username: "Loading...",
              avatar: "👤",
              job_title: "Professional",
              company: "Loading company...",
              bio: "",
              skills: [],
              location: "",
              years_experience: 0,
            };

            const isUnread = 
              activeTab === "received" && !request.is_read_by_target;
            
            const isSentRequest = activeTab === "sent" || 
              (activeTab === "all" && request.requestContext?.isSent);

            return (
              <div
                key={request.id}
                className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow ${
                  isUnread ? "border-l-4 border-l-orange-500" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl md:text-4xl">{profile.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-base md:text-lg">
                            {resolveDisplayName(profile.display_name, profile.username)}
                          </h3>
                          {isUnread && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              New
                            </span>
                          )}
                          {/* Status badge for All tab */}
                          {activeTab === "all" && request.status && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeColor(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {profile.job_title} at {profile.company}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          {profile.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {profile.location}
                            </div>
                          )}
                          {profile.years_experience > 0 && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {profile.years_experience} years experience
                            </div>
                          )}
                          {profile.career_level && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {profile.career_level}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {getTimeAgo(request.created_at)}
                        </span>
                        {activeTab === "all" && request.responded_at && (
                          <span className="text-xs text-gray-400">
                            Resolved {getTimeAgo(request.responded_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-3">
                        <UserPlus className="w-4 h-4" />
                        {getRequestTypeText(request, activeTab)}
                      </div>

                      {profile.bio && (
                        <p className="text-sm text-gray-600 mb-3">
                          {profile.bio}
                        </p>
                      )}

                      {request.message && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-orange-600">
                          <p className="text-sm text-gray-700 italic">
                            "{request.message}"
                          </p>
                        </div>
                      )}

                      {profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {profile.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {activeTab === "received" && request.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleAccept(request.id)}
                            disabled={processingId === request.id}
                            className="flex-1 py-2.5 px-3 md:px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === request.id ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-5 h-5" />
                                Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDecline(request.id)}
                            disabled={processingId === request.id}
                            className="flex-1 py-2.5 px-3 md:px-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === request.id ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <X className="w-5 h-5" />
                                Decline
                              </>
                            )}
                          </button>
                        </>
                      ) : activeTab === "sent" && request.status === "pending" ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Pending
                          </div>
                          <button
                            onClick={() => handleCancel(request.id)}
                            disabled={processingId === request.id}
                            className="py-2 px-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === request.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Cancel Request
                              </>
                            )}
                          </button>
                        </div>
                      ) : activeTab === "all" ? (
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(request.status)}`}>
                              {request.status === "pending" && (
                                <Clock className="w-4 h-4" />
                              )}
                              {request.status === "accepted" && (
                                <Check className="w-4 h-4" />
                              )}
                              {request.status === "declined" && (
                                <X className="w-4 h-4" />
                              )}
                              {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                            </div>
                            {isSentRequest && request.status === "pending" && (
                              <button
                                onClick={() => handleCancel(request.id)}
                                disabled={processingId === request.id}
                                className="py-2 px-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                {processingId === request.id ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="w-3 h-3" />
                                    Cancel
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          {request.response_message && (
                            <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                              <span className="font-medium">Response:</span> {request.response_message}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}