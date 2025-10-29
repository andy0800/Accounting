import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Cookie as CookieIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';
import { cacheManager } from '../utils/cacheManager';

interface CacheStats {
  localStorage: number;
  sessionStorage: number;
  indexedDB: string[];
  serviceWorker: boolean;
  apiCache: number;
}

const CacheClearButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [cleared, setCleared] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    
    try {
      const cacheStats = await cacheManager.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Error getting cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    
    try {
      await cacheManager.clearAllData();
      setCleared(true);
      
      // Update stats after clearing
      const newStats = await cacheManager.getCacheStats();
      setStats(newStats);
      
      // Auto-close after 2 seconds and reload
      setTimeout(() => {
        setOpen(false);
        cacheManager.forceReload();
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing caches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSpecific = async (type: 'storage' | 'indexeddb' | 'serviceworker' | 'api' | 'cookies') => {
    setLoading(true);
    
    try {
      await cacheManager.clearSpecificCache(type);
      
      // Update stats
      const newStats = await cacheManager.getCacheStats();
      setStats(newStats);
      
    } catch (error) {
      console.error(`Error clearing ${type} cache:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCleared(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="warning"
        startIcon={<DeleteIcon />}
        onClick={handleOpen}
        size="small"
      >
        مسح التخزين المؤقت
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon />
            إدارة التخزين المؤقت والبيانات
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {cleared && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ تم مسح جميع البيانات المؤقتة بنجاح! سيتم إعادة تحميل الصفحة...
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              مسح التخزين المؤقت سيؤدي إلى حذف جميع البيانات المحفوظة محلياً وإعادة تحميل النظام بحالة نظيفة.
            </Typography>
          </Alert>

          {loading && !stats ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : stats && (
            <Box>
              <Typography variant="h6" gutterBottom>
                إحصائيات التخزين المؤقت:
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <StorageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="التخزين المحلي (localStorage)"
                    secondary={`${stats.localStorage} عنصر محفوظ`}
                  />
                  <Box>
                    <Chip 
                      label={stats.localStorage > 0 ? 'يحتوي على بيانات' : 'فارغ'} 
                      color={stats.localStorage > 0 ? 'warning' : 'success'}
                      size="small"
                    />
                    {stats.localStorage > 0 && (
                      <Button
                        size="small"
                        onClick={() => handleClearSpecific('storage')}
                        disabled={loading}
                        sx={{ ml: 1 }}
                      >
                        مسح
                      </Button>
                    )}
                  </Box>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <MemoryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="التخزين المؤقت (sessionStorage)"
                    secondary={`${stats.sessionStorage} عنصر محفوظ`}
                  />
                  <Chip 
                    label={stats.sessionStorage > 0 ? 'يحتوي على بيانات' : 'فارغ'} 
                    color={stats.sessionStorage > 0 ? 'warning' : 'success'}
                    size="small"
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CloudIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Service Worker Cache"
                    secondary={stats.serviceWorker ? 'نشط ويحتوي على بيانات' : 'غير نشط'}
                  />
                  <Box>
                    <Chip 
                      label={stats.serviceWorker ? 'نشط' : 'غير نشط'} 
                      color={stats.serviceWorker ? 'warning' : 'success'}
                      size="small"
                    />
                    {stats.serviceWorker && (
                      <Button
                        size="small"
                        onClick={() => handleClearSpecific('serviceworker')}
                        disabled={loading}
                        sx={{ ml: 1 }}
                      >
                        مسح
                      </Button>
                    )}
                  </Box>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CookieIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="ملفات تعريف الارتباط (Cookies)"
                    secondary="ملفات تعريف الارتباط المحفوظة"
                  />
                  <Button
                    size="small"
                    onClick={() => handleClearSpecific('cookies')}
                    disabled={loading}
                  >
                    مسح
                  </Button>
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <StorageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="تخزين API المؤقت"
                    secondary={`${stats.apiCache} استجابة API محفوظة`}
                  />
                  <Box>
                    <Chip 
                      label={stats.apiCache > 0 ? `${stats.apiCache} عنصر` : 'فارغ'} 
                      color={stats.apiCache > 0 ? 'warning' : 'success'}
                      size="small"
                    />
                    {stats.apiCache > 0 && (
                      <Button
                        size="small"
                        onClick={() => handleClearSpecific('api')}
                        disabled={loading}
                        sx={{ ml: 1 }}
                      >
                        مسح
                      </Button>
                    )}
                  </Box>
                </ListItem>

                {stats.indexedDB.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <StorageIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="قواعد البيانات المحلية (IndexedDB)"
                      secondary={`${stats.indexedDB.length} قاعدة بيانات: ${stats.indexedDB.join(', ')}`}
                    />
                    <Button
                      size="small"
                      onClick={() => handleClearSpecific('indexeddb')}
                      disabled={loading}
                    >
                      مسح
                    </Button>
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            إلغاء
          </Button>
          <Button
            onClick={handleClearAll}
            variant="contained"
            color="error"
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
            disabled={loading || cleared}
          >
            {loading ? 'جاري المسح...' : 'مسح جميع البيانات'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CacheClearButton;
