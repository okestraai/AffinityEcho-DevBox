import type { ReactNode } from "react";
import { Globe2, MapPin, MonitorPlay } from "lucide-react";
import type { EventMode } from "../../../api/eventApis";

// Shared pieces of the event screens, so they read as one set.

export function DateTile({ iso, timeZone, size = "md", tone = "light" }: {
  iso: string;
  timeZone?: string;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "glass";
}) {
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const d = new Date(iso);
  const month = new Intl.DateTimeFormat(undefined, { month: "short", timeZone: zone }).format(d).toUpperCase();
  const day = new Intl.DateTimeFormat(undefined, { day: "numeric", timeZone: zone }).format(d);
  const box = { sm: "w-12 h-12", md: "w-14 h-14", lg: "w-20 h-20" }[size];
  const dayText = { sm: "text-lg", md: "text-xl", lg: "text-3xl" }[size];
  const skin =
    tone === "glass"
      ? "bg-white/15 border-white/25 text-white backdrop-blur-md"
      : "bg-white border-slate-200 text-slate-900 shadow-sm";
  return (
    <div className={`${box} ${skin} border rounded-2xl flex flex-col items-center justify-center flex-shrink-0 leading-none`} aria-hidden="true">
      <span className={`text-[10px] font-bold tracking-[0.18em] ${tone === "glass" ? "text-white/80" : "text-purple-600"}`}>{month}</span>
      <span className={`${dayText} font-bold mt-1`}>{day}</span>
    </div>
  );
}

const MODE: Record<EventMode, { label: string; icon: ReactNode }> = {
  physical: { label: "In person", icon: <MapPin className="w-3.5 h-3.5" /> },
  virtual: { label: "Online", icon: <MonitorPlay className="w-3.5 h-3.5" /> },
  hybrid: { label: "In person & online", icon: <Globe2 className="w-3.5 h-3.5" /> },
};

export function ModeBadge({ mode, tone = "light" }: { mode: EventMode; tone?: "light" | "glass" }) {
  const skin =
    tone === "glass"
      ? "bg-white/15 text-white border-white/25"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${skin}`}>
      {MODE[mode].icon}
      {MODE[mode].label}
    </span>
  );
}

export function StatusBadge({ status, ended }: { status: string; ended?: boolean }) {
  if (status === "cancelled")
    return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Cancelled</span>;
  if (status === "removed")
    return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Removed</span>;
  if (ended)
    return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Ended</span>;
  return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Upcoming</span>;
}

// A row in an info card: an icon tile, a small label and the value.
export function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <div className="mt-1 text-slate-900">{children}</div>
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}>{children}</section>;
}

// The heading block every event screen starts with, matching the dashboard pages.
export function PageHeading({ eyebrow, title, subtitle, actions }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 md:mb-8">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-600 mb-2">{eyebrow}</p>}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-800 bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const primaryButton =
  "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all min-h-[44px]";
export const secondaryButton =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all min-h-[44px]";
export const dangerButton =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-600 text-sm font-semibold border border-red-200 hover:bg-red-50 transition-all min-h-[44px]";
export const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all min-h-[44px]";
