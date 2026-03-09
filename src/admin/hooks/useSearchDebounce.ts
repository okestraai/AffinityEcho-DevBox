// src/admin/hooks/useSearchDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Debounces a search input so the API isn't called on every keystroke.
 * Returns the raw input (for the controlled input) and the debounced value
 * (to use in API calls / useCallback deps).
 */
export function useSearchDebounce(delay = 400) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), delay);
    return () => clearTimeout(t);
  }, [searchInput, delay]);

  return { searchInput, setSearchInput, search };
}
