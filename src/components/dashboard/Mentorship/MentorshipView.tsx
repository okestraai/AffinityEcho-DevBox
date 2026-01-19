// components/Views/Mentorship/MentorshipView.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Users,
  UserPlus,
  MessageCircle,
  Star,
  Clock,
  Award,
  Plus,
  Inbox,
  Loader,
  MapPin,
  Briefcase,
  RefreshCw,
  Bell,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { MentorshipUserProfileModal } from "../../Modals/MentorShipModals/MentorshipUserProfileModal";
import { MentorshipRequestModal } from "../../Modals/MentorShipModals/MentorshipRequestModal";
import { MentorshipProfileModal } from "../../Modals/MentorShipModals/MentorshipProfileModal";
import { FindMentorshipView } from "./FindMentorshipView";
import {
  CheckUserProfileExist,
  GetMentorshipMetric,
  GetMyMentors,
  GetMyMentees,
} from "../../../../api/mentorshipApis";
import { DecryptData } from "../../../../api/EncrytionApis";
import { showToast } from "../../../Helper/ShowToast";

// Interface definition
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

export function MentorshipView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"mentors" | "mentees" | "find">(
    "mentors"
  );
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] =
    useState<MentorshipUserProfile | null>(null);
  const [showMentorshipRequest, setShowMentorshipRequest] = useState(false);
  const [showMentorProfile, setShowMentorProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileCheck, setProfileCheck] = useState<{
    hasProfile: boolean;
    profileType?: string;
    isMentorProfile?: boolean;
    isMenteeProfile?: boolean;
  } | null>(null);

  const [myMentors, setMyMentors] = useState<any[]>([]);
  const [myMentees, setMyMentees] = useState<any[]>([]);

  // Add state for mentorship metrics
  const [mentorshipMetrics, setMentorshipMetrics] = useState<{
    total: number;
    sent: {
      total: number;
      unread: number;
      byStatus: {
        pending: number;
        accepted: number;
        declined: number;
        cancelled: number;
      };
      byType: {
        mentor_requests: number;
        mentee_requests: number;
      };
    };
    received: {
      total: number;
      unread: number;
      byStatus: {
        pending: number;
        accepted: number;
        declined: number;
        cancelled: number;
      };
      byType: {
        mentor_requests: number;
        mentee_requests: number;
      };
    };
    totalUnread: number;
    pendingReceivedUnread: number;
    recentActivity: {
      last7Days: number;
      last30Days: number;
    };
  } | null>(null);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        checkProfileStatus(),
        fetchMentorshipConnections(),
        fetchMentorshipMetrics(),
      ]);
    } catch (error) {
      console.error("Error initializing data:", error);
      showToast("Error loading mentorship data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeView === "mentors") {
        await fetchMentorshipConnections();
      } else if (activeView === "mentees") {
        await fetchMentorshipConnections();
      }
      showToast("Data refreshed", "success");
    } catch (error) {
      console.error("Error refreshing data:", error);
      showToast("Error refreshing data", "error");
    } finally {
      setRefreshing(false);
    }
  };

  // Function to decrypt company and other fields
  const decryptProfileData = async (
    profileData: any
  ): Promise<MentorshipUserProfile> => {
    try {
      const encryptedFields = [
        {
          key: "company_encrypted",
          formKey: "company",
          type: "string",
        },
        {
          key: "career_level_encrypted",
          formKey: "careerLevel",
          type: "string",
        },
        {
          key: "location_encrypted",
          formKey: "location",
          type: "string",
        },
        {
          key: "affinity_tags_encrypted",
          formKey: "affinityTags",
          type: "array",
        },
      ];

      const decryptedData: Record<string, any> = {};
      const promises = [];

      encryptedFields.forEach((field) => {
        if (profileData[field.key]) {
          promises.push(
            DecryptData({
              encryptedData: profileData[field.key],
            }).then((result) => ({
              key: field.formKey,
              value: result.data.decryptedData,
              type: field.type,
            }))
          );
        }
      });

      const results = await Promise.all(promises);

      const ensureArray = (value: any): string[] => {
        if (value == null) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          try {
            const trimmed = value.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
              const parsed = JSON.parse(trimmed);
              return Array.isArray(parsed) ? parsed : [];
            }
            if (trimmed.includes(",")) {
              return trimmed
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item);
            }
            return trimmed ? [trimmed] : [];
          } catch (error) {
            return [];
          }
        }
        return [].concat(value).filter((item) => item != null);
      };

      const ensureString = (value: any): string => {
        if (value == null) return "";
        if (Array.isArray(value)) {
          return value.length > 0 ? String(value[0]) : "";
        }
        return String(value);
      };

      results.forEach((result) => {
        let processedValue;

        if (result.type === "array") {
          processedValue = ensureArray(result.value);
        } else {
          processedValue = ensureString(result.value);
        }

        decryptedData[result.key] = processedValue;
      });

      // Helper functions to get data from profile
      const getStringFromProfile = (key: string, defaultValue = ""): string => {
        const value = profileData[key];
        if (value == null) return defaultValue;
        if (Array.isArray(value)) {
          return value.length > 0 ? String(value[0]) : defaultValue;
        }
        return String(value);
      };

      const getArrayFromProfile = (
        key: string,
        defaultValue: string[] = []
      ): string[] => {
        const value = profileData[key];
        if (value == null) return defaultValue;
        return ensureArray(value);
      };

      // Map API fields to interface fields
      const mappedProfile: MentorshipUserProfile = {
        id: profileData.id || profileData.user_id || "",
        username:
          profileData.username || profileData.full_name || "Unknown User",
        avatar: profileData.avatar || profileData.profile_picture || "👤",
        bio:
          profileData.bio ||
          profileData.mentor_bio ||
          profileData.mentee_bio ||
          "",
        company: decryptedData.company || getStringFromProfile("company", ""),
        jobTitle: profileData.job_title || profileData.position || "",
        careerLevel:
          decryptedData.careerLevel || getStringFromProfile("career_level", ""),
        location:
          decryptedData.location || getStringFromProfile("location", ""),
        expertise: getArrayFromProfile("expertise", []).concat(
          getArrayFromProfile("mentor_expertise", [])
        ),
        industries: getArrayFromProfile("industries", []),
        mentoringAs: profileData.mentoring_as || profileData.role || undefined,
        availability: profileData.availability || undefined,
        responseTime: profileData.response_time || undefined,
        matchScore:
          profileData.match_score || profileData.matchScore || undefined,
        isAvailable: Boolean(
          profileData.is_available || profileData.isAvailable || true
        ),
        totalMentees: profileData.total_mentees || undefined,
        yearsOfExperience: profileData.years_of_experience || undefined,
        affinityTags:
          decryptedData.affinityTags ||
          getArrayFromProfile("affinity_tags", []),
        mentorshipStyle: profileData.mentorship_style || undefined,
        languages: getArrayFromProfile("languages", []),
        goals: profileData.goals || undefined,
        mentorshipDuration: profileData.mentorship_duration || undefined,
        role: profileData.role || undefined,
        status: profileData.status || undefined,
        lastContact: profileData.last_contact || undefined,
      };

      return mappedProfile;
    } catch (error) {
      console.error("Error decrypting profile data:", error);
      // Return basic profile if decryption fails
      return {
        id: profileData.id || "",
        username: profileData.username || "Unknown User",
        avatar: profileData.avatar || "👤",
        bio: profileData.bio || "",
        company: profileData.company || "",
        jobTitle: profileData.job_title || "",
        careerLevel: profileData.career_level || "",
        location: profileData.location || "",
        expertise: [],
        industries: [],
        isAvailable: true,
        affinityTags: [],
      };
    }
  };

  // Function to handle profile selection
  const handleViewProfile = async (profileData: any) => {
    try {
      const decryptedProfile = await decryptProfileData(profileData);
      setSelectedProfile(decryptedProfile);
      setShowUserProfile(true);
    } catch (error) {
      console.error("Error preparing profile for modal:", error);
      // Fallback to basic profile data
      setSelectedProfile({
        id: profileData.id || "",
        username: profileData.username || "Unknown User",
        avatar: profileData.avatar || "👤",
        bio: profileData.bio || "",
        company: "Company information not available",
        jobTitle: profileData.job_title || "",
        careerLevel: "",
        location: "",
        expertise: [],
        industries: [],
        isAvailable: true,
        affinityTags: [],
      });
      setShowUserProfile(true);
    }
  };

  // Handle chat function for the modal
  const handleStartChat = (userId: string) => {
    try {
      console.log("Starting chat with user:", userId);
      const messagesUrl = `/dashboard/messages?user=${userId}`;

      // Try React Router navigation first
      if (navigate && typeof navigate === "function") {
        navigate(messagesUrl);
      } else {
        // Fallback to window location
        window.location.href = window.location.origin + messagesUrl;
      }
    } catch (error) {
      console.error("Error navigating to messages:", error);
      // Fallback to window location
      window.location.href = `/dashboard/messages?user=${userId}`;
    }
  };

  // Fetch mentorship metrics
  const fetchMentorshipMetrics = async () => {
    try {
      const response = await GetMentorshipMetric();

      // Handle nested response structure
      let metricsData = response.data;

      // If response has nested structure
      if (metricsData?.success && metricsData?.data) {
        metricsData = metricsData.data;
      }

      // Also check if it's a nested API response
      if (metricsData?.data?.total !== undefined) {
        metricsData = metricsData.data;
      }

      setMentorshipMetrics(metricsData);
    } catch (error) {
      console.error("Error fetching mentorship metrics:", error);
      // Set default metrics structure if API fails
      setMentorshipMetrics({
        total: 0,
        sent: {
          total: 0,
          unread: 0,
          byStatus: {
            pending: 0,
            accepted: 0,
            declined: 0,
            cancelled: 0,
          },
          byType: {
            mentor_requests: 0,
            mentee_requests: 0,
          },
        },
        received: {
          total: 0,
          unread: 0,
          byStatus: {
            pending: 0,
            accepted: 0,
            declined: 0,
            cancelled: 0,
          },
          byType: {
            mentor_requests: 0,
            mentee_requests: 0,
          },
        },
        totalUnread: 0,
        pendingReceivedUnread: 0,
        recentActivity: {
          last7Days: 0,
          last30Days: 0,
        },
      });
    }
  };

  const checkProfileStatus = async () => {
    try {
      const response = await CheckUserProfileExist();

      // Handle nested response structure
      let profileData = response.data;

      // If response.data has a nested success/data structure
      if (profileData?.success && profileData?.data) {
        profileData = profileData.data;
      }

      // Also check if it's a nested API response
      if (profileData?.data?.hasProfile !== undefined) {
        profileData = profileData.data;
      }

      setProfileCheck({
        hasProfile: profileData?.hasProfile || false,
        profileType: profileData?.profileType,
        isMentorProfile: profileData?.profileType === "mentor",
        isMenteeProfile: profileData?.profileType === "mentee",
      });
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };

  const fetchMentorshipConnections = async () => {
    try {
      // Fetch mentors and mentees separately
      const [mentorsResponse, menteesResponse] = await Promise.all([
        GetMyMentors(),
        GetMyMentees(),
      ]);

      // Process mentors response
      let mentorsData = mentorsResponse;

      // Handle different response structures
      if (mentorsData?.success && mentorsData?.data) {
        mentorsData = mentorsData.data;
      }
      if (mentorsData?.data?.mentors !== undefined) {
        mentorsData = mentorsData.data;
      }

      const mentors = mentorsData?.mentors || [];

      // Process mentees response
      let menteesData = menteesResponse;

      if (menteesData?.success && menteesData?.data) {
        menteesData = menteesData.data;
      }
      if (menteesData?.data?.mentees !== undefined) {
        menteesData = menteesData.data;
      }

      const mentees = menteesData?.mentees || [];

      setMyMentors(mentors);
      setMyMentees(mentees);
    } catch (error) {
      console.error("Error fetching mentorship connections:", error);
      setMyMentors([]);
      setMyMentees([]);
    }
  };

  // Calculate total requests count
  const getTotalRequestsCount = () => {
    if (mentorshipMetrics) {
      // Use the total from metrics API
      return mentorshipMetrics.total;
    }

    // Fallback to old calculation if metrics not loaded yet
    return myMentors.length + myMentees.length;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get time since connection
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Handle profile updates
  const handleMentorProfileUpdated = () => {
    // Refresh mentor data and profile check
    Promise.all([
      fetchMentorshipConnections(),
      checkProfileStatus(),
    ]);
    showToast("Mentor profile updated successfully", "success");
  };

  const handleMenteeProfileUpdated = () => {
    // Refresh mentee data and profile check
    Promise.all([
      fetchMentorshipConnections(),
      checkProfileStatus(),
    ]);
    showToast("Mentee profile updated successfully", "success");
  };

  // Skeleton Loader Components
  const ProfileSkeleton = () => (
    <div className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  );

  const renderMyMentors = () => {
    if (loading && !refreshing) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-xl w-36"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <ProfileSkeleton key={i} />
            ))}
          </div>
        </div>
      );
    }

    const hasMenteeProfile = profileCheck?.isMenteeProfile;
    const hasMentors = myMentors.length > 0;
    const buttonText = hasMenteeProfile
      ? "Update Mentee Profile"
      : "Setup Mentee Profile";
    const buttonIcon = hasMenteeProfile ? (
      <Plus className="w-4 h-4" />
    ) : (
      <UserPlus className="w-4 h-4" />
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Mentors</h2>
            <p className="text-gray-500">Professionals guiding your growth</p>
          </div>
          <div className="flex items-center gap-2">
            {/* <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button> */}
            {/* Show button at top-right ONLY when there ARE mentors */}
            {hasMentors && (
              <button
                onClick={() => setShowMentorshipRequest(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                {buttonIcon}
                {buttonText}
              </button>
            )}
          </div>
        </div>

        {refreshing ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-purple-600 mr-2" />
            <span className="text-gray-600">Refreshing mentors...</span>
          </div>
        ) : hasMentors ? (
          <div className="grid gap-4 md:grid-cols-2">
            {myMentors.map((mentor) => {
              const mentorUser =
                mentor.mentor || mentor.mentorProfile || mentor;

              return (
                <div
                  key={mentor.id || mentorUser?.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <button
                      onClick={() => handleViewProfile(mentorUser)}
                      className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl hover:scale-105 transition-transform cursor-pointer"
                    >
                      {mentorUser?.avatar || "👤"}
                    </button>
                    <div className="flex-1">
                      <button
                        onClick={() => handleViewProfile(mentorUser)}
                        className="font-semibold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer text-left"
                      >
                        {mentorUser?.username || "Unknown User"}
                      </button>
                      <p className="text-sm text-gray-600">
                        {mentorUser?.job_title || "Professional"}
                      </p>
                      <p className="text-xs text-blue-600">
                        {mentorUser?.company || "Company not specified"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Connected{" "}
                          {mentor.connectedSince
                            ? getTimeSince(mentor.connectedSince)
                            : "Recently"}
                        </span>
                      </div>
                      {mentor.matchScore && (
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-500">
                            Match: {mentor.matchScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {mentorUser?.mentor_expertise &&
                    mentorUser.mentor_expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {mentorUser.mentor_expertise
                          .slice(0, 3)
                          .map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                    )}

                  {mentorUser?.mentor_bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {mentorUser.mentor_bio}
                    </p>
                  )}

                  {mentor.message && (
                    <p className="text-sm text-gray-500 italic mb-3">
                      "{mentor.message}"
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleStartChat(mentorUser?.id || "")}
                      className="flex-1 py-2 px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={() => handleViewProfile(mentorUser)}
                      className="py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-500 mb-2">No mentors yet</h3>
            <p className="text-sm text-gray-400 mb-4">
              {hasMenteeProfile
                ? "Request mentorship to get matched with experienced professionals"
                : "Setup your mentee profile first to start requesting mentors"}
            </p>
            {/* Show button inside card when there are NO mentors */}
            <button
              onClick={() => setShowMentorshipRequest(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors mx-auto"
            >
              {buttonIcon}
              {buttonText}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderMyMentees = () => {
    if (loading && !refreshing) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-xl w-40"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <ProfileSkeleton key={i} />
            ))}
          </div>
        </div>
      );
    }

    const hasMentorProfile = profileCheck?.isMentorProfile;
    const hasMentees = myMentees.length > 0;
    const buttonText = hasMentorProfile
      ? "Update Mentor Profile"
      : "Setup Mentor Profile";
    const buttonIcon = hasMentorProfile ? (
      <Award className="w-4 h-4" />
    ) : (
      <UserPlus className="w-4 h-4" />
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Mentees</h2>
            <p className="text-gray-500">Professionals you're guiding</p>
          </div>
          <div className="flex items-center gap-2">
            {/* <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button> */}
            {/* Show button at top-right ONLY when there ARE mentees */}
            {hasMentees && (
              <button
                onClick={() => setShowMentorProfile(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                {buttonIcon}
                {buttonText}
              </button>
            )}
          </div>
        </div>

        {refreshing ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-green-600 mr-2" />
            <span className="text-gray-600">Refreshing mentees...</span>
          </div>
        ) : hasMentees ? (
          <div className="grid gap-4 md:grid-cols-2">
            {myMentees.map((mentee) => {
              const menteeUser =
                mentee.mentee || mentee.menteeProfile || mentee;

              return (
                <div
                  key={mentee.id || menteeUser?.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <button
                      onClick={() => handleViewProfile(menteeUser)}
                      className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl hover:scale-105 transition-transform cursor-pointer"
                    >
                      {menteeUser?.avatar || "👤"}
                    </button>
                    <div className="flex-1">
                      <button
                        onClick={() => handleViewProfile(menteeUser)}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer text-left"
                      >
                        {menteeUser?.username || "Unknown User"}
                      </button>
                      <p className="text-sm text-gray-600">
                        {menteeUser?.job_title || "Professional"}
                      </p>
                      <p className="text-xs text-blue-600">
                        {menteeUser?.company || "Company not specified"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Connected{" "}
                          {mentee.connectedSince
                            ? getTimeSince(mentee.connectedSince)
                            : "Recently"}
                        </span>
                      </div>
                      {mentee.matchScore && (
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-500">
                            Match: {mentee.matchScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {menteeUser?.mentor_expertise &&
                    menteeUser.mentor_expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {menteeUser.mentor_expertise
                          .slice(0, 3)
                          .map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                    )}

                  {menteeUser?.mentor_bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {menteeUser.mentor_bio}
                    </p>
                  )}

                  {mentee.message && (
                    <p className="text-sm text-gray-500 italic mb-3">
                      "{mentee.message}"
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleStartChat(menteeUser?.id || "")}
                      className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={() => handleViewProfile(menteeUser)}
                      className="py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            {hasMentorProfile ? (
              <>
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-500 mb-2">
                  No mentees yet
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Update your mentor profile to start receiving mentorship
                  requests
                </p>
                {/* Show update button inside card when there are NO mentees but HAS mentor profile */}
                <button
                  onClick={() => setShowMentorProfile(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors mx-auto"
                >
                  {buttonIcon}
                  {buttonText}
                </button>
              </>
            ) : (
              <>
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-500 mb-2">
                  Become a Mentor
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Share your experience and help others grow in their careers
                </p>
                {/* Show setup button inside card when there are NO mentees and NO mentor profile */}
                <button
                  onClick={() => setShowMentorProfile(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors mx-auto"
                >
                  {buttonIcon}
                  {buttonText}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFindMentorship = () => <FindMentorshipView />;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Mentorship
            </h1>
            <p className="text-gray-500">Connect, learn, and grow together</p>
          </div>
          <div className="flex items-center gap-3">
            {/* {mentorshipMetrics && mentorshipMetrics.totalUnread > 0 && (
              <div className="relative">
                <Bell className="w-6 h-6 text-purple-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {mentorshipMetrics.totalUnread}
                </span>
              </div>
            )} */}
            <Target className="w-6 h-6 text-purple-600" />
          </div>
        </div>

        {/* Stats Overview
        {mentorshipMetrics && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Total Requests</p>
              <p className="text-xl font-bold text-gray-900">{mentorshipMetrics.total}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {mentorshipMetrics.received.byStatus.pending + mentorshipMetrics.sent.byStatus.pending}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Active</p>
              <p className="text-xl font-bold text-gray-900">
                {mentorshipMetrics.received.byStatus.accepted + mentorshipMetrics.sent.byStatus.accepted}
              </p>
            </div>
          </div>
        )} */}

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveView("mentors")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeView === "mentors"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Mentors
          </button>
          <button
            onClick={() => setActiveView("mentees")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeView === "mentees"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Mentees
          </button>
          <button
            onClick={() => setActiveView("find")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeView === "find"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Find Mentorship
          </button>
        </div>
      </header>

      {/* Content */}
      <div>
        {activeView === "mentors" && renderMyMentors()}
        {activeView === "mentees" && renderMyMentees()}
        {activeView === "find" && renderFindMentorship()}
      </div>

      {/* Modals */}
      <MentorshipUserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        profile={selectedProfile}
        onChat={handleStartChat}
        currentUserId={user?.id}
        context="mentorship-view"
      />

      <MentorshipRequestModal
        isOpen={showMentorshipRequest}
        onClose={() => setShowMentorshipRequest(false)}
        mode={profileCheck?.isMenteeProfile ? "edit" : "create"}
        onProfileUpdated={handleMenteeProfileUpdated}
      />

      <MentorshipProfileModal
        isOpen={showMentorProfile}
        onClose={() => setShowMentorProfile(false)}
        mode={profileCheck?.isMentorProfile ? "edit" : "create"}
        onProfileUpdated={handleMentorProfileUpdated}
      />
    </div>
  );
}