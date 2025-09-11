import React, { useState, useEffect } from 'react';
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
  Paper,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';

interface Secretary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber?: string;
  status: 'نشط' | 'غير نشط';
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
  terminationDate: string;
  terminationReason: string;
  documents?: Array<{
    name: string;
    filePath: string;
    uploadDate: string;
  }>;
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
  paymentMethod: 'نقدي' | 'تحويل بنكي' | 'شيك' | 'بطاقة ائتمان';
  notes?: string;
}

interface TerminatedRentalData {
  contract: RentalContract;
  totalPaid: number;
  totalOwed: number;
  finalBalance: number;
  lastPaymentDate?: string;
  paymentHistory: RentalPayment[];
}

const TerminatedRentals: React.FC = () => {
  const navigate = useNavigate();
  const [terminatedRentals, setTerminatedRentals] = useState<TerminatedRentalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRental, setSelectedRental] = useState<TerminatedRentalData | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchTerminatedRentals();
  }, []);

  const fetchTerminatedRentals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rental-contracts/terminated');
      if (!response.ok) {
        throw new Error('فشل في جلب العقود المنتهية');
      }
      const data = await response.json();
      setTerminatedRentals(data.terminatedRentals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (rental: TerminatedRentalData) => {
    setSelectedRental(rental);
    setShowDetailsDialog(true);
  };

  const filteredRentals = terminatedRentals.filter(rental => {
    const matchesSearch = 
      rental.contract.secretaryId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.contract.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.contract.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'paid' && rental.finalBalance <= 0) ||
      (filterStatus === 'unpaid' && rental.finalBalance > 0);
    
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getFinalBalanceColor = (balance: number) => {
    if (balance <= 0) return 'success';
    if (balance > 0) return 'error';
    return 'default';
  };

  const getFinalBalanceIcon = (balance: number) => {
    if (balance <= 0) return <CheckCircleIcon color="success" />;
    if (balance > 0) return <ErrorIcon color="error" />;
    return <WarningIcon color="warning" />;
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/renting/units')}
            variant="outlined"
          >
            العودة
          </Button>
          <Typography variant="h4" component="h1">
            العقود الإيجارية المنتهية
          </Typography>
        </Box>
        <Chip 
          label={`${terminatedRentals.length} عقد منتهي`}
          color="info"
          variant="outlined"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="البحث"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث بالاسم أو رقم الوحدة أو العنوان"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>حالة الدفع النهائية</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="حالة الدفع النهائية"
                >
                  <MenuItem value="all">جميع العقود</MenuItem>
                  <MenuItem value="paid">مدفوع بالكامل</MenuItem>
                  <MenuItem value="unpaid">غير مدفوع</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Chip 
                  label={`إجمالي المدفوع: ${formatCurrency(terminatedRentals.reduce((sum, r) => sum + r.totalPaid, 0))}`}
                  color="success"
                  variant="outlined"
                />
                <Chip 
                  label={`إجمالي المستحق: ${formatCurrency(terminatedRentals.reduce((sum, r) => sum + r.totalOwed, 0))}`}
                  color="error"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Terminated Rentals Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>السكرتير</TableCell>
              <TableCell>الوحدة</TableCell>
              <TableCell>تاريخ الإنهاء</TableCell>
              <TableCell>سبب الإنهاء</TableCell>
              <TableCell>المبلغ المطلوب</TableCell>
              <TableCell>المدفوع</TableCell>
              <TableCell>الرصيد النهائي</TableCell>
              <TableCell>آخر دفعة</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRentals.map((rental) => (
              <TableRow key={rental.contract._id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {rental.contract.secretaryId.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rental.contract.secretaryId.phone}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {rental.contract.unitType} - {rental.contract.unitNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rental.contract.address}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(rental.contract.terminationDate)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {rental.contract.terminationReason}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="error.main">
                    {formatCurrency(rental.totalOwed)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(rental.totalPaid)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={formatCurrency(rental.finalBalance)}
                    color={getFinalBalanceColor(rental.finalBalance) as any}
                    size="small"
                    icon={getFinalBalanceIcon(rental.finalBalance)}
                  />
                </TableCell>
                <TableCell>
                  {rental.lastPaymentDate ? (
                    <Typography variant="body2">
                      {formatDate(rental.lastPaymentDate)}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      لا توجد دفعات
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title="عرض التفاصيل">
                    <IconButton 
                      size="small"
                      color="primary"
                      onClick={() => handleViewDetails(rental)}
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

      {filteredRentals.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            لا توجد عقود منتهية
          </Typography>
        </Box>
      )}

      {/* Rental Details Dialog */}
      <Dialog 
        open={showDetailsDialog} 
        onClose={() => setShowDetailsDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              تفاصيل العقد المنتهي
            </Typography>
            <IconButton onClick={() => setShowDetailsDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRental && (
            <Box>
              {/* Contract Summary */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        معلومات الوحدة
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          نوع الوحدة: <strong>{selectedRental.contract.unitType}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          رقم الوحدة: <strong>{selectedRental.contract.unitNumber}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          العنوان: <strong>{selectedRental.contract.address}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          مبلغ الإيجار: <strong>{formatCurrency(selectedRental.contract.rentAmount)}</strong>
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        معلومات الإنهاء
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          تاريخ الإنهاء: <strong>{formatDate(selectedRental.contract.terminationDate)}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          سبب الإنهاء: <strong>{selectedRental.contract.terminationReason}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          تاريخ البدء: <strong>{formatDate(selectedRental.contract.startDate)}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          يوم الاستحقاق: <strong>{selectedRental.contract.dueDay}</strong>
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
                      الاسم: <strong>{selectedRental.contract.secretaryId.name}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      الهاتف: <strong>{selectedRental.contract.secretaryId.phone}</strong>
                    </Typography>
                    {selectedRental.contract.secretaryId.email && (
                      <Typography variant="body2" color="text.secondary">
                        البريد الإلكتروني: <strong>{selectedRental.contract.secretaryId.email}</strong>
                      </Typography>
                    )}
                    {selectedRental.contract.secretaryId.address && (
                      <Typography variant="body2" color="text.secondary">
                        العنوان: <strong>{selectedRental.contract.secretaryId.address}</strong>
                      </Typography>
                    )}
                  </Box>

                  {selectedRental.contract.notes && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        ملاحظات
                      </Typography>
                      <Typography variant="body2">
                        {selectedRental.contract.notes}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    الملخص المالي
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="error.main">
                          {formatCurrency(selectedRental.totalOwed)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          إجمالي المطلوب
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {formatCurrency(selectedRental.totalPaid)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          إجمالي المدفوع
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color={getFinalBalanceColor(selectedRental.finalBalance)}>
                          {formatCurrency(selectedRental.finalBalance)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          الرصيد النهائي
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Chip 
                          label={selectedRental.finalBalance <= 0 ? 'مدفوع بالكامل' : 'غير مدفوع'}
                          color={getFinalBalanceColor(selectedRental.finalBalance) as any}
                          size="medium"
                          icon={getFinalBalanceIcon(selectedRental.finalBalance)}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    سجل المدفوعات
                  </Typography>
                  
                  {selectedRental.paymentHistory.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>التاريخ</TableCell>
                            <TableCell>الشهر</TableCell>
                            <TableCell>المبلغ</TableCell>
                            <TableCell>الوصف</TableCell>
                            <TableCell>طريقة الدفع</TableCell>
                            <TableCell>المستندات</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedRental.paymentHistory.map((payment) => (
                            <TableRow key={payment._id}>
                              <TableCell>
                                {formatDate(payment.paymentDate)}
                              </TableCell>
                              <TableCell>
                                {payment.monthYear}
                              </TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  color="success.main"
                                  fontWeight="bold"
                                >
                                  {formatCurrency(payment.amount)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {payment.description}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={payment.paymentMethod}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                {payment.receiptDocument ? (
                                  <IconButton size="small" color="primary">
                                    <DownloadIcon />
                                  </IconButton>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      لا توجد مدفوعات مسجلة
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TerminatedRentals;
