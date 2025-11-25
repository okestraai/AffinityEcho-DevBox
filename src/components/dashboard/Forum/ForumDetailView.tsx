import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageCircle, TrendingUp, UserPlus, UserCheck, Shield, Info, Plus, Eye, ThumbsUp, Clock } from 'lucide-react';
import { Forum, Topic } from '../../../types/forum';
import { mockTopics } from '../../../data/mockForums';
import { CreateTopicModal } from '../../Modals/CreateTopicModal';

interface Props {
  forum: Forum;
  onBack: () => void;
}

export function ForumDetailView({ forum, onBack }: Props) {
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(forum.isJoined || false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [memberCount, setMemberCount] = useState(forum.memberCount);

  const forumTopics = mockTopics.filter(t => t.forumId === forum.id);

  const handleJoinToggle = () => {
    if (isJoined) {
      setIsJoined(false);
      setMemberCount(prev => prev - 1);
    } else {
      setIsJoined(true);
      setMemberCount(prev => prev + 1);
    }
  };

  const forumRules = forum.rules || [
    'Be respectful and professional in all interactions',
    'Share experiences honestly while maintaining privacy',
    'Support others and contribute constructively',
    'Report harassment or inappropriate behavior',
    'Keep discussions relevant to the forum topic'
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Forums
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl">
                {forum.icon}
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">{forum.name}</h1>
                <p className="text-blue-100 max-w-2xl">{forum.description}</p>
              </div>
            </div>

            <button
              onClick={handleJoinToggle}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                isJoined
                  ? 'bg-white text-blue-600 hover:bg-blue-50'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              {isJoined ? (
                <>
                  <UserCheck className="w-5 h-5" />
                  Joined
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Join Forum
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white mb-1">
                <Users className="w-5 h-5" />
                <span className="font-semibold">Members</span>
              </div>
              <div className="text-3xl font-bold text-white">{memberCount.toLocaleString()}</div>
            </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white mb-1">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">Topics</span>
              </div>
              <div className="text-3xl font-bold text-white">{forum.topicCount}</div>
            </div>

            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white mb-1">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Last Activity</span>
              </div>
              <div className="text-2xl font-bold text-white">{forum.lastActivity}</div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Forum Guidelines</h3>
              <ul className="space-y-1">
                {forumRules.map((rule, index) => (
                  <li key={index} className="text-sm text-gray-600 flex gap-2">
                    <span>•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Discussions</h2>

        {isJoined && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Topic
          </button>
        )}
      </div>

      {!isJoined && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center mb-6">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Join to participate</h3>
          <p className="text-gray-600 mb-4">
            Join this forum to view discussions, create topics, and connect with {memberCount.toLocaleString()} members
          </p>
          <button
            onClick={handleJoinToggle}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Join Forum
          </button>
        </div>
      )}

      {isJoined && (
        <div className="space-y-3">
          {forumTopics.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No topics yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first to start a discussion in this forum!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Topic
              </button>
            </div>
          ) : (
            forumTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/dashboard/forums/topic/${topic.id}`)}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {topic.isPinned && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
                          Pinned
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                        {topic.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 line-clamp-2 mb-3">{topic.content}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs">
                          {topic.author.avatar}
                        </div>
                        <span>{topic.author.username}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{topic.reactions.seen}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ThumbsUp className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{topic.reactions.validated}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{topic.commentCount} comments</span>
                    </div>
                  </div>

                  {topic.tags.length > 0 && (
                    <div className="flex gap-2">
                      {topic.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <CreateTopicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        forumName={forum.name}
        forumId={forum.id}
        companyId={forum.companyId}
      />
    </div>
  );
}
