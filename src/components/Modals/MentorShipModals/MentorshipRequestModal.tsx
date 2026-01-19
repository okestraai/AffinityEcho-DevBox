// components/Modals/MentorShipModals/MentorshipRequestModal.tsx
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader, CheckCircle } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  CreateMenteeProfile,
  GetMyMenteeProfile,
  UpdateMyMenteeProfile,
  CheckUserProfileExist,
  GetFilterOptions,
} from "../../../../api/mentorshipApis";
import { DecryptData } from "../../../../api/EncrytionApis";
import { showToast } from "../../../Helper/ShowToast";

interface MentorshipRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  onProfileUpdated?: () => void;
}

export function MentorshipRequestModal({
  isOpen,
  onClose,
  mode = "create",
  onProfileUpdated,
}: MentorshipRequestModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [decryptedCompanyName, setDecryptedCompanyName] = useState("");
  const [decryptedCareerLevel, setDecryptedCareerLevel] = useState("");
  const [decryptedLocation, setDecryptedLocation] = useState("");
  const [decryptedAffinityTags, setDecryptedAffinityTags] = useState<string[]>(
    []
  );

  const [formData, setFormData] = useState({
    topic: "",
    goals: "",
    availability: "",
    communicationMethod: "",
    urgency: "low" as "low" | "medium" | "high",
    jobTitle: "",
    company: "",
    yearsOfExperience: 0,
    location: "",
    careerLevel: "",
    bio: "",
    affinityTags: [] as string[],
    languages: [] as string[],
    mentoringStyle: "",
    industries: [] as string[],
    expertise: [] as string[],
    newLanguage: "",
    newIndustry: "",
    newExpertise: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    careerLevels: [] as string[],
    expertiseAreas: [] as string[],
    industries: [] as string[],
    affinityTags: [] as string[],
    availabilityOptions: [] as string[],
    communicationMethods: [] as string[],
    languages: [] as string[],
  });

  useEffect(() => {
    const initializeModal = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        // Fetch filter options first
        await fetchFilterOptions();

        // Load and decrypt user data
        await loadUserData();

        // Check profile status
        const profileExists = await checkProfileStatusAndFetch();

        // If in edit mode or profile exists, fetch profile
        if (mode === "edit" || profileExists) {
          await fetchMenteeProfile();
        }
      } catch (error) {
        console.error("Error initializing modal:", error);
        showToast("Error loading profile data", "error");
      } finally {
        setLoading(false);
      }
    };

    initializeModal();
  }, [isOpen, mode, currentUser]);

  const loadUserData = async () => {
    try {
      if (currentUser) {
        // Decrypt company
        if (currentUser.company_encrypted) {
          try {
            const companyResult = await DecryptData({
              encryptedData: currentUser.company_encrypted,
            });
            setDecryptedCompanyName(companyResult.data?.decryptedData || "");
          } catch (error) {
            console.error("Error decrypting company:", error);
          }
        }

        // Decrypt career level
        if (currentUser.career_level_encrypted) {
          try {
            const careerResult = await DecryptData({
              encryptedData: currentUser.career_level_encrypted,
            });
            setDecryptedCareerLevel(careerResult.data?.decryptedData || "");
          } catch (error) {
            console.error("Error decrypting career level:", error);
          }
        }

        // Decrypt location
        if (currentUser.location_encrypted) {
          try {
            const locationResult = await DecryptData({
              encryptedData: currentUser.location_encrypted,
            });
            setDecryptedLocation(locationResult.data?.decryptedData || "");
          } catch (error) {
            console.error("Error decrypting location:", error);
          }
        }

        // Decrypt affinity tags
        if (currentUser.affinity_tags_encrypted) {
          try {
            const tagsResult = await DecryptData({
              encryptedData: currentUser.affinity_tags_encrypted,
            });
            if (tagsResult.data?.decryptedData) {
              if (typeof tagsResult.data.decryptedData === "string") {
                try {
                  const parsedTags = JSON.parse(tagsResult.data.decryptedData);
                  setDecryptedAffinityTags(
                    Array.isArray(parsedTags) ? parsedTags : [parsedTags]
                  );
                } catch {
                  setDecryptedAffinityTags(
                    tagsResult.data.decryptedData
                      .split(",")
                      .map((tag: string) => tag.trim())
                      .filter((tag: string) => tag)
                  );
                }
              } else if (Array.isArray(tagsResult.data.decryptedData)) {
                setDecryptedAffinityTags(tagsResult.data.decryptedData);
              }
            }
          } catch (error) {
            console.error("Error decrypting affinity tags:", error);
          }
        }

        // Set form data from user profile
        setFormData((prev) => ({
          ...prev,
          jobTitle: currentUser.job_title || prev.jobTitle,
          yearsOfExperience:
            currentUser.years_experience || prev.yearsOfExperience,
          bio: currentUser.bio || prev.bio,
          location: decryptedLocation || prev.location,
          careerLevel: decryptedCareerLevel || prev.careerLevel,
          affinityTags: decryptedAffinityTags,
          company: decryptedCompanyName,
        }));
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      showToast("Error loading user data", "error");
    }
  };

  const checkProfileStatusAndFetch = async () => {
    try {
      const profileCheckResponse = await CheckUserProfileExist();

      let profileData = profileCheckResponse.data;
      if (profileData?.success && profileData?.data) {
        profileData = profileData.data;
      }
      if (profileData?.data?.hasProfile !== undefined) {
        profileData = profileData.data;
      }

      const profileExists =
        profileData?.hasProfile && profileData.profileType === "mentee";

      setHasProfile(!!profileExists);

      if (profileExists && profileData.profileId) {
        setProfileId(profileData.profileId);
      }

      return profileExists;
    } catch (error) {
      console.error("Error checking profile:", error);
      return false;
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await GetFilterOptions();
      if (response.data?.data) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchMenteeProfile = async () => {
    try {
      const response = await GetMyMenteeProfile();

      if (response.data?.data) {
        const profile = response.data.data.menteeProfile || {};

        setFormData((prev) => ({
          ...prev,
          topic: profile.topic || "",
          goals: profile.goals || "",
          availability: profile.availability || "",
          communicationMethod: profile.communicationMethod || "",
          urgency: profile.urgency || "low",
          jobTitle: profile.jobTitle || prev.jobTitle,
          yearsOfExperience:
            profile.yearsOfExperience || prev.yearsOfExperience,
          bio: profile.bio || prev.bio,
          location: profile.location || prev.location,
          languages: Array.isArray(profile.languages) ? profile.languages : [],
          mentoringStyle: profile.mentoringStyle || "",
          industries: Array.isArray(profile.industries)
            ? profile.industries
            : [],
          expertise: Array.isArray(profile.expertise) ? profile.expertise : [],
          newLanguage: "",
          newIndustry: "",
          newExpertise: "",
        }));
      }
    } catch (error) {
      console.error("Error fetching mentee profile:", error);
      showToast("Could not load profile data", "error");
    }
  };

  const addItem = (
    field: "languages" | "industries" | "expertise",
    newField: string
  ) => {
    const newItem = formData[newField as keyof typeof formData] as string;
    if (newItem.trim() && !formData[field].includes(newItem.trim())) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], newItem.trim()],
        [newField]: "",
      }));
    }
  };

  const removeItem = (
    field: "languages" | "industries" | "expertise",
    item: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((i) => i !== item),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        topic: formData.topic,
        goals: formData.goals,
        availability: formData.availability,
        communicationMethod: formData.communicationMethod,
        urgency: formData.urgency,
        jobTitle: formData.jobTitle,
        company: currentUser?.company_encrypted,
        yearsOfExperience: formData.yearsOfExperience,
        location: formData.location,
        careerLevel: currentUser?.career_level_encrypted,
        bio: formData.bio,
        affinityTags: currentUser?.affinity_tags_encrypted,
        languages: formData.languages,
        mentoringStyle: formData.mentoringStyle,
        industries: formData.industries,
        expertise: formData.expertise,
      };

      let response;

      if (hasProfile || mode === "edit") {
        response = await UpdateMyMenteeProfile(payload);
      } else {
        response = await CreateMenteeProfile(payload);
      }

      if (response.success) {
        showToast(
          `Mentee profile ${
            hasProfile || mode === "edit" ? "updated" : "created"
          } successfully!`,
          "success"
        );

        // Call the callback if provided instead of reloading
        if (onProfileUpdated) {
          onProfileUpdated();
        }

        onClose();
      }
    } catch (error: any) {
      console.error("Error saving mentee profile:", error);
      showToast(
        error.response?.data?.message ||
          "Error saving mentee profile. Please try again.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading profile data...</span>
          </div>
        </div>
      </div>
    );
  }

  const isUpdateMode = mode === "edit" || hasProfile;
  const modalTitle = isUpdateMode
    ? "Update Mentee Profile"
    : "Setup Mentee Profile";
  const submitButtonText = isUpdateMode ? "Update Profile" : "Create Profile";
  const modalDescription = isUpdateMode
    ? "Update your mentee profile information"
    : "Tell us what you're looking for in a mentorship";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {modalTitle}
            </h3>
            <p className="text-sm text-gray-500">{modalDescription}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          
          <div className="space-y-6">
             {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Job Title *
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
                }
                placeholder="e.g., Software Engineer, Marketing Analyst, Product Manager"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What topics are you seeking mentorship on? *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, topic: e.target.value }))
                }
                placeholder="e.g., Career advancement, Technical skills, Leadership, Career transition"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are your specific goals? *
              </label>
              <textarea
                value={formData.goals}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, goals: e.target.value }))
                }
                placeholder="Describe what you hope to achieve through mentorship... (e.g., Get promoted, Learn new skills, Navigate career change)"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                required
              />
            </div>

            {/* Years of Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience *
              </label>
              <input
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    yearsOfExperience: parseInt(e.target.value) || 0,
                  }))
                }
                min="0"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="e.g., New York, NY "
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Expertise Areas Interested In */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Expertise You Want to Develop *
              </label>
              <div className="flex gap-2 mb-3">
                <select
                  value={formData.newExpertise}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newExpertise: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select expertise area</option>
                  {filterOptions?.expertiseAreas?.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addItem("expertise", "newExpertise")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.expertise.map((exp) => (
                  <span
                    key={exp}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                  >
                    {exp}
                    <button
                      type="button"
                      onClick={() => removeItem("expertise", exp)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Industries Interested In */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industries of Interest *
              </label>
              <div className="flex gap-2 mb-3">
                <select
                  value={formData.newIndustry}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newIndustry: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select industry</option>
                  {filterOptions.industries?.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addItem("industries", "newIndustry")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.industries.map((ind) => (
                  <span
                    key={ind}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full"
                  >
                    {ind}
                    <button
                      type="button"
                      onClick={() => removeItem("industries", ind)}
                      className="text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability for Mentorship Sessions *
              </label>
              <select
                value={formData.availability}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    availability: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select your availability</option>
                {filterOptions.availabilityOptions?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Communication Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Communication Method *
              </label>
              <select
                value={formData.communicationMethod}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    communicationMethod: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select preferred method</option>
                {filterOptions.communicationMethods?.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <select
                value={formData.urgency}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, urgency: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="low">
                  Low - General guidance and long-term growth
                </option>
                <option value="medium">
                  Medium - Specific goals within 3-6 months
                </option>
                <option value="high">
                  High - Urgent decisions or immediate challenges
                </option>
              </select>
            </div>

            {/* Preferred Mentoring Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Mentoring Style
              </label>
              <input
                type="text"
                value={formData.mentoringStyle}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mentoringStyle: e.target.value,
                  }))
                }
                placeholder="e.g., Structured sessions, Casual check-ins, Goal-oriented, Hands-on guidance"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages You're Comfortable With *
              </label>
              <div className="flex gap-2 mb-3">
                <select
                  value={formData.newLanguage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newLanguage: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select language</option>
                  {filterOptions.languages?.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addItem("languages", "newLanguage")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeItem("languages", lang)}
                      className="text-purple-500 hover:text-purple-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* General Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Tell us more about yourself, your interests, and what makes you unique..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Read-only fields from context */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                From Your Profile (Automatically Populated)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="text-sm font-medium text-gray-900">
                    {decryptedCompanyName || "Not set in profile"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Career Level</p>
                  <p className="text-sm font-medium text-gray-900">
                    {decryptedCareerLevel || "Not set in profile"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Affinity Groups</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {decryptedAffinityTags.length > 0 ? (
                      decryptedAffinityTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">
                        No affinity groups set in profile
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {submitButtonText}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
