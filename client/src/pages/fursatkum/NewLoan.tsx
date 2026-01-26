import React, { useEffect, useState } from 'react';
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
}

const NewLoan: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultEmployeeId = searchParams.get('employeeId') || '';
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [form, setForm] = useState({
    employeeId: defaultEmployeeId,
    amount: '',
    ledger: 'cash',
    monthlyDeduction: '',
    description: '',
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

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleSubmit = async () => {
    if (!form.employeeId || !form.amount || !form.ledger) {
      setError('الحقول الأساسية مطلوبة');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await apiClient.post('/api/fursatkum/employee-loans', {
        employeeId: form.employeeId,
        amount: form.amount,
        ledger: form.ledger,
        monthlyDeduction: form.monthlyDeduction || undefined,
        description: form.description || undefined,
      });
      navigate(`/fursatkum/employees/${form.employeeId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في إنشاء القرض');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        إنشاء قرض موظف
      </Typography>

      {error && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      <Card>
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
                label="قيمة القرض"
                type="number"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                inputProps={{ min: 0.001, step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="الخصم الشهري (اختياري)"
                type="number"
                value={form.monthlyDeduction}
                onChange={(e) => setForm((p) => ({ ...p, monthlyDeduction: e.target.value }))}
                inputProps={{ min: 0, step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="الوصف (اختياري)"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
            <Button onClick={() => navigate('/fursatkum/employees')} disabled={loading}>
              إلغاء
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : undefined}>
              إنشاء
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NewLoan;

