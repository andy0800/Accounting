import React, { useState, useEffect } from 'react';
import apiClient from '../config/axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  FileUpload as FileUploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface RentalPayment {
  _id: string;
  contractId: {
    _id: string;
    unitId: {
    unitNumber: string;
    unitType: string;
    };
    secretaryId: {
      name: string;
      phone: string;
    };
    monthlyRent: number;
  };
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  description: string;
  monthYear: string;
  receiptDocument?: string;
}

const RentalPayments: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/rental-payments');
      setPayments(Array.isArray(response.data) ? response.data : (response.data?.payments || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
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

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'نقدي':
        return 'success';
      case 'تحويل بنكي':
        return 'primary';
      case 'شيك':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.contractId.unitId.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.contractId.secretaryId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterMethod || payment.paymentMethod === filterMethod;
    
    return matchesSearch && matchesFilter;
  });

  const downloadReceipt = async (paymentId: string, receiptPath: string) => {
    try {
      const response = await apiClient.get(`/api/rental-payments/${paymentId}/receipt`, { responseType: 'blob' });
      if (response.status === 200) {
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const handleUploadReceipt = async (paymentId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx';
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        try {
          const formData = new FormData();
          formData.append('receipt', target.files[0]);
          
          await apiClient.post(`/api/rental-payments/${paymentId}/receipt`, formData);
          
          // Refresh payments to show the new receipt
          fetchPayments();
        } catch (err) {
          console.error('Error uploading receipt:', err);
        }
      }
    };
    input.click();
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          إدارة مدفوعات الإيجار
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/renting')}
        >
          رجوع للوحة المعلومات
        </Button>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="البحث"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث بالوحدة، السكرتير، أو الوصف"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                  label="طريقة الدفع"
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon />
                    </InputAdornment>
                  ),
                }}
              >
                <option value="">الكل</option>
                <option value="نقدي">نقدي</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="شيك">شيك</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                إجمالي المدفوعات: {filteredPayments.length}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent>
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>الوحدة</TableCell>
            <TableCell>السكرتير</TableCell>
            <TableCell>المبلغ</TableCell>
            <TableCell>طريقة الدفع</TableCell>
                  <TableCell>الوصف</TableCell>
                  <TableCell>الشهر</TableCell>
            <TableCell>الإجراءات</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
                {filteredPayments.map((payment) => (
            <TableRow key={payment._id}>
              <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {payment.contractId.unitId.unitNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payment.contractId.unitId.unitType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {payment.contractId.secretaryId.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payment.contractId.secretaryId.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </TableCell>
              <TableCell>
                <Chip 
                        label={payment.paymentMethod}
                        color={getPaymentMethodColor(payment.paymentMethod) as any}
                  size="small"
                />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {payment.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.monthYear}
                  </Typography>
              </TableCell>
              <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="عرض التفاصيل">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/renting/contracts/${payment.contractId._id}`)}
                          >
                            <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                        {payment.receiptDocument ? (
                          <Tooltip title="تحميل الإيصال">
                            <IconButton
                              size="small"
                              onClick={() => downloadReceipt(payment._id, payment.receiptDocument!)}
                            >
                              <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                        ) : (
                          <Tooltip title="رفع إيصال">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleUploadReceipt(payment._id)}
                            >
                              <FileUploadIcon />
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

          {filteredPayments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                لا توجد مدفوعات متاحة
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RentalPayments;
