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
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  FileDownload as ExportIcon
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

interface SecretaryAccount {
  secretary: {
    _id: string;
    name: string;
    code: string;
    email: string;
    phone: string;
  };
  account: {
    name: string;
    type: string;
    totalExpenses: number;
    totalEarnings: number;
    totalDebt: number;
  };
  statistics: {
    totalVisas: number;
    activeVisas: number;
    availableVisas: number;
    soldVisas: number;
    cancelledVisas: number;
    totalExpenses: number;
    totalEarnings: number;
    totalDebt: number;
    averageProfitPerVisa: number;
    monthlyExpenses: number;
    monthlyEarnings: number;
    yearlyExpenses: number;
    yearlyEarnings: number;
  };
  visas: any[];
}

const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [companyAccount, setCompanyAccount] = useState<CompanyAccount | null>(null);
  const [secretaryAccounts, setSecretaryAccounts] = useState<SecretaryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const [companyResponse, secretariesResponse] = await Promise.all([
        axios.get('/api/accounts/company'),
        axios.get('/api/accounts/secretaries')
      ]);

      setCompanyAccount(companyResponse.data);
      setSecretaryAccounts(secretariesResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('خطأ في جلب الحسابات:', error);
      setError('خطأ في جلب بيانات الحسابات');
      setLoading(false);
    }
  };

  const handleExportCompanyReport = async () => {
    try {
      const response = await axios.get('/api/exports/company-report', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `تقرير-الشركة-${new Date().toISOString().split('T')[0]}.xlsx`);
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
        <Typography>خطأ في تحميل بيانات الحسابات</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          إدارة الحسابات
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          onClick={handleExportCompanyReport}
        >
          تصدير تقرير الشركة
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="حساب الشركة" />
        <Tab label="حسابات السكرتارية" />
      </Tabs>

      {/* تبويب حساب الشركة */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* إحصائيات سريعة */}
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

          {/* تفاصيل مالية */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  الإحصائيات الشهرية
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
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  الإحصائيات السنوية
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
                      secondary={`${companyAccount.statistics.yearlyProfit.toLocaleString()} ريال`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* ملخص التأشيرات */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ملخص التأشيرات
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
                        {companyAccount.statistics.averageProfitPerVisa.toLocaleString()} ريال
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        متوسط الربح لكل تأشيرة
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* تبويب حسابات السكرتارية */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* إحصائيات السكرتارية */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ملخص السكرتارية
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary">
                        {secretaryAccounts.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        إجمالي السكرتارية
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="success.main">
                        {secretaryAccounts.reduce((sum, sa) => sum + sa.statistics.totalEarnings, 0).toLocaleString()} ريال
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        إجمالي أرباح السكرتارية
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="error">
                        {secretaryAccounts.reduce((sum, sa) => sum + sa.statistics.totalDebt, 0).toLocaleString()} ريال
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        إجمالي ديون السكرتارية
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="h4" color="info.main">
                        {secretaryAccounts.reduce((sum, sa) => sum + sa.statistics.totalVisas, 0)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        إجمالي التأشيرات
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* جدول حسابات السكرتارية */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  تفاصيل حسابات السكرتارية
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>السكرتير</TableCell>
                        <TableCell>الرمز</TableCell>
                        <TableCell>إجمالي التأشيرات</TableCell>
                        <TableCell>التأشيرات النشطة</TableCell>
                        <TableCell>التأشيرات المباعة</TableCell>
                        <TableCell>التأشيرات الملغاة</TableCell>
                        <TableCell>إجمالي الأرباح</TableCell>
                        <TableCell>إجمالي الدين</TableCell>
                        <TableCell>صافي الربح</TableCell>
                        <TableCell>متوسط الربح</TableCell>
                        <TableCell>الإجراءات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {secretaryAccounts.map((secretaryAccount) => (
                        <TableRow key={secretaryAccount.secretary._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon color="primary" />
                              {secretaryAccount.secretary.name}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={secretaryAccount.secretary.code} color="primary" size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip label={secretaryAccount.statistics.totalVisas} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={secretaryAccount.statistics.activeVisas} 
                              color="primary" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={secretaryAccount.statistics.soldVisas} 
                              color="success" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={secretaryAccount.statistics.cancelledVisas} 
                              color="error" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography color="success.main" fontWeight="bold">
                              {secretaryAccount.statistics.totalEarnings.toLocaleString()} ريال
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography color="error.main" fontWeight="bold">
                              {secretaryAccount.statistics.totalDebt.toLocaleString()} ريال
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              color={secretaryAccount.statistics.totalEarnings > secretaryAccount.statistics.totalDebt ? 'success.main' : 'error.main'} 
                              fontWeight="bold"
                            >
                              {(secretaryAccount.statistics.totalEarnings - secretaryAccount.statistics.totalDebt).toLocaleString()} ريال
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography color="info.main">
                              {secretaryAccount.statistics.averageProfitPerVisa.toLocaleString()} ريال
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => navigate(`/secretaries/${secretaryAccount.secretary._id}`)}
                            >
                              عرض التفاصيل
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Accounts; 