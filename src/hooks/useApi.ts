import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for API data fetching
 * @param fetchFn - Function that returns a promise with the data
 * @param dependencies - Dependencies array for useEffect
 * @returns Loading state, error state, data, and refetch function
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData();
  }, [...dependencies, fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch, setError };
}

/**
 * Custom hook for API mutations (create, update, delete)
 * @returns Mutation state and execute function
 */
export function useApiMutation<T, P>(
  mutationFn: (params: P) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (params: P) => {
      setLoading(true);
      try {
        const result = await mutationFn(params);
        setData(result);
        setError(null);
        return result;
      } catch (err) {
        console.error('API Mutation Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  return { execute, data, loading, error, setError };
}

/**
 * Custom hook for handling API errors
 * @param initialError - Initial error state
 * @returns Error state and utility functions
 */
export function useApiError(initialError: string | null = null) {
  const [error, setError] = useState<string | null>(initialError);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: any) => {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    setError(errorMessage);
    console.error('API Error:', err);
  }, []);

  return { error, setError, clearError, handleError };
}
