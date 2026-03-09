// ReportsPage.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Flag,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  User,
  FileText,
  MessageSquare,
  Loader2,
  Save,
  Eye,
  UserCheck,
  Filter,
  X,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  FileSpreadsheet,
  Download as DownloadIcon,
  Check,
  Users,
  BarChart3,
  PieChart,
  TrendingUp,
} from "lucide-react";
import {
  GetAdminReports,
  UpdateReport,
  AssignReport,
  ExportReports,
} from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";

type ReportStatus = "submitted" | "under_review" | "resolved" | "declined";
type Priority = "low" | "medium" | "high" | "critical";
type SortField = "created_at" | "status";
type SortOrder = "asc" | "desc";
type ExportFormat = "csv" | "pdf";

interface ReportItem {
  id: string;
  reference_number: string;
  incident_type: string;
  status: ReportStatus;
  priority: Priority;
  reporter: { id: string; username: string; avatar?: string } | string;
  reported_user?: { id: string; username: string; avatar?: string } | null;
  content_preview?: string;
  preview?: string;
  admin_notes?: string;
  resolution_action?: string | null;
  assigned_to?: { id: string; username: string; avatar?: string } | null;
  assigned_admin?: { id: string; username: string; avatar?: string } | null;
  created_at: string;
  updated_at?: string;
  immediate_risk?: boolean;
  description?: string;
}

interface Summary {
  submitted: number;
  under_review: number;
  resolved: number;
  declined: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const PAGE_SIZE = 15;

const STATUS_STYLES: Record<ReportStatus, string> = {
  submitted:
    "bg-gradient-to-br from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200",
  under_review:
    "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 border border-blue-200",
  resolved:
    "bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border border-green-200",
  declined:
    "bg-gradient-to-br from-gray-100 to-slate-50 text-gray-500 border border-gray-200",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-gradient-to-br from-gray-100 to-slate-50 text-gray-600 border border-gray-200",
  medium:
    "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 border border-blue-200",
  high: "bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 border border-orange-200",
  critical:
    "bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border border-red-200",
};

const INCIDENT_TYPES = [
  "Racial discrimination",
  "Gender-based harassment",
  "Sexual harassment",
  "Hostile work environment",
  "Retaliation",
  "Bullying",
  "Microaggressions",
  "Other",
];

function reporterName(r: ReportItem["reporter"]): string {
  return typeof r === "object" && r ? r.username : String(r ?? "");
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

function getStatusIcon(s: ReportStatus) {
  const cls = "w-3.5 h-3.5";
  if (s === "submitted") return <AlertTriangle className={cls} />;
  if (s === "under_review") return <Clock className={cls} />;
  if (s === "resolved") return <CheckCircle className={cls} />;
  return <Shield className={cls} />;
}

function getTypeIcon(t: string) {
  const cls = "w-4 h-4";
  const type = t?.toLowerCase() || "";

  if (type.includes("racial") || type.includes("discrimination"))
    return <Users className={`${cls} text-indigo-500`} />;
  if (type.includes("gender"))
    return <User className={`${cls} text-pink-500`} />;
  if (type.includes("sexual"))
    return <Shield className={`${cls} text-red-500`} />;
  if (type.includes("hostile") || type.includes("work environment"))
    return <AlertTriangle className={`${cls} text-orange-500`} />;
  if (type.includes("retaliation"))
    return <TrendingUp className={`${cls} text-purple-500`} />;
  if (type.includes("bullying"))
    return <MessageSquare className={`${cls} text-blue-500`} />;
  if (type.includes("microaggression"))
    return <FileText className={`${cls} text-teal-500`} />;

  return <AlertTriangle className={`${cls} text-gray-400`} />;
}

// SKELETON COMPONENTS

function SummaryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
      <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
      <div className="h-8 w-12 bg-gray-300 rounded"></div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="h-5 w-24 bg-gray-200 rounded"></div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="h-7 w-16 bg-gray-200 rounded-lg"></div>
      </td>
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 bg-gray-200 rounded"></div>
        <div className="h-3 w-16 bg-gray-200 rounded"></div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
        <div className="h-7 w-16 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

function DetailPanelSkeleton() {
  return (
    <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-pulse">
      <div className="p-5 border-b border-gray-100">
        <div className="h-3 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-5 w-40 bg-gray-300 rounded"></div>
      </div>
      <div className="p-5 space-y-5 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
          <div className="h-20 w-full bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-28 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
          <div className="h-24 w-full bg-gray-200 rounded-lg"></div>
        </div>
      </div>
      <div className="p-5 border-t border-gray-100">
        <div className="h-10 w-full bg-gray-300 rounded-lg"></div>
      </div>
    </div>
  );
}

// Sort Button Component
function SortButton({
  field,
  currentField,
  currentOrder,
  onSort,
  children,
}: {
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}) {
  const isActive = currentField === field;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-purple-700 transition-colors group"
    >
      {children}
      <div className="flex flex-col">
        {isActive && currentOrder === "asc" ? (
          <ArrowUp className="w-3 h-3 text-purple-600" />
        ) : isActive && currentOrder === "desc" ? (
          <ArrowDown className="w-3 h-3 text-purple-600" />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-purple-400" />
        )}
      </div>
    </button>
  );
}

// Export Modal Component
function ExportModal({
  isOpen,
  onClose,
  onExport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [includeFilters, setIncludeFilters] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Export Reports
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Choose your preferred export format. The file will include all reports
          matching your current filters.
        </p>

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

          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              checked={includeFilters}
              onChange={(e) => setIncludeFilters(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Include current filters
              </span>
              <p className="text-xs text-gray-500">
                Export only reports matching your current filters
              </p>
            </div>
          </label>
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
            Export as {selectedFormat.toUpperCase()}
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

// Filter Modal for Mobile
function FilterModal({
  isOpen,
  onClose,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  typeFilter,
  setTypeFilter,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
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
            Filter Reports
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
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">All Types</option>
              {INCIDENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
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
          <h3 className="text-lg font-semibold text-gray-900">Sort Reports</h3>
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
              <option value="created_at">Date</option>
              <option value="status">Status</option>
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

// Mobile Card View
function MobileReportCard({
  report,
  onSelect,
}: {
  report: ReportItem;
  onSelect: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {report.reference_number}
            </span>
            {report.immediate_risk && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium animate-pulse">
                Immediate Risk
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900">
            {report.incident_type}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_STYLES[report.priority]}`}
          >
            {report.priority}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span>{reporterName(report.reporter)}</span>
        </div>
        <span className="text-gray-300">•</span>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{formatRelativeTime(report.created_at)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[report.status]}`}
          >
            {getStatusIcon(report.status)} {report.status.replace("_", " ")}
          </span>
          {report.assigned_admin && (
            <span className="text-xs text-gray-500">
              Assigned: {report.assigned_admin.username}
            </span>
          )}
        </div>
        <button
          onClick={onSelect}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Review
        </button>
      </div>
    </div>
  );
}

// Detail Panel
function DetailPanel({
  report,
  onClose,
  onSaved,
}: {
  report: ReportItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [action, setAction] = useState(report.resolution_action ?? "");
  const [notes, setNotes] = useState(report.admin_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await UpdateReport(report.id, {
        status,
        resolution_action: action || null,
        admin_notes: notes,
      });
      showToast("Report updated", "success");
      onSaved();
    } catch (err: unknown) {
      showToast(getApiError(err, "Failed to update report"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign() {
    setAssigning(true);
    try {
      await AssignReport(report.id);
      showToast("Report assigned to you", "success");
      onSaved();
    } catch (err: unknown) {
      showToast(getApiError(err, "Failed to assign report"), "error");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-end bg-black/20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-gray-500 font-medium">
              {report.reference_number}
            </p>
            <h3 className="text-base font-bold text-gray-900 mt-0.5">
              {report.incident_type}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Reporter</p>
              <p className="text-sm font-semibold text-gray-800">
                {reporterName(report.reporter)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Reported User</p>
              <p className="text-sm font-semibold text-gray-800">
                {report.reported_user
                  ? typeof report.reported_user === "object"
                    ? report.reported_user.username
                    : String(report.reported_user)
                  : "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Priority</p>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${PRIORITY_STYLES[report.priority]}`}
              >
                {report.priority}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Submitted</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDate(report.created_at)}
              </p>
            </div>
          </div>

          {(report.content_preview || report.preview || report.description) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Content Preview
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 italic">
                "
                {report.content_preview ?? report.preview ?? report.description}
                "
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Assigned To
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-700 flex-1">
                {report.assigned_admin
                  ? report.assigned_admin.username
                  : "Unassigned"}
              </p>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-colors"
              >
                {assigning ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <UserCheck className="w-3 h-3" />
                )}{" "}
                Assign to Me
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReportStatus)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700"
            >
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
              Resolution Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700"
            >
              <option value="">No action taken</option>
              <option value="user_suspended">User Suspended</option>
              <option value="user_warned">User Warned</option>
              <option value="content_removed">Content Removed</option>
              <option value="content_hidden">Content Hidden</option>
              <option value="no_action">No Action</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
              Admin Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Internal notes about this report..."
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 resize-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [summary, setSummary] = useState<Summary>({
    submitted: 0,
    under_review: 0,
    resolved: 0,
    declined: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [exportedFormat, setExportedFormat] = useState<ExportFormat>("csv");
  const [exportDownloadUrl, setExportDownloadUrl] = useState("");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GetAdminReports({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        type: typeFilter || undefined,
        sortBy: sortField,
        sortOrder: sortOrder,
      });
      const d = res?.data ?? {};
      setItems(d.items ?? []);
      setSummary(
        d.summary ?? {
          submitted: 0,
          under_review: 0,
          resolved: 0,
          declined: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      );
      setTotal(res?.meta?.total ?? 0);
      setTotalPages(res?.meta?.total_pages ?? 1);
    } catch (err: unknown) {
      showToast(getApiError(err, "Failed to load reports"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, typeFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      const response = await ExportReports({
        format,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        type: typeFilter || undefined,
        sortBy: sortField,
        sortOrder,
      });

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

  const filteredItems = search
    ? items.filter(
        (r) =>
          r.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
          r.incident_type?.toLowerCase().includes(search.toLowerCase()) ||
          reporterName(r.reporter).toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const start = filteredItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const getSortDisplay = () => {
    const fieldMap = { created_at: "Date", status: "Status" };
    const orderMap = { asc: "Ascending", desc: "Descending" };
    return `${fieldMap[sortField]} (${orderMap[sortOrder]})`;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {selected && (
        <DetailPanel
          report={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            fetchReports();
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Reports Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
            {loading ? (
              <span className="h-4 w-16 bg-gray-200 rounded animate-pulse inline-block"></span>
            ) : (
              `${total.toLocaleString()} total reports`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={exporting || loading}
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

      {/* Summary Cards - With Skeleton Loading */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Submitted
              </p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">
                {summary.submitted}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Under Review
              </p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {summary.under_review}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Resolved
              </p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {summary.resolved}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Critical
              </p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {summary.critical}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by reference, type, or reporter..."
              disabled={loading}
              className="w-full pl-9 pr-4 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 transition-all disabled:opacity-50"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() =>
                  !loading && setShowSortDropdown(!showSortDropdown)
                }
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden lg:inline">
                  Sort: {getSortDisplay()}
                </span>
                <span className="lg:hidden">Sort</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showSortDropdown && !loading && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Sort By
                  </div>
                  <button
                    onClick={() => {
                      handleSort("created_at");
                      setShowSortDropdown(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-purple-50 transition-colors ${
                      sortField === "created_at"
                        ? "text-purple-700 bg-purple-50"
                        : "text-gray-700"
                    }`}
                  >
                    <span>Date</span>
                    {sortField === "created_at" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      ))}
                  </button>
                  <button
                    onClick={() => {
                      handleSort("status");
                      setShowSortDropdown(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-purple-50 transition-colors ${
                      sortField === "status"
                        ? "text-purple-700 bg-purple-50"
                        : "text-gray-700"
                    }`}
                  >
                    <span>Status</span>
                    {sortField === "status" &&
                      (sortOrder === "asc" ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      ))}
                  </button>

                  <div className="border-t border-gray-100 my-2"></div>

                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Order
                  </div>
                  <button
                    onClick={() => {
                      setSortOrder("asc");
                      setPage(1);
                      setShowSortDropdown(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-purple-50 transition-colors ${
                      sortOrder === "asc"
                        ? "text-purple-700 bg-purple-50"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ArrowUp className="w-4 h-4" /> Ascending
                    </span>
                    {sortOrder === "asc" && <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setSortOrder("desc");
                      setPage(1);
                      setShowSortDropdown(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-purple-50 transition-colors ${
                      sortOrder === "desc"
                        ? "text-purple-700 bg-purple-50"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ArrowDown className="w-4 h-4" /> Descending
                    </span>
                    {sortOrder === "desc" && <Check className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              disabled={loading}
              className="px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[130px] appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="declined">Declined</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              disabled={loading}
              className="px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[120px] appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              disabled={loading}
              className="px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 min-w-[180px] appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">All Types</option>
              {INCIDENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Filter & Sort Buttons */}
          <div className="sm:hidden flex gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(statusFilter || priorityFilter || typeFilter) && (
                <span className="bg-white text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {(statusFilter ? 1 : 0) +
                    (priorityFilter ? 1 : 0) +
                    (typeFilter ? 1 : 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowMobileSort(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-lg disabled:opacity-50"
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

      {/* Mobile Filters Modal */}
      <FilterModal
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
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

      {/* Desktop Table - With Skeleton Loading */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <th className="px-5 py-4 text-left">
                  <SortButton
                    field="created_at"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Reference
                  </SortButton>
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Type
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Reporter
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Priority
                </th>
                <th className="px-5 py-4 text-left">
                  <SortButton
                    field="status"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Status
                  </SortButton>
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Assigned
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Date
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                // SKELETON LOADING STATE
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      No reports match the current filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {report.reference_number}
                      </span>
                      {report.immediate_risk && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium animate-pulse">
                          Risk
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(report.incident_type)}
                        <span className="text-sm text-gray-700">
                          {report.incident_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                      {reporterName(report.reporter)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold capitalize ${PRIORITY_STYLES[report.priority]}`}
                      >
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[report.status]}`}
                      >
                        {getStatusIcon(report.status)}{" "}
                        {report.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.assigned_admin ? (
                        report.assigned_admin.username
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatRelativeTime(report.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelected(report)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
          <p className="text-sm text-gray-500">
            {loading ? (
              <span className="h-4 w-32 bg-gray-200 rounded animate-pulse inline-block"></span>
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {start}–{end}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {total.toLocaleString()}
                </span>{" "}
                reports
              </>
            )}
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
              {loading ? (
                <span className="h-4 w-16 bg-gray-200 rounded animate-pulse inline-block"></span>
              ) : (
                `Page ${page} of ${totalPages}`
              )}
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

      {/* Mobile Card View - With Skeleton Loading */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          // SKELETON LOADING STATE
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <MobileCardSkeleton key={i} />
            ))}
          </>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl shadow-sm">
            <Flag className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              No reports match the current filters.
            </p>
          </div>
        ) : (
          <>
            {filteredItems.map((report) => (
              <MobileReportCard
                key={report.id}
                report={report}
                onSelect={() => setSelected(report)}
              />
            ))}

            {/* Mobile Pagination */}
            <div className="flex flex-col items-center gap-3 pt-4">
              <p className="text-sm text-gray-500">
                {loading ? (
                  <span className="h-4 w-32 bg-gray-200 rounded animate-pulse inline-block"></span>
                ) : (
                  `Showing ${start}–${end} of ${total.toLocaleString()}`
                )}
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
                  {loading ? (
                    <span className="h-4 w-12 bg-gray-200 rounded animate-pulse inline-block"></span>
                  ) : (
                    `${page} / ${totalPages}`
                  )}
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
