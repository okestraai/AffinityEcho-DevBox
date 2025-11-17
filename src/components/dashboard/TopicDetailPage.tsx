import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircle,
  Heart,
  Eye,
  ThumbsUp,
  Bookmark,
  Share2,
  MoreVertical,
  User,
  Clock,
  Building,
  Globe,
  Send,
  Flag,
  Edit,
  Trash2,
  Pin
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { mockTopics, mockUserProfiles, companies, globalForums } from '../../data/mockForums';
import { Topic, Comment } from '../../types/forum';
import { UserProfileModal } from './UserProfileModal';

export function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [replyToComment, setReplyToComment] = useState<string | null>(null);

  useEffect(() => {
    const foundTopic = mockTopics.find(t => t.id === topicId);
    if (foundTopic) {
      setTopic(foundTopic);
      setComments(foundTopic.comments || []);
    }
  }, [topicId]);

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Topic not found</h2>
          <button
            onClick={() => navigate('/dashboard/forums')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to Forums
          </button>
        </div>
      </div>
    );
  }

  const author = mockUserProfiles[topic.userId];
  const companyInfo = topic.companyId ? companies.find(c => c.id === topic.companyId) : null;
  const forumInfo = topic.forumId ? globalForums.find(f => f.id === topic.forumId) : null;

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setTopic({
      ...topic,
      likes: isLiked ? topic.likes - 1 : topic.likes + 1
    });
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      topicId: topic.id,
      userId: currentUser.id,
      content: newComment,
      likes: 0,
      createdAt: new Date().toISOString(),
      parentId: replyToComment
    };

    setComments([...comments, comment]);
    setTopic({
      ...topic,
      comments: [...(topic.comments || []), comment],
      replies: topic.replies + 1
    });
    setNewComment('');
    setReplyToComment(null);
  };

  const handleCommentLike = (commentId: string) => {
    setComments(comments.map(c =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    ));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const commentAuthor = mockUserProfiles[comment.userId];
    const replies = comments.filter(c => c.parentId === comment.id);

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-12 mt-4' : 'mt-6'}`}>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
          <div className="flex items-start gap-3">
            <button
              onClick={() => handleUserClick(comment.userId)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 hover:shadow-lg transition-all"
            >
              {commentAuthor?.avatar || '👤'}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => handleUserClick(comment.userId)}
                  className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {commentAuthor?.username || 'Anonymous User'}
                </button>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(comment.createdAt)}
                </span>
              </div>

              <p className="text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
                {comment.content}
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleCommentLike(comment.id)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  <span>{comment.likes}</span>
                </button>

                <button
                  onClick={() => setReplyToComment(comment.id)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>

        {replies.length > 0 && (
          <div className="space-y-4">
            {replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/dashboard/forums')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Forums
        </button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => handleUserClick(topic.userId)}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg hover:shadow-lg transition-all"
                >
                  {author?.avatar || '👤'}
                </button>

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleUserClick(topic.userId)}
                    className="font-bold text-gray-900 hover:text-blue-600 transition-colors block"
                  >
                    {author?.username || 'Anonymous User'}
                  </button>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeAgo(topic.createdAt)}</span>

                    {companyInfo && (
                      <>
                        <span>•</span>
                        <Building className="w-4 h-4" />
                        <span>{companyInfo.name}</span>
                      </>
                    )}

                    {forumInfo && (
                      <>
                        <span>•</span>
                        <Globe className="w-4 h-4" />
                        <span>{forumInfo.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {showOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        navigate('/report-harassment');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                    {currentUser?.id === topic.author.id && (
                      <>
                        <button
                          onClick={() => {
                            setShowOptions(false);
                            alert('Edit functionality coming soon!');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setShowOptions(false);
                            if (confirm('Are you sure you want to delete this topic?')) {
                              alert('Topic deleted successfully!');
                              navigate('/dashboard/forums');
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {topic.title}
            </h1>

            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                {topic.content}
              </p>
            </div>

            {topic.tags && topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {topic.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 ${
                    isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                  } transition-colors`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="font-semibold">{topic.likes}</span>
                </button>

                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold">{topic.replies}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-5 h-5" />
                  <span className="font-semibold">{topic.views}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-full ${
                    isBookmarked
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-100 text-gray-600'
                  } transition-colors`}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({comments.filter(c => !c.parentId).length})
          </h2>

          <form onSubmit={handleSubmitComment} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            {replyToComment && (
              <div className="mb-4 flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Replying to {mockUserProfiles[comments.find(c => c.id === replyToComment)?.userId || '']?.username || 'comment'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyToComment(null)}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {currentUser?.username?.[0]?.toUpperCase() || '👤'}
              </div>

              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />

                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            {comments
              .filter(c => !c.parentId)
              .map(comment => renderComment(comment))}
          </div>

          {comments.filter(c => !c.parentId).length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No comments yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>

      {showUserProfile && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => {
            setShowUserProfile(false);
            setSelectedUserId(null);
          }}
          onFollow={(userId) => console.log('Follow:', userId)}
          onUnfollow={(userId) => console.log('Unfollow:', userId)}
          onChat={(userId) => {
            console.log('Chat:', userId);
            setShowUserProfile(false);
          }}
        />
      )}
    </div>
  );
}
