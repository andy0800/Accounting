import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';

const NewRentalUnit: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    unitType: '',
    unitNumber: '',
    address: '',
    rentAmount: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.unitNumber || !form.unitType || !form.address || !form.rentAmount) {
      setError('جميع الحقول الأساسية مطلوبة');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/api/rental-units', {
        ...form,
        rentAmount: parseFloat(form.rentAmount),
      });
      setSuccess(true);
      setTimeout(() => navigate('/renting/units'), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في إنشاء الوحدة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        إضافة وحدة تأجير جديدة
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          تم حفظ الوحدة بنجاح
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField label="رقم الوحدة" value={form.unitNumber} onChange={handleChange('unitNumber')} fullWidth required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="نوع الوحدة" value={form.unitType} onChange={handleChange('unitType')} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="العنوان"
                  value={form.address}
                  onChange={handleChange('address')}
                  fullWidth
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="الإيجار الشهري (د.ك)"
                  type="number"
                  value={form.rentAmount}
                  onChange={handleChange('rentAmount')}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField label="ملاحظات" value={form.notes} onChange={handleChange('notes')} fullWidth multiline rows={3} />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
              <Button variant="text" onClick={() => navigate(-1)}>
                إلغاء
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'حفظ'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NewRentalUnit;

