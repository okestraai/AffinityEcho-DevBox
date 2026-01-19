// components/Modals/MentorShipModals/MentorshipUserProfileModal.tsx
import React, { useState, useEffect } from "react";
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
  Calendar,
  CheckCircle,
  UserPlus,
  UserCheck,
  Loader,
  Info,
  Send,
  AlertCircle,
  Check,
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

interface MentorshipUserProfile {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  company: string;
  jobTitle: string;
  careerLevel: string;
  location?: string;
  expertise: string[];
  industries: string[];
  mentoringAs?: "mentor" | "mentee" | "both";
  availability?: string;
  responseTime?: string;
  matchScore?: number;
  isAvailable: boolean;
  totalMentees?: number;
  yearsOfExperience?: number;
  affinityTags: string[];
  mentorshipStyle?: string;
  languages?: string[];
  goals?: string;
  mentorshipDuration?: string;
  role?: string;
  status?: string;
  lastContact?: string;
}

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
  hasPendingRequest: boolean;
  hasActiveRequest: boolean;
  latestStatus: "pending" | "accepted" | "declined" | "cancelled" | null;
  latestRequest?: {
    id: string;
    requestType: string;
    status: string;
    createdAt: string;
  };
}

export function MentorshipUserProfileModal({
  isOpen,
  onClose,
  profile,
  onChat,
  onRequestMentorship,
  currentUserId,
  context = "mentorship-view", // Default context
}: MentorshipUserProfileModalProps) {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestType, setRequestType] = useState<"mentor" | "mentee">("mentor");
  const [requestStatus, setRequestStatus] = useState<RequestStatusData | null>(
    null
  );
  const [checkingRequestStatus, setCheckingRequestStatus] = useState(false);
  const [requestButtonDisabled, setRequestButtonDisabled] = useState(true); // Start disabled

  useEffect(() => {
    if (isOpen && profile && currentUserId) {
      fetchFollowStatus();
      checkExistingRequest();
      // Reset form when modal opens
      setShowRequestForm(false);
      setRequestMessage("");
      setRequestButtonDisabled(true); // Disable button initially
    } else {
      // Reset state when modal closes
      setRequestStatus(null);
    }
  }, [isOpen, profile?.id, currentUserId]);

  useEffect(() => {
    // Only enable request button after request status has been checked
    if (!checkingRequestStatus && requestStatus !== null) {
      setRequestButtonDisabled(false);
    }
  }, [checkingRequestStatus, requestStatus]);

  const fetchFollowStatus = async () => {
    if (!profile?.id) return;

    try {
      const response = await GetFollowStatus(profile.id);
      const data = response.data?.data || response.data;
      setIsFollowing(data?.isFollowing || false);
    } catch (error) {
      console.error("Error fetching follow status:", error);
    }
  };

  const checkExistingRequest = async () => {
    if (!profile?.id || !currentUserId) return;

    setCheckingRequestStatus(true);
    setRequestButtonDisabled(true); // Disable button while checking
    try {
      // Check BOTH types of requests to see if any exist
      const mentorResponse = await CheckMentorshipRequestHasBeenSent(
        profile.id,
        "mentor_request"
      );

      const menteeResponse = await CheckMentorshipRequestHasBeenSent(
        profile.id,
        "mentee_request"
      );

      // Helper function to extract data from API response
      const extractRequestData = (response: any) => {
        let data = response;
        if (response?.data) data = response.data;
        if (response?.success && response?.data) data = response.data;
        return data;
      };

      const mentorData = extractRequestData(mentorResponse);
      const menteeData = extractRequestData(menteeResponse);

      console.log("Mentor request status:", mentorData);
      console.log("Mentee request status:", menteeData);

      // Check if ANY request exists (mentor or mentee)
      const hasAnyRequest =
        mentorData?.hasSentRequest || menteeData?.hasSentRequest;
      const hasPending =
        mentorData?.hasPendingRequest || menteeData?.hasPendingRequest;
      const hasActive =
        mentorData?.hasActiveRequest || menteeData?.hasActiveRequest;

      // Determine latest status
      let latestStatus: RequestStatusData["latestStatus"] = null;
      if (mentorData?.latestStatus) latestStatus = mentorData.latestStatus;
      if (menteeData?.latestStatus) latestStatus = menteeData.latestStatus;

      // Determine latest request
      let latestRequest = null;
      if (
        mentorData?.latestRequest?.createdAt &&
        menteeData?.latestRequest?.createdAt
      ) {
        // Pick the most recent one
        const mentorDate = new Date(mentorData.latestRequest.createdAt);
        const menteeDate = new Date(menteeData.latestRequest.createdAt);
        latestRequest =
          mentorDate > menteeDate
            ? mentorData.latestRequest
            : menteeData.latestRequest;
      } else if (mentorData?.latestRequest) {
        latestRequest = mentorData.latestRequest;
      } else if (menteeData?.latestRequest) {
        latestRequest = menteeData.latestRequest;
      }

      setRequestStatus({
        hasSentRequest: hasAnyRequest,
        hasPendingRequest: hasPending,
        hasActiveRequest: hasActive,
        latestStatus: latestStatus,
        latestRequest: latestRequest,
      });

      console.log("Combined request status:", {
        hasSentRequest: hasAnyRequest,
        hasPendingRequest: hasPending,
        hasActiveRequest: hasActive,
        latestStatus: latestStatus,
      });
    } catch (error) {
      console.error("Error checking existing request:", error);
      setRequestStatus({
        hasSentRequest: false,
        hasPendingRequest: false,
        hasActiveRequest: false,
        latestStatus: null,
      });
    } finally {
      setCheckingRequestStatus(false);
    }
  };

  // SIMPLE CHECK: If ANY request has been sent (pending, active, declined, cancelled), BLOCK
  const hasAlreadySentRequest = () => {
    if (!requestStatus) return false;
    console.log("Checking request status for blocking:", requestStatus);
    return requestStatus.hasSentRequest;
  };

  // Get status message for display
  const getRequestStatusMessage = () => {
    if (!requestStatus || !requestStatus.hasSentRequest) return null;

    if (requestStatus.hasPendingRequest) {
      return {
        type: "warning",
        title: "Request Already Sent",
        message: `You have already sent a mentorship request to ${profile?.username}. Please wait for their response.`,
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
      };
    }

    if (requestStatus.hasActiveRequest) {
      return {
        type: "success",
        title: "Already Connected",
        message: `You already have an active mentorship relationship with ${profile?.username}.`,
        icon: <Check className="w-5 h-5 text-green-600" />,
      };
    }

    return {
      type: "info",
      title: "Request History",
      message: `You have previously sent a request to ${profile?.username}.`,
      icon: <AlertCircle className="w-5 h-5 text-gray-600" />,
    };
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

    console.log("Initiate request clicked. Request status:", requestStatus);
    console.log("Has already sent request?", hasAlreadySentRequest());

    if (hasAlreadySentRequest()) {
      showToast("You have already sent a request to this user", "warning");
      return;
    }

    // Determine request type based on user's profile and context
    if (context === "find-mentorship") {
      // In Find Mentorship view, show offer to mentor for mentees
      if (profile.mentoringAs === "mentee" || profile.mentoringAs === "both") {
        setRequestType("mentor"); // User wants to be their mentor
      } else if (profile.mentoringAs === "mentor") {
        setRequestType("mentee"); // User wants them to be mentor
      } else {
        setRequestType("mentor");
      }
    } else {
      // In Mentorship View (My Mentors/My Mentees), default to appropriate type
      setRequestType(profile.mentoringAs === "mentee" ? "mentor" : "mentee");
    }

    // Set default message
    setRequestMessage(getDefaultMessage());
    setShowRequestForm(true);
  };

  const handleSendRequest = async () => {
    if (!profile?.id || isLoadingRequest || !requestMessage.trim()) return;

    console.log("Send request clicked. Request status:", requestStatus);

    if (hasAlreadySentRequest()) {
      showToast("You have already sent a request to this user", "warning");
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

      const response = await CreateDirectMentorShipRequest(payload);

      if (response.success || response.data?.success) {
        setShowRequestForm(false);
        showToast("Mentorship request sent successfully!", "success");
        // Update local state immediately without reloading
        setRequestStatus({
          hasSentRequest: true,
          hasPendingRequest: true,
          hasActiveRequest: false,
          latestStatus: "pending",
        });
        setRequestMessage("");
      } else {
        showToast(
          response.message ||
            response.data?.message ||
            "Failed to send request",
          "error"
        );
      }
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

    if (requestType === "mentee") {
      return `Hello ${
        profile.username
      },\n\nI would like to request you as my mentor. I'm impressed by your experience in ${
        profile.expertise?.slice(0, 2).join(", ") || "your field"
      } and believe I could greatly benefit from your guidance.\n\nLooking forward to your response!`;
    } else {
      return `Hello ${
        profile.username
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

    const messagesUrl = `/dashboard/messages?user=${profile.id}`;

    try {
      navigate(messagesUrl);
    } catch (error) {
      console.error("React Router navigation failed:", error);
      const fullUrl = window.location.origin + messagesUrl;
      window.location.href = fullUrl;
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
  const alreadySentRequest = hasAlreadySentRequest();
  const requestStatusInfo = getRequestStatusMessage();

  console.log("Rendering modal with alreadySentRequest:", alreadySentRequest);
  console.log("Request status:", requestStatus);

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
            onClick={showRequestForm ? cancelRequestForm : onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                    {profile.username}
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
              {alreadySentRequest && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-800 font-medium mb-1">
                        Request Already Sent
                      </p>
                      <p className="text-xs text-red-700">
                        You have already sent a request to {profile.username}.
                        You cannot send another request.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Banner */}
              {!alreadySentRequest && (
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
                    alreadySentRequest
                      ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                      : "border-gray-300 focus:ring-purple-500 focus:border-transparent"
                  }`}
                  disabled={isLoadingRequest || alreadySentRequest}
                  maxLength={1000}
                  placeholder={
                    alreadySentRequest
                      ? "You cannot send another request to this user."
                      : "Explain why you want to connect and what you hope to achieve..."
                  }
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {alreadySentRequest
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
                    alreadySentRequest
                  }
                  className={`flex-1 py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 ${
                    alreadySentRequest
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
                  ) : alreadySentRequest ? (
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
                      {profile.username}
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
                      alreadySentRequest && (
                        <div
                          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            requestStatus?.hasPendingRequest
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : requestStatus?.hasActiveRequest
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          {requestStatus?.hasPendingRequest && "Pending"}
                          {requestStatus?.hasActiveRequest && "Connected"}
                          {!requestStatus?.hasPendingRequest &&
                            !requestStatus?.hasActiveRequest &&
                            "Requested"}
                        </div>
                      )
                    )}
                  </div>

                  <p className="text-lg text-gray-700 font-medium mb-1">
                    {profile.jobTitle || profile.role}
                  </p>
                  <p className="text-base text-blue-600 font-medium mb-3">
                    {profile.company}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    {profile.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      <span>{profile.careerLevel}</span>
                    </div>
                    {profile.yearsOfExperience && (
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        <span>
                          {profile.yearsOfExperience}+ years experience
                        </span>
                      </div>
                    )}
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

              {/* Mentorship Type Badge */}
              <div className="mb-6">
                {isMentor && isMentee && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 px-4 py-2 rounded-full font-semibold border-2 border-purple-200">
                    <Users className="w-4 h-4" />
                    <span>Open to both mentoring and being mentored</span>
                  </div>
                )}
                {isMentor && !isMentee && (
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold border-2 border-purple-200">
                    <Award className="w-4 h-4" />
                    <span>Offering Mentorship</span>
                  </div>
                )}
                {isMentee && !isMentor && (
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold border-2 border-blue-200">
                    <Target className="w-4 h-4" />
                    <span>Seeking Mentorship</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                  About
                </h4>
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>

              {/* Mentorship Goals (for mentees) */}
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

              {/* Expertise */}
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

              {/* Industries */}
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

              {/* Affinity Tags */}
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

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
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

                  {/* Mentorship Request Button - BLOCKED if request already sent, disabled while checking */}
                  <button
                    onClick={handleInitiateRequest}
                    disabled={requestButtonDisabled || alreadySentRequest}
                    className={`w-full py-3 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 ${
                      alreadySentRequest || requestButtonDisabled
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
                    ) : alreadySentRequest ? (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        Request Already Sent
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
