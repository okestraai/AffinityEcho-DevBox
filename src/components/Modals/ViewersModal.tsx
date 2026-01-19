import React, { useState, useEffect } from 'react';
import { X, Eye, Search } from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';
import { useNavigate } from 'react-router-dom';

interface Viewer {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  viewed_at: string;
}

interface ViewersModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'post' | 'topic' | 'nook';
  totalViewers: number;
}

export function ViewersModal({
  isOpen,
  onClose,
  contentId,
  contentType,
  totalViewers
}: ViewersModalProps) {
  const navigate = useNavigate();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const VIEWERS_PER_PAGE = 20;

  useEffect(() => {
    if (isOpen) {
      loadViewers();
    } else {
      setViewers([]);
      setSearchTerm('');
      setCurrentPage(1);
    }
  }, [isOpen, contentId]);

  const loadViewers = async () => {
    setLoading(true);
    try {
      const mockViewers: Viewer[] = Array.from({ length: Math.min(totalViewers, 50) }, (_, i) => ({
        id: `viewer-${i + 1}`,
        display_name: generateAnonymousName(i),
        bio: generateBio(i),
        viewed_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));

      setViewers(mockViewers);
      setHasMore(mockViewers.length < totalViewers);
    } catch (error) {
      console.error('Error loading viewers:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnonymousName = (index: number) => {
    const adjectives = ['Silent', 'Brave', 'Quiet', 'Bold', 'Wise', 'Kind', 'Swift', 'Calm', 'Noble', 'Gentle', 'Fierce', 'Ancient', 'Mystic', 'Cosmic', 'Shadow'];
    const nouns = ['Phoenix', 'Tiger', 'Eagle', 'Wolf', 'Lion', 'Falcon', 'Bear', 'Hawk', 'Dragon', 'Fox', 'Raven', 'Panther', 'Owl', 'Viper', 'Lynx'];
    const number = 1000 + (index * 137) % 9000;
    return `@${adjectives[index % adjectives.length]}${nouns[Math.floor(index / adjectives.length) % nouns.length]}${number}`;
  };

  const generateBio = (index: number) => {
    const bios = [
      'Software Engineer',
      'Product Manager',
      'UX Designer',
      'Data Scientist',
      'Marketing Lead',
      'Engineering Manager',
      'Tech Lead',
      'Startup Founder',
      'Designer',
      'Developer'
    ];
    return bios[index % bios.length];
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-purple-500 to-indigo-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-green-500 to-emerald-500',
      'bg-gradient-to-br from-yellow-500 to-orange-500',
      'bg-gradient-to-br from-red-500 to-pink-500',
      'bg-gradient-to-br from-teal-500 to-green-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserProfileModal(true);
  };

  const handleChat = (userId: string) => {
    navigate('/dashboard/messages', { state: { startChatWith: userId } });
    onClose();
  };

  const filteredViewers = viewers.filter(viewer =>
    viewer.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Viewers</h2>
                <p className="text-sm text-gray-600">{totalViewers.toLocaleString()} people viewed this</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search handles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredViewers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {searchTerm ? 'No viewers found matching your search.' : 'No viewers yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredViewers.map((viewer) => (
                <div
                  key={viewer.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <button onClick={() => handleUserClick(viewer.id)} className="flex-shrink-0">
                    {viewer.avatar_url ? (
                      <img
                        src={viewer.avatar_url}
                        alt={viewer.display_name}
                        className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-blue-500 transition-all"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-blue-500 transition-all ${getAvatarColor(viewer.display_name)}`}>
                        {viewer.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => handleUserClick(viewer.id)} className="text-left w-full">
                      <h3 className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                        {viewer.display_name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">Anonymous Handle</p>
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0">
                    {formatTimeAgo(viewer.viewed_at)}
                  </div>
                </div>
              ))}

              {hasMore && !searchTerm && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">
                    Showing {filteredViewers.length} of {totalViewers.toLocaleString()} viewers
                  </p>
                  <button
                    onClick={loadViewers}
                    className="mt-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        userId={selectedUserId}
        onChat={handleChat}
      />
    </div>
  );
}
