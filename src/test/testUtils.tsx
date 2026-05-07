import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Wrapper that provides Router context for components using useNavigate/useLocation
function AllProviders({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

export function renderWithRouter(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Mock user for auth context
export const mockUser = {
  id: 'user-123',
  username: 'TestUser',
  email: 'test@example.com',
  avatar: '🚀',
  role: 'user' as const,
  has_completed_onboarding: true,
  is_suspended: false,
  is_deactivated: false,
  is_deleted: false,
};

export const mockAdminUser = {
  ...mockUser,
  id: 'admin-123',
  role: 'admin' as const,
  username: 'AdminUser',
};

// Helper to wait for loading to finish
export async function waitForLoadingToFinish() {
  // Give React time to process
  await new Promise(resolve => setTimeout(resolve, 0));
}
