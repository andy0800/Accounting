import React, { useState, useEffect } from 'react';
import apiClient from '../config/axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileUpload as FileUploadIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Secretary {
  _id: string;
  name: string;
  phone: string;
  email: string;
}

interface RentalContract {
  _id: string;
  secretaryId: Secretary;
  unitType: string;
  unitNumber: string;
  address: string;
  rentAmount: number;
  startDate: string;
  dueDay: number;
  status: 'نشط' | 'منتهي';
  documents: Array<{
    name: string;
    filePath: string;
    uploadDate: string;
  }>;
  notes?: string;
  createdAt: string;
  terminationDate?: string;
  terminationReason?: string;
}

interface CreateContractForm {
  secretaryId: string;
  unitType: string;
  unitNumber: string;
  address: string;
  rentAmount: string;
  startDate: string;
  dueDay: string;
  notes: string;
}

const RentalContracts: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [secretaryFilter, setSecretaryFilter] = useState<string>('all');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [createForm, setCreateForm] = useState<CreateContractForm>({
    secretaryId: '',
    unitType: '',
    unitNumber: '',
    address: '',
    rentAmount: '',
    startDate: '',
    dueDay: '',
    notes: ''
  });
  const [editForm, setEditForm] = useState<CreateContractForm>({
    secretaryId: '',
    unitType: '',
    unitNumber: '',
    address: '',
    rentAmount: '',
    startDate: '',
    dueDay: '',
    notes: ''
  });
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Snackbar states
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    fetchContracts();
    fetchSecretaries();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/rental-contracts');
      const payload = Array.isArray(response.data) ? { contracts: response.data } : (response.data || {});
      setContracts(payload.contracts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecretaries = async () => {
    try {
      const response = await apiClient.get('/api/renting-secretaries');
      const data = Array.isArray(response.data) ? { secretaries: response.data } : (response.data || {});
      setSecretaries(data.secretaries || []);
    } catch (err) {
      console.error('Failed to fetch secretaries:', err);
    }
  };

  const handleCreateContract = async () => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('secretaryId', createForm.secretaryId);
      formData.append('unitType', createForm.unitType);
      formData.append('unitNumber', createForm.unitNumber);
      formData.append('address', createForm.address);
      formData.append('rentAmount', createForm.rentAmount);
      formData.append('startDate', createForm.startDate);
      formData.append('dueDay', createForm.dueDay);
      formData.append('notes', createForm.notes);
      
      // Add documents
      selectedFiles.forEach(file => {
        formData.append('documents', file);
      });

      await apiClient.post('/api/rental-contracts', formData);

      setSnackbar({
        open: true,
        message: 'تم إنشاء العقد بنجاح',
        severity: 'success'
      });

      setCreateDialogOpen(false);
      resetCreateForm();
      fetchContracts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to create contract',
        severity: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditContract = async () => {
    if (!selectedContract) return;

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('unitType', editForm.unitType);
      formData.append('unitNumber', editForm.unitNumber);
      formData.append('address', editForm.address);
      formData.append('rentAmount', editForm.rentAmount);
      formData.append('startDate', editForm.startDate);
      formData.append('dueDay', editForm.dueDay);
      formData.append('notes', editForm.notes);
      
      // Add new documents
      selectedFiles.forEach(file => {
        formData.append('documents', file);
      });

      await apiClient.put(`/api/rental-contracts/${selectedContract._id}`, formData);

      setSnackbar({
        open: true,
        message: 'تم تحديث العقد بنجاح',
        severity: 'success'
      });

      setEditDialogOpen(false);
      setSelectedContract(null);
      resetEditForm();
      fetchContracts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to update contract',
        severity: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العقد؟')) return;

    try {
      await apiClient.delete(`/api/rental-contracts/${contractId}`);

      setSnackbar({
        open: true,
        message: 'تم حذف العقد بنجاح',
        severity: 'success'
      });

      fetchContracts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to delete contract',
        severity: 'error'
      });
    }
  };

  const openEditDialog = (contract: RentalContract) => {
    setSelectedContract(contract);
    setEditForm({
      secretaryId: contract.secretaryId._id,
      unitType: contract.unitType,
      unitNumber: contract.unitNumber,
      address: contract.address,
      rentAmount: contract.rentAmount.toString(),
      startDate: contract.startDate.split('T')[0],
      dueDay: contract.dueDay.toString(),
      notes: contract.notes || ''
    });
    setSelectedFiles([]);
    setEditDialogOpen(true);
  };

  const resetCreateForm = () => {
    setCreateForm({
      secretaryId: '',
      unitType: '',
      unitNumber: '',
      address: '',
      rentAmount: '',
      startDate: '',
      dueDay: '',
      notes: ''
    });
    setSelectedFiles([]);
  };

  const resetEditForm = () => {
    setEditForm({
      secretaryId: '',
      unitType: '',
      unitNumber: '',
      address: '',
      rentAmount: '',
      startDate: '',
      dueDay: '',
      notes: ''
    });
    setSelectedFiles([]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.unitType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.secretaryId.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesSecretary = secretaryFilter === 'all' || contract.secretaryId._id === secretaryFilter;
    
    return matchesSearch && matchesStatus && matchesSecretary;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط': return 'success';
      case 'منتهي': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            عقود الإيجار
          </Typography>
          <Typography variant="body2" color="textSecondary">
            إدارة عقود إيجار السكرتيرات
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/renting/contracts/new')}
        >
          عقد إيجار جديد
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="بحث"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث في رقم الوحدة، النوع، العنوان، أو اسم السكرتير"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="الحالة"
              >
                <MenuItem value="all">جميع الحالات</MenuItem>
                <MenuItem value="نشط">نشط</MenuItem>
                <MenuItem value="منتهي">منتهي</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>السكرتير</InputLabel>
              <Select
                value={secretaryFilter}
                onChange={(e) => setSecretaryFilter(e.target.value)}
                label="السكرتير"
              >
                <MenuItem value="all">جميع السكرتيرات</MenuItem>
                {secretaries.map(secretary => (
                  <MenuItem key={secretary._id} value={secretary._id}>
                    {secretary.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="textSecondary">
              {filteredContracts.length} عقد
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Contracts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>السكرتير</TableCell>
              <TableCell>نوع الوحدة</TableCell>
              <TableCell>رقم الوحدة</TableCell>
              <TableCell>العنوان</TableCell>
              <TableCell>مبلغ الإيجار</TableCell>
              <TableCell>تاريخ البدء</TableCell>
              <TableCell>يوم الاستحقاق</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>المستندات</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContracts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((contract) => (
                <TableRow 
                  key={contract._id}
                  onClick={() => navigate(`/renting/contracts/${contract._id}`)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: 'action.hover',
                      transform: 'scale(1.01)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {contract.secretaryId.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {contract.secretaryId.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>{contract.unitType}</TableCell>
                  <TableCell>{contract.unitNumber}</TableCell>
                  <TableCell>{contract.address}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(contract.rentAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(contract.startDate)}</TableCell>
                  <TableCell>{contract.dueDay}</TableCell>
                  <TableCell>
                    <Chip
                      label={contract.status}
                      color={getStatusColor(contract.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {contract.documents && contract.documents.length > 0 ? (
                      <Chip
                        icon={<AttachFileIcon />}
                        label={`${contract.documents.length} ملف`}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        لا توجد مستندات
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/renting/contracts/${contract._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(contract)}
                          disabled={contract.status === 'منتهي'}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="حذف">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteContract(contract._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredContracts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="صفوف في الصفحة:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
        />
      </TableContainer>

      {/* Create Contract Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>عقد إيجار جديد</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>السكرتير *</InputLabel>
                <Select
                  value={createForm.secretaryId}
                  onChange={(e) => setCreateForm({ ...createForm, secretaryId: e.target.value })}
                  label="السكرتير *"
                  required
                >
                  {secretaries.map(secretary => (
                    <MenuItem key={secretary._id} value={secretary._id}>
                      {secretary.name} - {secretary.phone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="نوع الوحدة *"
                value={createForm.unitType}
                onChange={(e) => setCreateForm({ ...createForm, unitType: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="رقم الوحدة *"
                value={createForm.unitNumber}
                onChange={(e) => setCreateForm({ ...createForm, unitNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="العنوان *"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="مبلغ الإيجار *"
                type="number"
                value={createForm.rentAmount}
                onChange={(e) => setCreateForm({ ...createForm, rentAmount: e.target.value })}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="تاريخ البدء *"
                type="date"
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="يوم الاستحقاق *"
                type="number"
                value={createForm.dueDay}
                onChange={(e) => setCreateForm({ ...createForm, dueDay: e.target.value })}
                required
                inputProps={{ min: 1, max: 31 }}
                helperText="اليوم من كل شهر"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                multiline
                rows={3}
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<FileUploadIcon />}
                fullWidth
              >
                رفع المستندات (اختياري)
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Button>
              {selectedFiles.length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" color="textSecondary">
                    تم اختيار {selectedFiles.length} ملف
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={handleCreateContract}
            variant="contained"
            disabled={uploading || !createForm.secretaryId || !createForm.unitType || !createForm.unitNumber || !createForm.address || !createForm.rentAmount || !createForm.startDate || !createForm.dueDay}
          >
            {uploading ? <CircularProgress size={20} /> : 'إنشاء العقد'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>تعديل العقد</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="نوع الوحدة *"
                value={editForm.unitType}
                onChange={(e) => setEditForm({ ...editForm, unitType: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="رقم الوحدة *"
                value={editForm.unitNumber}
                onChange={(e) => setEditForm({ ...editForm, unitNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="العنوان *"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="مبلغ الإيجار *"
                type="number"
                value={editForm.rentAmount}
                onChange={(e) => setEditForm({ ...editForm, rentAmount: e.target.value })}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="تاريخ البدء *"
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="يوم الاستحقاق *"
                type="number"
                value={editForm.dueDay}
                onChange={(e) => setEditForm({ ...editForm, dueDay: e.target.value })}
                required
                inputProps={{ min: 1, max: 31 }}
                helperText="اليوم من كل شهر"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                multiline
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<FileUploadIcon />}
                fullWidth
              >
                إضافة مستندات جديدة (اختياري)
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Button>
              {selectedFiles.length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" color="textSecondary">
                    تم اختيار {selectedFiles.length} ملف جديد
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={handleEditContract}
            variant="contained"
            disabled={uploading || !editForm.unitType || !editForm.unitNumber || !editForm.address || !editForm.rentAmount || !editForm.startDate || !editForm.dueDay}
          >
            {uploading ? <CircularProgress size={20} /> : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RentalContracts;
