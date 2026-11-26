import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, Copy, CheckCircle2, Pencil, XCircle } from "lucide-react";
import {
  CancelEvent,
  CheckInGuest,
  DownloadGuestCsv,
  GetHostPage,
} from "../../../api/eventApis";
import { eventWhen } from "../../utils/eventTime";
import { showToast } from "../../Helper/ShowToast";

type Page = Awaited<ReturnType<typeof GetHostPage>>;

const shareBase = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) || window.location.origin;

// The host's page: link opens and registrations, the guest list, check-in and the CSV.
export function HostPage() {
  const { eventId = "" } = useParams();
  const [page, setPage] = useState<Page | null>(null);
  const [code, setCode] = useState("");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);

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

  if (!page) return <main className="max-w-3xl mx-auto px-4 py-10 text-gray-500">Loading…</main>;
  const { event, stats, guests } = page;
  const link = `${shareBase.replace(/\/$/, "")}/events/${event.slug}`;
  const active = guests.filter((g) => g.status === "registered");
  const shown = active.filter((g) => g.name.toLowerCase().includes(filter.trim().toLowerCase()));
  const when = eventWhen(event.startsAt, event.endsAt, event.timeZone);

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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast("Link copied.", "success");
    } catch {
      showToast(link, "info");
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-5">
      <div>
        <Link to="/events" className="text-sm text-gray-600 underline">My Events</Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{event.title}</h1>
        <p className="text-gray-600">{when.local}</p>
        {event.status === "cancelled" && <p className="mt-2 text-red-700 font-medium">Cancelled</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white min-h-[44px]"><Copy className="w-4 h-4" /> Copy share link</button>
        <Link to={`/events/${event.slug}`} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white min-h-[44px]">View public page</Link>
        {event.status === "published" && (
          <>
            <Link to={`/events/manage/${event.id}/edit`} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white min-h-[44px]"><Pencil className="w-4 h-4" /> Edit</Link>
            <button type="button" onClick={cancel} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-300 text-red-700 bg-white min-h-[44px]"><XCircle className="w-4 h-4" /> Cancel event</button>
          </>
        )}
      </div>

      <section aria-label="Numbers" className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ["Link opens", stats.linkOpens],
          ["Registered", stats.registered],
          ["In person", stats.inPerson],
          ["Online", stats.online],
          ["Checked in", stats.checkedIn],
        ].map(([label, n]) => (
          <div key={label as string} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{n}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </section>

      {event.mode !== "virtual" && (
        <section className="bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Check in</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) checkIn({ code: code.trim() }); }} className="flex gap-2">
            <label htmlFor="checkin-code" className="sr-only">Check-in code</label>
            <input id="checkin-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12}
              placeholder="Code from the guest's QR or email" className="flex-1 px-3 py-2 border border-gray-300 rounded-xl tracking-widest min-h-[44px]" />
            <button type="submit" disabled={busy || !code.trim()} className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50 min-h-[44px]">Check in</button>
          </form>
        </section>
      )}

      <section className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold text-gray-900">Guests ({active.length})</h2>
          <button type="button" onClick={download} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-gray-300 min-h-[44px]"><Download className="w-4 h-4" /> CSV</button>
        </div>
        <label htmlFor="guest-filter" className="sr-only">Find a guest</label>
        <input id="guest-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a guest by name"
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-xl min-h-[44px]" />
        {shown.length === 0 ? (
          <p className="text-sm text-gray-500">No guests yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {shown.map((g) => (
              <li key={g.registrationId} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{g.name}</p>
                  <p className="text-xs text-gray-500">
                    {g.attendance === "in_person" ? "In person" : "Online"}
                    {g.email ? ` · ${g.email}` : " · email not shared"}
                  </p>
                </div>
                {g.attendance === "in_person" && (g.checkedInAt ? (
                  <span className="flex items-center gap-1 text-sm text-green-700"><CheckCircle2 className="w-4 h-4" /> Checked in</span>
                ) : (
                  <button type="button" onClick={() => checkIn({ registrationId: g.registrationId })} disabled={busy}
                    className="text-sm px-3 py-2 rounded-xl border border-gray-300 min-h-[44px]">Check in</button>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
