// src/components/Modals/CreateTopicModal.tsx - NO PAGE RELOAD VERSION
import React, { useState, useEffect } from "react";
import {
  X,
  Link as LinkIcon,
  AlertCircle,
  Globe,
  Building,
  Hash,
  Tag,
  ChevronDown,
  Users,
  Globe as GlobeIcon,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  CreateForumTopic,
  GetUserJoinedForums,
} from "../../../../api/forumApis";
import { DecryptData } from "../../../../api/EncrytionApis";
import { showToast } from "../../../Helper/ShowToast";
import { useNavigate } from "react-router-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTopicCreated?: () => Promise<void>; // NEW: Callback to refresh topics
  forumName?: string;
  forumId?: string;
  companyId?: string;
}

export function CreateTopicModal({
  isOpen,
  onClose,
  onTopicCreated,
  forumName,
  forumId,
  companyId,
}: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [scope, setScope] = useState<"local" | "global">("local");
  const [selectedForumId, setSelectedForumId] = useState(forumId || "");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const navigate = useNavigate();
  // API State
  const [decryptedCompanyName, setDecryptedCompanyName] = useState<string>("");
  const [companyType, setCompanyType] = useState<string>("");
  const [availableForums, setAvailableForums] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allJoinedForums, setAllJoinedForums] = useState<any[]>([]);

  // Decrypt company name and get company type
  useEffect(() => {
    const decryptCompanyName = async () => {
      try {
        if (user?.company_encrypted) {
          const result = await DecryptData({
            encryptedData: user.company_encrypted,
          });
          setDecryptedCompanyName(result.data.decryptedData);
          setCompanyType(user.company_type || "");
        }
      } catch (err) {
        console.error("Error decrypting company name:", err);
      }
    };

    if (isOpen) {
      decryptCompanyName();
    }
  }, [isOpen, user]);

  // Get company name for API calls
  const getCompanyNameForApi = () => {
    if (!decryptedCompanyName) return null;

    if (companyType?.toLowerCase() === "other") {
      return "Others";
    }

    return decryptedCompanyName;
  };

  // Fetch ALL joined forums once
  useEffect(() => {
    const fetchAllJoinedForums = async () => {
      try {
        const apiCompanyName = getCompanyNameForApi();

        let forums: any[] = [];

        if (apiCompanyName) {
          const result = await GetUserJoinedForums(apiCompanyName);
          forums = result.data || [];
        }

        const uniqueForums = Array.from(
          new Map(forums.map((f) => [f.id, f])).values(),
        );

        setAllJoinedForums(uniqueForums);
      } catch (err) {
        console.error("Error fetching joined forums:", err);
        setAllJoinedForums([]);
      }
    };

    if (isOpen) {
      setLoading(true);
      fetchAllJoinedForums();
      setLoading(false);
    }
  }, [isOpen, decryptedCompanyName, companyType]);

  // Filter forums based on scope
  useEffect(() => {
    const filterForumsByScope = () => {
      if (allJoinedForums.length === 0) {
        setAvailableForums([]);
        return;
      }

      const apiCompanyName = getCompanyNameForApi();

      if (scope === "local") {
        const companyForums = allJoinedForums.filter(
          (f: any) => !f.is_global && f.company_name === apiCompanyName,
        );
        setAvailableForums(companyForums);
      } else {
        setAvailableForums(allJoinedForums);
      }
    };

    if (isOpen && allJoinedForums.length > 0) {
      filterForumsByScope();
    } else if (isOpen) {
      setAvailableForums([]);
    }
  }, [isOpen, scope, allJoinedForums]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiCompanyName = getCompanyNameForApi();

      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        forumId: selectedForumId,
        scope: scope,
        isAnonymous: isAnonymous,
        tags: hashtags,
      };

      if (scope === "local" && apiCompanyName) {
        payload.companyName = apiCompanyName;
      }

      if (link.trim()) {
        payload.link = link.trim();
      }

      await CreateForumTopic(payload);

      // Reset form
      setTitle("");
      setContent("");
      setLink("");
      setHashtags([]);
      setHashtagInput("");
      setSelectedForumId("");

      showToast("Topic created successfully!", "success");

      onClose();

      // FIXED: Call refresh callback instead of reloading page
      if (onTopicCreated) {
        await onTopicCreated();
      }
    } catch (error: any) {
      console.error("Error creating topic:", error);
      showToast(
        error.response?.data?.message ||
          "Failed to create topic. Please try again.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().toLowerCase().replace(/^#/, "");
    if (tag && !hashtags.includes(tag) && hashtags.length < 5) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      addHashtag();
    }
  };

  // Get display company name for UI
  const getDisplayCompanyName = () => {
    if (!decryptedCompanyName) return null;

    if (companyType?.toLowerCase() === "other") {
      return `Others (${decryptedCompanyName})`;
    }

    return decryptedCompanyName;
  };

  const displayCompanyName = getDisplayCompanyName();
  const apiCompanyName = getCompanyNameForApi();

  // Group forums by type for better display
  const globalForums = availableForums.filter((f: any) => f.is_global);
  const companyForums = availableForums.filter((f: any) => !f.is_global);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Create New Topic {forumName && `in ${forumName}`}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic Visibility
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setScope("local");
                  setSelectedForumId("");
                }}
                disabled={!apiCompanyName}
                className={`p-3 rounded-xl border transition-all ${
                  scope === "local"
                    ? "bg-purple-50 border-purple-200 text-purple-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">Company Only</span>
                </div>
                <p className="text-xs">
                  {displayCompanyName
                    ? `Visible only to ${displayCompanyName} members`
                    : "Visible only to your company members"}
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScope("global");
                  setSelectedForumId("");
                }}
                className={`p-3 rounded-xl border transition-all ${
                  scope === "global"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">Global</span>
                </div>
                <p className="text-xs">Visible to all platform members</p>
              </button>
            </div>

            {scope === "local" && displayCompanyName && (
              <p className="text-sm text-gray-600 mb-2">
                Posting to:{" "}
                <span className="font-semibold">{displayCompanyName}</span>
              </p>
            )}

            {scope === "global" && (
              <p className="text-sm text-gray-600 mb-2">
                Your topic will be visible to all members across the platform
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Forum *
            </label>
            <div className="relative">
              <select
                value={selectedForumId}
                onChange={(e) => setSelectedForumId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                required
                disabled={loading || (scope === "local" && !apiCompanyName)}
              >
                <option value="">
                  {loading
                    ? "Loading forums..."
                    : scope === "local" && !apiCompanyName
                      ? "Set your company to view company forums"
                      : availableForums.length === 0
                        ? `No ${
                            scope === "local" ? "company" : ""
                          } forums available`
                        : "Choose a forum..."}
                </option>

                {scope === "global" && globalForums.length > 0 && (
                  <optgroup label="Global Forums">
                    {globalForums.map((forum) => (
                      <option key={forum.id} value={forum.id}>
                        🌍 {forum.icon} {forum.name} (Global)
                      </option>
                    ))}
                  </optgroup>
                )}

                {scope === "global" && companyForums.length > 0 && (
                  <optgroup label="Company Forums (Posting Globally)">
                    {companyForums.map((forum) => (
                      <option key={forum.id} value={forum.id}>
                        🏢 {forum.icon} {forum.name} ({forum.company_name})
                      </option>
                    ))}
                  </optgroup>
                )}

                {scope === "local" && companyForums.length > 0 && (
                  <>
                    {companyForums.map((forum) => (
                      <option key={forum.id} value={forum.id}>
                        🏢 {forum.icon} {forum.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {selectedForumId && !loading && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {(() => {
                  const selectedForum = availableForums.find(
                    (f) => f.id === selectedForumId,
                  );
                  if (!selectedForum) return null;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{selectedForum.icon}</span>
                          <span className="font-medium">
                            {selectedForum.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {selectedForum.is_global ? (
                            <>
                              <GlobeIcon className="w-3 h-3" />
                              <span>Global Forum</span>
                            </>
                          ) : (
                            <>
                              <Building className="w-3 h-3" />
                              <span>Company Forum</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{selectedForum.member_count || 0} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{selectedForum.topic_count || 0} topics</span>
                        </div>
                      </div>

                      {selectedForum.description && (
                        <p className="text-xs text-gray-600">
                          {selectedForum.description}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {scope === "local" && !apiCompanyName && (
              <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <p className="text-sm text-orange-700">Company not set</p>
                </div>
                <p className="text-xs text-orange-600">
                  You need to set your company in your profile to post to
                  company forums
                </p>
              </div>
            )}

            {availableForums.length === 0 &&
              !loading &&
              apiCompanyName &&
              scope === "local" && (
                <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700">
                      No company forums available
                    </p>
                  </div>
                  <p className="text-xs text-orange-600 mb-2">
                    You need to join at least one {displayCompanyName} forum
                    first.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/dashboard/forums");
                    }}
                    className="mt-2 text-xs text-orange-600 hover:text-orange-800 font-medium underline"
                  >
                    Browse and join forums →
                  </button>
                </div>
              )}

            {availableForums.length === 0 && !loading && scope === "global" && (
              <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <p className="text-sm text-orange-700">No forums available</p>
                </div>
                <p className="text-xs text-orange-600 mb-2">
                  You need to join at least one forum first.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/dashboard/forums");
                  }}
                  className="text-xs text-orange-600 hover:text-orange-800 font-medium underline"
                >
                  Browse and join forums →
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {title.length}/200 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, ask for advice, or start a discussion..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              required
              maxLength={5000}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {content.length}/5000 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hashtags
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyPress={handleHashtagKeyPress}
                  placeholder="Add hashtags (press Enter or Space)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={hashtags.length >= 5}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add up to 5 hashtags to help others find your topic
                </p>
              </div>

              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />#{tag}
                      <button
                        type="button"
                        onClick={() => removeHashtag(tag)}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                        title="Remove hashtag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {hashtags.length >= 5 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Maximum 5 hashtags reached
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optional Link
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Add a relevant link (optional)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Include a link to relevant resources or references
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              Post anonymously
            </label>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            {isAnonymous
              ? "Your identity will be hidden from other members"
              : "Your name and profile will be visible to other members"}
          </p>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Community Guidelines
              </span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1 ml-6 list-disc">
              <li>Keep discussions respectful and professional</li>
              <li>Share experiences honestly while maintaining privacy</li>
              <li>Avoid sharing confidential company information</li>
              <li>Support others and contribute constructively</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !title.trim() ||
                !content.trim() ||
                !selectedForumId ||
                (scope === "local" && !apiCompanyName)
              }
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Posting...
                </>
              ) : (
                "Post Topic"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
