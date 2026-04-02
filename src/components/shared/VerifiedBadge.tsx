/**
 * Blue checkmark badge shown next to verified company users.
 * Use: <VerifiedBadge /> next to a company name or username.
 */
export function VerifiedBadge({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block flex-shrink-0 ${className}`}
      aria-label="Verified company"
    >
      <circle cx="12" cy="12" r="12" fill="#3B82F6" />
      <path
        d="M9.5 12.5L11 14L15 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
