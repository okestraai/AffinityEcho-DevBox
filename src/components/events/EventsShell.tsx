import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { DashboardLayout } from "../../layout/DashboardLayout";

// Signed-in members see events inside the usual dashboard; visitors from a shared link get a light header.
export function EventsShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return null;
  if (isAuthenticated) return <DashboardLayout />;
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/affinity-echo-logo-hd.png" alt="Affinity Echo" className="h-8 w-auto" />
          </Link>
          <Link
            to="/login"
            state={{ from: location }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-purple-700 border border-purple-200 hover:bg-purple-50 min-h-[40px] flex items-center"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
