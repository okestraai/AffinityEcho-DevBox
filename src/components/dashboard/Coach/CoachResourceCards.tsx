// Clickable in-product resource cards rendered under a coach message.
// Mentors show as a horizontal carousel of profile cards; topics and posts as
// tappable rows. Clicking routes to the real page (and minimizes the panel).
import { MessageSquare, FileText, ArrowUpRight } from "lucide-react";
import { CoachResourceLinks } from "../../../../api/coachApis";

interface Props {
  resources: CoachResourceLinks;
  onOpen: (path: string) => void;
}

export function CoachResourceCards({ resources, onOpen }: Props) {
  const { mentors, topics, posts } = resources;
  if (!mentors.length && !topics.length && !posts.length) return null;

  return (
    <div className="mt-2 max-w-[92%] space-y-2">
      {mentors.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 mb-1 px-0.5">
            Mentors you can reach out to
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
            {mentors.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => onOpen(`/dashboard/profile/${m.userId}`)}
                className="snap-start shrink-0 w-44 text-left bg-white border border-indigo-100 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition"
              >
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shrink-0">
                    {m.handle.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      @{m.handle}
                    </p>
                    <p className="text-[10px] text-indigo-600 font-medium">
                      Mentor
                    </p>
                  </div>
                </div>
                {m.expertise && (
                  <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">
                    {m.expertise}
                  </p>
                )}
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                  View profile <ArrowUpRight className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {topics.map((t) => (
        <button
          key={t.topicId}
          type="button"
          onClick={() => onOpen(`/dashboard/forums/topic/${t.topicId}`)}
          className="w-full flex items-center gap-2 text-left bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-indigo-300 hover:shadow-sm transition"
        >
          <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-gray-800 truncate">
              {t.title}
            </span>
            <span className="block text-[11px] text-gray-400">
              {t.forum} forum
            </span>
          </span>
          <ArrowUpRight className="w-4 h-4 text-gray-300 shrink-0" />
        </button>
      ))}

      {posts.map((p) => (
        <button
          key={p.postId}
          type="button"
          onClick={() => onOpen(`/dashboard/feeds/post/${p.postId}`)}
          className="w-full flex items-center gap-2 text-left bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-indigo-300 hover:shadow-sm transition"
        >
          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="min-w-0 flex-1 text-sm text-gray-700 truncate">
            {p.snippet}
          </span>
          <ArrowUpRight className="w-4 h-4 text-gray-300 shrink-0" />
        </button>
      ))}
    </div>
  );
}
