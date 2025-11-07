import React, { useState, useEffect } from 'react';
import apiClient from '../config/axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface Secretary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber?: string;
  documents: Array<{
    name: string;
    filePath: string;
    uploadDate: string;
  }>;
  notes?: string;
  status: 'نشط' | 'غير نشط';
  createdAt: string;
  updatedAt: string;
}

const RentingSecretaries: React.FC = () => {
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedSecretary, setSelectedSecretary] = useState<Secretary | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    idNumber: '',
    notes: '',
    status: 'نشط'
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchSecretaries();
  }, []);

  const fetchSecretaries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/renting-secretaries');
      const data = Array.isArray(response.data) ? response.data : (response.data?.secretaries || []);
      setSecretaries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSecretary = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('idNumber', formData.idNumber);
      formDataToSend.append('notes', formData.notes);
      formDataToSend.append('status', formData.status);

      uploadedFiles.forEach((file, index) => {
        formDataToSend.append('documents', file);
      });

      await apiClient.post('/api/renting-secretaries', formDataToSend);

      setShowAddDialog(false);
      resetForm();
      fetchSecretaries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleEditSecretary = async () => {
    if (!selectedSecretary) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('idNumber', formData.idNumber);
      formDataToSend.append('notes', formData.notes);
      formDataToSend.append('status', formData.status);

      uploadedFiles.forEach((file, index) => {
        formDataToSend.append('documents', file);
      });

      await apiClient.put(`/api/renting-secretaries/${selectedSecretary._id}`, formDataToSend);

      setShowEditDialog(false);
      resetForm();
      fetchSecretaries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleDeleteSecretary = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السكرتير؟')) return;

    try {
      await apiClient.delete(`/api/renting-secretaries/${id}`);

      fetchSecretaries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleViewSecretary = (secretary: Secretary) => {
    setSelectedSecretary(secretary);
    setShowViewDialog(true);
  };

  const handleEditClick = (secretary: Secretary) => {
    setSelectedSecretary(secretary);
    setFormData({
      name: secretary.name,
      phone: secretary.phone,
      email: secretary.email || '',
      address: secretary.address || '',
      idNumber: secretary.idNumber || '',
      notes: secretary.notes || '',
      status: secretary.status
    });
    setUploadedFiles([]);
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      idNumber: '',
      notes: '',
      status: 'نشط'
    });
    setUploadedFiles([]);
    setSelectedSecretary(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setUploadedFiles(Array.from(event.target.files));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const downloadDocument = (filePath: string, fileName: string) => {
    const base = (apiClient.defaults.baseURL || '').replace(/\/$/, '');
    const link = document.createElement('a');
    link.href = `${base}/uploads/secretaries/${filePath}`;
    link.download = fileName;
    link.click();
  };

  const filteredSecretaries = secretaries.filter(secretary => {
    const matchesSearch = secretary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         secretary.phone.includes(searchTerm) ||
                         (secretary.email && secretary.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || secretary.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          إدارة سكرتارية الإيجار
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
        >
          إضافة سكرتير جديد
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="البحث"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>الحالة</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="الحالة"
                >
                  <MenuItem value="">جميع الحالات</MenuItem>
                  <MenuItem value="نشط">نشط</MenuItem>
                  <MenuItem value="غير نشط">غير نشط</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Secretaries Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الاسم</TableCell>
                  <TableCell>رقم الهاتف</TableCell>
                  <TableCell>البريد الإلكتروني</TableCell>
                  <TableCell>العنوان</TableCell>
                  <TableCell>رقم الهوية</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>المستندات</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSecretaries.map((secretary) => (
                  <TableRow key={secretary._id}>
                    <TableCell>{secretary.name}</TableCell>
                    <TableCell>{secretary.phone}</TableCell>
                    <TableCell>{secretary.email || '-'}</TableCell>
                    <TableCell>{secretary.address || '-'}</TableCell>
                    <TableCell>{secretary.idNumber || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={secretary.status}
                        color={secretary.status === 'نشط' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {secretary.documents.length > 0 ? (
                        <Chip
                          label={`${secretary.documents.length} مستند`}
                          color="info"
                          size="small"
                        />
                      ) : (
                        <Chip label="لا توجد مستندات" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton
                          size="small"
                          onClick={() => handleViewSecretary(secretary)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(secretary)}
                          color="secondary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="حذف">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSecretary(secretary._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Secretary Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>إضافة سكرتير جديد</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الاسم *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الهاتف *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الهوية"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="العنوان"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mb: 2 }}
              >
                رفع المستندات
                <input
                  type="file"
                  multiple
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
              </Button>
              {uploadedFiles.length > 0 && (
                <List dense>
                  {uploadedFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => removeFile(index)}
                          size="small"
                        >
                          <CloseIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleAddSecretary}
            variant="contained"
            disabled={!formData.name || !formData.phone}
          >
            إضافة
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Secretary Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>تعديل بيانات السكرتير</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الاسم *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الهاتف *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الهوية"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="العنوان"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>الحالة</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'نشط' | 'غير نشط' })}
                  label="الحالة"
                >
                  <MenuItem value="نشط">نشط</MenuItem>
                  <MenuItem value="غير نشط">غير نشط</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mb: 2 }}
              >
                رفع مستندات جديدة
                <input
                  type="file"
                  multiple
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
              </Button>
              {uploadedFiles.length > 0 && (
                <List dense>
                  {uploadedFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => removeFile(index)}
                          size="small"
                        >
                          <CloseIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleEditSecretary}
            variant="contained"
            disabled={!formData.name || !formData.phone}
          >
            تحديث
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Secretary Dialog */}
      <Dialog
        open={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>تفاصيل السكرتير</DialogTitle>
        <DialogContent>
          {selectedSecretary && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  الاسم
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedSecretary.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  رقم الهاتف
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedSecretary.phone}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  البريد الإلكتروني
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedSecretary.email || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  رقم الهوية
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedSecretary.idNumber || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  العنوان
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedSecretary.address || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  الملاحظات
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedSecretary.notes || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  المستندات
                </Typography>
                {selectedSecretary.documents.length > 0 ? (
                  <List dense>
                    {selectedSecretary.documents.map((doc, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={doc.name}
                          secondary={new Date(doc.uploadDate).toLocaleDateString('ar-SA')}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => downloadDocument(doc.filePath, doc.name)}
                            size="small"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    لا توجد مستندات
                  </Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewDialog(false)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RentingSecretaries;
