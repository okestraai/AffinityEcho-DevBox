import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe2, MapPin, MonitorPlay } from "lucide-react";
import { CreateEvent, EventInput, EventMode, GetEventOptions, GetHostPage, RemoveEventCover, UpdateEvent, UploadEventCover, eventCoverUrl } from "../../../api/eventApis";
import { CoverPicker, type CoverChoice } from "./CoverPicker";
import { showToast } from "../../Helper/ShowToast";
import { Card, PageHeading, inputClass, primaryButton, secondaryButton } from "./parts";

const errorOf = (e: unknown) => {
  const r = (e as { response?: { data?: { message?: string | string[]; code?: string } } }).response?.data;
  return { message: (Array.isArray(r?.message) ? r?.message[0] : r?.message) || "Couldn't save the event.", code: r?.code };
};

// The zone's offset from UTC, in ms, at a given moment.
function offsetAt(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - instant;
}

// A date and time typed in the event's own zone, turned into an exact moment.
// The offset is taken again at the first answer, so times near a clock change come out right.
export function zonedToIso(local: string, timeZone: string): string {
  if (!local) return "";
  const wall = new Date(`${local}:00Z`).getTime();
  let instant = wall - offsetAt(wall, timeZone);
  instant = wall - offsetAt(instant, timeZone);
  return new Date(instant).toISOString();
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

const MODES: { id: EventMode; label: string; note: string; icon: ReactNode }[] = [
  { id: "physical", label: "In person", note: "At a venue", icon: <MapPin className="w-5 h-5" /> },
  { id: "virtual", label: "Online", note: "With a join link", icon: <MonitorPlay className="w-5 h-5" /> },
  { id: "hybrid", label: "Both", note: "Venue and link", icon: <Globe2 className="w-5 h-5" /> },
];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {note && <p className="mt-0.5 text-sm text-slate-500">{note}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
    </div>
  );
}

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
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [cover, setCover] = useState<CoverChoice>({ file: null, remove: false });
  const [options, setOptions] = useState({ coversEnabled: true, coverMaxMb: 2 });

  useEffect(() => {
    GetEventOptions().then(setOptions).catch(() => undefined);
  }, []);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (!eventId) return;
    GetHostPage(eventId)
      .then(({ event: e }) => {
        setCoverUrl(eventCoverUrl(e.slug, e.coverVersion));
        setForm({
          title: e.title, description: e.description ?? "", mode: e.mode, timeZone: e.timeZone,
          start: isoToZoned(e.startsAt, e.timeZone), end: isoToZoned(e.endsAt, e.timeZone),
          closes: e.registrationClosesAt ? isoToZoned(e.registrationClosesAt, e.timeZone) : "",
          venueName: e.venueName ?? "", venueAddress: e.venueAddress ?? "", venueCity: e.venueCity ?? "",
          mapUrl: e.mapUrl ?? "", joinUrl: e.joinUrl ?? "",
          capacityInPerson: e.capacityInPerson ? String(e.capacityInPerson) : "",
          capacityOnline: e.capacityOnline ? String(e.capacityOnline) : "",
          organiserName: e.organiserName,
        });
      })
      .catch(() => showToast("Couldn't load the event.", "error"));
  }, [eventId]);

  const inPerson = form.mode !== "virtual";
  const online = form.mode !== "physical";

  const save = async () => {
    setBusy(true);
    // When editing, an emptied optional field is sent as null so it is cleared.
    const optional = <T,>(value: T | undefined) => (value !== undefined && value !== "" ? value : editing ? null : undefined);
    const payload = {
      title: form.title.trim(),
      description: form.description,
      mode: form.mode,
      timeZone: form.timeZone,
      startsAt: zonedToIso(form.start, form.timeZone),
      endsAt: zonedToIso(form.end, form.timeZone),
      organiserName: form.organiserName.trim(),
      registrationClosesAt: optional(form.closes ? zonedToIso(form.closes, form.timeZone) : ""),
      ...(inPerson
        ? {
            venueName: form.venueName.trim(), venueAddress: form.venueAddress.trim(), venueCity: form.venueCity.trim(),
            mapUrl: optional(form.mapUrl.trim()),
            capacityInPerson: optional(form.capacityInPerson ? Number(form.capacityInPerson) : undefined),
          }
        : {}),
      ...(online
        ? { joinUrl: optional(form.joinUrl.trim()), capacityOnline: optional(form.capacityOnline ? Number(form.capacityOnline) : undefined) }
        : {}),
      ...(policy ? { acceptPolicy: true } : {}),
    } as EventInput;
    try {
      const saved = editing ? await UpdateEvent(eventId!, payload) : await CreateEvent(payload);
      const id = saved.id ?? eventId!;
      showToast(editing ? "Event saved. Guests are told about changes." : "Event created.", "success");
      // The picture goes up after the event exists; a failed upload doesn't undo the event.
      try {
        if (cover.file) await UploadEventCover(id, cover.file);
        else if (cover.remove) await RemoveEventCover(id);
      } catch (e) {
        showToast(`The event is saved, but the picture wasn't: ${errorOf(e).message}`, "error");
      }
      navigate(`/events/manage/${id}`);
    } catch (e) {
      const { message, code } = errorOf(e);
      if (code === "EVENT_POLICY_REQUIRED") setNeedsPolicy(true);
      showToast(message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link to={editing ? `/events/manage/${eventId}` : "/events"} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4 min-h-[40px]">
        <ArrowLeft className="w-4 h-4" /> {editing ? "Host page" : "My Events"}
      </Link>
      <PageHeading
        eyebrow={editing ? "Edit event" : "New event"}
        title={editing ? "Edit your event" : "Host an event"}
        subtitle={editing ? "Guests are told about changes to the time or place." : "Guests see your organiser name, never your forum username."}
      />

      <div className="space-y-5">
        <Section title="The basics">
          <Field id="ev-title" label="Title">
            <input id="ev-title" className={inputClass} maxLength={120} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Career night for new graduates" />
          </Field>
          <Field id="ev-org" label="Organiser name" hint="Shown to guests.">
            <input id="ev-org" className={inputClass} maxLength={120} value={form.organiserName} onChange={(e) => set({ organiserName: e.target.value })} placeholder="e.g. Lagos Tech Women" />
          </Field>
          <Field id="ev-desc" label="Description">
            <textarea id="ev-desc" rows={5} maxLength={5000} className={`${inputClass} resize-y`} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="What will happen, who it's for, anything guests should bring." />
          </Field>
        </Section>

        {options.coversEnabled && (
          <Section title="Cover picture" note="Shown at the top of the event page.">
            <CoverPicker currentUrl={coverUrl} onChange={setCover} maxMb={options.coverMaxMb} />
          </Section>
        )}

        <Section title="Where it happens">
          <div role="radiogroup" aria-label="Where" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MODES.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={form.mode === m.id} onClick={() => set({ mode: m.id })}
                className={`text-left p-4 rounded-xl border-2 transition-all min-h-[44px] ${form.mode === m.id ? "border-purple-500 bg-purple-50/60 ring-4 ring-purple-500/10" : "border-slate-200 hover:border-slate-300"}`}>
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${form.mode === m.id ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>{m.icon}</span>
                <span className="block font-semibold text-slate-900">{m.label}</span>
                <span className="block text-xs text-slate-500">{m.note}</span>
              </button>
            ))}
          </div>
          {inPerson && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="ev-venue" label="Venue name" hint="Everyone sees this and the city.">
                <input id="ev-venue" className={inputClass} value={form.venueName} onChange={(e) => set({ venueName: e.target.value })} />
              </Field>
              <Field id="ev-city" label="City">
                <input id="ev-city" className={inputClass} value={form.venueCity} onChange={(e) => set({ venueCity: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field id="ev-address" label="Address" hint="Only guests see the address.">
                  <input id="ev-address" className={inputClass} value={form.venueAddress} onChange={(e) => set({ venueAddress: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="ev-map" label="Map link (optional)">
                  <input id="ev-map" type="url" placeholder="https://" className={inputClass} value={form.mapUrl} onChange={(e) => set({ mapUrl: e.target.value })} />
                </Field>
              </div>
            </div>
          )}
          {online && (
            <Field id="ev-join" label="Join link (optional for now)" hint="Only guests see it. You can add it later; guests get an email when you do.">
              <input id="ev-join" type="url" placeholder="https://" className={inputClass} value={form.joinUrl} onChange={(e) => set({ joinUrl: e.target.value })} />
            </Field>
          )}
        </Section>

        <Section title="When" note="Times are in the event's own time zone. Guests see them in theirs.">
          <Field id="ev-zone" label="Time zone">
            <select id="ev-zone" className={inputClass} value={form.timeZone} onChange={(e) => set({ timeZone: e.target.value })}>
              {zoneList.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="ev-start" label="Starts">
              <input id="ev-start" type="datetime-local" className={inputClass} value={form.start} onChange={(e) => set({ start: e.target.value })} />
            </Field>
            <Field id="ev-end" label="Ends">
              <input id="ev-end" type="datetime-local" className={inputClass} value={form.end} onChange={(e) => set({ end: e.target.value })} />
            </Field>
          </div>
          <Field id="ev-closes" label="Registration closes (optional)" hint="Leave empty to close when the event starts.">
            <input id="ev-closes" type="datetime-local" className={inputClass} value={form.closes} onChange={(e) => set({ closes: e.target.value })} />
          </Field>
        </Section>

        <Section title="Places" note="Leave empty for no limit.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inPerson && (
              <Field id="ev-cap-in" label="In-person places">
                <input id="ev-cap-in" type="number" min={1} className={inputClass} value={form.capacityInPerson} onChange={(e) => set({ capacityInPerson: e.target.value })} />
              </Field>
            )}
            {online && (
              <Field id="ev-cap-on" label="Online places">
                <input id="ev-cap-on" type="number" min={1} className={inputClass} value={form.capacityOnline} onChange={(e) => set({ capacityOnline: e.target.value })} />
              </Field>
            )}
          </div>
        </Section>

        {needsPolicy && !editing && (
          <Card className="p-5 border-purple-200 bg-purple-50/60">
            <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={policy} onChange={(e) => setPolicy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-purple-600" />
              <span>
                <span className="block font-semibold text-slate-900 mb-1">Event policy</span>
                I'll host safely and follow the <Link to="/community-guidelines" className="text-purple-700 font-medium hover:underline">community guidelines</Link>. Guests see my organiser name. I see their names, and their emails only if they share them.
              </span>
            </label>
          </Card>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 pb-4">
          <button type="button" onClick={() => navigate(-1)} className={secondaryButton}>Cancel</button>
          <button type="button" onClick={save} disabled={busy || (needsPolicy && !policy)} className={primaryButton}>
            {busy ? "Saving…" : editing ? "Save changes" : "Create event"}
          </button>
        </div>
      </div>
    </div>
  );
}
