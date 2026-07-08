// useCoachTurn — client-side turn state machine for the Coach by Okestra AI panel.
//
// The coach NEVER ends a session itself. A session ends only when:
//   • the user closes the panel (endSession), or
//   • the inactivity flow elapses with no response:
//       idle → "are you still there?" → final warning → end.
// Voice is additive: STT via the browser Web Speech API, TTS via the server
// (Azure) with a browser speechSynthesis fallback.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  StartCoachSession,
  SendCoachTurn,
  EndCoachSession,
  GetLatestCoachSession,
  SubmitCoachFeedback,
  SynthesizeCoachSpeech,
  CoachStage,
  CoachResourceLinks,
} from "../../../../api/coachApis";

export type CoachPhase =
  | "idle"
  | "starting"
  | "coach_speaking"
  | "listening"
  | "thinking"
  | "completed"
  | "error";

export interface CoachMessage {
  role: "coach" | "client";
  content: string;
  resources?: CoachResourceLinks;
}

// Inactivity flow timings (ms). Generous, because coaching involves real
// thinking pauses — we don't want to nag someone who's reflecting.
const IDLE_PROMPT_MS = 180_000; // 3 min of silence before "are you still there?"
const IDLE_WARN_MS = 120_000; // then 2 more min before the final warning
const IDLE_END_MS = 90_000; // then 1.5 more min before ending (~6.5 min total)

export function useCoachTurn() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [phase, setPhase] = useState<CoachPhase>("idle");
  const [stage, setStage] = useState<CoachStage>("OPENING");
  const [isComplete, setIsCompleteState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [crisis, setCrisis] = useState(false);
  const [askFeedback, setAskFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [resumable, setResumable] = useState<{
    sessionId: string;
    stage: CoachStage;
    messages: CoachMessage[];
  } | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef(false);
  const completeRef = useRef(false);
  const idleTimersRef = useRef<number[]>([]);

  const setComplete = (v: boolean) => {
    completeRef.current = v;
    setIsCompleteState(v);
  };

  // ─── voice output ─────────────────────────────────────────────────────────

  const browserSpeak = (text: string): Promise<void> =>
    new Promise((resolve) => {
      try {
        const synth = window.speechSynthesis;
        if (!synth) return resolve();
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.98;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        synth.speak(u);
      } catch {
        resolve();
      }
    });

  const speak = useCallback(async (text: string) => {
    if (!voiceRef.current) return;
    try {
      const res = await SynthesizeCoachSpeech(text);
      if (res?.configured && res.audioBase64) {
        const blob = await (
          await fetch(`data:${res.contentType};base64,${res.audioBase64}`)
        ).blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        await new Promise<void>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.play().catch(() => resolve());
        });
        return;
      }
    } catch {
      /* fall through to browser TTS */
    }
    await browserSpeak(text);
  }, []);

  // ─── inactivity flow ───────────────────────────────────────────────────────

  const clearIdle = useCallback(() => {
    idleTimersRef.current.forEach((t) => clearTimeout(t));
    idleTimersRef.current = [];
  }, []);

  const endByInactivity = useCallback(() => {
    clearIdle();
    const sid = sessionIdRef.current;
    setMessages((prev) => [
      ...prev,
      {
        role: "coach",
        content:
          "I haven't heard back, so I'll close our session here for now. Reopen the panel whenever you'd like to pick things back up.",
      },
    ]);
    setComplete(true);
    setPhase("completed");
    if (sid) {
      EndCoachSession(sid)
        .then((res) => {
          if (res?.askFeedback) {
            setAskFeedback(true);
            setFeedbackGiven(false);
          }
        })
        .catch(() => {});
    }
  }, [clearIdle]);

  // Arm the idle sequence; called whenever we hand the floor back to the user.
  const armIdle = useCallback(() => {
    clearIdle();
    if (completeRef.current || !sessionIdRef.current) return;
    idleTimersRef.current.push(
      window.setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "coach",
            content: "Are you still there? I'm here whenever you're ready.",
          },
        ]);
        void speak("Are you still there?");
      }, IDLE_PROMPT_MS),
    );
    idleTimersRef.current.push(
      window.setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "coach",
            content:
              "I still haven't heard from you, so I'll close our session shortly if you're away.",
          },
        ]);
        void speak("I still haven't heard from you, so I'll close our session shortly if you're away.");
      }, IDLE_PROMPT_MS + IDLE_WARN_MS),
    );
    idleTimersRef.current.push(
      window.setTimeout(
        () => endByInactivity(),
        IDLE_PROMPT_MS + IDLE_WARN_MS + IDLE_END_MS,
      ),
    );
  }, [clearIdle, speak, endByInactivity]);

  useEffect(() => () => clearIdle(), [clearIdle]);

  // ─── turns ──────────────────────────────────────────────────────────────--

  const start = useCallback(
    async (withVoice: boolean) => {
      clearIdle();
      setError(null);
      setMessages([]);
      setComplete(false);
      setCrisis(false);
      setAskFeedback(false);
      setFeedbackGiven(false);
      setVoiceEnabled(withVoice);
      voiceRef.current = withVoice;
      setPhase("starting");
      try {
        const r = await StartCoachSession(withVoice ? "voice" : "text");
        sessionIdRef.current = r.sessionId;
        setStage(r.stage);
        setMessages([{ role: "coach", content: r.coachMessage }]);
        setPhase("coach_speaking");
        await speak(r.coachMessage);
        setPhase("idle");
        armIdle();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not start the session.",
        );
        setPhase("error");
      }
    },
    [speak, clearIdle, armIdle],
  );

  const sendText = useCallback(
    async (text: string) => {
      const msg = text.trim();
      const sid = sessionIdRef.current;
      if (!msg || !sid || completeRef.current) return;
      clearIdle();
      setInterim("");
      setMessages((prev) => [...prev, { role: "client", content: msg }]);
      setPhase("thinking");
      try {
        const r = await SendCoachTurn(sid, msg, voiceRef.current ? "voice" : "text");
        setStage(r.stage);
        setMessages((prev) => [
          ...prev,
          { role: "coach", content: r.coachMessage, resources: r.resources },
        ]);
        if (r.safety?.status === "crisis") {
          setCrisis(true);
          setComplete(true);
          setPhase("coach_speaking");
          await speak(r.coachMessage);
          setPhase("completed");
          return;
        }
        setPhase("coach_speaking");
        await speak(r.coachMessage);
        // The user signalled they're done — Coach said goodbye and ended it.
        if (r.isComplete) {
          setComplete(true);
          if (r.askFeedback) {
            setAskFeedback(true);
            setFeedbackGiven(false);
          }
          setPhase("completed");
          return;
        }
        setPhase("idle");
        armIdle();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setPhase("error");
      }
    },
    [speak, clearIdle, armIdle],
  );

  // ─── voice input (Web Speech API) ──────────────────────────────────────────

  const startListening = useCallback(() => {
    const w = window as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError("Voice input isn't supported in this browser — type instead.");
      return;
    }
    clearIdle();
    audioRef.current?.pause();
    let finalTranscript = "";
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + " ";
        else live += e.results[i][0].transcript;
      }
      setInterim(finalTranscript + live);
    };
    r.onerror = () => {};
    r.onend = () => {
      setListening(false);
      const said = finalTranscript.trim();
      if (said) void sendText(said);
      else {
        setPhase("idle");
        armIdle();
      }
    };
    recognitionRef.current = r;
    setListening(true);
    setPhase("listening");
    r.start();
  }, [sendText, clearIdle, armIdle]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((v) => {
      voiceRef.current = !v;
      return !v;
    });
  }, []);

  const reset = useCallback(() => {
    clearIdle();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    sessionIdRef.current = null;
    setMessages([]);
    setInterim("");
    setComplete(false);
    setCrisis(false);
    setAskFeedback(false);
    setFeedbackGiven(false);
    setError(null);
    setStage("OPENING");
    setPhase("idle");
  }, [clearIdle]);

  // Look for a recent session the user can pick back up (after disconnect/reload).
  const loadResumable = useCallback(async () => {
    try {
      const latest = await GetLatestCoachSession();
      if (latest && latest.resumable && latest.messages?.length) {
        setResumable({
          sessionId: latest.sessionId,
          stage: latest.stage,
          messages: latest.messages,
        });
      } else {
        setResumable(null);
      }
    } catch {
      setResumable(null);
    }
  }, []);

  // Resume a previous session fetched from the server (fresh hook / after reload).
  const resume = useCallback(() => {
    if (!resumable) return;
    clearIdle();
    sessionIdRef.current = resumable.sessionId;
    setStage(resumable.stage);
    setMessages(resumable.messages);
    setComplete(false);
    setCrisis(false);
    setError(null);
    setVoiceEnabled(false);
    voiceRef.current = false;
    setResumable(null);
    setPhase("idle");
    armIdle();
  }, [resumable, clearIdle, armIdle]);

  // Continue the in-memory session after the inactivity flow ended it.
  const continueSession = useCallback(() => {
    if (!sessionIdRef.current || messages.length === 0) return;
    setComplete(false);
    setError(null);
    setPhase("idle");
    armIdle();
  }, [messages.length, armIdle]);

  // End (used when the user closes the panel). If this session is sampled for
  // feedback, keep the panel open on the feedback card and return true so the
  // caller doesn't close it; otherwise reset and return false.
  const endSession = useCallback(async (): Promise<boolean> => {
    const sid = sessionIdRef.current;
    clearIdle();
    if (sid && !completeRef.current) {
      try {
        const res = await EndCoachSession(sid);
        if (res?.askFeedback) {
          setComplete(true);
          setCrisis(false);
          setAskFeedback(true);
          setFeedbackGiven(false);
          setPhase("completed");
          return true;
        }
      } catch {
        /* fall through to reset */
      }
    }
    reset();
    return false;
  }, [reset, clearIdle]);

  const submitFeedback = useCallback(
    async (rating: number, comment?: string) => {
      const sid = sessionIdRef.current;
      if (sid) {
        try {
          await SubmitCoachFeedback(sid, rating, comment);
        } catch {
          /* best-effort */
        }
      }
      setFeedbackGiven(true);
    },
    [],
  );

  const skipFeedback = useCallback(() => {
    setAskFeedback(false);
    setFeedbackGiven(true);
  }, []);

  return {
    messages,
    phase,
    stage,
    isComplete,
    crisis,
    error,
    voiceEnabled,
    listening,
    interim,
    resumable,
    askFeedback,
    feedbackGiven,
    submitFeedback,
    skipFeedback,
    start,
    sendText,
    startListening,
    stopListening,
    toggleVoice,
    reset,
    endSession,
    loadResumable,
    resume,
    continueSession,
    // Inactivity timers pause while the panel is minimized and resume on restore.
    pauseInactivity: clearIdle,
    resumeInactivity: armIdle,
  };
}
