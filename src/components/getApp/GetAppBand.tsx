import { StoreBadges } from './StoreBadges';

// The "Get the app" section at the bottom of every public page.
export function GetAppBand() {
  return (
    <section id="get-the-app" aria-labelledby="get-the-app-title" className="overflow-hidden border-t border-slate-900/10 bg-white/70">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:py-16 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-purple-700">Mobile app</p>
          <h2 id="get-the-app-title" className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Take your community with you
          </h2>
          <p className="mt-3 text-gray-600">
            Forums, Nooks and mentorship on your phone, with the same anonymous account as the website.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-6">
            <StoreBadges />
            <div className="hidden items-center gap-3 border-l border-slate-200 pl-6 lg:flex">
              <img src="/badges/get-app-qr.svg" alt="QR code to get the Affinity Echo app" className="h-20 w-20 rounded-md border border-slate-200 bg-white p-1" loading="lazy" />
              <p className="whitespace-nowrap text-sm text-gray-500">Scan to download</p>
            </div>
          </div>
        </div>
        <div className="relative h-[360px] sm:h-[420px]" aria-hidden="true">
          <img src="/badges/app-screen-1.jpg" alt="" loading="lazy" decoding="async" className="absolute left-1/2 top-0 h-full w-auto -translate-x-1/2 rounded-3xl shadow-2xl sm:-translate-x-[90%]" />
          <img src="/badges/app-screen-2.jpg" alt="" loading="lazy" decoding="async" className="absolute left-1/2 top-8 hidden h-[92%] w-auto -translate-x-[5%] rounded-3xl shadow-2xl sm:block" />
        </div>
      </div>
    </section>
  );
}
