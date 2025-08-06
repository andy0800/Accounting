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
  Divider,
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
  FileDownload as ExportIcon,
  BarChart as ChartIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
  };
}

const CompanyAccount: React.FC = () => {
  const navigate = useNavigate();
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
        <Tab label="تفاصيل التأشيرات" />
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
                      {companyAccount.statistics.totalExpenses.toLocaleString()} ريال
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
                      {companyAccount.statistics.totalProfit.toLocaleString()} ريال
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
                      secondary={`${companyAccount.statistics.totalExpenses.toLocaleString()} ريال`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="إجمالي الربح"
                      secondary={`${companyAccount.statistics.totalProfit.toLocaleString()} ريال`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <MoneyIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="متوسط الربح لكل تأشيرة"
                      secondary={`${companyAccount.statistics.averageProfitPerVisa.toLocaleString()} ريال`}
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
                            {companyAccount.statistics.monthlyExpenses.toLocaleString()} ريال
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>الأرباح الشهرية</TableCell>
                        <TableCell>
                          <Typography color="success.main" fontWeight="bold">
                            {companyAccount.statistics.monthlyProfit.toLocaleString()} ريال
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
                            {(companyAccount.statistics.monthlyProfit - companyAccount.statistics.monthlyExpenses).toLocaleString()} ريال
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
                            {companyAccount.statistics.yearlyExpenses.toLocaleString()} ريال
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>الأرباح السنوية</TableCell>
                        <TableCell>
                          <Typography color="success.main" fontWeight="bold">
                            {companyAccount.statistics.yearlyProfit.toLocaleString()} ريال
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
                            {(companyAccount.statistics.yearlyProfit - companyAccount.statistics.yearlyExpenses).toLocaleString()} ريال
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
                        {companyAccount.statistics.averageProfitPerVisa.toLocaleString()} ريال
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
                            {companyAccount.statistics.totalProfit.toLocaleString()} ريال
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
                          <Typography color="error" fontWeight="bold">
                            {companyAccount.statistics.totalExpenses.toLocaleString()} ريال
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Chip label="نشطة" color="primary" />
                        </TableCell>
                        <TableCell>{companyAccount.statistics.totalActiveVisas}</TableCell>
                        <TableCell>
                          {companyAccount.statistics.totalVisasBought > 0 ? 
                            ((companyAccount.statistics.totalActiveVisas / companyAccount.statistics.totalVisasBought) * 100).toFixed(1) : 0}%
                        </TableCell>
                        <TableCell>
                          <Typography color="primary" fontWeight="bold">
                            قيد المعالجة
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
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
                            secondary={`${companyAccount.statistics.monthlyExpenses.toLocaleString()} ريال`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <TrendingUpIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="الأرباح الشهرية"
                            secondary={`${companyAccount.statistics.monthlyProfit.toLocaleString()} ريال`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <MoneyIcon color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="صافي الربح الشهري"
                            secondary={`${(companyAccount.statistics.monthlyProfit - companyAccount.statistics.monthlyExpenses).toLocaleString()} ريال`}
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
                            secondary={`${companyAccount.statistics.yearlyExpenses.toLocaleString()} ريال`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <TrendingUpIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="الأرباح السنوية"
                            secondary={`${companyAccount.statistics.yearlyProfit.toLocaleString()} ريال`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <MoneyIcon color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="صافي الربح السنوي"
                            secondary={`${(companyAccount.statistics.yearlyProfit - companyAccount.statistics.yearlyExpenses).toLocaleString()} ريال`}
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