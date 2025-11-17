import React, { useState } from 'react';
import { X, MessageCircle, Heart, ThumbsUp, Reply, Send, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { Topic, Comment } from '../../types/forum';
import { UserProfileModal } from './UserProfileModal';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [CommentsModal.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [CommentsModal.${component}] ${message}`);
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic | null;
  onUserClick?: (userId: string) => void;
}

export function CommentsModal({ isOpen, onClose, topic, onUserClick }: Props) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Log component state changes
  React.useEffect(() => {
    if (isOpen && topic) {
      log('CommentsModal', 'Modal opened', { topicId: topic.id, title: topic.title });
    } else if (!isOpen) {
      log('CommentsModal', 'Modal closed');
    }
  }, [isOpen, topic]);

  if (!isOpen || !topic) return null;

  // Mock comments data with nested replies
  const mockComments: Comment[] = [
    {
      id: '1',
      content: 'I completely understand this feeling. I went through something very similar last year and found that documenting everything helped tremendously.',
      author: {
        id: 'user2',
        username: 'ExperiencedVoice123',
        avatar: '💫'
      },
      topicId: topic.id,
      reactions: { helpful: 12, supportive: 8 },
      userReactions: { helpful: false, supportive: true },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      replies: [
        {
          id: '1-1',
          content: 'What kind of documentation worked best for you?',
          author: {
            id: 'user3',
            username: 'CuriousLearner456',
            avatar: '🌟'
          },
          topicId: topic.id,
          reactions: { helpful: 3, supportive: 2 },
          userReactions: { helpful: false, supportive: false },
          createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          replies: [
            {
              id: '1-1-1',
              content: 'I kept a simple log with dates, times, witnesses present, and exact quotes when possible. Also noted my emotional state and any impact on my work.',
              author: {
                id: 'user2',
                username: 'ExperiencedVoice123',
                avatar: '💫'
              },
              topicId: topic.id,
              reactions: { helpful: 7, supportive: 4 },
              userReactions: { helpful: true, supportive: false },
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
              replies: []
            }
          ]
        }
      ]
    },
    {
      id: '2',
      content: 'Have you considered talking to HR? Sometimes they can provide guidance on how to address these situations professionally.',
      author: {
        id: 'user4',
        username: 'HRInsider789',
        avatar: '🎯'
      },
      topicId: topic.id,
      reactions: { helpful: 6, supportive: 4 },
      userReactions: { helpful: false, supportive: false },
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      replies: []
    },
    {
      id: '3',
      content: 'You\'re not alone in this. I\'ve found that having allies in the room who can speak up when these things happen makes a huge difference.',
      author: {
        id: 'user5',
        username: 'SupportiveAlly321',
        avatar: '🤝'
      },
      topicId: topic.id,
      reactions: { helpful: 9, supportive: 15 },
      userReactions: { helpful: false, supportive: true },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      replies: [
        {
          id: '3-1',
          content: 'How do you find these allies? I feel like I\'m the only one who notices these patterns.',
          author: {
            id: 'user6',
            username: 'SeekingSupport',
            avatar: '🌱'
          },
          topicId: topic.id,
          reactions: { helpful: 2, supportive: 6 },
          userReactions: { helpful: false, supportive: true },
          createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
          replies: []
        }
      ]
    }
  ];

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    log('handleSubmitComment', 'New comment submitted', { 
      content: newComment, 
      topicId: topic.id 
    });
    
    // In real app, this would submit to API
    setNewComment('');
  };

  const handleSubmitReply = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    log('handleSubmitReply', 'Reply submitted', { 
      content: replyText, 
      parentId, 
      topicId: topic.id 
    });
    
    // In real app, this would submit to API
    setReplyText('');
    setReplyingTo(null);
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const handleUserClick = (userId: string) => {
    if (user?.id === userId) {
      // Close modal and redirect to own profile
      onClose();
      onUserClick?.(userId);
    } else {
      // Open user profile modal
      setSelectedUserId(userId);
      setShowUserProfile(true);
    }
  };

  const handleChatUser = (userId: string) => {
    setShowUserProfile(false);
    onClose();
    onUserClick?.(userId);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const isCurrentUser = user?.id === comment.author.id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);
    
    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => handleUserClick(comment.author.id)}
              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm hover:bg-blue-200 transition-colors cursor-pointer"
            >
              {comment.author.avatar}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => handleUserClick(comment.author.id)}
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {comment.author.username}
                </button>
                {isCurrentUser && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">You</span>
                )}
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
              </div>
              
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{comment.content}</p>
              
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{comment.reactions.helpful} helpful</span>
                </button>
                
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors">
                  <Heart className="w-3 h-3" />
                  <span>{comment.reactions.supportive} supportive</span>
                </button>
                
                <button 
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
                >
                  <Reply className="w-3 h-3" />
                  <span>Reply</span>
                </button>
                
                {hasReplies && (
                  <button 
                    onClick={() => toggleReplies(comment.id)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>{isExpanded ? 'Hide' : 'Show'} {comment.replies.length} replies</span>
                  </button>
                )}
              </div>
              
              {/* Reply Form */}
              {replyingTo === comment.id && (
                <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs">
                      {user?.avatar}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.author.username}...`}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!replyText.trim()}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        
        {/* Nested Replies */}
        {hasReplies && isExpanded && (
          <div className="space-y-3">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{topic?.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="w-4 h-4" />
                <span>{mockComments.length} comments</span>
                <span>•</span>
                <span>Latest activity 5m ago</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mockComments.map((comment) => renderComment(comment))}
          
          {mockComments.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium text-gray-500 mb-1">No comments yet</h3>
              <p className="text-sm text-gray-400">Be the first to share your thoughts</p>
            </div>
          )}
        </div>

        {/* New Comment Form */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <form onSubmit={handleSubmitComment}>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                {user?.avatar}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts or advice..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Your comment will be posted anonymously as {user?.username}
                  </p>
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <Send className="w-3 h-3" />
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ''}
        onChat={handleChatUser}
      />
    </div>
  );
}