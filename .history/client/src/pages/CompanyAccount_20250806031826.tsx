import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';
import axios from 'axios';

interface CompanyAccount {
  name: string;
  type: string;
  totalExpenses: number;
  totalProfit: number;
  totalVisasBought: number;
  totalVisasSold: number;
  totalVisasCancelled: number;
  activeVisas: number;
  statistics: {
    totalExpenses: number;
    totalProfit: number;
    totalVisasBought: number;
    totalVisasSold: number;
    totalVisasCancelled: number;
    totalActiveVisas: number;
    averageProfitPerVisa: number;
    monthlyExpenses: number;
    monthlyProfit: number;
    yearlyExpenses: number;
    yearlyProfit: number;
    companyProfitPerVisa: Array<{
      visaId: string;
      reference: string;
      name: string;
      secretary: {
        _id: string;
        name: string;
        code: string;
      };
      sellingPrice: number;
      totalExpenses: number;
      profit: number;
      secretaryEarnings: number;
      companyProfit: number;
      soldAt: string;
    }>;
    allBoughtVisas: Array<{
      visaId: string;
      reference: string;
      name: string;
      secretary: {
        _id: string;
        name: string;
        code: string;
      };
      status: string;
      currentStage: string;
      totalExpenses: number;
      sellingPrice: number;
      profit: number;
      secretaryEarnings: number;
      companyProfit: number;
      createdAt: string;
      soldAt: string;
      visaDeadline: string;
      customerName: string;
      customerPhone: string;
      sellingSecretary: string | null;
      sellingCommission: number;
    }>;
  };
}

const CompanyAccount: React.FC = () => {
  const [companyAccount, setCompanyAccount] = useState<CompanyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchCompanyAccount();
  }, []);

  const fetchCompanyAccount = async () => {
    try {
      const response = await axios.get('/api/accounts/company');
      console.log('Company Account Data:', response.data);
      console.log('Statistics:', response.data.statistics);
      console.log('All Bought Visas:', response.data.statistics?.allBoughtVisas);
      console.log('Company Profit Per Visa:', response.data.statistics?.companyProfitPerVisa);
      setCompanyAccount(response.data);
      setLoading(false);
    } catch (error) {
      console.error('خطأ في جلب حساب الشركة:', error);
      setError('خطأ في جلب بيانات حساب الشركة');
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await axios.get('/api/exports/company-report', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `تقرير-شركة-فرصتكم-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('خطأ في تصدير تقرير الشركة');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>جاري التحميل...</Typography>
      </Container>
    );
  }

  if (!companyAccount) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>خطأ في تحميل بيانات حساب الشركة</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          حساب شركة فرصتكم
        </Typography>
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={handleExportReport}
        >
          تصدير التقرير الكامل
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="الملخص العام" />
        <Tab label="الإحصائيات المالية" />
        <Tab label="التقارير الشهرية" />
      </Tabs>

      {/* تبويب الملخص العام */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* البطاقات الرئيسية */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      إجمالي المصروفات
                    </Typography>
                    <Typography variant="h4" color="error">
                      {companyAccount.statistics.totalExpenses.toLocaleString()} دينار
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
                  <TrendingUpIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      إجمالي الربح
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {companyAccount.statistics.totalProfit.toLocaleString()} دينار
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
                  <ScheduleIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      التأشيرات النشطة
                    </Typography>
                    <Typography variant="h4">
                      {companyAccount.statistics.totalActiveVisas}
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
                  <CheckIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      التأشيرات المباعة
                    </Typography>
                    <Typography variant="h4">
                      {companyAccount.statistics.totalVisasSold}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ملخص مالي شامل */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  الملخص المالي
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingDownIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="إجمالي المصروفات"
                      secondary={`${companyAccount.statistics.totalExpenses.toLocaleString()} دينار`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="إجمالي الربح"
                      secondary={`${companyAccount.statistics.totalProfit.toLocaleString()} دينار`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <MoneyIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="متوسط الربح لكل تأشيرة"
                      secondary={`${companyAccount.statistics.averageProfitPerVisa.toLocaleString()} دينار`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ملخص التأشيرات
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <AccountIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="إجمالي التأشيرات المشتراة"
                      secondary={`${companyAccount.statistics.totalVisasBought} تأشيرة`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="التأشيرات المباعة"
                      secondary={`${companyAccount.statistics.totalVisasSold} تأشيرة`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="التأشيرات الملغاة"
                      secondary={`${companyAccount.statistics.totalVisasCancelled} تأشيرة`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* تبويب الإحصائيات المالية */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  الإحصائيات الشهرية
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>البند</TableCell>
                        <TableCell>المبلغ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>المصروفات الشهرية</TableCell>
                        <TableCell>
                          <Typography color="error" fontWeight="bold">
                            {companyAccount.statistics.monthlyExpenses.toLocaleString()} دينار
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>الأرباح الشهرية</TableCell>
                        <TableCell>
                          <Typography color="success.main" fontWeight="bold">
                            {companyAccount.statistics.monthlyProfit.toLocaleString()} دينار
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>صافي الربح الشهري</TableCell>
                        <TableCell>
                          <Typography 
                            color={companyAccount.statistics.monthlyProfit > companyAccount.statistics.monthlyExpenses ? 'success.main' : 'error'} 
                            fontWeight="bold"
                          >
                            {(companyAccount.statistics.monthlyProfit - companyAccount.statistics.monthlyExpenses).toLocaleString()} دينار
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  الإحصائيات السنوية
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>البند</TableCell>
                        <TableCell>المبلغ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>المصروفات السنوية</TableCell>
                        <TableCell>
                          <Typography color="error" fontWeight="bold">
                            {companyAccount.statistics.yearlyExpenses.toLocaleString()} دينار
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>الأرباح السنوية</TableCell>
                        <TableCell>
                          <Typography color="success.main" fontWeight="bold">
                            {companyAccount.statistics.yearlyProfit.toLocaleString()} دينار
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>صافي الربح السنوي</TableCell>
                        <TableCell>
                          <Typography 
                            color={companyAccount.statistics.yearlyProfit > companyAccount.statistics.yearlyExpenses ? 'success.main' : 'error'} 
                            fontWeight="bold"
                          >
                            {(companyAccount.statistics.yearlyProfit - companyAccount.statistics.yearlyExpenses).toLocaleString()} دينار
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  تحليل الربحية
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="info.main">
                        {companyAccount.statistics.averageProfitPerVisa.toLocaleString()} دينار
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        متوسط الربح لكل تأشيرة
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="success.main">
                        {companyAccount.statistics.totalVisasSold > 0 ? 
                          ((companyAccount.statistics.totalProfit / companyAccount.statistics.totalVisasSold) * 100).toFixed(1) : 0}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        نسبة الربح من المبيعات
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary">
                        {companyAccount.statistics.totalVisasBought > 0 ? 
                          ((companyAccount.statistics.totalVisasSold / companyAccount.statistics.totalVisasBought) * 100).toFixed(1) : 0}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        نسبة نجاح البيع
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="error">
                        {companyAccount.statistics.totalVisasBought > 0 ? 
                          ((companyAccount.statistics.totalVisasCancelled / companyAccount.statistics.totalVisasBought) * 100).toFixed(1) : 0}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        نسبة الإلغاء
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* جدول ربح الشركة لكل تأشيرة */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ربح الشركة لكل تأشيرة مباعة
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>المرجع</TableCell>
                        <TableCell>الاسم</TableCell>
                        <TableCell>السكرتيرة</TableCell>
                        <TableCell>سعر البيع</TableCell>
                        <TableCell>إجمالي المصروفات</TableCell>
                        <TableCell>الربح الإجمالي</TableCell>
                        <TableCell>أرباح السكرتيرة</TableCell>
                        <TableCell>ربح الشركة</TableCell>
                        <TableCell>تاريخ البيع</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        console.log('Rendering companyProfitPerVisa:', companyAccount.statistics.companyProfitPerVisa);
                        return companyAccount.statistics.companyProfitPerVisa?.map((visa) => (
                        <TableRow key={visa.visaId}>
                          <TableCell>{visa.reference}</TableCell>
                          <TableCell>{visa.name}</TableCell>
                          <TableCell>{visa.secretary.name} ({visa.secretary.code})</TableCell>
                          <TableCell>{visa.sellingPrice.toLocaleString()} دينار</TableCell>
                          <TableCell>{visa.totalExpenses.toLocaleString()} دينار</TableCell>
                          <TableCell>{visa.profit.toLocaleString()} دينار</TableCell>
                          <TableCell>{visa.secretaryEarnings.toLocaleString()} دينار</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {visa.companyProfit.toLocaleString()} دينار
                          </TableCell>
                          <TableCell>{new Date(visa.soldAt).toLocaleDateString('en-US')}</TableCell>
                        </TableRow>
                      ));
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* تبويب تفاصيل التأشيرات */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  إحصائيات التأشيرات التفصيلية
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary">
                        {companyAccount.statistics.totalVisasBought}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        إجمالي التأشيرات المشتراة
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="success.main">
                        {companyAccount.statistics.totalVisasSold}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        التأشيرات المباعة
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="error">
                        {companyAccount.statistics.totalVisasCancelled}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        التأشيرات الملغاة
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="info.main">
                        {companyAccount.statistics.totalActiveVisas}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        التأشيرات النشطة
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  تحليل حالة التأشيرات
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>الحالة</TableCell>
                        <TableCell>العدد</TableCell>
                        <TableCell>النسبة</TableCell>
                        <TableCell>القيمة الإجمالية</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Chip label="مباعة" color="success" />
                        </TableCell>
                        <TableCell>{companyAccount.statistics.totalVisasSold}</TableCell>
                        <TableCell>
                          {companyAccount.statistics.totalVisasBought > 0 ? 
                            ((companyAccount.statistics.totalVisasSold / companyAccount.statistics.totalVisasBought) * 100).toFixed(1) : 0}%
                        </TableCell>
                        <TableCell>
                          <Typography color="success.main" fontWeight="bold">
                            {companyAccount.statistics.totalProfit.toLocaleString()} دينار
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Chip label="ملغاة" color="error" />
                        </TableCell>
                        <TableCell>{companyAccount.statistics.totalVisasCancelled}</TableCell>
                        <TableCell>
                          {companyAccount.statistics.totalVisasBought > 0 ? 
                            ((companyAccount.statistics.totalVisasCancelled / companyAccount.statistics.totalVisasBought) * 100).toFixed(1) : 0}%
                        </TableCell>
                        <TableCell>
                          <Typography color="error.main" fontWeight="bold">
                            {companyAccount.statistics.totalExpenses.toLocaleString()} دينار
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Chip label="نشطة" color="warning" />
                        </TableCell>
                        <TableCell>{companyAccount.statistics.totalActiveVisas}</TableCell>
                        <TableCell>
                          {companyAccount.statistics.totalVisasBought > 0 ? 
                            ((companyAccount.statistics.totalActiveVisas / companyAccount.statistics.totalVisasBought) * 100).toFixed(1) : 0}%
                        </TableCell>
                        <TableCell>
                          <Typography color="warning.main" fontWeight="bold">
                            {companyAccount.statistics.totalExpenses.toLocaleString()} دينار
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  تفاصيل جميع التأشيرات المشتراة مع ربح الشركة
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <TableContainer component={Paper} sx={{ minWidth: 1400 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>المرجع</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>الاسم</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>السكرتيرة</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>الحالة</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }}>المرحلة</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>إجمالي المصروفات</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>سعر البيع</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>الربح الإجمالي</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>أرباح السكرتيرة</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>ربح الشركة</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>سكرتيرة البيع</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>عمولة البيع</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>تاريخ الإنشاء</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>تاريخ البيع</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>تاريخ انتهاء التأشيرة</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          console.log('Rendering allBoughtVisas:', companyAccount.statistics.allBoughtVisas);
                          return companyAccount.statistics.allBoughtVisas?.map((visa) => (
                          <TableRow key={visa.visaId} hover>
                            <TableCell sx={{ fontWeight: 'medium' }}>{visa.reference}</TableCell>
                            <TableCell>{visa.name}</TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {visa.secretary.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {visa.secretary.code}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={visa.status} 
                                color={
                                  visa.status === 'مباعة' ? 'success' : 
                                  visa.status === 'ملغاة' ? 'error' : 
                                  visa.status === 'قيد الشراء' ? 'warning' : 
                                  visa.status === 'معروضة للبيع' ? 'info' : 'default'
                                } 
                                size="small"
                                sx={{ minWidth: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={visa.currentStage} 
                                color={
                                  visa.currentStage === 'أ' ? 'primary' :
                                  visa.currentStage === 'ب' ? 'secondary' :
                                  visa.currentStage === 'ج' ? 'info' :
                                  visa.currentStage === 'د' ? 'warning' :
                                  visa.currentStage === 'مكتملة' ? 'success' : 'default'
                                }
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'medium', color: 'error.main' }}>
                              {visa.totalExpenses.toLocaleString()} دينار
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                              {visa.sellingPrice > 0 ? `${visa.sellingPrice.toLocaleString()} دينار` : '-'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'medium', color: 'success.main' }}>
                              {visa.profit > 0 ? `${visa.profit.toLocaleString()} دينار` : '-'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'medium', color: 'info.main' }}>
                              {visa.secretaryEarnings > 0 ? `${visa.secretaryEarnings.toLocaleString()} دينار` : '-'}
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              color: visa.companyProfit >= 0 ? 'success.main' : 'error.main',
                              fontSize: '1.1rem'
                            }}>
                              {visa.companyProfit.toLocaleString()} دينار
                            </TableCell>
                            <TableCell>
                              {visa.sellingSecretary || '-'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'medium', color: 'secondary.main' }}>
                              {visa.sellingCommission > 0 ? `${visa.sellingCommission.toLocaleString()} دينار` : '-'}
                            </TableCell>
                            <TableCell>{new Date(visa.createdAt).toLocaleDateString('en-US')}</TableCell>
                            <TableCell>{visa.soldAt ? new Date(visa.soldAt).toLocaleDateString('en-US') : '-'}</TableCell>
                            <TableCell>{visa.visaDeadline ? new Date(visa.visaDeadline).toLocaleDateString('en-US') : '-'}</TableCell>
                          </TableRow>
                        ));
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* تبويب التقارير الشهرية */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  مقارنة الأداء الشهري والسنوي
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        الأداء الشهري
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <TrendingDownIcon color="error" />
                          </ListItemIcon>
                          <ListItemText
                            primary="المصروفات الشهرية"
                            secondary={`${companyAccount.statistics.monthlyExpenses.toLocaleString()} دينار`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <TrendingUpIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="الأرباح الشهرية"
                            secondary={`${companyAccount.statistics.monthlyProfit.toLocaleString()} دينار`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <MoneyIcon color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="صافي الربح الشهري"
                            secondary={`${(companyAccount.statistics.monthlyProfit - companyAccount.statistics.monthlyExpenses).toLocaleString()} دينار`}
                          />
                        </ListItem>
                      </List>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        الأداء السنوي
      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <TrendingDownIcon color="error" />
                          </ListItemIcon>
                          <ListItemText
                            primary="المصروفات السنوية"
                            secondary={`${companyAccount.statistics.yearlyExpenses.toLocaleString()} دينار`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <TrendingUpIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="الأرباح السنوية"
                            secondary={`${companyAccount.statistics.yearlyProfit.toLocaleString()} دينار`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <MoneyIcon color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="صافي الربح السنوي"
                            secondary={`${(companyAccount.statistics.yearlyProfit - companyAccount.statistics.yearlyExpenses).toLocaleString()} دينار`}
                          />
                        </ListItem>
                      </List>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default CompanyAccount; 