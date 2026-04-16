import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Clock,
  MessageSquare,
  AlertTriangle,
  Shield,
  Bell,
  Trash2,
  Ban,
  CheckCircle,
  Calendar,
  Activity,
  ChevronDown,
  Save,
  Send,
  Loader2,
  Mail,
  Briefcase,
  MoreVertical,
  X,
  User as UserIcon,
} from "lucide-react";
import {
  GetAdminUserById,
  SuspendUser,
  UnsuspendUser,
  ChangeUserRole,
  DeleteAdminUser,
  NotifyUser,
} from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";
import { MSG } from "../../constants/messages";

type UserRole = "user" | "super_admin" | "admin";
type UserStatus = "active" | "suspended" | "deactivated" | "deleted";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  job_title: string;
  is_suspended: boolean;
  is_deactivated: boolean;
  is_deleted: boolean;
  account_status: string;
  suspension_reason: string | null;
  suspension_expires_at: string | null;
  created_at: string;
  last_active_at: string;
  total_posts: number;
  total_comments: number;
  mentorship_sessions?: number;
  reports_against: number;
}

function getInitials(u: string) {
  return u
    .split("_")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function getUserStatus(u: User): UserStatus {
  return (
    (u.account_status as UserStatus) ??
    (u.is_deleted
      ? "deleted"
      : u.is_suspended
        ? "suspended"
        : u.is_deactivated
          ? "deactivated"
          : "active")
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    user: "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-700 border border-gray-200",
    moderator:
      "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 border border-blue-200",
    admin:
      "bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700 border border-purple-200",
    super_admin:
      "bg-gradient-to-br from-pink-50 to-rose-50 text-pink-700 border border-pink-200",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize shadow-sm ${styles[role] ?? "bg-gray-100 text-gray-600"}`}
    >
      {role.replace("_", " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    active:
      "bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border border-green-200",
    suspended:
      "bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border border-red-200",
    deactivated:
      "bg-gradient-to-br from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200",
    deleted:
      "bg-gradient-to-br from-gray-100 to-slate-50 text-gray-500 border border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize shadow-sm ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ReportStatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    resolved:
      "bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border border-green-200",
    submitted:
      "bg-gradient-to-br from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200",
    under_review:
      "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 border border-blue-200",
    declined:
      "bg-gradient-to-br from-gray-100 to-slate-50 text-gray-500 border border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize shadow-sm ${styles[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

// Skeleton Loader Components
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
      <div className="w-16 h-8 bg-gray-200 rounded mb-2" />
      <div className="w-20 h-3 bg-gray-200 rounded" />
    </div>
  );
}

function ReportRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="py-3 px-4 first:pl-0">
        <div className="w-20 h-4 bg-gray-200 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="w-16 h-6 bg-gray-200 rounded-full" />
      </td>
      <td className="py-3 px-4 last:pr-0">
        <div className="w-20 h-4 bg-gray-200 rounded" />
      </td>
    </tr>
  );
}

function SuspensionCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-gray-200 rounded-full" />
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </div>
      <div className="ml-6 space-y-2">
        <div className="w-full h-3 bg-gray-200 rounded" />
        <div className="w-3/4 h-3 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-3 mt-3 ml-6">
        <div className="w-16 h-3 bg-gray-200 rounded" />
        <div className="w-20 h-3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// Mobile Action Sheet
function ActionSheet({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 animate-slide-up">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [reportsAgainst, setReportsAgainst] = useState<any[]>([]);
  const [suspensionHistory, setSuspensionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"reports" | "suspensions">(
    "reports",
  );
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendExpiry, setSuspendExpiry] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  useEffect(() => {
    if (user?.username) {
      sessionStorage.setItem("currentViewedUserName", user.username);
      sessionStorage.setItem("currentViewedUserId", user.id);
    }

    return () => {
      sessionStorage.removeItem("currentViewedUserName");
      sessionStorage.removeItem("currentViewedUserId");
    };
  }, [user]);

  function loadUser() {
    if (!userId) return;
    setLoading(true);
    GetAdminUserById(userId)
      .then((res) => {
        setUser(res.user);
        setReportsAgainst(res.reports_against ?? []);
        setSuspensionHistory(res.suspension_history ?? []);
        setSelectedRole((res.user?.role as UserRole) ?? "user");
      })
      .catch((err: unknown) => {
        showToast(getApiError(err, MSG.ADMIN.USER_LOAD_FAILED), "error");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUser();
  }, [userId]);

  async function handleSuspend() {
    if (!user || !suspendReason.trim()) return;
    setSaving(true);
    try {
      await SuspendUser(user.id, {
        reason: suspendReason,
        expires_at: suspendExpiry || null,
      });
      showToast(MSG.ADMIN.USER_SUSPENDED, "success");
      setShowSuspendForm(false);
      setSuspendReason("");
      setSuspendExpiry("");
      loadUser();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.SUSPEND_FAILED), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleLiftSuspension() {
    if (!user) return;
    setSaving(true);
    try {
      await UnsuspendUser(user.id);
      showToast(MSG.ADMIN.SUSPENSION_LIFTED, "success");
      loadUser();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.ACTION_FAILED), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRole() {
    if (!user || selectedRole === user.role) return;
    setSaving(true);
    try {
      await ChangeUserRole(user.id, selectedRole);
      showToast(MSG.ADMIN.ROLE_UPDATED, "success");
      loadUser();
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.ACTION_FAILED), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendNotification() {
    if (!user || !notifTitle.trim() || !notifMessage.trim()) return;
    setSaving(true);
    try {
      await NotifyUser(user.id, {
        title: notifTitle,
        message: notifMessage,
        type: "system",
      });
      showToast(MSG.ADMIN.NOTIFICATION_SENT, "success");
      setShowNotifForm(false);
      setNotifTitle("");
      setNotifMessage("");
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.ACTION_FAILED), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setSaving(true);
    try {
      await DeleteAdminUser(user.id, "Deleted by admin");
      showToast(MSG.ADMIN.ACCOUNT_DELETED, "success");
      navigate("/admin/users");
    } catch (err: unknown) {
      showToast(getApiError(err, MSG.ADMIN.ACTION_FAILED), "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
        {/* Back Button Skeleton */}
        <div className="flex items-center gap-2 animate-pulse">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>

        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-200 animate-pulse" />
            <div className="space-y-2">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-40 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Badges Skeleton */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <div className="flex-1 px-4 sm:px-5 py-3.5">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex-1 px-4 sm:px-5 py-3.5">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <ReportRowSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">User not found.</p>
        <button
          onClick={() => navigate("/admin/users")}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
        >
          Back to Users
        </button>
      </div>
    );
  }

  const status = getUserStatus(user);
  const statCards = [
    {
      label: "Posts",
      value: user.total_posts,
      icon: <FileText className="w-5 h-5 text-indigo-500" />,
      bg: "bg-gradient-to-br from-indigo-50 to-blue-50",
      border: "border-indigo-100",
    },
    {
      label: "Comments",
      value: user.total_comments,
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
      bg: "bg-gradient-to-br from-blue-50 to-cyan-50",
      border: "border-blue-100",
    },
    {
      label: "Reports",
      value: user.reports_against,
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      bg: "bg-gradient-to-br from-red-50 to-rose-50",
      border: "border-red-100",
    },
    {
      label: "Mentorship",
      value: user.mentorship_sessions ?? 0,
      icon: <Activity className="w-5 h-5 text-green-500" />,
      bg: "bg-gradient-to-br from-green-50 to-emerald-50",
      border: "border-green-100",
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/users")}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Users</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-xl">
            {getInitials(user.username)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {user.username}
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {user.job_title || "No job title"}
            </p>
          </div>
        </div>

        {/* Mobile Actions Button */}
        <button
          onClick={() => setShowMobileActions(true)}
          className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg"
        >
          <MoreVertical className="w-4 h-4" />
          Actions
        </button>
      </div>

      {/* Role & Status Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <RoleBadge role={user.role} />
        <StatusBadge status={status} />
        {user.suspension_reason && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
            <Ban className="w-3 h-3" />
            Suspended: {user.suspension_reason}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left Column */}
        <div className="flex-1 lg:w-0 space-y-4 sm:space-y-5">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`bg-white rounded-xl sm:rounded-2xl shadow-lg border ${card.border} p-4 hover:shadow-xl transition-all duration-300 hover:scale-105`}
              >
                <div
                  className={`inline-flex p-2 sm:p-3 rounded-xl ${card.bg} mb-2 sm:mb-3`}
                >
                  {card.icon}
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {(["reports", "suspensions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? "text-purple-700 border-b-2 border-purple-600 bg-gradient-to-b from-purple-50/50 to-white"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab === "reports" ? "Reports Against" : "Suspension History"}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-5">
              {activeTab === "reports" &&
                (loading ? (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full">
                        <tbody className="divide-y divide-gray-50">
                          {[...Array(3)].map((_, i) => (
                            <ReportRowSkeleton key={i} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : reportsAgainst.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-gray-400">
                    <Shield className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-40" />
                    <p className="text-sm font-medium">
                      No reports against this user
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {["Reference", "Type", "Status", "Date"].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 first:pl-0 last:pr-0"
                                >
                                  {h}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {reportsAgainst.map((r: any) => (
                            <tr
                              key={r.id}
                              className="hover:bg-gray-50/50 transition-colors"
                            >
                              <td className="py-3 px-4 first:pl-0 text-xs sm:text-sm font-mono font-medium text-gray-700">
                                {r.reference_number}
                              </td>
                              <td className="py-3 px-4 text-xs sm:text-sm text-gray-600 capitalize">
                                {r.incident_type?.replace("_", " ")}
                              </td>
                              <td className="py-3 px-4">
                                <ReportStatusPill status={r.status} />
                              </td>
                              <td className="py-3 px-4 last:pr-0 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                                {formatDate(r.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

              {activeTab === "suspensions" &&
                (loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <SuspensionCardSkeleton key={i} />
                    ))}
                  </div>
                ) : suspensionHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-gray-400">
                    <Clock className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-40" />
                    <p className="text-sm font-medium">No suspension history</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suspensionHistory.map((s: any, i: number) => (
                      <div
                        key={i}
                        className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 text-sm border border-gray-100 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Ban className="w-4 h-4 text-red-500" />
                          <p className="font-semibold text-gray-800">
                            {s.action?.replace("_", " ")}
                          </p>
                        </div>
                        <p className="text-gray-600 text-xs sm:text-sm ml-6">
                          {s.reason}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs text-gray-400 ml-6">
                          <span>By: {s.performed_by}</span>
                          <span>{formatDate(s.at)}</span>
                          {s.metadata?.expires_at && (
                            <span className="text-orange-600">
                              Expires: {formatDate(s.metadata.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Desktop Right Column - Account Actions */}
        <div className="hidden lg:block lg:w-80 xl:w-96 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 p-5 space-y-5 sticky top-6">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" /> Account Actions
            </h2>

            {/* Suspend / Lift */}
            <div className="space-y-3">
              {status === "suspended" ? (
                <button
                  onClick={handleLiftSuspension}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-green-500/30 hover:scale-105"
                >
                  <CheckCircle className="w-4 h-4" /> Lift Suspension
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowSuspendForm((p) => !p)}
                    disabled={status === "deleted"}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 disabled:opacity-40 transition-all shadow-lg shadow-red-500/30 hover:scale-105"
                  >
                    <Ban className="w-4 h-4" /> Suspend User
                  </button>

                  {showSuspendForm && (
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 space-y-3 animate-fade-down">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                        Suspension Details
                      </p>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Reason *
                        </label>
                        <textarea
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          rows={3}
                          placeholder="Describe the reason..."
                          className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Expires On (optional)
                        </label>
                        <input
                          type="date"
                          value={suspendExpiry}
                          onChange={(e) => setSuspendExpiry(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                        />
                      </div>
                      <button
                        onClick={handleSuspend}
                        disabled={!suspendReason.trim() || saving}
                        className="w-full py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 disabled:opacity-50 transition-all"
                      >
                        {saving ? "Suspending..." : "Confirm Suspension"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Change Role */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Change Role</p>
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 text-gray-700 cursor-pointer"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={handleSaveRole}
                disabled={selectedRole === user.role || saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 disabled:opacity-40 transition-all hover:shadow-md"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Role"}
              </button>
            </div>

            <div className="border-t border-gray-100" />

            {/* Send Notification */}
            <div className="space-y-3">
              <button
                onClick={() => setShowNotifForm((p) => !p)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 hover:scale-105"
              >
                <Bell className="w-4 h-4" /> Send Notification
              </button>

              {showNotifForm && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 space-y-3 animate-fade-down">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Compose Notification
                  </p>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Title..."
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    rows={3}
                    placeholder="Message..."
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                  <button
                    onClick={handleSendNotification}
                    disabled={
                      !notifTitle.trim() || !notifMessage.trim() || saving
                    }
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {saving ? "Sending..." : "Send"}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Delete Account */}
            <div className="space-y-3">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={status === "deleted"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white text-gray-600 hover:from-gray-100 hover:to-gray-50 disabled:opacity-40 transition-all hover:shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                  {status === "deleted" ? "Account Deleted" : "Delete Account"}
                </button>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 space-y-3 animate-fade-down">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Confirm Deletion
                  </p>
                  <p className="text-sm text-gray-600">
                    Permanently delete{" "}
                    <span className="font-semibold text-gray-900">
                      {user.username}
                    </span>
                    's account.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={saving}
                      className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 disabled:opacity-50 transition-all"
                    >
                      {saving ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Joined
                </span>
                <span className="font-medium text-gray-700">
                  {formatDate(user.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Last Active
                </span>
                <span className="font-medium text-gray-700">
                  {formatRelativeTime(user.last_active_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Sheet */}
      <ActionSheet
        isOpen={showMobileActions}
        onClose={() => setShowMobileActions(false)}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Account Actions
          </h3>

          {/* Suspend / Lift */}
          {status === "suspended" ? (
            <button
              onClick={() => {
                handleLiftSuspension();
                setShowMobileActions(false);
              }}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            >
              <CheckCircle className="w-4 h-4" /> Lift Suspension
            </button>
          ) : (
            <button
              onClick={() => {
                setShowSuspendForm(true);
                setShowMobileActions(false);
              }}
              disabled={status === "deleted"}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white"
            >
              <Ban className="w-4 h-4" /> Suspend User
            </button>
          )}

          {/* Change Role */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Change Role</p>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50"
            >
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button
              onClick={() => {
                handleSaveRole();
                setShowMobileActions(false);
              }}
              disabled={selectedRole === user.role || saving}
              className="w-full py-2.5 text-sm font-semibold rounded-xl bg-purple-600 text-white"
            >
              Save Role
            </button>
          </div>

          {/* Send Notification */}
          <button
            onClick={() => {
              setShowNotifForm(true);
              setShowMobileActions(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
          >
            <Bell className="w-4 h-4" /> Send Notification
          </button>

          {/* Delete Account */}
          <button
            onClick={() => {
              setShowDeleteConfirm(true);
              setShowMobileActions(false);
            }}
            disabled={status === "deleted"}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border border-red-200 bg-red-50 text-red-600"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>

          <button
            onClick={() => setShowMobileActions(false)}
            className="w-full py-3 text-sm font-medium text-gray-500 border-t border-gray-100"
          >
            Cancel
          </button>
        </div>
      </ActionSheet>

      {/* Mobile Suspension Form */}
      <ActionSheet
        isOpen={showSuspendForm}
        onClose={() => setShowSuspendForm(false)}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Suspend User</h3>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
              placeholder="Describe the reason..."
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Expires On (optional)
            </label>
            <input
              type="date"
              value={suspendExpiry}
              onChange={(e) => setSuspendExpiry(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5"
            />
          </div>
          <button
            onClick={() => {
              handleSuspend();
              setShowSuspendForm(false);
            }}
            disabled={!suspendReason.trim() || saving}
            className="w-full py-3 text-sm font-semibold rounded-xl bg-red-600 text-white"
          >
            {saving ? "Suspending..." : "Confirm Suspension"}
          </button>
          <button
            onClick={() => setShowSuspendForm(false)}
            className="w-full py-2 text-sm font-medium text-gray-500"
          >
            Cancel
          </button>
        </div>
      </ActionSheet>

      {/* Mobile Notification Form */}
      <ActionSheet
        isOpen={showNotifForm}
        onClose={() => setShowNotifForm(false)}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Send Notification
          </h3>
          <input
            type="text"
            value={notifTitle}
            onChange={(e) => setNotifTitle(e.target.value)}
            placeholder="Title..."
            className="w-full text-sm border border-gray-200 rounded-lg p-2.5"
          />
          <textarea
            value={notifMessage}
            onChange={(e) => setNotifMessage(e.target.value)}
            rows={3}
            placeholder="Message..."
            className="w-full text-sm border border-gray-200 rounded-lg p-2.5"
          />
          <button
            onClick={() => {
              handleSendNotification();
              setShowNotifForm(false);
            }}
            disabled={!notifTitle.trim() || !notifMessage.trim() || saving}
            className="w-full py-3 text-sm font-semibold rounded-xl bg-blue-600 text-white"
          >
            {saving ? "Sending..." : "Send"}
          </button>
          <button
            onClick={() => setShowNotifForm(false)}
            className="w-full py-2 text-sm font-medium text-gray-500"
          >
            Cancel
          </button>
        </div>
      </ActionSheet>

      {/* Mobile Delete Confirmation */}
      <ActionSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Delete Account
          </h3>
          <p className="text-sm text-gray-600">
            Permanently delete{" "}
            <span className="font-semibold">{user.username}</span>'s account.
            This cannot be undone.
          </p>
          <button
            onClick={() => {
              handleDeleteAccount();
              setShowDeleteConfirm(false);
            }}
            disabled={saving}
            className="w-full py-3 text-sm font-semibold rounded-xl bg-red-600 text-white"
          >
            {saving ? "Deleting..." : "Yes, Delete Account"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="w-full py-2 text-sm font-medium text-gray-500"
          >
            Cancel
          </button>
        </div>
      </ActionSheet>
    </div>
  );
}
