import React, { useState } from 'react';
import apiClient from '../config/axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface NewRentingSecretaryForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const NewRentingSecretary: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<NewRentingSecretaryForm>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof NewRentingSecretaryForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!form.name || !form.phone) {
      setError('يرجى ملء الحقول المطلوبة (الاسم والهاتف)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await apiClient.post('/api/renting-secretaries', {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/renting/secretaries');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = form.name && form.phone;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/renting/secretaries')}
          sx={{ mr: 2 }}
        >
          رجوع
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          إضافة سكرتير إيجار جديد
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          تم إضافة السكرتير بنجاح! سيتم توجيهك إلى صفحة السكرتارية...
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="اسم السكرتير"
                  value={form.name}
                  onChange={handleInputChange('name')}
                  placeholder="الاسم الكامل"
                  required
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم الهاتف"
                  value={form.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="رقم الهاتف"
                  required
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="البريد الإلكتروني (اختياري)"
                  value={form.email}
                  onChange={handleInputChange('email')}
                  placeholder="example@email.com"
                  type="email"
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="العنوان (اختياري)"
                  value={form.address}
                  onChange={handleInputChange('address')}
                  placeholder="العنوان"
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ملاحظات (اختياري)"
                  value={form.notes}
                  onChange={handleInputChange('notes')}
                  placeholder="ملاحظات إضافية"
                  disabled={loading}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/renting/secretaries')}
                    disabled={loading}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={!isFormValid || loading}
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ السكرتير'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NewRentingSecretary;
