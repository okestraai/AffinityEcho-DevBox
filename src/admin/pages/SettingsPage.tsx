// src/admin/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Bell,
  Shield,
  Flag,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Globe,
  AlertTriangle,
  Mail,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import { GetAdminSettings, UpdateAdminSettings } from '../../../api/adminApis';

// ── Interfaces match the backend JSONB fields exactly ─────────────────────

interface GeneralSettings {
  platform_name: string;
  platform_description: string;
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  require_email_verification: boolean;
  support_email: string;
}

interface SecuritySettings {
  session_timeout_minutes: number;
  max_login_attempts: number;
  min_password_length: number;
  password_requires_special_char: boolean;
  require_2fa_for_admins: boolean;
  ip_whitelist_enabled: boolean;
  allowlist_ips: string[];
}

interface NotificationSettings {
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  digest_frequency: 'daily' | 'weekly' | 'never';
  max_notifications_per_day: number;
  email_on_new_report: boolean;
  email_on_new_user: boolean;
  email_on_flagged_content: boolean;
  push_on_new_report: boolean;
  push_on_new_user: boolean;
  push_on_flagged_content: boolean;
  report_alert_threshold: number;
}

interface ModerationSettings {
  content_review_queue_enabled: boolean;
  allow_user_appeals: boolean;
  require_reason_for_hiding: boolean;
  auto_hide_reports_threshold: number;
  auto_suspend_after_reports: number;
  spam_filter_strength: 'low' | 'medium' | 'high';
  content_retention_days: number;
  report_auto_resolve_days: number;
  require_review_for_new_users: boolean;
}

/* ─── Toggle ─── */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked ? 'true' : 'false'}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 ${checked ? 'bg-purple-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

/* ─── ToggleRow ─── */
function ToggleRow({ label, desc, checked, onChange, danger }: {
  label: string; desc: string; checked: boolean; onChange: () => void; danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="pr-4">
        <p className={`text-sm font-medium ${danger ? 'text-red-700' : 'text-gray-800'}`}>{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/* ─── NumberField ─── */
function NumberField({ label, hint, value, onChange, min = 1 }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void; min?: number;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          title={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors text-lg font-medium"
        >−</button>
        <input
          type="number"
          title={label}
          value={value}
          onChange={e => onChange(Math.max(min, +e.target.value))}
          className="w-16 text-center py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
        />
        <button
          type="button"
          title={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors text-lg font-medium"
        >+</button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-2">{hint}</p>}
    </div>
  );
}

/* ─── SectionCard ─── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

/* ─── Defaults ─── */
const DEFAULTS = {
  general: {
    platform_name: 'AffinityEcho',
    platform_description: 'A professional social platform',
    maintenance_mode: false,
    allow_new_registrations: true,
    require_email_verification: true,
    support_email: 'support@affinityecho.com',
  } as GeneralSettings,
  security: {
    session_timeout_minutes: 60,
    max_login_attempts: 5,
    min_password_length: 8,
    password_requires_special_char: true,
    require_2fa_for_admins: false,
    ip_whitelist_enabled: false,
    allowlist_ips: [],
  } as SecuritySettings,
  notifications: {
    email_notifications_enabled: true,
    push_notifications_enabled: true,
    digest_frequency: 'daily' as const,
    max_notifications_per_day: 50,
    email_on_new_report: true,
    email_on_new_user: true,
    email_on_flagged_content: true,
    push_on_new_report: true,
    push_on_new_user: false,
    push_on_flagged_content: true,
    report_alert_threshold: 5,
  } as NotificationSettings,
  moderation: {
    content_review_queue_enabled: true,
    allow_user_appeals: true,
    require_reason_for_hiding: true,
    auto_hide_reports_threshold: 3,
    auto_suspend_after_reports: 10,
    spam_filter_strength: 'medium' as const,
    content_retention_days: 30,
    report_auto_resolve_days: 7,
    require_review_for_new_users: false,
  } as ModerationSettings,
};

const NAV = [
  { id: 'general',       label: 'General',       icon: Globe,   desc: 'Site configuration' },
  { id: 'security',      label: 'Security',       icon: Shield,  desc: 'Auth & access control' },
  { id: 'notifications', label: 'Notifications',  icon: Bell,    desc: 'Alert preferences' },
  { id: 'moderation',    label: 'Moderation',     icon: Flag,    desc: 'Content filtering' },
] as const;

type SectionId = typeof NAV[number]['id'];

export function SettingsPage() {
  const [active, setActive] = useState<SectionId>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [general, setGeneral] = useState<GeneralSettings>(DEFAULTS.general);
  const [security, setSecurity] = useState<SecuritySettings>(DEFAULTS.security);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULTS.notifications);
  const [moderation, setModeration] = useState<ModerationSettings>(DEFAULTS.moderation);
  const [newIp, setNewIp] = useState('');

  useEffect(() => {
    GetAdminSettings()
      .then((data) => {
        if (data?.general)       setGeneral(g => ({ ...g, ...data.general }));
        if (data?.security)      setSecurity(s => ({ ...s, ...data.security }));
        if (data?.notifications) setNotifications(n => ({ ...n, ...data.notifications }));
        if (data?.moderation)    setModeration(m => ({ ...m, ...data.moderation }));
      })
      .catch(() => {/* keep defaults on error */});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        UpdateAdminSettings('general',       general       as unknown as Record<string, unknown>),
        UpdateAdminSettings('security',      security      as unknown as Record<string, unknown>),
        UpdateAdminSettings('notifications', notifications as unknown as Record<string, unknown>),
        UpdateAdminSettings('moderation',    moderation    as unknown as Record<string, unknown>),
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch { /* errors surfaced via API toast */ } finally {
      setIsSaving(false);
    }
  };

  const addIp = () => {
    const trimmed = newIp.trim();
    if (trimmed && !security.allowlist_ips.includes(trimmed)) {
      setSecurity(p => ({ ...p, allowlist_ips: [...p.allowlist_ips, trimmed] }));
      setNewIp('');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure platform behavior and defaults</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">Settings saved successfully!</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar nav */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-1">
            {NAV.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${active === id ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className={`p-1.5 rounded-lg flex-shrink-0 ${active === id ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-gray-400 truncate">{desc}</p>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content panel */}
        <div className="flex-1 space-y-4">

          {/* ── General ── */}
          {active === 'general' && (
            <>
              <SectionCard title="Site Identity">
                <div className="py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform Name</label>
                    <input
                      type="text"
                      title="Platform name"
                      placeholder="e.g. AffinityEcho"
                      value={general.platform_name}
                      onChange={e => setGeneral(p => ({ ...p, platform_name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform Description</label>
                    <textarea
                      title="Platform description"
                      placeholder="A short description of the platform"
                      value={general.platform_description}
                      onChange={e => setGeneral(p => ({ ...p, platform_description: e.target.value }))}
                      rows={2}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white resize-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        title="Support email"
                        placeholder="support@example.com"
                        value={general.support_email}
                        onChange={e => setGeneral(p => ({ ...p, support_email: e.target.value }))}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white transition-shadow"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Platform Flags">
                <div>
                  <ToggleRow
                    label="Maintenance Mode"
                    desc="Show maintenance page to all users"
                    checked={general.maintenance_mode}
                    onChange={() => setGeneral(p => ({ ...p, maintenance_mode: !p.maintenance_mode }))}
                    danger
                  />
                  <ToggleRow
                    label="Allow New Registrations"
                    desc="Allow new users to create accounts"
                    checked={general.allow_new_registrations}
                    onChange={() => setGeneral(p => ({ ...p, allow_new_registrations: !p.allow_new_registrations }))}
                  />
                  <ToggleRow
                    label="Require Email Verification"
                    desc="New accounts must verify their email before access"
                    checked={general.require_email_verification}
                    onChange={() => setGeneral(p => ({ ...p, require_email_verification: !p.require_email_verification }))}
                  />
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Security ── */}
          {active === 'security' && (
            <>
              <SectionCard title="Session &amp; Auth">
                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <NumberField
                    label="Session timeout"
                    hint="Minutes of inactivity"
                    value={security.session_timeout_minutes}
                    onChange={v => setSecurity(p => ({ ...p, session_timeout_minutes: v }))}
                  />
                  <NumberField
                    label="Max login attempts"
                    hint="Before account lockout"
                    value={security.max_login_attempts}
                    onChange={v => setSecurity(p => ({ ...p, max_login_attempts: v }))}
                  />
                  <NumberField
                    label="Min password length"
                    hint="Characters required"
                    value={security.min_password_length}
                    onChange={v => setSecurity(p => ({ ...p, min_password_length: v }))}
                    min={6}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Security Policies">
                <div>
                  <ToggleRow
                    label="Require Special Characters"
                    desc="Passwords must include uppercase, numbers, and symbols"
                    checked={security.password_requires_special_char}
                    onChange={() => setSecurity(p => ({ ...p, password_requires_special_char: !p.password_requires_special_char }))}
                  />
                  <ToggleRow
                    label="Require 2FA for Admins"
                    desc="Mandatory two-factor authentication for all admin accounts"
                    checked={security.require_2fa_for_admins}
                    onChange={() => setSecurity(p => ({ ...p, require_2fa_for_admins: !p.require_2fa_for_admins }))}
                  />
                  <ToggleRow
                    label="IP Whitelist"
                    desc="Restrict admin access to specific IP addresses"
                    checked={security.ip_whitelist_enabled}
                    onChange={() => setSecurity(p => ({ ...p, ip_whitelist_enabled: !p.ip_whitelist_enabled }))}
                  />
                </div>
              </SectionCard>

              {security.ip_whitelist_enabled && (
                <SectionCard title="Whitelisted IPs">
                  <div className="py-4 space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={newIp}
                          onChange={e => setNewIp(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addIp()}
                          placeholder="192.168.1.1"
                          title="IP address to whitelist"
                          className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addIp}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                    {security.allowlist_ips.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No IPs added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {security.allowlist_ips.map(ip => (
                          <div key={ip} className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm font-mono text-gray-700">{ip}</span>
                            <button
                              type="button"
                              onClick={() => setSecurity(p => ({ ...p, allowlist_ips: p.allowlist_ips.filter(i => i !== ip) }))}
                              title={`Remove ${ip}`}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}
            </>
          )}

          {/* ── Notifications ── */}
          {active === 'notifications' && (
            <>
              <SectionCard title="Global Channels">
                <div>
                  <ToggleRow
                    label="Email Notifications"
                    desc="Send email notifications to users"
                    checked={notifications.email_notifications_enabled}
                    onChange={() => setNotifications(p => ({ ...p, email_notifications_enabled: !p.email_notifications_enabled }))}
                  />
                  <ToggleRow
                    label="Push Notifications"
                    desc="Send push notifications to users"
                    checked={notifications.push_notifications_enabled}
                    onChange={() => setNotifications(p => ({ ...p, push_notifications_enabled: !p.push_notifications_enabled }))}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Email Alerts">
                <div>
                  <ToggleRow
                    label="New report filed"
                    desc="Email admins when a new report is submitted"
                    checked={notifications.email_on_new_report}
                    onChange={() => setNotifications(p => ({ ...p, email_on_new_report: !p.email_on_new_report }))}
                  />
                  <ToggleRow
                    label="New user registered"
                    desc="Email admins when a new user signs up"
                    checked={notifications.email_on_new_user}
                    onChange={() => setNotifications(p => ({ ...p, email_on_new_user: !p.email_on_new_user }))}
                  />
                  <ToggleRow
                    label="Content flagged"
                    desc="Email admins when content is flagged"
                    checked={notifications.email_on_flagged_content}
                    onChange={() => setNotifications(p => ({ ...p, email_on_flagged_content: !p.email_on_flagged_content }))}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Push Alerts">
                <div>
                  <ToggleRow
                    label="New report filed"
                    desc="Push notification when a new report is submitted"
                    checked={notifications.push_on_new_report}
                    onChange={() => setNotifications(p => ({ ...p, push_on_new_report: !p.push_on_new_report }))}
                  />
                  <ToggleRow
                    label="New user registered"
                    desc="Push notification when a new user signs up"
                    checked={notifications.push_on_new_user}
                    onChange={() => setNotifications(p => ({ ...p, push_on_new_user: !p.push_on_new_user }))}
                  />
                  <ToggleRow
                    label="Content flagged"
                    desc="Push notification when content is flagged"
                    checked={notifications.push_on_flagged_content}
                    onChange={() => setNotifications(p => ({ ...p, push_on_flagged_content: !p.push_on_flagged_content }))}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Digest &amp; Limits">
                <div className="py-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Digest Frequency</p>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'never'] as const).map(freq => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setNotifications(p => ({ ...p, digest_frequency: freq }))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize border transition-all ${notifications.digest_frequency === freq ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {notifications.digest_frequency === 'daily' && 'Users receive a daily summary of their notifications.'}
                      {notifications.digest_frequency === 'weekly' && 'Users receive a weekly summary of their notifications.'}
                      {notifications.digest_frequency === 'never' && 'No digest emails are sent.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NumberField
                      label="Max notifications per day"
                      hint="Per-user daily cap on notifications sent"
                      value={notifications.max_notifications_per_day}
                      onChange={v => setNotifications(p => ({ ...p, max_notifications_per_day: v }))}
                    />
                    <NumberField
                      label="Report alert threshold"
                      hint="Reports before sending an admin alert"
                      value={notifications.report_alert_threshold}
                      onChange={v => setNotifications(p => ({ ...p, report_alert_threshold: v }))}
                    />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Moderation ── */}
          {active === 'moderation' && (
            <>
              <SectionCard title="Moderation Policies">
                <div>
                  <ToggleRow
                    label="Content Review Queue"
                    desc="Enable the content review queue for flagged items"
                    checked={moderation.content_review_queue_enabled}
                    onChange={() => setModeration(p => ({ ...p, content_review_queue_enabled: !p.content_review_queue_enabled }))}
                  />
                  <ToggleRow
                    label="Review New Users"
                    desc="Queue new user accounts for manual review before approval"
                    checked={moderation.require_review_for_new_users}
                    onChange={() => setModeration(p => ({ ...p, require_review_for_new_users: !p.require_review_for_new_users }))}
                  />
                  <ToggleRow
                    label="Allow User Appeals"
                    desc="Let users appeal moderation decisions"
                    checked={moderation.allow_user_appeals}
                    onChange={() => setModeration(p => ({ ...p, allow_user_appeals: !p.allow_user_appeals }))}
                  />
                  <ToggleRow
                    label="Require Reason for Hiding"
                    desc="Moderators must provide a reason when hiding content"
                    checked={moderation.require_reason_for_hiding}
                    onChange={() => setModeration(p => ({ ...p, require_reason_for_hiding: !p.require_reason_for_hiding }))}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Spam Filter">
                <div className="py-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Spam Filter Strength</p>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setModeration(p => ({ ...p, spam_filter_strength: level }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize border transition-all ${moderation.spam_filter_strength === level
                          ? level === 'high' ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : level === 'medium' ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-green-600 text-white border-green-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {moderation.spam_filter_strength === 'low' && 'Only obvious spam is blocked automatically.'}
                    {moderation.spam_filter_strength === 'medium' && 'Balanced — catches most spam with low false positives.'}
                    {moderation.spam_filter_strength === 'high' && 'Aggressive filtering; may catch legitimate content.'}
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Auto-Action Thresholds">
                <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberField
                    label="Auto-hide threshold"
                    hint="Reports needed to auto-hide content"
                    value={moderation.auto_hide_reports_threshold}
                    onChange={v => setModeration(p => ({ ...p, auto_hide_reports_threshold: v }))}
                  />
                  <NumberField
                    label="Auto-suspend threshold"
                    hint="Reports against a user before auto-suspend"
                    value={moderation.auto_suspend_after_reports}
                    onChange={v => setModeration(p => ({ ...p, auto_suspend_after_reports: v }))}
                  />
                  <NumberField
                    label="Content retention"
                    hint="Days before deleted content is purged"
                    value={moderation.content_retention_days}
                    onChange={v => setModeration(p => ({ ...p, content_retention_days: v }))}
                  />
                  <NumberField
                    label="Auto-resolve reports"
                    hint="Days until an open report auto-closes"
                    value={moderation.report_auto_resolve_days}
                    onChange={v => setModeration(p => ({ ...p, report_auto_resolve_days: v }))}
                  />
                </div>
                <div className="pb-4">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">Auto-actions apply immediately when thresholds are crossed. Review the audit log for a history of automated decisions.</p>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

        </div>
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Reset to Defaults?</h3>
              <p className="text-sm text-gray-500 mt-1">All settings will revert to their factory defaults. This cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeneral(DEFAULTS.general);
                  setSecurity(DEFAULTS.security);
                  setNotifications(DEFAULTS.notifications);
                  setModeration(DEFAULTS.moderation);
                  setShowResetConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
