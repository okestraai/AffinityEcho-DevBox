import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { GetNookById } from "../../../../api/nookApis";
import { NookDetail } from "./NookDetails";
import { UserProfileModal } from "../../Modals/UserProfileModal";
import { useAuth } from "../../../hooks/useAuth";

export function NookDetailPage() {
  const { nookId } = useParams<{ nookId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [nookData, setNookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    if (!nookId) return;

    const fetchNook = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await GetNookById(nookId);

        if (response?.nook) {
          setNookData({
            ...response.nook,
            isMember: response.isMember ?? true,
            isCreator: response.isCreator ?? false,
          });
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNook();
  }, [nookId]);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleChat = (userId: string) => {
    setShowUserProfile(false);
    navigate("/dashboard/messages", { state: { startChatWith: userId, contextType: "regular" } });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading nook...</p>
        </div>
      </div>
    );
  }

  if (error || !nookData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nook not found</h2>
          <p className="text-gray-500 mb-4">This nook may have expired or been removed.</p>
          <button
            onClick={() => navigate("/dashboard/nooks")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Nooks
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <NookDetail
        nook={nookData}
        userAvatar={user?.avatar || "?"}
        currentUserId={user?.id || ""}
        onBack={() => navigate("/dashboard/nooks")}
        onUserClick={handleUserClick}
      />

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId}
        onChat={handleChat}
      />
    </>
  );
}
