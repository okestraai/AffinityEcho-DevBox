import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CalendarDays, MapPin, MonitorPlay, ChevronRight, Sparkles, XCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  CancelRegistration,
  EventSummary,
  GetMyEvents,
  SetEmailSharing,
} from "../../../api/eventApis";
import { eventWhen } from "../../utils/eventTime";
import { rememberReturnTo } from "../../utils/returnTo";
import { showToast } from "../../Helper/ShowToast";
import { Card, DateTile, ModeBadge, PageHeading, ShareEmailButton, StatusBadge, primaryButton } from "./parts";

type Tab = "active" | "past" | "hosting";
const TABS: { id: Tab; label: string }[] = [
  { id: "active", label: "Registered" },
  { id: "past", label: "Past" },
  { id: "hosting", label: "Hosting" },
];

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

  const list: EventSummary[] = !data ? [] : tab === "hosting" ? data.hosting : data.registered[tab];
  const count = (t: Tab) => (!data ? 0 : t === "hosting" ? data.hosting.length : data.registered[t].length);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeading
        eyebrow="Events"
        title="My Events"
        subtitle="Events you're going to, and the ones you host."
        actions={
          hasCompletedOnboarding ? (
            <Link to="/events/new" className={primaryButton}>
              <Plus className="w-4 h-4" /> Host an event
            </Link>
          ) : undefined
        }
      />

      {!hasCompletedOnboarding && (
        <Card className="mb-6 p-4 sm:p-5 flex items-start gap-3 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-700">
            Your events work now. To join forums, Nooks and the feed,{" "}
            <Link to="/onboarding" onClick={() => rememberReturnTo("/events")} className="font-semibold text-purple-700 hover:underline">
              finish setting up your profile
            </Link>
            .
          </p>
        </Card>
      )}

      <div role="tablist" aria-label="My Events" className="inline-flex p-1 mb-6 rounded-xl bg-white border border-slate-200 shadow-sm">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[40px] ${tab === t.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            {t.label}
            {data && <span className={`text-xs px-1.5 rounded-full ${tab === t.id ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{count(t.id)}</span>}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="space-y-3" aria-label="Loading events">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-200/70 animate-pulse" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState tab={tab} canHost={hasCompletedOnboarding} />
      ) : (
        <ul className="space-y-3">
          {list.map((e) => (
            <EventRow key={e.id} event={e} hosting={tab === "hosting"} editable={tab === "active"} onChange={load} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ tab, canHost }: { tab: Tab; canHost: boolean }) {
  const text =
    tab === "hosting"
      ? "You aren't hosting any events yet."
      : tab === "past"
        ? "Events you went to will show here."
        : "When you register for an event, it shows here.";
  return (
    <Card className="p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
        <CalendarDays className="w-7 h-7" />
      </div>
      <p className="text-slate-700 font-medium">{text}</p>
      {tab === "hosting" && canHost && (
        <Link to="/events/new" className={`${primaryButton} mt-5`}>
          <Plus className="w-4 h-4" /> Host your first event
        </Link>
      )}
    </Card>
  );
}

function EventRow({ event, hosting, editable, onChange }: { event: EventSummary; hosting: boolean; editable: boolean; onChange: () => void }) {
  const [sharing, setSharing] = useState<boolean>(!!event.shareEmail);
  const [busy, setBusy] = useState(false);
  const when = eventWhen(event.startsAt, event.endsAt, event.timeZone);
  const ended = new Date(event.endsAt).getTime() < Date.now();
  const href = hosting ? `/events/manage/${event.id}` : `/events/${event.slug}`;

  const toggleSharing = async (value: boolean) => {
    setBusy(true);
    try {
      const res = await SetEmailSharing(event.slug, value);
      setSharing(res?.shareEmail ?? value);
      showToast(value ? "The host can now see your email." : "The host no longer sees your email.", "success");
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
    <li>
      <Card className="group hover:shadow-md hover:border-slate-300 transition-all">
        <Link to={href} className="flex items-center gap-4 p-4 sm:p-5">
          <DateTile iso={event.startsAt} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 group-hover:text-purple-700 truncate">{event.title}</h3>
              {(event.status !== "published" || ended) && <StatusBadge status={event.status} ended={ended} />}
            </div>
            <p className="text-sm text-slate-600 truncate">{when.local}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <ModeBadge mode={event.mode} />
              {event.venueCity && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.venueCity}</span>}
              {event.attendance && (
                <span className="inline-flex items-center gap-1">
                  {event.attendance === "in_person" ? <MapPin className="w-3.5 h-3.5" /> : <MonitorPlay className="w-3.5 h-3.5" />}
                  You're going {event.attendance === "in_person" ? "in person" : "online"}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 flex-shrink-0" />
        </Link>
        {editable && !hosting && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-5 py-3 border-t border-slate-100 text-sm">
            <ShareEmailButton size="sm" shared={sharing} disabled={busy} onToggle={() => toggleSharing(!sharing)} />
            <button type="button" onClick={cancel} disabled={busy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-all min-h-[40px]">
              <XCircle className="w-4 h-4" /> Cancel registration
            </button>
          </div>
        )}
      </Card>
    </li>
  );
}
