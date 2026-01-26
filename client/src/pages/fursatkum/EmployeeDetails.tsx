import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../config/axios';

interface EmployeeRow {
  _id: string;
  name: string;
  monthlySalary: number;
  status: 'active' | 'inactive';
  notes?: string;
}

interface LoanRow {
  _id: string;
  referenceNumber: string;
  originalAmount: number;
  remainingAmount: number;
  monthlyDeduction?: number;
  status: 'active' | 'paid' | 'cancelled';
  createdAt: string;
}

interface SalaryRow {
  _id: string;
  referenceNumber: string;
  grossSalary: number;
  loanDeducted: number;
  netPaid: number;
  ledger: 'cash' | 'bank';
  date: string;
}

const EmployeeDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [salaries, setSalaries] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [repayDialog, setRepayDialog] = useState(false);
  const [repayTarget, setRepayTarget] = useState<LoanRow | null>(null);
  const [repayForm, setRepayForm] = useState({ amount: '', ledger: 'cash' });
  const [working, setWorking] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [employeeResp, loansResp, salariesResp] = await Promise.all([
        apiClient.get(`/api/fursatkum/employees/${id}`),
        apiClient.get('/api/fursatkum/employee-loans', { params: { employeeId: id, limit: 200 } }),
        apiClient.get('/api/fursatkum/salaries', { params: { employeeId: id, limit: 200 } }),
      ]);

      setEmployee(employeeResp.data || null);
      setLoans(loansResp.data?.loans || []);
      setSalaries(salariesResp.data?.salaries || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب بيانات الموظف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const outstandingTotal = useMemo(
    () => loans.reduce((sum, loan) => sum + (loan.remainingAmount || 0), 0),
    [loans]
  );

  const openRepay = (loan: LoanRow) => {
    setRepayTarget(loan);
    setRepayForm({ amount: '', ledger: 'cash' });
    setRepayDialog(true);
  };

  const handleRepay = async () => {
    if (!repayTarget) return;
    if (!repayForm.amount) {
      setError('قيمة السداد مطلوبة');
      return;
    }
    try {
      setWorking(true);
      setError(null);
      await apiClient.post(`/api/fursatkum/employee-loans/${repayTarget._id}/repay`, {
        amount: repayForm.amount,
        ledger: repayForm.ledger,
      });
      setRepayDialog(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في سداد القرض');
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>الموظف غير موجود</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          الموظف: {employee.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate(`/fursatkum/loans/new?employeeId=${employee._id}`)}>
            قرض جديد
          </Button>
          <Button variant="contained" onClick={() => navigate(`/fursatkum/salaries/process?employeeId=${employee._id}`)}>
            صرف راتب
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
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">الراتب الشهري</Typography>
              <Typography variant="h5" fontWeight="bold">
                {employee.monthlySalary.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">القروض المستحقة</Typography>
              <Typography variant="h5" fontWeight="bold">
                {outstandingTotal.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            القروض
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>المرجع</TableCell>
                  <TableCell>الأصل</TableCell>
                  <TableCell>المتبقي</TableCell>
                  <TableCell>الخصم الشهري</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>تاريخ الإنشاء</TableCell>
                  <TableCell>إجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      لا توجد قروض
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan) => (
                    <TableRow key={loan._id} hover>
                      <TableCell>{loan.referenceNumber}</TableCell>
                      <TableCell>
                        {loan.originalAmount.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {loan.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell>
                        {loan.monthlyDeduction !== undefined
                          ? `${loan.monthlyDeduction.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك`
                          : '-'}
                      </TableCell>
                      <TableCell>{loan.status}</TableCell>
                      <TableCell>{new Date(loan.createdAt).toLocaleDateString('ar-KW')}</TableCell>
                      <TableCell>
                        <Button size="small" disabled={loan.status !== 'active'} onClick={() => openRepay(loan)}>
                          سداد
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            الرواتب
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>المرجع</TableCell>
                  <TableCell>الراتب الإجمالي</TableCell>
                  <TableCell>خصم القرض</TableCell>
                  <TableCell>الصافي</TableCell>
                  <TableCell>الدفة</TableCell>
                  <TableCell>التاريخ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      لا توجد رواتب
                    </TableCell>
                  </TableRow>
                ) : (
                  salaries.map((salary) => (
                    <TableRow key={salary._id} hover>
                      <TableCell>{salary.referenceNumber}</TableCell>
                      <TableCell>
                        {salary.grossSalary.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell>
                        {salary.loanDeducted.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {salary.netPaid.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell>{salary.ledger === 'bank' ? 'حساب بنكي' : 'صندوق نقدي'}</TableCell>
                      <TableCell>{new Date(salary.date).toLocaleDateString('ar-KW')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={repayDialog} onClose={() => setRepayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>سداد القرض</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="قيمة السداد"
                type="number"
                value={repayForm.amount}
                onChange={(e) => setRepayForm((p) => ({ ...p, amount: e.target.value }))}
                inputProps={{ min: 0.001, step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="الدفة"
                value={repayForm.ledger}
                onChange={(e) => setRepayForm((p) => ({ ...p, ledger: e.target.value }))}
              >
                <MenuItem value="cash">صندوق نقدي</MenuItem>
                <MenuItem value="bank">حساب بنكي</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRepayDialog(false)} disabled={working}>
            إلغاء
          </Button>
          <Button variant="contained" onClick={handleRepay} disabled={working}>
            سداد
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeDetails;

