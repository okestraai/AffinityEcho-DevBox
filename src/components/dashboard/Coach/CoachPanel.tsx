import { useEffect, useRef, useState } from "react";
import {
  X,
  Send,
  Mic,
  Square,
  Volume2,
  VolumeX,
  Loader2,
  MessageCircleHeart,
  RotateCcw,
  LifeBuoy,
  Info,
  Minus,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCoachTurn } from "./useCoachTurn";
import { CoachFeedbackCard } from "./CoachFeedbackCard";
import { CoachStage } from "../../../../api/coachApis";

interface CoachPanelProps {
  isOpen: boolean;
  /** End the session and close (the X button). */
  onClose: () => void;
  /** Hide the panel but keep the session alive (the minimize button). */
  onMinimize: () => void;
}

const STAGE_LABEL: Record<CoachStage, string> = {
  OPENING: "Opening",
  GOAL: "Goal",
  REALITY: "Reality",
  OPTIONS: "Options",
  WILL: "Will",
  CLOSING: "Closing",
};

const STAGE_ORDER: CoachStage[] = [
  "GOAL",
  "REALITY",
  "OPTIONS",
  "WILL",
  "CLOSING",
];

export function CoachPanel({ isOpen, onClose, onMinimize }: CoachPanelProps) {
  const navigate = useNavigate();
  const coach = useCoachTurn();
  const [draft, setDraft] = useState("");

  // Closing the panel ends the session (one of the two ways a session ends —
  // the other is the inactivity flow). The coach never ends it on its own.
  const handleClose = async () => {
    // If this session is sampled for feedback, the panel stays open on the
    // feedback card instead of closing.
    const keepOpenForFeedback = await coach.endSession();
    if (!keepOpenForFeedback) onClose();
  };
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const started = coach.messages.length > 0 || coach.phase === "starting";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [coach.messages, coach.interim, coach.phase]);

  // On open: pause/resume the inactivity flow, and (when there's no live session
  // in memory) look for a recent session the user can pick back up.
  useEffect(() => {
    if (!isOpen) {
      coach.pauseInactivity();
    } else {
      if (!started && !coach.isComplete) coach.loadResumable();
      if (started && !coach.isComplete && coach.phase === "idle")
        coach.resumeInactivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Put the cursor in the message box whenever it's ready for input.
  useEffect(() => {
    if (
      isOpen &&
      started &&
      !coach.isComplete &&
      !coach.listening &&
      coach.phase === "idle"
    ) {
      textareaRef.current?.focus();
    }
  }, [isOpen, started, coach.isComplete, coach.listening, coach.phase]);

  if (!isOpen) return null;

  const busy =
    coach.phase === "starting" ||
    coach.phase === "thinking" ||
    coach.phase === "coach_speaking";

  const submitDraft = () => {
    const text = draft.trim();
    if (!text || busy || coach.isComplete) return;
    setDraft("");
    void coach.sendText(text);
  };

  const isCrisis = coach.isComplete && coach.crisis;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-stretch justify-end">
      <div className="w-full sm:max-w-md md:max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <MessageCircleHeart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">
                  Coach
                </h2>
                <p className="text-indigo-100 text-xs">
                  by Okestra AI · non-clinical
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={coach.toggleVoice}
                title={coach.voiceEnabled ? "Voice on" : "Voice off"}
                className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
              >
                {coach.voiceEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>
              <button
                type="button"
                onClick={onMinimize}
                title="Minimize (keep session)"
                aria-label="Minimize"
                className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                title="End session"
                aria-label="End session"
                className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* GROW stage progress */}
          {started && (
            <div className="mt-3 flex items-center gap-1.5">
              {STAGE_ORDER.map((s) => {
                const reached =
                  STAGE_ORDER.indexOf(s) <= STAGE_ORDER.indexOf(coach.stage) ||
                  coach.stage === "CLOSING";
                const current = coach.stage === s;
                return (
                  <div key={s} className="flex-1">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        reached ? "bg-white" : "bg-white/30"
                      }`}
                    />
                    <span
                      className={`block mt-1 text-[10px] text-center ${
                        current ? "text-white font-semibold" : "text-indigo-200"
                      }`}
                    >
                      {STAGE_LABEL[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pinned disclaimer — always visible, never part of the conversation */}
        <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100 text-[11px] leading-snug text-amber-800">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Coach by Okestra AI is an AI coaching companion — not a human or a
            therapist, and not a substitute for professional care.
          </span>
        </div>

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50">
          {!started && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                <MessageCircleHeart className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">
                A space to think out loud
              </h3>
              <p className="text-gray-500 text-sm mt-2 max-w-xs">
                Coach by Okestra AI coaches by asking, not telling — it helps
                you find your own next step using the GROW method. It is not
                therapy.
              </p>
              <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
                {coach.resumable && (
                  <button
                    type="button"
                    onClick={coach.resume}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Continue where you left off
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => coach.start(false)}
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    coach.resumable
                      ? "bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:opacity-95"
                  }`}
                >
                  Start a new text session
                </button>
                <button
                  type="button"
                  onClick={() => coach.start(true)}
                  className="w-full py-3 rounded-xl bg-white border border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" /> Start a voice session
                </button>
              </div>
            </div>
          )}

          {coach.messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "client" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-2xl px-4 py-3 text-[15px] leading-7 shadow-sm whitespace-pre-wrap break-words ${
                  m.role === "client"
                    ? "max-w-[85%] bg-indigo-600 text-white rounded-br-md"
                    : "max-w-[90%] bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {/* live interim transcript while listening */}
          {coach.listening && coach.interim && (
            <div className="flex justify-end">
              <div className="max-w-[82%] rounded-2xl px-4 py-2.5 text-sm bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-br-md italic">
                {coach.interim}
              </div>
            </div>
          )}

          {(coach.phase === "thinking" || coach.phase === "coach_speaking") && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-white border border-gray-200 rounded-bl-md">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              </div>
            </div>
          )}

          {coach.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {coach.error}
            </div>
          )}

          {isCrisis && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/crisis-resources");
              }}
              className="w-full flex items-center gap-2 justify-center py-3 rounded-xl bg-rose-600 text-white font-semibold shadow-lg hover:bg-rose-700 transition"
            >
              <LifeBuoy className="w-4 h-4" /> See crisis support resources
            </button>
          )}

          {coach.isComplete && !isCrisis &&
            (coach.askFeedback && !coach.feedbackGiven ? (
              <CoachFeedbackCard
                onSubmit={coach.submitFeedback}
                onSkip={coach.skipFeedback}
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                {coach.feedbackGiven && (
                  <p className="text-sm font-medium text-emerald-600">
                    Thanks for your feedback!
                  </p>
                )}
                <p className="text-sm text-gray-500">This session has ended.</p>
                <button
                  type="button"
                  onClick={coach.continueSession}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow hover:opacity-95 transition"
                >
                  <Play className="w-4 h-4" /> Continue where you left off
                </button>
                <button
                  type="button"
                  onClick={coach.reset}
                  className="inline-flex items-center gap-2 text-gray-500 font-medium text-sm hover:text-indigo-600"
                >
                  <RotateCcw className="w-4 h-4" /> Start a new session
                </button>
              </div>
            ))}
        </div>

        {/* Composer */}
        {started && !coach.isComplete && (
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                autoFocus
                value={coach.listening ? coach.interim : draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitDraft();
                  }
                }}
                disabled={busy || coach.listening}
                placeholder={
                  coach.listening ? "Listening…" : "Type your reply…"
                }
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 max-h-32 disabled:bg-gray-50"
              />
              {coach.voiceEnabled ? (
                coach.listening ? (
                  <button
                    type="button"
                    onClick={coach.stopListening}
                    className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow hover:bg-rose-700 transition shrink-0"
                    title="Stop and send"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={coach.startListening}
                    disabled={busy}
                    className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow hover:bg-indigo-700 transition shrink-0 disabled:opacity-50"
                    title="Tap to talk"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={submitDraft}
                  disabled={busy || !draft.trim()}
                  className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow hover:bg-indigo-700 transition shrink-0 disabled:opacity-50"
                  title="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
