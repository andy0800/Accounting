import React from 'react';
import { Box, Skeleton, Card, CardContent } from '@mui/material';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'chart' | 'list';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        );
      
      case 'table':
        return (
          <Box>
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 1 }} />
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} variant="rectangular" width="100%" height={48} sx={{ mb: 1 }} />
            ))}
          </Box>
        );
      
      case 'chart':
        return (
          <Card>
            <CardContent>
              <Skeleton variant="text" width="50%" height={32} />
              <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        );
      
      case 'list':
        return (
          <Box>
            {[...Array(3)].map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="70%" height={24} />
                  <Skeleton variant="text" width="50%" height={20} />
                </Box>
              </Box>
            ))}
          </Box>
        );
      
      default:
        return <Skeleton variant="rectangular" width="100%" height={200} />;
    }
  };

  return (
    <Box>
      {[...Array(count)].map((_, index) => (
        <Box key={index}>
          {renderSkeleton()}
        </Box>
      ))}
    </Box>
  );
};

export default LoadingSkeleton;
