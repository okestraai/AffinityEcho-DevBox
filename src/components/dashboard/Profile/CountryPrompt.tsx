import { useMemo, useState } from "react";
import { Globe2, X } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { DismissCountryPrompt, UpdateEditableProfile } from "../../../../api/profileApis";
import { countryOptions, guessCountry } from "../../../constants/countries";
import { showToast } from "../../../Helper/ShowToast";

// Asks members who joined before country was collected where they are based. Shown once.
export function CountryPrompt() {
  const { user, updateUser } = useAuth();
  const countries = useMemo(() => countryOptions(), []);
  const [country, setCountry] = useState(guessCountry());
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (
    hidden ||
    !user?.has_completed_onboarding ||
    user.country_code ||
    user.country_prompt_dismissed_at
  ) {
    return null;
  }

  const save = async () => {
    if (!country) return;
    setBusy(true);
    try {
      await UpdateEditableProfile({ basic: { country_code: country } });
      updateUser({ country_code: country });
      setHidden(true);
    } catch {
      showToast("Couldn't save your country. Try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async () => {
    setHidden(true);
    updateUser({ country_prompt_dismissed_at: new Date().toISOString() });
    try {
      await DismissCountryPrompt();
    } catch {
      // It will ask once more next time; nothing else is lost.
    }
  };

  return (
    <div
      role="region"
      aria-label="Where are you based?"
      className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border border-purple-200 rounded-2xl shadow-sm"
    >
      <Globe2 className="w-6 h-6 text-purple-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Where are you based?</p>
        <p className="text-xs text-gray-600">
          It helps us show safety help and dates that fit where you live.
        </p>
      </div>
      <select
        aria-label="Country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px]"
      >
        <option value="">Choose your country</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!country || busy}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold disabled:opacity-50 min-h-[44px]"
        >
          Save
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 min-h-[44px]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
