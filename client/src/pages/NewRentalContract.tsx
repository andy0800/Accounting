import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Secretary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'نشط' | 'غير نشط';
}

interface RentalUnit {
  _id: string;
  unitNumber: string;
  unitType: string;
  address: string;
  monthlyRent: number;
}

interface RentalContract {
  secretaryId: string;
  unitId: string;
  unitType: string;
  unitNumber: string;
  address: string;
  monthlyRent: number;
  startDate: string;
  dueDay: string;
  description?: string;
  documents?: File[];
}

const NewRentalContract: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [units, setUnits] = useState<RentalUnit[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState<RentalContract>({
    secretaryId: '',
    unitId: '',
    unitType: '',
    unitNumber: '',
    address: '',
    monthlyRent: 0,
    startDate: new Date().toISOString().split('T')[0],
    dueDay: '1',
    description: '',
    documents: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch secretaries
      const secretariesResponse = await apiClient.get('/api/renting-secretaries');
      const secretariesData = Array.isArray(secretariesResponse.data) ? { secretaries: secretariesResponse.data } : (secretariesResponse.data || {});
      setSecretaries(secretariesData.secretaries || []);

      // Fetch rental units
      const unitsResponse = await apiClient.get('/api/rental-units');
      const unitsData = Array.isArray(unitsResponse.data) ? { units: unitsResponse.data } : (unitsResponse.data || {});
      setUnits(unitsData.units || []);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('فشل في تحميل البيانات الأولية');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof RentalContract, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-fill unit details when unit is selected
    if (field === 'unitId') {
      const selectedUnit = units.find(unit => unit._id === value);
      if (selectedUnit) {
        setFormData(prev => ({
          ...prev,
          unitId: value as string,
          unitType: selectedUnit.unitType,
          unitNumber: selectedUnit.unitNumber,
          address: selectedUnit.address,
          monthlyRent: selectedUnit.monthlyRent
        }));
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), ...files]
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.secretaryId || !formData.unitId || !formData.startDate || !formData.dueDay) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append('secretaryId', formData.secretaryId);
      submitData.append('unitId', formData.unitId);
      submitData.append('unitType', formData.unitType);
      submitData.append('unitNumber', formData.unitNumber);
      submitData.append('address', formData.address);
      submitData.append('monthlyRent', formData.monthlyRent.toString());
      submitData.append('startDate', formData.startDate);
      submitData.append('dueDay', formData.dueDay);
      submitData.append('description', formData.description || '');
      
      // Append documents
      formData.documents?.forEach((doc, index) => {
        submitData.append(`documents`, doc);
      });

      await apiClient.post('/api/rental-contracts', submitData);

      setSuccess('تم إنشاء عقد الإيجار بنجاح');
      setTimeout(() => {
        navigate('/renting/contracts');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
            إنشاء عقد إيجار جديد
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

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Secretary Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>اسم السكرتير</InputLabel>
                  <Select
                    value={formData.secretaryId}
                    onChange={(e) => handleInputChange('secretaryId', e.target.value)}
                    label="اسم السكرتير"
                    startAdornment={<PersonIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    {secretaries
                      .filter(s => s.status === 'نشط')
                      .map((secretary) => (
                        <MenuItem key={secretary._id} value={secretary._id}>
                          <Box>
                            <Typography variant="body1">{secretary.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {secretary.phone} {secretary.email && `- ${secretary.email}`}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Unit Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>الوحدة المؤجرة</InputLabel>
                  <Select
                    value={formData.unitId}
                    onChange={(e) => handleInputChange('unitId', e.target.value)}
                    label="الوحدة المؤجرة"
                    startAdornment={<HomeIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    {units.map((unit) => (
                      <MenuItem key={unit._id} value={unit._id}>
                        <Box>
                          <Typography variant="body1">
                            {unit.unitNumber} - {unit.unitType}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {unit.address}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Unit Details (Auto-filled) */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="نوع الوحدة"
                  value={formData.unitType}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  sx={{ bgcolor: 'grey.50' }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="رقم الوحدة"
                  value={formData.unitNumber}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  sx={{ bgcolor: 'grey.50' }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="الإيجار الشهري"
                  value={formData.monthlyRent}
                  InputProps={{ 
                    readOnly: true,
                    startAdornment: <Typography sx={{ mr: 1 }}>د.ك</Typography>
                  }}
                  variant="outlined"
                  sx={{ bgcolor: 'grey.50' }}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="العنوان"
                  value={formData.address}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  multiline
                  rows={2}
                  sx={{ bgcolor: 'grey.50' }}
                />
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاريخ بدء الإيجار"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* Due Day */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="يوم استحقاق الإيجار الشهري"
                  type="number"
                  value={formData.dueDay}
                  onChange={(e) => handleInputChange('dueDay', e.target.value)}
                  required
                  variant="outlined"
                  inputProps={{ min: 1, max: 31 }}
                  InputProps={{
                    startAdornment: <PaymentIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                  helperText="اختر اليوم من 1 إلى 31"
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="وصف إضافي (اختياري)"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  variant="outlined"
                  multiline
                  rows={3}
                  placeholder="وصف إضافي للعقد أو شروط خاصة"
                />
              </Grid>

              {/* Document Upload */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, border: '2px dashed', borderColor: 'primary.main' }}>
                  <Box textAlign="center">
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      رفع المستندات (اختياري)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      يمكنك رفع نسخة من العقد أو أي مستندات متعلقة
                    </Typography>
                    
                    <input
                      accept="image/*,.pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      id="contract-document-upload"
                      multiple
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="contract-document-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<AddIcon />}
                        sx={{ mb: 2 }}
                      >
                        اختيار الملفات
                      </Button>
                    </label>
                  </Box>

                  {/* Uploaded Documents List */}
                  {formData.documents && formData.documents.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        الملفات المرفوعة:
                      </Typography>
                      <List dense>
                        {formData.documents.map((doc, index) => (
                          <ListItem key={index} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
                            <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <ListItemText
                              primary={doc.name}
                              secondary={`${formatFileSize(doc.size)}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => removeDocument(index)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/renting/contracts')}
                    disabled={loading}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                  >
                    {loading ? 'جاري الإنشاء...' : 'إنشاء عقد الإيجار'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NewRentalContract;
