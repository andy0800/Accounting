import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowBack as BackIcon, Save as SaveIcon, Upload as UploadIcon } from '@mui/icons-material';
import apiClient from '../../config/axios';

interface Props {
  systemKey: 'farwaniya1' | 'farwaniya2';
  titleIncome: string;
  titleSpending: string;
  basePath: string;
}

const FarwaniyaNewInvoiceBase: React.FC<Props> = ({ systemKey, titleIncome, titleSpending, basePath }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as 'income' | 'spending') || 'income';

  const [formData, setFormData] = useState({
    type: initialType,
    name: '',
    value: '',
    date: new Date().toISOString().split('T')[0],
    details: '',
  });
  const [document, setDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('اسم الفاتورة مطلوب');
      return;
    }
    if (!formData.value || parseFloat(formData.value) <= 0) {
      setError('قيمة الفاتورة غير صالحة');
      return;
    }
    if (!formData.date) {
      setError('تاريخ الفاتورة مطلوب');
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append('type', formData.type);
      submitData.append('name', formData.name);
      submitData.append('value', formData.value);
      submitData.append('date', formData.date);
      if (formData.details) submitData.append('details', formData.details);
      if (document) submitData.append('document', document);

      await apiClient.post(`/api/${systemKey}/invoices`, submitData);
      navigate(`${basePath}/invoices`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في إنشاء الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        رجوع
      </Button>

      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        {formData.type === 'income' ? titleIncome : titleSpending}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel>نوع الفاتورة</InputLabel>
                <Select
                  value={formData.type}
                  label="نوع الفاتورة"
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <MenuItem value="income">فاتورة دخل</MenuItem>
                  <MenuItem value="spending">إيصال صرف</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="اسم الفاتورة"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                fullWidth
              />

              <TextField
                label="القيمة"
                type="number"
                value={formData.value}
                onChange={(e) => handleChange('value', e.target.value)}
                required
                fullWidth
                inputProps={{ min: 0.001, step: 0.001 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">د.ك</InputAdornment>,
                }}
              />

              <TextField
                label="التاريخ"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="تفاصيل (اختياري)"
                value={formData.details}
                onChange={(e) => handleChange('details', e.target.value)}
                multiline
                rows={3}
                fullWidth
              />

              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                >
                  {document ? document.name : 'رفع مستند (اختياري)'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </Button>
                {document && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setDocument(null)}
                    sx={{ ml: 1 }}
                  >
                    إزالة
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color={formData.type === 'income' ? 'success' : 'error'}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FarwaniyaNewInvoiceBase;

