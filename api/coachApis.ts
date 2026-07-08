// api/coachApis.ts — Coach by Okestra AI API client.
// Mirrors the existing api/* pattern: same auth instance + response unwrap, so
// web and mobile share one transport-agnostic contract under /coaching/*.
import { API_URL, getAuthInstance, unwrap } from "./base";

export type CoachStage =
  | "OPENING"
  | "GOAL"
  | "REALITY"
  | "OPTIONS"
  | "WILL"
  | "CLOSING";

export interface CoachResourceLinks {
  mentors: { handle: string; expertise: string; userId: string }[];
  topics: { title: string; forum: string; topicId: string }[];
  posts: { snippet: string; postId: string }[];
}

export interface CoachTurnResult {
  sessionId: string;
  coachMessage: string;
  stage: CoachStage;
  phase: "coach_speaking" | "completed";
  isComplete: boolean;
  advicePending: boolean;
  askFeedback?: boolean;
  resources?: CoachResourceLinks;
  safety: {
    status: "ok" | "flagged" | "crisis";
    category: string;
    severity: string;
  };
}

export const StartCoachSession = async (
  modality: "text" | "voice" = "text",
): Promise<CoachTurnResult> => {
  const res = await getAuthInstance().post(`${API_URL}/coaching/sessions`, {
    modality,
  });
  return unwrap(res);
};

export const SendCoachTurn = async (
  sessionId: string,
  message: string,
  modality: "text" | "voice" = "text",
): Promise<CoachTurnResult> => {
  const res = await getAuthInstance().post(
    `${API_URL}/coaching/sessions/${sessionId}/turn`,
    { message, modality },
  );
  return unwrap(res);
};

export interface LatestCoachSession {
  sessionId: string;
  stage: CoachStage;
  status: string;
  resumable: boolean;
  messages: {
    role: "coach" | "client";
    content: string;
    resources?: CoachResourceLinks;
  }[];
}

// Most recent session + transcript, so the user can continue where they left off.
export const GetLatestCoachSession =
  async (): Promise<LatestCoachSession | null> => {
    const res = await getAuthInstance().get(`${API_URL}/coaching/sessions/latest`);
    return unwrap(res);
  };

export const EndCoachSession = async (
  sessionId: string,
): Promise<{ ok: boolean; askFeedback: boolean }> => {
  const res = await getAuthInstance().post(
    `${API_URL}/coaching/sessions/${sessionId}/end`,
    {},
  );
  return unwrap(res);
};

export const SubmitCoachFeedback = async (
  sessionId: string,
  rating: number,
  comment?: string,
) => {
  const res = await getAuthInstance().post(
    `${API_URL}/coaching/sessions/${sessionId}/feedback`,
    { rating, comment },
  );
  return unwrap(res);
};

export const SetCoachConsent = async (collect: boolean, share: boolean) => {
  const res = await getAuthInstance().post(`${API_URL}/coaching/consent`, {
    collect,
    share,
  });
  return unwrap(res);
};

// Server-side TTS (Azure). Returns { configured:false } when not set up, so the
// caller falls back to the browser speech engine.
export const SynthesizeCoachSpeech = async (
  text: string,
): Promise<{ configured: boolean; audioBase64?: string; contentType?: string }> => {
  const res = await getAuthInstance().post(`${API_URL}/coaching/tts`, { text });
  return unwrap(res);
};
