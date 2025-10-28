import React, { useState, useEffect, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckIcon,
  AttachMoney as MoneyIcon,
  FileDownload as DownloadIcon,
  Cancel as CancelIcon,
  SwapHoriz as ReplaceIcon,
  SkipNext as SkipNextIcon
} from '@mui/icons-material';
import { MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS } from 'date-fns/locale';
import apiClient from '../config/axios';

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
  sellingSecretary?: string;
  sellingCommission?: number;
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

interface Secretary {
  _id: string;
  name: string;
  code: string;
}

const VisaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visa, setVisa] = useState<Visa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replacementEligibility, setReplacementEligibility] = useState<{
    eligible: boolean;
    daysSinceCreation: number;
    remainingDays: number;
    reasons: string[];
  } | null>(null);
  
  const [arrivalStatus, setArrivalStatus] = useState<{
    visaId: string;
    visaNumber: string;
    maidArrivalVerified: boolean;
    maidArrivalDate?: string;
    maidArrivalVerifiedBy?: {
      _id: string;
      name: string;
      code: string;
    };
    maidArrivalNotes?: string;
    activeCancellationDeadline?: string;
    deadlineStatus: 'inactive' | 'active' | 'expired';
    daysUntilCancellation?: number;
    daysSinceArrival?: number;
    eligibleForArrivalVerification: boolean;
    currentStage: string;
    status: string;
  } | null>(null);
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  
  // Dialogs
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [sellDialog, setSellDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [replaceDialog, setReplaceDialog] = useState(false);
  const [arrivalDialog, setArrivalDialog] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [expenseData, setExpenseData] = useState({
    amount: '',
    description: '',
    date: new Date()
  });
  const [sellData, setSellData] = useState({
    sellingPrice: '',
    customerName: '',
    customerPhone: '',
    sellingSecretary: '',
    sellingCommission: ''
  });
  const [cancelReason, setCancelReason] = useState('');
  const [replaceData, setReplaceData] = useState({
    name: '',
    dateOfBirth: new Date(),
    nationality: '',
    passportNumber: '',
    visaNumber: '',
    secretaryId: '',
    middlemanName: '',
    visaSponsor: '',
    visaIssueDate: new Date(),
    visaExpiryDate: new Date(),
    visaDeadline: new Date(),
    secretaryProfitPercentage: ''
  });
  
  const [arrivalData, setArrivalData] = useState({
    arrivalDate: new Date(),
    notes: '',
    verifiedBy: ''
  });

  const fetchVisaDetails = useCallback(async () => {
    try {
      const [visaResponse, eligibilityResponse, arrivalResponse] = await Promise.all([
        apiClient.get(`/api/visas/${id}`),
        apiClient.get(`/api/visas/${id}/replacement-eligibility`),
        apiClient.get(`/api/visas/${id}/arrival-status`) // New API call
      ]);
      
      setVisa(visaResponse.data);
      setReplacementEligibility(eligibilityResponse.data);
      setArrivalStatus(arrivalResponse.data); // Set arrival status
      setLoading(false);
    } catch (error) {
      console.error('خطأ في جلب تفاصيل التأشيرة:', error);
      setError('خطأ في جلب تفاصيل التأشيرة');
      setLoading(false);
    }
  }, [id]);

  const fetchSecretaries = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/secretaries');
      setSecretaries(response.data);
    } catch (error) {
      console.error('خطأ في جلب السكرتارية:', error);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchVisaDetails();
      fetchSecretaries();
    }
  }, [id, fetchVisaDetails, fetchSecretaries]);

  const handleAddExpense = async () => {
    try {
      await apiClient.post(`/api/visas/${id}/expenses`, {
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

      await apiClient.put(stageEndpoints[stage as keyof typeof stageEndpoints]);
      
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
      const sellPayload: any = {
        sellingPrice: parseFloat(sellData.sellingPrice),
        customerName: sellData.customerName,
        customerPhone: sellData.customerPhone
      };

      // إضافة معلومات عمولة البيع إذا تم توفيرها
      if (sellData.sellingSecretary && sellData.sellingCommission) {
        sellPayload.sellingSecretary = sellData.sellingSecretary;
        sellPayload.sellingCommission = parseFloat(sellData.sellingCommission);
      }

      await apiClient.put(`/api/visas/${id}/sell`, sellPayload);
      
      setSellDialog(false);
      setSellData({ 
        sellingPrice: '', 
        customerName: '', 
        customerPhone: '', 
        sellingSecretary: '', 
        sellingCommission: '' 
      });
      setSuccess('تم بيع التأشيرة بنجاح');
      fetchVisaDetails();
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في بيع التأشيرة');
    }
  };

  const handleCancelVisa = async () => {
    try {
      await apiClient.put(`/api/visas/${id}/cancel`, {
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

  const handleReplaceVisa = async () => {
    try {
      const formData = new FormData();
      formData.append('name', replaceData.name);
      formData.append('dateOfBirth', replaceData.dateOfBirth.toISOString());
      formData.append('nationality', replaceData.nationality);
      formData.append('passportNumber', replaceData.passportNumber);
      formData.append('visaNumber', replaceData.visaNumber);
      formData.append('secretaryId', replaceData.secretaryId);
      formData.append('middlemanName', replaceData.middlemanName);
      formData.append('visaSponsor', replaceData.visaSponsor);
      formData.append('visaIssueDate', replaceData.visaIssueDate.toISOString());
      formData.append('visaExpiryDate', replaceData.visaExpiryDate.toISOString());
      formData.append('visaDeadline', replaceData.visaDeadline.toISOString());
      formData.append('secretaryProfitPercentage', replaceData.secretaryProfitPercentage);

      const response = await apiClient.post(`/api/visas/${id}/replace`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setReplaceDialog(false);
      setReplaceData({
        name: '',
        dateOfBirth: new Date(),
        nationality: '',
        passportNumber: '',
        visaNumber: '',
        secretaryId: '',
        middlemanName: '',
        visaSponsor: '',
        visaIssueDate: new Date(),
        visaExpiryDate: new Date(),
        visaDeadline: new Date(),
        secretaryProfitPercentage: ''
      });
      setSuccess('تم استبدال التأشيرة بنجاح');
      navigate(`/visas/${response.data._id}`);
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في استبدال التأشيرة');
    }
  };

  const handleVerifyArrival = async () => {
    try {
      const response = await apiClient.post(`/api/visas/${id}/verify-arrival`, {
        arrivalDate: arrivalData.arrivalDate.toISOString(),
        notes: arrivalData.notes,
        verifiedBy: arrivalData.verifiedBy
      });

      setSuccess('تم التحقق من وصول الخادمة بنجاح - بدء العد التنازلي 30 يوماً');
      setArrivalDialog(false);
      
      // Reset form
      setArrivalData({
        arrivalDate: new Date(),
        notes: '',
        verifiedBy: ''
      });
      
      // Refresh data
      fetchVisaDetails();
      
      console.log('✅ تم التحقق من الوصول:', response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'خطأ في التحقق من وصول الخادمة');
      console.error('❌ خطأ في التحقق من الوصول:', error);
    }
  };

  const handleExportExpenses = async () => {
    try {
      const response = await apiClient.get(`/api/exports/expenses/${id}`, {
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

  const canCompleteStage = (stage: string) => {
    if (!visa) return false;
    
    // Only allow completion of the current stage
    if (visa.currentStage !== stage) return false;
    
    // Stage A requires expenses to complete
    if (stage === 'أ') {
      const expenses = visa.stageAExpenses;
      return Array.isArray(expenses) && expenses.length > 0;
    }
    
    // For stages B, C, D - allow completion even without expenses (skippable)
    return true;
  };

  const canSkipStage = (stage: string) => {
    if (!visa) return false;
    
    // Only allow skipping of the current stage
    if (visa.currentStage !== stage) return false;
    
    // Stage A cannot be skipped
    if (stage === 'أ') return false;
    
    // Stages B, C, D can be skipped
    return ['ب', 'ج', 'د'].includes(stage);
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
            {visa.isReplaced && (
              <Chip 
                label="مستبدلة"
                color="warning"
              />
            )}
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

        {/* معلومات إمكانية الاستبدال */}
        {replacementEligibility && (
          <Alert 
            severity={replacementEligibility.eligible ? "info" : "warning"} 
            sx={{ mb: 2 }}
          >
            {replacementEligibility.eligible ? (
              <Box>
                <Typography variant="body2">
                  يمكن استبدال التأشيرة خلال {replacementEligibility.remainingDays} يوم متبقي
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  تم إنشاء التأشيرة منذ {replacementEligibility.daysSinceCreation} يوم
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2">
                  لا يمكن استبدال التأشيرة
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  الأسباب: {replacementEligibility.reasons.join(', ')}
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        {/* معلومات وصول الخادمة والموعد النهائي */}
        {arrivalStatus && (
          <Alert 
            severity={
              arrivalStatus.maidArrivalVerified 
                ? arrivalStatus.deadlineStatus === 'active' 
                  ? "success" 
                  : arrivalStatus.deadlineStatus === 'expired' 
                    ? "error" 
                    : "info"
                : "warning"
            } 
            sx={{ mb: 2 }}
          >
            {arrivalStatus.maidArrivalVerified ? (
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  ✅ تم التحقق من وصول الخادمة
                </Typography>
                <Typography variant="body2">
                  📅 تاريخ الوصول: {new Date(arrivalStatus.maidArrivalDate!).toLocaleDateString('ar-SA')}
                </Typography>
                {arrivalStatus.daysSinceArrival !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    منذ {arrivalStatus.daysSinceArrival} يوم
                  </Typography>
                )}
                
                {arrivalStatus.deadlineStatus === 'active' && arrivalStatus.daysUntilCancellation !== undefined && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="warning.main">
                      ⏰ الموعد النهائي للإلغاء: {arrivalStatus.daysUntilCancellation} يوم متبقي
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      الإلغاء التلقائي في: {new Date(arrivalStatus.activeCancellationDeadline!).toLocaleDateString('ar-SA')}
                    </Typography>
                  </Box>
                )}
                
                {arrivalStatus.deadlineStatus === 'expired' && (
                  <Typography variant="body2" color="error.main">
                    ❌ انتهى الموعد النهائي - مؤهلة للإلغاء التلقائي
                  </Typography>
                )}
                
                {arrivalStatus.maidArrivalVerifiedBy && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    تم التحقق بواسطة: {arrivalStatus.maidArrivalVerifiedBy.name} ({arrivalStatus.maidArrivalVerifiedBy.code})
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  ⏳ لم يتم التحقق من وصول الخادمة بعد
                </Typography>
                <Typography variant="body2">
                  🛡️ التأشيرة محمية من الإلغاء التلقائي حتى يتم التحقق من الوصول
                </Typography>
                {arrivalStatus.eligibleForArrivalVerification ? (
                  <Typography variant="caption" color="success.main">
                    ✅ مؤهلة للتحقق من الوصول
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    ⚠️ غير مؤهلة للتحقق من الوصول حالياً (المرحلة: {arrivalStatus.currentStage})
                  </Typography>
                )}
              </Box>
            )}
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
                      {canSkipStage(visa.currentStage) && (
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<SkipNextIcon />}
                          onClick={() => handleCompleteStage(visa.currentStage)}
                        >
                          تخطي المرحلة {visa.currentStage}
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
                  
                  {replacementEligibility?.eligible && (
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<ReplaceIcon />}
                      onClick={() => setReplaceDialog(true)}
                    >
                      استبدال التأشيرة
                      {replacementEligibility.remainingDays > 0 && (
                        <Chip 
                          label={`${replacementEligibility.remainingDays} يوم متبقي`}
                          size="small"
                          color="warning"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Button>
                  )}

                  {arrivalStatus?.eligibleForArrivalVerification && !arrivalStatus.maidArrivalVerified && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckIcon />}
                      onClick={() => setArrivalDialog(true)}
                    >
                      تأكيد وصول الخادمة
                    </Button>
                  )}
                  
                  {replacementEligibility && !replacementEligibility.eligible && 
                   visa?.status !== 'مباعة' && visa?.status !== 'ملغاة' && (
                    <Tooltip title={replacementEligibility.reasons.join(', ')}>
                      <span>
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<ReplaceIcon />}
                          disabled
                        >
                          استبدال التأشيرة (غير متاح)
                        </Button>
                      </span>
                    </Tooltip>
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
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="سكرتيرة البيع (اختياري)"
                  value={sellData.sellingSecretary}
                  onChange={(e) => setSellData(prev => ({ ...prev, sellingSecretary: e.target.value }))}
                  dir="rtl"
                >
                  <MenuItem value="">
                    <em>لا يوجد</em>
                  </MenuItem>
                  {secretaries.map((secretary) => (
                    <MenuItem key={secretary._id} value={secretary._id}>
                      {secretary.name} ({secretary.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {sellData.sellingSecretary && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="عمولة البيع"
                    type="number"
                    value={sellData.sellingCommission}
                    onChange={(e) => setSellData(prev => ({ ...prev, sellingCommission: e.target.value }))}
                    dir="rtl"
                    helperText="سيتم إضافة هذا المبلغ كمصروف للتأشيرة وأرباح للسكرتيرة"
                  />
                </Grid>
              )}
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

        {/* Dialog استبدال التأشيرة */}
        <Dialog open={replaceDialog} onClose={() => setReplaceDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>استبدال التأشيرة</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الاسم"
                  value={replaceData.name}
                  onChange={(e) => setReplaceData(prev => ({ ...prev, name: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الجنسية"
                  value={replaceData.nationality}
                  onChange={(e) => setReplaceData(prev => ({ ...prev, nationality: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="رقم الجواز"
                  value={replaceData.passportNumber}
                  onChange={(e) => setReplaceData(prev => ({ ...prev, passportNumber: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="رقم التأشيرة"
                  value={replaceData.visaNumber}
                  onChange={(e) => setReplaceData(prev => ({ ...prev, visaNumber: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="اسم المندوب"
                  value={replaceData.middlemanName}
                  onChange={(e) => setReplaceData(prev => ({ ...prev, middlemanName: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="كفيل التأشيرة"
                  value={replaceData.visaSponsor}
                  onChange={(e) => setReplaceData(prev => ({ ...prev, visaSponsor: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="تاريخ الميلاد"
                  value={replaceData.dateOfBirth}
                  onChange={(date) => setReplaceData(prev => ({ ...prev, dateOfBirth: date || new Date() }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      dir: 'rtl'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="تاريخ إصدار التأشيرة"
                  value={replaceData.visaIssueDate}
                  onChange={(date) => setReplaceData(prev => ({ ...prev, visaIssueDate: date || new Date() }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      dir: 'rtl'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="تاريخ انتهاء التأشيرة"
                  value={replaceData.visaExpiryDate}
                  onChange={(date) => setReplaceData(prev => ({ ...prev, visaExpiryDate: date || new Date() }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      dir: 'rtl'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="الموعد النهائي"
                  value={replaceData.visaDeadline}
                  onChange={(date) => setReplaceData(prev => ({ ...prev, visaDeadline: date || new Date() }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      dir: 'rtl'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="نسبة ربح السكرتيرة (%)"
                  type="number"
                  value={replaceData.secretaryProfitPercentage}
                  onChange={(e) => setReplaceData(prev => ({ ...prev, secretaryProfitPercentage: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReplaceDialog(false)}>إلغاء</Button>
            <Button onClick={handleReplaceVisa} variant="contained" color="warning">استبدال</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog تأكيد وصول الخادمة */}
        <Dialog open={arrivalDialog} onClose={() => setArrivalDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>تأكيد وصول الخادمة</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                بعد تأكيد الوصول، سيبدأ العد التنازلي لمدة 30 يوماً للموعد النهائي للإلغاء التلقائي
              </Typography>
            </Alert>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <DatePicker
                  label="تاريخ وصول الخادمة"
                  value={arrivalData.arrivalDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setArrivalData(prev => ({ ...prev, arrivalDate: newValue }));
                    }
                  }}
                  maxDate={new Date()}
                  minDate={visa ? new Date(visa.createdAt) : undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="تم التحقق بواسطة"
                  value={arrivalData.verifiedBy}
                  onChange={(e) => setArrivalData(prev => ({ ...prev, verifiedBy: e.target.value }))}
                  required
                >
                  {secretaries.map((secretary) => (
                    <MenuItem key={secretary._id} value={secretary._id}>
                      {secretary.name} ({secretary.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="ملاحظات (اختياري)"
                  value={arrivalData.notes}
                  onChange={(e) => setArrivalData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أي ملاحظات حول وصول الخادمة..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setArrivalDialog(false)}>إلغاء</Button>
            <Button 
              onClick={handleVerifyArrival} 
              variant="contained" 
              color="success"
              disabled={!arrivalData.verifiedBy}
            >
              تأكيد الوصول
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default VisaDetail; 