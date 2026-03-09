import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  EyeOff,
  Eye,
  Trash2,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  Hash,
  Loader2,
  AlertTriangle,
  Filter,
  X,
  Download,
  FileSpreadsheet,
  ArrowUpDown,
  Download as DownloadIcon,
  MoreVertical,
  Shield,
  Clock,
  Calendar,
  Flag,
} from "lucide-react";
import {
  GetAdminContent,
  HideContent,
  RestoreContent,
  RemoveContent,
  ExportContent,
} from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { TableRowSkeleton, MobileCardSkeleton, CompactStatCardSkeleton, SortDropdown, ExportSuccessModal } from "../components";
import { getApiError } from "../utils/apiError";
import { useExport } from "../hooks/useExport";

type ContentType =
  | "feed_post"
  | "feed_comment"
  | "forum_topic"
  | "forum_comment"
  | "nook"
  | "nook_message";
type ModerationStatus = "visible" | "hidden" | "removed";
type SortField = "created_at" | "reports_count" | "updated_at";
type SortOrder = "asc" | "desc";
type ExportFormat = "csv" | "pdf";

interface ContentItem {
  id: string;
  content_id: string;
  type?: ContentType;
  content_type: ContentType;
  moderation_status: ModerationStatus;
  author: { id: string; username: string; avatar?: string } | string;
  preview?: string;
  body?: string;
  text?: string;
  content?: string;
  title?: string;
  reports_count: number;
  created_at: string;
  hidden_at?: string;
  hidden_by?: string;
  hide_reason?: string;
}

interface ContentSummary {
  total: number;
  visible: number;
  hidden: number;
  removed: number;
  flagged: number;
}

const PAGE_SIZE = 20;

const TYPE_CONFIG: Record<
  ContentType,
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  feed_post: {
    icon: <FileText className="w-4 h-4" />,
    label: "Feed Post",
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
  feed_comment: {
    icon: <MessageSquare className="w-4 h-4" />,
    label: "Feed Comment",
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  forum_topic: {
    icon: <FileText className="w-4 h-4" />,
    label: "Forum Topic",
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  forum_comment: {
    icon: <MessageSquare className="w-4 h-4" />,
    label: "Forum Comment",
    color: "text-cyan-600",
    bg: "bg-cyan-100",
  },
  nook: {
    icon: <Hash className="w-4 h-4" />,
    label: "Nook",
    color: "text-pink-600",
    bg: "bg-pink-100",
  },
  nook_message: {
    icon: <MessageSquare className="w-4 h-4" />,
    label: "Nook Message",
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MOD_STYLES: Record<ModerationStatus | "flagged", string> = {
  visible:
    "bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border border-green-200",
  hidden:
    "bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 border border-orange-200",
  removed:
    "bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border border-red-200",
  flagged:
    "bg-gradient-to-br from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200",
};


const SORT_OPTIONS = [
  { field: "created_at", label: "Date Created" },
  { field: "reports_count", label: "Report Count" },
  { field: "updated_at", label: "Last Updated" },
];

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
    type?: string;
    status?: string;
    flagged?: boolean;
    search?: string;
  };
}) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");

  if (!isOpen) return null;

  const hasActiveFilters =
    activeFilters &&
    (activeFilters.type ||
      activeFilters.status ||
      activeFilters.flagged ||
      activeFilters.search);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Export Content
          </h3>
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
              {activeFilters.type && (
                <p className="text-xs text-purple-700">
                  • Type:{" "}
                  <span className="font-medium capitalize">
                    {activeFilters.type.replace("_", " ")}
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
              {activeFilters.flagged && (
                <p className="text-xs text-purple-700">
                  • <span className="font-medium">Flagged only</span>
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
                className={`w-8 h-8 ${
                  selectedFormat === "csv" ? "text-purple-600" : "text-gray-400"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  selectedFormat === "csv" ? "text-purple-700" : "text-gray-600"
                }`}
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
                className={`w-8 h-8 ${
                  selectedFormat === "pdf" ? "text-purple-600" : "text-gray-400"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  selectedFormat === "pdf" ? "text-purple-700" : "text-gray-600"
                }`}
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

// ExportSuccessModal imported from shared components

// Hide/Remove Reason Modal
function ActionReasonModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  actionType,
  contentType,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  actionType: "hide" | "remove";
  contentType: string;
}) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      setReason("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium mb-3 ${
              actionType === "hide"
                ? "bg-orange-50 text-orange-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {actionType === "hide" ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span className="capitalize">{contentType.replace("_", " ")}</span>
          </div>
          <p className="text-sm text-gray-500">
            Please provide a reason for this action. This will be recorded in
            the moderation log.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={`Why are you ${
                actionType === "hide" ? "hiding" : "removing"
              } this content?`}
              className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg disabled:opacity-50 ${
                actionType === "hide"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : actionType === "hide" ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isSubmitting
                ? "Processing..."
                : actionType === "hide"
                  ? "Hide Content"
                  : "Remove Permanently"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Restore Confirmation Modal
function RestoreModal({
  isOpen,
  onClose,
  onConfirm,
  contentType,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  contentType: string;
}) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(reason || "Restored by admin");
      setReason("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Restore Content
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium mb-3 bg-green-50 text-green-700">
            <Eye className="w-4 h-4" />
            <span className="capitalize">{contentType.replace("_", " ")}</span>
          </div>
          <p className="text-sm text-gray-500">
            This content will be restored to visible status. You can optionally
            provide a reason for the restoration.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why are you restoring this content?"
              className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-300 bg-gray-50"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {isSubmitting ? "Restoring..." : "Restore Content"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Filter Modal
function FilterModal({
  isOpen,
  onClose,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  showFlaggedOnly,
  setShowFlaggedOnly,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  showFlaggedOnly: boolean;
  setShowFlaggedOnly: (v: boolean) => void;
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
          <h3 className="text-lg font-semibold text-gray-900">
            Filter Content
          </h3>
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
              Content Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">All Types</option>
              <option value="feed_post">Feed Post</option>
              <option value="feed_comment">Feed Comment</option>
              <option value="forum_topic">Forum Topic</option>
              <option value="forum_comment">Forum Comment</option>
              <option value="nook">Nook</option>
              <option value="nook_message">Nook Message</option>
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
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              <option value="removed">Removed</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium text-gray-700">
              Show flagged only
            </span>
            <button
              onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showFlaggedOnly ? "bg-purple-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showFlaggedOnly ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
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

// Mobile Sort Modal
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

  useEffect(() => {
    setLocalField(sortField);
    setLocalOrder(sortOrder);
  }, [sortField, sortOrder]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sort Content</h3>
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
              <option value="created_at">Date Created</option>
              <option value="reports_count">Report Count</option>
              <option value="updated_at">Last Updated</option>
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

// Mobile Card Component
function MobileContentCard({
  item,
  onView,
  onAction,
  actioning,
}: {
  item: ContentItem;
  onView: () => void;
  onAction: (type: "hide" | "restore" | "remove") => void;
  actioning: boolean;
}) {
  const config = TYPE_CONFIG[item.content_type] ?? {
    icon: <FileText className="w-4 h-4" />,
    label: item.content_type ?? "Content",
    color: "text-gray-600",
    bg: "bg-gray-100",
  };
  const status: ModerationStatus | "flagged" =
    item.reports_count > 0 && item.moderation_status === "visible"
      ? "flagged"
      : item.moderation_status;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <button onClick={onView} className="flex items-center gap-3 flex-1">
          <div
            className={`w-10 h-10 rounded-xl ${config.bg} ${config.color} flex items-center justify-center shadow-sm`}
          >
            {config.icon}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {config.label}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {typeof item.author === "object"
                ? item.author?.username
                : String(item.author)}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          {actioning ? (
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          ) : (
            <>
              {status === "hidden" || status === "removed" ? (
                <button
                  onClick={() => onAction("restore")}
                  className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => onAction("hide")}
                  className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              )}
              {status !== "removed" && (
                <button
                  onClick={() => onAction("remove")}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <button onClick={onView} className="w-full text-left">
        {(() => {
          const raw = item.preview ?? item.body ?? item.text ?? item.content ?? item.title ?? '';
          if (!raw) return <span className="text-gray-400 italic text-sm">No preview</span>;
          const truncated = raw.length > 20 ? raw.slice(0, 20) + '…' : raw;
          return <p className="text-sm text-gray-500" title={raw}>{truncated}</p>;
        })()}
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${MOD_STYLES[status]}`}
        >
          {status}
        </span>
        {item.reports_count > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
            <Flag className="w-3 h-3" />
            {item.reports_count}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(item.created_at).toLocaleDateString()}
        </div>
        <button
          onClick={onView}
          className="text-purple-600 font-medium hover:text-purple-700"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// Main Component - MUST BE NAMED EXPORT
export function ContentModerationPage(): JSX.Element {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [summary, setSummary] = useState<ContentSummary>({
    total: 0,
    visible: 0,
    hidden: 0,
    removed: 0,
    flagged: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const { exporting, showSuccess: showExportSuccess, downloadUrl: exportDownloadUrl, exportedFormat, doExport, closeSuccess: closeExportSuccess } = useExport(
    (format) => ExportContent({
      format,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      flagged: showFlaggedOnly ? "true" : undefined,
      search: search || undefined,
      sortBy: sortField,
      sortOrder,
    })
  );

  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);

  // Action modals
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    item: ContentItem | null;
    type: "hide" | "restore" | "remove";
  }>({ isOpen: false, item: null, type: "hide" });

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GetAdminContent({
        page,
        limit: PAGE_SIZE,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        flagged: showFlaggedOnly ? "true" : undefined,
        search: search || undefined,
        sortBy: sortField,
        sortOrder: sortOrder,
      });
      const d = res?.data ?? {};
      setItems(
        (d.items ?? []).map((item: Record<string, unknown>) => ({
          ...item,
          content_type: item.content_type ?? item.type,
          content_id: item.content_id ?? item.id,
        })),
      );
      setSummary(
        d.summary ?? {
          total: 0,
          visible: 0,
          hidden: 0,
          removed: 0,
          flagged: 0,
        },
      );
      setTotal(res?.meta?.total ?? 0);
      setTotalPages(res?.meta?.total_pages ?? 1);
    } catch (err: unknown) {
      showToast(
        getApiError(err, "Failed to load content"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    typeFilter,
    statusFilter,
    showFlaggedOnly,
    search,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

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

  async function handleAction(
    item: ContentItem,
    type: "hide" | "restore" | "remove",
    reason: string,
  ) {
    if (!item) return;
    setActioningId(item.id);
    try {
      if (type === "hide") {
        await HideContent(item.content_type, item.content_id ?? item.id, {
          reason,
        });
        showToast("Content hidden", "success");
      } else if (type === "restore") {
        await RestoreContent(item.content_type, item.content_id ?? item.id, {
          reason,
        });
        showToast("Content restored", "success");
      } else {
        await RemoveContent(item.content_type, item.content_id ?? item.id, {
          reason,
        });
        showToast("Content removed permanently", "success");
      }
      fetchContent();
    } catch (err: unknown) {
      showToast(getApiError(err, "Action failed"), "error");
    } finally {
      setActioningId(null);
      setActionModal({ isOpen: false, item: null, type: "hide" });
    }
  }

  function openActionModal(
    item: ContentItem,
    type: "hide" | "restore" | "remove",
  ) {
    setActionModal({ isOpen: true, item, type });
  }

  function handleViewDetails(item: ContentItem) {
    navigate(
      `/admin/content/${item.content_type}/${item.content_id ?? item.id}`,
    );
  }

  const getSortDisplay = () => {
    const fieldMap: Record<SortField, string> = {
      created_at: "Date Created",
      reports_count: "Report Count",
      updated_at: "Last Updated",
    };
    const orderMap = { asc: "Ascending", desc: "Descending" };
    return `${fieldMap[sortField]} (${orderMap[sortOrder]})`;
  };

  const activeFilterCount =
    (typeFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (showFlaggedOnly ? 1 : 0);

  const start = items.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Content Moderation
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
            {total.toLocaleString()} total items
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

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <CompactStatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              label: "Total",
              value: summary.total,
              color: "text-gray-700",
              bg: "bg-gradient-to-br from-gray-50 to-white",
              border: "border-gray-200",
            },
            {
              label: "Visible",
              value: summary.visible,
              color: "text-green-600",
              bg: "bg-gradient-to-br from-green-50 to-emerald-50",
              border: "border-green-200",
            },
            {
              label: "Hidden",
              value: summary.hidden,
              color: "text-orange-600",
              bg: "bg-gradient-to-br from-orange-50 to-amber-50",
              border: "border-orange-200",
            },
            {
              label: "Removed",
              value: summary.removed,
              color: "text-red-600",
              bg: "bg-gradient-to-br from-red-50 to-rose-50",
              border: "border-red-200",
            },
            {
              label: "Flagged",
              value: summary.flagged,
              color: "text-yellow-600",
              bg: "bg-gradient-to-br from-yellow-50 to-amber-50",
              border: "border-yellow-200",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} rounded-xl p-4 border ${s.border} shadow-sm`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {s.label}
              </p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search content or author..."
              className="w-full pl-9 pr-4 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 transition-all"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:flex items-center gap-3">
            <SortDropdown
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={(f, o) => handleSort(f as SortField, o)}
              options={SORT_OPTIONS}
            />

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none pl-3 pr-8 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[140px]"
              >
                <option value="">All Types</option>
                <option value="feed_post">Feed Post</option>
                <option value="feed_comment">Feed Comment</option>
                <option value="forum_topic">Forum Topic</option>
                <option value="forum_comment">Forum Comment</option>
                <option value="nook">Nook</option>
                <option value="nook_message">Nook Message</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none pl-3 pr-8 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[140px]"
              >
                <option value="">All Statuses</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="removed">Removed</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                setShowFlaggedOnly(!showFlaggedOnly);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 text-sm rounded-xl border transition-all ${
                showFlaggedOnly
                  ? "bg-purple-100 text-purple-700 border-purple-300"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Flag className="w-4 h-4" />
              <span className="hidden lg:inline">Flagged Only</span>
            </button>
          </div>

          {/* Mobile Filter & Sort Buttons */}
          <div className="sm:hidden flex gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeFilterCount}
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

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={doExport}
        activeFilters={{
          type: typeFilter || undefined,
          status: statusFilter || undefined,
          flagged: showFlaggedOnly,
          search: search || undefined,
        }}
      />

      <ExportSuccessModal
        isOpen={showExportSuccess}
        onClose={closeExportSuccess}
        format={exportedFormat}
        downloadUrl={exportDownloadUrl}
      />

      <FilterModal
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        showFlaggedOnly={showFlaggedOnly}
        setShowFlaggedOnly={setShowFlaggedOnly}
        onApply={() => setPage(1)}
      />

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

      {actionModal.isOpen && actionModal.item && (
        <>
          {actionModal.type === "restore" ? (
            <RestoreModal
              isOpen={true}
              onClose={() =>
                setActionModal({ isOpen: false, item: null, type: "hide" })
              }
              onConfirm={(reason) =>
                handleAction(actionModal.item!, "restore", reason)
              }
              contentType={actionModal.item.content_type}
            />
          ) : (
            <ActionReasonModal
              isOpen={true}
              onClose={() =>
                setActionModal({ isOpen: false, item: null, type: "hide" })
              }
              onConfirm={(reason) =>
                handleAction(actionModal.item!, actionModal.type, reason)
              }
              title={
                actionModal.type === "hide" ? "Hide Content" : "Remove Content"
              }
              actionType={actionModal.type}
              contentType={actionModal.item.content_type}
            />
          )}
        </>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reports
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRowSkeleton key={i} columns={7} />
                  ))}
                </>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      No content matches the current filters.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const config = TYPE_CONFIG[item.content_type] ?? {
                    icon: <FileText className="w-4 h-4" />,
                    label: item.content_type ?? "Content",
                    color: "text-gray-600",
                    bg: "bg-gray-100",
                  };
                  const status: ModerationStatus | "flagged" =
                    item.reports_count > 0 &&
                    item.moderation_status === "visible"
                      ? "flagged"
                      : item.moderation_status;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div
                          className={`w-10 h-10 rounded-xl ${config.bg} ${config.color} flex items-center justify-center shadow-sm`}
                        >
                          {config.icon}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="text-left group/btn"
                        >
                          {(() => {
                            const raw = item.preview ?? item.body ?? item.text ?? item.content ?? item.title ?? '';
                            if (!raw) return <span className="text-gray-400 italic text-sm">No preview</span>;
                            const truncated = raw.length > 20 ? raw.slice(0, 20) + '…' : raw;
                            return (
                              <p className="text-sm text-gray-500 group-hover/btn:text-purple-700 transition-colors" title={raw}>
                                {truncated}
                              </p>
                            );
                          })()}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {typeof item.author === "object"
                          ? item.author?.username
                          : String(item.author)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize border shadow-sm ${MOD_STYLES[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {item.reports_count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                            <Flag className="w-3 h-3" />
                            {item.reports_count}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(item.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {actioningId === item.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                        ) : (
                          <div className="flex items-center gap-1">
                            {status === "hidden" || status === "removed" ? (
                              <button
                                onClick={() => openActionModal(item, "restore")}
                                title="Restore"
                                className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => openActionModal(item, "hide")}
                                title="Hide"
                                className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"
                              >
                                <EyeOff className="w-4 h-4" />
                              </button>
                            )}
                            {status !== "removed" && (
                              <button
                                onClick={() => openActionModal(item, "remove")}
                                title="Remove permanently"
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDetails(item)}
                              title="View details"
                              className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
            items
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
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl shadow-sm">
            <Shield className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              No content matches the current filters.
            </p>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <MobileContentCard
                key={item.id}
                item={item}
                onView={() => handleViewDetails(item)}
                onAction={(type) => openActionModal(item, type)}
                actioning={actioningId === item.id}
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

// Also export as default for compatibility
export default ContentModerationPage;
