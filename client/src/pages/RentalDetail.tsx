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
  Paper,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import apiClient from '../config/axios';

interface Secretary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber?: string;
  status: 'نشط' | 'غير نشط';
  documents?: Array<{
    name: string;
    filePath: string;
    uploadDate: string;
  }>;
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
  terminationDate?: string;
  terminationReason?: string;
  documents?: Array<{
    name: string;
    filePath: string;
    uploadDate: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  referenceNumber?: string;
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
  paymentMethod: 'نقدي' | 'تحويل بنكي' | 'شيك' | 'بطاقة ائتمان';
  notes?: string;
}

interface MonthlyPaymentData {
  monthYear: string;
  totalPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
  status: string;
  payments: RentalPayment[];
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

const RentalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPaymentData[]>([]);
  const [pastMonths, setPastMonths] = useState<any[]>([]);
  const [upcomingMonths, setUpcomingMonths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Payment dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    monthYear: '',
    amount: '',
    description: '',
    paymentMethod: 'نقدي' as const,
    notes: '',
    receiptFile: undefined as File | undefined
  });
  const [terminateForm, setTerminateForm] = useState({
    terminationReason: '',
    notes: ''
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (id) {
      fetchContractDetails();
    }
  }, [id]);

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rental-contracts/${id}/details`);
      if (!response.ok) {
        throw new Error('فشل في جلب تفاصيل العقد');
      }
      const data = await response.json();
      
      setContract(data.contract);
      setMonthlyPayments(data.monthlyPayments || []);
      setPastMonths(data.pastMonths || []);
      setUpcomingMonths(data.upcomingMonths || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    try {
      const formData = new FormData();
      formData.append('contractId', id || '');
      formData.append('monthYear', paymentForm.monthYear);
      formData.append('amount', paymentForm.amount);
      formData.append('description', paymentForm.description);
      formData.append('paymentMethod', paymentForm.paymentMethod);
      formData.append('notes', paymentForm.notes);
      formData.append('isPartial', (parseFloat(paymentForm.amount) < (contract?.rentAmount || 0)).toString());

      if (paymentForm.receiptFile) {
        formData.append('receiptDocument', paymentForm.receiptFile);
      }

      await apiClient.post('/api/rental-payments', formData);

      setShowPaymentDialog(false);
      setPaymentForm({
        monthYear: '',
        amount: '',
        description: '',
        paymentMethod: 'نقدي',
        notes: '',
        receiptFile: undefined
      });
      setSnackbar({
        open: true,
        message: 'تم إضافة الدفعة بنجاح',
        severity: 'success'
      });
      fetchContractDetails(); // Refresh data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleTerminateContract = async () => {
    try {
      const response = await fetch(`/api/rental-contracts/${id}/terminate`, {
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
      setTerminateForm({
        terminationReason: '',
        notes: ''
      });
      setSnackbar({
        open: true,
        message: 'تم إنهاء العقد بنجاح',
        severity: 'success'
      });
      fetchContractDetails(); // Refresh data
      navigate('/renting/units'); // Redirect to units list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'مدفوع بالكامل': return 'success';
      case 'مدفوع جزئياً': return 'warning';
      case 'غير مدفوع': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'مدفوع بالكامل': return <CheckCircleIcon color="success" />;
      case 'مدفوع جزئياً': return <WarningIcon color="warning" />;
      case 'غير مدفوع': return <ErrorIcon color="error" />;
      default: return <CalendarIcon />;
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

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
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

  if (!contract) {
    return (
      <Alert severity="warning">
        العقد غير موجود
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/renting/units')}
            variant="outlined"
            disabled={loading}
          >
            العودة
          </Button>
          <Typography variant="h4" component="h1">
            تفاصيل العقد الإيجاري {contract.referenceNumber ? `- مرجع: ${contract.referenceNumber}` : ''}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={() => setShowPaymentDialog(true)}
            sx={{ mr: 1 }}
            disabled={loading}
          >
            إضافة دفعة
          </Button>
          {contract.status === 'نشط' && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setShowTerminateDialog(true)}
              disabled={loading}
            >
              إنهاء العقد
            </Button>
          )}
        </Box>
      </Box>

      {/* Contract Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                معلومات الوحدة
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  نوع الوحدة: <strong>{contract.unitType}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  رقم الوحدة: <strong>{contract.unitNumber}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  العنوان: <strong>{contract.address}</strong>
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                معلومات الإيجار
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  مبلغ الإيجار: <strong>{formatCurrency(contract.rentAmount)}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  تاريخ البدء: <strong>{formatDate(contract.startDate)}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  يوم الاستحقاق: <strong>{contract.dueDay}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  الحالة: <Chip 
                    label={contract.status} 
                    color={contract.status === 'نشط' ? 'success' : 'error'}
                    size="small"
                  />
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            معلومات السكرتير
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              الاسم: <strong>{contract.secretaryId.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              الهاتف: <strong>{contract.secretaryId.phone}</strong>
            </Typography>
            {contract.secretaryId.email && (
              <Typography variant="body2" color="text.secondary">
                البريد الإلكتروني: <strong>{contract.secretaryId.email}</strong>
              </Typography>
            )}
            {contract.secretaryId.address && (
              <Typography variant="body2" color="text.secondary">
                العنوان: <strong>{contract.secretaryId.address}</strong>
              </Typography>
            )}
          </Box>

          {contract.notes && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                ملاحظات
              </Typography>
              <Typography variant="body2">
                {contract.notes}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="المدفوعات الشهرية" />
          <Tab label="الأشهر الماضية" />
          <Tab label="الأشهر القادمة" />
          <Tab label="المستندات" />
        </Tabs>
      </Box>

      {/* Monthly Payments Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            تتبع المدفوعات الشهرية
          </Typography>
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={() => setShowPaymentDialog(true)}
            disabled={loading}
          >
            إضافة دفعة جديدة
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الشهر</TableCell>
                <TableCell>المبلغ المطلوب</TableCell>
                <TableCell>المدفوع</TableCell>
                <TableCell>المتبقي</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>الدفعات</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthlyPayments.map((monthData) => (
                <TableRow key={monthData.monthYear}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatMonthYear(monthData.monthYear)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(contract.rentAmount)}
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={monthData.totalPaid > 0 ? 'success.main' : 'text.secondary'}
                    >
                      {formatCurrency(monthData.totalPaid)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={monthData.remainingBalance > 0 ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency(monthData.remainingBalance)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={monthData.status}
                      color={getPaymentStatusColor(monthData.status) as any}
                      size="small"
                      icon={getPaymentStatusIcon(monthData.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge badgeContent={monthData.payments.length} color="primary">
                      <ReceiptIcon />
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                                              <Tooltip title="عرض التفاصيل">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              // Show payment details in an accordion
                            }}
                            disabled={loading}
                          >
                            <DescriptionIcon />
                          </IconButton>
                        </Tooltip>
                      {monthData.remainingBalance > 0 && (
                        <Tooltip title="إضافة دفعة">
                          <IconButton 
                            size="small"
                            color="primary"
                            onClick={() => {
                              setPaymentForm({
                                ...paymentForm,
                                monthYear: monthData.monthYear,
                                amount: monthData.remainingBalance.toString(),
                                receiptFile: undefined
                              });
                              setShowPaymentDialog(true);
                            }}
                            disabled={loading}
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Payment Details Accordion */}
        {monthlyPayments.map((monthData) => (
          <Accordion key={monthData.monthYear} sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                تفاصيل دفعات {formatMonthYear(monthData.monthYear)}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {monthData.payments.length > 0 ? (
                <List>
                  {monthData.payments.map((payment) => (
                    <ListItem key={payment._id}>
                      <ListItemIcon>
                        <MoneyIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${formatCurrency(payment.amount)} - ${payment.description}`}
                        secondary={`${formatDate(payment.paymentDate)} - ${payment.paymentMethod}`}
                      />
                        {payment.receiptDocument && (
                        <Tooltip title="تحميل الإيصال">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              const base = (apiClient.defaults.baseURL || '').replace(/\/$/, '');
                              window.open(`${base}/api/rental-payments/${payment._id}/receipt`, '_blank');
                            }}
                            disabled={loading}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  لا توجد دفعات لهذا الشهر
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </TabPanel>

      {/* Past Months Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          الأشهر الماضية (آخر 12 شهر)
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الشهر</TableCell>
                <TableCell>المبلغ المطلوب</TableCell>
                <TableCell>المدفوع</TableCell>
                <TableCell>المتبقي</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>عدد الدفعات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pastMonths.map((monthData) => (
                <TableRow key={monthData.monthYear}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatMonthYear(monthData.monthYear)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(contract.rentAmount)}
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={monthData.totalPaid > 0 ? 'success.main' : 'text.secondary'}
                    >
                      {formatCurrency(monthData.totalPaid)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={monthData.remainingBalance > 0 ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency(monthData.remainingBalance)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={monthData.status}
                      color={getPaymentStatusColor(monthData.status) as any}
                      size="small"
                      icon={getPaymentStatusIcon(monthData.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge badgeContent={monthData.payments.length} color="primary">
                      <ReceiptIcon />
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Upcoming Months Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          الأشهر القادمة (الستة أشهر القادمة)
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الشهر</TableCell>
                <TableCell>تاريخ الاستحقاق</TableCell>
                <TableCell>المبلغ المطلوب</TableCell>
                <TableCell>الحالة</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcomingMonths.map((monthData) => (
                <TableRow key={monthData.monthYear}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatMonthYear(monthData.monthYear)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatDate(monthData.dueDate)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(monthData.expectedAmount)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={monthData.status}
                      color="info"
                      size="small"
                      icon={<CalendarIcon />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Documents Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom>
          المستندات المرفقة
        </Typography>
        
                              {contract.documents && contract.documents.length > 0 ? (
          <List>
            {contract.documents.map((doc, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText
                  primary={doc.name}
                  secondary={formatDate(doc.uploadDate)}
                />
                                        <Tooltip title="تحميل المستند">
                          <IconButton 
                            size="small"
                            onClick={() => window.open(`/api/rental-contracts/${contract._id}/document/${doc.filePath}`, '_blank')}
                            disabled={loading}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            لا توجد مستندات مرفقة
          </Typography>
        )}
      </TabPanel>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>إضافة دفعة جديدة</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الشهر والسنة"
                type="month"
                value={paymentForm.monthYear}
                onChange={(e) => setPaymentForm({ ...paymentForm, monthYear: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="مبلغ الدفعة"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required
                placeholder="0.000"
                disabled={loading}
                InputProps={{
                  endAdornment: <Typography>د.ك</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="وصف الدفعة"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                required
                placeholder="مثال: دفعة إيجار شهر يونيو"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>طريقة الدفع</InputLabel>
                <Select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                  label="طريقة الدفع"
                  disabled={loading}
                >
                  <MenuItem value="نقدي">نقدي</MenuItem>
                  <MenuItem value="تحويل بنكي">تحويل بنكي</MenuItem>
                  <MenuItem value="شيك">شيك</MenuItem>
                  <MenuItem value="بطاقة ائتمان">بطاقة ائتمان</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                multiline
                rows={3}
                placeholder="ملاحظات إضافية حول الدفعة"
                disabled={loading}
              />
            </Grid>

            {/* File Upload Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                إيصال الدفع (اختياري)
              </Typography>
              <input
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="receipt-upload"
                type="file"
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPaymentForm(prev => ({ ...prev, receiptFile: file }));
                  }
                }}
              />
              <label htmlFor="receipt-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 1 }}
                  disabled={loading}
                >
                  رفع ملف
                </Button>
              </label>
              
              {paymentForm.receiptFile && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <DescriptionIcon color="primary" />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {paymentForm.receiptFile.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => setPaymentForm(prev => ({ ...prev, receiptFile: undefined }))} 
                    color="error"
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
              
              <Typography variant="caption" color="text.secondary">
                الملفات المسموحة: PDF, DOC, DOCX, JPG, JPEG, PNG (الحد الأقصى: 10 ميجابايت)
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)} disabled={loading}>إلغاء</Button>
          <Button 
            onClick={handleAddPayment} 
            variant="contained"
            disabled={!paymentForm.monthYear || !paymentForm.amount || !paymentForm.description || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'جاري الإضافة...' : 'إضافة الدفعة'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terminate Contract Dialog */}
      <Dialog open={showTerminateDialog} onClose={() => setShowTerminateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>إنهاء العقد الإيجاري</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="سبب الإنهاء"
                value={terminateForm.terminationReason}
                onChange={(e) => setTerminateForm({ ...terminateForm, terminationReason: e.target.value })}
                required
                multiline
                rows={3}
                placeholder="اذكر سبب إنهاء العقد"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات إضافية"
                value={terminateForm.notes}
                onChange={(e) => setTerminateForm({ ...terminateForm, notes: e.target.value })}
                multiline
                rows={3}
                placeholder="ملاحظات إضافية حول إنهاء العقد"
                disabled={loading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTerminateDialog(false)} disabled={loading}>إلغاء</Button>
          <Button 
            onClick={handleTerminateContract} 
            variant="contained"
            color="error"
            disabled={!terminateForm.terminationReason || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'جاري الإنهاء...' : 'إنهاء العقد'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RentalDetail;
