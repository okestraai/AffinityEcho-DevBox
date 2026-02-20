// api/notificationApis.ts
import { getAuthInstance, API_URL, unwrap } from "./base";

// ============================================================================
// NOTIFICATION ENDPOINTS - Base URL: /notifications
// ============================================================================

/**
 * Create a notification (admin/system use)
 */
export const CreateNotification = async (payload: {
  user_id: string;
  actor_id?: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: Record<string, unknown>;
  delivery_method?: string[];
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/notifications`, payload);
  return unwrap(res);
};

/**
 * Get user notifications with optional filters
 */
export const GetNotifications = async (params: {
  is_read?: boolean;
  type?: string;
  page?: number;
  limit?: number;
} = {}) => {
  const authFetch = getAuthInstance();
  const queryParams = new URLSearchParams();
  if (params.is_read !== undefined) queryParams.append("is_read", String(params.is_read));
  if (params.type) queryParams.append("type", params.type);
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));

  const qs = queryParams.toString();
  const res = await authFetch.get(`${API_URL}/notifications${qs ? `?${qs}` : ""}`);
  return unwrap(res);
};

/**
 * Get unread notification count
 */
export const GetUnreadCount = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/notifications/unread-count`);
  return unwrap(res);
};

/**
 * Get notification statistics
 */
export const GetNotificationStats = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/notifications/stats`);
  return unwrap(res);
};

/**
 * Get a single notification by ID
 */
export const GetNotificationById = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/notifications/${id}`);
  return unwrap(res);
};

/**
 * Update a notification
 */
export const UpdateNotification = async (
  id: string,
  payload: {
    is_read?: boolean;
    action_taken?: boolean;
    is_delivered?: boolean;
  }
) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/notifications/${id}`, payload);
  return unwrap(res);
};

/**
 * Mark a single notification as read
 */
export const MarkNotificationAsRead = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/notifications/${id}/read`);
  return unwrap(res);
};

/**
 * Mark all notifications as read
 */
export const MarkAllNotificationsAsRead = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/notifications/mark-all-read`);
  return unwrap(res);
};

/**
 * Delete a single notification
 */
export const DeleteNotification = async (id: string) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/notifications/${id}`);
  return unwrap(res);
};

/**
 * Delete all read notifications
 */
export const DeleteAllReadNotifications = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/notifications/read/all`);
  return unwrap(res);
};

/**
 * Clear all notifications for the authenticated user
 */
export const ClearAllNotifications = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.delete(`${API_URL}/notifications/all`);
  return unwrap(res);
};
