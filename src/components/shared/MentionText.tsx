import React, { useState } from "react";
import { UserProfileModal } from "../Modals/UserProfileModal";
import { SearchUsersForMention } from "../../../api/messaging";

interface MentionTextProps {
  text: string;
  className?: string;
  onChat?: (userId: string) => void;
}

// Cache resolved usernames → user IDs to avoid repeated API calls
const userCache = new Map<string, string>();

/**
 * Renders text with @mentions highlighted. Mentions appear as styled
 * clickable spans that open the UserProfileModal on click.
 */
export function MentionText({ text, className, onChat }: MentionTextProps) {
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const resolveUser = async (username: string): Promise<string | null> => {
    if (userCache.has(username)) return userCache.get(username)!;
    try {
      const result = await SearchUsersForMention({ search: username, limit: 5 });
      const users = Array.isArray(result)
        ? result
        : result?.users || result?.data || [];
      const match = users.find(
        (u: any) => (u.username || "").toLowerCase() === username.toLowerCase()
      );
      if (match) {
        const id = match.id || match.user_id;
        userCache.set(username, id);
        return id;
      }
    } catch {
      // silently fail
    }
    return null;
  };

  const handleMentionClick = async (username: string) => {
    const userId = await resolveUser(username);
    if (userId) {
      setProfileUserId(userId);
    }
  };

  const parts = parseMentions(text);

  return (
    <>
      <span className={className}>
        {parts.map((part, i) =>
          part.type === "mention" ? (
            <span
              key={i}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleMentionClick(part.username);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleMentionClick(part.username);
              }}
              className="inline-flex items-center px-1 py-0.5 bg-purple-100 text-purple-700 font-semibold rounded cursor-pointer hover:bg-purple-200 hover:text-purple-900 transition-colors text-[0.95em]"
              title={`View @${part.username}'s profile`}
            >
              @{part.username}
            </span>
          ) : (
            <React.Fragment key={i}>{part.text}</React.Fragment>
          )
        )}
      </span>

      {profileUserId && (
        <UserProfileModal
          isOpen={true}
          onClose={() => setProfileUserId(null)}
          userId={profileUserId}
          onChat={onChat || (() => {})}
        />
      )}
    </>
  );
}

type TextPart =
  | { type: "text"; text: string }
  | { type: "mention"; username: string };

function parseMentions(text: string): TextPart[] {
  if (!text) return [];

  const parts: TextPart[] = [];
  // Simple split approach: find @Username patterns
  const regex = /@([A-Za-z0-9_]{1,30})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const startIndex = match.index;
    const username = match[1];

    // Only treat as mention if at start of text or preceded by whitespace
    if (startIndex > 0 && !/\s/.test(text[startIndex - 1])) {
      continue;
    }

    // Add text before this mention
    if (startIndex > lastIndex) {
      parts.push({ type: "text", text: text.slice(lastIndex, startIndex) });
    }

    parts.push({ type: "mention", username });
    lastIndex = startIndex + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: "text", text: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return [{ type: "text", text }];
  }

  return parts;
}
