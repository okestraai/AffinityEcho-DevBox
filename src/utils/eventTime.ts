// Event times in the viewer's own time zone, with the event's zone when it differs.
export function eventWhen(startsAt: string, endsAt: string, eventZone: string, viewerZone?: string) {
  const zone = viewerZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const day = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: zone,
  }).format(new Date(startsAt));
  const time = (d: string, withZone = false) =>
    new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: zone,
      ...(withZone ? { timeZoneName: "short" } : {}),
    }).format(new Date(d));
  const local = `${day}, ${time(startsAt)} to ${time(endsAt, true)}`;
  if (zone === eventZone) return { local, there: null };
  const there = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: eventZone,
    timeZoneName: "short",
  }).format(new Date(startsAt));
  return { local, there: `${there} where it happens` };
}

export const modeLabel = { virtual: "Online", physical: "In person", hybrid: "In person and online" } as const;
