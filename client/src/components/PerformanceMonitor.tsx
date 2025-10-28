import React, { useEffect, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';

interface PerformanceMetrics {
  loadTime: number;
  apiCalls: number;
  cacheHits: number;
  renderTime: number;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    renderTime: 0
  });

  useEffect(() => {
    // Monitor performance metrics
    const startTime = performance.now();
    
    // Listen for API calls from axios interceptors
    const handleApiCall = () => {
      setMetrics(prev => ({ ...prev, apiCalls: prev.apiCalls + 1 }));
    };

    const handleCacheHit = () => {
      setMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
    };

    // Measure initial load time
    const loadTime = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, loadTime }));

    // Measure render time
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({ ...prev, renderTime: entry.duration }));
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: 2,
        borderRadius: 2,
        zIndex: 9999,
        minWidth: 200
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
        🚀 Performance Monitor
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Chip
          label={`Load: ${metrics.loadTime.toFixed(0)}ms`}
          size="small"
          color={metrics.loadTime < 1000 ? 'success' : 'warning'}
        />
        <Chip
          label={`API Calls: ${metrics.apiCalls}`}
          size="small"
          color={metrics.apiCalls < 5 ? 'success' : 'warning'}
        />
        <Chip
          label={`Cache Hits: ${metrics.cacheHits}`}
          size="small"
          color="info"
        />
        <Chip
          label={`Render: ${metrics.renderTime.toFixed(0)}ms`}
          size="small"
          color={metrics.renderTime < 100 ? 'success' : 'warning'}
        />
      </Box>
    </Box>
  );
};

export default PerformanceMonitor;
