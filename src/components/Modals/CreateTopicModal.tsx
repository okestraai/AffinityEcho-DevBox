import React, { useState } from "react";
import {
  X,
  Image,
  Link as LinkIcon,
  AlertCircle,
  Globe,
  Building,
  Hash,
  Tag,
  ChevronDown,
} from "lucide-react";
import { companies, globalForums } from "../../data/mockForums";
import { useAuth } from "../../hooks/useAuth";

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(
      `[${timestamp}] [CreateTopicModal.${component}] ${message}:`,
      data
    );
  } else {
    console.log(`[${timestamp}] [CreateTopicModal.${component}] ${message}`);
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  forumName?: string;
  forumId?: string;
  companyId?: string;
}

export function CreateTopicModal({
  isOpen,
  onClose,
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

  // Safely find the user's company (or null if not found / not logged in)
  const userCompany =
    user?.demographics?.company != null
      ? companies.find((c) => c.name === user.demographics.company) ?? null
      : null;

  // Decideure you have a fallback when showing forums
  const availableForums =
    scope === "local" && userCompany ? userCompany.forums : globalForums;

  // Log component state changes
  React.useEffect(() => {
    if (isOpen) {
      log("CreateTopicModal", "Modal opened", { forumName });
    } else {
      log("CreateTopicModal", "Modal closed");
    }
  }, [isOpen]);

  React.useEffect(() => {
    log("CreateTopicModal", "Form data changed", {
      titleLength: title.length,
      contentLength: content.length,
      hasLink: !!link,
      hashtagsCount: hashtags.length,
    });
  }, [title, content, link, hashtags]);

  React.useEffect(() => {
    log("CreateTopicModal", "Submission state changed", { isSubmitting });
  }, [isSubmitting]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    const startTime = performance.now();
    log("handleSubmit", "Form submission started", {
      title,
      contentLength: content.length,
      hasLink: !!link,
      hashtagsCount: hashtags.length,
      forumName,
    });

    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const endTime = performance.now();
      log(
        "handleSubmit",
        `Topic created successfully in ${(endTime - startTime).toFixed(2)}ms`,
        {
          title,
          forumName,
        }
      );

      setIsSubmitting(false);
      onClose();
      // Reset form
      log("handleSubmit", "Form reset");
      setTitle("");
      setContent("");
      setLink("");
      setHashtags([]);
      setHashtagInput("");
    } catch (error) {
      const endTime = performance.now();
      log(
        "handleSubmit",
        `Topic creation failed after ${(endTime - startTime).toFixed(2)}ms`,
        error
      );
      setIsSubmitting(false);
    }
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().toLowerCase().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
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
                className={`p-3 rounded-xl border transition-all ${
                  scope === "local"
                    ? "bg-purple-50 border-purple-200 text-purple-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">Company Only</span>
                </div>
                <p className="text-xs">Visible only to your company members</p>
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
              >
                <option value="">Choose a forum...</option>
                {availableForums.map((forum) => (
                  <option key={forum.id} value={forum.id}>
                    {forum.icon} {forum.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {scope === "local" && !userCompany && (
              <p className="text-xs text-orange-600 mt-1">
                You need to set your company in your profile to post to company
                forums
              </p>
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, ask for advice, or start a discussion..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              required
            />
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
                />
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
                      >
                        ×
                      </button>
                    </span>
                  ))}
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
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Community Guidelines
              </span>
            </div>
            <p className="text-xs text-blue-700">
              Keep discussions respectful and supportive. Your post will be
              anonymous but moderated for safety.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Posting..." : "Post Topic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
