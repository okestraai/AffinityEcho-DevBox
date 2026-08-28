import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { SOLUTIONS } from './solutionsContent';

/**
 * Marketing header for PUBLIC routes only.
 *
 * Rendered by `PublicLayout`, which the authenticated trees never touch — `DashboardLayout` and
 * `AdminLayout` each render their own header. That separation is structural rather than a
 * `hidden-when-logged-in` check, so this can never leak into the dashboard by someone getting a
 * condition wrong.
 *
 * Modelled on the DocuIntelli landing's Solutions menu: icon + label + one-line description in a
 * panel, closing on outside-click and Escape. Colours follow Affinity Echo's own purple→indigo→blue
 * brand rather than DocuIntelli's emerald, so it reads as this product.
 */
export function PublicHeader() {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close the dropdown on outside click or Escape — a menu you can only close by finding the
  // trigger again is a trap on a marketing page people are skimming.
  useEffect(() => {
    if (!solutionsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (solutionsRef.current && !solutionsRef.current.contains(e.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSolutionsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [solutionsOpen]);

  const go = (path: string) => {
    setSolutionsOpen(false);
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <img
              src="/affinity-echo-logo-hd.png"
              alt=""
              aria-hidden="true"
              className="h-9 w-9 object-contain"
            />
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-lg font-bold text-transparent">
              Affinity Echo
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            <div className="relative" ref={solutionsRef}>
              <button
                type="button"
                aria-expanded={solutionsOpen}
                aria-haspopup="true"
                onClick={() => setSolutionsOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-1 rounded-lg px-4 py-2 font-medium text-slate-700 transition-all hover:bg-purple-50 hover:text-purple-700"
              >
                Solutions
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Anchored RIGHT, not left: Solutions sits on the right-hand side of the bar, so a
                  left-anchored 26rem panel ran 74px off the viewport at 1024px — the narrowest width
                  where this desktop nav is still shown. Opening leftward keeps it on screen. */}
              {solutionsOpen && (
                <div className="absolute right-0 top-full mt-2 w-[26rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                  {SOLUTIONS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <a
                        key={s.slug}
                        href={`/${s.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          go(`/${s.slug}`);
                        }}
                        className="flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-purple-50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                          <Icon className="h-4 w-4 text-purple-600" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-tight text-slate-900">
                            {s.label}
                          </span>
                          <span className="mt-0.5 block text-xs leading-tight text-slate-500">
                            {s.desc}
                          </span>
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              to="/faq"
              className="rounded-lg px-4 py-2 font-medium text-slate-700 transition-all hover:bg-purple-50 hover:text-purple-700"
            >
              FAQ
            </Link>
            <Link
              to="/login"
              className="ml-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get started
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="cursor-pointer rounded-lg p-2 text-slate-700 transition-colors hover:bg-purple-50 lg:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu — a flat list, not a nested dropdown. A dropdown inside a drawer costs a
            second tap to reach anything and hides the catalogue behind a disclosure twice over. */}
        {mobileOpen && (
          <div className="border-t border-slate-100 py-3 lg:hidden">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Solutions
            </p>
            {SOLUTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.slug}
                  href={`/${s.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(`/${s.slug}`);
                  }}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-purple-50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-purple-600" />
                  {s.label}
                </a>
              );
            })}
            <div className="mt-2 border-t border-slate-100 pt-2">
              <Link
                to="/faq"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-purple-50"
              >
                FAQ
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-1 block rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
