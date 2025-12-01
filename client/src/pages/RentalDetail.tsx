import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import apiClient from '../config/axios';

interface ContractMonth {
  monthYear: string;
  dueDate: string;
  dueAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: string;
}

interface RentalContract {
  _id: string;
  referenceNumber: string;
  rentAmount: number;
  startDate: string;
  dueDay: number;
  durationMonths: number;
  status: string;
  months: ContractMonth[];
  unitId?: { unitNumber: string; unitType: string; address: string };
  rentalSecretaryId?: { name: string; phone: string };
}

interface Payment {
  _id: string;
  monthYear: string;
  amount: number;
  method: string;
  transactionRef?: string;
  paymentDate: string;
}

const RentalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [terminateLoading, setTerminateLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    monthYear: '',
    amount: '',
    method: 'Cash',
    transactionRef: '',
    paymentDate: '',
    notes: '',
  });

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [contractRes, paymentsRes] = await Promise.all([
        apiClient.get(`/api/rental-contracts/${id}`),
        apiClient.get(`/api/rental-payments/contract/${id}`),
      ]);
      setContract(contractRes.data);
      setPayments(paymentsRes.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في جلب بيانات العقد');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openPaymentDialog = (monthYear?: string) => {
    setPaymentForm((prev) => ({
      ...prev,
      monthYear: monthYear || prev.monthYear || '',
      amount: '',
      method: 'Cash',
      transactionRef: '',
      paymentDate: new Date().toISOString().substring(0, 10),
      notes: '',
    }));
    setPaymentDialogOpen(true);
  };

  const handlePaymentChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const submitPayment = async () => {
    if (!contract) return;
    if (!paymentForm.monthYear || !paymentForm.amount) {
      setError('الرجاء تعبئة بيانات الدفع');
      return;
    }
    if (paymentForm.method === 'KNET/Link' && !paymentForm.transactionRef.trim()) {
      setError('رقم مرجع المعاملة مطلوب لدفعات KNET/Link');
      return;
    }
    try {
      setError(null);
      await apiClient.post('/api/rental-payments', {
        contractId: contract._id,
        monthYear: paymentForm.monthYear,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        transactionRef: paymentForm.transactionRef,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes,
      });
      setPaymentDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في تسجيل الدفعة');
    }
  };

  const terminateContract = async () => {
    if (!contract) return;
    if (!window.confirm('هل أنت متأكد من إنهاء العقد؟')) return;
    try {
      setTerminateLoading(true);
      await apiClient.patch(`/api/rental-contracts/${contract._id}/terminate`, {
        reason: 'تم الإنهاء من الواجهة',
      });
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في إنهاء العقد');
    } finally {
      setTerminateLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!contract) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        العقد غير موجود
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">عقد: {contract.referenceNumber}</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => openPaymentDialog()}>
            تسجيل دفعة
          </Button>
          <Button variant="contained" color="error" onClick={terminateContract} disabled={terminateLoading || contract.status === 'منتهي'}>
            {terminateLoading ? <CircularProgress size={20} /> : 'إنهاء العقد'}
          </Button>
        </Stack>
      </Stack>

      {error && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">الوحدة</Typography>
              <Typography>{contract.unitId?.unitNumber}</Typography>
              <Typography color="text.secondary">{contract.unitId?.unitType}</Typography>
              <Typography>{contract.unitId?.address}</Typography>
              <Chip label={`الحالة: ${contract.status}`} sx={{ mt: 2 }} color={contract.status === 'نشط' ? 'success' : 'default'} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">السكرتير</Typography>
              <Typography>{contract.rentalSecretaryId?.name}</Typography>
              <Typography color="text.secondary">{contract.rentalSecretaryId?.phone}</Typography>
              <Typography sx={{ mt: 2 }}>الإيجار الشهري: {contract.rentAmount.toFixed(3)} د.ك</Typography>
              <Typography>تاريخ البدء: {new Date(contract.startDate).toLocaleDateString('ar-KW')}</Typography>
              <Typography>عدد الشهور: {contract.durationMonths}</Typography>
              <Typography>يوم الاستحقاق: {contract.dueDay}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            جدول الدفعات
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الشهر</TableCell>
                <TableCell>تاريخ الاستحقاق</TableCell>
                <TableCell>المستحق</TableCell>
                <TableCell>المدفوع</TableCell>
                <TableCell>المتبقي</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contract.months.map((month) => (
                <TableRow key={month.monthYear}>
                  <TableCell>{month.monthYear}</TableCell>
                  <TableCell>{new Date(month.dueDate).toLocaleDateString('ar-KW')}</TableCell>
                  <TableCell>{month.dueAmount.toFixed(3)}</TableCell>
                  <TableCell>{month.totalPaid.toFixed(3)}</TableCell>
                  <TableCell>{month.remainingAmount.toFixed(3)}</TableCell>
                  <TableCell>
                    <Chip
                      label={month.status}
                      color={
                        month.status === 'Paid'
                          ? 'success'
                          : month.status === 'Overdue'
                            ? 'error'
                            : month.status === 'Partially Paid'
                              ? 'warning'
                              : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="text" onClick={() => openPaymentDialog(month.monthYear)}>
                      تسجيل دفعة
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            المدفوعات السابقة
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>التاريخ</TableCell>
                <TableCell>الشهر</TableCell>
                <TableCell>المبلغ</TableCell>
                <TableCell>الطريقة</TableCell>
                <TableCell>مرجع العملية</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString('ar-KW')}</TableCell>
                  <TableCell>{payment.monthYear}</TableCell>
                  <TableCell>{payment.amount.toFixed(3)}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{payment.transactionRef || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>تسجيل دفعة</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="الشهر"
            value={paymentForm.monthYear}
            onChange={handlePaymentChange('monthYear')}
            fullWidth
            margin="normal"
            required
          >
            {contract.months.map((month) => (
              <MenuItem key={month.monthYear} value={month.monthYear}>
                {month.monthYear} - مستحق {month.dueAmount.toFixed(3)} د.ك
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="المبلغ (د.ك)"
            type="number"
            value={paymentForm.amount}
            onChange={handlePaymentChange('amount')}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            select
            label="طريقة الدفع"
            value={paymentForm.method}
            onChange={handlePaymentChange('method')}
            fullWidth
            margin="normal"
          >
            <MenuItem value="Cash">نقداً</MenuItem>
            <MenuItem value="KNET/Link">KNET / رابط</MenuItem>
          </TextField>
          {paymentForm.method === 'KNET/Link' && (
            <TextField
              label="رقم مرجع العملية"
              value={paymentForm.transactionRef}
              onChange={handlePaymentChange('transactionRef')}
              fullWidth
              margin="normal"
              required
            />
          )}
          <TextField
            label="تاريخ الدفع"
            type="date"
            value={paymentForm.paymentDate}
            onChange={handlePaymentChange('paymentDate')}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="ملاحظات"
            value={paymentForm.notes}
            onChange={handlePaymentChange('notes')}
            fullWidth
                margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>إلغاء</Button>
          <Button onClick={submitPayment} variant="contained">
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RentalDetail;

