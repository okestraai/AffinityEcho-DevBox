import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50" style={{ position: 'relative' }}>
      {children}
    </div>
  );
};

export default AppLayout;