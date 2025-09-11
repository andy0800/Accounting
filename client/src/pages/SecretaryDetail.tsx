import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tabs,
  Tab,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';

interface Secretary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber?: string;
  documents?: Array<{
    name: string;
    filePath: string;
    uploadDate: string;
  }>;
  status: 'نشط' | 'غير نشط';
  createdAt: string;
  updatedAt: string;
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
  notes?: string;
}

interface RentalContract {
  _id: string;
  unitId: RentalUnit;
  secretaryId: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  dueDay: number;
  status: 'نشط' | 'منتهي';
  terminationDate?: string;
  terminationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface RentalPayment {
  _id: string;
  contractId: string;
  monthYear: string;
  amount: number;
  paymentDate: string;
  description: string;
  isPartial: boolean;
  remainingBalance: number;
  receiptDocument?: {
    name: string;
    filePath: string;
    uploadDate: string;
  };
  paymentMethod: string;
  notes?: string;
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
      id={`secretary-tabpanel-${index}`}
      aria-labelledby={`secretary-tab-${index}`}
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

const SecretaryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [secretary, setSecretary] = useState<Secretary | null>(null);
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [terminateForm, setTerminateForm] = useState({
    reason: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchSecretaryData();
    }
  }, [id]);

  const fetchSecretaryData = async () => {
    try {
      setLoading(true);
      
      // Fetch secretary details
      const secretaryResponse = await fetch(`/api/renting-secretaries/${id}`);
      if (!secretaryResponse.ok) {
        throw new Error('فشل في جلب بيانات السكرتير');
      }
      const secretaryData = await secretaryResponse.json();
      setSecretary(secretaryData.secretary);

      // Fetch secretary's contracts
      const contractsResponse = await fetch(`/api/rental-contracts?secretaryId=${id}`);
      if (contractsResponse.ok) {
        const contractsData = await contractsResponse.json();
        setContracts(contractsData.contracts || []);
      }

      // Fetch all payments for secretary's contracts
      const paymentsResponse = await fetch(`/api/rental-payments?secretaryId=${id}`);
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData.payments || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateContract = async () => {
    if (!selectedContract) return;

    try {
      const response = await fetch(`/api/rental-contracts/${selectedContract._id}/terminate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(terminateForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إنهاء العقد');
      }

      setShowTerminateDialog(false);
      setTerminateForm({ reason: '', notes: '' });
      setSelectedContract(null);
      fetchSecretaryData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getPaymentStatus = (contractId: string, monthYear: string) => {
    const contractPayments = payments.filter(p => 
      p.contractId === contractId && p.monthYear === monthYear
    );
    
    if (contractPayments.length === 0) return { status: 'غير مدفوع', color: 'error' };
    
    const totalPaid = contractPayments.reduce((sum, p) => sum + p.amount, 0);
    const contract = contracts.find(c => c._id === contractId);
    
    if (!contract) return { status: 'غير محدد', color: 'default' };
    
    if (totalPaid >= contract.monthlyRent) {
      return { status: 'مدفوع بالكامل', color: 'success' };
    } else if (totalPaid > 0) {
      return { status: 'مدفوع جزئياً', color: 'warning' };
    } else {
      return { status: 'غير مدفوع', color: 'error' };
    }
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!secretary) {
    return (
      <Alert severity="warning">
        السكرتير غير موجود
      </Alert>
    );
  }

  const activeContracts = contracts.filter(c => c.status === 'نشط');
  const terminatedContracts = contracts.filter(c => c.status === 'منتهي');
  const currentMonth = getCurrentMonthYear();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/renting/secretaries')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          تفاصيل السكرتير: {secretary.name}
        </Typography>
      </Box>

      {/* Secretary Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>المعلومات الأساسية</Typography>
              <Typography><strong>الاسم:</strong> {secretary.name}</Typography>
              <Typography><strong>الهاتف:</strong> {secretary.phone}</Typography>
              {secretary.email && (
                <Typography><strong>البريد الإلكتروني:</strong> {secretary.email}</Typography>
              )}
              {secretary.address && (
                <Typography><strong>العنوان:</strong> {secretary.address}</Typography>
              )}
              {secretary.idNumber && (
                <Typography><strong>رقم الهوية:</strong> {secretary.idNumber}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>معلومات النظام</Typography>
              <Typography><strong>الحالة:</strong> 
                <Chip 
                  label={secretary.status} 
                  color={secretary.status === 'نشط' ? 'success' : 'default'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography><strong>تاريخ التسجيل:</strong> {formatDate(secretary.createdAt)}</Typography>
              <Typography><strong>آخر تحديث:</strong> {formatDate(secretary.updatedAt)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="secretary tabs">
          <Tab label={`العقود النشطة (${activeContracts.length})`} />
          <Tab label={`العقود المنتهية (${terminatedContracts.length})`} />
          <Tab label="المدفوعات" />
          <Tab label="التقارير" />
        </Tabs>
      </Box>

      {/* Active Contracts Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">العقود النشطة</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/renting/units')}
          >
            إضافة وحدة جديدة
          </Button>
        </Box>

        {activeContracts.length === 0 ? (
          <Alert severity="info">لا توجد عقود نشطة</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>رقم الوحدة</TableCell>
                  <TableCell>نوع الوحدة</TableCell>
                  <TableCell>العنوان</TableCell>
                  <TableCell>الإيجار الشهري</TableCell>
                  <TableCell>تاريخ البدء</TableCell>
                  <TableCell>يوم الاستحقاق</TableCell>
                  <TableCell>حالة الدفع للشهر الحالي</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeContracts.map((contract) => {
                  const paymentStatus = getPaymentStatus(contract._id, currentMonth);
                  return (
                    <TableRow key={contract._id}>
                      <TableCell>{contract.unitId.unitNumber}</TableCell>
                      <TableCell>{contract.unitId.unitType}</TableCell>
                      <TableCell>{contract.unitId.address}</TableCell>
                      <TableCell>{formatCurrency(contract.monthlyRent)}</TableCell>
                      <TableCell>{formatDate(contract.startDate)}</TableCell>
                      <TableCell>{contract.dueDay}</TableCell>
                      <TableCell>
                        <Chip 
                          label={paymentStatus.status} 
                          color={paymentStatus.color as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="عرض التفاصيل">
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/renting/units/${contract.unitId._id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="إنهاء العقد">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                setSelectedContract(contract);
                                setShowTerminateDialog(true);
                              }}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Terminated Contracts Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>العقود المنتهية</Typography>
        
        {terminatedContracts.length === 0 ? (
          <Alert severity="info">لا توجد عقود منتهية</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>رقم الوحدة</TableCell>
                  <TableCell>نوع الوحدة</TableCell>
                  <TableCell>تاريخ الإنهاء</TableCell>
                  <TableCell>سبب الإنهاء</TableCell>
                  <TableCell>ملاحظات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {terminatedContracts.map((contract) => (
                  <TableRow key={contract._id}>
                    <TableCell>{contract.unitId.unitNumber}</TableCell>
                    <TableCell>{contract.unitId.unitType}</TableCell>
                    <TableCell>
                      {contract.terminationDate ? formatDate(contract.terminationDate) : '-'}
                    </TableCell>
                    <TableCell>{contract.terminationReason || '-'}</TableCell>
                    <TableCell>{contract.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Payments Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>سجل المدفوعات</Typography>
        
        {payments.length === 0 ? (
          <Alert severity="info">لا توجد مدفوعات مسجلة</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>الوحدة</TableCell>
                  <TableCell>الشهر</TableCell>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>الوصف</TableCell>
                  <TableCell>نوع الدفع</TableCell>
                  <TableCell>الإيصال</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => {
                  const contract = contracts.find(c => c._id === payment.contractId);
                  return (
                    <TableRow key={payment._id}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>
                        {contract ? contract.unitId.unitNumber : 'غير محدد'}
                      </TableCell>
                      <TableCell>{formatMonthYear(payment.monthYear)}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography>{formatCurrency(payment.amount)}</Typography>
                          {payment.isPartial && (
                            <Typography variant="caption" color="warning.main">
                              متبقي: {formatCurrency(payment.remainingBalance)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>
                        {payment.receiptDocument ? (
                          <Tooltip title="عرض الإيصال">
                            <IconButton size="small" color="primary">
                              <ReceiptIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Reports Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom>التقارير</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>ملخص عام</Typography>
                <Typography><strong>إجمالي العقود:</strong> {contracts.length}</Typography>
                <Typography><strong>العقود النشطة:</strong> {activeContracts.length}</Typography>
                <Typography><strong>العقود المنتهية:</strong> {terminatedContracts.length}</Typography>
                <Typography><strong>إجمالي المدفوعات:</strong> {payments.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>الإيجار الشهري</Typography>
                <Typography>
                  <strong>إجمالي الإيجار الشهري:</strong> {formatCurrency(
                    activeContracts.reduce((sum, c) => sum + c.monthlyRent, 0)
                  )}
                </Typography>
                <Typography>
                  <strong>متوسط الإيجار الشهري:</strong> {formatCurrency(
                    activeContracts.length > 0 
                      ? activeContracts.reduce((sum, c) => sum + c.monthlyRent, 0) / activeContracts.length
                      : 0
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Terminate Contract Dialog */}
      <Dialog open={showTerminateDialog} onClose={() => setShowTerminateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إنهاء العقد</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="سبب الإنهاء"
                value={terminateForm.reason}
                onChange={(e) => setTerminateForm({ ...terminateForm, reason: e.target.value })}
                required
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات إضافية"
                value={terminateForm.notes}
                onChange={(e) => setTerminateForm({ ...terminateForm, notes: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTerminateDialog(false)}>إلغاء</Button>
          <Button 
            onClick={handleTerminateContract} 
            variant="contained" 
            color="error"
            disabled={!terminateForm.reason.trim()}
          >
            إنهاء العقد
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecretaryDetail; 