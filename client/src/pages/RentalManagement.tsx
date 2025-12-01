import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import apiClient from '../config/axios';

interface ManagementEntry {
  contractId: string;
  referenceNumber: string;
  unit?: { _id: string; unitNumber: string; unitType: string };
  secretary?: { _id: string; name: string };
  monthYear: string;
  dueDate: string;
  dueAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: string;
}

interface ManagementResponse {
  pending: ManagementEntry[];
  overdue: ManagementEntry[];
  partiallyPaid: ManagementEntry[];
  paid: ManagementEntry[];
}

const tabs = [
  { label: 'مستحقة', key: 'pending' },
  { label: 'متأخرة', key: 'overdue' },
  { label: 'مدفوعة جزئياً', key: 'partiallyPaid' },
  { label: 'مدفوعة', key: 'paid' },
];

const RentalManagement: React.FC = () => {
  const [data, setData] = useState<ManagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; entry?: ManagementEntry }>({ open: false });
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash',
    transactionRef: '',
    paymentDate: new Date().toISOString().substring(0, 10),
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/rental-management');
      setData(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPaymentDialog = (entry: ManagementEntry) => {
    setPaymentForm({
      amount: entry.remainingAmount.toString(),
      method: 'Cash',
      transactionRef: '',
      paymentDate: new Date().toISOString().substring(0, 10),
    });
    setPaymentDialog({ open: true, entry });
  };

  const handlePaymentChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const submitPayment = async () => {
    if (!paymentDialog.entry) return;
    if (paymentForm.method === 'KNET/Link' && !paymentForm.transactionRef.trim()) {
      setError('رقم مرجع المعاملة مطلوب');
      return;
    }
    try {
      setError(null);
      await apiClient.post('/api/rental-payments', {
        contractId: paymentDialog.entry.contractId,
        monthYear: paymentDialog.entry.monthYear,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        transactionRef: paymentForm.transactionRef,
        paymentDate: paymentForm.paymentDate,
      });
      setPaymentDialog({ open: false });
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في تسجيل الدفعة');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        لا توجد بيانات
      </Alert>
    );
  }

  const activeKey = tabs[tab].key as keyof ManagementResponse;
  const rows = data[activeKey] || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        إدارة الإيجارات الشهرية
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={tab} onChange={(e, value) => setTab(value)}>
            {tabs.map((t) => (
              <Tab key={t.key} label={`${t.label} (${data[t.key as keyof ManagementResponse].length})`} />
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الشهر</TableCell>
                <TableCell>الوحدة</TableCell>
                <TableCell>السكرتير</TableCell>
                <TableCell>المستحق</TableCell>
                <TableCell>المدفوع</TableCell>
                <TableCell>المتبقي</TableCell>
                <TableCell>الحالة</TableCell>
                {activeKey !== 'paid' && <TableCell>الإجراءات</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((entry) => (
                <TableRow key={`${entry.contractId}-${entry.monthYear}`}>
                  <TableCell>{entry.monthYear}</TableCell>
                  <TableCell>{entry.unit?.unitNumber}</TableCell>
                  <TableCell>{entry.secretary?.name}</TableCell>
                  <TableCell>{entry.dueAmount.toFixed(3)}</TableCell>
                  <TableCell>{entry.totalPaid.toFixed(3)}</TableCell>
                  <TableCell>{entry.remainingAmount.toFixed(3)}</TableCell>
                  <TableCell>{entry.status}</TableCell>
                  {activeKey !== 'paid' && (
                    <TableCell>
                      <Button variant="text" onClick={() => openPaymentDialog(entry)}>
                        تسجيل دفعة
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={paymentDialog.open} onClose={() => setPaymentDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>تسجيل دفعة</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="الشهر"
              value={paymentDialog.entry?.monthYear || ''}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="المبلغ (د.ك)"
              type="number"
              value={paymentForm.amount}
              onChange={handlePaymentChange('amount')}
              fullWidth
            />
            <TextField select label="طريقة الدفع" value={paymentForm.method} onChange={handlePaymentChange('method')} fullWidth>
              <MenuItem value="Cash">نقداً</MenuItem>
              <MenuItem value="KNET/Link">KNET / Link</MenuItem>
            </TextField>
            {paymentForm.method === 'KNET/Link' && (
              <TextField
                label="رقم مرجع العملية"
                value={paymentForm.transactionRef}
                onChange={handlePaymentChange('transactionRef')}
                fullWidth
                required
              />
            )}
            <TextField
              label="تاريخ الدفع"
              type="date"
              value={paymentForm.paymentDate}
              onChange={handlePaymentChange('paymentDate')}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog({ open: false })}>إلغاء</Button>
          <Button variant="contained" onClick={submitPayment}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RentalManagement;

