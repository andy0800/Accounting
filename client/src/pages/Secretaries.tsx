import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';

interface Secretary {
  _id: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  totalEarnings: number;
  totalDebt: number;
  activeVisas: string[];
  completedVisas: string[];
  cancelledVisas: string[];
  createdAt: string;
}

interface RentalUnit {
  _id: string;
  unitType: string;
  unitNumber: string;
  address: string;
  rentAmount: number;
  status: string;
  startDate: string;
  dueDay: number;
}

const Secretaries: React.FC = () => {
  const navigate = useNavigate();
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [rentalUnits, setRentalUnits] = useState<{ [secretaryId: string]: RentalUnit[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addDialog, setAddDialog] = useState(false);
  const [newSecretary, setNewSecretary] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchSecretaries();
  }, []);

  const fetchSecretaries = async () => {
    try {
      const response = await apiClient.get('/api/secretaries');
      setSecretaries(response.data);
      
      // Fetch rental information for each secretary
      await fetchRentalInformation(response.data);
      
      setLoading(false);
    } catch (error) {
      console.error('خطأ في جلب السكرتارية:', error);
      setError('خطأ في جلب قائمة السكرتارية');
      setLoading(false);
    }
  };

  const fetchRentalInformation = async (secretariesList: Secretary[]) => {
    try {
      const rentalData: { [secretaryId: string]: RentalUnit[] } = {};
      
      for (const secretary of secretariesList) {
        try {
          // Fetch rental units for this secretary
          const rentalResponse = await apiClient.get(`/api/rental-units/secretary/${secretary._id}`);
          rentalData[secretary._id] = rentalResponse.data || [];
        } catch (err) {
          console.error(`Error fetching rental data for secretary ${secretary._id}:`, err);
          rentalData[secretary._id] = [];
        }
      }
      
      setRentalUnits(rentalData);
    } catch (err) {
      console.error('Error fetching rental information:', err);
    }
  };

  const handleAddSecretary = async () => {
    try {
      await apiClient.post('/api/secretaries', newSecretary);
      setAddDialog(false);
      setNewSecretary({ name: '', email: '', phone: '' });
      setSuccess('تم إضافة السكرتيرة بنجاح');
      fetchSecretaries();
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في إضافة السكرتيرة');
    }
  };

  const handleDeleteSecretary = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه السكرتيرة؟')) {
      try {
        await apiClient.delete(`/api/secretaries/${id}`);
        setSuccess('تم حذف السكرتيرة بنجاح');
        fetchSecretaries();
      } catch (error: any) {
        setError(error.response?.data?.message || 'خطأ في حذف السكرتيرة');
      }
    }
  };

  const handleExportSecretary = async (id: string) => {
    try {
      const response = await apiClient.get(`/api/exports/secretary/${id}`, {
        responseType: 'blob'
      });
      
      const secretary = secretaries.find(s => s._id === id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `سكرتيرة-${secretary?.code}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('خطأ في تصدير تقرير السكرتيرة');
    }
  };

  const getStatusColor = (earnings: number, debt: number) => {
    if (earnings > debt) return 'success';
    if (debt > earnings) return 'error';
    return 'default';
  };

  const getUnitTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'محل':
      case 'store':
        return <BusinessIcon />;
      case 'مكتب':
      case 'office':
        return <BusinessIcon />;
      case 'شقة':
      case 'apartment':
        return <HomeIcon />;
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>جاري التحميل...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          إدارة السكرتارية
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialog(true)}
        >
          إضافة سكرتيرة
        </Button>
      </Box>

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

      {/* إحصائيات سريعة */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    إجمالي السكرتارية
                  </Typography>
                  <Typography variant="h4">
                    {secretaries.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    إجمالي الأرباح
                  </Typography>
                  <Typography variant="h4">
                    {secretaries.reduce((sum, s) => sum + s.totalEarnings, 0).toLocaleString()} دينار
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    إجمالي الديون
                  </Typography>
                  <Typography variant="h4">
                    {secretaries.reduce((sum, s) => sum + s.totalDebt, 0).toLocaleString()} دينار
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HomeIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    الوحدات المؤجرة
                  </Typography>
                  <Typography variant="h4">
                    {Object.values(rentalUnits).reduce((sum, units) => sum + units.length, 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* جدول السكرتارية */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            قائمة السكرتارية
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الاسم</TableCell>
                  <TableCell>الرمز</TableCell>
                  <TableCell>البريد الإلكتروني</TableCell>
                  <TableCell>رقم الهاتف</TableCell>
                  <TableCell>إجمالي الأرباح</TableCell>
                  <TableCell>إجمالي الدين</TableCell>
                  <TableCell>التأشيرات النشطة</TableCell>
                  <TableCell>التأشيرات المكتملة</TableCell>
                  <TableCell>التأشيرات الملغاة</TableCell>
                  <TableCell>الوحدات المؤجرة</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {secretaries.map((secretary) => (
                  <TableRow key={secretary._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        {secretary.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={secretary.code} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{secretary.email || '-'}</TableCell>
                    <TableCell>{secretary.phone || '-'}</TableCell>
                    <TableCell>
                      <Typography color="success.main" fontWeight="bold">
                        {secretary.totalEarnings.toLocaleString()} دينار
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="error.main" fontWeight="bold">
                        {secretary.totalDebt.toLocaleString()} دينار
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={secretary.activeVisas.length} 
                        color="primary" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={secretary.completedVisas.length} 
                        color="success" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={secretary.cancelledVisas.length} 
                        color="error" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={rentalUnits[secretary._id]?.length || 0} 
                        color="info" 
                        size="small"
                        icon={<HomeIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={secretary.totalEarnings > secretary.totalDebt ? 'ربح' : 'خسارة'}
                        color={getStatusColor(secretary.totalEarnings, secretary.totalDebt) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="عرض التفاصيل">
                          <IconButton 
                            onClick={() => navigate(`/secretaries/${secretary._id}`)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="تصدير التقرير">
                          <IconButton 
                            onClick={() => handleExportSecretary(secretary._id)}
                            color="secondary"
                          >
                            <ExportIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف السكرتيرة">
                          <IconButton 
                            onClick={() => handleDeleteSecretary(secretary._id)}
                            color="error"
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
        </CardContent>
      </Card>

      {/* تفاصيل الوحدات المؤجرة */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            تفاصيل الوحدات المؤجرة
          </Typography>
          
          {secretaries.map((secretary) => {
            const secretaryRentalUnits = rentalUnits[secretary._id] || [];
            if (secretaryRentalUnits.length === 0) return null;
            
            return (
              <Accordion key={secretary._id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6">
                      {secretary.name}
                    </Typography>
                    <Chip 
                      label={`${secretaryRentalUnits.length} وحدة`} 
                      color="info" 
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>نوع الوحدة</TableCell>
                          <TableCell>رقم الوحدة</TableCell>
                          <TableCell>العنوان</TableCell>
                          <TableCell>الإيجار الشهري</TableCell>
                          <TableCell>تاريخ البدء</TableCell>
                          <TableCell>يوم الاستحقاق</TableCell>
                          <TableCell>الحالة</TableCell>
                          <TableCell>الإجراءات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {secretaryRentalUnits.map((unit) => (
                          <TableRow key={unit._id}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                {getUnitTypeIcon(unit.unitType)}
                                {unit.unitType}
                              </Box>
                            </TableCell>
                            <TableCell>{unit.unitNumber}</TableCell>
                            <TableCell>{unit.address}</TableCell>
                            <TableCell>
                              <Typography color="primary.main" fontWeight="bold">
                                {formatCurrency(unit.rentAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell>{formatDate(unit.startDate)}</TableCell>
                            <TableCell>{unit.dueDay}</TableCell>
                            <TableCell>
                              <Chip 
                                label={unit.status} 
                                color={unit.status === 'نشط' ? 'success' : 'default'} 
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="عرض تفاصيل الوحدة">
                                <IconButton 
                                  size="small" 
                                  onClick={() => navigate(`/renting/units/${unit._id}`)}
                                  color="primary"
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </CardContent>
      </Card>

      {/* Dialog إضافة سكرتيرة */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة سكرتيرة جديدة</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="الاسم"
                value={newSecretary.name}
                onChange={(e) => setNewSecretary(prev => ({ ...prev, name: e.target.value }))}
                required
                dir="rtl"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={newSecretary.email}
                onChange={(e) => setNewSecretary(prev => ({ ...prev, email: e.target.value }))}
                dir="rtl"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="رقم الهاتف"
                value={newSecretary.phone}
                onChange={(e) => setNewSecretary(prev => ({ ...prev, phone: e.target.value }))}
                dir="rtl"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>إلغاء</Button>
          <Button 
            onClick={handleAddSecretary} 
            variant="contained"
            disabled={!newSecretary.name.trim()}
          >
            إضافة
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Secretaries; 