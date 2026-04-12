import { Home, Users, Zap, Target, User } from "lucide-react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNavigation({ activeTab, setActiveTab }: Props) {
  const tabs = [
    { id: "feeds", label: "Home", icon: Home },
    { id: "forums", label: "Forums", icon: Users },
    { id: "nooks", label: "Nooks", icon: Zap },
    { id: "mentorship", label: "Mentorship", icon: Target },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl md:hidden z-50"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <div className="flex justify-around px-2 pt-2 bg-white">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 px-3 rounded-xl transition-all duration-300 active:scale-95 min-w-0 flex-1 ${
                isActive
                  ? "text-purple-600 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 shadow-md border border-purple-200/50 scale-105"
                  : "text-gray-500 active:text-gray-700 active:bg-gray-50 border border-transparent"
              }`}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? "scale-110 drop-shadow-sm" : ""} transition-transform duration-300`}
              />
              <span
                className={`text-[11px] font-semibold leading-tight ${
                  isActive ? "text-purple-600" : ""
                } transition-colors`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
