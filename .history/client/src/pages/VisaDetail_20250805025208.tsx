import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
  FileDownload as DownloadIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS } from 'date-fns/locale';
import axios from 'axios';

interface Visa {
  _id: string;
  name: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  visaNumber: string;
  secretary: {
    _id: string;
    name: string;
    code: string;
  };
  secretaryCode: string;
  orderNumber: number;
  middlemanName: string;
  visaSponsor: string;
  visaIssueDate: string;
  visaExpiryDate: string;
  visaDeadline: string;
  visaDocument: string;
  secretaryProfitPercentage: number;
  totalExpenses: number;
  sellingPrice: number;
  profit: number;
  secretaryEarnings: number;
  customerName: string;
  customerPhone: string;
  currentStage: string;
  status: string;
  stageAExpenses: Array<{
    amount: number;
    description: string;
    date: string;
  }>;
  stageBExpenses: Array<{
    amount: number;
    description: string;
    date: string;
  }>;
  stageCExpenses: Array<{
    amount: number;
    description: string;
    date: string;
  }>;
  stageDExpenses: Array<{
    amount: number;
    description: string;
    date: string;
  }>;
  replacementExpenses: Array<{
    amount: number;
    description: string;
    date: string;
  }>;
  isReplaced: boolean;
  createdAt: string;
  completedAt: string;
  soldAt: string;
  cancelledAt: string;
}

const VisaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visa, setVisa] = useState<Visa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Dialogs
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [sellDialog, setSellDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [expenseData, setExpenseData] = useState({
    amount: '',
    description: '',
    date: new Date()
  });
  const [sellData, setSellData] = useState({
    sellingPrice: '',
    customerName: '',
    customerPhone: ''
  });
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (id) {
      fetchVisaDetails();
    }
  }, [id]);

  const fetchVisaDetails = async () => {
    try {
      const response = await axios.get(`/api/visas/${id}`);
      setVisa(response.data);
      setLoading(false);
    } catch (error) {
      console.error('خطأ في جلب تفاصيل التأشيرة:', error);
      setError('خطأ في جلب تفاصيل التأشيرة');
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    try {
      await axios.post(`/api/visas/${id}/expenses`, {
        ...expenseData,
        stage: currentStage,
        date: expenseData.date.toISOString()
      });
      
      setExpenseDialog(false);
      setExpenseData({ amount: '', description: '', date: new Date() });
      setSuccess('تم إضافة المصروف بنجاح');
      fetchVisaDetails();
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في إضافة المصروف');
    }
  };

  const handleCompleteStage = async (stage: string) => {
    try {
      const stageEndpoints = {
        'أ': `/api/visas/${id}/stage-a`,
        'ب': `/api/visas/${id}/complete-stage-b`,
        'ج': `/api/visas/${id}/complete-stage-c`,
        'د': `/api/visas/${id}/complete-stage-d`
      };

      await axios.put(stageEndpoints[stage as keyof typeof stageEndpoints]);
      
      if (stage === 'د') {
        setSuccess('تم إكمال جميع المراحل وتحويل التأشيرة لقسم البيع بنجاح');
      } else {
        setSuccess(`تم إكمال المرحلة ${stage} بنجاح`);
      }
      
      fetchVisaDetails();
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في إكمال المرحلة');
    }
  };

  const handleSellVisa = async () => {
    try {
      await axios.put(`/api/visas/${id}/sell`, {
        sellingPrice: parseFloat(sellData.sellingPrice),
        customerName: sellData.customerName,
        customerPhone: sellData.customerPhone
      });
      
      setSellDialog(false);
      setSellData({ sellingPrice: '', customerName: '', customerPhone: '' });
      setSuccess('تم بيع التأشيرة بنجاح');
      fetchVisaDetails();
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في بيع التأشيرة');
    }
  };

  const handleCancelVisa = async () => {
    try {
      await axios.put(`/api/visas/${id}/cancel`, {
        reason: cancelReason
      });
      
      setCancelDialog(false);
      setCancelReason('');
      setSuccess('تم إلغاء التأشيرة بنجاح');
      fetchVisaDetails();
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في إلغاء التأشيرة');
    }
  };

  const handleExportExpenses = async () => {
    try {
      const response = await axios.get(`/api/exports/expenses/${id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `مصروفات-${visa?.secretaryCode}${visa?.orderNumber.toString().padStart(3, '0')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('خطأ في تصدير المصروفات');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'قيد_الشراء': return 'primary';
      case 'معروضة_للبيع': return 'success';
      case 'مباعة': return 'info';
      case 'ملغاة': return 'error';
      default: return 'default';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'أ': return 'primary';
      case 'ب': return 'secondary';
      case 'ج': return 'info';
      case 'د': return 'warning';
      case 'مكتملة': return 'success';
      default: return 'default';
    }
  };

  const canCompleteStage = (stage: string) => {
    if (!visa) return false;
    
    // Only allow completion of the current stage
    if (visa.currentStage !== stage) return false;
    
    const stageExpenses = {
      'أ': visa.stageAExpenses,
      'ب': visa.stageBExpenses,
      'ج': visa.stageCExpenses,
      'د': visa.stageDExpenses
    };

    const expenses = stageExpenses[stage as keyof typeof stageExpenses];
    
    // Must have expenses to complete a stage
    const canComplete = Array.isArray(expenses) && expenses.length > 0;
    
    // Debug logging
    console.log(`canCompleteStage(${stage}):`, {
      currentStage: visa.currentStage,
      stage,
      expenses: expenses,
      expensesLength: expenses?.length,
      canComplete
    });
    
    return canComplete;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>جاري التحميل...</Typography>
      </Container>
    );
  }

  if (!visa) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>لم يتم العثور على التأشيرة</Typography>
      </Container>
    );
  }

  return (
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enUS}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            تفاصيل التأشيرة - {visa.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={`${visa.secretaryCode}${visa.orderNumber.toString().padStart(3, '0')}`}
              color="primary"
            />
            <Chip 
              label={visa.status}
              color={getStatusColor(visa.status) as any}
            />
          </Box>
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

        <Grid container spacing={3}>
          {/* المعلومات الأساسية */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  المعلومات الأساسية
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">الاسم</Typography>
                    <Typography variant="body1">{visa.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">الجنسية</Typography>
                    <Typography variant="body1">{visa.nationality}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">رقم الجواز</Typography>
                    <Typography variant="body1">{visa.passportNumber}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">رقم التأشيرة</Typography>
                    <Typography variant="body1">{visa.visaNumber}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">السكرتيرة المسؤولة</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">{visa.secretary.name}</Typography>
                      <Chip label={visa.secretary.code} size="small" />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">نسبة ربح السكرتيرة</Typography>
                    <Typography variant="body1">{visa.secretaryProfitPercentage}%</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* الإجراءات السريعة */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  الإجراءات
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {visa.status === 'قيد_الشراء' && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setCurrentStage(visa.currentStage);
                          setExpenseDialog(true);
                        }}
                      >
                        إضافة مصروف
                      </Button>
                      {canCompleteStage(visa.currentStage) && (
                        <Button
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => handleCompleteStage(visa.currentStage)}
                        >
                          {visa.currentStage === 'د' ? 'تحويل لقسم البيع' : `إكمال المرحلة ${visa.currentStage}`}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {visa.status === 'معروضة_للبيع' && (
                    <Button
                      variant="contained"
                      startIcon={<MoneyIcon />}
                      onClick={() => setSellDialog(true)}
                    >
                      بيع التأشيرة
                    </Button>
                  )}
                  
                  {visa.status !== 'مباعة' && visa.status !== 'ملغاة' && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => setCancelDialog(true)}
                    >
                      إلغاء التأشيرة
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportExpenses}
                  >
                    تصدير المصروفات
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* التبويبات */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                  <Tab label="المراحل والمصروفات" />
                  <Tab label="المعلومات المالية" />
                  <Tab label="معلومات العميل" />
                </Tabs>

                {/* تبويب المراحل والمصروفات */}
                {activeTab === 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      {['أ', 'ب', 'ج', 'د'].map((stage) => (
                        <Grid item xs={12} md={6} key={stage}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                  المرحلة {stage}
                                </Typography>
                                <Chip 
                                  label={visa.currentStage === stage ? 'حالية' : 
                                        (visa.currentStage === 'مكتملة' || visa.status === 'معروضة_للبيع' || visa.status === 'مباعة') ? 'مكتملة' : 'قادمة'}
                                  color={visa.currentStage === stage ? 'primary' : 
                                         (visa.currentStage === 'مكتملة' || visa.status === 'معروضة_للبيع' || visa.status === 'مباعة') ? 'success' : 'default'}
                                  size="small"
                                />
                              </Box>
                              
                              {stage === 'أ' && (
                                <List dense>
                                  <ListItem>
                                    <ListItemText 
                                      primary="اسم المندوب"
                                      secondary={visa.middlemanName || 'غير محدد'}
                                    />
                                  </ListItem>
                                  <ListItem>
                                    <ListItemText 
                                      primary="كفيل التأشيرة"
                                      secondary={visa.visaSponsor || 'غير محدد'}
                                    />
                                  </ListItem>
                                </List>
                              )}

                              <Typography variant="subtitle2" gutterBottom>
                                المصروفات:
                              </Typography>
                              
                              {(() => {
                                const expenses = {
                                  'أ': visa.stageAExpenses,
                                  'ب': visa.stageBExpenses,
                                  'ج': visa.stageCExpenses,
                                  'د': visa.stageDExpenses
                                }[stage] || [];

                                if (expenses.length === 0) {
                                  return <Typography color="text.secondary">لا توجد مصروفات</Typography>;
                                }

                                return (
                                  <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>التاريخ</TableCell>
                                          <TableCell>الوصف</TableCell>
                                          <TableCell>المبلغ</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {expenses.map((expense, index) => (
                                          <TableRow key={index}>
                                                                                          <TableCell>{new Date(expense.date).toLocaleDateString('en-US')}</TableCell>
                                            <TableCell>{expense.description}</TableCell>
                                            <TableCell>{expense.amount.toLocaleString()} دينار</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                );
                              })()}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* تبويب المعلومات المالية */}
                {activeTab === 1 && (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              المصروفات
                            </Typography>
                            <Typography variant="h4" color="error">
                              {visa.totalExpenses.toLocaleString()} دينار
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              إجمالي المصروفات
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      {visa.status === 'مباعة' && (
                        <>
                          <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  سعر البيع
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                  {visa.sellingPrice.toLocaleString()} دينار
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  الربح الإجمالي
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                  {visa.profit.toLocaleString()} دينار
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  أرباح السكرتيرة
                                </Typography>
                                <Typography variant="h4" color="primary">
                                  {visa.secretaryEarnings.toLocaleString()} دينار
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>
                )}

                {/* تبويب معلومات العميل */}
                {activeTab === 2 && (
                  <Box sx={{ mt: 2 }}>
                    {visa.status === 'مباعة' ? (
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            معلومات العميل
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">اسم العميل</Typography>
                              <Typography variant="body1">{visa.customerName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">رقم الهاتف</Typography>
                              <Typography variant="body1">{visa.customerPhone}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">تاريخ البيع</Typography>
                              <Typography variant="body1">
                                {new Date(visa.soldAt).toLocaleDateString('en-US')}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ) : (
                      <Typography color="text.secondary">
                        لم يتم بيع التأشيرة بعد
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dialog إضافة مصروف */}
        <Dialog open={expenseDialog} onClose={() => setExpenseDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>إضافة مصروف - المرحلة {currentStage}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="المبلغ"
                  type="number"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="الوصف"
                  multiline
                  rows={3}
                  value={expenseData.description}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="التاريخ"
                  value={expenseData.date}
                  onChange={(date) => setExpenseData(prev => ({ ...prev, date: date || new Date() }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      dir: 'rtl'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExpenseDialog(false)}>إلغاء</Button>
            <Button onClick={handleAddExpense} variant="contained">إضافة</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog بيع التأشيرة */}
        <Dialog open={sellDialog} onClose={() => setSellDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>بيع التأشيرة</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="سعر البيع"
                  type="number"
                  value={sellData.sellingPrice}
                  onChange={(e) => setSellData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="اسم العميل"
                  value={sellData.customerName}
                  onChange={(e) => setSellData(prev => ({ ...prev, customerName: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="رقم هاتف العميل"
                  value={sellData.customerPhone}
                  onChange={(e) => setSellData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSellDialog(false)}>إلغاء</Button>
            <Button onClick={handleSellVisa} variant="contained">بيع</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog إلغاء التأشيرة */}
        <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>إلغاء التأشيرة</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="سبب الإلغاء"
              multiline
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              sx={{ mt: 1 }}
              dir="rtl"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialog(false)}>إلغاء</Button>
            <Button onClick={handleCancelVisa} variant="contained" color="error">تأكيد الإلغاء</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default VisaDetail; 