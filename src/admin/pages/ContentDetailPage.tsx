// src/admin/pages/ContentDetailPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Hash,
  User,
  Calendar,
  Flag,
  Shield,
  EyeOff,
  Eye,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  GetAdminContentById,
  HideContent,
  RestoreContent,
  RemoveContent,
} from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { MSG } from '../../constants/messages';

type ContentType =
  | "feed_post"
  | "feed_comment"
  | "forum_topic"
  | "forum_comment"
  | "nook"
  | "nook_message";

const TYPE_CONFIG: Record<
  string,
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

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  visible: {
    label: "Visible",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  hidden: {
    label: "Hidden",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  removed: {
    label: "Removed",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActionReasonModal({
  title,
  onClose,
  onConfirm,
  confirmLabel,
  confirmClass,
}: {
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  confirmLabel: string;
  confirmClass: string;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Enter reason..."
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason || "No reason provided")}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-lg ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ContentDetailPage() {
  const { contentType = "", contentId = "" } = useParams<{
    contentType: string;
    contentId: string;
  }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<
    "hide" | "restore" | "remove" | null
  >(null);
  const [acting, setActing] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!contentType || !contentId || contentType === "undefined") {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await GetAdminContentById(contentType, contentId);
      // API returns the content object directly in data (not nested under data.item)
      const d = res?.data ?? res ?? {};
      setItem(Object.keys(d).length ? d : null);
      setHistory(d.moderation_history ?? []);
      setReports(d.reports ?? []);
    } catch {
      showToast(MSG.ADMIN.CONTENT_DETAIL_FAILED, "error");
    } finally {
      setLoading(false);
    }
  }, [contentType, contentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleAction(reason: string) {
    if (!actionModal) return;
    setActing(true);
    try {
      if (actionModal === "hide")
        await HideContent(contentType, contentId, { reason });
      else if (actionModal === "restore")
        await RestoreContent(contentType, contentId, { reason });
      else await RemoveContent(contentType, contentId, { reason });
      showToast(
        actionModal === "hide"
          ? MSG.ADMIN.CONTENT_HIDDEN
          : actionModal === "restore"
            ? MSG.ADMIN.CONTENT_RESTORED
            : MSG.ADMIN.CONTENT_REMOVED,
        "success",
      );
      setActionModal(null);
      fetchDetail();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : MSG.ADMIN.ACTION_FAILED;
      showToast(msg, "error");
    } finally {
      setActing(false);
    }
  }

  const typeConfig = TYPE_CONFIG[contentType] ?? {
    icon: <FileText className="w-4 h-4" />,
    label: contentType || "Content",
    color: "text-gray-600",
    bg: "bg-gray-100",
  };

  const status = String(
    (item?.moderation_status as string) ?? (item?.status as string) ?? "visible",
  );
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.visible;
  const authorObj = item?.author as Record<string, unknown> | null;
  const authorName =
    typeof item?.author === "string"
      ? item.author
      : (authorObj?.username as string) ?? "Unknown";
  const bodyText =
    (item?.body as string) ??
    (item?.text as string) ??
    (item?.content as string) ??
    "";
  const title = item?.title as string | undefined;
  const createdAt = item?.created_at as string | undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!item || contentType === "undefined") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Content not found or invalid type.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-5 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Modals */}
      {actionModal && (
        <ActionReasonModal
          title={
            actionModal === "hide"
              ? "Hide Content"
              : actionModal === "restore"
                ? "Restore Content"
                : "Remove Content"
          }
          confirmLabel={
            actionModal === "hide"
              ? "Hide"
              : actionModal === "restore"
                ? "Restore"
                : "Remove"
          }
          confirmClass={
            actionModal === "remove"
              ? "bg-red-600 hover:bg-red-700"
              : actionModal === "hide"
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          }
          onClose={() => setActionModal(null)}
          onConfirm={handleAction}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-all shadow-sm"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span
            className="hover:text-gray-600 cursor-pointer transition-colors"
            onClick={() => navigate("/admin/moderation")}
          >
            Moderation
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-700 font-medium">Content Detail</span>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl ${typeConfig.bg} flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}
            >
              {typeConfig.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {typeConfig.label}
              </p>
              <p className="text-xs text-gray-400 font-mono">{contentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}
            >
              {statusConfig.label}
            </span>
            {!acting && (
              <>
                {status !== "hidden" && status !== "removed" && (
                  <button
                    type="button"
                    onClick={() => setActionModal("hide")}
                    title="Hide content"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Hide
                  </button>
                )}
                {status === "hidden" && (
                  <button
                    type="button"
                    onClick={() => setActionModal("restore")}
                    title="Restore content"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Restore
                  </button>
                )}
                {status !== "removed" && (
                  <button
                    type="button"
                    onClick={() => setActionModal("remove")}
                    title="Remove content"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </>
            )}
            {acting && <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />}
          </div>
        </div>

        {/* Meta */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{authorName}</span>
          </div>
          {createdAt && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDate(createdAt)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Flag className="w-4 h-4 text-gray-400" />
            <span>
              {(item?.reports_count as number) ?? reports.length} report
              {((item?.reports_count as number) ?? reports.length) !== 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {title && (
            <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
          )}
          {bodyText ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {bodyText}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">No content body available.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Reports */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-gray-900">
              Reports ({reports.length})
            </h3>
          </div>
          {reports.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No reports filed.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {reports.map((r, i) => {
                const reporter = r.reporter as Record<string, unknown> | null;
                return (
                  <div key={i} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">
                          {typeof r.reporter === "string"
                            ? r.reporter
                            : (reporter?.username as string) ?? "User"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {(r.reason as string) ?? (r.type as string) ?? "—"}
                        </p>
                        {r.description && (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            {r.description as string}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {r.created_at
                          ? formatDate(r.created_at as string)
                          : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Moderation History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-900">
              Moderation History ({history.length})
            </h3>
          </div>
          {history.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No moderation actions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map((h, i) => {
                const admin = h.admin as Record<string, unknown> | null;
                return (
                  <div key={i} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-700 capitalize">
                            {(h.action as string)?.replace("_", " ") ?? "Action"}
                          </span>
                          <span className="text-xs text-gray-400">by</span>
                          <span className="text-xs font-medium text-purple-700">
                            {typeof h.admin === "string"
                              ? h.admin
                              : (admin?.username as string) ?? "Admin"}
                          </span>
                        </div>
                        {h.reason && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {h.reason as string}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {h.created_at
                          ? formatDate(h.created_at as string)
                          : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
