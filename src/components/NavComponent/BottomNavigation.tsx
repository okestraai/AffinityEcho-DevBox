import React from 'react';
import { Home, MessageCircle, Users, Zap, User, Target, Briefcase } from 'lucide-react';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [BottomNavigation.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [BottomNavigation.${component}] ${message}`);
  }
};

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNavigation({ activeTab, setActiveTab }: Props) {
  // Log component render
  React.useEffect(() => {
    log('BottomNavigation', 'Component rendered', { activeTab });
  }, [activeTab]);

  const tabs = [
    { id: 'feeds', label: 'Home', icon: Home },
    { id: 'forums', label: 'Forums', icon: Users },
    { id: 'referrals', label: 'Referrals', icon: Briefcase },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const handleTabChange = (tabId: string) => {
    log('handleTabChange', 'Tab change requested', { 
      from: activeTab, 
      to: tabId 
    });
    setActiveTab(tabId);
    log('handleTabChange', 'Tab changed successfully', { newActiveTab: tabId });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl md:hidden z-50"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <div className="flex justify-around px-4 pt-2 bg-white">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 active:scale-95 min-w-[60px] ${
                isActive
                  ? 'text-purple-600 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 shadow-lg border border-purple-200/50 transform scale-105'
                  : 'text-gray-500 active:text-gray-700 active:bg-gray-50 border border-transparent'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'scale-110 drop-shadow-sm' : ''} transition-transform duration-300`} />
              <span className={`text-xs font-semibold ${isActive ? 'text-purple-600' : ''} transition-colors`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}