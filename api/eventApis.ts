// api/eventApis.ts
import axios from "axios";
import { getAuthInstance, API_URL, unwrap } from "./base";

export type EventMode = "virtual" | "physical" | "hybrid";
export type Attendance = "in_person" | "online";

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  mode: EventMode;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  venueName: string | null;
  venueCity: string | null;
  organiserName: string;
  status: "published" | "cancelled" | "removed";
  registrationOpen: boolean;
  placesLeft?: { inPerson: number | null; online: number | null };
  attendance?: Attendance | null;
}

export interface EventForMember extends EventSummary {
  isHost: boolean;
  registration: {
    id: string;
    attendance: Attendance;
    shareEmail: boolean;
    checkInCode: string;
    checkedIn: boolean;
  } | null;
  details: { venueAddress: string | null; mapUrl: string | null; joinUrl: string | null } | null;
}

export interface HostEvent extends EventSummary {
  venueAddress: string | null;
  mapUrl: string | null;
  joinUrl: string | null;
  capacityInPerson: number | null;
  capacityOnline: number | null;
  registrationClosesAt: string | null;
}

export interface Guest {
  registrationId: string;
  name: string;
  email: string | null;
  attendance: Attendance;
  checkedInAt: string | null;
  status: string;
  registeredAt: string;
}

export interface EventInput {
  title: string;
  description?: string;
  mode: EventMode;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  mapUrl?: string;
  joinUrl?: string;
  capacityInPerson?: number;
  capacityOnline?: number;
  registrationClosesAt?: string;
  organiserName: string;
  acceptPolicy?: boolean;
}

// The public page needs no sign-in and never carries the address or join link.
export const GetPublicEvent = async (slug: string): Promise<EventSummary> => {
  const res = await axios.get(`${API_URL}/events/public/${encodeURIComponent(slug)}`);
  return unwrap(res);
};

export const GetEventForMember = async (slug: string): Promise<EventForMember> => {
  const res = await getAuthInstance().get(`${API_URL}/events/${encodeURIComponent(slug)}`);
  return unwrap(res);
};

export const RegisterForEvent = async (
  slug: string,
  payload: { attendance: Attendance; shareEmail?: boolean; name?: string; source?: string },
): Promise<EventForMember> => {
  const res = await getAuthInstance().post(`${API_URL}/events/${encodeURIComponent(slug)}/register`, payload);
  return unwrap(res);
};

export const SetEmailSharing = async (slug: string, shareEmail: boolean) => {
  const res = await getAuthInstance().patch(`${API_URL}/events/${encodeURIComponent(slug)}/registration`, { shareEmail });
  return unwrap(res);
};

export const CancelRegistration = async (slug: string) => {
  const res = await getAuthInstance().delete(`${API_URL}/events/${encodeURIComponent(slug)}/registration`);
  return unwrap(res);
};

export const GetMyEvents = async (): Promise<{
  registered: { active: EventSummary[]; past: EventSummary[] };
  hosting: EventSummary[];
}> => {
  const res = await getAuthInstance().get(`${API_URL}/events/mine`);
  return unwrap(res);
};

export const CreateEvent = async (payload: EventInput): Promise<HostEvent> => {
  const res = await getAuthInstance().post(`${API_URL}/events`, payload);
  return unwrap(res);
};

export const UpdateEvent = async (eventId: string, payload: Partial<EventInput>): Promise<HostEvent> => {
  const res = await getAuthInstance().patch(`${API_URL}/events/${eventId}`, payload);
  return unwrap(res);
};

export const CancelEvent = async (eventId: string) => {
  const res = await getAuthInstance().post(`${API_URL}/events/${eventId}/cancel`);
  return unwrap(res);
};

export const GetHostPage = async (eventId: string): Promise<{
  event: HostEvent;
  stats: { linkOpens: number; registered: number; inPerson: number; online: number; checkedIn: number };
  guests: Guest[];
}> => {
  const res = await getAuthInstance().get(`${API_URL}/events/${eventId}/host`);
  return unwrap(res);
};

export const CheckInGuest = async (
  eventId: string,
  payload: { code?: string; registrationId?: string },
): Promise<{ registrationId: string; name: string; attendance: Attendance; alreadyCheckedIn: boolean }> => {
  const res = await getAuthInstance().post(`${API_URL}/events/${eventId}/check-in`, payload);
  return unwrap(res);
};

// The CSV comes as a file, so it is fetched as a blob.
export const DownloadGuestCsv = async (eventId: string): Promise<Blob> => {
  const res = await getAuthInstance().get(`${API_URL}/events/${eventId}/guests.csv`, { responseType: "blob" });
  return res.data as Blob;
};

export const ReportEvent = async (eventId: string, reason: string) => {
  const res = await getAuthInstance().post(`${API_URL}/events/${eventId}/report`, { reason });
  return unwrap(res);
};
