// SafetyTicketsPage — admin view of coaching safety tickets (harm to self/others).
// These are logged automatically when the Coach safety layer routes a session to
// crisis. Each ticket holds the user's handle and the full session transcript.
import { useCallback, useEffect, useState } from "react";
import {
  ShieldAlert,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
} from "lucide-react";
import {
  GetCoachingSupportTickets,
  CoachingSupportTicket,
  GetCoachingSafetyEvals,
  CoachingSafetyEvals,
} from "../../../api/adminApis";

function categoryStyle(cat: string) {
  switch (cat) {
    case "SELF_HARM":
    case "CRISIS":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "THREAT":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
}

function categoryLabel(cat: string) {
  if (cat === "SELF_HARM") return "Harm to self";
  if (cat === "THREAT") return "Harm to others";
  if (cat === "CRISIS") return "Crisis";
  return cat;
}

function timeAgo(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function SafetyTicketsPage() {
  const [tickets, setTickets] = useState<CoachingSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [evals, setEvals] = useState<CoachingSafetyEvals | null>(null);
  const [showEvals, setShowEvals] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, ev] = await Promise.all([
        GetCoachingSupportTickets(),
        GetCoachingSafetyEvals().catch(() => null),
      ]);
      setTickets(Array.isArray(data) ? data : []);
      setEvals(ev);
    } catch {
      setError("Could not load safety tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Safety Tickets</h1>
            <p className="text-sm text-gray-500">
              Coach sessions flagged for harm to self or others. Handle with care
              and follow your safeguarding protocol.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Classifier health — disagreements between the regex floor and the LLM classifier */}
      {evals && (
        <div className="mb-5 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold text-gray-800">
                Classifier health
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  evals.counts.classifier_miss > 0
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {evals.counts.classifier_miss} classifier miss
                {evals.counts.classifier_miss === 1 ? "" : "es"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {evals.counts.regex_gap} classifier-only catch
                {evals.counts.regex_gap === 1 ? "" : "es"}
              </span>
            </div>
            {evals.items.length > 0 && (
              <button
                type="button"
                onClick={() => setShowEvals((v) => !v)}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                {showEvals ? "Hide" : "View"} recent
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            “Classifier miss” = the regex floor caught risk the classifier did
            not (investigate). “Classifier-only catch” = the classifier caught
            nuanced risk the regex can’t — both layers working together.
          </p>
          {showEvals && (
            <div className="mt-3 space-y-1.5">
              {evals.items.map((it, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2"
                >
                  <span
                    className={`shrink-0 font-semibold px-1.5 py-0.5 rounded ${
                      it.kind === "classifier_miss"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {it.kind === "classifier_miss" ? "MISS" : "GAP"}
                  </span>
                  <span className="text-gray-400 shrink-0">
                    cls:{it.classifierCategory ?? "—"}/
                    {it.classifierSeverity ?? "—"}
                  </span>
                  <span className="text-gray-700 break-words">
                    {it.message ?? "(no message)"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <ShieldAlert className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">No safety tickets</p>
          <p className="text-gray-400 text-sm">
            Tickets appear here automatically when a session is routed to crisis.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const open = expanded === t.reference;
            return (
              <div
                key={t.reference}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : t.reference)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
                >
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle(t.category)}`}
                  >
                    {categoryLabel(t.category)}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                    {t.severity}
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    {t.reference}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-700 font-medium">
                    <User className="w-3.5 h-3.5 text-gray-400" />@
                    {t.handle ?? "unknown"}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {timeAgo(t.createdAt)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      t.status === "open"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {t.status}
                  </span>
                  {open ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {open && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      Session transcript
                    </p>
                    <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 font-sans leading-6">
                      {t.transcript || "(no transcript)"}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
