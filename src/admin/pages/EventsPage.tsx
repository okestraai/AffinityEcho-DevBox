import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Flag } from "lucide-react";
import { DismissEventReports, GetAdminEvents, RemoveAdminEvent, StopEventHost, type AdminEvent } from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";

type Filter = "all" | "reported" | "removed";

// Events for moderators: reports, removal and stopping hosts.
export function EventsPage() {
  const [filter, setFilter] = useState<Filter>("reported");
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GetAdminEvents({
        limit: 50,
        ...(filter === "reported" ? { reported: "true" } : {}),
        ...(filter === "removed" ? { status: "removed" } : {}),
      });
      setEvents(res.data ?? []);
    } catch (err) {
      showToast(getApiError(err, "Couldn't load events"), "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      showToast(done, "success");
      load();
    } catch (err) {
      showToast(getApiError(err, "That didn't work"), "error");
    }
  };

  const askReason = (what: string) => {
    const reason = window.prompt(`Reason to ${what} (shown in the audit log)`);
    return reason && reason.trim().length >= 3 ? reason.trim() : null;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-5">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2"><CalendarDays className="w-6 h-6" /> Events</h1>
      <div role="tablist" className="flex gap-2">
        {(["reported", "all", "removed"] as Filter[]).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium min-h-[40px] ${filter === f ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-700"}`}>
            {f === "reported" ? "Reported" : f === "all" ? "All" : "Removed"}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">No events here.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/events/${e.slug}`} className="font-semibold text-gray-900 hover:text-purple-700">{e.title}</Link>
                  <p className="text-sm text-gray-600">
                    {new Date(e.starts_at).toLocaleString()} · {e.mode}{e.venue_city ? ` · ${e.venue_city}` : ""} · by {e.organiser_name}
                  </p>
                  <p className="text-xs text-gray-500">Status: {e.status}{e.removed_reason ? ` (${e.removed_reason})` : ""}</p>
                </div>
                {e.status !== "removed" && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="px-3 py-2 text-sm rounded-xl border border-red-300 text-red-700 min-h-[40px]"
                      onClick={() => { const r = askReason("remove this event"); if (r) act(() => RemoveAdminEvent(e.id, r), "Event removed. Guests are told."); }}>
                      Remove
                    </button>
                    {e.reports.length > 0 && (
                      <button type="button" className="px-3 py-2 text-sm rounded-xl border border-gray-300 min-h-[40px]"
                        onClick={() => act(() => DismissEventReports(e.id), "Reports dismissed")}>
                        Dismiss reports
                      </button>
                    )}
                    <button type="button" className="px-3 py-2 text-sm rounded-xl border border-gray-300 min-h-[40px]"
                      onClick={() => { const r = askReason("stop this host"); if (r) act(() => StopEventHost(e.host_id, r), "Host stopped"); }}>
                      Stop host
                    </button>
                  </div>
                )}
              </div>
              {e.reports.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {e.reports.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><Flag className="w-4 h-4 text-red-500 mt-0.5" />{r.reason}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
