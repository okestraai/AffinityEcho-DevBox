// src/components/forums/overview/InlineCommentInput.tsx - COMPLETE
import React, { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

interface InlineCommentInputProps {
  onSubmit: (comment: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function InlineCommentInput({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  autoFocus = true,
}: InlineCommentInputProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    if (!comment.trim() || submitting) return;

    try {
      setSubmitting(true);
      await onSubmit(comment.trim());
      setComment("");
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Stop propagation for ALL keys
    e.stopPropagation();

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleTextareaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onCancel();
  };

  const handlePostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleSubmit();
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const userAvatar = user?.demographics?.avatar_emoji || "👤";

  return (
    <div className="px-4 py-3 bg-gray-50" onClick={handleContainerClick}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-lg shadow-sm border border-purple-200/50 flex-shrink-0">
          {userAvatar}
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onClick={handleTextareaClick}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 disabled:opacity-70"
            disabled={submitting}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              Press Ctrl+Enter to submit • Esc to cancel
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelClick}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePostClick}
                disabled={!comment.trim() || submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
