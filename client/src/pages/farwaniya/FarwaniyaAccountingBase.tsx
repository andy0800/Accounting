import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import { Refresh as RefreshIcon, Download as DownloadIcon } from '@mui/icons-material';
import apiClient from '../../config/axios';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  invoiceRef?: string;
  description?: string;
  performedBy?: { username: string };
  date: string;
}

interface AccountingData {
  balance: number;
  incomeTotal: number;
  spendingTotal: number;
  transactions: Transaction[];
}

interface Props {
  systemKey: 'farwaniya1' | 'farwaniya2';
  title: string;
}

const typeLabels: Record<string, string> = {
  income: 'دخل',
  spending: 'صرف',
  income_reversal: 'عكس دخل',
  spending_reversal: 'عكس صرف',
  income_adjustment: 'تعديل دخل',
  spending_adjustment: 'تعديل صرف',
};

const typeColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  income: 'success',
  spending: 'error',
  income_reversal: 'warning',
  spending_reversal: 'warning',
  income_adjustment: 'default',
  spending_adjustment: 'default',
};

const FarwaniyaAccountingBase: React.FC<Props> = ({ systemKey, title }) => {
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/api/${systemKey}/accounting`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب بيانات المحاسبة');
    } finally {
      setLoading(false);
    }
  }, [systemKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      const response = await apiClient.get(`/api/exports/${systemKey}/accounting`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${systemKey}-accounting-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('خطأ في تصدير المحاسبة');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchData} startIcon={<RefreshIcon />}>
          إعادة المحاولة
        </Button>
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
            تحديث
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
            تصدير
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">الرصيد الحالي</Typography>
              <Typography variant="h5" fontWeight="bold">
                {data.balance.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">إجمالي الدخل</Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {data.incomeTotal.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">إجمالي المصروف</Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {data.spendingTotal.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            سجل المعاملات
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>النوع</TableCell>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>الرصيد بعد</TableCell>
                  <TableCell>المرجع</TableCell>
                  <TableCell>الوصف</TableCell>
                  <TableCell>بواسطة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      لا توجد معاملات
                    </TableCell>
                  </TableRow>
                ) : (
                  data.transactions.map((trans) => (
                    <TableRow key={trans._id}>
                      <TableCell>{new Date(trans.date).toLocaleString('ar-KW')}</TableCell>
                      <TableCell>
                        <Chip
                          label={typeLabels[trans.type] || trans.type}
                          color={typeColors[trans.type] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: trans.amount >= 0 ? 'success.main' : 'error.main' }}>
                        {trans.amount >= 0 ? '+' : ''}
                        {trans.amount.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell>
                        {trans.balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell>{trans.invoiceRef || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trans.description || '-'}
                      </TableCell>
                      <TableCell>{trans.performedBy?.username || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FarwaniyaAccountingBase;

