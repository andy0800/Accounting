import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  LinearProgress,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CloudOff as OfflineIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { backendPreloader } from '../utils/backendPreloader';

interface LoadingStatesProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  showBackendStatus?: boolean;
  customMessage?: string;
  variant?: 'default' | 'minimal' | 'detailed';
}

const LoadingStates: React.FC<LoadingStatesProps> = ({
  loading = false,
  error = null,
  onRetry,
  showBackendStatus = false,
  customMessage,
  variant = 'default'
}) => {
  const [backendStatus, setBackendStatus] = useState(backendPreloader.getStatus());
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (showBackendStatus) {
      const interval = setInterval(() => {
        setBackendStatus(backendPreloader.getStatus());
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [showBackendStatus]);

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const handleForceWarmup = async () => {
    setIsRetrying(true);
    try {
      await backendPreloader.forceWarmup();
      if (onRetry) {
        await onRetry();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  // Minimal variant for inline loading
  if (variant === 'minimal') {
    if (loading) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            {customMessage || 'جاري التحميل...'}
          </Typography>
        </Box>
      );
    }
    
    if (error) {
      return (
        <Chip 
          icon={<WarningIcon />}
          label="خطأ في التحميل"
          color="error"
          size="small"
          onClick={onRetry}
          clickable={!!onRetry}
        />
      );
    }
    
    return null;
  }

  // Default loading state
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        p={4}
        minHeight={variant === 'detailed' ? 400 : 200}
      >
        <CircularProgress size={variant === 'detailed' ? 60 : 40} />
        
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          {customMessage || 'جاري تحميل البيانات...'}
        </Typography>
        
        {variant === 'detailed' && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              قد يستغرق التحميل وقتاً أطول في المرة الأولى
            </Typography>
            
            <LinearProgress sx={{ width: '100%', maxWidth: 300 }} />
            
            {showBackendStatus && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Chip
                  icon={backendStatus.isWarmedUp ? <ScheduleIcon /> : <OfflineIcon />}
                  label={
                    backendStatus.isWarmedUp 
                      ? 'الخادم نشط' 
                      : 'جاري تشغيل الخادم...'
                  }
                  color={backendStatus.isWarmedUp ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    );
  }

  // Error state
  if (error) {
    const isTimeoutError = error.includes('timeout') || error.includes('ECONNABORTED');
    const isNetworkError = error.includes('Network') || error.includes('ENOTFOUND');
    
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              disabled={isRetrying}
              startIcon={isRetrying ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {isRetrying ? 'جاري المحاولة...' : 'إعادة المحاولة'}
            </Button>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            {isTimeoutError ? 'انتهت مهلة الاتصال' : 
             isNetworkError ? 'خطأ في الشبكة' : 
             'حدث خطأ في تحميل البيانات'}
          </Typography>
          
          {variant === 'detailed' && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {isTimeoutError && (
                <>
                  الخادم قد يكون في حالة سكون (Render Free Tier). 
                  هذا أمر طبيعي ويحتاج وقت إضافي للتشغيل.
                </>
              )}
              {isNetworkError && (
                <>
                  تحقق من اتصال الإنترنت أو حاول مرة أخرى لاحقاً.
                </>
              )}
              {!isTimeoutError && !isNetworkError && (
                <>
                  {error}
                </>
              )}
            </Typography>
          )}
        </Alert>

        {variant === 'detailed' && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                معلومات الخادم:
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip
                  icon={backendStatus.isWarmedUp ? <ScheduleIcon /> : <OfflineIcon />}
                  label={backendStatus.isWarmedUp ? 'نشط' : 'غير نشط'}
                  color={backendStatus.isWarmedUp ? 'success' : 'error'}
                  size="small"
                />
                
                {backendStatus.consecutiveFailures > 0 && (
                  <Chip
                    label={`${backendStatus.consecutiveFailures} محاولات فاشلة`}
                    color="warning"
                    size="small"
                  />
                )}
                
                {retryCount > 0 && (
                  <Chip
                    label={`${retryCount} إعادة محاولة`}
                    color="info"
                    size="small"
                  />
                )}
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  startIcon={<RefreshIcon />}
                >
                  إعادة المحاولة
                </Button>
                
                {isTimeoutError && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleForceWarmup}
                    disabled={isRetrying}
                    startIcon={<ScheduleIcon />}
                    color="warning"
                  >
                    تشغيل الخادم
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  return null;
};

export default LoadingStates;
