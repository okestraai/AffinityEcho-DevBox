// components/Modals/MentorShipModals/MentorshipProfileModal.tsx
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader, CheckCircle } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  CreateMentorProfile,
  GetMyMentorProfile,
  UpdateMyMentorProfile,
  CheckUserProfileExist,
  GetFilterOptions,
} from "../../../../api/mentorshipApis";
import { DecryptData } from "../../../../api/EncrytionApis";
import { showToast } from "../../../Helper/ShowToast";

interface MentorshipProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  onProfileUpdated?: () => void;
}

export function MentorshipProfileModal({
  isOpen,
  onClose,
  mode = "create",
  onProfileUpdated,
}: MentorshipProfileModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [decryptedCompanyName, setDecryptedCompanyName] = useState("");
  const [decryptedCareerLevel, setDecryptedCareerLevel] = useState("");
  const [decryptedLocation, setDecryptedLocation] = useState("");
  const [decryptedAffinityTags, setDecryptedAffinityTags] = useState<string[]>(
    [],
  );

  const [formData, setFormData] = useState({
    isWillingToMentor: true,
    mentorBio: "",
    expertise: [] as string[],
    industries: [] as string[],
    availability: "",
    mentoringStyle: "",
    languages: [] as string[],
    careerLevel: "",
    location: "",
    affinityTags: [] as string[],
    jobTitle: "",
    company: "",
    yearsExperience: 0,
    bio: "",
    newExpertise: "",
    newIndustry: "",
    newLanguage: "",
    newAffinityTag: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    careerLevels: [] as string[],
    expertiseAreas: [] as string[],
    industries: [] as string[],
    affinityTags: [] as string[],
    availabilityOptions: [] as string[],
    languages: [] as string[],
  });

  useEffect(() => {
    const initializeModal = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        // Run independent calls in parallel
        const [, , profileExists] = await Promise.all([
          fetchFilterOptions(),
          loadUserData(),
          checkProfileStatusAndFetch(),
        ]);

        // This depends on profileExists result
        if (mode === "edit" || profileExists) {
          await fetchMentorProfile();
        }
      } catch (error) {

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


        const encryptedFields = [
          {
            key: "company_encrypted",
            formKey: "company",
            setter: setDecryptedCompanyName,
            type: "string",
          },
          {
            key: "career_level_encrypted",
            formKey: "careerLevel",
            setter: setDecryptedCareerLevel,
            type: "string",
          },
          {
            key: "location_encrypted",
            formKey: "location",
            setter: setDecryptedLocation,
            type: "string",
          },
          {
            key: "affinity_tags_encrypted",
            formKey: "affinityTags",
            setter: setDecryptedAffinityTags,
            type: "array",
          },
        ];

        const decryptedData: Record<string, any> = {};
        const promises = [];

        encryptedFields.forEach((field) => {
          if (currentUser[field.key]) {

            promises.push(
              DecryptData({
                encryptedData: currentUser[field.key],
              })
                .then((result) => ({
                  key: field.formKey,
                  value: result?.decryptedData || "",
                  setter: field.setter,
                  type: field.type,
                }))
                .catch((error) => {

                  return {
                    key: field.formKey,
                    value: "",
                    setter: field.setter,
                    type: field.type,
                  };
                }),
            );
          }
        });

        const results = await Promise.all(promises);
    

        const ensureArray = (value: any): string[] => {

          if (value == null || value === "") return [];
          if (Array.isArray(value)) return value;
          if (typeof value === "string") {
            try {
              const trimmed = value.trim();
           

              // If empty string after trimming
              if (!trimmed) return [];

              // First try to parse as JSON
              if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                try {
                  const parsed = JSON.parse(trimmed);

                  return Array.isArray(parsed) ? parsed : [];
                } catch (jsonError) {
              
                }
              }

              // If it starts and ends with quotes, remove them and try again
              if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                const unquoted = trimmed.slice(1, -1).trim();

                if (unquoted.startsWith("[") && unquoted.endsWith("]")) {
                  try {
                    const parsed = JSON.parse(unquoted);
                    return Array.isArray(parsed) ? parsed : [];
                  } catch (jsonError) {
                   
                  }
                }
              }

              // Try comma-separated
              if (trimmed.includes(",")) {
                return trimmed
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item);
              }

              // Single value
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
          if (result.setter) {
            if (result.key === "company") {
              result.setter(processedValue);
            } else if (result.key === "careerLevel") {
              setDecryptedCareerLevel(processedValue);
            } else if (result.key === "location") {
              setDecryptedLocation(processedValue);
            } else if (result.key === "affinityTags") {
              setDecryptedAffinityTags(processedValue);
            }
          }
        });

        const getStringFromUser = (key: string, defaultValue = ""): string => {
          const value = (currentUser as any)[key];
          if (value == null) return defaultValue;
          if (Array.isArray(value)) {
            return value.length > 0 ? String(value[0]) : defaultValue;
          }
          return String(value);
        };

        

        setFormData((prev) => ({
          ...prev,
          company: decryptedData.company || getStringFromUser("company", ""),
          careerLevel:
            decryptedData.careerLevel || getStringFromUser("career_level", ""),
          affinityTags: Array.isArray(decryptedData.affinityTags)
            ? decryptedData.affinityTags
            : [],
          location: decryptedData.location || getStringFromUser("location", ""),
          jobTitle: getStringFromUser("job_title", ""),
          yearsExperience: currentUser.years_experience || 0,
          bio: getStringFromUser("bio", ""),
        }));
      }
    } catch (err) {

      showToast("Error loading user data", "error");
    }
  };

  const checkProfileStatusAndFetch = async () => {
    try {
      const profileCheckResponse = await CheckUserProfileExist();

      const profileData = profileCheckResponse;

     

      // Check if user has mentor profile in the new structure
      const hasMentorProfile = profileData?.mentorProfile !== undefined;
      const hasMenteeProfile = profileData?.menteeProfile !== undefined;
      const isActiveMentor = profileData?.mentorProfile?.isActive || false;
      const isActiveMentee = profileData?.menteeProfile?.isActive || false;
      const mentoringAs = profileData?.status?.mentoringAs || "none";

      // Determine if user has a profile (mentor profile exists)
      const profileExists = hasMentorProfile;

      setHasProfile(!!profileExists);

      if (profileExists && profileData.id) {
        setProfileId(profileData.id);
      }

      return profileExists;
    } catch (error) {
   
      return false;
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await GetFilterOptions();
      if (response) {
        setFilterOptions(response);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchMentorProfile = async () => {
    try {
      const response = await GetMyMentorProfile();

      // Get mentor profile from response
      const mentorProfile = response?.mentorProfile || {};
      const basicProfile = response?.basicProfile || {};

  
      setFormData((prev) => ({
        ...prev,
        isWillingToMentor: mentorProfile.isWillingToMentor ?? true,
        mentorBio: mentorProfile.bio || "",
        expertise: Array.isArray(mentorProfile.expertise)
          ? mentorProfile.expertise
          : [],
        industries: Array.isArray(mentorProfile.industries)
          ? mentorProfile.industries
          : [],
        availability: mentorProfile.availability || "",
        mentoringStyle: mentorProfile.mentorStyle || mentorProfile.style || "",
        languages: Array.isArray(mentorProfile.languages)
          ? mentorProfile.languages
          : [],
        jobTitle: basicProfile.jobTitle || prev.jobTitle,
        yearsExperience: basicProfile.yearsExperience || prev.yearsExperience,
        bio: basicProfile.bio || prev.bio,
        location: basicProfile.location || prev.location,
        // Use affinity tags from basicProfile if available, otherwise keep existing
        affinityTags: Array.isArray(basicProfile.affinityTags)
          ? basicProfile.affinityTags
          : prev.affinityTags,
        newExpertise: "",
        newIndustry: "",
        newLanguage: "",
        newAffinityTag: "",
      }));
    } catch (error) {
      console.error("Error fetching mentor profile:", error);
      showToast("Could not load profile data", "error");
    }
  };

  const addItem = (
    field: "expertise" | "industries" | "languages" | "affinityTags",
    newField: string,
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
    field: "expertise" | "industries" | "languages" | "affinityTags",
    item: string,
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
        isWillingToMentor: formData.isWillingToMentor,
        mentorBio: formData.mentorBio,
        expertise: formData.expertise,
        industries: formData.industries,
        availability: formData.availability,
        mentoringStyle: formData.mentoringStyle,
        languages: formData.languages,
        careerLevel: currentUser?.career_level_encrypted,
        location: formData.location,
        affinityTags: currentUser?.affinity_tags_encrypted || "", // Send encrypted string
        jobTitle: formData.jobTitle,
        company: currentUser?.company_encrypted,
        yearsExperience: formData.yearsExperience,
        bio: formData.bio,
      };

      if (hasProfile || mode === "edit") {
        await UpdateMyMentorProfile(payload);
      } else {
        await CreateMentorProfile(payload);
      }

      showToast(
        `Mentor profile ${
          hasProfile || mode === "edit" ? "updated" : "created"
        } successfully!`,
        "success",
      );

      // Call the callback if provided instead of reloading
      if (onProfileUpdated) {
        onProfileUpdated();
      }

      onClose();
    } catch (error: any) {
      console.error("Error saving mentor profile:", error);
      showToast(
        error.response?.data?.message ||
          "Error saving mentor profile. Please try again.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-full sm:max-w-2xl md:max-w-4xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <Loader className="w-8 h-8 text-purple-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading profile data...</span>
          </div>
        </div>
      </div>
    );
  }

  const isUpdateMode = mode === "edit" || hasProfile;
  const modalTitle = isUpdateMode
    ? "Update Mentor Profile"
    : "Setup Mentor Profile";
  const submitButtonText = isUpdateMode ? "Update Profile" : "Create Profile";
  const modalDescription = isUpdateMode
    ? "Update your mentor profile information"
    : "Share your expertise and help others grow";

  // Use decryptedAffinityTags for display
  const displayAffinityTags =
    formData.affinityTags.length > 0
      ? formData.affinityTags
      : decryptedAffinityTags;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-full sm:max-w-2xl md:max-w-4xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {modalTitle}
            </h3>
            <p className="text-sm text-gray-500">{modalDescription}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-6">
            {/* Mentor Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mentor Bio *
              </label>
              <textarea
                value={formData.mentorBio}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mentorBio: e.target.value,
                  }))
                }
                placeholder="Describe your mentoring approach, what you can offer, and your experience..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                required
              />
            </div>

            {/* Expertise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Expertise *
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.expertise.map((exp) => (
                  <span
                    key={exp}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full"
                  >
                    {exp}
                    <button
                      type="button"
                      onClick={() => removeItem("expertise", exp)}
                      className="text-purple-500 hover:text-purple-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industries You Mentor In *
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                Availability *
              </label>
              <select
                value={formData.availability}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    availability: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select availability</option>
                {filterOptions.availabilityOptions?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Mentoring Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mentoring Style
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
                placeholder="e.g., Structured, Casual, Goal-oriented, Hands-on"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages You Mentor In *
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeItem("languages", lang)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
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
                placeholder="e.g., New York, NY or Remote"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
                }
                placeholder="e.g., Senior Software Engineer, Product Manager"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                value={formData.yearsExperience}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    yearsExperience: parseInt(e.target.value) || 0,
                  }))
                }
                min="0"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
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
                placeholder="Tell us more about yourself..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Read-only fields from context */}
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                From Your Profile (Read Only)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="text-sm font-medium text-gray-900">
                    {decryptedCompanyName || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Career Level</p>
                  <p className="text-sm font-medium text-gray-900">
                    {decryptedCareerLevel || "Not set"}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Affinity Groups</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {displayAffinityTags.length > 0 ? (
                      displayAffinityTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">
                        No affinity groups set
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
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
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
