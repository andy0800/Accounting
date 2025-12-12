import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  AccountBalance as BankIcon,
  AccountBalanceWallet as CashIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as SpendingIcon,
} from '@mui/icons-material';
import apiClient from '../../config/axios';

interface Transaction {
  _id: string;
  type: string;
  ledger: 'cash' | 'bank';
  amount: number;
  balanceAfter: number;
  date: string;
  invoiceRef?: string;
  description?: string;
  reason?: string;
  performedBy?: { username: string };
}

interface AccountingData {
  bankBalance: number;
  cashBalance: number;
  bankInfo: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban: string;
  };
  totalIncome: number;
  totalSpendings: number;
  transactions: Transaction[];
}

const ledgerLabels: Record<string, string> = { bank: 'حساب بنكي', cash: 'صندوق نقدي' };
const typeColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  income: 'success',
  spending: 'error',
  income_reversal: 'warning',
  spending_reversal: 'warning',
  income_adjustment: 'default',
  spending_adjustment: 'default',
};

const typeLabels: Record<string, string> = {
  income: 'دخل',
  spending: 'صرف',
  income_reversal: 'عكس دخل',
  spending_reversal: 'عكس صرف',
  income_adjustment: 'تعديل دخل',
  spending_adjustment: 'تعديل صرف',
};

const FursatkumAccounting: React.FC = () => {
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLedger, setActiveLedger] = useState<'all' | 'bank' | 'cash'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/fursatkum/accounting');
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب بيانات المحاسبة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/exports/fursatkum/accounting', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fursatkum-accounting-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('خطأ في تصدير المحاسبة');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  const filteredTransactions =
    activeLedger === 'all' ? data.transactions : data.transactions.filter((t) => t.ledger === activeLedger);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          محاسبة فرصتكم
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
            تحديث
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
            تصدير Excel
          </Button>
        </Box>
      </Box>

      {error && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BankIcon sx={{ fontSize: 40, mr: 1 }} />
                  <Typography variant="h6">رصيد الحساب البنكي</Typography>
                </Box>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {data.bankBalance.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
              <Box sx={{ mt: 2, color: 'rgba(255,255,255,0.9)' }}>
                <Typography variant="body2">البنك: {data.bankInfo.bankName}</Typography>
                <Typography variant="body2">اسم الحساب: {data.bankInfo.accountName}</Typography>
                <Typography variant="body2">رقم الحساب: {data.bankInfo.accountNumber}</Typography>
                <Typography variant="body2">IBAN: {data.bankInfo.iban}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #8e24aa 0%, #ce93d8 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CashIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6">رصيد الصندوق النقدي</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {data.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IncomeIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6">إجمالي الدخل</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {data.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #c62828 0%, #ef5350 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpendingIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6">إجمالي المصروفات</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {data.totalSpendings.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">سجل المعاملات</Typography>
          </Box>
          <Tabs value={activeLedger} onChange={(_, v) => setActiveLedger(v)} sx={{ mb: 2 }}>
            <Tab label="الكل" value="all" />
            <Tab label="حساب بنكي" value="bank" />
            <Tab label="صندوق نقدي" value="cash" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>النوع</TableCell>
                  <TableCell>الدفة</TableCell>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>الرصيد بعد</TableCell>
                  <TableCell>المرجع</TableCell>
                  <TableCell>الوصف</TableCell>
                  <TableCell>السبب</TableCell>
                  <TableCell>بواسطة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      لا توجد معاملات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((t) => (
                    <TableRow key={t._id} hover>
                      <TableCell>{new Date(t.date).toLocaleDateString('ar-KW')}</TableCell>
                      <TableCell>
                        <Chip label={typeLabels[t.type] || t.type} color={typeColors[t.type] || 'default'} size="small" />
                      </TableCell>
                      <TableCell>{ledgerLabels[t.ledger]}</TableCell>
                      <TableCell sx={{ color: t.amount >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                        {t.amount >= 0 ? '+' : ''}
                        {t.amount.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell>{t.balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك</TableCell>
                      <TableCell>{t.invoiceRef || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description || '-'}</TableCell>
                      <TableCell>{t.reason || '-'}</TableCell>
                      <TableCell>{t.performedBy?.username || '-'}</TableCell>
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

export default FursatkumAccounting;


