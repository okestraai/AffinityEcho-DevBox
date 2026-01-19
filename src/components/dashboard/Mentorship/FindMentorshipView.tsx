// components/Views/Mentorship/FindMentorshipView.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  X,
  Star,
  MapPin,
  Briefcase,
  Award,
  MessageCircle,
  Target,
  Users,
  Loader,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { MentorshipUserProfileModal } from "../../Modals/MentorShipModals/MentorshipUserProfileModal";
import { DirectMentorshipRequestModal } from "../../Modals/MentorShipModals/DirectMentorshipRequestModal";
import { MentorshipProfileModal } from "../../Modals/MentorShipModals/MentorshipProfileModal";
import { MentorshipRequestModal } from "../../Modals/MentorShipModals/MentorshipRequestModal";
import {
  GetMentorsAndMentees,
  GetFilterOptions,
  CheckUserProfileExist,
} from "../../../../api/mentorshipApis";
import { DecryptData } from "../../../../api/EncrytionApis";
import { useNavigate } from "react-router-dom";

interface MentorProfile {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  company?: string;
  jobTitle: string;
  job_title?: string;
  careerLevel: string;
  location?: string;
  expertise: string[];
  mentor_expertise?: string[];
  industries: string[];
  mentor_industries?: string[];
  mentoringAs?: "mentor" | "mentee" | "both";
  availability: string;
  mentor_availability?: string;
  responseTime?: string;
  matchScore?: number;
  isAvailable: boolean;
  totalMentees?: number;
  yearsOfExperience?: number;
  years_experience?: number;
  affinityTags: string[];
  mentorshipStyle?: string;
  mentor_style?: string;
  languages?: string[];
  company_encrypted?: string;
  career_level_encrypted?: string;
  affinity_tags_encrypted?: string;
}

export function FindMentorshipView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<MentorProfile | null>(
    null
  );
  const [showMentorshipRequest, setShowMentorshipRequest] = useState(false);
  const [showMentorProfile, setShowMentorProfile] = useState(false);
  const [showMenteeProfile, setShowMenteeProfile] = useState(false);
  const [viewMode, setViewMode] = useState<"mentors" | "mentees" | "all">(
    "mentors"
  );
  const [requestType, setRequestType] = useState<"mentor" | "mentee">("mentor");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileCheck, setProfileCheck] = useState<{
    hasProfile: boolean;
    profileType?: string;
  } | null>(null);

  const [profiles, setProfiles] = useState<MentorProfile[]>([]);
  const [decryptedProfiles, setDecryptedProfiles] = useState<MentorProfile[]>(
    []
  );

  const [filters, setFilters] = useState({
    careerLevel: [] as string[],
    expertise: [] as string[],
    industries: [] as string[],
    availabilityOptions: [] as string[],
    affinityTags: [] as string[],
    location: "",
    mentoringAs: "all" as "all" | "mentor" | "mentee" | "both",
  });

  const [filterOptions, setFilterOptions] = useState({
    careerLevels: [] as string[],
    expertiseAreas: [] as string[],
    industries: [] as string[],
    affinityTags: [] as string[],
    availabilityOptions: [] as string[],
    languages: [] as string[],
  });

  // Fetch initial data
  useEffect(() => {
    checkProfileStatus();
    fetchFilterOptions();
    fetchProfiles();
  }, []);

  // Fetch profiles when viewMode or filters change
  useEffect(() => {
    fetchProfiles();
  }, [viewMode, filters]);

  const checkProfileStatus = async () => {
    try {
      const response = await CheckUserProfileExist();

      let profileData = response.data;

      if (profileData?.success && profileData?.data) {
        profileData = profileData.data;
      }

      if (profileData?.data?.hasProfile !== undefined) {
        profileData = profileData.data;
      }

      setProfileCheck({
        hasProfile: profileData?.hasProfile || false,
        profileType: profileData?.profileType,
      });
    } catch (error) {
      console.error("Error checking profile status:", error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await GetFilterOptions();
      setFilterOptions(response.data.data);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchProfiles = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const apiFilters = {
        viewMode: viewMode === "all" ? undefined : viewMode,
        search: searchTerm || undefined,
        careerLevel:
          filters.careerLevel.length > 0 ? filters.careerLevel : undefined,
        expertise: filters.expertise.length > 0 ? filters.expertise : undefined,
        industries:
          filters.industries.length > 0 ? filters.industries : undefined,
        affinityTags:
          filters.affinityTags.length > 0 ? filters.affinityTags : undefined,
        location: filters.location || undefined,
        availability:
          filters.availabilityOptions.length > 0
            ? filters.availabilityOptions
            : undefined,
        sortOrder: "desc" as const,
        limit: 20,
      };

      const response = await GetMentorsAndMentees(apiFilters);

      let profilesData: any[] = [];

      if (response && response.data) {
        const outerData = response.data;

        if (outerData && outerData.data) {
          const innerData = outerData.data;

          if (innerData.profiles && Array.isArray(innerData.profiles)) {
            profilesData = innerData.profiles;
          } else if (Array.isArray(innerData)) {
            profilesData = innerData;
          }
        } else if (outerData.profiles && Array.isArray(outerData.profiles)) {
          profilesData = outerData.profiles;
        } else if (Array.isArray(outerData)) {
          profilesData = outerData;
        }
      }

      if (
        profilesData.length === 0 &&
        response.profiles &&
        Array.isArray(response.profiles)
      ) {
        profilesData = response.profiles;
      }

      setProfiles(profilesData);

      const profilesWithDecryption = await Promise.all(
        profilesData.map(async (profile: any) => {
          try {
            const decryptedProfile = { ...profile };

            decryptedProfile.jobTitle =
              profile.job_title || profile.jobTitle || "";
            decryptedProfile.company = profile.company || "";
            decryptedProfile.careerLevel =
              profile.career_level || profile.careerLevel || "";
            decryptedProfile.expertise =
              profile.mentor_expertise || profile.expertise || [];
            decryptedProfile.industries =
              profile.mentor_industries || profile.industries || [];
            decryptedProfile.availability =
              profile.mentor_availability || profile.availability || "";
            decryptedProfile.mentoringAs =
              profile.mentoring_as || profile.mentoringAs;
            decryptedProfile.affinityTags =
              profile.affinity_tags || profile.affinityTags || [];

            if (profile.company_encrypted) {
              try {
                const companyResult = await DecryptData({
                  encryptedData: profile.company_encrypted,
                });
                decryptedProfile.company =
                  companyResult.data?.decryptedData || decryptedProfile.company;
              } catch (decryptError) {
                console.error("Error decrypting company:", decryptError);
              }
            }

            if (profile.career_level_encrypted) {
              try {
                const careerResult = await DecryptData({
                  encryptedData: profile.career_level_encrypted,
                });
                decryptedProfile.careerLevel =
                  careerResult.data?.decryptedData ||
                  decryptedProfile.careerLevel;
              } catch (decryptError) {
                console.error("Error decrypting career level:", decryptError);
              }
            }

            if (profile.affinity_tags_encrypted) {
              try {
                const tagsResult = await DecryptData({
                  encryptedData: profile.affinity_tags_encrypted,
                });
                if (tagsResult.data?.decryptedData) {
                  if (typeof tagsResult.data.decryptedData === "string") {
                    try {
                      decryptedProfile.affinityTags = JSON.parse(
                        tagsResult.data.decryptedData
                      );
                    } catch {
                      decryptedProfile.affinityTags =
                        tagsResult.data.decryptedData
                          .split(",")
                          .map((tag: string) => tag.trim());
                    }
                  } else if (Array.isArray(tagsResult.data.decryptedData)) {
                    decryptedProfile.affinityTags =
                      tagsResult.data.decryptedData;
                  }
                }
              } catch (decryptError) {
                console.error("Error decrypting affinity tags:", decryptError);
              }
            }

            return decryptedProfile;
          } catch (error) {
            console.error("Error decrypting profile:", error);
            return profile;
          }
        })
      );

      setDecryptedProfiles(profilesWithDecryption);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      setProfiles([]);
      setDecryptedProfiles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredProfiles = useMemo(() => {
    let filtered = decryptedProfiles;

    if (viewMode !== "all") {
      filtered = filtered.filter((profile) => {
        if (viewMode === "mentors") {
          return (
            profile.mentoringAs === "mentor" || profile.mentoringAs === "both"
          );
        } else {
          return (
            profile.mentoringAs === "mentee" || profile.mentoringAs === "both"
          );
        }
      });
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (profile) =>
          profile.username.toLowerCase().includes(search) ||
          profile.bio.toLowerCase().includes(search) ||
          (profile.company && profile.company.toLowerCase().includes(search)) ||
          (profile.jobTitle &&
            profile.jobTitle.toLowerCase().includes(search)) ||
          (profile.expertise &&
            Array.isArray(profile.expertise) &&
            profile.expertise.some((exp) => exp.toLowerCase().includes(search)))
      );
    }

    if (filters.careerLevel.length > 0) {
      filtered = filtered.filter(
        (profile) =>
          profile.careerLevel &&
          filters.careerLevel.includes(profile.careerLevel)
      );
    }

    if (filters.expertise.length > 0) {
      filtered = filtered.filter(
        (profile) =>
          profile.expertise &&
          Array.isArray(profile.expertise) &&
          filters.expertise.some(
            (exp) =>
              Array.isArray(profile.expertise) &&
              profile.expertise.includes(exp)
          )
      );
    }

    if (filters.industries.length > 0) {
      filtered = filtered.filter(
        (profile) =>
          profile.industries &&
          Array.isArray(profile.industries) &&
          filters.industries.some(
            (ind) =>
              Array.isArray(profile.industries) &&
              profile.industries.includes(ind)
          )
      );
    }

    if (filters.affinityTags.length > 0) {
      filtered = filtered.filter(
        (profile) =>
          profile.affinityTags &&
          Array.isArray(profile.affinityTags) &&
          filters.affinityTags.some(
            (tag) =>
              Array.isArray(profile.affinityTags) &&
              profile.affinityTags.includes(tag)
          )
      );
    }

    if (filters.location) {
      filtered = filtered.filter((profile) =>
        profile.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    return filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [decryptedProfiles, searchTerm, filters, viewMode]);

  const toggleFilter = (filterType: string, value: string) => {
    setFilters((prev) => {
      const filterKey = filterType as keyof typeof filters;
      if (filterKey === "location" || filterKey === "mentoringAs") {
        return { ...prev, [filterKey]: value };
      }

      const currentValues = prev[filterKey] as string[];
      if (Array.isArray(currentValues)) {
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value];
        return { ...prev, [filterKey]: newValues };
      }
      return prev;
    });
  };

  const clearFilters = () => {
    setFilters({
      careerLevel: [],
      expertise: [],
      industries: [],
      availabilityOptions: [],
      affinityTags: [],
      location: "",
      mentoringAs: "all",
    });
  };

  const handleSearch = useCallback(() => {
    fetchProfiles();
  }, [searchTerm, filters, viewMode]);

  const handleRefresh = () => {
    fetchProfiles(true);
  };

  const activeFilterCount =
    filters.careerLevel.length +
    filters.expertise.length +
    filters.industries.length +
    filters.affinityTags.length +
    filters.availabilityOptions.length +
    (filters.location ? 1 : 0);

  const handleUserClick = (userId: string) => {
    const profile = filteredProfiles.find((p) => p.id === userId);
    if (profile) {
      setSelectedProfile(profile);
      setSelectedUserId(userId);
      setShowUserProfile(true);
    }
  };

  const handleRequestMentorship = (
    userId: string,
    type: "mentor" | "mentee"
  ) => {
    const profile = filteredProfiles.find((p) => p.id === userId);
    if (profile) {
      setSelectedProfile(profile);
      setSelectedUserId(userId);
      setRequestType(type);
      setShowMentorshipRequest(true);
    }
  };

  const handleSetupProfile = () => {
    if (viewMode === "mentors") {
      setShowMenteeProfile(true);
    } else {
      setShowMentorProfile(true);
    }
  };

  const handleProfileUpdated = () => {
    // Refresh profiles after profile is created/updated
    fetchProfiles(true);
    // Re-check profile status
    checkProfileStatus();
  };

  const ProfileSkeleton = () => (
    <div className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-14"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Find Mentorship
            </h2>
            <p className="text-gray-600">
              Discover mentors and mentees to connect with
            </p>
          </div>
          {/* <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button> */}
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setViewMode("mentors");
              setSearchTerm("");
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "mentors"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Find Mentors
          </button>
          <button
            onClick={() => {
              setViewMode("mentees");
              setSearchTerm("");
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "mentees"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Find Mentees
          </button>
          <button
            onClick={() => {
              setViewMode("all");
              setSearchTerm("");
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "all"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            View All
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, company, expertise, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filter Profiles</h3>
              <div className="flex gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Career Level
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.careerLevels.map((level) => (
                    <label
                      key={level}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.careerLevel.includes(level)}
                        onChange={() => toggleFilter("careerLevel", level)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expertise
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.expertiseAreas.map((exp) => (
                    <label
                      key={exp}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.expertise.includes(exp)}
                        onChange={() => toggleFilter("expertise", exp)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{exp}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industries
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.industries.map((ind) => (
                    <label
                      key={ind}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.industries.includes(ind)}
                        onChange={() => toggleFilter("industries", ind)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{ind}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.availabilityOptions.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.availabilityOptions.includes(opt)}
                        onChange={() =>
                          toggleFilter("availabilityOptions", opt)
                        }
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affinity Groups
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.affinityTags.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.affinityTags.includes(tag)}
                        onChange={() => toggleFilter("affinityTags", tag)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Search by city or state..."
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        {loading ? (
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        ) : (
          <p className="text-sm text-gray-600">
            Found{" "}
            <span className="font-semibold text-gray-900">
              {filteredProfiles.length}
            </span>{" "}
            {viewMode === "mentors"
              ? "mentors"
              : viewMode === "mentees"
              ? "mentees"
              : "profiles"}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <ProfileSkeleton key={i} />
          ))}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">No profiles found</h3>
          <p className="text-sm text-gray-500 mb-4">
            Try adjusting your filters or search terms
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <button
                  onClick={() => handleUserClick(profile.id)}
                  className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center text-3xl hover:scale-105 transition-transform cursor-pointer"
                >
                  {profile.avatar || "👤"}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => handleUserClick(profile.id)}
                      className="font-semibold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer truncate"
                    >
                      {profile.username}
                    </button>
                    {profile.matchScore && (
                      <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full flex-shrink-0">
                        <Star className="w-3 h-3 text-green-600 fill-green-600" />
                        <span className="text-xs text-green-700 font-medium">
                          {profile.matchScore}%
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-1">
                    {profile.jobTitle || profile.job_title || ""}
                  </p>
                  <p className="text-xs text-blue-600 mb-2">
                    {profile.company}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {profile.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {profile.careerLevel}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 line-clamp-2 leading-relaxed">
                {profile.bio}
              </p>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {(profile.expertise && Array.isArray(profile.expertise)
                    ? profile.expertise.slice(0, 3)
                    : []
                  ).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {profile.expertise &&
                    Array.isArray(profile.expertise) &&
                    profile.expertise.length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{profile.expertise.length - 3} more
                      </span>
                    )}
                </div>
              </div>

              {profile.affinityTags &&
                Array.isArray(profile.affinityTags) &&
                profile.affinityTags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {profile.affinityTags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {profile.availability ||
                    profile.mentor_availability ||
                    "Contact to discuss"}
                </div>
                {profile.mentoringAs && (
                  <span
                    className={`px-2 py-1 rounded-full font-medium ${
                      profile.mentoringAs === "mentor"
                        ? "bg-purple-100 text-purple-700"
                        : profile.mentoringAs === "mentee"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {profile.mentoringAs === "mentor"
                      ? "Offering mentorship"
                      : profile.mentoringAs === "mentee"
                      ? "Seeking mentorship"
                      : "Open to both"}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUserClick(profile.id)}
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    if (!profileCheck?.hasProfile) {
                      handleSetupProfile();
                    } else {
                      handleRequestMentorship(
                        profile.id,
                        profile.mentoringAs === "mentee" ? "mentee" : "mentor"
                      );
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg transition-colors text-sm font-medium ${
                    profile.mentoringAs === "mentor" ||
                    profile.mentoringAs === "both"
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {!profileCheck?.hasProfile ? (
                      <>
                        <UserPlus className="w-3 h-3" />
                        Setup Profile
                      </>
                    ) : profile.mentoringAs === "mentor" ||
                      profile.mentoringAs === "both" ? (
                      <>
                        <UserPlus className="w-3 h-3" />
                        Request Mentor
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-3 h-3" />
                        Offer to Mentor
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MentorshipUserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        profile={selectedProfile}
        onChat={(userId: string) => {
          navigate(`/dashboard/messages?user=${userId}`);
        }}
        currentUserId={user?.id}
        context="find-mentorship"
      />

      <DirectMentorshipRequestModal
        isOpen={showMentorshipRequest}
        onClose={() => setShowMentorshipRequest(false)}
        profile={selectedProfile}
        requestType={requestType}
      />

      <MentorshipProfileModal
        isOpen={showMentorProfile}
        onClose={() => setShowMentorProfile(false)}
        mode={profileCheck?.profileType === "mentor" ? "edit" : "create"}
        onProfileUpdated={handleProfileUpdated}
      />

      <MentorshipRequestModal
        isOpen={showMenteeProfile}
        onClose={() => setShowMenteeProfile(false)}
        mode={profileCheck?.profileType === "mentee" ? "edit" : "create"}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}
