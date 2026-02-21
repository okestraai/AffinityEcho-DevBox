// components/Modals/MentorShipModals/DirectMentorshipRequestModal.tsx
import React, { useState, useEffect } from "react";
import { resolveDisplayName } from "../../../utils/nameUtils";
import { X, Send, Loader, AlertCircle, Clock, Check } from "lucide-react";
import {
  CreateDirectMentorShipRequest,
  CheckMentorshipRequestHasBeenSent,
  CheckUserProfileRequirement,
} from "../../../../api/mentorshipApis";
import { showToast } from "../../../Helper/ShowToast";

interface DirectMentorshipRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id: string;
    username: string;
    display_name?: string;
    avatar: string;
    bio: string;
    company: string;
    jobTitle: string;
    expertise?: string[];
    affinityTags?: string[];
    mentoringAs?: "mentor" | "mentee" | "both";
  } | null;
  requestType: "mentor" | "mentee";
}

interface RequestStatusData {
  hasSentRequest: boolean;
  hasPendingRequest: boolean;
  hasActiveRequest: boolean;
  latestStatus: "pending" | "accepted" | "declined" | "cancelled" | null;
}

export function DirectMentorshipRequestModal({
  isOpen,
  onClose,
  profile,
  requestType,
}: DirectMentorshipRequestModalProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileCheck, setProfileCheck] = useState({
    hasProfile: false,
    profileType: undefined as string | undefined,
    missingFields: [] as string[],
    canCreateRequest: false,
  });
  const [requestStatus, setRequestStatus] = useState<RequestStatusData | null>(
    null
  );
  const [checkingRequest, setCheckingRequest] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [requestButtonDisabled, setRequestButtonDisabled] = useState(true);

  useEffect(() => {
    if (isOpen && profile) {
      initializeModal();
    } else {
      // Reset state when modal closes
      resetModalState();
    }
  }, [isOpen, profile]);

  const initializeModal = async () => {
    setRequestButtonDisabled(true);
    setIsCheckingProfile(true);
    setCheckingRequest(true);

    try {
      // Check profile requirements first
      await checkProfileRequirements();

      // Check existing request after profile check
      await checkExistingRequest();
    } catch (error) {
      console.error("Error initializing modal:", error);
    } finally {
      setIsCheckingProfile(false);
      setCheckingRequest(false);
      setRequestButtonDisabled(false);
    }
  };

  const resetModalState = () => {
    setRequestStatus(null);
    setMessage("");
    setProfileCheck({
      hasProfile: false,
      profileType: undefined,
      missingFields: [],
      canCreateRequest: false,
    });
    setRequestButtonDisabled(true);
    setIsCheckingProfile(true);
    setCheckingRequest(false);
  };

  const checkProfileRequirements = async () => {
    try {
      const response = await CheckUserProfileRequirement();

      setProfileCheck({
        hasProfile: response?.hasProfile ?? false,
        profileType: response?.profileType,
        missingFields: response?.missingFields ?? [],
        canCreateRequest: response?.canCreateRequest ?? false,
      });
    } catch (error) {
      console.error("Error checking profile requirements:", error);
      setProfileCheck({
        hasProfile: false,
        missingFields: [],
        canCreateRequest: false,
      });
    }
  };

  const checkExistingRequest = async () => {
    if (!profile) return;

    try {
      const response = await CheckMentorshipRequestHasBeenSent(
        profile.id,
        requestType === "mentor" ? "mentor_request" : "mentee_request"
      );

      setRequestStatus({
        hasSentRequest: response?.hasSentRequest || false,
        hasPendingRequest: response?.hasPendingRequest || false,
        hasActiveRequest: response?.hasActiveRequest || false,
        latestStatus: response?.latestStatus || null,
      });
    } catch (error) {
      console.error("Error checking existing request:", error);
      setRequestStatus({
        hasSentRequest: false,
        hasPendingRequest: false,
        hasActiveRequest: false,
        latestStatus: null,
      });
    }
  };

  // SIMPLE CHECK: If ANY request has been sent (pending, active, declined, cancelled), BLOCK
  const hasAlreadySentRequest = () => {
    if (!requestStatus) return false;
    return requestStatus.hasSentRequest;
  };

  // Get status message for the user
  const getStatusMessage = () => {
    if (!requestStatus || !requestStatus.hasSentRequest) return null;

    const name = resolveDisplayName(profile?.display_name, profile?.username) || "this user";

    if (requestStatus.hasPendingRequest) {
      return {
        type: "warning",
        title: "Request Already Sent",
        message: `You have already sent a ${requestType} request to ${name}. Please wait for their response.`,
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
      };
    }

    if (requestStatus.hasActiveRequest) {
      return {
        type: "success",
        title: "Already Connected",
        message: `You already have an active ${requestType} relationship with ${name}.`,
        icon: <Check className="w-5 h-5 text-green-600" />,
      };
    }

    return {
      type: "info",
      title: "Request History",
      message: `You have previously sent a request to ${name}.`,
      icon: <AlertCircle className="w-5 h-5 text-gray-600" />,
    };
  };

  if (!isOpen || !profile) return null;

  const isMentorRequest = requestType === "mentor";
  const statusInfo = getStatusMessage();
  const alreadySentRequest = hasAlreadySentRequest();
  const canSendRequest = !alreadySentRequest && profileCheck.canCreateRequest;
  const isLoading = isCheckingProfile || checkingRequest;
  const isButtonDisabled =
    requestButtonDisabled ||
    alreadySentRequest ||
    !profileCheck.canCreateRequest ||
    isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      showToast("Please add a message to your request", "warning");
      return;
    }

    if (alreadySentRequest) {
      showToast(
        "You have already sent a request to this user. You cannot send another one.",
        "warning"
      );
      return;
    }

    if (!profileCheck.canCreateRequest) {
      showToast("Please complete your profile before sending requests", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        targetUserId: profile.id,
        requestType: isMentorRequest ? "mentor_request" : "mentee_request",
        message: message.trim(),
      };

      await CreateDirectMentorShipRequest(payload);

      showToast(`Request sent to ${resolveDisplayName(profile.display_name, profile.username)}!`, "success");
      setMessage("");
      onClose();
    } catch (error: any) {
      console.error("Error sending request:", error);
      showToast(
        error.response?.data?.message ||
          "Failed to send request. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md md:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {isMentorRequest ? "Request Mentorship" : "Offer to Mentor"}
            </h3>
            <p className="text-sm text-gray-500">
              Send a personalized message with your request
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Profile Preview */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                {profile.avatar || "👤"}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg mb-1">
                  {resolveDisplayName(profile.display_name, profile.username)}
                </h4>
                <p className="text-sm text-gray-600 mb-1">{profile.jobTitle}</p>
                <p className="text-xs text-blue-600 mb-3">{profile.company}</p>

                {profile.bio && (
                  <p className="text-sm text-gray-700 mb-3">{profile.bio}</p>
                )}

                {profile.expertise && profile.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {profile.expertise.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white text-purple-700 px-2 py-1 rounded-full shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Request Status Badge */}
              {isLoading ? (
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Loader className="w-3 h-3 animate-spin" />
                  Checking...
                </div>
              ) : (
                alreadySentRequest && (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
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
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-center">
              <Loader className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-600">
                Checking your profile and request status...
              </p>
            </div>
          )}

          {/* Existing Request Status Alert - BLOCKS THE FORM */}
          {!isLoading && alreadySentRequest && statusInfo && (
            <div
              className={`border rounded-xl p-4 mb-6 ${
                statusInfo.type === "warning"
                  ? "bg-yellow-50 border-yellow-200"
                  : statusInfo.type === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{statusInfo.icon}</div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    {statusInfo.title}
                  </p>
                  <p className="text-sm text-gray-700">{statusInfo.message}</p>
                  <p className="text-sm font-medium text-red-600 mt-2">
                    You cannot send another request to this user.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Completion Warning */}
          {!isLoading &&
            !profileCheck.canCreateRequest &&
            !alreadySentRequest && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Complete your profile first
                    </p>
                    <p className="text-xs text-yellow-700">
                      You need to setup your{" "}
                      {isMentorRequest ? "mentee" : "mentor"} profile before
                      sending requests.
                    </p>
                  </div>
                </div>
              </div>
            )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type Info */}
            {!isLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600">💡</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      {isMentorRequest
                        ? `You're requesting ${resolveDisplayName(profile.display_name, profile.username)} as your mentor`
                        : `You're offering to mentor ${resolveDisplayName(profile.display_name, profile.username)}`}
                    </p>
                    <p className="text-xs text-blue-700">
                      {isMentorRequest
                        ? "Share why you would like them to mentor you and what you hope to learn."
                        : "Share what you can help them with and how you can support their growth."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message Input - ONLY ENABLED if NO existing request AND profile is complete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message {!alreadySentRequest && "*"}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isLoading
                    ? "Loading..."
                    : alreadySentRequest
                    ? "You cannot send another request to this user."
                    : !profileCheck.canCreateRequest
                    ? "Please complete your profile first."
                    : isMentorRequest
                    ? `Example: "Hi ${resolveDisplayName(profile.display_name, profile.username)}, I'm impressed by your work..."`
                    : `Example: "Hi ${resolveDisplayName(profile.display_name, profile.username)}, I noticed you're looking to grow in..."`
                }
                rows={8}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none resize-none ${
                  isLoading ||
                  alreadySentRequest ||
                  !profileCheck.canCreateRequest
                    ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                    : "border-gray-300 focus:ring-purple-500 focus:border-transparent"
                }`}
                required={!alreadySentRequest && profileCheck.canCreateRequest}
                disabled={
                  isLoading ||
                  alreadySentRequest ||
                  !profileCheck.canCreateRequest ||
                  isSubmitting
                }
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {isLoading
                    ? "Checking profile status..."
                    : alreadySentRequest
                    ? "Message field is disabled because you've already sent a request"
                    : !profileCheck.canCreateRequest
                    ? "Please complete your profile first"
                    : "Be specific about your goals and what you're looking for"}
                </p>
                <p className="text-xs text-gray-500">{message.length} / 500</p>
              </div>
            </div>

            {/* Privacy Note */}
            {!isLoading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-xs text-yellow-800">
                  <span className="font-medium">Privacy Note:</span> Your
                  request will be sent directly to {resolveDisplayName(profile.display_name, profile.username)}. They can
                  choose to accept or decline. If accepted, you'll be able to
                  connect and communicate.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              {/* Submit Button - COMPLETELY DISABLED if request already sent */}
              <button
                type="submit"
                disabled={isButtonDisabled || !message.trim()}
                className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                  isButtonDisabled || !message.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : isMentorRequest
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : alreadySentRequest ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Already Sent
                  </>
                ) : !profileCheck.canCreateRequest ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Complete Profile
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Clear Block Message at Bottom */}
          {!isLoading && alreadySentRequest && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                  Request Blocked: You have already sent a {requestType} request
                  to {resolveDisplayName(profile.display_name, profile.username)}. You cannot send another request to the
                  same user.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
