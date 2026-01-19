// src/api/nooksApi.ts
import axiosInstance from "../src/Helper/AxiosInterceptor";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthInstance = () => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  return axiosInstance(accessToken, refreshToken);
};

export const CreateNook = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/nooks`, payload);
  return res.data;
};

// this is the payload
// {
//   "title": "Microaggressions at Work",
//   "description": "Safe space to share and process daily microaggressions",
//   "urgency": "high",
//   "scope": "global",
//   "hashtags": [
//     "microaggressions",
//     "workplace",
//     "support"
//   ]
// }

export const GetNooks = async (
  filters: {
    urgency?: string;
    scope?: string;
    temperature?: string;
    hashtag?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  } = {}
) => {
  const authFetch = getAuthInstance();

  // Build query string from filters
  const queryParams = new URLSearchParams();

  // Add all filter parameters
  if (filters.urgency) queryParams.append("urgency", filters.urgency);
  if (filters.scope) queryParams.append("scope", filters.scope);
  if (filters.temperature)
    queryParams.append("temperature", filters.temperature);
  if (filters.hashtag) queryParams.append("hashtag", filters.hashtag);
  if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
  if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder);

  // Page and limit with defaults
  const page = filters.page || 1;
  const limit = filters.limit || 8;
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());

  const queryString = queryParams.toString();
  const url = `${API_URL}/nooks${queryString ? `?${queryString}` : ""}`;

  const res = await authFetch.get(url);
  return res.data;
};

export const GetNookMetrics = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/nooks/stats`);
  return res.data;
};

export const GetNookById = async (nookId: string | number) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/nooks/${nookId}`);
  return res.data;
};

export const DeleteNooksById = async (nookId: string | number) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/nooks/${nookId}`);
  return res.data;
};

export const FlagMessage = async (nookId: string | number) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/nooks/${nookId}/flag`);
  return res.data;
};

export const GetNookMessagesByNookId = async (
  nookId: string,
  filters: {
    sortOrder?: string;
    page?: number;
    limit?: number;
  } = {}
) => {
  const authFetch = getAuthInstance();

  // Build query string from filters
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.limit) queryParams.append("limit", filters.limit.toString());
  if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder); // Fixed: should be sortOrder, not sortBy

  const queryString = queryParams.toString();
  const url = `${API_URL}/nooks/${encodeURIComponent(nookId)}/messages${
    queryString ? `?${queryString}` : ""
  }`; // Fixed URL construction

  const res = await authFetch.get(url);
  return res.data;
};

export const PostNookMessageByNookId = async (
  nookId: string | number,
  payload: any
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/nooks/${nookId}/messages`,
    payload
  );
  return res.data;
};

export const DeleteNooksMessageById = async (
  nookId: string | number,
  messageId: string | number
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(
    `${API_URL}/nooks/${nookId}/messages/${messageId}`
  );
  return res.data;
};

export const JoinNook = async (nookId: string | number, payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/nooks/${nookId}/members/join`,
    payload
  );
  return res.data;
};

export const LeaveNook = async (nookId: string | number) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/nooks/${nookId}/members/leave`);
  return res.data;
};

export const GetNookMembers = async (nookId: string | number) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/nooks/${nookId}/members`);
  return res.data;
};

/**
 * Add reaction to a NOOK (nook-level)
 */
export const addNookReaction = async (
  nookId: string,
  payload: { reaction_type: string }
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/nooks/${nookId}/reactions`,
    payload
  );
  return res.data;
};

/**
 * Remove reaction from a NOOK (nook-level)
 */
export const removeNookReaction = async (
  nookId: string,
  reactionType: string
) => {
  const authFetch = getAuthInstance();

  const params = new URLSearchParams({ reaction_type: reactionType });
  const url = `${API_URL}/nooks/${nookId}/reactions?${params.toString()}`;

  const res = await authFetch.delete(url);
  return res.data;
};

/**
 * Toggle reaction on a MESSAGE (recommended - use this for both add & remove)
 *
 * Your backend toggle endpoint handles both adding and removing with a single POST.
 * → This is the preferred method in modern apps.
 */
export const toggleMessageReaction = async (
  messageId: string,
  payload: { reaction_type: string }
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/nooks/messages/${messageId}/reactions`,
    payload
  );
  return res.data;
};

/**
 * Legacy/Alternative: Remove reaction from a MESSAGE using DELETE
 * (Only use if you really need separate DELETE - not recommended)
 */
export const removeMessageReaction = async (
  messageId: string,
  reactionType: string
) => {
  const authFetch = getAuthInstance();

  const params = new URLSearchParams({ reaction_type: reactionType });
  const url = `${API_URL}/nooks/messages/${messageId}/reactions?${params.toString()}`;

  const res = await authFetch.delete(url);
  return res.data;
};
