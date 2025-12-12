import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Typography,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../config/axios';

const FursatkumNewInvoice: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as 'income' | 'spending') || 'income';

  const [form, setForm] = useState({
    type: initialType,
    ledger: 'cash',
    name: '',
    value: '',
    bankReference: '',
    date: new Date().toISOString().slice(0, 10),
    details: '',
    document: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.name || !form.value || !form.date) {
      setError('الحقول الأساسية مطلوبة');
      return;
    }
    if (form.ledger === 'bank' && !form.bankReference) {
      setError('المرجع البنكي مطلوب للحساب البنكي');
      return;
    }
    const formData = new FormData();
    formData.append('type', form.type);
    formData.append('ledger', form.ledger);
    formData.append('name', form.name);
    formData.append('value', form.value);
    formData.append('date', form.date);
    if (form.bankReference) formData.append('bankReference', form.bankReference);
    if (form.details) formData.append('details', form.details);
    if (form.document) formData.append('document', form.document);

    try {
      setLoading(true);
      setError(null);
      await apiClient.post('/api/fursatkum/invoices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/fursatkum/invoices');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في إنشاء الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        إنشاء فاتورة جديدة
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
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="النوع"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as 'income' | 'spending' }))}
              >
                <MenuItem value="income">فاتورة دخل</MenuItem>
                <MenuItem value="spending">إيصال صرف</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="الدفة"
                value={form.ledger}
                onChange={(e) => setForm((p) => ({ ...p, ledger: e.target.value as 'cash' | 'bank' }))}
              >
                <MenuItem value="cash">صندوق نقدي</MenuItem>
                <MenuItem value="bank">حساب بنكي</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="اسم الفاتورة"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="القيمة"
                type="number"
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">د.ك</InputAdornment>,
                  inputProps: { min: 0.001, step: 0.001 },
                }}
              />
            </Grid>
            {form.ledger === 'bank' && (
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="المرجع البنكي"
                  value={form.bankReference}
                  onChange={(e) => setForm((p) => ({ ...p, bankReference: e.target.value }))}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="التاريخ"
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="التفاصيل (اختياري)"
                value={form.details}
                onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label">
                رفع مستند (اختياري)
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setForm((p) => ({ ...p, document: e.target.files?.[0] || null }))}
                />
              </Button>
              {form.document && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  الملف: {form.document.name}
                </Typography>
              )}
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
            <Button onClick={() => navigate('/fursatkum/invoices')} disabled={loading}>
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

export default FursatkumNewInvoice;


