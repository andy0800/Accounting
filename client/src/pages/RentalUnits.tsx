import React, { useState, useEffect } from 'react';
import apiClient from '../config/axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tooltip,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  Apartment as ApartmentIcon
} from '@mui/icons-material';

interface Secretary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'نشط' | 'غير نشط';
}

interface RentalUnit {
  _id: string;
  unitType: string;
  unitNumber: string;
  address: string;
  rentAmount: number;
  startDate: string;
  dueDay: number;
  status: 'متاح' | 'نشط' | 'منتهي' | 'صيانة';
  assignedSecretary?: Secretary;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rental-tabpanel-${index}`}
      aria-labelledby={`rental-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RentalUnits: React.FC = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState<RentalUnit[]>([]);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<RentalUnit | null>(null);
  const [formData, setFormData] = useState({
    unitType: '',
    unitNumber: '',
    address: '',
    rentAmount: '',
    startDate: '',
    dueDay: '',
    notes: ''
  });
  const [assignForm, setAssignForm] = useState({
    secretaryId: '',
    monthlyRent: '',
    startDate: '',
    dueDay: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch rental units
      const unitsResponse = await apiClient.get('/api/rental-units');
      const unitsData = Array.isArray(unitsResponse.data) ? { units: unitsResponse.data } : (unitsResponse.data || {});
      setUnits(unitsData.units || []);

      // Fetch secretaries
      const secretariesResponse = await apiClient.get('/api/renting-secretaries');
      const secretariesData = Array.isArray(secretariesResponse.data) ? { secretaries: secretariesResponse.data } : (secretariesResponse.data || {});
      setSecretaries(secretariesData.secretaries || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async () => {
    try {
      await apiClient.post('/api/rental-units', {
        ...formData,
        rentAmount: parseFloat(formData.rentAmount),
        dueDay: parseInt(formData.dueDay),
        status: 'متاح'
      });

      setShowAddDialog(false);
      setFormData({
        unitType: '',
        unitNumber: '',
        address: '',
        rentAmount: '',
        startDate: '',
        dueDay: '',
        notes: ''
      });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleEditUnit = async () => {
    if (!selectedUnit) return;

    try {
      await apiClient.put(`/api/rental-units/${selectedUnit._id}`, {
        ...formData,
        rentAmount: parseFloat(formData.rentAmount),
        dueDay: parseInt(formData.dueDay)
      });

      setShowEditDialog(false);
      setSelectedUnit(null);
      setFormData({
        unitType: '',
        unitNumber: '',
        address: '',
        rentAmount: '',
        startDate: '',
        dueDay: '',
        notes: ''
      });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleAssignUnit = async () => {
    if (!selectedUnit) return;

    try {
      await apiClient.post('/api/rental-contracts', {
        unitId: selectedUnit._id,
        secretaryId: assignForm.secretaryId,
        monthlyRent: parseFloat(assignForm.monthlyRent),
        startDate: assignForm.startDate,
        dueDay: parseInt(assignForm.dueDay)
      });

      setShowAssignDialog(false);
      setSelectedUnit(null);
      setAssignForm({
        secretaryId: '',
        monthlyRent: '',
        startDate: '',
        dueDay: ''
      });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return;

    try {
      await apiClient.delete(`/api/rental-units/${unitId}`);

      fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const openEditDialog = (unit: RentalUnit) => {
    setSelectedUnit(unit);
    setFormData({
      unitType: unit.unitType,
      unitNumber: unit.unitNumber,
      address: unit.address,
      rentAmount: unit.rentAmount.toString(),
      startDate: unit.startDate.split('T')[0],
      dueDay: unit.dueDay.toString(),
      notes: unit.notes || ''
    });
    setShowEditDialog(true);
  };

  const openAssignDialog = (unit: RentalUnit) => {
    setSelectedUnit(unit);
    setAssignForm({
      secretaryId: '',
      monthlyRent: unit.rentAmount.toString(),
      startDate: new Date().toISOString().split('T')[0],
      dueDay: unit.dueDay.toString()
    });
    setShowAssignDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'متاح': return 'success';
      case 'نشط': return 'primary';
      case 'منتهي': return 'error';
      case 'صيانة': return 'warning';
      default: return 'default';
    }
  };

  const getUnitTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'محل':
      case 'store':
        return <StoreIcon />;
      case 'مكتب':
      case 'office':
        return <BusinessIcon />;
      case 'شقة':
      case 'apartment':
        return <ApartmentIcon />;
      default:
        return <HomeIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const availableUnits = units.filter(u => u.status === 'متاح');
  const activeUnits = units.filter(u => u.status === 'نشط');
  const terminatedUnits = units.filter(u => u.status === 'منتهي');
  const maintenanceUnits = units.filter(u => u.status === 'صيانة');

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
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          إدارة الوحدات الإيجارية
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
        >
          إضافة وحدة جديدة
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                إجمالي الوحدات
              </Typography>
              <Typography variant="h4">{units.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                الوحدات المتاحة
              </Typography>
              <Typography variant="h4" color="success.main">{availableUnits.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                الوحدات المؤجرة
              </Typography>
              <Typography variant="h4" color="primary.main">{activeUnits.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                الوحدات المنتهية
              </Typography>
              <Typography variant="h4" color="error.main">{terminatedUnits.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`جميع الوحدات (${units.length})`} />
          <Tab label={`متاحة (${availableUnits.length})`} />
          <Tab label={`مؤجرة (${activeUnits.length})`} />
          <Tab label={`منتهية (${terminatedUnits.length})`} />
          <Tab label={`صيانة (${maintenanceUnits.length})`} />
        </Tabs>
      </Box>

      {/* All Units Tab */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>نوع الوحدة</TableCell>
                <TableCell>رقم الوحدة</TableCell>
                <TableCell>العنوان</TableCell>
                <TableCell>الإيجار</TableCell>
                <TableCell>تاريخ البدء</TableCell>
                <TableCell>يوم الاستحقاق</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>السكرتير المسؤول</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getUnitTypeIcon(unit.unitType)}
                      {unit.unitType}
                    </Box>
                  </TableCell>
                  <TableCell>{unit.unitNumber}</TableCell>
                  <TableCell>{unit.address}</TableCell>
                  <TableCell>{formatCurrency(unit.rentAmount)}</TableCell>
                  <TableCell>{formatDate(unit.startDate)}</TableCell>
                  <TableCell>{unit.dueDay}</TableCell>
                  <TableCell>
                    <Chip 
                      label={unit.status} 
                      color={getStatusColor(unit.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {unit.assignedSecretary ? (
                      <Chip 
                        label={unit.assignedSecretary.name} 
                        color="primary" 
                        size="small"
                        onClick={() => navigate(`/renting/secretaries/${unit.assignedSecretary?._id}`)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/renting/units/${unit._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton 
                          size="small" 
                          onClick={() => openEditDialog(unit)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {unit.status === 'متاح' && (
                        <Tooltip title="تعيين لسكرتير">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => openAssignDialog(unit)}
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="حذف">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteUnit(unit._id)}
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
        </TableContainer>
      </TabPanel>

      {/* Available Units Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>نوع الوحدة</TableCell>
                <TableCell>رقم الوحدة</TableCell>
                <TableCell>العنوان</TableCell>
                <TableCell>الإيجار</TableCell>
                <TableCell>تاريخ البدء</TableCell>
                <TableCell>يوم الاستحقاق</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {availableUnits.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getUnitTypeIcon(unit.unitType)}
                      {unit.unitType}
                    </Box>
                  </TableCell>
                  <TableCell>{unit.unitNumber}</TableCell>
                  <TableCell>{unit.address}</TableCell>
                  <TableCell>{formatCurrency(unit.rentAmount)}</TableCell>
                  <TableCell>{formatDate(unit.startDate)}</TableCell>
                  <TableCell>{unit.dueDay}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/renting/units/${unit._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton 
                          size="small" 
                          onClick={() => openEditDialog(unit)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعيين لسكرتير">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => openAssignDialog(unit)}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Active Units Tab */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>نوع الوحدة</TableCell>
                <TableCell>رقم الوحدة</TableCell>
                <TableCell>العنوان</TableCell>
                <TableCell>الإيجار</TableCell>
                <TableCell>السكرتير المسؤول</TableCell>
                <TableCell>تاريخ البدء</TableCell>
                <TableCell>يوم الاستحقاق</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeUnits.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getUnitTypeIcon(unit.unitType)}
                      {unit.unitType}
                    </Box>
                  </TableCell>
                  <TableCell>{unit.unitNumber}</TableCell>
                  <TableCell>{unit.address}</TableCell>
                  <TableCell>{formatCurrency(unit.rentAmount)}</TableCell>
                  <TableCell>
                    {unit.assignedSecretary && (
                      <Chip 
                        label={unit.assignedSecretary.name} 
                        color="primary" 
                        size="small"
                        onClick={() => navigate(`/renting/secretaries/${unit.assignedSecretary?._id}`)}
                        sx={{ cursor: 'pointer' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(unit.startDate)}</TableCell>
                  <TableCell>{unit.dueDay}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/renting/units/${unit._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton 
                          size="small" 
                          onClick={() => openEditDialog(unit)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Terminated Units Tab */}
      <TabPanel value={tabValue} index={3}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>نوع الوحدة</TableCell>
                <TableCell>رقم الوحدة</TableCell>
                <TableCell>العنوان</TableCell>
                <TableCell>الإيجار</TableCell>
                <TableCell>السكرتير السابق</TableCell>
                <TableCell>تاريخ الإنهاء</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {terminatedUnits.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getUnitTypeIcon(unit.unitType)}
                      {unit.unitType}
                    </Box>
                  </TableCell>
                  <TableCell>{unit.unitNumber}</TableCell>
                  <TableCell>{unit.address}</TableCell>
                  <TableCell>{formatCurrency(unit.rentAmount)}</TableCell>
                  <TableCell>
                    {unit.assignedSecretary && (
                      <Chip 
                        label={unit.assignedSecretary.name} 
                        color="default" 
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/renting/units/${unit._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Maintenance Units Tab */}
      <TabPanel value={tabValue} index={4}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>نوع الوحدة</TableCell>
                <TableCell>رقم الوحدة</TableCell>
                <TableCell>العنوان</TableCell>
                <TableCell>الإيجار</TableCell>
                <TableCell>ملاحظات</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {maintenanceUnits.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getUnitTypeIcon(unit.unitType)}
                      {unit.unitType}
                    </Box>
                  </TableCell>
                  <TableCell>{unit.unitNumber}</TableCell>
                  <TableCell>{unit.address}</TableCell>
                  <TableCell>{formatCurrency(unit.rentAmount)}</TableCell>
                  <TableCell>{unit.notes || '-'}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/renting/units/${unit._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton 
                          size="small" 
                          onClick={() => openEditDialog(unit)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Add Unit Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>إضافة وحدة إيجارية جديدة</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="نوع الوحدة"
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                required
                placeholder="مثال: محل، مكتب، شقة"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="رقم الوحدة"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                required
                placeholder="مثال: A1، B2"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="العنوان"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                placeholder="العنوان الكامل للوحدة"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الإيجار الشهري"
                type="number"
                value={formData.rentAmount}
                onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                required
                placeholder="0.000"
                InputProps={{
                  endAdornment: <Typography>د.ك</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="تاريخ البدء"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="يوم استحقاق الإيجار"
                type="number"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                required
                placeholder="1-31"
                inputProps={{ min: 1, max: 31 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
                placeholder="ملاحظات إضافية حول الوحدة"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>إلغاء</Button>
          <Button 
            onClick={handleAddUnit} 
            variant="contained"
            disabled={!formData.unitType || !formData.unitNumber || !formData.address || !formData.rentAmount || !formData.startDate || !formData.dueDay}
          >
            إضافة الوحدة
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>تعديل الوحدة الإيجارية</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="نوع الوحدة"
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="رقم الوحدة"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="العنوان"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الإيجار الشهري"
                type="number"
                value={formData.rentAmount}
                onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                required
                InputProps={{
                  endAdornment: <Typography>د.ك</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="تاريخ البدء"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="يوم استحقاق الإيجار"
                type="number"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                required
                inputProps={{ min: 1, max: 31 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>إلغاء</Button>
          <Button 
            onClick={handleEditUnit} 
            variant="contained"
            disabled={!formData.unitType || !formData.unitNumber || !formData.address || !formData.rentAmount || !formData.startDate || !formData.dueDay}
          >
            حفظ التغييرات
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Unit Dialog */}
      <Dialog open={showAssignDialog} onClose={() => setShowAssignDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>تعيين الوحدة لسكرتير</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>اختر السكرتير</InputLabel>
                <Select
                  value={assignForm.secretaryId}
                  onChange={(e) => setAssignForm({ ...assignForm, secretaryId: e.target.value })}
                  label="اختر السكرتير"
                >
                  {secretaries.filter(s => s.status === 'نشط').map((secretary) => (
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
                label="الإيجار الشهري"
                type="number"
                value={assignForm.monthlyRent}
                onChange={(e) => setAssignForm({ ...assignForm, monthlyRent: e.target.value })}
                required
                InputProps={{
                  endAdornment: <Typography>د.ك</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="تاريخ بدء العقد"
                type="date"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="يوم استحقاق الإيجار"
                type="number"
                value={assignForm.dueDay}
                onChange={(e) => setAssignForm({ ...assignForm, dueDay: e.target.value })}
                required
                inputProps={{ min: 1, max: 31 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDialog(false)}>إلغاء</Button>
          <Button 
            onClick={handleAssignUnit} 
            variant="contained"
            disabled={!assignForm.secretaryId || !assignForm.monthlyRent || !assignForm.startDate || !assignForm.dueDay}
          >
            تعيين الوحدة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RentalUnits;
