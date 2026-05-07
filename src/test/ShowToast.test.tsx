import { describe, it, expect, beforeEach } from 'vitest';

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock the CSS import
vi.mock('react-toastify/dist/ReactToastify.css', () => ({}));

import { toast } from 'react-toastify';
import { showToast } from '../Helper/ShowToast';

const mockedToast = vi.mocked(toast);

describe('showToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.success for success type', () => {
    showToast('Operation succeeded', 'success');

    expect(mockedToast.success).toHaveBeenCalledTimes(1);
    const [body, config] = mockedToast.success.mock.calls[0];
    expect(config).toBeDefined();
    expect((config as any).position).toBe('top-center');
  });

  it('calls toast.error for error type', () => {
    showToast('Something went wrong', 'error');

    expect(mockedToast.error).toHaveBeenCalledTimes(1);
  });

  it('calls toast.warn for warning type', () => {
    showToast('Be careful', 'warning');

    expect(mockedToast.warn).toHaveBeenCalledTimes(1);
  });

  it('calls toast.info for info type', () => {
    showToast('FYI', 'info');

    expect(mockedToast.info).toHaveBeenCalledTimes(1);
  });

  it('calls default toast when no type is specified', () => {
    showToast('Hello');

    // The default branch calls toast() directly (not a method)
    expect(mockedToast).toHaveBeenCalledTimes(1);
  });

  it('calls default toast for explicit default type', () => {
    showToast('Notice', 'default');

    expect(mockedToast).toHaveBeenCalledTimes(1);
  });

  it('accepts options object overload', () => {
    showToast({ message: 'Done!', type: 'success' });

    expect(mockedToast.success).toHaveBeenCalledTimes(1);
  });

  it('defaults to "default" type when options object has no type', () => {
    showToast({ message: 'Heads up' });

    expect(mockedToast).toHaveBeenCalledTimes(1);
  });

  it('passes autoClose and other config values', () => {
    showToast('Test', 'error');

    const config = mockedToast.error.mock.calls[0][1] as any;
    expect(config.autoClose).toBe(4000);
    expect(config.closeOnClick).toBe(true);
    expect(config.pauseOnHover).toBe(true);
    expect(config.draggable).toBe(true);
    expect(config.icon).toBe(false);
  });

  it('applies correct accent color per type', () => {
    showToast('green', 'success');
    const successConfig = mockedToast.success.mock.calls[0][1] as any;
    expect(successConfig.style.borderLeft).toContain('#22c55e');

    showToast('red', 'error');
    const errorConfig = mockedToast.error.mock.calls[0][1] as any;
    expect(errorConfig.style.borderLeft).toContain('#ef4444');
  });
});
