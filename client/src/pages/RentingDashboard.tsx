import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';

const RentingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [management, setManagement] = useState<any>(null);
  const [accounting, setAccounting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [managementRes, accountingRes] = await Promise.all([
        apiClient.get('/api/rental-management'),
        apiClient.get('/api/rental-accounting'),
      ]);
      setManagement(managementRes.data);
      setAccounting(accountingRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        لوحة مراقبة نظام التأجير
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">مستحق</Typography>
              <Typography variant="h5">{management?.pending?.length || 0}</Typography>
              <Button size="small" sx={{ mt: 1 }} onClick={() => navigate('/renting/management')}>
                عرض التفاصيل
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">متأخر</Typography>
              <Typography variant="h5">{management?.overdue?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">مدفوع جزئياً</Typography>
              <Typography variant="h5">{management?.partiallyPaid?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">مدفوع</Typography>
              <Typography variant="h5">{management?.paid?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {accounting && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              نظرة محاسبية لشهر {accounting.month}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary">المتوقع</Typography>
                <Typography variant="h5">{accounting.summary.expected.toFixed(3)} د.ك</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary">مدفوع</Typography>
                <Typography variant="h5">{accounting.summary.paid.toFixed(3)} د.ك</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary">متبقي</Typography>
                <Typography variant="h5">{accounting.summary.unpaid.toFixed(3)} د.ك</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary">متأخر</Typography>
                <Typography variant="h5">{accounting.summary.overdue.toFixed(3)} د.ك</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RentingDashboard;

