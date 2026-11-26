import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { SetPassword } from "../../../api/authApis";
import { validatePassword } from "../../utils/passwordUtils";
import PasswordStrengthIndicator from "../shared/PasswordStrengthIndicator";
import { showToast } from "../../Helper/ShowToast";

// The optional step after signing in with an email code. Skipping it is fine: codes keep working.
export function SetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const raw = (location.state as { next?: string } | null)?.next;
  const next = raw && /^\/[A-Za-z0-9/_-]*$/.test(raw) ? raw : "/events";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const problem = password ? validatePassword(password) : null;

  const save = async () => {
    setBusy(true);
    try {
      await SetPassword(password);
      showToast("Password set.", "success");
      navigate(next, { replace: true });
    } catch (e) {
      const m = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      showToast(m || "Couldn't set the password.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <KeyRound className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-bold text-gray-900">Set a password (optional)</h1>
        </div>
        <p className="text-sm text-gray-600">You can keep signing in with an email code, or add a password now.</p>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl min-h-[44px]" />
          <PasswordStrengthIndicator password={password} />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl min-h-[44px]" />
        </div>
        {problem && <p className="text-sm text-red-600">{problem}</p>}
        <button type="button" onClick={save} disabled={busy || !password || !!problem || password !== confirm}
          className="w-full px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50 min-h-[44px]">
          {busy ? "Saving..." : "Set password"}
        </button>
        <button type="button" onClick={() => navigate(next, { replace: true })} className="w-full text-sm text-gray-600 underline min-h-[44px]">
          Skip for now
        </button>
      </div>
    </main>
  );
}
