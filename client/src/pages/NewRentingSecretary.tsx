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
  CircularProgress,
  Stack,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';

const NewRentingSecretary: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    idNumber: '',
    notes: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    setFiles(selected);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.name || !form.phone) {
      setError('الاسم ورقم الهاتف مطلوبان');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      files.forEach((file) => data.append('documents', file));

      await apiClient.post('/api/fursatkum/renting-secretaries', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      setTimeout(() => navigate('/fursatkum/renting/secretaries'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في إنشاء السكرتير');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        إضافة سكرتير تأجير جديد
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          تم حفظ البيانات بنجاح
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField label="الاسم" value={form.name} onChange={handleChange('name')} required fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="رقم الهاتف" value={form.phone} onChange={handleChange('phone')} required fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="البريد الإلكتروني" value={form.email} onChange={handleChange('email')} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="العنوان" value={form.address} onChange={handleChange('address')} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="الرقم المدني" value={form.idNumber} onChange={handleChange('idNumber')} fullWidth />
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
              <Grid item xs={12}>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                  رفع مستندات
                  <input type="file" hidden multiple onChange={handleFileChange} />
                </Button>
                {files.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    تم اختيار {files.length} ملف/ملفات
                  </Typography>
                )}
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

export default NewRentingSecretary;

