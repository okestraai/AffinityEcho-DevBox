import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

interface InlineCommentInputProps {
  onSubmit: (comment: string) => void;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function InlineCommentInput({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  autoFocus = true
}: InlineCommentInputProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      await onSubmit(comment);
      setComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-purple-500 to-indigo-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-green-500 to-emerald-500',
      'bg-gradient-to-br from-yellow-500 to-orange-500',
      'bg-gradient-to-br from-red-500 to-pink-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className="px-4 py-3 bg-gray-50 border-t border-gray-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${getAvatarColor(user?.email || 'User')}`}>
          {(user?.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              textareaRef.current?.focus();
            }}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              Press Ctrl+Enter to submit or Esc to cancel
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit();
                }}
                disabled={!comment.trim() || submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
