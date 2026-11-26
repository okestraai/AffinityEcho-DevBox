import { useState } from "react";
import { Mail, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { SendSignInCode, VerifySignInCode } from "../../../api/authApis";
import { useAuth, type CodeSignInData } from "../../contexts/AuthContext";

interface Props {
  // Called once the member is signed in.
  onSignedIn: (data: CodeSignInData) => void;
  // Ask for a name, so a new account doesn't need onboarding to know it.
  askName?: boolean;
  submitLabel?: string;
}

const errorText = (error: unknown, fallback: string) => {
  const e = error as { response?: { data?: { message?: string | string[] } } };
  const m = e.response?.data?.message;
  return (Array.isArray(m) ? m[0] : m) || fallback;
};

// "Email me a code": email (and name), then the 6-digit code. New emails get an account.
export function CodeSignIn({ onSignedIn, askName = false, submitLabel = "Email me a code" }: Props) {
  const { signInWithCode } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [terms, setTerms] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const nameOk = !askName || firstName.trim().length > 0;

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await SendSignInCode(email.trim());
      setNote(res?.message ?? "If this email can sign in, a code is on its way.");
      setStep("code");
    } catch (e) {
      setError(errorText(e, "We couldn't send the code. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = (await VerifySignInCode({
        email: email.trim(),
        code: code.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        termsAccepted: terms,
      })) as CodeSignInData;
      await signInWithCode(data);
      onSignedIn(data);
    } catch (e) {
      setError(errorText(e, "That code didn't work. Check it and try again."));
    } finally {
      setBusy(false);
    }
  };

  if (step === "code") {
    return (
      <div className="space-y-3">
        {note && <p className="text-sm text-gray-600">{note} Check {email.trim()}.</p>}
        <label htmlFor="sign-in-code" className="block text-sm font-medium text-gray-700">
          6-digit code
        </label>
        <input
          id="sign-in-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full px-3 py-3 border border-gray-300 rounded-xl text-lg tracking-[0.4em] text-center min-h-[44px]"
        />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={verify}
          disabled={busy || code.length !== 6}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50 min-h-[44px]"
        >
          <KeyRound className="w-4 h-4" /> {busy ? "Checking..." : "Continue"}
        </button>
        <div className="flex justify-between text-sm">
          <button type="button" onClick={() => setStep("email")} className="text-gray-600 underline min-h-[44px]">
            Use another email
          </button>
          <button type="button" onClick={send} disabled={busy} className="text-purple-700 underline min-h-[44px]">
            Send a new code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {askName && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="code-first-name" className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input id="code-first-name" value={firstName} maxLength={60} onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl min-h-[44px]" />
          </div>
          <div>
            <label htmlFor="code-last-name" className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input id="code-last-name" value={lastName} maxLength={60} onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl min-h-[44px]" />
          </div>
        </div>
      )}
      <div>
        <label htmlFor="code-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input id="code-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl min-h-[44px]" />
      </div>
      <label className="flex items-start gap-2 text-sm text-gray-700 min-h-[44px]">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 w-4 h-4" />
        <span>
          I agree to the <Link to="/terms" className="text-purple-700 underline">Terms</Link> and{" "}
          <Link to="/privacy" className="text-purple-700 underline">Privacy Policy</Link>.
        </span>
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={send}
        disabled={busy || !emailOk || !nameOk || !terms}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50 min-h-[44px]"
      >
        <Mail className="w-4 h-4" /> {busy ? "Sending..." : submitLabel}
      </button>
    </div>
  );
}
