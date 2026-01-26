import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Grid, TextField, Typography, MenuItem, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/axios';

const NewEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', monthlySalary: '', status: 'active', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.name || !form.monthlySalary) {
      setError('الحقول الأساسية مطلوبة');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await apiClient.post('/api/fursatkum/employees', {
        name: form.name,
        monthlySalary: form.monthlySalary,
        status: form.status,
        notes: form.notes || undefined,
      });
      navigate('/fursatkum/employees');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في إنشاء الموظف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        إضافة موظف جديد
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="اسم الموظف"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="الراتب الشهري"
                type="number"
                value={form.monthlySalary}
                onChange={(e) => setForm((p) => ({ ...p, monthlySalary: e.target.value }))}
                inputProps={{ min: 0.001, step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="الحالة"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                <MenuItem value="active">نشط</MenuItem>
                <MenuItem value="inactive">غير نشط</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات (اختياري)"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
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

export default NewEmployee;

