import React, { useState, useEffect } from 'react';
import {
  Users,
  Check,
  X,
  Clock,
  MessageCircle,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Building,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import type { ReferralConnection, IdentityReveal, UserProfile, ReferralPost } from '../../lib/supabase';

interface ConnectionWithDetails extends ReferralConnection {
  sender_profile: UserProfile | null;
  receiver_profile: UserProfile | null;
  referral_post: ReferralPost | null;
  identity_reveal: IdentityReveal | null;
}

export function ConnectionRequestsView() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    if (user?.id) {
      fetchConnections();
    }
  }, [user?.id, activeTab]);

  const fetchConnections = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const query = supabase
        .from('referral_connections')
        .select('*');

      if (activeTab === 'received') {
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

  return (
    <div className="max-w-4xl mx-auto">
      <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Connection Requests</h1>
            <p className="text-gray-500">Manage your referral connections</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Received ({connections.filter(c => c.status === 'pending' && activeTab === 'received').length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sent ({connections.filter(c => activeTab === 'sent').length})
          </button>
        </div>
      </header>

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
            {activeTab === 'received'
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
                            Identity Revealed
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

                    {connection.status === 'accepted' && !showIdentity && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="flex items-center gap-2 mb-1">
                          <EyeOff className="w-4 h-4 text-yellow-600" />
                          <span className="text-xs font-medium text-yellow-900">Identity Hidden</span>
                        </div>
                        <p className="text-xs text-yellow-700">
                          Both users must agree to reveal identities before you can see each other's details.
                        </p>
                      </div>
                    )}

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
                      {activeTab === 'received' && connection.status === 'pending' && (
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
  );
}
