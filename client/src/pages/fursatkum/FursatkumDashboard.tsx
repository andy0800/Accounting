import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Download as DownloadIcon } from '@mui/icons-material';
import apiClient from '../../config/axios';

interface DashboardData {
  bankBalance: number;
  cashBalance: number;
  bankInfo: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban: string;
  };
  invoiceCounts: {
    income: number;
    spending: number;
    deleted: number;
    total: number;
  };
  recentTransactions: Array<{
    _id: string;
    type: string;
    ledger: string;
    amount: number;
    date: string;
    invoiceRef?: string;
  }>;
}

const FursatkumDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/fursatkum/dashboard');
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          نظام محاسبة فرصتكم
        </Typography>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => navigate('/fursatkum/invoices/new')}>
          فاتورة جديدة
        </Button>
      </Box>

      {error && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">الرصيد البنكي</Typography>
              <Typography variant="h5" fontWeight="bold">
                {data.bankBalance.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {data.bankInfo.bankName}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">رصيد الصندوق النقدي</Typography>
              <Typography variant="h5" fontWeight="bold">
                {data.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">فواتير الدخل</Typography>
              <Typography variant="h5" fontWeight="bold">{data.invoiceCounts.income}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">إيصالات الصرف</Typography>
              <Typography variant="h5" fontWeight="bold">{data.invoiceCounts.spending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">محذوف</Typography>
              <Typography variant="h5" fontWeight="bold">{data.invoiceCounts.deleted}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            آخر 10 معاملات
          </Typography>
          {data.recentTransactions.length === 0 ? (
            <Typography>لا توجد معاملات</Typography>
          ) : (
            data.recentTransactions.map((t) => (
              <Box key={t._id} sx={{ mb: 1, borderBottom: '1px solid #eee', pb: 1 }}>
                <Typography variant="body2">
                  {new Date(t.date).toLocaleString('ar-KW')} - {t.type} - {t.ledger} - {t.amount} د.ك - {t.invoiceRef || '-'}
                </Typography>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FursatkumDashboard;


