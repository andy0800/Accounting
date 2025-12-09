import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import {
  AccountBalance as FundingIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as SpendingIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import apiClient from '../../config/axios';
import { auth } from '../../utils/auth';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  category: string;
  date: string;
  invoiceRef?: string;
  description?: string;
  performedBy?: { username: string };
}

interface AccountingData {
  fundingCredit: number;
  incomeProfit: number;
  totalSpendings: number;
  fundingTransactions: Transaction[];
  incomeTransactions: Transaction[];
}

const typeLabels: Record<string, string> = {
  add_funds: 'إضافة رصيد',
  income: 'فاتورة دخل',
  spending: 'إيصال صرف',
  income_reversal: 'عكس دخل (حذف)',
  spending_reversal: 'عكس صرف (حذف)',
  income_adjustment: 'تعديل دخل',
  spending_adjustment: 'تعديل صرف',
};

const typeColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  add_funds: 'info',
  income: 'success',
  spending: 'error',
  income_reversal: 'warning',
  spending_reversal: 'warning',
  income_adjustment: 'default',
  spending_adjustment: 'default',
};

const HSAccounting: React.FC = () => {
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'funding' | 'income'>('funding');
  const [addFundsDialog, setAddFundsDialog] = useState(false);
  const [addFundsForm, setAddFundsForm] = useState({ amount: '', description: '' });
  const [addingFunds, setAddingFunds] = useState(false);

  const isAdmin = auth.getRole() === 'admin';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/home-service/accounting');
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب بيانات المحاسبة');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddFunds = async () => {
    if (!addFundsForm.amount || !addFundsForm.description) {
      setError('المبلغ والوصف مطلوبان');
      return;
    }

    const amount = parseFloat(addFundsForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('المبلغ غير صالح');
      return;
    }

    try {
      setAddingFunds(true);
      await apiClient.post('/api/home-service/funding/add', {
        amount,
        description: addFundsForm.description,
      });
      setAddFundsDialog(false);
      setAddFundsForm({ amount: '', description: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في إضافة الرصيد');
    } finally {
      setAddingFunds(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/exports/home-service/accounting', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `home-service-accounting-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
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

  if (!data) return null;

  const transactions = activeTab === 'funding' ? data.fundingTransactions : data.incomeTransactions;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          المحاسبة
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={fetchData} startIcon={<RefreshIcon />}>
            تحديث
          </Button>
          <Button variant="outlined" onClick={handleExport} startIcon={<DownloadIcon />}>
            تصدير Excel
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              border: activeTab === 'funding' ? '3px solid #fff' : 'none',
              '&:hover': { transform: 'scale(1.02)' },
            }}
            onClick={() => setActiveTab('funding')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FundingIcon sx={{ fontSize: 40, mr: 1 }} />
                    <Typography variant="h6">رصيد التمويل</Typography>
                  </Box>
                  <Typography variant="h3" fontWeight="bold">
                    {data.fundingCredit.toLocaleString('en-US', { minimumFractionDigits: 3 })}
                  </Typography>
                  <Typography variant="h6">د.ك</Typography>
                </Box>
                {isAdmin && (
                  <Button
                    variant="contained"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                    startIcon={<AddIcon />}
                    onClick={(e) => { e.stopPropagation(); setAddFundsDialog(true); }}
                  >
                    إضافة رصيد
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              border: activeTab === 'income' ? '3px solid #fff' : 'none',
              '&:hover': { transform: 'scale(1.02)' },
            }}
            onClick={() => setActiveTab('income')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IncomeIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h6">أرباح الدخل</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {data.incomeProfit.toLocaleString('en-US', { minimumFractionDigits: 3 })}
              </Typography>
              <Typography variant="h6">د.ك</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Spendings Card - Full Width */}
        <Grid item xs={12}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #c62828 0%, #ef5350 100%)',
              color: 'white',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.01)' },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SpendingIcon sx={{ fontSize: 48, mr: 1 }} />
                  <Typography variant="h5">إجمالي المصروفات</Typography>
                </Box>
                <Typography variant="h2" fontWeight="bold">
                  {data.totalSpendings.toLocaleString('en-US', { minimumFractionDigits: 3 })}
                </Typography>
                <Typography variant="h6">د.ك</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transaction History */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label="سجل رصيد التمويل" value="funding" />
            <Tab label="سجل أرباح الدخل" value="income" />
          </Tabs>

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
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      لا توجد معاملات
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((trans) => (
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

      {/* Add Funds Dialog */}
      <Dialog open={addFundsDialog} onClose={() => setAddFundsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة رصيد تمويل</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="المبلغ"
              type="number"
              value={addFundsForm.amount}
              onChange={(e) => setAddFundsForm((prev) => ({ ...prev, amount: e.target.value }))}
              fullWidth
              inputProps={{ min: 0.001, step: 0.001 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">د.ك</InputAdornment>,
              }}
            />
            <TextField
              label="السبب / الوصف"
              value={addFundsForm.description}
              onChange={(e) => setAddFundsForm((prev) => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              placeholder="مثال: تمويل شهر يناير 2025"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFundsDialog(false)} disabled={addingFunds}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={handleAddFunds}
            disabled={addingFunds}
            startIcon={addingFunds ? <CircularProgress size={20} /> : <AddIcon />}
          >
            إضافة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HSAccounting;

