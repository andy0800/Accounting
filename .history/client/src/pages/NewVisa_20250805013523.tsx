import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  InputAdornment,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Secretary {
  _id: string;
  name: string;
  code: string;
}

const NewVisa: React.FC = () => {
  const navigate = useNavigate();
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: null as Date | null,
    nationality: '',
    passportNumber: '',
    visaNumber: '',
    secretaryId: '',
    middlemanName: '',
    visaSponsor: '',
    visaIssueDate: null as Date | null,
    visaExpiryDate: null as Date | null,
    visaDeadline: null as Date | null,
    secretaryProfitPercentage: '',
    visaDocument: null as File | null
  });

  useEffect(() => {
    fetchSecretaries();
  }, []);

  const fetchSecretaries = async () => {
    try {
      const response = await axios.get('/api/secretaries');
      setSecretaries(response.data);
    } catch (error) {
      console.error('خطأ في جلب السكرتارية:', error);
      setError('خطأ في جلب قائمة السكرتارية');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        visaDocument: file
      }));
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'name', 'dateOfBirth', 'nationality', 'passportNumber', 
      'visaNumber', 'secretaryId', 'visaIssueDate', 
      'visaExpiryDate', 'visaDeadline', 'secretaryProfitPercentage'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        setError(`حقل ${field} مطلوب`);
        return false;
      }
    }

    const percentage = parseFloat(formData.secretaryProfitPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setError('نسبة ربح السكرتيرة يجب أن تكون بين 0 و 100');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof typeof formData];
        if (value !== null && value !== '') {
          if (value instanceof Date) {
            formDataToSend.append(key, value.toISOString());
          } else if (value instanceof File) {
            formDataToSend.append(key, value);
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      });

      const response = await axios.post('/api/visas', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('تم إنشاء التأشيرة بنجاح');
      setTimeout(() => {
        navigate(`/visas/${response.data._id}`);
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في إنشاء التأشيرة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          تأشيرة جديدة - المرحلة أ
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Stepper activeStep={0} alternativeLabel>
                <Step>
                  <StepLabel>المرحلة أ - بيانات التأشيرة</StepLabel>
                </Step>
                <Step>
                  <StepLabel>المرحلة ب - النقل والفحوصات</StepLabel>
                </Step>
                <Step>
                  <StepLabel>المرحلة ج - رسوم السفارة</StepLabel>
                </Step>
                <Step>
                  <StepLabel>المرحلة د - مصاريف إضافية</StepLabel>
                </Step>
                <Step>
                  <StepLabel>المرحلة هـ - التأكيد</StepLabel>
                </Step>
              </Stepper>
            </Box>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* المعلومات الأساسية */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    المعلومات الأساسية
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="الاسم"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    dir="rtl"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="تاريخ الميلاد"
                    value={formData.dateOfBirth}
                    onChange={(date) => handleInputChange('dateOfBirth', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        dir: 'rtl'
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="الجنسية"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    required
                    dir="rtl"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="رقم الجواز"
                    value={formData.passportNumber}
                    onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                    required
                    dir="rtl"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="رقم التأشيرة"
                    value={formData.visaNumber}
                    onChange={(e) => handleInputChange('visaNumber', e.target.value)}
                    required
                    dir="rtl"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="secretary-label">السكرتيرة المسؤولة</InputLabel>
                    <Select
                      labelId="secretary-label"
                      value={formData.secretaryId}
                      label="السكرتيرة المسؤولة"
                      onChange={(e) => handleInputChange('secretaryId', e.target.value)}
                      dir="rtl"
                    >
                      {secretaries.map((secretary) => (
                        <MenuItem key={secretary._id} value={secretary._id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{secretary.name}</span>
                            <Chip label={secretary.code} size="small" />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* معلومات المندوب والكفيل */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    معلومات المندوب والكفيل
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="اسم المندوب"
                    value={formData.middlemanName}
                    onChange={(e) => handleInputChange('middlemanName', e.target.value)}
                    dir="rtl"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="كفيل التأشيرة"
                    value={formData.visaSponsor}
                    onChange={(e) => handleInputChange('visaSponsor', e.target.value)}
                    dir="rtl"
                  />
                </Grid>

                {/* التواريخ */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    التواريخ
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="تاريخ إصدار التأشيرة"
                    value={formData.visaIssueDate}
                    onChange={(date) => handleInputChange('visaIssueDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        dir: 'rtl'
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="تاريخ انتهاء التأشيرة"
                    value={formData.visaExpiryDate}
                    onChange={(date) => handleInputChange('visaExpiryDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        dir: 'rtl'
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="الموعد النهائي للتأشيرة"
                    value={formData.visaDeadline}
                    onChange={(date) => handleInputChange('visaDeadline', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        dir: 'rtl'
                      }
                    }}
                  />
                </Grid>

                {/* المعلومات المالية */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    المعلومات المالية
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="نسبة ربح السكرتيرة"
                    type="number"
                    value={formData.secretaryProfitPercentage}
                    onChange={(e) => handleInputChange('secretaryProfitPercentage', e.target.value)}
                    required
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    dir="rtl"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <input
                    accept="image/*,.pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    id="visa-document-upload"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="visa-document-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      sx={{ height: 56 }}
                    >
                      رفع مستند التأشيرة
                    </Button>
                  </label>
                  {formData.visaDocument && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      الملف المحدد: {formData.visaDocument.name}
                    </Typography>
                  )}
                </Grid>

                {/* أزرار التحكم */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/visas')}
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? 'جاري الحفظ...' : 'حفظ التأشيرة'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Container>
    </LocalizationProvider>
  );
};

export default NewVisa; 