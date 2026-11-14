// The real AuthProvider signs out when another tab does, and tells other tabs when it signs out.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { FakeBroadcastChannel } from './support/fakeBroadcastChannel';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('../../api/authApis', () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  SocialMediaLogin: vi.fn(),
  ForgotPassword: vi.fn(),
  GetCurrentUser: vi.fn(),
}));
vi.mock('../../api/profileApis', () => ({ ReactivateAccount: vi.fn() }));
vi.mock('../Helper/ShowToast', () => ({ showToast: vi.fn() }));
vi.mock('../utils/tokenUtils', () => ({
  TokenUtils: {
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
    getAccessToken: vi.fn(() => 'token'),
    getRefreshToken: vi.fn(() => 'refresh'),
    hasTokens: vi.fn(() => true),
  },
}));

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { GetCurrentUser } from '../../api/authApis';
import { TokenUtils } from '../utils/tokenUtils';
import { showToast } from '../Helper/ShowToast';
import { MSG } from '../constants/messages';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

async function signedInTab() {
  vi.mocked(GetCurrentUser).mockResolvedValue({
    id: 'admin-1',
    email: 'admin@example.test',
    username: 'Admin',
    role: 'admin',
    has_completed_onboarding: true,
  });
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.isAuthenticated).toBe(true));
  return hook;
}

describe('AuthProvider across tabs', () => {
  let otherTab: FakeBroadcastChannel;
  let fromOtherTabs: unknown[];

  beforeAll(() => {
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
    otherTab = new FakeBroadcastChannel('affinityecho-auth');
    otherTab.addEventListener('message', (event) => fromOtherTabs.push(event.data));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fromOtherTabs = [];
  });

  it('signs this tab out when another tab signs out, without clearing the cookies again', async () => {
    const { result } = await signedInTab();
    vi.mocked(TokenUtils.clearTokens).mockClear();
    act(() => otherTab.postMessage({ type: 'logout' }));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(vi.mocked(TokenUtils.clearTokens)).not.toHaveBeenCalled();
    expect(fromOtherTabs).toEqual([]);
    expect(vi.mocked(showToast)).toHaveBeenCalledWith(MSG.AUTH.LOGGED_OUT, 'info');
  });

  it('says why when another tab signed out after inactivity', async () => {
    await signedInTab();
    act(() => otherTab.postMessage({ type: 'logout', reason: 'idle' }));
    expect(vi.mocked(showToast)).toHaveBeenCalledWith(MSG.AUTH.LOGGED_OUT_IDLE, 'info');
  });

  it('tells the other tabs when the sign-in is cleared because the user could not be loaded', async () => {
    vi.mocked(GetCurrentUser).mockRejectedValue(new Error('expired'));
    const hook = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
    expect(fromOtherTabs).toEqual([{ type: 'logout' }]);
  });

  it('shares activity from any signed-in tab, not only admin pages', async () => {
    await signedInTab();
    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });
    expect(fromOtherTabs).toEqual([{ type: 'activity', at: expect.any(Number) }]);
  });

  it('tells the other tabs when this tab signs out', async () => {
    const { result } = await signedInTab();
    act(() => result.current.logout());
    expect(fromOtherTabs).toEqual([{ type: 'logout' }]);
  });

  it('marks an idle sign-out so keep-alive tabs can ignore it', async () => {
    const { result } = await signedInTab();
    act(() => result.current.logoutAfterIdle());
    expect(fromOtherTabs).toEqual([{ type: 'logout', reason: 'idle' }]);
    expect(vi.mocked(showToast)).toHaveBeenCalledWith(MSG.AUTH.LOGGED_OUT_IDLE, 'info');
  });
});
