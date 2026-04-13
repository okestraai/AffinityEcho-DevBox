/**
 * TrimInput / TrimTextarea
 *
 * Drop-in replacements for <input> and <textarea> that automatically trim
 * leading/trailing whitespace when the user leaves the field (onBlur).
 *
 * Usage:
 *   import { TrimInput, TrimTextarea } from '@/components/shared/TrimInput';
 *
 *   <TrimInput
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *     onTrim={(trimmed) => setEmail(trimmed)}   // optional — called after trim
 *     type="email"
 *     placeholder="you@example.com"
 *     className="..."
 *   />
 *
 * Notes:
 *   - Trimming happens on blur only (not on every keystroke).
 *   - `onTrim` is an optional extra callback fired with the trimmed value;
 *     use it when the parent state needs to be updated after blur.
 *   - All other native <input> / <textarea> props are forwarded as-is.
 *   - Password fields should generally not use this (spaces are valid in passwords).
 */

import React from "react";

// ─── TrimInput ────────────────────────────────────────────────────────────────

export interface TrimInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Called with the trimmed value after the field loses focus. */
  onTrim?: (trimmedValue: string) => void;
}

export const TrimInput = React.forwardRef<HTMLInputElement, TrimInputProps>(
  ({ onBlur, onChange, onTrim, value, ...rest }, ref) => {
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const trimmed = e.target.value.trim();
      if (trimmed !== e.target.value) {
        // Synthesise a change event so parent state stays in sync
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: trimmed },
          currentTarget: { ...e.currentTarget, value: trimmed },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
        onTrim?.(trimmed);
      } else {
        onTrim?.(trimmed);
      }
      onBlur?.(e);
    };

    return (
      <input
        ref={ref}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        {...rest}
      />
    );
  }
);

TrimInput.displayName = "TrimInput";

// ─── TrimTextarea ─────────────────────────────────────────────────────────────

export interface TrimTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Called with the trimmed value after the field loses focus. */
  onTrim?: (trimmedValue: string) => void;
}

export const TrimTextarea = React.forwardRef<
  HTMLTextAreaElement,
  TrimTextareaProps
>(({ onBlur, onChange, onTrim, value, ...rest }, ref) => {
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const trimmed = e.target.value.trim();
    if (trimmed !== e.target.value) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: trimmed },
        currentTarget: { ...e.currentTarget, value: trimmed },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange?.(syntheticEvent);
      onTrim?.(trimmed);
    } else {
      onTrim?.(trimmed);
    }
    onBlur?.(e);
  };

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onBlur={handleBlur}
      {...rest}
    />
  );
});

TrimTextarea.displayName = "TrimTextarea";
