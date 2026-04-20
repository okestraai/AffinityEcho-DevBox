// src/admin/pages/AdminPermissionsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  Save,
  RotateCcw,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react';
import { GetAdminUsers, GetAdminPermissions, UpdateAdminPermissions } from '../../../api/adminApis';
import { showToast } from '../../Helper/ShowToast';
import { MSG } from '../../constants/messages';
import { getApiError } from '../utils/apiError';
import {
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  READ_ONLY_PERMISSIONS,
  MODERATOR_PERMISSIONS,
  type Permission,
} from '../types/permissions';
import { CompactStatCardSkeleton } from '../components';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  role: string;
  permissions?: string[];
  is_suspended?: boolean;
}

// ── Preset options ────────────────────────────────────────────────────────────
const PRESETS = [
  {
    id: 'read_only',
    label: 'Read Only',
    description: 'Can view all sections but cannot take any actions',
    permissions: READ_ONLY_PERMISSIONS,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    id: 'moderator',
    label: 'Moderator',
    description: 'Can moderate content, handle reports and suspend users',
    permissions: MODERATOR_PERMISSIONS,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    id: 'full',
    label: 'Full Access',
    description: 'All permissions (equivalent to super admin capability)',
    permissions: ALL_PERMISSIONS,
    color: 'bg-green-100 text-green-700 border-green-200',
  },
] as const;

// ── Small subcomponents ───────────────────────────────────────────────────────

function AdminCard({
  admin,
  selected,
  onClick,
}: {
  admin: AdminUser;
  selected: boolean;
  onClick: () => void;
}) {
  const initials = admin.username.substring(0, 2).toUpperCase();
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
        selected
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          selected
            ? 'bg-white/20 text-white'
            : 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white'
        }`}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${selected ? 'text-white' : 'text-gray-800'}`}>
          {admin.username}
        </p>
        <p className={`text-xs truncate ${selected ? 'text-white/70' : 'text-gray-400'}`}>
          {admin.email}
        </p>
      </div>
      {selected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
    </button>
  );
}

function PermissionToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 p-3 rounded-xl transition-all ${
        checked ? 'bg-purple-50/60 border border-purple-100' : 'bg-gray-50 border border-transparent'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${checked ? 'text-purple-900' : 'text-gray-700'}`}>{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        aria-label={`Toggle ${label}`}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-1 ${
          checked ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gray-200'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdminPermissionsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [savedPermissions, setSavedPermissions] = useState<Set<string>>(new Set());
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // ── Load admin list ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingAdmins(true);
    GetAdminUsers({ role: 'admin', limit: 100 })
      .then((res) => {
        const items: AdminUser[] = (res?.data ?? []).filter(
          (u: AdminUser) => u.role === 'admin',
        );
        setAdmins(items);
      })
      .catch((err: unknown) => {
        showToast(getApiError(err, MSG.ADMIN.ADMINS_LOAD_FAILED), 'error');
      })
      .finally(() => setLoadingAdmins(false));
  }, []);

  // ── Load permissions for selected admin ───────────────────────────────────
  const loadPermissions = useCallback(async (admin: AdminUser) => {
    setLoadingPerms(true);
    setPermissions(new Set());
    setSavedPermissions(new Set());
    try {
      const res = await GetAdminPermissions(admin.id);
      const perms: string[] = res?.permissions ?? [];
      setPermissions(new Set(perms));
      setSavedPermissions(new Set(perms));
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.PERMISSIONS_LOAD_FAILED), 'error');
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  const handleSelectAdmin = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    loadPermissions(admin);
  };

  // ── Toggle a single permission ─────────────────────────────────────────────
  const togglePermission = (key: string, value: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (value) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  // ── Toggle an entire group ─────────────────────────────────────────────────
  const toggleGroup = (groupId: string, enable: boolean) => {
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId);
    if (!group) return;
    setPermissions((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => {
        if (enable) next.add(p.key);
        else next.delete(p.key);
      });
      return next;
    });
  };

  // ── Apply preset ──────────────────────────────────────────────────────────
  const applyPreset = (presetPerms: readonly Permission[]) => {
    setPermissions(new Set(presetPerms));
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    try {
      await UpdateAdminPermissions(selectedAdmin.id, Array.from(permissions));
      setSavedPermissions(new Set(permissions));
      showToast(`Permissions updated for ${selectedAdmin.username}`, 'success');
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.PERMISSIONS_SAVE_FAILED), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPermissions(new Set(savedPermissions));
  };

  const isDirty =
    selectedAdmin &&
    (permissions.size !== savedPermissions.size ||
      [...permissions].some((p) => !savedPermissions.has(p)));

  const filteredAdmins = admins.filter(
    (a) =>
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  const groupHasAllChecked = (groupId: string) => {
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId);
    if (!group) return false;
    return group.permissions.every((p) => permissions.has(p.key));
  };

  const groupHasSomeChecked = (groupId: string) => {
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId);
    if (!group) return false;
    return group.permissions.some((p) => permissions.has(p.key));
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // ── Stats bar ─────────────────────────────────────────────────────────────
  const totalPermissions = PERMISSION_GROUPS.flatMap((g) => g.permissions).length;
  const grantedCount = permissions.size;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Admin Permissions
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full" />
            Assign granular permissions to individual admin accounts
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">Super Admin only</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">

        {/* ── Left panel: Admin list ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-purple-600" />
              Admin Accounts
              <span className="ml-auto text-xs text-gray-400 font-normal">
                {admins.length} total
              </span>
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search admins..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          <div className="p-2 space-y-1 max-h-[460px] overflow-y-auto">
            {loadingAdmins ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <CompactStatCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No admins found</p>
              </div>
            ) : (
              filteredAdmins.map((admin) => (
                <AdminCard
                  key={admin.id}
                  admin={admin}
                  selected={selectedAdmin?.id === admin.id}
                  onClick={() => handleSelectAdmin(admin)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right panel: Permission matrix ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedAdmin ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 flex flex-col items-center justify-center py-20 px-6">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Select an Admin</h3>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                Choose an admin account from the list to view and manage their permissions.
              </p>
            </div>
          ) : (
            <>
              {/* Admin header + stats */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-lg shadow-purple-500/20">
                      {selectedAdmin.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {selectedAdmin.username}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">{selectedAdmin.email}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center px-3 py-2 bg-purple-50 rounded-xl">
                      <p className="text-lg font-bold text-purple-700">{grantedCount}</p>
                      <p className="text-[10px] text-purple-500 font-medium uppercase tracking-wide">granted</p>
                    </div>
                    <div className="text-center px-3 py-2 bg-gray-100 rounded-xl">
                      <p className="text-lg font-bold text-gray-600">{totalPermissions - grantedCount}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">denied</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Permission coverage</span>
                    <span className="font-semibold text-purple-600">
                      {Math.round((grantedCount / totalPermissions) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(grantedCount / totalPermissions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Quick Presets</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    <Info className="w-3 h-3" />
                    Overrides current selection
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.permissions)}
                      disabled={loadingPerms}
                      className={`text-left p-3 rounded-xl border transition-all hover:shadow-md ${preset.color} disabled:opacity-50`}
                    >
                      <p className="text-sm font-semibold">{preset.label}</p>
                      <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{preset.description}</p>
                      <p className="text-xs font-bold mt-2 opacity-70">
                        {preset.permissions.length} permissions
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission groups */}
              {loadingPerms ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 p-6">
                  <div className="flex items-center justify-center gap-3 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading permissions...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {PERMISSION_GROUPS.map((group) => {
                    const allChecked = groupHasAllChecked(group.id);
                    const someChecked = groupHasSomeChecked(group.id);
                    const isCollapsed = collapsedGroups.has(group.id);

                    return (
                      <div
                        key={group.id}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden"
                      >
                        {/* Group header */}
                        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-50">
                          <div className="flex items-center gap-3">
                            {/* Group toggle checkbox */}
                            <button
                              onClick={() => toggleGroup(group.id, !allChecked)}
                              className="flex-shrink-0 text-gray-400 hover:text-purple-600 transition-colors"
                              title={allChecked ? 'Deselect all' : 'Select all'}
                              aria-label={allChecked ? `Deselect all ${group.label} permissions` : `Select all ${group.label} permissions`}
                            >
                              {allChecked ? (
                                <CheckSquare className="w-4 h-4 text-purple-600" />
                              ) : someChecked ? (
                                <CheckSquare className="w-4 h-4 text-purple-400 opacity-60" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800">{group.label}</h4>
                              <p className="text-xs text-gray-400">
                                {group.permissions.filter((p) => permissions.has(p.key)).length} /{' '}
                                {group.permissions.length} enabled
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleGroupCollapse(group.id)}
                            aria-label={isCollapsed ? `Expand ${group.label}` : `Collapse ${group.label}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Permission rows */}
                        {!isCollapsed && (
                          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {group.permissions.map((perm) => (
                              <PermissionToggle
                                key={perm.key}
                                label={perm.label}
                                description={perm.description}
                                checked={permissions.has(perm.key)}
                                onChange={(v) => togglePermission(perm.key, v)}
                                disabled={false}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Save / Reset bar */}
              <div
                className={`sticky bottom-4 bg-white rounded-2xl shadow-xl border transition-all duration-300 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 ${
                  isDirty ? 'border-purple-200 shadow-purple-100' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isDirty ? (
                    <>
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                      <p className="text-sm text-amber-700 font-medium">Unsaved changes</p>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <p className="text-sm text-gray-500">All changes saved</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    disabled={!isDirty || saving}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-40"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {saving ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
