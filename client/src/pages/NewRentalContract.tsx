import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Alert,
  MenuItem,
  Stack,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';

interface UnitOption {
  _id: string;
  unitNumber: string;
  unitType: string;
  rentAmount: number;
}

interface SecretaryOption {
  _id: string;
  name: string;
  phone: string;
}

const NewRentalContract: React.FC = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [secretaries, setSecretaries] = useState<SecretaryOption[]>([]);
  const [form, setForm] = useState({
    unitId: '',
    rentalSecretaryId: '',
    rentAmount: '',
    startDate: '',
    dueDay: '',
    durationMonths: '12',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchOptions = async () => {
    try {
      const [unitsRes, secRes] = await Promise.all([
        apiClient.get('/api/rental-units/available/list'),
        apiClient.get('/api/renting-secretaries'),
      ]);
      setUnits(unitsRes.data || []);
      setSecretaries(secRes.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في تحميل البيانات');
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (field === 'unitId') {
      const selected = units.find((u) => u._id === event.target.value);
      if (selected) {
        setForm((prev) => ({ ...prev, rentAmount: selected.rentAmount.toString() }));
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.unitId || !form.rentalSecretaryId || !form.startDate || !form.dueDay) {
      setError('الرجاء تعبئة جميع الحقول المطلوبة');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/api/rental-contracts', {
        ...form,
        rentAmount: parseFloat(form.rentAmount),
        dueDay: Number(form.dueDay),
        durationMonths: Number(form.durationMonths),
      });
      setSuccess(true);
      setTimeout(() => navigate('/renting/contracts'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في إنشاء العقد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        عقد تأجير جديد
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          تم إنشاء العقد بنجاح
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="الوحدة"
                  value={form.unitId}
                  onChange={handleChange('unitId')}
                  fullWidth
                  required
                >
                  {units.map((unit) => (
                    <MenuItem key={unit._id} value={unit._id}>
                      {unit.unitNumber} - {unit.unitType} ({unit.rentAmount.toFixed(3)} د.ك)
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="سكرتير التأجير"
                  value={form.rentalSecretaryId}
                  onChange={handleChange('rentalSecretaryId')}
                  fullWidth
                  required
                >
                  {secretaries.map((sec) => (
                    <MenuItem key={sec._id} value={sec._id}>
                      {sec.name} - {sec.phone}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="الإيجار الشهري (د.ك)"
                  type="number"
                  value={form.rentAmount}
                  onChange={handleChange('rentAmount')}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="تاريخ البدء"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange('startDate')}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="يوم الاستحقاق"
                  type="number"
                  value={form.dueDay}
                  onChange={handleChange('dueDay')}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="مدة العقد (شهور)"
                  type="number"
                  value={form.durationMonths}
                  onChange={handleChange('durationMonths')}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="ملاحظات"
                  value={form.notes}
                  onChange={handleChange('notes')}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
              <Button variant="text" onClick={() => navigate(-1)}>
                إلغاء
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'إنشاء العقد'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NewRentalContract;

