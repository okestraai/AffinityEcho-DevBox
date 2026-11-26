import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CreateEvent, EventInput, EventMode, GetHostPage, UpdateEvent } from "../../../api/eventApis";
import { showToast } from "../../Helper/ShowToast";

const errorOf = (e: unknown) => {
  const r = (e as { response?: { data?: { message?: string | string[]; code?: string } } }).response?.data;
  return { message: (Array.isArray(r?.message) ? r?.message[0] : r?.message) || "Couldn't save the event.", code: r?.code };
};

// A date and time typed in the event's own zone, turned into an exact moment.
export function zonedToIso(local: string, timeZone: string): string {
  if (!local) return "";
  const asUtc = new Date(`${local}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(asUtc);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return new Date(asUtc.getTime() - (shown - asUtc.getTime())).toISOString();
}

export function isoToZoned(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

const zones = (): string[] => {
  const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone");
  return list?.length ? list : ["UTC"];
};

// Create or edit an event. Each mode asks only for its own details.
export function EventFormPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const editing = !!eventId;
  const zoneList = useMemo(zones, []);
  const [form, setForm] = useState({
    title: "", description: "", mode: "physical" as EventMode,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    start: "", end: "", closes: "",
    venueName: "", venueAddress: "", venueCity: "", mapUrl: "", joinUrl: "",
    capacityInPerson: "", capacityOnline: "", organiserName: "",
  });
  const [needsPolicy, setNeedsPolicy] = useState(false);
  const [policy, setPolicy] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (!eventId) return;
    GetHostPage(eventId)
      .then(({ event: e }) =>
        setForm({
          title: e.title, description: e.description ?? "", mode: e.mode, timeZone: e.timeZone,
          start: isoToZoned(e.startsAt, e.timeZone), end: isoToZoned(e.endsAt, e.timeZone),
          closes: e.registrationClosesAt ? isoToZoned(e.registrationClosesAt, e.timeZone) : "",
          venueName: e.venueName ?? "", venueAddress: e.venueAddress ?? "", venueCity: e.venueCity ?? "",
          mapUrl: e.mapUrl ?? "", joinUrl: e.joinUrl ?? "",
          capacityInPerson: e.capacityInPerson ? String(e.capacityInPerson) : "",
          capacityOnline: e.capacityOnline ? String(e.capacityOnline) : "",
          organiserName: e.organiserName,
        }),
      )
      .catch(() => showToast("Couldn't load the event.", "error"));
  }, [eventId]);

  const inPerson = form.mode !== "virtual";
  const online = form.mode !== "physical";

  const save = async () => {
    setBusy(true);
    const payload: EventInput = {
      title: form.title.trim(),
      description: form.description,
      mode: form.mode,
      timeZone: form.timeZone,
      startsAt: zonedToIso(form.start, form.timeZone),
      endsAt: zonedToIso(form.end, form.timeZone),
      organiserName: form.organiserName.trim(),
      ...(form.closes ? { registrationClosesAt: zonedToIso(form.closes, form.timeZone) } : {}),
      ...(inPerson
        ? {
            venueName: form.venueName.trim(), venueAddress: form.venueAddress.trim(), venueCity: form.venueCity.trim(),
            ...(form.mapUrl.trim() ? { mapUrl: form.mapUrl.trim() } : {}),
            ...(form.capacityInPerson ? { capacityInPerson: Number(form.capacityInPerson) } : {}),
          }
        : {}),
      ...(online
        ? { joinUrl: form.joinUrl.trim(), ...(form.capacityOnline ? { capacityOnline: Number(form.capacityOnline) } : {}) }
        : {}),
      ...(policy ? { acceptPolicy: true } : {}),
    };
    try {
      const saved = editing ? await UpdateEvent(eventId!, payload) : await CreateEvent(payload);
      showToast(editing ? "Event saved. Guests are told about changes." : "Event created.", "success");
      navigate(`/events/manage/${saved.id}`);
    } catch (e) {
      const { message, code } = errorOf(e);
      if (code === "EVENT_POLICY_REQUIRED") setNeedsPolicy(true);
      showToast(message, "error");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full px-3 py-2 border border-gray-300 rounded-xl min-h-[44px]";
  const field = (id: string, label: string, el: React.ReactNode, hint?: string) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {el}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{editing ? "Edit event" : "Host an event"}</h1>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        {field("ev-title", "Title", <input id="ev-title" className={input} maxLength={120} value={form.title} onChange={(e) => set({ title: e.target.value })} />)}
        {field("ev-org", "Organiser name", <input id="ev-org" className={input} maxLength={120} value={form.organiserName} onChange={(e) => set({ organiserName: e.target.value })} />, "Shown to guests. Your forum username is never shown.")}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">Where</legend>
          <div className="grid grid-cols-3 gap-2">
            {(["physical", "virtual", "hybrid"] as EventMode[]).map((m) => (
              <button key={m} type="button" aria-pressed={form.mode === m} onClick={() => set({ mode: m })}
                className={`p-3 rounded-xl border min-h-[44px] text-sm ${form.mode === m ? "bg-purple-50 border-purple-300 text-purple-800" : "bg-white border-gray-200"}`}>
                {m === "physical" ? "In person" : m === "virtual" ? "Online" : "Both"}
              </button>
            ))}
          </div>
        </fieldset>
        {field("ev-zone", "Time zone", (
          <select id="ev-zone" className={input} value={form.timeZone} onChange={(e) => set({ timeZone: e.target.value })}>
            {zoneList.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field("ev-start", "Starts", <input id="ev-start" type="datetime-local" className={input} value={form.start} onChange={(e) => set({ start: e.target.value })} />)}
          {field("ev-end", "Ends", <input id="ev-end" type="datetime-local" className={input} value={form.end} onChange={(e) => set({ end: e.target.value })} />)}
        </div>
        {field("ev-closes", "Registration closes (optional)", <input id="ev-closes" type="datetime-local" className={input} value={form.closes} onChange={(e) => set({ closes: e.target.value })} />, "Leave empty to close when the event starts.")}
        {inPerson && (
          <>
            {field("ev-venue", "Venue name", <input id="ev-venue" className={input} value={form.venueName} onChange={(e) => set({ venueName: e.target.value })} />, "Everyone sees the venue name and city.")}
            {field("ev-address", "Address", <input id="ev-address" className={input} value={form.venueAddress} onChange={(e) => set({ venueAddress: e.target.value })} />, "Only guests see the address.")}
            {field("ev-city", "City", <input id="ev-city" className={input} value={form.venueCity} onChange={(e) => set({ venueCity: e.target.value })} />)}
            {field("ev-map", "Map link (optional)", <input id="ev-map" type="url" placeholder="https://" className={input} value={form.mapUrl} onChange={(e) => set({ mapUrl: e.target.value })} />)}
            {field("ev-cap-in", "In-person places (optional)", <input id="ev-cap-in" type="number" min={1} className={input} value={form.capacityInPerson} onChange={(e) => set({ capacityInPerson: e.target.value })} />)}
          </>
        )}
        {online && (
          <>
            {field("ev-join", "Join link", <input id="ev-join" type="url" placeholder="https://" className={input} value={form.joinUrl} onChange={(e) => set({ joinUrl: e.target.value })} />, "Only guests see the join link.")}
            {field("ev-cap-on", "Online places (optional)", <input id="ev-cap-on" type="number" min={1} className={input} value={form.capacityOnline} onChange={(e) => set({ capacityOnline: e.target.value })} />)}
          </>
        )}
        {field("ev-desc", "Description", <textarea id="ev-desc" rows={5} maxLength={5000} className={input} value={form.description} onChange={(e) => set({ description: e.target.value })} />)}
        {needsPolicy && !editing && (
          <label className="flex items-start gap-2 text-sm text-gray-700 p-3 rounded-xl bg-purple-50 border border-purple-200">
            <input type="checkbox" checked={policy} onChange={(e) => setPolicy(e.target.checked)} className="mt-1 w-4 h-4" />
            <span>
              I agree to host safely and follow the <Link to="/community-guidelines" className="underline">community guidelines</Link>. Guests see my organiser name; I see their names, and their emails only if they share them.
            </span>
          </label>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 min-h-[44px]">Back</button>
          <button type="button" onClick={save} disabled={busy || (needsPolicy && !policy)}
            className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50 min-h-[44px]">
            {busy ? "Saving..." : editing ? "Save changes" : "Create event"}
          </button>
        </div>
      </div>
    </main>
  );
}
