import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import type { ReferralComment } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  referralId: string;
  referralTitle: string;
}

interface CommentWithAuthor extends ReferralComment {
  author: {
    id: string;
    username: string;
    avatar: string;
  };
}

export function ReferralCommentsModal({ isOpen, onClose, referralId, referralTitle }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && referralId) {
      fetchComments();
    }
  }, [isOpen, referralId]);

  const fetchComments = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('referral_comments')
        .select('*')
        .eq('referral_post_id', referralId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const transformedComments: CommentWithAuthor[] = data.map(comment => {
        const profile = profileMap.get(comment.user_id);
        return {
          ...comment,
          author: {
            id: comment.user_id,
            username: profile?.username || 'Anonymous User',
            avatar: profile?.avatar || '👤'
          }
        };
      });

      setComments(transformedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.id) return;

    try {
      setSubmitting(true);

      const { data, error } = await supabase
        .from('referral_comments')
        .insert([{
          referral_post_id: referralId,
          user_id: user.id,
          content: newComment.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const newCommentWithAuthor: CommentWithAuthor = {
        ...data,
        author: {
          id: user.id,
          username: userProfile?.username || user.username || 'You',
          avatar: userProfile?.avatar || user.avatar || '👤'
        }
      };

      setComments([newCommentWithAuthor, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{referralTitle}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="w-4 h-4" />
                <span>{comments.length} comments</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium text-gray-500 mb-1">No comments yet</h3>
              <p className="text-sm text-gray-400">Be the first to comment</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                    {comment.author.avatar}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {comment.author.username}
                      </span>
                      {comment.user_id === user?.id && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">You</span>
                      )}
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <form onSubmit={handleSubmitComment}>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                {user?.avatar || '👤'}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Your comment will be visible to all users
                  </p>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <Send className="w-3 h-3" />
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
