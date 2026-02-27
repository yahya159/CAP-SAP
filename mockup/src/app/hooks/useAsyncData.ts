// Generic async data fetching hook – replaces repeated useState/useRef/useEffect boilerplate

import { useCallback, useEffect, useRef, useState } from 'react';
import { isAbortError } from '../utils/async';

export interface UseAsyncDataResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Generic hook for async data loading with abort support.
 *
 * @param fetcher – async function that returns data; receives an AbortSignal.
 * @param initialData – default value while loading or on error.
 * @param deps – dependency array; reload is triggered when deps change.
 * @param label – optional label for console error messages.
 */
export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  initialData: T,
  deps: React.DependencyList = [],
  label = 'useAsyncData'
): UseAsyncDataResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(controller.signal);
      if (controller.signal.aborted) return;
      setData(result);
    } catch (err) {
      if (!isAbortError(err)) {
        console.error(`[${label}] Failed to load data`, err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();

    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [reload]);

  return { data, loading, error, reload };
}
