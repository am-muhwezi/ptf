import { useState, useEffect, useCallback } from 'react';
import { memberService } from '../services/memberService';

/**
 * Generic API hook for data fetching with loading, error, and caching states
 */
export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (...args) => {
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

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, dependencies);

  const refetch = useCallback((...args) => fetchData(...args), [fetchData]);

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
  const [allMembers, setAllMembers] = useState([]);
  const [stats, setStats] = useState({
    total_members: 0,
    active_members: 0,
    inactive_members: 0,
    indoor_members: 0,
    outdoor_members: 0
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
      onSuccess: (result) => {
        if (result.results) {
          setAllMembers(result.results);
        } else {
          setAllMembers(result);
        }
      }
    }
  );

  const { refetch: refetchStats } = useApi(
    () => memberService.getMembers({ page: 1, limit: 50 }),
    [],
    {
      immediate: true,
      onSuccess: (result) => {
        const members = result.data || result.results || result;
        const calculatedStats = {
          total_members: result.pagination?.total_count || members.length,
          active_members: members.filter(m => m.status === 'active').length,
          inactive_members: members.filter(m => m.status === 'inactive').length,
          indoor_members: members.filter(m => m.membership_type === 'indoor').length,
          outdoor_members: members.filter(m => m.membership_type === 'outdoor').length
        };
        setStats(calculatedStats);
      }
    }
  );

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refetch(), refetchStats()]);
  }, [refetch, refetchStats]);

  return {
    members: allMembers,
    loading,
    error,
    stats,
    params,
    updateParams,
    refetch,
    refreshAll,
    totalCount: data?.count || allMembers.length,
    totalPages: data?.count ? Math.ceil(data.count / params.limit) : 1,
    hasNext: !!data?.next,
    hasPrevious: !!data?.previous
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

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const searchResults = await searchFunction(query);
        setResults(searchResults.results || searchResults);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [query, searchFunction, delay]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults: () => setResults([])
  };
};