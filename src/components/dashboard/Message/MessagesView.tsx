// MessagesView.tsx - Production Ready
import React, { useState, useEffect, useRef, useCallback } from "react";
import { resolveDisplayName } from "../../../utils/nameUtils";
import {
  Search,
  MessageCircle,
  Shield,
  Eye,
  EyeOff,
  Target,
  Plus,
  Inbox,
  ArrowLeft,
  Loader2,
  Send,
  Clock,
} from "lucide-react";

import { useAuth } from "../../../hooks/useAuth";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  GetSingleConversationMessages,
  GetConversations,
  CreateConversation,
  MarkMessagesAsRead,
  GetTypingStatus,
  RequestIdentityReveal,
  GetIdentityRevealStatusForConversation,
  SetTypingStatus,
  GetConnectableUsers,
  SendAMessage,
} from "../../../../api/messaging";
import { MentionInput } from "../../shared/MentionTextarea";
import { MentionText } from "../../shared/MentionText";
import { webSocketService } from "../../../services/websocket.service";
import { showToast } from "../../../Helper/ShowToast";
import { MentorshipRequestModal } from "../../Modals/MentorShipModals/MentorshipRequestModal";
import { MentorshipUserProfileModal } from "../../Modals/MentorShipModals/MentorshipUserProfileModal";
import { MentorshipRequestsView } from "./MentorshipRequestsView";
import { GetMentorProfileByUserId } from "../../../../api/mentorshipApis";
import { DecryptData } from "../../../../api/EncrytionApis";

// ==================== TYPES ====================
interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar: string;
  job_title: string;
  company: string;
  bio?: string;
  skills?: string[];
  location?: string;
  years_experience?: number;
  can_message?: boolean;
  privacy_level?: string;
}

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  context_type: "regular" | "mentorship";
  context_id?: string;
  chat_type?: "regular" | "mentorship";
  created_at: string;
  updated_at: string;
  last_message?: {
    content_preview?: string;
  };
  last_message_at?: string;
  last_activity_at?: string;
  unread_count?: number;
  other_user?: UserProfile;
  identity_revealed?: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content_encrypted: string;
  content_type: string;
  file_url?: string;
  file_name?: string;
  is_read: boolean;
  created_at: string;
  sent_at?: string;
  sender?: UserProfile;
  sender_info?: UserProfile;
}

interface TypingStatus {
  user_id: string;
  conversation_id: string;
  is_typing: boolean;
  user?: UserProfile;
}

interface LoadingState {
  conversations: boolean;
  messages: boolean;
  users: boolean;
  identityStatus: boolean;
  sendingMessage: boolean;
}

// ==================== SKELETON LOADERS ====================
function ConversationsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
        >
          <div className="max-w-xs">
            <div
              className={`${i === 1 ? "w-44" : i === 2 ? "w-52" : "w-60"} h-16 bg-gray-200 rounded-2xl animate-pulse ${
                i % 2 === 0 ? "rounded-br-md" : "rounded-bl-md"
              }`}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserSearchSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-3 rounded-lg flex items-center gap-3 animate-pulse"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== CONVERSATION LIST ====================
type ChatFilter = "all" | "mentorship" | "regular";

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (conv: Conversation) => void;
  getIdentityRevealStatus: (conv: Conversation) => boolean | null;
  getTimeAgo: (dateString: string) => string;
  chatFilter: ChatFilter;
  onFilterChange: (filter: ChatFilter) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
  onNewChat: () => void;
}

function ConversationList({
  conversations,
  onSelect,
  getIdentityRevealStatus,
  getTimeAgo,
  chatFilter,
  onFilterChange,
  hasMore,
  onNewChat,
  onLoadMore,
  loadingMore,
}: ConversationListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = conversations.filter((c) => {
    if (chatFilter === "all") return true;
    const isMentorship = c.context_type === "mentorship" || c.chat_type === "mentorship";
    return chatFilter === "mentorship" ? isMentorship : !isMentorship;
  });

  const mentorshipCount = conversations.filter(
    (c) => c.context_type === "mentorship" || c.chat_type === "mentorship",
  ).length;
  const regularCount = conversations.length - mentorshipCount;

  // Infinite scroll handler
  useEffect(() => {
    const container = listRef.current;
    if (!container || !hasMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 200 && !loadingMore) {
        onLoadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-3">
        {([
          { key: "all" as ChatFilter, label: "All", count: conversations.length },
          { key: "mentorship" as ChatFilter, label: "Mentorship", count: mentorshipCount },
          { key: "regular" as ChatFilter, label: "Regular", count: regularCount },
        ]).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onFilterChange(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              chatFilter === f.key
                ? f.key === "mentorship"
                  ? "bg-orange-600 text-white"
                  : "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Flat conversation list */}
      <div ref={listRef} className="grid gap-2 max-h-[calc(100vh-320px)] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            {chatFilter === "mentorship" ? (
              <>
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-1">No mentorship conversations</h4>
                <p className="text-sm text-gray-500 mb-4">Find a mentor or mentee to start a mentorship conversation</p>
                <button
                  type="button"
                  onClick={() => onFilterChange("all")}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                >
                  Find Mentorship
                </button>
              </>
            ) : chatFilter === "regular" ? (
              <>
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-1">No regular conversations</h4>
                <p className="text-sm text-gray-500 mb-4">Connect with others to start chatting</p>
                <button
                  type="button"
                  onClick={onNewChat}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Start New Chat
                </button>
              </>
            ) : (
              <>
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-1">No conversations yet</h4>
                <p className="text-sm text-gray-500">Start a conversation to connect with others</p>
              </>
            )}
          </div>
        ) : filtered.map((conv) => {
          const identityRevealed = getIdentityRevealStatus(conv);
          const isMentorship =
            conv.context_type === "mentorship" || conv.chat_type === "mentorship";

          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv)}
              className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`w-10 h-10 ${isMentorship ? "bg-orange-100" : "bg-blue-100"} rounded-full flex items-center justify-center text-lg`}
                  >
                    {conv.other_user?.avatar || "👤"}
                  </div>
                  {identityRevealed && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
                      <Eye className="w-2 h-2 text-white m-auto" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium text-gray-900 truncate">
                        {resolveDisplayName(conv.other_user?.display_name, conv.other_user?.username) || "Unknown User"}
                      </span>
                      {isMentorship && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex-shrink-0">
                          Mentorship
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {conv.last_activity_at && (
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(conv.last_activity_at)}
                        </span>
                      )}
                      {Number(conv.unread_count) > 0 && (
                        <div
                          className={`w-5 h-5 ${isMentorship ? "bg-orange-600" : "bg-blue-600"} rounded-full flex items-center justify-center`}
                        >
                          <span className="text-xs text-white">
                            {conv.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500 truncate flex-1">
                      {conv.last_message?.content_preview || "No messages yet"}
                    </p>
                    {!identityRevealed && (
                      <Shield className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length > 0 && hasMore && (
          <div className="py-3 text-center">
            {loadingMore ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
            ) : (
              <button
                type="button"
                onClick={onLoadMore}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Load more conversations
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== MESSAGE INPUT COMPONENT ====================
interface MessageInputProps {
  conversationId: string;
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  isMentorship?: boolean;
}

function MessageInputComponent({
  conversationId,
  onSendMessage,
  disabled,
  isMentorship,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTypingSentRef = useRef<number>(0);

  const sendTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId) return;
      try {
        await SetTypingStatus({
          conversation_id: conversationId,
          is_typing: isTyping,
        });
      } catch {
        // Silent failure for typing status
      }
    },
    [conversationId],
  );

  const handleTyping = useCallback(() => {
    if (!conversationId || disabled) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 500) {
      webSocketService.startTyping(conversationId);
      sendTypingStatus(true);
      lastTypingSentRef.current = now;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      webSocketService.stopTyping(conversationId);
      sendTypingStatus(false);
      lastTypingSentRef.current = 0;
    }, 2000);
  }, [conversationId, disabled, sendTypingStatus]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (conversationId) {
        webSocketService.stopTyping(conversationId);
        sendTypingStatus(false);
      }
    };
  }, [conversationId, sendTypingStatus]);

  const handleInputChange = (value: string) => {
    setMessage(value);
    handleTyping();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSending || disabled) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    webSocketService.stopTyping(conversationId);
    sendTypingStatus(false);

    setIsSending(true);

    try {
      await onSendMessage(message);
      setMessage("");
      lastTypingSentRef.current = 0;
    } catch {
      // Error handled in parent
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <MentionInput
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... Use @ to mention"
          className={`w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 ${isMentorship ? "focus:ring-orange-500" : "focus:ring-blue-500"} outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={disabled || isSending}
          autoFocus
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled || isSending}
          className={`px-4 py-2 ${isMentorship ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"} text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send
        </button>
      </div>
    </form>
  );
}

// ==================== MAIN COMPONENT ====================
export function MessagesView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    conversations: false,
    messages: false,
    users: false,
    identityStatus: false,
    sendingMessage: false,
  });
  const [chatFilter, setChatFilter] = useState<ChatFilter>("all");
  const [showMentorshipRequests, setShowMentorshipRequests] = useState(false);
  const [showMentorshipRequest, setShowMentorshipRequest] = useState(false);
  const [conversationLimit, setConversationLimit] = useState(50);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [identityRevealStatus, setIdentityRevealStatus] = useState<{
    is_revealed: boolean;
    requested_at?: string;
    responded_at?: string;
    status?: string;
    pending_request?: {
      id: string;
      status: string;
      direction: "sent" | "received";
    } | null;
    can_request?: boolean;
  } | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [mentorProfileData, setMentorProfileData] = useState<any>(null);
  const [showMentorProfileModal, setShowMentorProfileModal] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ==================== HELPERS ====================

  const parseConversationsResponse = (response: any): Conversation[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.conversations)) return response.conversations;
    return [];
  };

  // ==================== API FUNCTIONS ====================

  const fetchConnectableUsers = useCallback(async () => {
    if (!user?.id || !showNewConversation) return;

    setLoading((prev) => ({ ...prev, users: true }));
    try {
      const response = await GetConnectableUsers({
        search: searchUsername,
        limit: 20,
        offset: 0,
        exclude_existing: true,
      });

      let usersArray: any[] = [];

      if (Array.isArray(response)) {
        usersArray = response;
      } else if (Array.isArray(response?.users)) {
        usersArray = response.users;
      }

      const formattedUsers = usersArray.map((userData: any) => ({
        id: userData.id,
        username: userData.username || "Unknown User",
        display_name: resolveDisplayName(userData.display_name, userData.username) || "Unknown User",
        avatar: userData.avatar || "👤",
        job_title:
          userData.job_title || userData.job_title_encrypted || "Not specified",
        company:
          userData.company_encrypted || userData.company || "Not specified",
        bio: userData.bio,
        skills: userData.skills || [],
        can_message: userData.can_message !== false,
      }));

      setFilteredUsers(formattedUsers);
    } catch {
      setFilteredUsers([]);
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  }, [user?.id, showNewConversation, searchUsername]);

  const fetchIdentityRevealStatus = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;

      setLoading((prev) => ({ ...prev, identityStatus: true }));
      try {
        const response =
          await GetIdentityRevealStatusForConversation(conversationId);

        if (response && typeof response === "object") {
          setIdentityRevealStatus({
            is_revealed: response.identity_revealed ?? response.is_revealed ?? false,
            pending_request: response.pending_request || null,
            can_request: response.can_request ?? true,
            status: response.pending_request?.status,
          });
        }
      } catch {
        setIdentityRevealStatus(null);
      } finally {
        setLoading((prev) => ({ ...prev, identityStatus: false }));
      }
    },
    [],
  );

  const fetchConversations = useCallback(async (limit?: number) => {
    if (!user?.id) return;

    const fetchLimit = limit || conversationLimit;

    setLoading((prev) => ({ ...prev, conversations: true }));
    try {
      const response = await GetConversations({
        chat_type: "all",
        limit: fetchLimit,
        offset: 0,
        search: "",
      });

      const conversationsArray = parseConversationsResponse(response);
      setConversations(conversationsArray);
      setHasMoreConversations(conversationsArray.length >= fetchLimit);
    } catch {
      setConversations([]);
      setHasMoreConversations(false);
    } finally {
      setConversationsLoaded(true);
      setLoading((prev) => ({ ...prev, conversations: false }));
    }
  }, [user?.id, conversationLimit]);

  const loadMoreConversations = useCallback(async () => {
    if (loadingMoreConversations || !hasMoreConversations) return;

    setLoadingMoreConversations(true);
    const newLimit = conversationLimit + 50;
    setConversationLimit(newLimit);

    try {
      const response = await GetConversations({
        chat_type: "all",
        limit: newLimit,
        offset: 0,
        search: "",
      });

      const conversationsArray = parseConversationsResponse(response);
      setConversations(conversationsArray);
      setHasMoreConversations(conversationsArray.length >= newLimit);
    } catch {
      // Keep existing conversations on failure
    } finally {
      setLoadingMoreConversations(false);
    }
  }, [conversationLimit, loadingMoreConversations, hasMoreConversations]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;

      setLoading((prev) => ({ ...prev, messages: true }));
      try {
        const response = await GetSingleConversationMessages(conversationId, {
          limit: 50,
          before: undefined,
        });

        let messagesArray: Message[] = [];

        if (Array.isArray(response)) {
          messagesArray = response;
        } else if (Array.isArray(response?.messages)) {
          messagesArray = response.messages;
        }

        setMessages(messagesArray);

        // Mark messages as read silently
        if (messagesArray.length > 0) {
          const lastMessage = messagesArray[messagesArray.length - 1];
          if (
            lastMessage &&
            !lastMessage.is_read &&
            lastMessage.sender_id !== user?.id
          ) {
            try {
              await MarkMessagesAsRead(conversationId, lastMessage.id);
              webSocketService.markAsRead(lastMessage.id, conversationId);
            } catch {
              // Silent failure
            }
          }
        }
      } catch {
        setMessages([]);
      } finally {
        setLoading((prev) => ({ ...prev, messages: false }));
      }
    },
    [user?.id],
  );

  // ==================== HANDLERS ====================

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation || !user?.id) return;

    const chatType = selectedConversation.context_type || selectedConversation.chat_type || "regular";

    const messageData = {
      conversation_id: selectedConversation.id,
      content_encrypted: content,
      content_type: "text",
      chat_type: chatType,
    };

    // Try WebSocket first (real-time), fall back to REST API
    if (webSocketService.isReady()) {
      const sent = webSocketService.sendMessage(messageData);
      if (sent) {
        // Optimistic UI: show the message immediately while waiting for
        // the server's message_sent echo (which will deduplicate via id check)
        const optimistic: Message = {
          id: `temp-${Date.now()}`,
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content_encrypted: content,
          content_type: "text",
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        fetchConversations();
        return;
      }
    }

    // REST API fallback — guarantees delivery even if WS is flaky
    try {
      const response = await SendAMessage({
        conversation_id: selectedConversation.id,
        content_encrypted: content,
        content_type: "text",
        chat_type: chatType as "regular" | "mentorship",
      });

      // Add the sent message to the UI immediately
      const sentMsg = response;
      if (sentMsg?.id) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === sentMsg.id);
          if (exists) return prev;
          return [...prev, sentMsg];
        });
      }

      // Refresh conversations to update last_message preview
      fetchConversations();

      // Reconnect WS in the background so future messages use real-time
      if (!webSocketService.isReady()) {
        webSocketService.reconnect();
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to send message";
      showToast(msg, "error");
      throw error;
    }
  };

  const handleRequestIdentityReveal = async () => {
    if (!selectedConversation) return;

    try {
      await RequestIdentityReveal(selectedConversation.id);
      showToast("Identity reveal request sent", "success");
      fetchIdentityRevealStatus(selectedConversation.id);
    } catch (error) {
      const errorMessage =
        (typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as any).response?.data?.message) ||
        "Failed to send request";
      showToast(errorMessage, "error");
    }
  };

  const handleCreateNewChat = () => {
    setShowNewConversation(!showNewConversation);
    if (!showNewConversation) {
      setSearchUsername("");
      fetchConnectableUsers();
    }
  };

  // Helper: decrypt a single encrypted field, returns original value on failure
  const decryptField = async (value: string | undefined | null): Promise<string> => {
    if (!value || typeof value !== "string") return "";
    // Skip if it doesn't look encrypted (base64-like with special chars)
    if (value.length < 20 || /^[a-zA-Z0-9 ,.\-_()]+$/.test(value)) return value;
    try {
      const res = await DecryptData({ encryptedData: value });
      return res?.decryptedData ?? value;
    } catch {
      return value;
    }
  };

  // Pre-fetch mentor profile when entering a mentorship conversation
  const fetchMentorProfileForConversation = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const response = await GetMentorProfileByUserId(userId);
      const profile = response;

      if (profile) {
        const basic = profile.basicProfile || {};
        const mentor = profile.mentorProfile || null;
        const mentee = profile.menteeProfile || null;
        const status = profile.status || {};

        // Decrypt encrypted fields in parallel
        const [decryptedCompany, decryptedCareerLevel, decryptedAffinityTags] = await Promise.all([
          decryptField(basic.company),
          decryptField(basic.careerLevel),
          decryptField(basic.affinityTags),
        ]);

        // Parse affinity tags — could be JSON array string or comma-separated
        let parsedAffinityTags: string[] = [];
        if (decryptedAffinityTags) {
          try {
            const parsed = JSON.parse(decryptedAffinityTags);
            parsedAffinityTags = Array.isArray(parsed) ? parsed : [decryptedAffinityTags];
          } catch {
            parsedAffinityTags = decryptedAffinityTags.split(",").map((t: string) => t.trim()).filter(Boolean);
          }
        }

        setMentorProfileData({
          id: profile.id || userId,
          username: profile.username || "Unknown",
          display_name: resolveDisplayName(profile.display_name, profile.username) || "Unknown",
          avatar: profile.avatar || "👤",
          bio: basic.bio || mentor?.bio || "",
          company: decryptedCompany,
          jobTitle: basic.jobTitle || basic.job_title || "",
          careerLevel: decryptedCareerLevel,
          location: basic.location || "",
          expertise: mentor?.expertise || [],
          industries: mentor?.industries || mentee?.industries || [],
          mentoringAs: status.mentoringAs || "mentor",
          availability: mentor?.availability || mentee?.availability || "",
          responseTime: mentor?.responseTime || "",
          isAvailable: status.isActiveMentor || status.isActiveMentee || true,
          totalMentees: 0,
          yearsOfExperience: basic.yearsExperience ?? basic.yearsOfExperience ?? 0,
          affinityTags: parsedAffinityTags,
          mentorshipStyle: mentor?.mentorStyle || mentor?.style || "",
          languages: mentor?.languages || mentee?.languages || [],
          goals: mentee?.goals || "",
          // Full profile data
          mentorProfile: mentor,
          menteeProfile: mentee,
          mentorshipStatus: status.mentoringAs ? status : null,
          mentorshipStats: profile.stats || null,
        });
      }
    } catch (error) {
      console.error("Failed to pre-fetch mentor profile:", error);
    }
  }, []);

  const handleViewMentorProfile = () => {
    // Data is already pre-fetched — just open the modal
    if (mentorProfileData) {
      setShowMentorProfileModal(true);
    } else {
      showToast("Mentor profile is still loading...", "info");
    }
  };

  const handleStartConversation = async (userId: string) => {
    // Close the new conversation panel
    setShowNewConversation(false);
    setSearchUsername("");

    // Check if conversation already exists
    const existingConv = conversations.find((c) => c.other_user?.id === userId);

    if (existingConv) {
      // Navigate to existing conversation
      setSelectedConversation(existingConv);
      fetchMessages(existingConv.id);
      navigate(`/dashboard/messages?conversation=${existingConv.id}`);
    } else {
      // Create new conversation
      try {
        const data = await CreateConversation({
          other_user_id: userId,
          context_type: "regular",
        });

        const conversationId = data?.conversation_id || data?.id;
        if (!conversationId) return;

        // Refresh conversations and find the new one
        const response = await GetConversations({
          chat_type: "all",
          limit: 50,
          offset: 0,
          search: "",
        });

        const conversationsArray = parseConversationsResponse(response);
        const newConv = conversationsArray.find((c) => c.id === conversationId);

        if (newConv) {
          setSelectedConversation(newConv);
          setConversations(conversationsArray);
        } else {
          // Fallback: build a minimal conversation so the chat view opens
          const targetUser = filteredUsers.find((u) => u.id === userId);
          const fallbackConv: Conversation = {
            id: conversationId,
            participant1_id: user?.id || "",
            participant2_id: userId,
            context_type: "regular",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            other_user: targetUser || {
              id: userId,
              username: "User",
              display_name: "User",
              avatar: "",
              job_title: "",
              company: "",
            },
          };
          setSelectedConversation(fallbackConv);
          setConversations((prev) => [fallbackConv, ...prev]);
        }

        await fetchMessages(conversationId);
        navigate(`/dashboard/messages?conversation=${conversationId}`);
      } catch {
        showToast("Failed to start conversation", "error");
      }
    }
  };

  // ==================== EFFECTS ====================

  // Track WebSocket connection + authentication status
  useEffect(() => {
    const handleAuthenticated = () => {
      setWsConnected(true);
    };

    const handleDisconnected = () => {
      setWsConnected(false);
    };

    const handleConnectionError = () => {
      setWsConnected(false);
    };

    const handleAuthError = () => {
      setWsConnected(false);
    };

    webSocketService.on("authenticated", handleAuthenticated);
    webSocketService.on("disconnected", handleDisconnected);
    webSocketService.on("connection_error", handleConnectionError);
    webSocketService.on("auth_error", handleAuthError);

    // Use isReady() which checks both connected AND authenticated
    setWsConnected(webSocketService.isReady());

    return () => {
      webSocketService.off("authenticated", handleAuthenticated);
      webSocketService.off("disconnected", handleDisconnected);
      webSocketService.off("connection_error", handleConnectionError);
      webSocketService.off("auth_error", handleAuthError);
    };
  }, []);

  useEffect(() => {
    if (showNewConversation) {
      fetchConnectableUsers();
    }
  }, [showNewConversation, searchUsername, fetchConnectableUsers]);

  useEffect(() => {
    if (selectedConversation) {
      fetchIdentityRevealStatus(selectedConversation.id);
    }
  }, [selectedConversation, fetchIdentityRevealStatus]);

  // Pre-fetch mentor profile when entering a mentorship conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMentorProfileData(null);
      return;
    }
    const isMentorshipChat =
      selectedConversation.chat_type === "mentorship" ||
      selectedConversation.context_type === "mentorship";
    const otherUserId = selectedConversation.other_user?.id;
    if (isMentorshipChat && otherUserId) {
      fetchMentorProfileForConversation(otherUserId);
    }
  }, [selectedConversation?.id, fetchMentorProfileForConversation]);

  // WebSocket connection setup
  useEffect(() => {
    if (!user?.id) return;

    const connectTimeout = setTimeout(() => {
      // Use reconnect() if not already connected to reset any
      // isManualDisconnect flag from prior failures
      if (!webSocketService.isConnected()) {
        webSocketService.reconnect();
      }
    }, 1000);

    return () => {
      clearTimeout(connectTimeout);
    };
  }, [user?.id]);

  // WebSocket event handlers
  useEffect(() => {
    if (!user?.id) return;

    const handleNewMessage = (data: any) => {
      const messageData = data.data || data;

      if (
        selectedConversation &&
        messageData.conversation_id === selectedConversation.id
      ) {
        // Skip own messages — handleMessageSent handles those
        if (messageData.sender_id === user.id) {
          fetchConversations();
          return;
        }

        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === messageData.id);
          if (exists) return prev;
          return [...prev, messageData];
        });

        if (!messageData.is_read && messageData.id) {
          MarkMessagesAsRead(selectedConversation.id, messageData.id)
            .then(() => {
              webSocketService.markAsRead(
                messageData.id,
                selectedConversation.id,
              );
            })
            .catch(() => {});
        }
      }

      fetchConversations();
    };

    const handleMessageSent = (data: any) => {
      const messageData = data?.data || data;

      if (
        selectedConversation &&
        messageData?.conversation_id === selectedConversation.id &&
        messageData?.id
      ) {
        setMessages((prev) => {
          // Remove optimistic temp messages and check for duplicates
          const withoutTemp = prev.filter((msg) => !msg.id.startsWith("temp-"));
          const exists = withoutTemp.some((msg) => msg.id === messageData.id);
          if (exists) return withoutTemp;
          return [...withoutTemp, messageData];
        });
      }
      fetchConversations();
    };

    const handleMessageError = (data: any) => {
      const errorData = data?.data || data;
      showToast(errorData?.message || "Message failed to send", "error");
    };

    const handleTypingStart = (data: any) => {
      const typingData = data.data || data;

      if (
        selectedConversation &&
        typingData.conversation_id === selectedConversation.id &&
        typingData.user_id !== user.id
      ) {
        setTypingUsers((prev) => {
          const exists = prev.some((u) => u.user_id === typingData.user_id);
          if (exists) {
            return prev.map((u) =>
              u.user_id === typingData.user_id
                ? { ...u, is_typing: true }
                : u,
            );
          }
          return [
            ...prev,
            {
              ...typingData,
              conversation_id: selectedConversation.id,
              is_typing: true,
            },
          ];
        });
      }
    };

    const handleTypingEnd = (data: any) => {
      const typingData = data.data || data;

      if (selectedConversation) {
        setTypingUsers((prev) =>
          prev.filter((u) => u.user_id !== typingData.user_id),
        );
      }
    };

    const handleIdentityRevealRequest = () => {
      if (selectedConversation) {
        fetchIdentityRevealStatus(selectedConversation.id);
      }
    };

    const handleIdentityRevealResponse = () => {
      if (selectedConversation) {
        fetchIdentityRevealStatus(selectedConversation.id);
      }
    };

    // Register event listeners
    webSocketService.on("new_message", handleNewMessage);
    webSocketService.on("message_sent", handleMessageSent);
    webSocketService.on("message_error", handleMessageError);
    webSocketService.on("typing_start", handleTypingStart);
    webSocketService.on("typing_end", handleTypingEnd);
    webSocketService.on("identity_reveal_request", handleIdentityRevealRequest);
    webSocketService.on(
      "identity_reveal_response",
      handleIdentityRevealResponse,
    );

    return () => {
      webSocketService.off("new_message", handleNewMessage);
      webSocketService.off("message_sent", handleMessageSent);
      webSocketService.off("message_error", handleMessageError);
      webSocketService.off("typing_start", handleTypingStart);
      webSocketService.off("typing_end", handleTypingEnd);
      webSocketService.off(
        "identity_reveal_request",
        handleIdentityRevealRequest,
      );
      webSocketService.off(
        "identity_reveal_response",
        handleIdentityRevealResponse,
      );
    };
  }, [user?.id, selectedConversation, fetchConversations, fetchIdentityRevealStatus, fetchMessages]);

  // Handle joining/leaving conversations
  useEffect(() => {
    if (!selectedConversation?.id || !user?.id) return;

    // joinConversation now auto-queues if not yet authenticated
    if (webSocketService.isConnected()) {
      webSocketService.joinConversation(selectedConversation.id);
    } else {
      // Use reconnect() to reset isManualDisconnect flag and connect fresh
      webSocketService.reconnect();
      // Will auto-join once authenticated thanks to pending operations queue
      webSocketService.joinConversation(selectedConversation.id);
    }

    GetTypingStatus(selectedConversation.id)
      .then((status) => {
        setTypingUsers(status?.active_typers || []);
      })
      .catch(() => {});

    return () => {
      if (selectedConversation?.id && webSocketService.isConnected()) {
        webSocketService.leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation?.id, user?.id]);

  // Initial load and handle URL conversation parameter
  useEffect(() => {
    const conversationId = searchParams.get("conversation");

    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv && conv.id !== selectedConversation?.id) {
        setSelectedConversation(conv);
        fetchMessages(conv.id);
      }
    }
  }, [searchParams, conversations, selectedConversation?.id, fetchMessages]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle ?tab=mentorship-requests to auto-open mentorship requests view
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "mentorship-requests") {
      setShowMentorshipRequests(true);
      // Clear param so it doesn't re-trigger
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle startChatWith from navigation state (e.g., from UserProfileModal Chat button)
  useEffect(() => {
    const state = location.state as { startChatWith?: string; contextType?: string } | null;
    if (!state?.startChatWith || !conversationsLoaded) return;

    const userId = state.startChatWith;
    const contextType = state.contextType || "regular";

    // Clear the state so it doesn't re-trigger
    navigate(location.pathname + location.search, { replace: true, state: {} });

    // Check if conversation with this user already exists (matching context_type for mentorship)
    const existingConv = conversations.find((c) => {
      if (c.other_user?.id !== userId) return false;
      if (contextType === "mentorship") return c.context_type === "mentorship";
      return true;
    });

    if (existingConv) {
      setSelectedConversation(existingConv);
      fetchMessages(existingConv.id);
    } else {
      // Create a new conversation and auto-route to chat view
      CreateConversation({
        other_user_id: userId,
        context_type: contextType as "regular" | "mentorship",
      })
        .then(async (data) => {
          const convId = data?.conversation_id || data?.id;
          if (!convId) return;

          // Fetch fresh conversation list and select the new one
          const response = await GetConversations({
            chat_type: "all",
            limit: 50,
            offset: 0,
            search: "",
          });
          const convList = parseConversationsResponse(response);
          const newConv = convList.find((c) => c.id === convId);

          if (newConv) {
            setSelectedConversation(newConv);
            setConversations(convList);
          }

          await fetchMessages(convId);
          navigate(`/dashboard/messages?conversation=${convId}`, { replace: true });
        })
        .catch((err) => {
          const msg = err?.response?.data?.message || "Failed to start conversation";
          showToast(msg, "error");
        });
    }
  }, [location.state, conversationsLoaded]);

  // Handle ?user= query param (e.g., from MentorshipView Message button)
  useEffect(() => {
    const userId = searchParams.get("user");
    if (!userId || !conversationsLoaded) return;

    const chatType = searchParams.get("chat_type") || "regular";

    // Clear the query params so it doesn't re-trigger
    navigate(location.pathname, { replace: true });

    const existingConv = conversations.find((c) => c.other_user?.id === userId);

    if (existingConv) {
      setSelectedConversation(existingConv);
      fetchMessages(existingConv.id);
    } else {
      // Create a new conversation and auto-route to chat view
      CreateConversation({
        other_user_id: userId,
        context_type: chatType as "regular" | "mentorship",
      })
        .then(async (data) => {
          const convId = data?.conversation_id || data?.id;
          if (!convId) return;

          // Fetch fresh conversation list and select the new one
          const response = await GetConversations({
            chat_type: "all",
            limit: 50,
            offset: 0,
            search: "",
          });
          const convList = parseConversationsResponse(response);
          const newConv = convList.find((c) => c.id === convId);

          if (newConv) {
            setSelectedConversation(newConv);
            setConversations(convList);
          }

          await fetchMessages(convId);
          navigate(`/dashboard/messages?conversation=${convId}`, { replace: true });
        })
        .catch((err) => {
          const msg = err?.response?.data?.message || "Failed to start conversation";
          showToast(msg, "error");
        });
    }
  }, [searchParams, conversationsLoaded]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // ==================== UTILITY FUNCTIONS ====================

  const unreadCount = conversations.reduce(
    (acc, conv) => acc + (conv.unread_count || 0),
    0,
  );

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getIdentityRevealStatus = (conversation: Conversation) => {
    return (
      conversation.identity_revealed ||
      (identityRevealStatus && identityRevealStatus.is_revealed === true)
    );
  };

  // ==================== RENDER CHAT VIEW ====================
  if (selectedConversation) {
    const otherUser = selectedConversation.other_user || {
      id: "",
      username: "Unknown User",
      display_name: "Unknown User",
      avatar: "👤",
      job_title: "",
      company: "",
    };
    const isMentorship = selectedConversation.chat_type === "mentorship" || selectedConversation.context_type === "mentorship";
    const identityRevealed = getIdentityRevealStatus(selectedConversation);
    const isTyping = typingUsers.some(
      (u) =>
        u.conversation_id === selectedConversation.id && u.is_typing === true,
    );
    return (
      <>
      <div className="max-w-4xl mx-auto flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => {
                setSelectedConversation(null);
                navigate("/dashboard/messages");
              }}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`w-10 h-10 ${isMentorship ? "bg-orange-100" : "bg-blue-100"} rounded-full flex items-center justify-center text-2xl`}>
              {otherUser.avatar || "👤"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {resolveDisplayName(otherUser.display_name, otherUser.username) || "User"}
                </h3>
                {isMentorship && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    Mentorship
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {otherUser.company} • {otherUser.job_title}
              </p>
            </div>
            {!identityRevealed && (() => {
              const pending = identityRevealStatus?.pending_request;
              const canRequest = identityRevealStatus?.can_request !== false;
              const isPendingSent = pending?.status === "pending" && pending?.direction === "sent";
              const isPendingReceived = pending?.status === "pending" && pending?.direction === "received";

              if (isPendingSent) {
                return (
                  <div className={`p-2 ${isMentorship ? "text-orange-400" : "text-blue-400"} rounded-lg`} title="Identity reveal request pending">
                    <Clock className="w-5 h-5" />
                  </div>
                );
              }

              if (isPendingReceived) {
                return (
                  <button
                    type="button"
                    onClick={handleRequestIdentityReveal}
                    disabled={loading.identityStatus}
                    className={`p-2 ${isMentorship ? "text-orange-600 hover:bg-orange-50" : "text-blue-600 hover:bg-blue-50"} rounded-lg transition-colors disabled:opacity-50 animate-pulse`}
                    title="They requested to reveal identities — click to accept"
                  >
                    {loading.identityStatus ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                );
              }

              if (canRequest) {
                return (
                  <button
                    type="button"
                    onClick={handleRequestIdentityReveal}
                    disabled={loading.identityStatus}
                    className={`p-2 ${isMentorship ? "text-orange-600 hover:bg-orange-50" : "text-blue-600 hover:bg-blue-50"} rounded-lg transition-colors disabled:opacity-50`}
                    title="Request Identity Reveal"
                  >
                    {loading.identityStatus ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                );
              }

              return null;
            })()}
          </div>
          {isMentorship && (
            <button
              type="button"
              onClick={handleViewMentorProfile}
              disabled={!mentorProfileData}
              className="w-full px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {!mentorProfileData ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading Profile...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  View Mentorship Profile
                </>
              )}
            </button>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 bg-gray-50 p-4 space-y-3 overflow-y-auto">
          {loading.messages ? (
            <MessagesSkeleton />
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              {isMentorship ? (
                <>
                  <Target className="w-12 h-12 text-orange-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-500">Start Your Mentorship Journey</h3>
                  <p className="text-sm text-gray-400">
                    Share your goals, ask questions, and build a meaningful connection.
                  </p>
                </>
              ) : (
                <>
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-500">No messages yet</h3>
                  <p className="text-sm text-gray-400">Start the conversation!</p>
                </>
              )}
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-xs md:max-w-[40vw] ${isOwn ? "text-right" : ""}`}>
                    <div
                      className={`inline-block px-3 py-2 rounded-2xl ${
                        isOwn
                          ? `${isMentorship ? "bg-orange-600" : "bg-blue-600"} text-white rounded-br-md`
                          : "bg-white border border-gray-200 rounded-bl-md"
                      }`}
                    >
                      <MentionText text={message.content_encrypted} className="text-sm block" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeAgo(message.sent_at || message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="text-left">
              <div className="inline-block bg-white px-3 py-2 rounded-2xl rounded-bl-md max-w-xs border border-gray-200">
                <p className="text-sm text-gray-500 italic">typing...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <MessageInputComponent
            conversationId={selectedConversation.id}
            onSendMessage={handleSendMessage}
            isMentorship={isMentorship}
            disabled={loading.messages}
          />
        </div>
      </div>

      <MentorshipUserProfileModal
        isOpen={showMentorProfileModal}
        onClose={() => setShowMentorProfileModal(false)}
        profile={mentorProfileData}
        currentUserId={user?.id}
        context="mentorship-view"
      />
      </>
    );
  }

  // ==================== RENDER MENTORSHIP REQUESTS VIEW ====================
  if (showMentorshipRequests) {
    return (
      <MentorshipRequestsView onBack={() => setShowMentorshipRequests(false)} />
    );
  }

  // ==================== RENDER MAIN VIEW ====================
  return (
    <>
      <div className="max-w-4xl mx-auto">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Messages
              </h1>
              <p className="text-gray-500">
                All your conversations in one place
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMentorshipRequests(true)}
              className="px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">Mentorship Requests</span>
              <span className="sm:hidden">Requests</span>
            </button>
          </div>
        </header>

        <div>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateNewChat}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          {showNewConversation && (
            <div className="mb-4 p-4 bg-white border border-blue-200 rounded-xl shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">
                Start New Conversation
              </h3>
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search users by username..."
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {loading.users ? (
                  <UserSearchSkeleton />
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleStartConversation(user.id)}
                      disabled={!user.can_message}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        !user.can_message ? "Cannot message this user" : ""
                      }
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {user.avatar}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 block">
                          {resolveDisplayName(user.display_name, user.username)}
                        </span>
                        <span className="text-xs text-gray-500 block">
                          {user.job_title !== "Not specified" &&
                          user.company !== "Not specified"
                            ? `${user.job_title} • ${user.company}`
                            : "User"}
                        </span>
                      </div>
                      {user.privacy_level === "anonymous" && (
                        <Shield className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-3">
                    <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {searchUsername
                        ? "No users found matching your search"
                        : "No users available to chat with"}
                    </p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewConversation(false);
                  setSearchUsername("");
                }}
                className="mt-3 w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          )}

          {loading.conversations ? (
            <ConversationsSkeleton />
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium text-gray-500 mb-1">
                No conversations yet
              </h3>
              <p className="text-sm text-gray-400">
                Accept connection requests to start messaging
              </p>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              onSelect={(conv) => {
                setSelectedConversation(conv);
                fetchMessages(conv.id);
              }}
              getIdentityRevealStatus={getIdentityRevealStatus}
              getTimeAgo={getTimeAgo}
              chatFilter={chatFilter}
              onFilterChange={setChatFilter}
              hasMore={hasMoreConversations}
              onLoadMore={loadMoreConversations}
              loadingMore={loadingMoreConversations}
              onNewChat={handleCreateNewChat}
            />
          )}
        </div>

        <MentorshipRequestModal
          isOpen={showMentorshipRequest}
          onClose={() => setShowMentorshipRequest(false)}
        />

        <MentorshipUserProfileModal
          isOpen={showMentorProfileModal}
          onClose={() => setShowMentorProfileModal(false)}
          profile={mentorProfileData}
          currentUserId={user?.id}
          context="mentorship-view"
        />

      </div>
    </>
  );
}
