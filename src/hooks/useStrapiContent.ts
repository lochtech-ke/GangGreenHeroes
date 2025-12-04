import { useState, useEffect } from 'react';

interface UseStrapiContentResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching content from Strapi CMS
 * 
 * @param fetchFn - Async function that fetches data from Strapi
 * @param dependencies - Array of dependencies that trigger refetch when changed
 * @returns Object containing data, loading state, error, and refetch function
 * 
 * @example
 * const { data, loading, error } = useStrapiContent(
 *   () => strapiService.getLegalDocument('terms-of-service'),
 *   ['terms-of-service']
 * );
 */
export function useStrapiContent<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
): UseStrapiContentResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Refetch function that can be called manually
  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchFn();

        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.error('[useStrapiContent] Error fetching data:', err);
          setError(err as Error);
          setData(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [...dependencies, refetchTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch };
}
