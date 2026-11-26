import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  MonitorPlay,
  Users,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  Attendance,
  EventForMember,
  EventSummary,
  GetEventForMember,
  GetPublicEvent,
  RegisterForEvent,
} from "../../../api/eventApis";
import { eventWhen } from "../../utils/eventTime";
import { CodeSignIn } from "../auth/CodeSignIn";
import { showToast } from "../../Helper/ShowToast";
import { Card, DateTile, InfoRow, ModeBadge, StatusBadge, inputClass, primaryButton } from "./parts";

const errorText = (error: unknown, fallback: string) => {
  const e = error as { response?: { data?: { message?: string | string[] } } };
  const m = e.response?.data?.message;
  return (Array.isArray(m) ? m[0] : m) || fallback;
};

// The page an event link opens. Anyone can see it; guests and the host see the full details.
export function EventPage() {
  const { slug = "" } = useParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [event, setEvent] = useState<EventSummary | EventForMember | null>(null);
  const [missing, setMissing] = useState(false);
  const [attendance, setAttendance] = useState<Attendance>("in_person");
  const [shareEmail, setShareEmail] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  // Only the newest answer is shown, so a slow page load can't undo a registration.
  const latest = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++latest.current;
    try {
      const data = isAuthenticated ? await GetEventForMember(slug) : await GetPublicEvent(slug);
      if (ticket !== latest.current) return;
      setEvent(data);
      if (data.mode === "virtual") setAttendance("online");
    } catch {
      setMissing(true);
    }
  }, [slug, isAuthenticated]);

  useEffect(() => {
    if (!isLoading) load();
  }, [isLoading, load]);

  if (missing) {
    return (
      <Card className="max-w-lg mx-auto p-10 text-center">
        <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Event not found</h1>
        <p className="text-slate-600 mb-6">The link may be wrong, or the event was removed.</p>
        <Link to={isAuthenticated ? "/events" : "/"} className="text-purple-700 font-semibold hover:underline">
          {isAuthenticated ? "Back to My Events" : "Go to Affinity Echo"}
        </Link>
      </Card>
    );
  }
  if (!event) return <EventSkeleton />;

  const member = "isHost" in event ? (event as EventForMember) : null;
  const when = eventWhen(event.startsAt, event.endsAt, event.timeZone);
  const ended = new Date(event.endsAt).getTime() < Date.now();
  const inPersonFull = event.placesLeft?.inPerson === 0;
  const onlineFull = event.placesLeft?.online === 0;
  const choices: Attendance[] =
    event.mode === "hybrid" ? ["in_person", "online"] : event.mode === "physical" ? ["in_person"] : ["online"];
  const needsName = !user?.first_name;

  const register = async (signedInNow = false) => {
    setBusy(true);
    try {
      const data = await RegisterForEvent(slug, {
        attendance,
        shareEmail,
        name: needsName && name.trim() ? name.trim() : undefined,
        source: "link",
      });
      latest.current += 1;
      setEvent(data);
      showToast("You're registered. Check your email for the details.", "success");
    } catch (e) {
      showToast(errorText(e, "Could not register. Try again."), "error");
      if (signedInNow) load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {isAuthenticated && (
        <Link to="/events" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4 min-h-[40px]">
          <ArrowLeft className="w-4 h-4" /> My Events
        </Link>
      )}

      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-10 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row gap-5 sm:gap-7 sm:items-end">
          <DateTile iso={event.startsAt} size="lg" tone="glass" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <ModeBadge mode={event.mode} tone="glass" />
              {(event.status !== "published" || ended) && <StatusBadge status={event.status} ended={ended} />}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">{event.title}</h1>
            <p className="mt-3 text-white/75">
              Hosted by <span className="font-semibold text-white">{event.organiserName}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        {/* Details */}
        <div className="space-y-6 min-w-0">
          {event.status === "cancelled" && (
            <div role="alert" className="p-4 rounded-2xl bg-red-50 text-red-800 border border-red-200">
              The host cancelled this event.
            </div>
          )}
          <Card className="p-5 sm:p-6 divide-y divide-slate-100">
            <InfoRow icon={<CalendarDays className="w-5 h-5" />} label="When">
              <p className="font-medium">{when.local}</p>
              {when.there && <p className="text-sm text-slate-500">{when.there}</p>}
            </InfoRow>
            {event.mode !== "virtual" && (
              <InfoRow icon={<MapPin className="w-5 h-5" />} label="Where">
                <p className="font-medium">{event.venueName}</p>
                {member?.details?.venueAddress ? (
                  <p className="text-sm text-slate-600">{member.details.venueAddress}, {event.venueCity}</p>
                ) : (
                  <p className="text-sm text-slate-600">{event.venueCity} · full address shared with guests</p>
                )}
                {member?.details?.mapUrl && (
                  <a href={member.details.mapUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-sm font-semibold text-purple-700 hover:underline">
                    Open the map <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </InfoRow>
            )}
            {event.mode !== "physical" && (
              <InfoRow icon={<MonitorPlay className="w-5 h-5" />} label="Online">
                {member?.details?.joinUrl ? (
                  <a href={member.details.joinUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-purple-700 hover:underline break-all">
                    Join the event <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                ) : (
                  <p className="text-slate-600">The join link is shared with guests.</p>
                )}
              </InfoRow>
            )}
          </Card>

          {event.description && (
            <Card className="p-5 sm:p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">About this event</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{event.description}</p>
            </Card>
          )}
        </div>

        {/* Registration */}
        <aside className="lg:sticky lg:top-4" aria-label="Registration">
          <Card className="p-5 sm:p-6">
            {member?.isHost ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">You're hosting this event.</p>
                <Link to={`/events/manage/${event.id}`} className={`${primaryButton} w-full`}>Open your host page</Link>
              </div>
            ) : member?.registration ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">You're registered</p>
                    <p className="text-sm text-slate-600">
                      Attending {member.registration.attendance === "in_person" ? "in person" : "online"}
                    </p>
                  </div>
                </div>
                {member.registration.attendance === "in_person" && (
                  <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 flex items-center justify-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" /> Check-in code
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-[0.3em] text-slate-900">{member.registration.checkInCode}</p>
                    <p className="mt-1 text-xs text-slate-500">The QR code is in your confirmation email.</p>
                  </div>
                )}
                <Link to="/events" className="block text-center text-sm font-semibold text-purple-700 hover:underline">Manage in My Events</Link>
              </div>
            ) : !event.registrationOpen ? (
              <p className="text-slate-600">{event.status === "cancelled" ? "This event was cancelled." : "Registration is closed."}</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Register</h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-slate-600">
                    <ShieldCheck className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                    Your name will be shown to the host.
                  </p>
                </div>
                {choices.length > 1 && (
                  <fieldset>
                    <legend className="text-sm font-medium text-slate-700 mb-2">How will you attend?</legend>
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100">
                      {choices.map((c) => {
                        const full = c === "in_person" ? inPersonFull : onlineFull;
                        return (
                          <button key={c} type="button" aria-pressed={attendance === c} disabled={full}
                            onClick={() => setAttendance(c)}
                            className={`py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[40px] ${attendance === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"} disabled:opacity-40`}>
                            {c === "in_person" ? "In person" : "Online"}{full ? " · full" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
                {(event.placesLeft?.inPerson != null || event.placesLeft?.online != null) && (
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    {[
                      event.placesLeft?.inPerson != null ? `${event.placesLeft.inPerson} in-person places left` : null,
                      event.placesLeft?.online != null ? `${event.placesLeft.online} online places left` : null,
                    ].filter(Boolean).join(" · ")}
                  </p>
                )}
                <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={shareEmail} onChange={(e) => setShareEmail(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                  <span>
                    Share my email with the host
                    <span className="block text-xs text-slate-500">Optional. You can change this until the event ends.</span>
                  </span>
                </label>
                {isAuthenticated ? (
                  <>
                    {needsName && (
                      <div>
                        <label htmlFor="guest-name" className="block text-sm font-medium text-slate-700 mb-1.5">Your name</label>
                        <input id="guest-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} className={inputClass} />
                      </div>
                    )}
                    <button type="button" onClick={() => register()}
                      disabled={busy || (attendance === "in_person" ? inPersonFull : onlineFull)}
                      className={`${primaryButton} w-full`}>
                      {busy ? "Registering…" : "Register"}
                    </button>
                  </>
                ) : (
                  <div className="pt-1 border-t border-slate-100">
                    <p className="text-sm text-slate-600 my-3">We'll email you a code to register. No password needed.</p>
                    <CodeSignIn askName submitLabel="Email me a code" onSignedIn={() => register(true)} />
                  </div>
                )}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse" aria-label="Loading event">
      <div className="h-56 rounded-3xl bg-slate-200" />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
        <div className="h-48 rounded-2xl bg-slate-200" />
        <div className="h-64 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
