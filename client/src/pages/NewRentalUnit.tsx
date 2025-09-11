import React, { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Secretary {
  _id: string;
  name: string;
  phone: string;
  email: string;
}

interface RentalUnit {
  unitNumber: string;
  unitType: string;
  address: string;
  monthlyRent: number;
  secretaryId?: string;
  description?: string;
  documents?: File[];
}

const NewRentalUnit: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [formData, setFormData] = useState<RentalUnit>({
    unitNumber: '',
    unitType: '',
    address: '',
    monthlyRent: 0,
    secretaryId: '',
    description: '',
    documents: []
  });

  // Fetch secretaries on component mount
  useEffect(() => {
    fetchSecretaries();
  }, []);

  const fetchSecretaries = async () => {
    try {
      const response = await fetch('/api/renting-secretaries');
      if (response.ok) {
        const data = await response.json();
        setSecretaries(data);
      }
    } catch (error) {
      console.error('Error fetching secretaries:', error);
    }
  };

  const handleInputChange = (field: keyof RentalUnit, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    
    if (!formData.unitNumber || !formData.unitType || !formData.address || formData.monthlyRent <= 0) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append('unitNumber', formData.unitNumber);
      submitData.append('unitType', formData.unitType);
      submitData.append('address', formData.address);
      submitData.append('monthlyRent', formData.monthlyRent.toString());
      if (formData.secretaryId) {
        submitData.append('secretaryId', formData.secretaryId);
      }
      submitData.append('description', formData.description || '');
      
      // Append documents
      formData.documents?.forEach((doc, index) => {
        submitData.append(`documents`, doc);
      });

      const response = await fetch('/api/rental-units', {
        method: 'POST',
        body: submitData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إنشاء الوحدة');
      }

      setSuccess('تم إنشاء الوحدة بنجاح');
      setTimeout(() => {
        navigate('/renting/units');
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

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
            إضافة وحدة إيجار جديدة
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
              {/* Unit Number */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم الوحدة"
                  value={formData.unitNumber}
                  onChange={(e) => handleInputChange('unitNumber', e.target.value)}
                  required
                  variant="outlined"
                />
              </Grid>

              {/* Unit Type */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="نوع الوحدة"
                  value={formData.unitType}
                  onChange={(e) => handleInputChange('unitType', e.target.value)}
                  required
                  variant="outlined"
                  placeholder="مثال: شقة، مكتب، محل تجاري"
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="العنوان"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                  variant="outlined"
                  multiline
                  rows={3}
                  placeholder="العنوان التفصيلي للوحدة"
                />
              </Grid>

              {/* Monthly Rent */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الإيجار الشهري"
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => handleInputChange('monthlyRent', parseFloat(e.target.value) || 0)}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>د.ك</Typography>
                  }}
                />
              </Grid>

              {/* Secretary Assignment */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>تعيين سكرتير (اختياري)</InputLabel>
                  <Select
                    value={formData.secretaryId || ''}
                    onChange={(e) => handleInputChange('secretaryId', e.target.value)}
                    label="تعيين سكرتير (اختياري)"
                  >
                    <MenuItem value="">
                      <em>بدون تعيين</em>
                    </MenuItem>
                    {secretaries.map((secretary) => (
                      <MenuItem key={secretary._id} value={secretary._id}>
                        {secretary.name} - {secretary.phone}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Description */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="وصف الوحدة (اختياري)"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  variant="outlined"
                  placeholder="وصف إضافي للوحدة"
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
                      يمكنك رفع صور أو مستندات متعلقة بالوحدة
                    </Typography>
                    
                    <input
                      accept="image/*,.pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      id="document-upload"
                      multiple
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="document-upload">
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
                    onClick={() => navigate('/renting/units')}
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
                    {loading ? 'جاري الإنشاء...' : 'إنشاء الوحدة'}
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

export default NewRentalUnit;
