// components/Modals/MentorShipModals/MentorshipUserProfileModal.tsx
import { useState, useEffect } from "react";
import { resolveDisplayName } from "../../../utils/nameUtils";
import { useNavigate } from "react-router-dom";
import {
  X,
  Star,
  MapPin,
  Briefcase,
  Award,
  MessageCircle,
  Clock,
  Users,
  Target,
  Globe,
  TrendingUp,
  BookOpen,
  UserPlus,
  UserCheck,
  Loader,
  Info,
  Send,
  AlertCircle,
  Check,
  GraduationCap,
  Zap,
  Heart,
} from "lucide-react";
import { showToast } from "../../../Helper/ShowToast";
import {
  FollowUser,
  UnfollowUser,
  GetFollowStatus,
  CreateDirectMentorShipRequest,
  CheckMentorshipRequestHasBeenSent,
} from "../../../../api/mentorshipApis";
import { DirectMentorshipRequestPayload } from "../../../../api/mentorshipApis";
import { MentorshipUserProfile } from "../../../types/mentorship";

interface MentorshipUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MentorshipUserProfile | null;
  onChat?: (userId: string) => void;
  onRequestMentorship?: (userId: string, type: "mentor" | "mentee") => void;
  currentUserId?: string;
  context?: "find-mentorship" | "mentorship-view"; // Added context prop
}

interface RequestStatusData {
  hasSentRequest: boolean;
  hasReceivedRequest: boolean;
  hasPendingRequest: boolean;
  hasActiveRequest: boolean;
  latestStatus: "pending" | "accepted" | "declined" | "cancelled" | null;
  direction?: "sent" | "received" | null;
  latestRequest?: {
    id: string;
    requestType: string;
    status: string;
    createdAt: string;
    direction?: string;
  };
}

export function MentorshipUserProfileModal({
  isOpen,
  onClose,
  profile,
  onChat,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRequestMentorship: _onRequestMentorship,
  currentUserId,
  context = "mentorship-view", // Default context
}: MentorshipUserProfileModalProps) {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestType, setRequestType] = useState<"mentor" | "mentee">("mentor");
  const [requestStatus, setRequestStatus] = useState<RequestStatusData | null>(
    null
  );
  const [checkingRequestStatus, setCheckingRequestStatus] = useState(false);
  const [requestButtonDisabled, setRequestButtonDisabled] = useState(true);
  const [profileTab, setProfileTab] = useState<"mentor" | "mentee">("mentor");

  const hasMentorProfile = !!(profile?.mentorProfile);
  const hasMenteeProfile = !!(profile?.menteeProfile);
  const hasBothProfiles = hasMentorProfile && hasMenteeProfile;

  useEffect(() => {
    if (isOpen && profile && currentUserId) {
      fetchFollowStatus();
      checkExistingRequest();
      setShowRequestForm(false);
      setRequestMessage("");
      setRequestButtonDisabled(true);
      // Set initial tab based on available profiles
      if (hasMentorProfile) {
        setProfileTab("mentor");
      } else if (hasMenteeProfile) {
        setProfileTab("mentee");
      }
    } else {
      setRequestStatus(null);
    }
  }, [isOpen, profile?.id, currentUserId]);

  useEffect(() => {
    if (!checkingRequestStatus && requestStatus !== null) {
      setRequestButtonDisabled(false);
    }
  }, [checkingRequestStatus, requestStatus]);

  const fetchFollowStatus = async () => {
    if (!profile?.id) return;

    try {
      const response = await GetFollowStatus(profile.id);
      setIsFollowing(response?.isFollowing || false);
      setIsFollowedBy(response?.isFollowedBy || false);
    } catch (error) {
      console.error("Error fetching follow status:", error);
    }
  };

  const checkExistingRequest = async () => {
    if (!profile?.id || !currentUserId) return;

    setCheckingRequestStatus(true);
    setRequestButtonDisabled(true);
    try {
      const [mentorResponse, menteeResponse] = await Promise.all([
        CheckMentorshipRequestHasBeenSent(profile.id, "mentor_request"),
        CheckMentorshipRequestHasBeenSent(profile.id, "mentee_request"),
      ]);

      const mentorData = mentorResponse;
      const menteeData = menteeResponse;

      // Check sent OR received in either type
      const hasSent = mentorData?.hasSentRequest || menteeData?.hasSentRequest;
      const hasReceived = mentorData?.hasReceivedRequest || menteeData?.hasReceivedRequest;

      // Inner data contains hasPendingRequest, hasActiveRequest, latestStatus, latestRequest
      const mentorInner = mentorData || {};
      const menteeInner = menteeData || {};

      const hasPending = mentorInner?.hasPendingRequest || menteeInner?.hasPendingRequest;
      const hasActive = mentorInner?.hasActiveRequest || menteeInner?.hasActiveRequest;

      let latestStatus: RequestStatusData["latestStatus"] = null;
      if (mentorInner?.latestStatus) latestStatus = mentorInner.latestStatus;
      if (menteeInner?.latestStatus) latestStatus = menteeInner.latestStatus;

      // Pick latest request from either type
      let latestRequest = null;
      const mentorReq = mentorInner?.latestRequest;
      const menteeReq = menteeInner?.latestRequest;
      if (mentorReq?.created_at && menteeReq?.created_at) {
        latestRequest = new Date(mentorReq.created_at) > new Date(menteeReq.created_at)
          ? mentorReq : menteeReq;
      } else {
        latestRequest = mentorReq || menteeReq || null;
      }

      // Determine direction
      const direction: RequestStatusData["direction"] = latestRequest?.direction || (hasSent ? "sent" : hasReceived ? "received" : null);

      setRequestStatus({
        hasSentRequest: hasSent,
        hasReceivedRequest: hasReceived,
        hasPendingRequest: hasPending,
        hasActiveRequest: hasActive,
        latestStatus: latestStatus,
        direction,
        latestRequest: latestRequest ? {
          id: latestRequest.id,
          requestType: latestRequest.request_type || latestRequest.requestType,
          status: latestRequest.status,
          createdAt: latestRequest.created_at || latestRequest.createdAt,
          direction: latestRequest.direction,
        } : undefined,
      });
    } catch (error) {
      console.error("Error checking existing request:", error);
      setRequestStatus({
        hasSentRequest: false,
        hasReceivedRequest: false,
        hasPendingRequest: false,
        hasActiveRequest: false,
        latestStatus: null,
      });
    } finally {
      setCheckingRequestStatus(false);
    }
  };

  // Block sending new request if any request exists (sent or received)
  const hasExistingRequest = () => {
    if (!requestStatus) return false;
    return requestStatus.hasSentRequest || requestStatus.hasReceivedRequest;
  };

  const getRequestStatusMessage = () => {
    if (!requestStatus) return null;
    if (!requestStatus.hasSentRequest && !requestStatus.hasReceivedRequest) return null;
    const name = resolveDisplayName(profile?.displayName, profile?.display_name, profile?.username) || "this user";

    if (requestStatus.hasActiveRequest) {
      return {
        type: "success" as const,
        title: "Already Connected",
        message: `You have an active mentorship relationship with ${name}.`,
        icon: <Check className="w-5 h-5 text-green-600" />,
      };
    }

    if (requestStatus.hasPendingRequest && requestStatus.direction === "sent") {
      return {
        type: "warning" as const,
        title: "Request Sent",
        message: `You have sent a mentorship request to ${name}. Waiting for their response.`,
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
      };
    }

    if (requestStatus.hasPendingRequest && requestStatus.direction === "received") {
      return {
        type: "info" as const,
        title: "Request Received",
        message: `${name} has sent you a mentorship request. Check your requests tab to respond.`,
        icon: <Info className="w-5 h-5 text-blue-600" />,
      };
    }

    if (requestStatus.hasSentRequest) {
      return {
        type: "info" as const,
        title: "Request History",
        message: `You have previously sent a request to ${name}.`,
        icon: <AlertCircle className="w-5 h-5 text-gray-600" />,
      };
    }

    if (requestStatus.hasReceivedRequest) {
      return {
        type: "info" as const,
        title: "Request History",
        message: `${name} has previously sent you a request.`,
        icon: <AlertCircle className="w-5 h-5 text-gray-600" />,
      };
    }

    return null;
  };

  const handleFollow = async () => {
    if (!profile?.id || isLoadingFollow) return;

    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        await UnfollowUser(profile.id);
        setIsFollowing(false);
        showToast("Successfully unfollowed", "success");
      } else {
        await FollowUser(profile.id);
        setIsFollowing(true);
        showToast("Successfully followed", "success");
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      showToast(
        error.response?.data?.message || "Failed to update follow status",
        "error"
      );
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleInitiateRequest = () => {
    if (!profile?.id) return;

    if (hasExistingRequest()) {
      showToast("A mentorship request already exists with this user", "warning");
      return;
    }

    if (context === "find-mentorship") {
      if (profile.mentoringAs === "mentee" || profile.mentoringAs === "both") {
        setRequestType("mentor");
      } else if (profile.mentoringAs === "mentor") {
        setRequestType("mentee");
      } else {
        setRequestType("mentor");
      }
    } else {
      setRequestType(profile.mentoringAs === "mentee" ? "mentor" : "mentee");
    }

    setRequestMessage(getDefaultMessage());
    setShowRequestForm(true);
  };

  const handleSendRequest = async () => {
    if (!profile?.id || isLoadingRequest || !requestMessage.trim()) return;

    if (hasExistingRequest()) {
      showToast("A mentorship request already exists with this user", "warning");
      return;
    }

    setIsLoadingRequest(true);
    try {
      const apiRequestType =
        requestType === "mentee" ? "mentor_request" : "mentee_request";

      const payload: DirectMentorshipRequestPayload = {
        targetUserId: profile.id,
        requestType: apiRequestType,
        message: requestMessage.trim(),
      };

      await CreateDirectMentorShipRequest(payload);

      setShowRequestForm(false);
      showToast("Mentorship request sent successfully!", "success");
      setRequestStatus({
        hasSentRequest: true,
        hasReceivedRequest: false,
        hasPendingRequest: true,
        hasActiveRequest: false,
        latestStatus: "pending",
        direction: "sent",
      });
      setRequestMessage("");
    } catch (error: any) {
      console.error("Error sending mentorship request:", error);
      showToast(
        error.response?.data?.message ||
          "An error occurred while sending the request",
        "error"
      );
    } finally {
      setIsLoadingRequest(false);
    }
  };

  const getDefaultMessage = () => {
    if (!profile) return "";
    const displayName = resolveDisplayName(profile.displayName, profile.display_name, profile.username);

    if (requestType === "mentee") {
      return `Hello ${
        displayName
      },\n\nI would like to request you as my mentor. I'm impressed by your experience in ${
        profile.expertise?.slice(0, 2).join(", ") || "your field"
      } and believe I could greatly benefit from your guidance.\n\nLooking forward to your response!`;
    } else {
      return `Hello ${
        displayName
      },\n\nI would like to offer mentorship to you. Based on your profile, I believe I can help you with ${
        profile.expertise?.slice(0, 2).join(", ") || "your career development"
      }.\n\nLet me know if you're interested!`;
    }
  };

  const handleSendMessage = () => {
    if (!profile?.id) return;

    if (onChat && typeof onChat === "function") {
      try {
        onChat(profile.id);
      } catch (error) {
        console.error("Error in onChat callback:", error);
        navigateToMessages();
      }
    } else {
      navigateToMessages();
    }

    onClose();
  };

  const navigateToMessages = () => {
    if (!profile?.id) return;

    try {
      navigate("/dashboard/messages", {
        state: { startChatWith: profile.id, contextType: "mentorship" },
      });
    } catch (error) {
      console.error("React Router navigation failed:", error);
      window.location.href = `/dashboard/messages?user=${profile.id}&chat_type=mentorship`;
    }
  };

  const cancelRequestForm = () => {
    setShowRequestForm(false);
    setRequestMessage("");
  };

  if (!isOpen || !profile) return null;

  const isOwnProfile = currentUserId === profile.id;
  const isMentor =
    profile.mentoringAs === "mentor" || profile.mentoringAs === "both";
  const isMentee =
    profile.mentoringAs === "mentee" || profile.mentoringAs === "both";
  const existingRequest = hasExistingRequest();
  const requestStatusInfo = getRequestStatusMessage();

  const mentorData = profile.mentorProfile;
  const menteeData = profile.menteeProfile;
  const statsData = profile.mentorshipStats;
  const statusData = profile.mentorshipStatus;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl ${
          showRequestForm ? "max-w-2xl" : "max-w-3xl"
        } w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {showRequestForm ? "Send Mentorship Request" : "Mentorship Profile"}
          </h2>
          <button
            type="button"
            onClick={showRequestForm ? cancelRequestForm : onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {showRequestForm ? (
            <div className="space-y-6">
              {/* Profile Summary */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  {profile.avatar || "👤"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {resolveDisplayName(profile.displayName, profile.display_name, profile.username)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {profile.jobTitle} at {profile.company}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        requestType === "mentor"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {requestType === "mentor"
                        ? "Requesting as Mentor"
                        : "Offering to Mentor"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Request Status Warning */}
              {existingRequest && (
                <div className={`p-4 rounded-xl border ${requestStatus?.direction === "received" ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${requestStatus?.direction === "received" ? "text-blue-600" : "text-red-600"}`} />
                    <div>
                      <p className={`text-sm font-medium mb-1 ${requestStatus?.direction === "received" ? "text-blue-800" : "text-red-800"}`}>
                        {requestStatus?.direction === "received" ? "Request Received" : "Request Already Exists"}
                      </p>
                      <p className={`text-xs ${requestStatus?.direction === "received" ? "text-blue-700" : "text-red-700"}`}>
                        {requestStatus?.direction === "received"
                          ? `${resolveDisplayName(profile.displayName, profile.display_name, profile.username)} has already sent you a mentorship request. Check your requests tab to respond.`
                          : `A mentorship request already exists with ${resolveDisplayName(profile.displayName, profile.display_name, profile.username)}.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Banner */}
              {!existingRequest && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        {requestType === "mentor"
                          ? "You're requesting this person to be your mentor"
                          : "You're offering to mentor this person"}
                      </p>
                      <p className="text-xs text-blue-600">
                        A personalized message increases your chances of
                        acceptance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className={`w-full h-48 px-4 py-3 border rounded-xl resize-none focus:ring-2 ${
                    existingRequest
                      ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                      : "border-gray-300 focus:ring-purple-500 focus:border-transparent"
                  }`}
                  disabled={isLoadingRequest || existingRequest}
                  maxLength={1000}
                  placeholder={
                    existingRequest
                      ? "You cannot send another request to this user."
                      : "Explain why you want to connect and what you hope to achieve..."
                  }
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {existingRequest
                      ? "Message field is disabled"
                      : "Be specific about your goals and expectations"}
                  </p>
                  <span
                    className={`text-xs ${
                      requestMessage.length >= 950
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    {requestMessage.length}/1000
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={cancelRequestForm}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  disabled={isLoadingRequest}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={
                    isLoadingRequest ||
                    !requestMessage.trim() ||
                    existingRequest
                  }
                  className={`flex-1 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 ${
                    existingRequest
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : requestType === "mentor"
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoadingRequest ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : existingRequest ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      Already Sent
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center text-5xl shadow-lg flex-shrink-0 border-4 border-white">
                  {profile.avatar || "👤"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {resolveDisplayName(profile.displayName, profile.display_name, profile.username)}
                    </h3>
                    {profile.matchScore && (
                      <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 text-green-600 fill-green-600" />
                        <span className="text-sm text-green-700 font-bold">
                          {profile.matchScore}% Match
                        </span>
                      </div>
                    )}

                    {/* Request Status Badge */}
                    {checkingRequestStatus ? (
                      <div className="flex items-center gap-1 text-gray-500 text-sm bg-gray-100 px-3 py-1.5 rounded-full">
                        <Loader className="w-3 h-3 animate-spin" />
                        Checking...
                      </div>
                    ) : (
                      existingRequest && (
                        <div
                          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            requestStatus?.hasActiveRequest
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : requestStatus?.hasPendingRequest
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          {requestStatus?.hasActiveRequest && "Connected"}
                          {!requestStatus?.hasActiveRequest && requestStatus?.hasPendingRequest && requestStatus?.direction === "received" && "Request Received"}
                          {!requestStatus?.hasActiveRequest && requestStatus?.hasPendingRequest && requestStatus?.direction !== "received" && "Pending"}
                          {!requestStatus?.hasActiveRequest && !requestStatus?.hasPendingRequest && "History"}
                        </div>
                      )
                    )}
                  </div>

                  <p className="text-lg text-gray-700 font-medium mb-1">
                    {profile.jobTitle || profile.role}
                  </p>
                  {profile.company && (
                    <p className="text-base text-blue-600 font-medium mb-3">
                      {profile.company}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    {profile.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.careerLevel && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        <span>{profile.careerLevel}</span>
                      </div>
                    )}
                    {profile.yearsOfExperience ? (
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        <span>
                          {profile.yearsOfExperience}+ years experience
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Existing Request Status Alert */}
              {!checkingRequestStatus && requestStatusInfo && (
                <div
                  className={`mb-6 border rounded-xl p-4 ${
                    requestStatusInfo.type === "warning"
                      ? "bg-yellow-50 border-yellow-200"
                      : requestStatusInfo.type === "success"
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {requestStatusInfo.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {requestStatusInfo.title}
                      </p>
                      <p className="text-sm text-gray-700">
                        {requestStatusInfo.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mentorship Role Badges */}
              <div className="mb-6 flex flex-wrap gap-2">
                {statusData?.isActiveMentor && (
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold border border-purple-200">
                    <Award className="w-4 h-4" />
                    <span>Active Mentor</span>
                  </div>
                )}
                {statusData?.isActiveMentee && (
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold border border-blue-200">
                    <GraduationCap className="w-4 h-4" />
                    <span>Active Mentee</span>
                  </div>
                )}
                {!statusData && isMentor && isMentee && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 px-4 py-2 rounded-full font-semibold border-2 border-purple-200">
                    <Users className="w-4 h-4" />
                    <span>Open to both mentoring and being mentored</span>
                  </div>
                )}
                {!statusData && isMentor && !isMentee && (
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold border-2 border-purple-200">
                    <Award className="w-4 h-4" />
                    <span>Offering Mentorship</span>
                  </div>
                )}
                {!statusData && isMentee && !isMentor && (
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold border-2 border-blue-200">
                    <Target className="w-4 h-4" />
                    <span>Seeking Mentorship</span>
                  </div>
                )}
                {statusData?.communicationMethod && (
                  <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-medium border border-gray-200">
                    <MessageCircle className="w-4 h-4" />
                    <span className="capitalize">{statusData.communicationMethod.replace(/-/g, " ")}</span>
                  </div>
                )}
              </div>

              {/* Stats Row */}
              {statsData && (
                <div className="mb-6 grid grid-cols-3 gap-3">
                  <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
                    <p className="text-2xl font-bold text-purple-700">{statsData.mentorshipSessionsCompleted}</p>
                    <p className="text-xs text-purple-600 font-medium">Sessions</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                    <p className="text-2xl font-bold text-blue-700">{statsData.followersCount}</p>
                    <p className="text-xs text-blue-600 font-medium">Followers</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                    <p className="text-2xl font-bold text-green-700">{statsData.reputationScore}</p>
                    <p className="text-xs text-green-600 font-medium">Reputation</p>
                  </div>
                </div>
              )}

              {/* Profile Tabs — only show tabs if both profiles exist */}
              {hasBothProfiles && (
                <div className="mb-6 flex gap-2 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setProfileTab("mentor")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      profileTab === "mentor"
                        ? "bg-purple-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    Mentor Profile
                  </button>
                  <button
                    onClick={() => setProfileTab("mentee")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      profileTab === "mentee"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Mentee Profile
                  </button>
                </div>
              )}

              {/* ===== MENTOR PROFILE TAB ===== */}
              {(profileTab === "mentor" && mentorData) && (
                <div className="space-y-5">
                  {!hasBothProfiles && (
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <h4 className="text-base font-bold text-gray-900">Mentor Profile</h4>
                    </div>
                  )}

                  {/* Mentor Bio */}
                  {mentorData.bio && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                        About as Mentor
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-purple-50 p-4 rounded-xl border border-purple-100">
                        {mentorData.bio}
                      </p>
                    </div>
                  )}

                  {/* Mentor Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {mentorData.availability && (
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Availability</p>
                          <p className="text-sm text-gray-900 font-medium">{mentorData.availability}</p>
                        </div>
                      </div>
                    )}
                    {mentorData.responseTime && (
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <Zap className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Response Time</p>
                          <p className="text-sm text-gray-900 font-medium">{mentorData.responseTime}</p>
                        </div>
                      </div>
                    )}
                    {(mentorData.mentorStyle || mentorData.style) && (
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <Heart className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Mentoring Style</p>
                          <p className="text-sm text-gray-900 font-medium">{mentorData.mentorStyle || mentorData.style}</p>
                        </div>
                      </div>
                    )}
                    {mentorData.languages && mentorData.languages.length > 0 && (
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <Globe className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Languages</p>
                          <p className="text-sm text-gray-900 font-medium">{mentorData.languages.join(", ")}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expertise */}
                  {mentorData.expertise && mentorData.expertise.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        Areas of Expertise
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {mentorData.expertise.map((skill) => (
                          <span
                            key={skill}
                            className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Industries */}
                  {mentorData.industries && mentorData.industries.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-600" />
                        Industry Experience
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {mentorData.industries.map((industry) => (
                          <span
                            key={industry}
                            className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple-200"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== MENTEE PROFILE TAB ===== */}
              {(profileTab === "mentee" && menteeData) && (
                <div className="space-y-5">
                  {!hasBothProfiles && (
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <h4 className="text-base font-bold text-gray-900">Mentee Profile</h4>
                    </div>
                  )}

                  {/* Mentee Bio */}
                  {menteeData.bio && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                        About as Mentee
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-100">
                        {menteeData.bio}
                      </p>
                    </div>
                  )}

                  {/* Goals */}
                  {menteeData.goals && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        Mentorship Goals
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-200">
                        {menteeData.goals}
                      </p>
                    </div>
                  )}

                  {/* Topic */}
                  {menteeData.topic && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        Topic of Interest
                      </h4>
                      <p className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium border border-blue-200">
                        {menteeData.topic}
                      </p>
                    </div>
                  )}

                  {/* Mentee Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {menteeData.availability && (
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Availability</p>
                          <p className="text-sm text-gray-900 font-medium">{menteeData.availability}</p>
                        </div>
                      </div>
                    )}
                    {menteeData.urgency && (
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Urgency</p>
                          <p className="text-sm text-gray-900 font-medium capitalize">{menteeData.urgency}</p>
                        </div>
                      </div>
                    )}
                    {(menteeData.mentoredStyle || menteeData.style) && (
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <Heart className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Preferred Style</p>
                          <p className="text-sm text-gray-900 font-medium">{menteeData.mentoredStyle || menteeData.style}</p>
                        </div>
                      </div>
                    )}
                    {menteeData.languages && menteeData.languages.length > 0 && (
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Languages</p>
                          <p className="text-sm text-gray-900 font-medium">{menteeData.languages.join(", ")}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interests */}
                  {menteeData.interests && menteeData.interests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Interests
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {menteeData.interests.map((interest) => (
                          <span
                            key={interest}
                            className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Industries */}
                  {menteeData.industries && menteeData.industries.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        Target Industries
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {menteeData.industries.map((industry) => (
                          <span
                            key={industry}
                            className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fallback: no mentor/mentee profile data — show basic info */}
              {!mentorData && !menteeData && (
                <>
                  {/* Bio */}
                  {profile.bio && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                        About
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}

                  {profile.goals && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        Mentorship Goals
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-200">
                        {profile.goals}
                      </p>
                    </div>
                  )}

                  {profile.expertise && profile.expertise.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        Areas of Expertise
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.expertise.map((skill) => (
                          <span
                            key={skill}
                            className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.industries && profile.industries.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        Industry Experience
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.industries.map((industry) => (
                          <span
                            key={industry}
                            className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.affinityTags && profile.affinityTags.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-600" />
                        Affinity Groups
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.affinityTags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="space-y-3 pt-4 border-t border-gray-200 mt-6">
                  {/* Follows you badge */}
                  {isFollowedBy && (
                    <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                      <UserCheck className="w-4 h-4" />
                      {isFollowing ? "You follow each other" : `${resolveDisplayName(profile.displayName, profile.display_name, profile.username)} follows you`}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleFollow}
                      disabled={isLoadingFollow}
                      className={`flex-1 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 ${
                        isFollowing
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      } ${
                        isLoadingFollow ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isLoadingFollow ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="w-5 h-5" />
                          Following
                        </>
                      ) : isFollowedBy ? (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Follow Back
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          Follow
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Send Message
                    </button>
                  </div>

                  {/* Mentorship Request Button */}
                  <button
                    onClick={handleInitiateRequest}
                    disabled={requestButtonDisabled || existingRequest}
                    className={`w-full py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 ${
                      existingRequest || requestButtonDisabled
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : isMentor && context === "find-mentorship"
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : isMentee && context === "find-mentorship"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {checkingRequestStatus ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Checking...
                      </>
                    ) : existingRequest ? (
                      <>
                        {requestStatus?.hasActiveRequest ? (
                          <><Check className="w-5 h-5" />Connected</>
                        ) : requestStatus?.direction === "received" ? (
                          <><Info className="w-5 h-5" />Request Received</>
                        ) : (
                          <><AlertCircle className="w-5 h-5" />Request Sent</>
                        )}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        {context === "find-mentorship" && isMentee
                          ? "Offer to Mentor"
                          : context === "find-mentorship" && isMentor
                          ? "Request Mentorship"
                          : "Request Mentorship"}
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
