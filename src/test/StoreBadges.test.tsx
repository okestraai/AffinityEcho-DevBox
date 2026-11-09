import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { StoreBadges } from '../components/getApp/StoreBadges';
import { GetAppBand } from '../components/getApp/GetAppBand';
import { STORE_LINKS, storeOrder } from '../utils/getApp';

const hrefs = () => screen.queryAllByRole('link').map((a) => a.getAttribute('href'));

afterEach(cleanup);

describe('StoreBadges', () => {
  it('puts the visitor’s own store first', () => {
    expect(storeOrder('android')).toEqual(['android', 'ios']);
    expect(storeOrder('ios')).toEqual(['ios', 'android']);
    expect(storeOrder('other')).toEqual(['ios', 'android']);
  });

  it('links both official badges to the stores in a new tab', () => {
    render(<StoreBadges platform="android" />);
    expect(hrefs()).toEqual([STORE_LINKS.android, STORE_LINKS.ios]);
    for (const a of screen.getAllByRole('link')) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    }
    expect(screen.getByAltText('Download Affinity Echo on the App Store')).toBeTruthy();
  });

  it('uses badge, screenshot and QR files that exist', () => {
    const files = Object.keys(import.meta.glob('/public/badges/*', { query: '?url' })).map((f) => f.split('/').pop());
    for (const file of ['app-store.svg', 'google-play.png', 'get-app-qr.svg', 'app-screen-1.jpg', 'app-screen-2.jpg']) {
      expect(files, file).toContain(file);
    }
  });
});

describe('GetAppBand', () => {
  it('shows the heading, both stores and the QR code', () => {
    render(<GetAppBand />);
    expect(screen.getByRole('heading', { name: 'Take your community with you' })).toBeTruthy();
    expect(hrefs().sort()).toEqual([STORE_LINKS.android, STORE_LINKS.ios].sort());
    expect(screen.getByAltText('QR code to get the Affinity Echo app')).toBeTruthy();
  });
});
