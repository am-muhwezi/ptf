import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { memberService } from '../services/memberService';

const cache = new Map();
const requestMap = new Map();

/**
 * Generic API hook for data fetching with loading, error, and caching states
 */
export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const { immediate = true, onSuccess, onError, cacheKey, cacheTTL = 300000 } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const getCacheKey = useCallback((args) => {
    if (cacheKey) return `${cacheKey}-${JSON.stringify(args)}`;
    return `${apiFunction.name}-${JSON.stringify(args)}`;
  }, [cacheKey, apiFunction]);

  const fetchData = useCallback(async (...args) => {
    const key = getCacheKey(args);

    // Check cache first
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      setData(cached.data);
      setLoading(false);
      if (onSuccess) onSuccess(cached.data);
      return cached.data;
    }

    // Check if same request is already in flight
    if (requestMap.has(key)) {
      return requestMap.get(key);
    }

    try {
      setLoading(true);
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const requestPromise = apiFunction(...args, { signal: abortControllerRef.current.signal });
      requestMap.set(key, requestPromise);

      const result = await requestPromise;

      // Cache the result
      cache.set(key, { data: result, timestamp: Date.now() });

      setData(result);
      if (onSuccess) onSuccess(result);

      return result;
    } catch (err) {
      if (err.name === 'AbortError') return;

      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
      requestMap.delete(key);
    }
  }, [apiFunction, onSuccess, onError, getCacheKey, cacheTTL]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  const refetch = useCallback((...args) => {
    // Clear cache on manual refetch
    const key = getCacheKey(args);
    cache.delete(key);
    return fetchData(...args);
  }, [fetchData, getCacheKey]);

  return { data, loading, error, refetch, fetchData };
};

/**
 * Hook for API mutations (create, update, delete operations)
 */
export const useApiMutation = (apiFunction, options = {}) => {
  const { onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
};

/**
 * Hook specifically for members data with built-in pagination and filtering
 */
export const useMembers = (initialParams = {}) => {
  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    ...initialParams
  });

  const {
    data,
    loading,
    error,
    refetch
  } = useApi(
    () => memberService.getMembers(params),
    [params],
    {
      cacheKey: 'members',
      cacheTTL: 60000
    }
  );

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useApi(
    () => memberService.getMemberStats(),
    [],
    {
      cacheKey: 'member-stats',
      cacheTTL: 300000 // 5 minutes cache for stats
    }
  );

  const allMembers = useMemo(() => {
    return data?.results || data?.data || data || [];
  }, [data]);

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const pagination = useMemo(() => ({
    totalCount: data?.count || data?.pagination?.total_count || 0,
    totalPages: data?.count ? Math.ceil(data.count / params.limit) : 1,
    hasNext: !!data?.next,
    hasPrevious: !!data?.previous
  }), [data, params.limit]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refetch(), refetchStats()]);
  }, [refetch, refetchStats]);

  return {
    members: allMembers,
    loading: loading || statsLoading,
    error: error || statsError,
    stats: stats || {
      total_members: 0,
      active_members: 0,
      inactive_members: 0,
      indoor_members: 0,
      outdoor_members: 0
    },
    params,
    updateParams,
    refetch,
    refreshAll,
    ...pagination
  };
};

/**
 * Hook for member mutations (create, update, delete)
 */
export const useMemberMutations = (onSuccess) => {
  const createMember = useApiMutation(memberService.createMember, { onSuccess });
  const updateMember = useApiMutation(memberService.updateMember, { onSuccess });
  const deleteMember = useApiMutation(memberService.deleteMember, { onSuccess });
  const updateStatus = useApiMutation(memberService.updateMemberStatus, { onSuccess });
  const processPayment = useApiMutation(memberService.processPayment, { onSuccess });
  const sendReminder = useApiMutation(memberService.sendPaymentReminder, { onSuccess });

  return {
    createMember,
    updateMember,
    deleteMember,
    updateStatus,
    processPayment,
    sendReminder
  };
};

/**
 * Hook for search functionality with debouncing
 */
export const useSearch = (searchFunction, delay = 300) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const debouncedSearch = useMemo(() => {
    let timeoutId;

    return (searchQuery) => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        if (!searchQuery.trim()) {
          setResults([]);
          return;
        }

        try {
          setLoading(true);
          setError(null);

          // Cancel previous search
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }

          abortControllerRef.current = new AbortController();

          const searchResults = await searchFunction(searchQuery, {
            signal: abortControllerRef.current.signal
          });

          setResults(searchResults.results || searchResults);
        } catch (err) {
          if (err.name !== 'AbortError') {
            setError(err.message);
            setResults([]);
          }
        } finally {
          setLoading(false);
        }
      }, delay);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    };
  }, [searchFunction, delay]);

  useEffect(() => {
    const cleanup = debouncedSearch(query);
    return cleanup;
  }, [query, debouncedSearch]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults: () => setResults([])
  };
};