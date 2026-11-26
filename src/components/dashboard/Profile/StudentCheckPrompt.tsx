import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { AnswerStudentCheck } from "../../../../api/profileApis";
import { GRAD_YEARS } from "../../../constants/onboardingOptions";
import { showToast } from "../../../Helper/ShowToast";

// Opened from the twice-yearly "Still a student?" notification.
export function StudentCheckPrompt() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [year, setYear] = useState(
    user?.expected_grad_year ? String(user.expected_grad_year) : "",
  );
  const [busy, setBusy] = useState(false);

  const asked = new URLSearchParams(location.search).get("student-check") === "1";
  if (!asked || !user?.is_student) return null;

  const close = () => {
    const params = new URLSearchParams(location.search);
    params.delete("student-check");
    const rest = params.toString();
    navigate(`${location.pathname}${rest ? `?${rest}` : ""}`, { replace: true });
  };

  const answer = async (stillStudent: boolean) => {
    setBusy(true);
    try {
      await AnswerStudentCheck(
        stillStudent
          ? { stillStudent, expectedGradYear: year ? Number(year) : null }
          : { stillStudent },
      );
      updateUser(
        stillStudent
          ? { expected_grad_year: year ? Number(year) : null }
          : { is_student: false, expected_grad_year: null },
      );
      showToast(
        stillStudent ? "Thanks, you keep the Students space." : "Your school is now saved as a past school.",
        "success",
      );
      close();
    } catch {
      showToast("Couldn't save your answer. Try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-check-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-emerald-600" />
          <h2 id="student-check-title" className="text-lg font-bold text-gray-900">
            Still a student?
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Students keep the Students space. If you've finished, your school is kept as a past school.
        </p>
        <div>
          <label htmlFor="student-check-year" className="block text-sm font-medium text-gray-700 mb-1">
            Expected to finish <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <select
            id="student-check-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white min-h-[44px]"
          >
            <option value="">Not sure</option>
            {GRAD_YEARS.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => answer(true)}
            disabled={busy}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50 min-h-[44px]"
          >
            Yes, still studying
          </button>
          <button
            type="button"
            onClick={() => answer(false)}
            disabled={busy}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold disabled:opacity-50 min-h-[44px]"
          >
            No, I've finished
          </button>
        </div>
        <button type="button" onClick={close} className="w-full text-sm text-gray-500 hover:text-gray-700 min-h-[44px]">
          Not now
        </button>
      </div>
    </div>
  );
}
