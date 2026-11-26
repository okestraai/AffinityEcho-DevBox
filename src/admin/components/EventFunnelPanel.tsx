import { useEffect, useState } from "react";
import { GetEventFunnel, type EventFunnel } from "../../../api/adminApis";

const DAYS = [7, 30, 90] as const;
const pct = (v: number | null) => (v == null ? "–" : `${v}%`);

// Sign-ups from event links, with the targets from the events plan beside each rate.
export function EventFunnelPanel() {
  const [days, setDays] = useState<(typeof DAYS)[number]>(30);
  const [data, setData] = useState<EventFunnel | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setFailed(false);
    GetEventFunnel(days)
      .then((d) => live && setData(d))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [days]);

  const steps = data
    ? [
        { label: "Link opens", value: data.linkOpens },
        { label: "Codes asked", value: data.codesRequested },
        { label: "Codes verified", value: data.codesVerified },
        { label: "New accounts", value: data.newAccounts },
        { label: "Registrations", value: data.registrations },
        { label: "Started onboarding", value: data.onboardingStarted },
        { label: "Finished onboarding", value: data.onboarded },
      ]
    : [];
  const rates = data
    ? [
        { label: "Link open → code asked", value: data.rates.openToCode, target: "40%" },
        { label: "Code asked → verified", value: data.rates.codeToVerified, target: "80%" },
        { label: "New accounts onboarded in 7 days", value: data.rates.newAccountsOnboardedIn7Days, target: "50%" },
        { label: "Sign-ups that came from events", value: data.rates.signupsFromEvents, target: "20%" },
      ]
    : [];

  return (
    <section aria-label="Sign-ups from events" className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-900">Sign-ups from events</h2>
        <div role="tablist" aria-label="Period" className="flex gap-1">
          {DAYS.map((d) => (
            <button key={d} role="tab" aria-selected={days === d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[32px] ${days === d ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>
              {d} days
            </button>
          ))}
        </div>
      </div>
      {failed ? (
        <p className="text-sm text-gray-500">Couldn't load the numbers.</p>
      ) : !data ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {steps.map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {rates.map((r) => (
              <div key={r.label} className="rounded-xl border border-gray-200 p-3">
                <p className="text-xs text-gray-500">{r.label}</p>
                <p className="text-lg font-semibold text-gray-900 tabular-nums">{pct(r.value)} <span className="text-xs font-normal text-gray-500">target {r.target}</span></p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {data.eventsCreated} events created · {data.guestsNotified} update messages sent to guests · {data.allSignups} sign-ups in all
          </p>
        </>
      )}
    </section>
  );
}
