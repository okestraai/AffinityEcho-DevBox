import React, { useState, useRef, useEffect, useCallback } from "react";
import { SearchUsersForMention } from "../../../api/messaging";

interface MentionUser {
  id: string;
  username: string;
  display_name?: string;
  avatar_emoji?: string;
}

interface MentionTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentionedUserIds: string[]) => void;
  mentionClassName?: string;
}

export function MentionTextarea({
  value,
  onChange,
  onMentionsChange,
  className,
  mentionClassName,
  ...textareaProps
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [mentionedUsers, setMentionedUsers] = useState<Map<string, string>>(
    new Map()
  );
  const [searching, setSearching] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Search users with debounce
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const result = await SearchUsersForMention({
        search: query,
        limit: 5,
      });
      const users = Array.isArray(result)
        ? result
        : result?.users || result?.data || [];
      setSuggestions(
        users.map((u: any) => ({
          id: u.id || u.user_id,
          username: u.username,
          display_name: u.display_name || u.displayName,
          avatar_emoji: u.avatar_emoji || u.demographics?.avatar_emoji,
        }))
      );
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Detect @ trigger and search
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);

    // Find if we're in a mention context
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex >= 0) {
      // Check that @ is at start of text or preceded by whitespace
      const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
      const query = textBeforeCursor.slice(atIndex + 1);

      // Valid mention: @ at start or after whitespace, no spaces in query
      if (
        (charBefore === " " || charBefore === "\n" || atIndex === 0) &&
        !query.includes(" ") &&
        query.length <= 30
      ) {
        setMentionStartIndex(atIndex);
        setSearchQuery(query);
        setSelectedIndex(0);
        setShowSuggestions(true);

        // Debounced search
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchUsers(query), 300);
        return;
      }
    }

    setShowSuggestions(false);
    setMentionStartIndex(-1);
  };

  // Insert mention
  const insertMention = (user: MentionUser) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartIndex < 0) return;

    const before = value.slice(0, mentionStartIndex);
    const cursorPos = textarea.selectionStart || value.length;
    const after = value.slice(cursorPos);

    const mentionText = `@${user.username} `;
    const newValue = before + mentionText + after;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionStartIndex(-1);

    // Track mentioned user
    const updated = new Map(mentionedUsers);
    updated.set(user.username, user.id);
    setMentionedUsers(updated);
    onMentionsChange?.(Array.from(updated.values()));

    // Restore focus and cursor position
    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        const newCursorPos = before.length + mentionText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  // Keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        return;
      }
    }

    // Pass through to parent onKeyDown
    textareaProps.onKeyDown?.(e);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clean up mentioned users when their @username is removed from text
  useEffect(() => {
    const updated = new Map<string, string>();
    mentionedUsers.forEach((id, username) => {
      if (value.includes(`@${username}`)) {
        updated.set(username, id);
      }
    });
    if (updated.size !== mentionedUsers.size) {
      setMentionedUsers(updated);
      onMentionsChange?.(Array.from(updated.values()));
    }
  }, [value]);

  // Calculate dropdown position
  const getDropdownPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };
    // Position above the textarea
    return { bottom: "100%", left: 0, marginBottom: "4px" };
  };

  return (
    <div className="relative flex-1 min-w-0">
      <textarea
        {...textareaProps}
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
      />

      {showSuggestions && (searchQuery.length > 0 || searching) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{ bottom: "100%", left: 0, marginBottom: "4px" }}
        >
          {searching && suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
          ) : suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No users found
            </div>
          ) : (
            suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-800"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(user);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-sm flex-shrink-0">
                  {user.avatar_emoji ||
                    user.username?.[0]?.toUpperCase() ||
                    "?"}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {user.display_name || user.username}
                  </div>
                  {user.display_name && (
                    <div className="text-xs text-gray-500 truncate">
                      @{user.username}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Also export a version for <input> elements (single-line, used in MessagesView)
interface MentionInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentionedUserIds: string[]) => void;
}

export function MentionInput({
  value,
  onChange,
  onMentionsChange,
  className,
  ...inputProps
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [mentionedUsers, setMentionedUsers] = useState<Map<string, string>>(
    new Map()
  );
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const result = await SearchUsersForMention({
        search: query,
        limit: 5,
      });
      const users = Array.isArray(result)
        ? result
        : result?.users || result?.data || [];
      setSuggestions(
        users.map((u: any) => ({
          id: u.id || u.user_id,
          username: u.username,
          display_name: u.display_name || u.displayName,
          avatar_emoji: u.avatar_emoji || u.demographics?.avatar_emoji,
        }))
      );
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);

    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex >= 0) {
      const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
      const query = textBeforeCursor.slice(atIndex + 1);

      if (
        (charBefore === " " || charBefore === "\n" || atIndex === 0) &&
        !query.includes(" ") &&
        query.length <= 30
      ) {
        setMentionStartIndex(atIndex);
        setSelectedIndex(0);
        setShowSuggestions(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchUsers(query), 300);
        return;
      }
    }

    setShowSuggestions(false);
    setMentionStartIndex(-1);
  };

  const insertMention = (user: MentionUser) => {
    const input = inputRef.current;
    if (!input || mentionStartIndex < 0) return;

    const before = value.slice(0, mentionStartIndex);
    const cursorPos = input.selectionStart || value.length;
    const after = value.slice(cursorPos);

    const mentionText = `@${user.username} `;
    const newValue = before + mentionText + after;
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStartIndex(-1);

    const updated = new Map(mentionedUsers);
    updated.set(user.username, user.id);
    setMentionedUsers(updated);
    onMentionsChange?.(Array.from(updated.values()));

    requestAnimationFrame(() => {
      if (input) {
        input.focus();
        const newCursorPos = before.length + mentionText.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        return;
      }
    }

    inputProps.onKeyDown?.(e);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const updated = new Map<string, string>();
    mentionedUsers.forEach((id, username) => {
      if (value.includes(`@${username}`)) {
        updated.set(username, id);
      }
    });
    if (updated.size !== mentionedUsers.size) {
      setMentionedUsers(updated);
      onMentionsChange?.(Array.from(updated.values()));
    }
  }, [value]);

  return (
    <div className="relative flex-1 min-w-0">
      <input
        {...inputProps}
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
      />

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{ bottom: "100%", left: 0, marginBottom: "4px" }}
        >
          {searching && suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
          ) : suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No users found
            </div>
          ) : (
            suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-800"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(user);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-sm flex-shrink-0">
                  {user.avatar_emoji ||
                    user.username?.[0]?.toUpperCase() ||
                    "?"}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {user.display_name || user.username}
                  </div>
                  {user.display_name && (
                    <div className="text-xs text-gray-500 truncate">
                      @{user.username}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
