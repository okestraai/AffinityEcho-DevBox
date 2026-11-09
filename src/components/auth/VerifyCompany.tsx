import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export function VerifyCompany() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  // The token works once, so never send it twice (React runs effects twice in development).
  const started = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    // Older email links verify on the server first, then land here with the result.
    const result = searchParams.get("status");
    if (!token && result) {
      const reason = searchParams.get("reason");
      setStatus(result === "success" ? "success" : "error");
      setMessage(
        result === "success"
          ? "Your company has been verified! You now have a verified badge."
          : reason === "expired"
            ? "This verification link has expired. Request a new one from your profile."
            : reason === "invalid_token"
              ? "This verification link is invalid or has already been used."
              : "Something went wrong. Please try again.",
      );
      return;
    }
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }
    if (started.current) return;
    started.current = true;

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/user/verify-company/${encodeURIComponent(token)}`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        if (res.ok && data?.success) {
          setStatus("success");
          setMessage("Your company has been verified! You now have a verified badge.");
        } else {
          setStatus("error");
          setMessage(data?.message || "Verification failed. The link may have expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md w-full p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Verifying your company...</h2>
            <p className="text-sm text-gray-500">Please wait while we confirm your affiliation.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Company Verified!</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate("/dashboard/profile?tab=settings")}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Profile
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate("/dashboard/profile?tab=settings")}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
