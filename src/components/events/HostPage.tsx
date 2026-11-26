import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  MapPin,
  MonitorPlay,
  Pencil,
  ScanLine,
  Search,
  UserCheck,
  Users,
  XCircle,
  Trash2,
} from "lucide-react";
import { CancelEvent, CheckInGuest, DeleteEvent, DownloadGuestCsv, GetHostPage } from "../../../api/eventApis";
import { eventWhen } from "../../utils/eventTime";
import { showToast } from "../../Helper/ShowToast";
import { Card, DateTile, ModeBadge, StatusBadge, dangerButton, inputClass, primaryButton, secondaryButton } from "./parts";

type Page = Awaited<ReturnType<typeof GetHostPage>>;

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

// The host's page: link opens and registrations, check-in, the guest list and the CSV.
export function HostPage() {
  const { eventId = "" } = useParams();
  const [page, setPage] = useState<Page | null>(null);
  const [code, setCode] = useState("");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setPage(await GetHostPage(eventId));
    } catch {
      showToast("Couldn't load your event.", "error");
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!page) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse" aria-label="Loading">
        <div className="h-32 rounded-2xl bg-slate-200" />
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-200" />)}</div>
      </div>
    );
  }
  const { event, stats, guests } = page;
  const link = `${window.location.origin}/events/${event.slug}`;
  const active = guests.filter((g) => g.status === "registered");
  const shown = active.filter((g) => g.name.toLowerCase().includes(filter.trim().toLowerCase()));
  const when = eventWhen(event.startsAt, event.endsAt, event.timeZone);
  const ended = new Date(event.endsAt).getTime() < Date.now();

  const checkIn = async (payload: { code?: string; registrationId?: string }) => {
    setBusy(true);
    try {
      const res = await CheckInGuest(eventId, payload);
      showToast(res.alreadyCheckedIn ? `${res.name} was already checked in.` : `${res.name} is checked in.`, "success");
      setCode("");
      load();
    } catch {
      showToast("No guest with that code.", "error");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    try {
      const blob = await DownloadGuestCsv(eventId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.slug}-guests.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Couldn't download the guest list.", "error");
    }
  };

  const cancel = async () => {
    if (!window.confirm("Cancel this event? Every guest is told by email and in the app.")) return;
    try {
      await CancelEvent(eventId);
      showToast("Event cancelled. Guests are being told.", "success");
      load();
    } catch {
      showToast("Couldn't cancel the event.", "error");
    }
  };

  const remove = async () => {
    const warn = page && page.stats.registered > 0 && page.event.status === "published"
      ? "Delete this event? It disappears for everyone, and the guests still coming are told it's off."
      : "Delete this event? It disappears for everyone.";
    if (!window.confirm(warn)) return;
    try {
      await DeleteEvent(eventId);
      showToast("Event deleted.", "success");
      navigate("/events", { replace: true });
    } catch {
      showToast("Couldn't delete the event.", "error");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast("Link copied.", "success");
    } catch {
      showToast(link, "info");
    }
  };

  const statCards = [
    { label: "Link opens", value: stats.linkOpens, icon: <Eye className="w-4 h-4" /> },
    { label: "Registered", value: stats.registered, icon: <Users className="w-4 h-4" /> },
    { label: "In person", value: stats.inPerson, icon: <MapPin className="w-4 h-4" /> },
    { label: "Online", value: stats.online, icon: <MonitorPlay className="w-4 h-4" /> },
    { label: "Checked in", value: stats.checkedIn, icon: <UserCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/events" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4 min-h-[40px]">
        <ArrowLeft className="w-4 h-4" /> My Events
      </Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <DateTile iso={event.startsAt} timeZone={event.timeZone} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-600">Host page</span>
              <StatusBadge status={event.status} ended={ended} />
              <ModeBadge mode={event.mode} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{event.title}</h1>
            <p className="mt-1 text-slate-600">{when.local}</p>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap gap-2">
          <button type="button" onClick={copy} className={secondaryButton}><Copy className="w-4 h-4" /> Copy share link</button>
          <Link to={`/events/${event.slug}`} className={secondaryButton}><Eye className="w-4 h-4" /> Public page</Link>
          {event.status === "published" && (
            <>
              <Link to={`/events/manage/${event.id}/edit`} className={secondaryButton}><Pencil className="w-4 h-4" /> Edit</Link>
              <button type="button" onClick={cancel} className={dangerButton}><XCircle className="w-4 h-4" /> Cancel event</button>
            </>
          )}
          <button type="button" onClick={remove} className={dangerButton}><Trash2 className="w-4 h-4" /> Delete</button>
        </div>
      </Card>

      <section aria-label="Numbers" className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">{s.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900 tabular-nums">{s.value}</p>
          </Card>
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
        {event.mode !== "virtual" ? (
          <Card className="p-5 lg:sticky lg:top-4">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><ScanLine className="w-5 h-5 text-purple-600" /> Check in</h2>
            <p className="mt-1 text-sm text-slate-600">Type the code from the guest's QR or email, or tap Check in next to their name.</p>
            <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) checkIn({ code: code.trim() }); }} className="mt-4 space-y-3">
              <label htmlFor="checkin-code" className="sr-only">Check-in code</label>
              <input id="checkin-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12}
                placeholder="e.g. ABCD2345" className={`${inputClass} text-center text-lg tracking-[0.3em] font-semibold`} />
              <button type="submit" disabled={busy || !code.trim()} className={`${primaryButton} w-full`}>Check in</button>
            </form>
            <div className="mt-5">
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                <span>Checked in</span>
                <span className="tabular-nums">{stats.checkedIn} of {stats.inPerson}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                  style={{ width: `${stats.inPerson ? Math.round((stats.checkedIn / stats.inPerson) * 100) : 0}%` }} />
              </div>
            </div>
          </Card>
        ) : <div className="hidden lg:block" />}

        <Card className="overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <h2 className="font-semibold text-slate-900">Guests <span className="text-slate-400 font-normal">({active.length})</span></h2>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <label htmlFor="guest-filter" className="sr-only">Find a guest</label>
                <input id="guest-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a guest"
                  className={`${inputClass} pl-9`} />
              </div>
              <button type="button" onClick={download} className={secondaryButton}><Download className="w-4 h-4" /> CSV</button>
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">{active.length ? "No guest matches that name." : "No guests yet. Share the link to get started."}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {shown.map((g) => (
                <li key={g.registrationId} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {initials(g.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{g.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {g.attendance === "in_person" ? "In person" : "Online"} · {g.email ?? "email not shared"}
                    </p>
                  </div>
                  {g.attendance === "in_person" && (g.checkedInAt ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> In
                    </span>
                  ) : (
                    <button type="button" onClick={() => checkIn({ registrationId: g.registrationId })} disabled={busy}
                      className="text-sm font-semibold text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-50 min-h-[40px]">
                      Check in
                    </button>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
