import type { ReactNode } from 'react';
import { PublicHeader } from './PublicHeader';

/**
 * Wrapper for PUBLIC (unauthenticated) routes: the marketing header plus the page.
 *
 * Deliberately NOT used by `DashboardLayout` or `AdminLayout` — those render their own headers, so
 * the marketing nav can never appear behind auth. Also not used by the transient auth steps
 * (OTP, reset-password, callback): a Solutions dropdown next to "enter your 6-digit code" invites
 * the user to wander off mid-verification and lose the flow.
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <PublicHeader />
      {children}
    </div>
  );
}
