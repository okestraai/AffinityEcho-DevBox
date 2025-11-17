import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Shield, Eye, EyeOff, Target, Plus, Users, Check, X, Clock, Send, Building, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';
import { MentorshipRequestModal } from './MentorshipRequestModal';
import { UserProfileModal } from './UserProfileModal';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ReferralConnection, IdentityReveal, UserProfile, ReferralPost } from '../../lib/supabase';

interface ConnectionWithDetails extends ReferralConnection {
  sender_profile: UserProfile | null;
  receiver_profile: UserProfile | null;
  referral_post: ReferralPost | null;
  identity_reveal: IdentityReveal | null;
}

export function MessagesView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showMentorshipRequest, setShowMentorshipRequest] = useState(false);
  const [revealingName, setRevealingName] = useState(false);
  const [nameToReveal, setNameToReveal] = useState('');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'connections'>('messages');
  const [connections, setConnections] = useState<ConnectionWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionSubTab, setConnectionSubTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    if (activeTab === 'connections' && user?.id) {
      fetchConnections();
    }
  }, [activeTab, connectionSubTab, user?.id]);

  const fetchConnections = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const query = supabase
        .from('referral_connections')
        .select('*');

      if (connectionSubTab === 'received') {
        query.eq('receiver_id', user.id);
      } else {
        query.eq('sender_id', user.id);
      }

      const { data: connectionsData, error: connectionsError } = await query.order('created_at', { ascending: false });

      if (connectionsError) throw connectionsError;

      if (!connectionsData || connectionsData.length === 0) {
        setConnections([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set([
        ...connectionsData.map(c => c.sender_id),
        ...connectionsData.map(c => c.receiver_id)
      ])];

      const postIds = [...new Set(connectionsData.map(c => c.referral_post_id))];
      const connectionIds = connectionsData.map(c => c.id);

      const [profilesRes, postsRes, revealsRes] = await Promise.all([
        supabase.from('user_profiles').select('*').in('id', userIds),
        supabase.from('referral_posts').select('*').in('id', postIds),
        supabase.from('identity_reveals').select('*').in('connection_id', connectionIds)
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      const postMap = new Map(postsRes.data?.map(p => [p.id, p]) || []);
      const revealMap = new Map(revealsRes.data?.map(r => [r.connection_id, r]) || []);

      const enrichedConnections: ConnectionWithDetails[] = connectionsData.map(conn => ({
        ...conn,
        sender_profile: profileMap.get(conn.sender_id) || null,
        receiver_profile: profileMap.get(conn.receiver_id) || null,
        referral_post: postMap.get(conn.referral_post_id) || null,
        identity_reveal: revealMap.get(conn.id) || null
      }));

      setConnections(enrichedConnections);
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('referral_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      fetchConnections();
    } catch (err) {
      console.error('Error accepting connection:', err);
    }
  };

  const handleRejectConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('referral_connections')
        .update({ status: 'rejected' })
        .eq('id', connectionId);

      if (error) throw error;

      fetchConnections();
    } catch (err) {
      console.error('Error rejecting connection:', err);
    }
  };

  const handleRequestIdentityReveal = async (connection: ConnectionWithDetails) => {
    if (!user?.id) return;

    try {
      const responderId = connection.sender_id === user.id ? connection.receiver_id : connection.sender_id;

      const { error } = await supabase
        .from('identity_reveals')
        .insert([{
          connection_id: connection.id,
          requester_id: user.id,
          responder_id: responderId,
          status: 'pending'
        }]);

      if (error) throw error;

      fetchConnections();
    } catch (err) {
      console.error('Error requesting identity reveal:', err);
    }
  };

  const handleRespondToIdentityReveal = async (revealId: string, accepted: boolean) => {
    try {
      const { error } = await supabase
        .from('identity_reveals')
        .update({ status: accepted ? 'accepted' : 'declined' })
        .eq('id', revealId);

      if (error) throw error;

      fetchConnections();
    } catch (err) {
      console.error('Error responding to identity reveal:', err);
    }
  };

  const getOtherUserProfile = (connection: ConnectionWithDetails) => {
    if (!user?.id) return null;
    return connection.sender_id === user.id
      ? connection.receiver_profile
      : connection.sender_profile;
  };

  const shouldShowIdentity = (connection: ConnectionWithDetails) => {
    return connection.identity_revealed;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleUserClick = (userId: string) => {
    if (user?.id === userId) {
      navigate('/dashboard/profile');
    } else {
      setSelectedUserId(userId);
      setShowUserProfile(true);
    }
  };

  const handleChatUser = (userId: string) => {
    setShowUserProfile(false);
    setSelectedChat(userId);
    console.log('Chat initiated with user:', userId);
  };

  const conversations = [
    {
      id: '1',
      userId: 'user2',
      user: 'ThoughtfulLeader92',
      avatar: '🌟',
      lastMessage: 'That sounds like a great opportunity!',
      timeAgo: '5m',
      unread: 2,
      identityRevealed: false
    },
    {
      id: '2',
      userId: 'user3',
      user: 'WiseMentor456',
      avatar: '💫',
      lastMessage: 'I went through something similar...',
      timeAgo: '1h',
      unread: 0,
      identityRevealed: true,
      realName: 'Sarah Chen'
    }
  ];

  if (selectedChat) {
    const chat = conversations.find(c => c.id === selectedChat);
    return (
      <div className="max-w-md mx-auto flex flex-col h-screen">
        <header className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedChat(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </button>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {chat?.avatar}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {chat?.identityRevealed ? chat.realName : chat?.user}
              </h3>
              <p className="text-xs text-gray-500">
                {chat?.identityRevealed ? 'Identity revealed' : 'Anonymous'}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 bg-gray-50 p-4 space-y-3 overflow-y-auto">
          <div className="text-right">
            <div className="inline-block bg-blue-600 text-white px-3 py-2 rounded-2xl rounded-br-md max-w-xs">
              <p className="text-sm">Hi! I saw your post about promotion strategies. Would love to chat!</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">2h</p>
          </div>

          <div className="text-left">
            <div className="inline-block bg-white px-3 py-2 rounded-2xl rounded-bl-md max-w-xs border border-gray-200">
              <p className="text-sm">{chat?.lastMessage}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{chat?.timeAgo}</p>
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={() => alert('Message sent!')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Messages & Connections</h1>
            <p className="text-gray-500">Manage your conversations and connection requests</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              activeTab === 'messages'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Messages
            </div>
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              activeTab === 'connections'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Connection Requests
            </div>
          </button>
        </div>

        {activeTab === 'connections' && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setConnectionSubTab('received')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                connectionSubTab === 'received'
                  ? 'bg-white text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Received
            </button>
            <button
              onClick={() => setConnectionSubTab('sent')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                connectionSubTab === 'sent'
                  ? 'bg-white text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Sent
            </button>
          </div>
        )}
      </header>

      {activeTab === 'messages' ? (
        <div>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid gap-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedChat(conv.id)}
                className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                      {conv.avatar}
                    </div>
                    {conv.identityRevealed && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
                        <Eye className="w-2 h-2 text-white m-auto" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {conv.identityRevealed ? conv.realName : conv.user}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{conv.timeAgo}</span>
                        {conv.unread > 0 && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">{conv.unread}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500 truncate flex-1">{conv.lastMessage}</p>
                      {!conv.identityRevealed && (
                        <Shield className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {conversations.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium text-gray-500 mb-1">No conversations yet</h3>
              <p className="text-sm text-gray-400">
                Accept connection requests to start messaging
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium text-gray-500 mb-1">No connections found</h3>
              <p className="text-sm text-gray-400">
                {connectionSubTab === 'received'
                  ? 'You have no pending connection requests'
                  : 'You have not sent any connection requests'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => {
                const otherUser = getOtherUserProfile(connection);
                const showIdentity = shouldShowIdentity(connection);
                const isReceiver = connection.receiver_id === user?.id;
                const identityReveal = connection.identity_reveal;
                const canRequestReveal = connection.status === 'accepted' && !connection.identity_revealed && !identityReveal;
                const hasPendingReveal = identityReveal && identityReveal.status === 'pending';
                const shouldRespondToReveal = hasPendingReveal && identityReveal?.responder_id === user?.id;

                return (
                  <div key={connection.id} className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                        {showIdentity ? otherUser?.avatar : '❓'}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {showIdentity ? otherUser?.username : 'Anonymous User'}
                            </h3>
                            {showIdentity && otherUser?.job_title && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <Briefcase className="w-3 h-3" />
                                <span>{otherUser.job_title}</span>
                                {otherUser.company && (
                                  <>
                                    <span>•</span>
                                    <Building className="w-3 h-3" />
                                    <span>{otherUser.company}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              connection.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : connection.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {connection.status === 'pending' ? 'Pending' : connection.status === 'accepted' ? 'Connected' : 'Rejected'}
                            </span>

                            {connection.identity_revealed && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Revealed
                              </span>
                            )}
                          </div>
                        </div>

                        {connection.referral_post && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Regarding:</div>
                            <div className="font-medium text-gray-900 text-sm">{connection.referral_post.title}</div>
                            <div className="text-xs text-gray-600 mt-1">{connection.referral_post.company}</div>
                          </div>
                        )}

                        {connection.message && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageCircle className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-medium text-blue-900">Message:</span>
                            </div>
                            <p className="text-sm text-blue-800">{connection.message}</p>
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mb-3">
                          Requested {formatTimeAgo(connection.created_at)}
                        </div>

                        {shouldRespondToReveal && (
                          <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Eye className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-900">Identity Reveal Request</span>
                            </div>
                            <p className="text-sm text-purple-700 mb-3">
                              {showIdentity ? otherUser?.username : 'The other user'} wants to reveal identities. Do you agree?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRespondToIdentityReveal(identityReveal.id, true)}
                                className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRespondToIdentityReveal(identityReveal.id, false)}
                                className="flex-1 py-2 px-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                              >
                                <X className="w-4 h-4" />
                                Decline
                              </button>
                            </div>
                          </div>
                        )}

                        {hasPendingReveal && !shouldRespondToReveal && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-900">Waiting for identity reveal response...</span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {isReceiver && connection.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAcceptConnection(connection.id)}
                                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectConnection(connection.id)}
                                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}

                          {connection.status === 'accepted' && canRequestReveal && (
                            <button
                              onClick={() => handleRequestIdentityReveal(connection)}
                              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Request Identity Reveal
                            </button>
                          )}

                          {connection.status === 'accepted' && showIdentity && (
                            <button
                              onClick={() => handleChatUser(otherUser?.id || '')}
                              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Send Message
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <MentorshipRequestModal
        isOpen={showMentorshipRequest}
        onClose={() => setShowMentorshipRequest(false)}
      />

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ''}
        onChat={handleChatUser}
      />
    </div>
  );
}
