// Advanced Performance Optimizer for React Components
import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Debounce hook for API calls
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for scroll events
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

// Memoized API call with caching
export const useApiCall = <T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = [],
  cacheKey?: string
) => {
  const cache = useRef(new Map<string, { data: T; timestamp: number }>());
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    if (cacheKey && cache.current.has(cacheKey)) {
      const cached = cache.current.get(cacheKey)!;
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
        setData(cached.data);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const result = await apiFunction();
      setData(result);
      setError(null);

      // Cache the result
      if (cacheKey) {
        cache.current.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Virtual scrolling hook for large lists
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      items: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  return {
    visibleItems,
    setScrollTop,
    scrollTop
  };
};

// Image lazy loading hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setIsError(false);
    };
    
    img.onerror = () => {
      setIsError(true);
      setIsLoaded(false);
    };
    
    img.src = src;
  }, [src]);

  return { imageSrc, isLoaded, isError };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
    }
  });

  useEffect(() => {
    const mountTime = Date.now() - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${componentName} mounted in ${mountTime}ms`);
    }
  }, [componentName]);

  return { renderCount: renderCount.current };
};

// Bundle size optimization utilities
export const lazyImport = <T extends React.ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> => {
  return React.lazy(importFunction);
};

// Memory cleanup utilities
export const useCleanup = (cleanupFunction: () => void) => {
  useEffect(() => {
    return cleanupFunction;
  }, [cleanupFunction]);
};

export default {
  useDebounce,
  useThrottle,
  useApiCall,
  useVirtualScroll,
  useLazyImage,
  usePerformanceMonitor,
  lazyImport,
  useCleanup
};
