import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../config/axios';

interface EmployeeRow {
  _id: string;
  name: string;
  monthlySalary: number;
}

interface LoanRow {
  _id: string;
  referenceNumber: string;
  remainingAmount: number;
  monthlyDeduction?: number;
  createdAt: string;
}

const SalaryProcessor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultEmployeeId = searchParams.get('employeeId') || '';

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [activeLoans, setActiveLoans] = useState<LoanRow[]>([]);
  const [form, setForm] = useState({
    employeeId: defaultEmployeeId,
    grossSalary: '',
    ledger: 'cash',
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const resp = await apiClient.get('/api/fursatkum/employees', { params: { status: 'active', limit: 500 } });
      setEmployees(resp.data?.employees || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في تحميل الموظفين');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadLoans = async (employeeId: string) => {
    if (!employeeId) {
      setActiveLoans([]);
      return;
    }
    try {
      const resp = await apiClient.get('/api/fursatkum/employee-loans', {
        params: { employeeId, status: 'active', limit: 200 },
      });
      setActiveLoans(resp.data?.loans || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في تحميل القروض');
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadLoans(form.employeeId);
  }, [form.employeeId]);

  const outstandingTotal = useMemo(
    () => activeLoans.reduce((sum, loan) => sum + (loan.remainingAmount || 0), 0),
    [activeLoans]
  );

  const grossSalaryNum = parseFloat(form.grossSalary || '0') || 0;
  const deduction = useMemo(() => {
    if (activeLoans.length === 0 || grossSalaryNum <= 0) return 0;
    const sorted = [...activeLoans].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let remaining = grossSalaryNum;
    let total = 0;
    for (const loan of sorted) {
      if (remaining <= 0) break;
      const planned = loan.monthlyDeduction !== undefined && loan.monthlyDeduction !== null
        ? loan.monthlyDeduction
        : loan.remainingAmount;
      const applied = Math.min(planned, loan.remainingAmount, remaining);
      if (applied > 0) {
        total += applied;
        remaining -= applied;
      }
    }
    return total;
  }, [activeLoans, grossSalaryNum]);
  const netPaid = Math.max(0, grossSalaryNum - deduction);
  useEffect(() => {
    if (!form.employeeId || form.grossSalary) return;
    const selected = employees.find((emp) => emp._id === form.employeeId);
    if (selected) {
      setForm((p) => ({ ...p, grossSalary: selected.monthlySalary.toString() }));
    }
  }, [employees, form.employeeId, form.grossSalary]);


  const handleSubmit = async () => {
    if (!form.employeeId || !form.grossSalary || !form.ledger || !form.date) {
      setError('الحقول الأساسية مطلوبة');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await apiClient.post('/api/fursatkum/salaries/pay', {
        employeeId: form.employeeId,
        grossSalary: form.grossSalary,
        ledger: form.ledger,
        date: form.date,
      });
      navigate(`/fursatkum/employees/${form.employeeId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في صرف الراتب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        صرف راتب موظف
      </Typography>

      {error && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="الموظف"
                value={form.employeeId}
                onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
                disabled={loadingEmployees}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="الراتب الإجمالي"
                type="number"
                value={form.grossSalary}
                onChange={(e) => setForm((p) => ({ ...p, grossSalary: e.target.value }))}
                inputProps={{ min: 0.001, step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="الدفة"
                value={form.ledger}
                onChange={(e) => setForm((p) => ({ ...p, ledger: e.target.value }))}
              >
                <MenuItem value="cash">صندوق نقدي</MenuItem>
                <MenuItem value="bank">حساب بنكي</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="التاريخ"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ملخص الخصم
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">القرض المستحق (الإجمالي)</Typography>
              <Typography fontWeight="bold">
                {outstandingTotal.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">الخصم المتوقع</Typography>
              <Typography fontWeight="bold">
                {deduction.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
              {activeLoans.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {activeLoans.length > 1 ? 'خصم موزع على عدة قروض' : `القرض: ${activeLoans[0].referenceNumber}`}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">الصافي المدفوع</Typography>
              <Typography fontWeight="bold">
                {netPaid.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={() => navigate('/fursatkum/employees')} disabled={loading}>
          إلغاء
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : undefined}>
          صرف
        </Button>
      </Box>
    </Box>
  );
};

export default SalaryProcessor;

