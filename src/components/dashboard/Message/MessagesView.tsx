import React, { useState, useEffect } from "react";
import {
  Search,
  MessageCircle,
  Shield,
  Eye,
  Target,
  Plus,
  Check,
  X,
  Clock,
  Send,
  Building,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Inbox,
  ArrowLeft,
  Trash2,
} from "lucide-react";

import { useAuth } from "../../../hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import type { UserProfile, Conversation } from "../../../lib/supabase";

// ── Your original MentorshipRequestsView component ──────────────────────────
import {
  GetReceivedDirectMentorshipRequests,
  GetSentDirectMentorshipRequests,
  RespondToDirectMentorshipRequest,
  UpdateMentorshipDirectRequestToRead,
  DeleteDirectMentorshipRequest,
  GeAllRequests,
  type DirectMentorshipRequest,
} from "../../../../api/mentorshipApis";
import { DecryptData } from "../../../../api/EncrytionApis";
import { showToast } from "../../../Helper/ShowToast";
import { UserProfileModal } from "../../Modals/UserProfileModal";
import { MentorshipRequestModal } from "../../Modals/MentorShipModals/MentorshipRequestModal";

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

type ExtendedDirectMentorshipRequest = DirectMentorshipRequest & {
  requestContext?: {
    isSent: boolean;
    isReceived: boolean;
    userRole: string;
    otherUser: any;
    isRead: boolean;
  };
};

interface MentorshipRequestsViewProps {
  onBack: () => void;
}

function MentorshipRequestsView({ onBack }: MentorshipRequestsViewProps) {
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
    all: false,
  });
  const [activeTab, setActiveTab] = useState<"received" | "sent" | "all">(
    "received"
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [hasUnreadRequests, setHasUnreadRequests] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const markRequestsAsRead = async () => {
    if (activeTab !== "received") return;

    if (!hasUnreadRequests) return;

    setMarkingAsRead(true);
    try {
      const response = await UpdateMentorshipDirectRequestToRead("received");

      if (response && (response.success || response.data?.success)) {
        const count = response?.data?.count || response?.count || 0;

        setReceivedRequests((prev) =>
          prev.map((request) => ({
            ...request,
            is_read_by_target: true,
          }))
        );

        setAllRequests((prev) =>
          prev.map((request) => {
            if (request.requestContext?.isReceived) {
              return {
                ...request,
                is_read_by_target: true,
                requestContext: {
                  ...request.requestContext,
                  isRead: true,
                },
              };
            }
            return request;
          })
        );

        setHasUnreadRequests(false);

        if (count > 0) {
          showToast(`Marked ${count} requests as read`, "success");
        }
      }
    } catch (error) {
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
  }, [activeTab, receivedRequests.length, hasUnreadRequests, markingAsRead]);

  const fetchRequests = async () => {
    setLoading((prev) => ({ ...prev, [activeTab]: true }));

    try {
      let response;
      let requests: ExtendedDirectMentorshipRequest[] = [];

      if (activeTab === "received") {
        response = await GetReceivedDirectMentorshipRequests("pending");
        requests = extractRequests(response);
        await decryptProfiles(requests, "received");

        const unreadCount = requests.filter((r) => !r.is_read_by_target).length;
        setHasUnreadRequests(unreadCount > 0);

        setReceivedRequests(requests);
      } else if (activeTab === "sent") {
        response = await GetSentDirectMentorshipRequests("pending");
        requests = extractRequests(response);
        await decryptProfiles(requests, "sent");
        setSentRequests(requests);
      } else if (activeTab === "all") {
        response = await GeAllRequests();
        requests = extractRequests(response);
        await decryptProfiles(requests, "all");
        setAllRequests(requests);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      showToast("Failed to load requests", "error");
    } finally {
      setLoading((prev) => ({ ...prev, [activeTab]: false }));
    }
  };

  const extractRequests = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    return (
      res?.data?.requests ||
      res?.data?.data?.requests ||
      res?.data?.data?.data?.requests ||
      []
    );
  };

  const decryptProfiles = async (
    requests: ExtendedDirectMentorshipRequest[],
    tab: "received" | "sent" | "all"
  ) => {
    const newProfiles: Record<string, DecryptedProfile> = {};

    for (const req of requests) {
      let profile =
        tab === "received"
          ? req.requester
          : tab === "sent"
          ? req.target_user
          : req.requestContext?.otherUser;

      if (!profile?.id) continue;

      try {
        let company = "Unknown Company";
        if (profile.company_encrypted) {
          const res = await DecryptData({
            encryptedData: profile.company_encrypted,
          });
          company =
            res.success && res.data?.decryptedData
              ? res.data.decryptedData
              : company;
        }

        let careerLevel = "";
        if (profile.career_level_encrypted) {
          const res = await DecryptData({
            encryptedData: profile.career_level_encrypted,
          });
          careerLevel =
            res.success && res.data?.decryptedData
              ? res.data.decryptedData
              : "";
        }

        newProfiles[req.id] = {
          id: profile.id,
          username: profile.username || "Unknown User",
          avatar: profile.avatar || "👤",
          job_title: profile.job_title || "Professional",
          company,
          bio: profile.mentor_bio || "",
          skills: profile.mentor_expertise || [],
          location: profile.location || "",
          years_experience: profile.years_experience || 0,
          career_level: careerLevel,
        };
      } catch {}
    }

    setDecryptedProfiles((prev) => ({ ...prev, ...newProfiles }));
  };

  const handleAccept = async (requestId: string) => {
    if (processingId) return;
    setProcessingId(requestId);
    try {
      const res = await RespondToDirectMentorshipRequest(requestId, {
        action: "accept",
      });
      if (res.success) {
        setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
        setAllRequests((prev) => prev.filter((r) => r.id !== requestId));
        setDecryptedProfiles((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
        showToast("Mentorship request accepted!", "success");
      }
    } catch {
      showToast("Failed to accept request", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (processingId) return;
    setProcessingId(requestId);
    try {
      const res = await RespondToDirectMentorshipRequest(requestId, {
        action: "decline",
      });
      if (res.success) {
        setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
        setAllRequests((prev) => prev.filter((r) => r.id !== requestId));
        setDecryptedProfiles((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
        showToast("Request declined", "success");
      }
    } catch {
      showToast("Failed to decline request", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (processingId || !window.confirm("Cancel this request?")) return;
    setProcessingId(requestId);
    try {
      const res = await DeleteDirectMentorshipRequest(requestId);
      if (res.success) {
        setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
        setAllRequests((prev) => prev.filter((r) => r.id !== requestId));
        setDecryptedProfiles((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
        showToast("Request cancelled", "success");
      }
    } catch {
      showToast("Failed to cancel request", "error");
    } finally {
      setProcessingId(null);
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
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRequestTypeText = (
    request: ExtendedDirectMentorshipRequest,
    tab: "received" | "sent" | "all"
  ) => {
    const isMentor = request.request_type === "mentor_request";

    if (tab === "received") {
      return isMentor ? "Wants you as their mentor" : "Offering to mentor you";
    }
    if (tab === "sent") {
      return isMentor
        ? "You requested them as mentor"
        : "You offered to mentor them";
    }
    if (request.requestContext?.isSent) {
      return isMentor
        ? "You requested them as mentor"
        : "You offered to mentor them";
    }
    if (request.requestContext?.isReceived) {
      return isMentor ? "Wants you as their mentor" : "Offering to mentor you";
    }
    return isMentor ? "Mentor Request" : "Mentee Request";
  };

  const requestsToShow =
    activeTab === "received"
      ? receivedRequests
      : activeTab === "sent"
      ? sentRequests
      : allRequests;

  const isLoading = loading[activeTab];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
    
        <div className="flex gap-2 items-center">
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => setActiveTab("received")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "received"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Inbox className="w-4 h-4" />
              Received
              {receivedRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
                  {receivedRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "sent"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Sent
              {sentRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
                  {sentRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "all"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              All
              {allRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
                  {allRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === "all"
                ? "No requests found"
                : "No pending requests"}
            </h3>
            <p className="text-gray-500">
              {activeTab === "received"
                ? "You don't have any pending mentorship requests at the moment."
                : activeTab === "sent"
                ? "You haven't sent any mentorship requests yet."
                : "No mentorship activity yet."}
            </p>
          </div>
        ) : (
          requestsToShow.map((request) => {
            const profile = decryptedProfiles[request.id] || {
              id: request.id,
              username: "Loading...",
              avatar: "👤",
              job_title: "Professional",
              company: "Loading...",
              bio: "",
              skills: [],
              location: "",
              years_experience: 0,
            };

            const isUnread =
              activeTab === "received" && !request.is_read_by_target;
            const isSentRequest =
              activeTab === "sent" ||
              (activeTab === "all" && request.requestContext?.isSent);

            return (
              <div
                key={request.id}
                className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                  isUnread ? "border-l-4 border-l-orange-500" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{profile.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {profile.username}
                          </h3>
                          {isUnread && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              New
                            </span>
                          )}
                          {activeTab === "all" && request.status && (
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeColor(
                                request.status
                              )}`}
                            >
                              {request.status.charAt(0).toUpperCase() +
                                request.status.slice(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {profile.job_title} at {profile.company}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {getTimeAgo(request.created_at)}
                        </span>
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
                      {activeTab === "received" &&
                      request.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleAccept(request.id)}
                            disabled={processingId === request.id}
                            className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {processingId === request.id ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-5 h-5" /> Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDecline(request.id)}
                            disabled={processingId === request.id}
                            className="flex-1 py-2.5 px-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {processingId === request.id ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <X className="w-5 h-5" /> Decline
                              </>
                            )}
                          </button>
                        </>
                      ) : activeTab === "sent" &&
                        request.status === "pending" ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Pending
                          </div>
                          <button
                            onClick={() => handleCancel(request.id)}
                            disabled={processingId === request.id}
                            className="py-2 px-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 disabled:opacity-50 flex items-center gap-2"
                          >
                            {processingId === request.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" /> Cancel
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="w-full text-center text-sm text-gray-600 py-2">
                          {/* {request.status?.charAt(0).toUpperCase() +
                            request.status?.slice(1) || "Processed"} */}
                        </div>
                      )}
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

// ── Main MessagesView Component ─────────────────────────────────────────────

export function MessagesView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showMentorshipRequest, setShowMentorshipRequest] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "mentorship">(
    "messages"
  );

  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (conversationId && user?.id) {
      fetchConversationDetails(conversationId);
    } else {
      setCurrentConversation(null);
      setOtherUserProfile(null);
    }
  }, [searchParams, user?.id]);

  const fetchConversationDetails = async (conversationId: string) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (convErr) throw convErr;
      if (!conv) return;

      setCurrentConversation(conv);

      const otherId =
        conv.participant1_id === user.id
          ? conv.participant2_id
          : conv.participant1_id;

      const { data: profile, error: profileErr } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", otherId)
        .single();

      if (profileErr) throw profileErr;
      setOtherUserProfile(profile);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    if (user?.id === userId) {
      navigate("/dashboard/profile");
    } else {
      setSelectedUserId(userId);
      setShowUserProfile(true);
    }
  };

  const handleChatUser = (userId: string) => {
    setShowUserProfile(false);
    setSelectedChat(userId);
  };

  const conversations = [
    {
      id: "1",
      userId: "mentor1",
      user: "Jennifer Wu",
      avatar: "☁️",
      lastMessage: "Happy to help you with cloud architecture!",
      timeAgo: "5m",
      unread: 2,
      identityRevealed: true,
      realName: "Jennifer Wu",
      isMentorship: true,
      mentorshipRole: "mentor",
    },
    {
      id: "2",
      userId: "mentee1",
      user: "Sarah Chen",
      avatar: "👩‍💻",
      lastMessage: "Thank you for the advice on system design!",
      timeAgo: "1h",
      unread: 0,
      identityRevealed: true,
      realName: "Sarah Chen",
      isMentorship: true,
      mentorshipRole: "mentee",
    },
    {
      id: "3",
      userId: "user2",
      user: "ThoughtfulLeader92",
      avatar: "🌟",
      lastMessage: "That sounds like a great opportunity!",
      timeAgo: "2h",
      unread: 0,
      identityRevealed: false,
    },
  ];

  if (currentConversation && otherUserProfile && user?.id) {
    const isMentorshipConversation =
      currentConversation.context_type === "mentorship";

    return (
      <div className="max-w-4xl mx-auto flex flex-col h-screen">
        <header className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => {
                setCurrentConversation(null);
                setOtherUserProfile(null);
                navigate("/dashboard/messages");
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              {otherUserProfile.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {otherUserProfile.username}
                </h3>
                {isMentorshipConversation && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    Mentorship
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {otherUserProfile.company} • {otherUserProfile.job_title}
              </p>
            </div>
          </div>
          {isMentorshipConversation && (
            <button
              onClick={() => navigate("/dashboard/mentorship")}
              className="w-full px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              View Mentorship Profile
            </button>
          )}
        </header>

        <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Conversation started</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(currentConversation.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={() =>
                alert("Message functionality will be implemented soon!")
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedChat) {
    const chat = conversations.find((c) => c.id === selectedChat);
    if (!chat) return null;

    return (
      <div className="max-w-md mx-auto flex flex-col h-screen">
        <header className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setSelectedChat(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </button>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {chat.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {chat.identityRevealed ? chat.realName : chat.user}
                </h3>
                {chat.isMentorship && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    Mentorship
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {chat.identityRevealed ? "Identity revealed" : "Anonymous"}
              </p>
            </div>
            {!chat.identityRevealed && (
              <button
                onClick={() => {
                  if (confirm("Request to reveal identities with this user?")) {
                    alert(
                      "Identity reveal request sent! You will be notified when they respond."
                    );
                  }
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Request Identity Reveal"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
          </div>
          {chat.isMentorship && (
            <button
              onClick={() => navigate("/dashboard/mentorship")}
              className="w-full px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              View Mentorship Profile
            </button>
          )}
        </header>

        <div className="flex-1 bg-gray-50 p-4 space-y-3 overflow-y-auto">
          <div className="text-right">
            <div className="inline-block bg-blue-600 text-white px-3 py-2 rounded-2xl rounded-br-md max-w-xs">
              <p className="text-sm">
                Hi! I saw your post about promotion strategies. Would love to
                chat!
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">2h</p>
          </div>

          <div className="text-left">
            <div className="inline-block bg-white px-3 py-2 rounded-2xl rounded-bl-md max-w-xs border border-gray-200">
              <p className="text-sm">{chat.lastMessage}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{chat.timeAgo}</p>
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={() => alert("Message sent!")}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Messages & Requests
            </h1>
            <p className="text-gray-500">
              Manage your conversations and mentorship requests
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === "messages"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>Messages</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("mentorship")}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === "mentorship"
                ? "bg-orange-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Target className="w-4 h-4" />
              <span>Mentorship</span>
            </div>
          </button>
        </div>
      </header>

      {activeTab === "messages" ? (
        <div>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => alert("New conversation feature coming soon!")}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          <div className="grid gap-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedChat(conv.id)}
                className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                      {conv.avatar}
                    </div>
                    {conv.identityRevealed && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
                        <Eye className="w-2 h-2 text-white m-auto" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-gray-900 truncate">
                          {conv.identityRevealed ? conv.realName : conv.user}
                        </span>
                        {conv.isMentorship && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex-shrink-0">
                            Mentorship
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {conv.timeAgo}
                        </span>
                        {conv.unread > 0 && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">
                              {conv.unread}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500 truncate flex-1">
                        {conv.lastMessage}
                      </p>
                      {!conv.identityRevealed && (
                        <Shield className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {conversations.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium text-gray-500 mb-1">
                No conversations yet
              </h3>
              <p className="text-sm text-gray-400">
                Start chatting with mentors and mentees you've connected with
              </p>
            </div>
          )}
        </div>
      ) : (
        <MentorshipRequestsView onBack={() => setActiveTab("messages")} />
      )}

      <MentorshipRequestModal
        isOpen={showMentorshipRequest}
        onClose={() => setShowMentorshipRequest(false)}
      />

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ""}
        onChat={handleChatUser}
      />
    </div>
  );
}
