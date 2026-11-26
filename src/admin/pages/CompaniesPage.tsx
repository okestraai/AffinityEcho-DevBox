import { useCallback, useEffect, useState } from "react";
import { Building2, Plus, Loader2, Users } from "lucide-react";
import {
  AddCompany,
  GetAdminCompanies,
  GetCompanySuggestions,
  SetCompanyActive,
  type AdminCompany,
} from "../../../api/adminApis";
import { showToast } from "../../Helper/ShowToast";
import { getApiError } from "../utils/apiError";
import { usePermission } from "../hooks/usePermission";
import { PERMISSIONS } from "../types/permissions";

// The company list members pick from in onboarding, for every country.
export function CompaniesPage() {
  const { hasPermission } = usePermission();
  const canAdd = hasPermission(PERMISSIONS.FORUMS_CREATE);
  const canEdit = hasPermission(PERMISSIONS.FORUMS_UPDATE);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [suggestions, setSuggestions] = useState<{ name: string; members: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, suggested] = await Promise.all([
        GetAdminCompanies(),
        GetCompanySuggestions(),
      ]);
      setCompanies(Array.isArray(list) ? list : []);
      setSuggestions(Array.isArray(suggested) ? suggested : []);
    } catch (err) {
      showToast(getApiError(err, "Couldn't load companies"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (companyName: string) => {
    if (companyName.trim().length < 2) return;
    setBusy(true);
    try {
      const result = await AddCompany(companyName.trim());
      showToast(
        result.membersMoved
          ? `Added ${result.company.name}. ${result.membersMoved} member(s) moved into its space.`
          : `Added ${result.company.name}.`,
        "success",
      );
      setName("");
      await load();
    } catch (err) {
      showToast(getApiError(err, "Couldn't add the company"), "error");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (company: AdminCompany) => {
    try {
      await SetCompanyActive(company.id, !company.is_active);
      setCompanies((list) =>
        list.map((c) => (c.id === company.id ? { ...c, is_active: !c.is_active } : c)),
      );
    } catch (err) {
      showToast(getApiError(err, "Couldn't update the company"), "error");
    }
  };

  const shown = companies.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-purple-600" /> Companies
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Members anywhere pick from this list or type their own. Adding a
          company creates its private forums and moves members who typed it
          into its space.
        </p>
      </div>

      {canAdd && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(name);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            aria-label="Company name"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            placeholder="Company name, from any country"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[44px]"
          />
          <button
            type="submit"
            disabled={busy || name.trim().length < 2}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold disabled:opacity-50 min-h-[44px]"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add company
          </button>
        </form>
      )}

      {suggestions.length > 0 && (
        <section className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h2 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <Users className="w-4 h-4" /> Typed by 5 or more members
          </h2>
          <ul className="mt-2 space-y-2">
            {suggestions.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {s.name} <span className="text-amber-800">({s.members} members)</span>
                </span>
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => add(s.name)}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold"
                  >
                    Add to the list
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <input
        aria-label="Search companies"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search"
        className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y">
          {shown.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className={`text-sm ${c.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>
                {c.name}
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => toggle(c)}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900"
                >
                  {c.is_active ? "Hide from onboarding" : "Show in onboarding"}
                </button>
              )}
            </div>
          ))}
          {shown.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-500">No companies match.</p>
          )}
        </div>
      )}
    </div>
  );
}
