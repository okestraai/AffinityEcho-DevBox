// api/feedApis.ts
import { getAuthInstance, API_URL, unwrap } from "./base";

// ============================================================================
// FEED ENDPOINTS - Base URL: /feeds
// ============================================================================

/**
 * Get aggregated feed with filters
 */
export const GetFeed = async (params: {
  filter?: "all" | "following" | "trending" | "company" | "global";
  contentType?: "all" | "post" | "topic" | "nook_message";
  sortBy?: "recent" | "popular" | "most_liked" | "most_commented";
  company?: string;
  tags?: string;
  page?: number;
  limit?: number;
} = {}) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  if (params.filter) queryParams.append("filter", params.filter);
  if (params.contentType) queryParams.append("contentType", params.contentType);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.company) queryParams.append("company", params.company);
  if (params.tags) queryParams.append("tags", params.tags);
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));

  const qs = queryParams.toString();
  const res = await authFetch.get(`${API_URL}/feeds${qs ? `?${qs}` : ""}`);
  return unwrap(res);
};

/**
 * Create a post
 */
export const CreatePost = async (payload: {
  content: string;
  visibility?: "global" | "company" | "connections";
  isAnonymous?: boolean;
  tags?: string[];
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/feeds/posts`, payload);
  return unwrap(res);
};

/**
 * Get a single post by ID
 */
export const GetPostById = async (postId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/feeds/posts/${postId}`);
  return unwrap(res);
};

/**
 * Get posts by a specific user
 */
export const GetUserPosts = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/feeds/users/${userId}/posts?page=${page}&limit=${limit}`
  );
  return unwrap(res);
};

/**
 * Update a post
 */
export const UpdatePost = async (
  postId: string,
  payload: {
    content?: string;
    visibility?: "global" | "company" | "connections";
    isAnonymous?: boolean;
    tags?: string[];
  }
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(`${API_URL}/feeds/posts/${postId}`, payload);
  return unwrap(res);
};

/**
 * Delete a post
 */
export const DeletePost = async (postId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/feeds/posts/${postId}`);
  return unwrap(res);
};

/**
 * Pin a post
 */
export const PinPost = async (postId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/feeds/posts/${postId}/pin`);
  return unwrap(res);
};

/**
 * Unpin a post
 */
export const UnpinPost = async (postId: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/feeds/posts/${postId}/pin`);
  return unwrap(res);
};

/**
 * Toggle like on content (post, topic, nook_message) — legacy
 */
export const ToggleLike = async (
  contentType: "post" | "topic" | "nook_message",
  contentId: string
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/feeds/${contentType}/${contentId}/like`
  );
  return unwrap(res);
};

/**
 * Toggle a reaction (heard/validated/inspired) on feed content
 */
export const ToggleFeedReaction = async (
  contentType: "post" | "topic" | "nook_message",
  contentId: string,
  reactionType: "heard" | "validated" | "inspired"
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/feeds/${contentType}/${contentId}/react`,
    { reactionType }
  );
  return unwrap(res);
};

/**
 * Add a comment to content
 */
export const AddComment = async (
  contentType: "post" | "topic" | "nook_message",
  contentId: string,
  payload: {
    content: string;
    parentCommentId?: string;
    isAnonymous?: boolean;
  }
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/feeds/${contentType}/${contentId}/comments`,
    payload
  );
  return unwrap(res);
};

/**
 * Get comments for content
 */
export const GetComments = async (
  contentType: "post" | "topic" | "nook_message",
  contentId: string,
  page: number = 1,
  limit: number = 20
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/feeds/${contentType}/${contentId}/comments?page=${page}&limit=${limit}`
  );
  return unwrap(res);
};

/**
 * Share content
 */
export const ShareItem = async (
  contentType: "post" | "topic" | "nook_message",
  contentId: string,
  payload?: { shareMessage?: string }
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/feeds/${contentType}/${contentId}/share`,
    payload || {}
  );
  return unwrap(res);
};

/**
 * Unshare content
 */
export const UnshareItem = async (
  contentType: "post" | "topic" | "nook_message",
  contentId: string
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(
    `${API_URL}/feeds/${contentType}/${contentId}/share`
  );
  return unwrap(res);
};

/**
 * Toggle bookmark on content
 */
export const ToggleBookmark = async (
  contentType: "post" | "topic" | "nook_message",
  contentId: string
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/feeds/${contentType}/${contentId}/bookmark`
  );
  return unwrap(res);
};

/**
 * Get user's bookmarks
 */
export const GetBookmarks = async (page: number = 1, limit: number = 20) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(
    `${API_URL}/feeds/bookmarks?page=${page}&limit=${limit}`
  );
  return unwrap(res);
};
