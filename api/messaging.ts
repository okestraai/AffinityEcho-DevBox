// api/messaging.ts
import { getAuthInstance, API_URL, unwrap } from "./base";

export const SendAMessage = async (payload: {
  conversation_id: string;
  content_encrypted: string;
  content_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  reply_to?: string;
  chat_type: "regular" | "mentorship";
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/messaging/send`, payload);
  return unwrap(res);
};

export const MarkMessagesAsRead = async (
  conversation_id: string,
  message_id: string,
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(`${API_URL}/messaging/read`, {
    conversation_id,
    message_id,
  });
  return unwrap(res);
};

export const GetMessageUnreadCount = async (
  filters: {
    chat_type?: "all" | "regular" | "mentorship";
  } = {},
) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  if (filters.chat_type) queryParams.append("chat_type", filters.chat_type);
  const queryString = queryParams.toString();
  const url = `${API_URL}/messaging/unread-count${queryString ? `?${queryString}` : ""}`;
  const res = await authFetch.get(url);
  return unwrap(res);
};

export const GetTypingStatus = async (conversationId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/messaging/typing/${conversationId}`,
  );
  return unwrap(res);
};

export const CreateConversation = async (payload: {
  other_user_id: string;
  context_type: "regular" | "mentorship";
  context_id?: string;
  initial_message?: string;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/conversations`, payload);
  return unwrap(res);
};

export const GetConversations = async (filter: {
  chat_type: "all" | "regular" | "mentorship";
  limit: number;
  offset: number | 0;
  search: string;
}) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  queryParams.append("chat_type", filter.chat_type);
  queryParams.append("limit", filter.limit.toString());
  queryParams.append("offset", filter.offset.toString());
  if (filter.search) queryParams.append("search", filter.search);
  const url = `${API_URL}/conversations?${queryParams.toString()}`;
  const res = await authFetch.get(url);
  return unwrap(res);
};

export const GetSingleConversationMessages = async (
  conversationId: string,
  filter: { limit: number; before?: string },
) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  queryParams.append("limit", filter.limit.toString());
  if (filter.before) queryParams.append("before", filter.before);
  const url = `${API_URL}/conversations/${conversationId}/messages?${queryParams.toString()}`;
  const res = await authFetch.get(url);
  return unwrap(res);
};

export const DeleteConversation = async (conversationId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(
    `${API_URL}/conversations/${conversationId}/clear`,
  );
  return unwrap(res);
};

export const RequestIdentityReveal = async (
  conversationId: string,
  message?: string,
  connection_id?: string,
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/identity-reveal/request`, {
    conversation_id: conversationId,
    message,
    connection_id,
  });
  return unwrap(res);
};

export const RespondToIdentityReveal = async (
  reveal_id: string,
  action: string,
  reason?: string,
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(`${API_URL}/identity-reveal/respond`, {
    reveal_id,
    action,
    reason,
  });
  return unwrap(res);
};

export const GetIdentityRevealRequests = async (filter: {
  status: "pending" | "accepted" | "rejected";
}) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  queryParams.append("status", filter.status);
  const res = await authFetch.get(
    `${API_URL}/identity-reveal?${queryParams.toString()}`,
  );
  return unwrap(res);
};

export const GetIdentityRevealStatusForConversation = async (
  conversationId: string,
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/identity-reveal/status/${conversationId}`,
  );
  return unwrap(res);
};

export const StartMentorshipChatFromDirectRequest = async (
  mentorshipRequestId: string,
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/mentorship-chat/start-from-request/${mentorshipRequestId}`,
  );
  return unwrap(res);
};

export const SetTypingStatus = async (payload: {
  conversation_id: string;
  is_typing: boolean;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/messaging/typing`, payload);
  return unwrap(res);
};

// NEW: User discovery functions
export const GetConnectableUsers = async (filters: {
  search?: string;
  limit?: number;
  offset?: number;
  exclude_existing?: boolean;
  role?: "mentor" | "mentee" | "both";
  skills?: string[];
  company_type?: string;
}) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();

  if (filters.search) queryParams.append("search", filters.search);
  if (filters.limit) queryParams.append("limit", filters.limit.toString());
  if (filters.offset) queryParams.append("offset", filters.offset.toString());
  if (filters.exclude_existing !== undefined)
    queryParams.append("exclude_existing", filters.exclude_existing.toString());
  if (filters.role) queryParams.append("role", filters.role);
  if (filters.skills?.length)
    queryParams.append("skills", filters.skills.join(","));
  if (filters.company_type)
    queryParams.append("company_type", filters.company_type);

  const url = `${API_URL}/user-discovery/connectable-users?${queryParams.toString()}`;
  const res = await authFetch.get(url);
  return unwrap(res);
};

// Search users for @ mentions — returns ALL users matching query (no conversation filter)
export const SearchUsersForMention = async (filters: {
  search: string;
  limit?: number;
}) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  queryParams.append("search", filters.search);
  if (filters.limit) queryParams.append("limit", filters.limit.toString());

  const url = `${API_URL}/user-discovery/search?${queryParams.toString()}`;
  const res = await authFetch.get(url);
  return unwrap(res);
};

export const GetUserSuggestions = async (limit?: number) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append("limit", limit.toString());

  const url = `${API_URL}/user-discovery/suggestions?${queryParams.toString()}`;
  const res = await authFetch.get(url);
  return unwrap(res);
};
