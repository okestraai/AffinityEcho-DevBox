import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VerifyCompany } from '../components/auth/VerifyCompany';

function open(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <VerifyCompany />
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('VerifyCompany', () => {
  it('asks the API for JSON and shows success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);
    open('/verify-company?token=tok-1');
    await waitFor(() => expect(screen.getByText(/has been verified/)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/user\/verify-company\/tok-1$/);
    expect(fetchMock.mock.calls[0][1]).toEqual({ headers: { Accept: 'application/json' } });
  });

  it('shows the server message when the link has expired', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ success: false, message: 'This link has expired.' }) }),
    );
    open('/verify-company?token=tok-2');
    await waitFor(() => expect(screen.getByText('This link has expired.')).toBeTruthy());
  });

  it('shows the result an older email link brings back, without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    open('/verify-company?status=error&reason=expired');
    await waitFor(() => expect(screen.getByText(/has expired/)).toBeTruthy());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
