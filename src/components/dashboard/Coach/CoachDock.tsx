// CoachDock — floating launcher + slide-in panel for Coach by Okestra AI.
// Mounted once in the dashboard shell; self-contained (manages its own open
// state) so it adds no routes and touches no existing feature code.
import { useState } from "react";
import { MessageCircleHeart } from "lucide-react";
import { CoachPanel } from "./CoachPanel";

export function CoachDock() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <div className="fixed right-4 bottom-24 md:bottom-6 z-40 flex flex-col items-end gap-2">
          <style>{`
            @keyframes coachGlow {
              0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.6), 0 10px 30px rgba(79,70,229,0.5); }
              50%      { box-shadow: 0 0 0 16px rgba(99,102,241,0), 0 14px 36px rgba(79,70,229,0.75); }
            }
            @keyframes coachBob {
              0%, 100% { transform: translateY(0); }
              50%      { transform: translateY(-6px); }
            }
            @keyframes coachNudge {
              0%, 70%, 100% { transform: rotate(0deg) scale(1); }
              78% { transform: rotate(-10deg) scale(1.1); }
              84% { transform: rotate(10deg) scale(1.1); }
              90% { transform: rotate(-6deg) scale(1.06); }
              96% { transform: rotate(3deg) scale(1.03); }
            }
            @keyframes coachCallout {
              0%, 100% { transform: translateY(0); opacity: 1; }
              50%      { transform: translateY(-4px); opacity: 0.92; }
            }
            @keyframes coachBeat {
              0%, 100% { transform: scale(1); }
              20% { transform: scale(1.28); }
              35% { transform: scale(0.92); }
              55% { transform: scale(1.2); }
              70% { transform: scale(1); }
            }
            @keyframes coachShine {
              0%   { transform: translateX(-120%) skewX(-20deg); }
              100% { transform: translateX(220%) skewX(-20deg); }
            }
            .coach-bob   { animation: coachBob 3s ease-in-out infinite; }
            .coach-bob:hover { animation-play-state: paused; }
            .coach-fab   { animation: coachGlow 2s ease-in-out infinite, coachNudge 3.2s ease-in-out infinite; transform-origin: center; transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
            .coach-callout { animation: coachCallout 3s ease-in-out infinite; }

            /* HOVER: stop the idle attention motion and do a deliberate grow + heart-beat + shine */
            .coach-fab:hover {
              animation: none;
              transform: scale(1.12);
              box-shadow: 0 18px 46px rgba(79,70,229,0.8);
              filter: brightness(1.06);
            }
            .coach-fab:hover .coach-icon { animation: coachBeat 0.8s ease-in-out infinite; }
            .coach-fab:hover .coach-shine { animation: coachShine 0.9s ease-out 1; }

            @media (prefers-reduced-motion: reduce) {
              .coach-fab, .coach-bob, .coach-callout, .coach-ping, .coach-ping2,
              .coach-fab:hover .coach-icon, .coach-fab:hover .coach-shine { animation: none !important; }
            }
          `}</style>

          {/* attention callout bubble */}
          <div className="coach-callout relative mr-1 rounded-2xl bg-white shadow-xl border border-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            Need a hand? Talk to Coach
            <span className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-indigo-100 rotate-45" />
          </div>

          <div className="coach-bob relative">
            {/* two staggered attention pings */}
            <span className="coach-ping pointer-events-none absolute inset-0 rounded-full bg-indigo-500/40 animate-ping" />
            <span
              className="coach-ping2 pointer-events-none absolute inset-0 rounded-full bg-purple-500/30 animate-ping"
              style={{ animationDelay: "0.6s" }}
            />

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open Coach by Okestra AI"
              className="coach-fab group relative flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white pl-5 pr-6 py-4 shadow-2xl ring-4 ring-white/40 active:scale-95"
            >
              {/* shine sweep on hover */}
              <span className="coach-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/30 blur-md" />
              <MessageCircleHeart className="coach-icon w-7 h-7" />
              <span className="text-base font-bold">Coach</span>
            </button>
          </div>
        </div>
      )}
      <CoachPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        onMinimize={() => setOpen(false)}
      />
    </>
  );
}
