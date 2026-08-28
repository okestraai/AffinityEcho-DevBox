import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { solutionBySlug } from './solutionsContent';

/**
 * One presentational component serving EVERY solution page, driven by the content map.
 *
 * The DocuIntelli equivalent (`SeoLandingPage`) works the same way, and for the same reason: six
 * hand-written pages drift — one gets a new CTA, another keeps last quarter's wording — whereas six
 * entries in a typed map stay structurally identical by construction.
 */
export function SolutionPage() {
  const { slug } = useParams<{ slug: string }>();
  const solution = slug ? solutionBySlug(slug) : undefined;

  // Title per page. Without this every solution shares the SPA's default title, which is what a
  // shared tab bar and a browser history full of identical entries look like.
  useEffect(() => {
    if (!solution) return;
    const previous = document.title;
    document.title = `${solution.h1} · Affinity Echo`;
    return () => {
      document.title = previous;
    };
  }, [solution]);

  // An unknown slug is a typo or a stale link, not a blank screen.
  if (!solution) return <Navigate to="/" replace />;

  return (
    <main className="container mx-auto px-4 py-10 sm:py-14">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Affinity Echo
      </Link>

      {/* Hero */}
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {solution.h1}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600 sm:mt-6 sm:text-lg">
          {solution.intro}
        </p>
        <Link
          to="/login"
          className="mt-7 inline-block rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          Join anonymously
        </Link>
      </div>

      {/* Sections */}
      <div className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2">
        {solution.sections.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.h2}
              className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100">
                <Icon className="h-5 w-5 text-purple-600" />
              </span>
              <h2 className="text-lg font-semibold text-gray-900">{section.h2}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{section.p}</p>
            </section>
          );
        })}
      </div>

      {/* FAQ — real <details> so it works before hydration and is keyboard-operable for free. */}
      <div className="mt-14 max-w-3xl sm:mt-20">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-6 space-y-3">
          {solution.faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
            >
              <summary className="cursor-pointer list-none font-semibold text-gray-900 marker:content-none">
                <span className="flex items-start justify-between gap-4">
                  {faq.q}
                  <Check className="mt-1 h-4 w-4 shrink-0 text-purple-600 opacity-0 transition-opacity group-open:opacity-100" />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Closing CTA */}
      <div className="mt-14 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-10 text-center shadow-lg sm:mt-20 sm:px-10">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Your safe space in corporate America</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-purple-50 sm:text-base">
          Connect anonymously with professionals who share your experiences. You choose if and when
          you reveal who you are.
        </p>
        <Link
          to="/login"
          className="mt-7 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-purple-700 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          Get started free
        </Link>
      </div>
    </main>
  );
}
