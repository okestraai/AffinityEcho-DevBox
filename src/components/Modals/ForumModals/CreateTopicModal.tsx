// src/components/Modals/ForumModals/CreateTopicModal.tsx
import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  Link as LinkIcon,
  Hash,
  Tag,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  CreateForumTopic,
  GetGlobalScopeMetrics,
  GetUserJoinedForums,
} from "../../../../api/forumApis";
import { showToast } from "../../../Helper/ShowToast";
import { MSG } from "../../../constants/messages";
import { SHARED_POSTING_NOTE, STUDENTS_SPACE } from "../../../constants/spaces";
import { AudiencePicker, type Audience } from "../../shared/AudiencePicker";
import { useCompanySpace } from "../../../hooks/useCompanySpace";

interface ForumItem {
  id: string;
  name: string;
  icon?: string;
  is_global?: boolean;
  is_shared?: boolean;
  is_other_topics?: boolean;
  company_name?: string;
  member_count?: number;
  topic_count?: number;
  description?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTopicCreated?: () => Promise<void>;
  forumName?: string;
  forumId?: string;
  companyId?: string;
  // The forum this form was opened from is a Shared forum.
  isShared?: boolean;
  // The company or Students space this form was opened from, so it starts with that space's audience.
  space?: string;
}

export function CreateTopicModal({
  isOpen,
  onClose,
  onTopicCreated,
  forumName,
  forumId,
  isShared,
  space,
}: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<Audience>("everyone");
  const [selectedForumId, setSelectedForumId] = useState("");
  const [label, setLabel] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forums, setForums] = useState<ForumItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { space: companySpace, label: companyLabel } = useCompanySpace(user, isOpen);
  const isStudent = !!user?.is_student;
  const fixedForum = !!forumId;

  // Each opening starts from the space it was opened in.
  const startAudience: Audience =
    space === STUDENTS_SPACE ? "students" : space && space === companySpace ? "company" : "everyone";
  useEffect(() => {
    if (isOpen) {
      setAudience(startAudience);
      setSelectedForumId("");
    }
  }, [isOpen, startAudience]);

  // Forums the member can post in for the chosen audience; Other topics is the "no forum" choice.
  useEffect(() => {
    if (!isOpen || fixedForum) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        let list: ForumItem[] = [];
        if (audience === "everyone") {
          const data = await GetGlobalScopeMetrics();
          list = data?.forums || [];
        } else {
          const space = audience === "students" ? STUDENTS_SPACE : companySpace;
          if (space) {
            const data = await GetUserJoinedForums(space);
            const joined: ForumItem[] = Array.isArray(data) ? data : data?.forums || [];
            list = joined.filter((f) => !f.is_global && f.company_name === space);
          }
        }
        if (!cancelled) setForums(list.filter((f) => !f.is_other_topics));
      } catch {
        if (!cancelled) setForums([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, audience, companySpace, fixedForum]);

  if (!isOpen) return null;

  const chosenForum = forums.find((f) => f.id === selectedForumId);
  const postingToEveryone = fixedForum ? !!isShared : !!chosenForum?.is_shared;

  const resetForm = () => {
    setTitle("");
    setContent("");
    setLink("");
    setLabel("");
    setHashtags([]);
    setHashtagInput("");
    setSelectedForumId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // The server works out the space from the forum, or from the audience for Other topics.
      const payload: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        isAnonymous: true,
        tags: hashtags,
      };
      const targetForum = fixedForum ? forumId : selectedForumId;
      if (targetForum) payload.forumId = targetForum;
      else payload.audience = audience;
      if (label.trim()) payload.label = label.trim();
      if (link.trim()) payload.link = link.trim();

      await CreateForumTopic(payload);
      resetForm();
      showToast(MSG.FORUM.TOPIC_CREATED, "success");
      onClose();
      if (onTopicCreated) await onTopicCreated();
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      showToast(
        axiosErr.response?.data?.message || MSG.FORUM.CREATE_TOPIC_FAILED,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md md:max-w-4xl rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Create New Topic {forumName && `in ${forumName}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!fixedForum && (
            <>
              <AudiencePicker
                value={audience}
                onChange={(a) => {
                  setAudience(a);
                  setSelectedForumId("");
                }}
                isStudent={isStudent}
                companyLabel={companyLabel}
              />

              <div>
                <label
                  htmlFor="topic-forum"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Forum <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <div className="relative">
                  <select
                    id="topic-forum"
                    value={selectedForumId}
                    onChange={(e) => setSelectedForumId(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white min-h-[44px]"
                  >
                    <option value="">
                      {loading ? "Loading forums..." : "No forum: post to Other topics"}
                    </option>
                    {forums.map((forum) => (
                      <option key={forum.id} value={forum.id}>
                        {forum.icon} {forum.name}
                        {forum.is_shared ? " (Shared)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {audience !== "everyone" && !loading && forums.length === 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    Join a forum in this space to post there, or post to Other topics.
                  </p>
                )}
              </div>
            </>
          )}

          {postingToEveryone && (
            <p className="text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              {SHARED_POSTING_NOTE}
            </p>
          )}

          <div>
            <label
              htmlFor="topic-label"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Label <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="topic-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value.replace(/[,()]/g, ""))}
              maxLength={40}
              placeholder="e.g. visas"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px]"
            />
            <p className="mt-1 text-xs text-gray-500">
              A short word that helps people find your topic in Other topics.
            </p>
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
                (!fixedForum && audience === "company" && !companySpace)
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
