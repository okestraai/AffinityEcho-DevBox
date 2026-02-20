// api/forumApis.ts
import { getAuthInstance, API_URL, unwrap } from "./base";

export const GetLocalScopeMetrics = async (companyName: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/forum/metrics/local/${companyName}`
  );
  return unwrap(res);
};

export const GetGlobalScopeMetrics = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/forum/metrics/global`);
  return unwrap(res);
};

export const GetRecentDiscussions = async (
  companyName: string,
  filters: {
    search?: string;
    sortBy?: string;
    timeFilter?: string;
    isGlobal?: boolean;
    category?: string;
    page?: number;
    limit?: number;
  } = {}
) => {
  const authFetch = getAuthInstance();

  // Build query string from filters
  const queryParams = new URLSearchParams();

  if (filters.search) queryParams.append("search", filters.search);
  if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
  if (filters.timeFilter) queryParams.append("timeFilter", filters.timeFilter);
  if (filters.isGlobal !== undefined)
    queryParams.append("isGlobal", filters.isGlobal.toString());
  if (filters.category) queryParams.append("category", filters.category);
  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.limit) queryParams.append("limit", filters.limit.toString());

  const queryString = queryParams.toString();
  const url = `${API_URL}/forum/recent-discussions/${encodeURIComponent(
    companyName
  )}${queryString ? `?${queryString}` : ""}`;

  const res = await authFetch.get(url);
  return unwrap(res);
};

export const GetFoundationForums = async (companyName: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/forum/foundation/${companyName}`);
  return unwrap(res);
};

export const GetUserJoinedForums = async (companyName: string) => {
  const authFetch = getAuthInstance();

  const queryParams = new URLSearchParams();
  queryParams.append("companyName", companyName);

  const url = `${API_URL}/forum/joined?${queryParams.toString()}`;

  const res = await authFetch.get(url);
  return unwrap(res);
};

export const CreateForumTopic = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/forum/topics`, payload);
  return unwrap(res);
};

export const GetForumTopicById = async (topicId: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/forum/topics/${topicId}`);
  return unwrap(res);
};

export const GetForumById = async (forumId: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/forum/${forumId}`);
  return unwrap(res);
};

export const UserJoinForum = async (forumId: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/forum/${forumId}/join`);
  return unwrap(res);
};

export const UserLeaveForum = async (forumId: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/forum/${forumId}/leave`);
  return unwrap(res);
};

export const ForumTopicsReactions = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/forum/topics/reactions`,
    payload
  );
  return unwrap(res);
};
export const CreateForumTopicsComments = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/forum/comments`, payload);
  return unwrap(res);
};

export const GetAllCommentsForATopic = async (topicId: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/forum/topics/${topicId}/comments`
  );
  return unwrap(res);
};

export const TopicsCommentsReactions = async (payload: string | number) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/forum/comments/reactions`,
    payload
  );
  return unwrap(res);
};

export const DeleteTopicsComments = async (commentId: string | number) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/forum/comments/${commentId}`);
  return unwrap(res);
};

/**
 * Get topics created by the authenticated user
 */
export const GetMyForumTopics = async (page: number = 1, limit: number = 20) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/forum/topics/my-posts?page=${page}&limit=${limit}`
  );
  return unwrap(res);
};

/**
 * Get topics bookmarked by the authenticated user
 */
export const GetBookmarkedForumTopics = async (page: number = 1, limit: number = 20) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/forum/topics/bookmarked?page=${page}&limit=${limit}`
  );
  return unwrap(res);
};

/**
 * Toggle bookmark on a forum topic
 */
export const ToggleTopicBookmark = async (topicId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/forum/topics/${topicId}/bookmark`);
  return unwrap(res);
};
