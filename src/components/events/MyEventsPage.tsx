import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CalendarDays } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  CancelRegistration,
  EventSummary,
  GetEventForMember,
  GetMyEvents,
  SetEmailSharing,
} from "../../../api/eventApis";
import { eventWhen, modeLabel } from "../../utils/eventTime";
import { rememberReturnTo } from "../../utils/returnTo";
import { showToast } from "../../Helper/ShowToast";

type Tab = "active" | "past" | "hosting";

// My Events: events I'm registered for (active and past) and events I host.
export function MyEventsPage() {
  const { hasCompletedOnboarding } = useAuth();
  const [tab, setTab] = useState<Tab>("active");
  const [data, setData] = useState<Awaited<ReturnType<typeof GetMyEvents>> | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await GetMyEvents());
    } catch {
      showToast("Couldn't load your events.", "error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const list: EventSummary[] = !data
    ? []
    : tab === "hosting"
      ? data.hosting
      : data.registered[tab];

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Events</h1>
        {hasCompletedOnboarding && (
          <Link to="/events/new" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold min-h-[44px]">
            <Plus className="w-4 h-4" /> Host an event
          </Link>
        )}
      </div>

      {!hasCompletedOnboarding && (
        <div className="mb-6 p-4 rounded-xl bg-purple-50 border border-purple-200 text-sm text-purple-900">
          You can use events now. To join forums, Nooks and the feed, {" "}
          <Link to="/onboarding" onClick={() => rememberReturnTo("/events")} className="underline font-semibold">finish setting up your profile</Link>.
        </div>
      )}

      <div role="tablist" aria-label="My Events" className="flex gap-2 mb-4">
        {(["active", "past", "hosting"] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium min-h-[44px] ${tab === t ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-700"}`}>
            {t === "active" ? "Registered" : t === "past" ? "Past" : "Hosting"}
          </button>
        ))}
      </div>

      {!data ? (
        <p className="text-gray-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">
          {tab === "hosting" ? "You aren't hosting any events." : "No events here yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((e) => (
            <EventRow key={e.id} event={e} hosting={tab === "hosting"} editable={tab === "active"} onChange={load} />
          ))}
        </ul>
      )}
    </main>
  );
}

function EventRow({ event, hosting, editable, onChange }: { event: EventSummary; hosting: boolean; editable: boolean; onChange: () => void }) {
  const [sharing, setSharing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const when = eventWhen(event.startsAt, event.endsAt, event.timeZone);

  // The sharing choice is read only when the guest opens the row's settings.
  const openSettings = async () => {
    try {
      const full = await GetEventForMember(event.slug);
      setSharing(full.registration?.shareEmail ?? false);
    } catch {
      showToast("Couldn't load your registration.", "error");
    }
  };

  const toggleSharing = async (value: boolean) => {
    setBusy(true);
    try {
      const res = await SetEmailSharing(event.slug, value);
      setSharing(res?.shareEmail ?? value);
    } catch {
      showToast("Couldn't change email sharing.", "error");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Cancel your registration for this event?")) return;
    setBusy(true);
    try {
      await CancelRegistration(event.slug);
      showToast("Registration cancelled.", "success");
      onChange();
    } catch {
      showToast("Couldn't cancel. Try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <CalendarDays className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <Link to={hosting ? `/events/manage/${event.id}` : `/events/${event.slug}`} className="font-semibold text-gray-900 hover:text-purple-700">
            {event.title}
          </Link>
          <p className="text-sm text-gray-600">{when.local}</p>
          <p className="text-xs text-gray-500">
            {modeLabel[event.mode]}
            {event.attendance && ` · you're attending ${event.attendance === "in_person" ? "in person" : "online"}`}
            {event.status === "cancelled" && " · cancelled"}
          </p>
        </div>
      </div>
      {editable && !hosting && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {sharing === null ? (
            <button type="button" onClick={openSettings} className="text-purple-700 underline min-h-[44px]">Email sharing</button>
          ) : (
            <label className="flex items-center gap-2 min-h-[44px]">
              <input type="checkbox" checked={sharing} disabled={busy} onChange={(e) => toggleSharing(e.target.checked)} className="w-4 h-4" />
              Share my email with the host
            </label>
          )}
          <button type="button" onClick={cancel} disabled={busy} className="text-red-600 underline min-h-[44px]">Cancel registration</button>
        </div>
      )}
    </li>
  );
}
