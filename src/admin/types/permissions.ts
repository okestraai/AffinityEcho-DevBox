// src/admin/types/permissions.ts
// Granular permission constants for AffinityEcho admin RBAC

// ── Permission keys ────────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',

  // Users
  USERS_VIEW: 'users:view',
  USERS_VIEW_DETAIL: 'users:view_detail',
  USERS_SUSPEND: 'users:suspend',
  USERS_DELETE: 'users:delete',
  USERS_CHANGE_ROLE: 'users:change_role',
  USERS_NOTIFY: 'users:notify',
  USERS_EXPORT: 'users:export',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_VIEW_DETAIL: 'reports:view_detail',
  REPORTS_UPDATE: 'reports:update',
  REPORTS_ASSIGN: 'reports:assign',
  REPORTS_EXPORT: 'reports:export',

  // Content Moderation
  CONTENT_VIEW: 'content:view',
  CONTENT_VIEW_DETAIL: 'content:view_detail',
  CONTENT_HIDE: 'content:hide',
  CONTENT_RESTORE: 'content:restore',
  CONTENT_REMOVE: 'content:remove',
  CONTENT_EXPORT: 'content:export',

  // Forums
  FORUMS_VIEW: 'forums:view',
  FORUMS_CREATE: 'forums:create',
  FORUMS_UPDATE: 'forums:update',
  FORUMS_DELETE: 'forums:delete',
  FORUMS_EXPORT: 'forums:export',

  // Nooks
  NOOKS_VIEW: 'nooks:view',
  NOOKS_CREATE: 'nooks:create',
  NOOKS_UPDATE: 'nooks:update',
  NOOKS_DELETE: 'nooks:delete',
  NOOKS_REMOVE_MEMBER: 'nooks:remove_member',
  NOOKS_EXPORT: 'nooks:export',

  // Broadcast Notifications
  NOTIFICATIONS_VIEW: 'notifications:view',
  NOTIFICATIONS_CREATE: 'notifications:create',
  NOTIFICATIONS_SEND: 'notifications:send',
  NOTIFICATIONS_DELETE: 'notifications:delete',
  NOTIFICATIONS_EXPORT: 'notifications:export',

  // Audit Logs
  LOGS_VIEW: 'logs:view',
  LOGS_EXPORT: 'logs:export',

  // Admin Management — super_admin only
  ADMINS_VIEW: 'admins:view',
  ADMINS_MANAGE_PERMISSIONS: 'admins:manage_permissions',

  // Analytics
  ANALYTICS_VIEW: 'analytics:view',

  // System Health
  HEALTH_VIEW: 'health:view',

  // AI Moderation
  AI_REVIEW_VIEW: 'ai_review:view',
  AI_REVIEW_RESOLVE: 'ai_review:resolve',
  AI_AUDIT_VIEW: 'ai_audit:view',
  AI_DISAGREEMENTS_VIEW: 'ai_disagreements:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ── Permission groups (for the UI matrix) ─────────────────────────────────────
export interface PermissionItem {
  key: Permission;
  label: string;
  description: string;
}

export interface PermissionGroup {
  id: string;
  label: string;
  icon: string; // lucide icon name
  permissions: PermissionItem[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    permissions: [
      {
        key: PERMISSIONS.DASHBOARD_VIEW,
        label: 'View Dashboard',
        description: 'Access the main admin dashboard and statistics',
      },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'Users',
    permissions: [
      {
        key: PERMISSIONS.USERS_VIEW,
        label: 'View Users',
        description: 'Browse and search the full user list',
      },
      {
        key: PERMISSIONS.USERS_VIEW_DETAIL,
        label: 'View User Detail',
        description: 'Access individual user profiles and history',
      },
      {
        key: PERMISSIONS.USERS_SUSPEND,
        label: 'Suspend / Unsuspend',
        description: 'Temporarily suspend or lift a user suspension',
      },
      {
        key: PERMISSIONS.USERS_DELETE,
        label: 'Delete User',
        description: 'Permanently delete a user account',
      },
      {
        key: PERMISSIONS.USERS_CHANGE_ROLE,
        label: 'Change Role',
        description: 'Promote or demote a user\'s platform role',
      },
      {
        key: PERMISSIONS.USERS_NOTIFY,
        label: 'Send Notification',
        description: 'Send a direct notification to a specific user',
      },
      {
        key: PERMISSIONS.USERS_EXPORT,
        label: 'Export Users',
        description: 'Download user data as CSV or PDF',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'Flag',
    permissions: [
      {
        key: PERMISSIONS.REPORTS_VIEW,
        label: 'View Reports',
        description: 'Browse all user-submitted reports',
      },
      {
        key: PERMISSIONS.REPORTS_VIEW_DETAIL,
        label: 'View Report Detail',
        description: 'Open and read individual report pages',
      },
      {
        key: PERMISSIONS.REPORTS_UPDATE,
        label: 'Update Report',
        description: 'Change report status, resolution, or notes',
      },
      {
        key: PERMISSIONS.REPORTS_ASSIGN,
        label: 'Assign Report',
        description: 'Self-assign an open report for review',
      },
      {
        key: PERMISSIONS.REPORTS_EXPORT,
        label: 'Export Reports',
        description: 'Download report data as CSV or PDF',
      },
    ],
  },
  {
    id: 'content',
    label: 'Content Moderation',
    icon: 'EyeOff',
    permissions: [
      {
        key: PERMISSIONS.CONTENT_VIEW,
        label: 'View Content',
        description: 'Browse the content moderation queue',
      },
      {
        key: PERMISSIONS.CONTENT_VIEW_DETAIL,
        label: 'View Content Detail',
        description: 'Open individual content detail pages',
      },
      {
        key: PERMISSIONS.CONTENT_HIDE,
        label: 'Hide Content',
        description: 'Temporarily hide content from the platform',
      },
      {
        key: PERMISSIONS.CONTENT_RESTORE,
        label: 'Restore Content',
        description: 'Restore previously hidden content to visible',
      },
      {
        key: PERMISSIONS.CONTENT_REMOVE,
        label: 'Remove Content',
        description: 'Permanently delete content from the platform',
      },
      {
        key: PERMISSIONS.CONTENT_EXPORT,
        label: 'Export Content',
        description: 'Download moderated content data as CSV or PDF',
      },
    ],
  },
  {
    id: 'forums',
    label: 'Forums',
    icon: 'MessageSquare',
    permissions: [
      {
        key: PERMISSIONS.FORUMS_VIEW,
        label: 'View Forums',
        description: 'Browse the admin forums list',
      },
      {
        key: PERMISSIONS.FORUMS_CREATE,
        label: 'Create Forum',
        description: 'Create new forums on the platform',
      },
      {
        key: PERMISSIONS.FORUMS_UPDATE,
        label: 'Edit Forum',
        description: 'Edit forum name, description, rules, and settings',
      },
      {
        key: PERMISSIONS.FORUMS_DELETE,
        label: 'Delete Forum',
        description: 'Permanently delete a forum and its content',
      },
      {
        key: PERMISSIONS.FORUMS_EXPORT,
        label: 'Export Forums',
        description: 'Download forum data as CSV or PDF',
      },
    ],
  },
  {
    id: 'nooks',
    label: 'Nooks',
    icon: 'Hash',
    permissions: [
      {
        key: PERMISSIONS.NOOKS_VIEW,
        label: 'View Nooks',
        description: 'Browse the admin nooks list',
      },
      {
        key: PERMISSIONS.NOOKS_CREATE,
        label: 'Create Nook',
        description: 'Create new nooks on the platform',
      },
      {
        key: PERMISSIONS.NOOKS_UPDATE,
        label: 'Edit Nook',
        description: 'Edit nook name, description, and settings',
      },
      {
        key: PERMISSIONS.NOOKS_DELETE,
        label: 'Delete Nook',
        description: 'Permanently delete a nook',
      },
      {
        key: PERMISSIONS.NOOKS_REMOVE_MEMBER,
        label: 'Remove Member',
        description: 'Remove a member from a nook',
      },
      {
        key: PERMISSIONS.NOOKS_EXPORT,
        label: 'Export Nooks',
        description: 'Download nook data as CSV or PDF',
      },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'Bell',
    permissions: [
      {
        key: PERMISSIONS.NOTIFICATIONS_VIEW,
        label: 'View Notifications',
        description: 'Browse broadcast notification history',
      },
      {
        key: PERMISSIONS.NOTIFICATIONS_CREATE,
        label: 'Create Notification',
        description: 'Draft new broadcast notifications',
      },
      {
        key: PERMISSIONS.NOTIFICATIONS_SEND,
        label: 'Send Notification',
        description: 'Dispatch notifications to users',
      },
      {
        key: PERMISSIONS.NOTIFICATIONS_DELETE,
        label: 'Delete Notification',
        description: 'Delete pending or sent notifications',
      },
      {
        key: PERMISSIONS.NOTIFICATIONS_EXPORT,
        label: 'Export Notifications',
        description: 'Download notification data as CSV or PDF',
      },
    ],
  },
  {
    id: 'logs',
    label: 'Audit Logs',
    icon: 'FileText',
    permissions: [
      {
        key: PERMISSIONS.LOGS_VIEW,
        label: 'View Audit Logs',
        description: 'Browse all admin action audit logs',
      },
      {
        key: PERMISSIONS.LOGS_EXPORT,
        label: 'Export Logs',
        description: 'Download audit log data as CSV or PDF',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    permissions: [
      {
        key: PERMISSIONS.ANALYTICS_VIEW,
        label: 'View Analytics',
        description: 'Access platform analytics and growth data',
      },
    ],
  },
  {
    id: 'health',
    label: 'System Health',
    icon: 'HeartPulse',
    permissions: [
      {
        key: PERMISSIONS.HEALTH_VIEW,
        label: 'View Health',
        description: 'Access system health monitoring dashboard',
      },
    ],
  },
  {
    id: 'ai_moderation',
    label: 'AI Moderation',
    icon: 'Bot',
    permissions: [
      {
        key: PERMISSIONS.AI_REVIEW_VIEW,
        label: 'View Review Queue',
        description: 'Browse the AI moderation review queue and stats',
      },
      {
        key: PERMISSIONS.AI_REVIEW_RESOLVE,
        label: 'Resolve Review Items',
        description: 'Confirm, reverse, or modify AI moderation decisions',
      },
      {
        key: PERMISSIONS.AI_AUDIT_VIEW,
        label: 'View AI Audit Trail',
        description: 'Browse all AI moderation decisions and history',
      },
      {
        key: PERMISSIONS.AI_DISAGREEMENTS_VIEW,
        label: 'View Disagreements',
        description: 'View cases where humans overruled AI decisions',
      },
    ],
  },
];

// ── Default permission sets ────────────────────────────────────────────────────

/** All permissions granted — equivalent to super_admin capability */
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/** Minimal read-only set for a new admin */
export const READ_ONLY_PERMISSIONS: Permission[] = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.USERS_VIEW,
  PERMISSIONS.USERS_VIEW_DETAIL,
  PERMISSIONS.REPORTS_VIEW,
  PERMISSIONS.REPORTS_VIEW_DETAIL,
  PERMISSIONS.CONTENT_VIEW,
  PERMISSIONS.CONTENT_VIEW_DETAIL,
  PERMISSIONS.FORUMS_VIEW,
  PERMISSIONS.NOOKS_VIEW,
  PERMISSIONS.NOTIFICATIONS_VIEW,
  PERMISSIONS.LOGS_VIEW,
  PERMISSIONS.ANALYTICS_VIEW,
  PERMISSIONS.HEALTH_VIEW,
  PERMISSIONS.AI_REVIEW_VIEW,
  PERMISSIONS.AI_AUDIT_VIEW,
  PERMISSIONS.AI_DISAGREEMENTS_VIEW,
];

/** Standard moderator set */
export const MODERATOR_PERMISSIONS: Permission[] = [
  ...READ_ONLY_PERMISSIONS,
  PERMISSIONS.USERS_SUSPEND,
  PERMISSIONS.USERS_NOTIFY,
  PERMISSIONS.REPORTS_UPDATE,
  PERMISSIONS.REPORTS_ASSIGN,
  PERMISSIONS.CONTENT_HIDE,
  PERMISSIONS.CONTENT_RESTORE,
  PERMISSIONS.CONTENT_REMOVE,
  PERMISSIONS.AI_REVIEW_RESOLVE,
];
