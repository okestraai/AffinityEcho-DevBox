import { useState } from "react";
import { Star } from "lucide-react";

interface Props {
  onSubmit: (rating: number, comment?: string) => void;
  onSkip: () => void;
}

// Simple post-session feedback: a 1-5 star rating plus an optional comment.
// The inputs feed Coach's self-learning loop.
export function CoachFeedbackCard({ onSubmit, onSkip }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="w-full max-w-sm mx-auto bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm">
      <p className="text-center text-sm font-semibold text-gray-800">
        How was this session?
      </p>
      <p className="text-center text-xs text-gray-500 mb-3">
        Your feedback helps Coach get better.
      </p>

      <div className="flex justify-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="p-0.5 transition-transform active:scale-90"
          >
            <Star
              className={`w-8 h-8 ${
                (hover || rating) >= n
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="Anything you'd like to add? (optional)"
        className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
        >
          Skip
        </button>
        <button
          type="button"
          disabled={rating === 0}
          onClick={() => onSubmit(rating, comment.trim() || undefined)}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow hover:opacity-95 transition disabled:opacity-40"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
