import '@testing-library/jest-dom';

/**
 * Web Storage polyfill.
 *
 * jsdom 28 does not expose `localStorage`/`sessionStorage` under this Vitest 4 setup, so any test
 * touching them died on `Cannot read properties of undefined (reading 'clear')` — that alone was
 * 8 of the suite's failures, all in tokenUtils. Same pattern as the matchMedia and
 * IntersectionObserver mocks below: give jsdom the browser API it is missing rather than making
 * every test defend against its absence.
 *
 * A real Map-backed implementation, not a stub of jest.fn()s: these tests assert on VALUES written
 * and read back, so a mock that records calls without storing anything would pass while proving
 * nothing.
 */
function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key: (i: number) => [...store.keys()][i] ?? null,
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  } as Storage;
}

for (const key of ['localStorage', 'sessionStorage'] as const) {
  if (typeof window[key] === 'undefined') {
    Object.defineProperty(window, key, { writable: true, configurable: true, value: createStorage() });
    Object.defineProperty(globalThis, key, { writable: true, configurable: true, value: window[key] });
  }
}

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock scrollTo
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

// Mock URL.createObjectURL
URL.createObjectURL = vi.fn(() => 'blob:mock-url');
URL.revokeObjectURL = vi.fn();
