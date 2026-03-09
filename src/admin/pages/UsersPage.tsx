import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ShieldOff,
  Shield,
  Trash2,
  Eye,
  ChevronDown,
  Loader2,
  Filter,
  X,
  Users as UsersIcon,
  Calendar,
  Clock,
  AlertCircle,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  FileSpreadsheet,
  Check,
  Download as DownloadIcon,
} from "lucide-react";
import {
  GetAdminUsers,
  SuspendUser,
  UnsuspendUser,
  ChangeUserRole,
  DeleteAdminUser,
  ExportUsers,
} from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { ConfirmModal } from "../components";
import { getApiError } from "../utils/apiError";

type UserRole = "user" | "super_admin" | "admin";
type UserStatus = "active" | "suspended" | "deactivated" | "deleted";
type SortField = "created_at" | "username" | "last_active_at";
type SortOrder = "asc" | "desc";
type ExportFormat = "csv" | "pdf";

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
  created_at: string;
  last_active_at: string;
  total_posts: number;
  total_comments: number;
  reports_against: number;
}

function getInitials(u: string) {
  return u
    .split("_")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
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

function getStatus(u: User): UserStatus {
  if (u.account_status) return u.account_status as UserStatus;
  if (u.is_deleted) return "deleted";
  if (u.is_suspended) return "suspended";
  if (u.is_deactivated) return "deactivated";
  return "active";
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
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize shadow-sm ${styles[role] ?? "bg-gray-100 text-gray-600"}`}
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
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize shadow-sm ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// Skeleton Loader Components
function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-32 h-3 bg-gray-200 rounded" />
          </div>
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="w-20 h-6 bg-gray-200 rounded-full" />
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="w-16 h-6 bg-gray-200 rounded-full" />
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="w-20 h-4 bg-gray-200 rounded" />
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="w-8 h-8 bg-gray-200 rounded-xl" />
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      </td>
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="space-y-2 flex-1">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-32 h-3 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-16 h-6 bg-gray-200 rounded-full" />
        <div className="w-16 h-6 bg-gray-200 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
        <div className="w-full h-4 bg-gray-200 rounded" />
        <div className="w-full h-4 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// Custom Sort Dropdown Component (ReportsPage style)
function SortDropdown({
  sortField,
  sortOrder,
  onSort,
}: {
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField, order: SortOrder) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside detection
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortOptions: { field: SortField; label: string }[] = [
    { field: "created_at", label: "Join Date" },
    { field: "username", label: "Username" },
    { field: "last_active_at", label: "Last Active" },
  ];

  const currentLabel = sortOptions.find(
    (opt) => opt.field === sortField,
  )?.label;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-200"
      >
        <ArrowUpDown className="w-4 h-4 text-gray-500" />
        <span className="hidden lg:inline">
          Sort: {currentLabel} ({sortOrder === "asc" ? "Asc" : "Desc"})
        </span>
        <span className="lg:hidden">Sort</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-down">
          {/* Sort By Section */}
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Sort By
          </div>
          {sortOptions.map((option) => (
            <button
              key={option.field}
              onClick={() => {
                if (sortField === option.field) {
                  // Toggle order if same field
                  onSort(option.field, sortOrder === "asc" ? "desc" : "asc");
                } else {
                  // New field, default to desc
                  onSort(option.field, "desc");
                }
                setIsOpen(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2.5 text-sm hover:bg-purple-50 transition-colors ${
                sortField === option.field
                  ? "text-purple-700 bg-purple-50/50"
                  : "text-gray-700"
              }`}
            >
              <span className="font-medium">{option.label}</span>
              {sortField === option.field && (
                <div className="flex items-center gap-1">
                  {sortOrder === "asc" ? (
                    <ArrowUp className="w-4 h-4 text-purple-600" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-purple-600" />
                  )}
                </div>
              )}
            </button>
          ))}

          <div className="border-t border-gray-100 my-2" />

          {/* Order Section */}
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Order
          </div>
          <div className="px-2 pb-1">
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onSort(sortField, "asc");
                  setIsOpen(false);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all ${
                  sortOrder === "asc"
                    ? "bg-purple-100 text-purple-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                Asc
              </button>
              <button
                onClick={() => {
                  onSort(sortField, "desc");
                  setIsOpen(false);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all ${
                  sortOrder === "desc"
                    ? "bg-purple-100 text-purple-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
                Desc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export Modal Component
function ExportModal({
  isOpen,
  onClose,
  onExport,
  activeFilters,
}: {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  activeFilters?: {
    search?: string;
    role?: string;
    status?: string;
  };
}) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");

  if (!isOpen) return null;

  const hasActiveFilters =
    activeFilters &&
    (activeFilters.search || activeFilters.role || activeFilters.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Export Users</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Choose your preferred export format.
        </p>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <p className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              Active Filters:
            </p>
            <div className="space-y-1">
              {activeFilters.search && (
                <p className="text-xs text-purple-700">
                  • Search:{" "}
                  <span className="font-medium">"{activeFilters.search}"</span>
                </p>
              )}
              {activeFilters.role && (
                <p className="text-xs text-purple-700">
                  • Role:{" "}
                  <span className="font-medium capitalize">
                    {activeFilters.role.replace("_", " ")}
                  </span>
                </p>
              )}
              {activeFilters.status && (
                <p className="text-xs text-purple-700">
                  • Status:{" "}
                  <span className="font-medium capitalize">
                    {activeFilters.status}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedFormat("csv")}
              className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                selectedFormat === "csv"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
              }`}
            >
              <FileSpreadsheet
                className={`w-8 h-8 ${selectedFormat === "csv" ? "text-purple-600" : "text-gray-400"}`}
              />
              <span
                className={`text-sm font-medium ${selectedFormat === "csv" ? "text-purple-700" : "text-gray-600"}`}
              >
                CSV
              </span>
              <span className="text-xs text-gray-400">
                Comma separated values
              </span>
            </button>

            <button
              onClick={() => setSelectedFormat("pdf")}
              className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                selectedFormat === "pdf"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
              }`}
            >
              <FileText
                className={`w-8 h-8 ${selectedFormat === "pdf" ? "text-purple-600" : "text-gray-400"}`}
              />
              <span
                className={`text-sm font-medium ${selectedFormat === "pdf" ? "text-purple-700" : "text-gray-600"}`}
              >
                PDF
              </span>
              <span className="text-xs text-gray-400">Document format</span>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onExport(selectedFormat);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <DownloadIcon className="w-4 h-4" />
            Export {hasActiveFilters ? "Filtered" : "All"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Export Success Modal
function ExportSuccessModal({
  isOpen,
  onClose,
  format,
  downloadUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  format: ExportFormat;
  downloadUrl: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Export Complete!
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Your {format.toUpperCase()} file has been generated successfully.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <a
            href={downloadUrl}
            download
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <DownloadIcon className="w-4 h-4" />
            Download File
          </a>
        </div>
      </div>
    </div>
  );
}

function ActionsMenu({
  user,
  onView,
  onToggleSuspend,
  onRoleChange,
  onDelete,
}: {
  user: User;
  onView: () => void;
  onToggleSuspend: () => void;
  onRoleChange: (r: UserRole) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const status = getStatus(user);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setShowRoleMenu(false);
        }}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 animate-fade-down">
            <button
              onClick={() => {
                onView();
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition-colors group"
            >
              <Eye className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
              <span>View Details</span>
            </button>

            {status !== "deleted" && (
              <button
                onClick={() => {
                  onToggleSuspend();
                  setOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors group ${
                  status === "suspended"
                    ? "text-green-700 hover:bg-green-50"
                    : "text-orange-700 hover:bg-orange-50"
                }`}
              >
                {status === "suspended" ? (
                  <>
                    <Shield className="w-4 h-4 group-hover:text-green-700" />{" "}
                    Lift Suspension
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-4 h-4 group-hover:text-orange-700" />{" "}
                    Suspend
                  </>
                )}
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowRoleMenu((r) => !r)}
                className="flex items-center justify-between gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition-colors group"
              >
                <span className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                  Change Role
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showRoleMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showRoleMenu && (
                <div className="absolute right-full top-0 mr-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 animate-fade-right">
                  {(
                    ["user", "moderator", "admin", "super_admin"] as UserRole[]
                  ).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleChange(r);
                        setOpen(false);
                        setShowRoleMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 capitalize transition-colors"
                    >
                      {r.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
            >
              <Trash2 className="w-4 h-4 group-hover:text-red-600" />
              Delete Account
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Mobile Card View
function MobileUserCard({
  user,
  onView,
  onToggleSuspend,
  onRoleChange,
  onDelete,
}: {
  user: User;
  onView: () => void;
  onToggleSuspend: () => void;
  onRoleChange: (r: UserRole) => void;
  onDelete: () => void;
}) {
  const status = getStatus(user);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <button onClick={onView} className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
            {getInitials(user.username)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.username}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </button>
        <ActionsMenu
          user={user}
          onView={onView}
          onToggleSuspend={onToggleSuspend}
          onRoleChange={onRoleChange}
          onDelete={onDelete}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RoleBadge role={user.role} />
        <StatusBadge status={status} />
        {user.reports_against > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            {user.reports_against} reports
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>Joined {formatDate(user.created_at)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatRelativeTime(user.last_active_at)}</span>
        </div>
      </div>
    </div>
  );
}

// Filter Modal for Mobile
function FilterModal({
  isOpen,
  onClose,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onApply: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filter Users</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          <button
            onClick={() => {
              onApply();
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

// Sort Modal for Mobile
function SortModal({
  isOpen,
  onClose,
  sortField,
  sortOrder,
  onSort,
}: {
  isOpen: boolean;
  onClose: () => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField, order: SortOrder) => void;
}) {
  const [localField, setLocalField] = useState<SortField>(sortField);
  const [localOrder, setLocalOrder] = useState<SortOrder>(sortOrder);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sort Users</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={localField}
              onChange={(e) => setLocalField(e.target.value as SortField)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="created_at">Join Date</option>
              <option value="username">Username</option>
              <option value="last_active_at">Last Active</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setLocalOrder("asc")}
                className={`flex-1 py-3 text-sm font-medium rounded-xl border transition-all ${
                  localOrder === "asc"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                Ascending
              </button>
              <button
                onClick={() => setLocalOrder("desc")}
                className={`flex-1 py-3 text-sm font-medium rounded-xl border transition-all ${
                  localOrder === "desc"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                Descending
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              onSort(localField, localOrder);
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg"
          >
            Apply Sorting
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [exportedFormat, setExportedFormat] = useState<ExportFormat>("csv");
  const [exportDownloadUrl, setExportDownloadUrl] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GetAdminUsers({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sortBy: sortField,
        sortOrder: sortOrder,
      });
      setUsers(res?.data ?? []);
      setTotal(res?.meta?.total ?? 0);
      setTotalPages(res?.meta?.total_pages ?? 1);
    } catch (err: unknown) {
      showToast(getApiError(err, "Failed to load users"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
    setPage(1);
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      const response = await ExportUsers({
        format,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sortBy: sortField,
        sortOrder,
      });

      // Create a blob from the response data
      const blob = new Blob([response.data], {
        type: format === "csv" ? "text/csv" : "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);

      setExportedFormat(format);
      setExportDownloadUrl(url);
      setShowExportSuccess(true);

      showToast(
        `Export started: ${format.toUpperCase()} file ready`,
        "success",
      );
    } catch (err: unknown) {
      showToast(getApiError(err, `Failed to export as ${format.toUpperCase()}`), "error");
    } finally {
      setExporting(false);
    }
  };

  async function handleToggleSuspend(user: User) {
    const status = getStatus(user);
    try {
      if (status === "suspended") {
        await UnsuspendUser(user.id);
        showToast("Suspension lifted", "success");
      } else {
        await SuspendUser(user.id, { reason: "Suspended by admin" });
        showToast("User suspended", "success");
      }
      fetchUsers();
    } catch (err: unknown) {
      showToast(getApiError(err, "Action failed"), "error");
    }
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    try {
      await ChangeUserRole(userId, role);
      showToast("Role updated", "success");
      fetchUsers();
    } catch (err: unknown) {
      showToast(getApiError(err, "Failed to change role"), "error");
    }
  }

  async function handleDelete(userId: string) {
    try {
      await DeleteAdminUser(userId, "Deleted by admin");
      showToast("Account deleted", "success");
      fetchUsers();
    } catch (err: unknown) {
      showToast(getApiError(err, "Failed to delete account"), "error");
    } finally {
      setConfirmDeleteId(null);
    }
  }

  const start = users.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  // Helper to get sort field display name
  const getSortDisplay = () => {
    const fieldMap = {
      created_at: "Join Date",
      username: "Username",
      last_active_at: "Last Active",
    };
    const orderMap = {
      asc: "Ascending",
      desc: "Descending",
    };
    return `${fieldMap[sortField]} (${orderMap[sortOrder]})`;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
            {total.toLocaleString()} total users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
              }}
              placeholder="Search by username or email..."
              className="w-full pl-9 pr-4 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 transition-all"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:flex items-center gap-3">
            <SortDropdown
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[130px] appearance-none cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[140px] appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          {/* Mobile Filter & Sort Buttons */}
          <div className="sm:hidden flex gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(roleFilter || statusFilter) && (
                <span className="bg-white text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {(roleFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowMobileSort(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-lg"
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort
            </button>
          </div>
        </div>

        {/* Mobile Sort Indicator */}
        <div className="sm:hidden mt-2 text-xs text-gray-500">
          Sorting by:{" "}
          <span className="font-medium text-purple-600">
            {getSortDisplay()}
          </span>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        activeFilters={{
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        }}
      />
      {/* Export Success Modal */}
      <ExportSuccessModal
        isOpen={showExportSuccess}
        onClose={() => {
          setShowExportSuccess(false);
          window.URL.revokeObjectURL(exportDownloadUrl);
        }}
        format={exportedFormat}
        downloadUrl={exportDownloadUrl}
      />
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Account"
        message="Delete this account? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Mobile Filters Modal */}
      <FilterModal
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onApply={() => setPage(1)}
      />

      {/* Mobile Sort Modal */}
      <SortModal
        isOpen={showMobileSort}
        onClose={() => setShowMobileSort(false)}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={(field, order) => {
          setSortField(field);
          setSortOrder(order);
          setPage(1);
        }}
      />

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Role
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Joined
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Last Active
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Reports
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      No users match the current filters.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const status = getStatus(user);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            sessionStorage.setItem(
                              "currentViewedUserId",
                              user.id,
                            );
                            sessionStorage.setItem(
                              "currentViewedUserName",
                              user.username,
                            );
                            navigate(`/admin/users/${user.id}`);
                          }}
                          className="flex items-center gap-3 text-left group/btn"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md group-hover/btn:scale-110 transition-transform duration-200">
                            {getInitials(user.username)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 group-hover/btn:text-purple-700 transition-colors">
                              {user.username}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(user.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatRelativeTime(user.last_active_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold ${
                            user.reports_against > 0
                              ? "bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border border-red-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {user.reports_against}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <ActionsMenu
                          user={user}
                          onView={() => navigate(`/admin/users/${user.id}`)}
                          onToggleSuspend={() => handleToggleSuspend(user)}
                          onRoleChange={(r) => handleRoleChange(user.id, r)}
                          onDelete={() => setConfirmDeleteId(user.id)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {start}–{end}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {total.toLocaleString()}
            </span>{" "}
            users
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-gray-700 bg-purple-50 rounded-xl">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <MobileCardSkeleton key={i} />
            ))}
          </>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl shadow-sm">
            <UsersIcon className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              No users match the current filters.
            </p>
          </div>
        ) : (
          <>
            {users.map((user) => (
              <MobileUserCard
                key={user.id}
                user={user}
                onView={() => {
                  sessionStorage.setItem("currentViewedUserId", user.id);
                  sessionStorage.setItem(
                    "currentViewedUserName",
                    user.username,
                  );
                  navigate(`/admin/users/${user.id}`);
                }}
                onToggleSuspend={() => handleToggleSuspend(user)}
                onRoleChange={(r) => handleRoleChange(user.id, r)}
                onDelete={() => setConfirmDeleteId(user.id)}
              />
            ))}

            {/* Mobile Pagination */}
            <div className="flex flex-col items-center gap-3 pt-4">
              <p className="text-sm text-gray-500">
                Showing {start}–{end} of {total.toLocaleString()}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="px-4 py-2.5 text-sm font-semibold text-purple-700 bg-purple-50 rounded-xl">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 shadow-sm"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
