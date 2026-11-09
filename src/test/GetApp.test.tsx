import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ShareRedirect } from '../routes/AppRoutes';
import { AppLinkPrompt } from '../components/getApp/AppLinkPrompt';
import { GetAppPage } from '../components/getApp/GetAppPage';
import { STORE_LINKS, platformOf } from '../utils/getApp';

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36';

const asDevice = (ua: string) => vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
const hrefs = () => screen.queryAllByRole('link').map((a) => a.getAttribute('href'));

function openShared(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AppLinkPrompt />
      <Routes>
        <Route path="/feeds/:id" element={<ShareRedirect build={(id) => `/dashboard/feeds/post/${id}`} />} />
        <Route path="/dashboard/feeds/post/:id" element={<p>post page</p>} />
        <Route path="/pricing" element={<p>pricing</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => sessionStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('platformOf', () => {
  it('tells phones apart, including iPads that say they are Macs', () => {
    expect(platformOf(ANDROID, 5)).toBe('android');
    expect(platformOf(IPHONE, 5)).toBe('ios');
    expect(platformOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe('ios');
    expect(platformOf(DESKTOP, 0)).toBe('other');
  });
});

describe('shared links on a phone', () => {
  it('offers to open the post in the app on Android', () => {
    asDevice(ANDROID);
    openShared('/feeds/post-1');
    expect(screen.getByText('post page')).toBeTruthy();
    expect(hrefs()).toEqual([
      'intent://app.affinityecho.com/feeds/post-1#Intent;scheme=https;package=com.okestra.affinityecho;end',
      STORE_LINKS.android,
    ]);
  });

  it('offers the App Store on an iPhone', () => {
    asDevice(IPHONE);
    openShared('/feeds/post-1');
    expect(hrefs()).toEqual([STORE_LINKS.ios]);
  });

  it('goes away when the visitor continues in the browser', () => {
    asDevice(ANDROID);
    openShared('/feeds/post-1');
    fireEvent.click(screen.getByText('Continue in browser'));
    expect(hrefs()).toEqual([]);
    expect(sessionStorage.getItem('arrived_from_app_link')).toBeNull();
  });

  it('stays away on a computer and on ordinary pages', () => {
    asDevice(DESKTOP);
    openShared('/feeds/post-1');
    expect(hrefs()).toEqual([]);
    cleanup();
    sessionStorage.clear();
    asDevice(ANDROID);
    openShared('/pricing');
    expect(hrefs()).toEqual([]);
  });
});

describe('GetAppPage', () => {
  it('shows both stores on a computer', () => {
    asDevice(DESKTOP);
    render(
      <MemoryRouter>
        <GetAppPage />
      </MemoryRouter>,
    );
    expect(hrefs()).toEqual([STORE_LINKS.ios, STORE_LINKS.android, '/']);
  });

  it('sends an iPhone straight to the App Store', () => {
    asDevice(IPHONE);
    const replace = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, replace } as Location);
    render(
      <MemoryRouter>
        <GetAppPage />
      </MemoryRouter>,
    );
    expect(replace).toHaveBeenCalledWith(STORE_LINKS.ios);
  });
});
