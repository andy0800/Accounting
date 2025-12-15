import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  AccountBalance as BalanceIcon,
  TrendingUp as IncomeIcon,
  Receipt as InvoiceIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  TrendingDown as SpendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/axios';

type DashboardData = {
  balance: number;
  incomeTotal: number;
  spendingTotal: number;
  invoiceCounts: {
    income: number;
    spending: number;
    deleted: number;
    total: number;
  };
  recentTransactions: Array<{
    _id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    date: string;
    invoiceRef?: string;
    description?: string;
    performedBy?: { username: string };
  }>;
};

const typeLabels: Record<string, string> = {
  income: 'فاتورة دخل',
  spending: 'إيصال صرف',
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

interface Props {
  systemKey: 'farwaniya1' | 'farwaniya2';
  title: string;
  basePath: string;
  createIncomePath: string;
  createSpendingPath: string;
  invoicesPath: string;
  accountingPath: string;
}

const FarwaniyaDashboard: React.FC<Props> = ({
  systemKey,
  title,
  basePath,
  createIncomePath,
  createSpendingPath,
  invoicesPath,
  accountingPath,
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/${systemKey}/dashboard`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, [systemKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <Typography variant="h4" fontWeight="bold">
          {title}
        </Typography>
        <Button variant="outlined" onClick={fetchData} startIcon={<RefreshIcon />}>
          تحديث
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BalanceIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6">الرصيد</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {data.balance.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IncomeIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6">إجمالي الدخل</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {data.incomeTotal.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #c62828 0%, #ef5350 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpendingIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6">إجمالي المصروف</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {data.spendingTotal.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f57c00 0%, #ffb74d 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InvoiceIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6">إجمالي الفواتير</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {data.invoiceCounts.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                دخل: {data.invoiceCounts.income} | صرف: {data.invoiceCounts.spending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          إجراءات سريعة
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="success"
            onClick={() => navigate(`${createIncomePath}`)}
          >
            فاتورة دخل جديدة
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => navigate(`${createSpendingPath}`)}
          >
            إيصال صرف جديد
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(`${invoicesPath}`)}
          >
            عرض جميع الفواتير
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(`${accountingPath}`)}
          >
            صفحة المحاسبة
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            آخر المعاملات
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
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
                {data.recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      لا توجد معاملات حتى الآن
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentTransactions.map((trans) => (
                    <TableRow key={trans._id} hover>
                      <TableCell>
                        {new Date(trans.date).toLocaleDateString('ar-KW')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={typeLabels[trans.type] || trans.type}
                          color={typeColors[trans.type] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          color: trans.amount >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold',
                        }}
                      >
                        {trans.amount >= 0 ? '+' : ''}
                        {trans.amount.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell>
                        {trans.balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell>{trans.invoiceRef || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

export default FarwaniyaDashboard;

