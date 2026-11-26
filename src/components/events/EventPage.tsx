import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, MapPin, Video, Users, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  Attendance,
  EventForMember,
  EventSummary,
  GetEventForMember,
  GetPublicEvent,
  RegisterForEvent,
} from "../../../api/eventApis";
import { eventWhen, modeLabel } from "../../utils/eventTime";
import { CodeSignIn } from "../auth/CodeSignIn";
import { showToast } from "../../Helper/ShowToast";

const errorText = (error: unknown, fallback: string) => {
  const e = error as { response?: { data?: { message?: string | string[] } } };
  const m = e.response?.data?.message;
  return (Array.isArray(m) ? m[0] : m) || fallback;
};

// The page an event link opens. Anyone can see it; guests and the host see the full details.
export function EventPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [event, setEvent] = useState<EventSummary | EventForMember | null>(null);
  const [missing, setMissing] = useState(false);
  const [attendance, setAttendance] = useState<Attendance>("in_person");
  const [shareEmail, setShareEmail] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = isAuthenticated ? await GetEventForMember(slug) : await GetPublicEvent(slug);
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
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h1>
        <p className="text-gray-600 mb-6">The link may be wrong, or the event was removed.</p>
        <Link to="/" className="text-purple-700 underline">Go to Affinity Echo</Link>
      </main>
    );
  }
  if (!event) return <main className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500">Loading event…</main>;

  const member = "isHost" in event ? (event as EventForMember) : null;
  const when = eventWhen(event.startsAt, event.endsAt, event.timeZone);
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
    <main className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {isAuthenticated && (
        <button onClick={() => navigate("/events")} className="flex items-center gap-2 text-sm text-gray-600 mb-4 min-h-[44px]">
          <ArrowLeft className="w-4 h-4" /> My Events
        </button>
      )}
      <article className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <header className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-5 sm:p-7">
          <p className="text-sm opacity-90">{modeLabel[event.mode]}</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{event.title}</h1>
          <p className="text-sm mt-2 opacity-90">Hosted by {event.organiserName}</p>
        </header>

        <div className="p-5 sm:p-7 space-y-4">
          {event.status === "cancelled" && (
            <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">The host cancelled this event.</p>
          )}
          <p className="flex items-start gap-3 text-gray-800">
            <CalendarDays className="w-5 h-5 mt-0.5 text-purple-600 flex-shrink-0" />
            <span>
              {when.local}
              {when.there && <span className="block text-sm text-gray-500">{when.there}</span>}
            </span>
          </p>
          {event.mode !== "virtual" && (
            <p className="flex items-start gap-3 text-gray-800">
              <MapPin className="w-5 h-5 mt-0.5 text-purple-600 flex-shrink-0" />
              <span>
                {event.venueName}, {event.venueCity}
                {member?.details?.venueAddress && <span className="block text-sm text-gray-600">{member.details.venueAddress}</span>}
                {member?.details?.mapUrl && (
                  <a href={member.details.mapUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-purple-700 underline">Open the map</a>
                )}
              </span>
            </p>
          )}
          {event.mode !== "physical" && (
            <p className="flex items-start gap-3 text-gray-800">
              <Video className="w-5 h-5 mt-0.5 text-purple-600 flex-shrink-0" />
              {member?.details?.joinUrl ? (
                <a href={member.details.joinUrl} target="_blank" rel="noopener noreferrer" className="text-purple-700 underline break-all">{member.details.joinUrl}</a>
              ) : (
                <span className="text-gray-600">The join link is shared with guests.</span>
              )}
            </p>
          )}
          {event.description && <p className="text-gray-700 whitespace-pre-line">{event.description}</p>}
        </div>

        <section className="border-t border-gray-100 p-5 sm:p-7 bg-gray-50" aria-label="Registration">
          {member?.isHost ? (
            <Link to={`/events/manage/${event.id}`} className="block w-full text-center px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold min-h-[44px]">
              Open your host page
            </Link>
          ) : member?.registration ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 font-semibold text-green-700"><CheckCircle2 className="w-5 h-5" /> You're registered</p>
              <p className="text-sm text-gray-600">
                Attending {member.registration.attendance === "in_person" ? "in person" : "online"}.
                {member.registration.attendance === "in_person" && <> Your check-in code is <strong className="tracking-widest">{member.registration.checkInCode}</strong>.</>}
              </p>
              <Link to="/events" className="text-sm text-purple-700 underline">Manage in My Events</Link>
            </div>
          ) : !event.registrationOpen ? (
            <p className="text-gray-600">Registration is closed.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-800">Your name will be shown to the host.</p>
              {choices.length > 1 && (
                <fieldset>
                  <legend className="text-sm font-medium text-gray-700 mb-2">How will you attend?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {choices.map((c) => {
                      const full = c === "in_person" ? inPersonFull : onlineFull;
                      return (
                        <button key={c} type="button" aria-pressed={attendance === c} disabled={full}
                          onClick={() => setAttendance(c)}
                          className={`p-3 rounded-xl border min-h-[44px] ${attendance === c ? "bg-purple-50 border-purple-300 text-purple-800" : "bg-white border-gray-200"} disabled:opacity-50`}>
                          {c === "in_person" ? "In person" : "Online"}{full ? " (full)" : ""}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              {(event.placesLeft?.inPerson != null || event.placesLeft?.online != null) && (
                <p className="flex items-center gap-2 text-xs text-gray-500"><Users className="w-4 h-4" />
                  {event.placesLeft?.inPerson != null && `${event.placesLeft.inPerson} in-person places left. `}
                  {event.placesLeft?.online != null && `${event.placesLeft.online} online places left.`}
                </p>
              )}
              <label className="flex items-start gap-2 text-sm text-gray-700 min-h-[44px]">
                <input type="checkbox" checked={shareEmail} onChange={(e) => setShareEmail(e.target.checked)} className="mt-1 w-4 h-4" />
                <span>Share my email with the host (optional). You can change this until the event ends.</span>
              </label>
              {isAuthenticated ? (
                <>
                  {needsName && (
                    <div>
                      <label htmlFor="guest-name" className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                      <input id="guest-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl min-h-[44px]" />
                    </div>
                  )}
                  <button type="button" onClick={() => register()} disabled={busy || (attendance === "in_person" ? inPersonFull : onlineFull)}
                    className="w-full px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50 min-h-[44px]">
                    {busy ? "Registering..." : "Register"}
                  </button>
                </>
              ) : (
                <CodeSignIn askName submitLabel="Email me a code to register" onSignedIn={() => register(true)} />
              )}
            </div>
          )}
        </section>
      </article>
    </main>
  );
}
