# AffinityEcho — Admin RBAC Backend Documentation

## Overview

AffinityEcho uses a **two-tier admin system**:

| Role | Description |
|------|-------------|
| `super_admin` | Full access to everything. Cannot have permissions restricted. Manages admin accounts and their permissions. |
| `admin` | Limited access. Can only perform actions explicitly granted via the permissions system. |

Permissions are enforced on **both the frontend (UI visibility)** and **the backend (API middleware)**. The frontend hides nav items and buttons based on the current user's permission set, but the backend must still validate every request independently.

---

## Database Schema

### `admins_permissions` table

```sql
CREATE TABLE admin_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  granted_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (admin_id)
);

CREATE INDEX idx_admin_permissions_admin_id ON admin_permissions(admin_id);
```

**Notes:**
- One row per admin user. Use `UPSERT` on save.
- `permissions` is a Postgres text array of permission key strings (e.g. `{"users:view","reports:update"}`).
- `super_admin` users do **not** need a row — their role itself grants all access.
- `granted_by` records which super_admin last saved the permissions (audit trail).

---

## Full Permission Key Reference

These are the exact string keys the frontend sends and expects. The backend must validate against this set.

### Dashboard
| Key | Description |
|-----|-------------|
| `dashboard:view` | Access the admin dashboard page |

### Users
| Key | Description |
|-----|-------------|
| `users:view` | Browse and search the user list (`GET /admin/users`) |
| `users:view_detail` | View individual user profile (`GET /admin/users/:id`) |
| `users:suspend` | Suspend / unsuspend a user (`PATCH /admin/users/:id/suspend`, `PATCH /admin/users/:id/unsuspend`) |
| `users:delete` | Delete a user account (`DELETE /admin/users/:id`) |
| `users:change_role` | Change a user's platform role (`PATCH /admin/users/:id/role`) |
| `users:notify` | Send a direct notification to a user (`POST /admin/users/:id/notify`) |
| `users:export` | Export user data (`GET /admin/export`) |

### Reports
| Key | Description |
|-----|-------------|
| `reports:view` | Browse all reports (`GET /admin/reports`) |
| `reports:view_detail` | View a single report (`GET /admin/reports/:id`) |
| `reports:update` | Update report status / notes (`PATCH /admin/reports/:id`) |
| `reports:assign` | Self-assign a report (`POST /admin/reports/:id/assign`) |
| `reports:export` | Export reports (`GET /admin/reports/export`) |

### Content Moderation
| Key | Description |
|-----|-------------|
| `content:view` | Browse moderation queue (`GET /admin/content`) |
| `content:view_detail` | View a content item (`GET /admin/content/:type/:id`) |
| `content:hide` | Hide content (`PATCH /admin/content/:type/:id/hide`) |
| `content:restore` | Restore hidden content (`PATCH /admin/content/:type/:id/restore`) |
| `content:remove` | Permanently delete content (`DELETE /admin/content/:type/:id`) |
| `content:export` | Export content data (`GET /admin/content/export`) |

### Forums
| Key | Description |
|-----|-------------|
| `forums:view` | List forums (`GET /admin/forums`) |
| `forums:create` | Create a forum (`POST /admin/forums`) |
| `forums:update` | Edit a forum (`PATCH /admin/forums/:id`) |
| `forums:delete` | Delete a forum (`DELETE /admin/forums/:id`) |
| `forums:export` | Export forums (`GET /admin/forums/export`) |

### Nooks
| Key | Description |
|-----|-------------|
| `nooks:view` | List nooks (`GET /admin/nooks`) |
| `nooks:create` | Create a nook (`POST /admin/nooks`) |
| `nooks:update` | Edit a nook (`PATCH /admin/nooks/:id`) |
| `nooks:delete` | Delete a nook (`DELETE /admin/nooks/:id`) |
| `nooks:remove_member` | Remove a member from a nook (`DELETE /admin/nooks/:id/members/:userId`) |
| `nooks:export` | Export nooks (`GET /admin/nooks/export`) |

### Notifications
| Key | Description |
|-----|-------------|
| `notifications:view` | List broadcast notifications (`GET /admin/notifications`) |
| `notifications:create` | Create a notification (`POST /admin/notifications`) |
| `notifications:send` | Send / dispatch a notification (`POST /admin/notifications/:id/send`) |
| `notifications:delete` | Delete a notification (`DELETE /admin/notifications/:id`) |
| `notifications:export` | Export notifications (`GET /admin/notifications/export`) |

### Audit Logs
| Key | Description |
|-----|-------------|
| `logs:view` | View audit logs (`GET /admin/logs`) |
| `logs:export` | Export logs (`GET /admin/logs/export`) |

### Admin Management *(super_admin only — no need to store in DB)*
| Key | Description |
|-----|-------------|
| `admins:view` | Reserved for future use |
| `admins:manage_permissions` | Reserved for future use |

---

## API Endpoints

### `GET /admin/admins/:adminId/permissions`

Returns the current permission set for a given admin user.

**Auth:** `super_admin` only

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "admin_id": "uuid",
    "permissions": ["users:view", "reports:view", "content:hide"]
  }
}
```

**Response `404`** — if the user doesn't exist or is not an admin.

**Response `403`** — if caller is not `super_admin`.

---

### `PUT /admin/admins/:adminId/permissions`

Fully replaces the permission set for a given admin. This is a **replace**, not a merge — send the complete desired set.

**Auth:** `super_admin` only

**Request body:**
```json
{
  "permissions": ["users:view", "users:view_detail", "reports:view", "content:hide"]
}
```

**Validation:**
- `adminId` must reference a user with `role = "admin"`. Cannot be applied to `super_admin` users.
- Each string in `permissions` must be a valid key from the list above. Reject unknown keys with `400`.
- Empty array `[]` is valid — it revokes all permissions.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "admin_id": "uuid",
    "permissions": ["users:view", "users:view_detail", "reports:view", "content:hide"],
    "granted_by": "super_admin-uuid",
    "updated_at": "2026-03-06T12:00:00Z"
  }
}
```

**Response `400`** — invalid permission key in the array.

**Response `403`** — caller is not `super_admin`, or trying to modify another `super_admin`.

**Response `404`** — target user not found.

---

## Middleware: `requirePermission(key)`

Add a reusable middleware that:

1. Checks `req.user.role === 'super_admin'` → pass immediately.
2. Loads the user's `admin_permissions` row from DB.
3. Checks `permissions.includes(key)` → pass or `403`.

**Example (Node/Express):**

```typescript
function requirePermission(key: string) {
  return async (req, res, next) => {
    const user = req.user;

    // super_admin bypasses all checks
    if (user.role === 'super_admin') return next();

    // regular admin: check their permission row
    const row = await db.query(
      'SELECT permissions FROM admin_permissions WHERE admin_id = $1',
      [user.id]
    );

    const permissions: string[] = row?.permissions ?? [];
    if (!permissions.includes(key)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires permission '${key}'`,
      });
    }

    next();
  };
}
```

**Apply to routes:**

```typescript
// Example usage on existing routes
router.get('/admin/users',              requirePermission('users:view'),          getUsersList);
router.get('/admin/users/:id',          requirePermission('users:view_detail'),   getUserById);
router.patch('/admin/users/:id/suspend',requirePermission('users:suspend'),       suspendUser);
router.delete('/admin/users/:id',       requirePermission('users:delete'),        deleteUser);
router.patch('/admin/users/:id/role',   requirePermission('users:change_role'),   changeRole);
router.post('/admin/users/:id/notify',  requirePermission('users:notify'),        notifyUser);
router.get('/admin/export',             requirePermission('users:export'),        exportUsers);

router.get('/admin/reports',            requirePermission('reports:view'),        getReports);
router.get('/admin/reports/:id',        requirePermission('reports:view_detail'), getReportById);
router.patch('/admin/reports/:id',      requirePermission('reports:update'),      updateReport);
router.post('/admin/reports/:id/assign',requirePermission('reports:assign'),      assignReport);
router.get('/admin/reports/export',     requirePermission('reports:export'),      exportReports);

router.get('/admin/content',                          requirePermission('content:view'),        getContent);
router.get('/admin/content/:type/:id',                requirePermission('content:view_detail'), getContentById);
router.patch('/admin/content/:type/:id/hide',         requirePermission('content:hide'),        hideContent);
router.patch('/admin/content/:type/:id/restore',      requirePermission('content:restore'),     restoreContent);
router.delete('/admin/content/:type/:id',             requirePermission('content:remove'),      removeContent);
router.get('/admin/content/export',                   requirePermission('content:export'),      exportContent);

router.get('/admin/forums',             requirePermission('forums:view'),         getForums);
router.post('/admin/forums',            requirePermission('forums:create'),       createForum);
router.patch('/admin/forums/:id',       requirePermission('forums:update'),       updateForum);
router.delete('/admin/forums/:id',      requirePermission('forums:delete'),       deleteForum);
router.get('/admin/forums/export',      requirePermission('forums:export'),       exportForums);

router.get('/admin/nooks',                          requirePermission('nooks:view'),          getNooks);
router.post('/admin/nooks',                         requirePermission('nooks:create'),        createNook);
router.patch('/admin/nooks/:id',                    requirePermission('nooks:update'),        updateNook);
router.delete('/admin/nooks/:id',                   requirePermission('nooks:delete'),        deleteNook);
router.delete('/admin/nooks/:id/members/:userId',   requirePermission('nooks:remove_member'), removeNookMember);
router.get('/admin/nooks/export',                   requirePermission('nooks:export'),        exportNooks);

router.get('/admin/notifications',          requirePermission('notifications:view'),    getNotifications);
router.post('/admin/notifications',         requirePermission('notifications:create'),  createNotification);
router.post('/admin/notifications/:id/send',requirePermission('notifications:send'),    sendNotification);
router.delete('/admin/notifications/:id',   requirePermission('notifications:delete'),  deleteNotification);
router.get('/admin/notifications/export',   requirePermission('notifications:export'),  exportNotifications);

router.get('/admin/logs',               requirePermission('logs:view'),           getLogs);
router.get('/admin/logs/export',        requirePermission('logs:export'),         exportLogs);

// Permission management — super_admin only (no requirePermission needed, use requireSuperAdmin)
router.get('/admin/admins/:id/permissions', requireSuperAdmin, getAdminPermissions);
router.put('/admin/admins/:id/permissions', requireSuperAdmin, updateAdminPermissions);
```

---

## Including Permissions in Auth Response

The `GET /auth/me` and `POST /auth/login` responses should include `permissions` for `admin` users so the frontend can gate UI immediately without an extra round-trip.

**Extend the user object returned by login / me:**

```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "username": "AdminUser",
  "role": "admin",
  "permissions": ["users:view", "users:view_detail", "reports:view"],
  "has_completed_onboarding": true
}
```

- For `super_admin`: omit `permissions` or return `[]` — the frontend treats `super_admin` as having all permissions regardless.
- For `user`: omit `permissions` entirely.
- For `admin`: always include the current array from `admin_permissions`.

---

## Audit Logging

Every call to `PUT /admin/admins/:adminId/permissions` should create an audit log entry:

```json
{
  "action": "update_admin_permissions",
  "target_type": "admin",
  "target_id": "<adminId>",
  "performed_by": "<superAdminId>",
  "details": {
    "permissions_granted": ["users:view", "reports:update"],
    "permissions_revoked": ["users:delete"]
  }
}
```

This will appear in the existing `GET /admin/logs` feed.

---

## Frontend Integration Summary

| What | Where | Behaviour |
|------|-------|-----------|
| Permission types + groups | `src/admin/types/permissions.ts` | Single source of truth for all permission keys |
| `usePermission()` hook | `src/admin/hooks/usePermission.ts` | `hasPermission(key)` returns `true` for super_admin always |
| Nav item visibility | `src/admin/layout/AdminLayout.tsx` | Items hidden if user lacks the required permission |
| Permissions page route | `/admin/permissions` | Redirects non-super_admin to `/admin` |
| User `permissions[]` field | `src/contexts/AuthContext.tsx` | Populated from login/me response |
| API calls | `api/adminApis.ts` — `GetAdminPermissions`, `UpdateAdminPermissions` | `GET/PUT /admin/admins/:id/permissions` |
