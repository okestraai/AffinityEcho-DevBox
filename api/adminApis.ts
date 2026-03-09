// api/adminApis.ts
import { getAuthInstance, API_URL, unwrap } from "./base";

const BASE = `${API_URL}/admin`;

function buildQS(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "")
      qs.append(key, String(val));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

// List endpoints return res.data (includes both .data and .meta at top level)
// Detail/action endpoints return unwrap(res) (just the inner data)

/* ─── 1. Dashboard ─── */
export const GetAdminDashboard = async () => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/dashboard`);
  return unwrap(res);
};

/* ─── 2. Users ─── */
export const GetAdminUsers = async (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {},
) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/users${buildQS(params as any)}`);
  return res.data; // { success, data: [...], meta: {...} }
};

// In your adminApis.ts file, add:

export const ExportUsers = async (params: {
  format: "csv" | "pdf";
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const api = getAuthInstance();
  // Note: responseType is important for file downloads
  const res = await api.get(`${BASE}/export${buildQS(params as any)}`, {
    responseType: "blob",
  });
  return res; // Returns blob data
};

export const ExportReports = async (params: {
  format: "csv" | "pdf";
  status?: string;
  priority?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/reports/export${buildQS(params as any)}`, {
    responseType: "blob",
  });
  return res;
};

export const GetAdminUserById = async (userId: string) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/users/${userId}`);
  return unwrap(res); // { user, reports_against, suspension_history }
};

export const SuspendUser = async (
  userId: string,
  payload: { reason: string; expires_at?: string | null },
) => {
  const api = getAuthInstance();
  const res = await api.patch(`${BASE}/users/${userId}/suspend`, payload);
  return unwrap(res);
};

export const UnsuspendUser = async (
  userId: string,
  payload?: { reason?: string },
) => {
  const api = getAuthInstance();
  const res = await api.patch(
    `${BASE}/users/${userId}/unsuspend`,
    payload ?? {},
  );
  return unwrap(res);
};

export const ChangeUserRole = async (userId: string, role: string) => {
  const api = getAuthInstance();
  const res = await api.patch(`${BASE}/users/${userId}/role`, { role });
  return unwrap(res);
};

export const DeleteAdminUser = async (userId: string, reason: string) => {
  const api = getAuthInstance();
  await api.delete(`${BASE}/users/${userId}`, { data: { reason } });
};

export const NotifyUser = async (
  userId: string,
  payload: { title: string; message: string; type?: string },
) => {
  const api = getAuthInstance();
  const res = await api.post(`${BASE}/users/${userId}/notify`, payload);
  return unwrap(res);
};

/* ─── 3. Reports ─── */
export const GetAdminReports = async (
  params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    priority?: string;
    assignedTo?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {},
) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/reports${buildQS(params as any)}`);
  return res.data; // { success, data: { summary, items }, meta }
};

export const GetAdminReportById = async (reportId: string) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/reports/${reportId}`);
  return unwrap(res);
};

export const UpdateReport = async (
  reportId: string,
  payload: {
    status?: string;
    resolution_action?: string | null;
    admin_notes?: string;
    assigned_to?: string | null;
  },
) => {
  const api = getAuthInstance();
  const res = await api.patch(`${BASE}/reports/${reportId}`, payload);
  return unwrap(res);
};

export const AssignReport = async (reportId: string) => {
  const api = getAuthInstance();
  const res = await api.post(`${BASE}/reports/${reportId}/assign`);
  return unwrap(res);
};

/* ─── 4. Content Moderation ─── */

// List content with filters
export const GetAdminContent = async (
  params: {
    page?: number;
    limit?: number;
    type?: string; // feed_post, feed_comment, forum_topic, forum_comment, nook, nook_message
    status?: string; // visible, hidden, removed
    flagged?: string; // "true" to return only content with reports_count > 0
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {},
) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/content${buildQS(params as any)}`);
  return res.data; // { success, data: { summary, items }, meta }
};

// Get single content item details
export const GetAdminContentById = async (
  contentType: string,
  contentId: string,
) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/content/${contentType}/${contentId}`);
  return res.data; // { success, data: { id, type, content_id, author, content, moderation_status, ... } }
};

// Hide content (sets is_hidden = true, creates content_moderation entry)
export const HideContent = async (
  contentType: string,
  contentId: string,
  payload: { reason: string },
) => {
  const api = getAuthInstance();
  const res = await api.patch(
    `${BASE}/content/${contentType}/${contentId}/hide`,
    payload,
  );
  return unwrap(res);
};

// Restore content (sets is_hidden = false, updates moderation status to "visible")
export const RestoreContent = async (
  contentType: string,
  contentId: string,
  payload: { reason: string },
) => {
  const api = getAuthInstance();
  const res = await api.patch(
    `${BASE}/content/${contentType}/${contentId}/restore`,
    payload,
  );
  return unwrap(res);
};

// Remove content permanently (delete)
export const RemoveContent = async (
  contentType: string,
  contentId: string,
  payload: { reason: string },
) => {
  const api = getAuthInstance();
  const res = await api.delete(`${BASE}/content/${contentType}/${contentId}`, {
    data: payload,
  });
  return unwrap(res);
};

// Export content
export const ExportContent = async (params: {
  format: "csv" | "pdf";
  type?: string;
  status?: string;
  flagged?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/content/export${buildQS(params as any)}`, {
    responseType: "blob",
  });
  return res;
};

/* ─── 5. Forums ─── */
export const GetAdminForums = async (
  params: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  } = {},
) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/forums${buildQS(params as any)}`);
  return res.data; // { success, data: [...], meta }
};

export const CreateForum = async (payload: {
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  scope: string;
  company_id?: string | null;
  company_name?: string | null;
  rules?: string[];
  moderator_ids?: string[];
}) => {
  const api = getAuthInstance();
  const res = await api.post(`${BASE}/forums`, payload);
  return unwrap(res);
};

export const UpdateForum = async (
  forumId: string,
  payload: {
    name?: string;
    description?: string;
    icon?: string;
    category?: string;
    rules?: string[];
    moderator_ids?: string[];
    is_locked?: boolean;
    is_hidden?: boolean;
  },
) => {
  const api = getAuthInstance();
  const res = await api.patch(`${BASE}/forums/${forumId}`, payload);
  return unwrap(res);
};

export const DeleteForum = async (forumId: string, reason: string) => {
  const api = getAuthInstance();
  await api.delete(`${BASE}/forums/${forumId}`, { data: { reason } });
};

/* ─── 6. Nooks ─── */
export const GetAdminNooks = async (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    scope?: string;
    is_locked?: string;
    is_hidden?: string;
  } = {},
) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/nooks${buildQS(params as any)}`);
  return res.data; // { success, data: { summary, items }, meta }
};

export const CreateNook = async (payload: {
  name: string;
  description?: string;
  scope: string;
  company_id?: string | null;
}) => {
  const api = getAuthInstance();
  const res = await api.post(`${BASE}/nooks`, payload);
  return unwrap(res);
};

export const UpdateNook = async (
  nookId: string,
  payload: {
    name?: string;
    description?: string;
    scope?: string;
    is_locked?: boolean;
    is_hidden?: boolean;
  },
) => {
  const api = getAuthInstance();
  const res = await api.patch(`${BASE}/nooks/${nookId}`, payload);
  return unwrap(res);
};

export const DeleteNook = async (nookId: string, reason: string) => {
  const api = getAuthInstance();
  await api.delete(`${BASE}/nooks/${nookId}`, { data: { reason } });
};

export const RemoveNookMember = async (
  nookId: string,
  userId: string,
  reason?: string,
) => {
  const api = getAuthInstance();
  const res = await api.delete(`${BASE}/nooks/${nookId}/members/${userId}`, {
    data: { reason },
  });
  return unwrap(res);
};

/* ─── 7. Broadcast Notifications ─── */
export const GetAdminNotifications = async (
  params: {
    page?: number;
    limit?: number;
    status?: string;
    audience?: string;
    type?: string;
  } = {},
) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/notifications${buildQS(params as any)}`);
  return res.data; // { success, data: { summary, items }, meta }
};

export const CreateAdminNotification = async (payload: {
  title: string;
  message: string;
  type: string;
  audience: string;
  action?: string;
  action_url?: string | null;
  scheduled_at?: string | null;
}) => {
  const api = getAuthInstance();
  const res = await api.post(`${BASE}/notifications`, payload);
  return unwrap(res);
};

export const SendAdminNotification = async (notifId: string) => {
  const api = getAuthInstance();
  const res = await api.post(`${BASE}/notifications/${notifId}/send`);
  return unwrap(res);
};

export const DeleteAdminNotification = async (notifId: string) => {
  const api = getAuthInstance();
  await api.delete(`${BASE}/notifications/${notifId}`);
};

export const ExportForums = async (params: {
  format: "csv" | "pdf";
  search?: string;
  type?: string;
}) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/forums/export${buildQS(params as any)}`, {
    responseType: "blob",
  });
  return res;
};

export const ExportNooks = async (params: {
  format: "csv" | "pdf";
  search?: string;
  scope?: string;
  is_locked?: string;
}) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/nooks/export${buildQS(params as any)}`, {
    responseType: "blob",
  });
  return res;
};

export const ExportNotifications = async (params: {
  format: "csv" | "pdf";
  status?: string;
  audience?: string;
  type?: string;
}) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/notifications/export${buildQS(params as any)}`, {
    responseType: "blob",
  });
  return res;
};

export const ExportLogs = async (params: {
  format: "csv" | "pdf";
  search?: string;
  targetType?: string;
  from?: string;
  to?: string;
}) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/logs/export${buildQS(params as any)}`, {
    responseType: "blob",
  });
  return res;
};

/* ─── 8. Admin Profile & Settings ─── */

export const GetAdminProfile = async () => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/profile`);
  return unwrap(res); // { id, email, username, first_name, last_name, ... }
};

export const UpdateAdminProfile = async (payload: {
  first_name?: string;
  last_name?: string;
  username?: string;
}) => {
  const api = getAuthInstance();
  const res = await api.patch(`${BASE}/profile`, payload);
  return unwrap(res); // { id, email, username, first_name, last_name, ... }
};

export const GetAdminSettings = async () => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/settings`);
  return unwrap(res); // { general: {...}, security: {...}, notifications: {...}, moderation: {...} }
};

export const UpdateAdminSettings = async (
  key: 'general' | 'security' | 'notifications' | 'moderation',
  data: Record<string, unknown>,
) => {
  const api = getAuthInstance();
  const res = await api.put(`${BASE}/settings/${key}`, data);
  return unwrap(res);
};

/* ─── 9. Admin Permissions (super_admin only) ─── */

/**
 * Get a single admin's assigned permissions.
 * GET /admin/admins/:adminId/permissions
 * Returns { permissions: string[] }
 */
export const GetAdminPermissions = async (adminId: string) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/admins/${adminId}/permissions`);
  return unwrap(res); // { permissions: string[] }
};

/**
 * Replace a single admin's full permission set.
 * PUT /admin/admins/:adminId/permissions
 * Body: { permissions: string[] }
 * Returns { admin_id: string, permissions: string[] }
 */
export const UpdateAdminPermissions = async (
  adminId: string,
  permissions: string[],
) => {
  const api = getAuthInstance();
  const res = await api.put(`${BASE}/admins/${adminId}/permissions`, {
    permissions,
  });
  return unwrap(res);
};

/* ─── 9. Audit Logs ─── */
export const GetAdminLogs = async (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    adminId?: string;
    action?: string;
    targetType?: string;
    from?: string;
    to?: string;
    sortDir?: string;
  } = {},
) => {
  const api = getAuthInstance();
  const res = await api.get(`${BASE}/logs${buildQS(params as any)}`);
  return res.data; // { success, data: [...], meta }
};
