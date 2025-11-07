import React, { useState, useEffect } from 'react';
import apiClient from '../config/axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
  overview: {
    totalSecretaries: number;
    totalUnits: number;
    totalActiveContracts: number;
    totalMonthlyRent: number;
  };
  currentMonth: {
    monthYear: string;
    period: string;
    expected: number;
    collected: number;
    outstanding: number;
    collectionRate: number;
    contracts: {
      total: number;
      fullyPaid: number;
      partiallyPaid: number;
      unpaid: number;
    };
  };
  upcomingDueDates: Array<{
    date: string;
    dayOfMonth: number;
    contracts: number;
    totalAmount: number;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    date: string;
    method: string;
    contract: {
      unit: any;
      secretary: any;
      monthlyRent: number;
    };
  }>;
  topSecretaries: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
  }>;
  topUnits: Array<{
    id: string;
    unitNumber: string;
    unitType: string;
    address: string;
  }>;
}

const RentingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/renting-reports/dashboard');
      setDashboardData(response.data);
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

  if (!dashboardData) {
    return (
      <Alert severity="warning">
        لا توجد بيانات متاحة
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          لوحة معلومات نظام الإيجار
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/renting/secretaries/new')}
            sx={{ mr: 1 }}
          >
            إضافة سكرتير جديد
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/renting/units/new')}
          >
            إضافة وحدة جديدة
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {dashboardData.overview.totalSecretaries}
                  </Typography>
                  <Typography variant="body2">
                    إجمالي السكرتارية
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <HomeIcon sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {dashboardData.overview.totalUnits}
                  </Typography>
                  <Typography variant="body2">
                    إجمالي الوحدات
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PaymentIcon sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {dashboardData.overview.totalActiveContracts}
                  </Typography>
                  <Typography variant="body2">
                    العقود النشطة
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {formatCurrency(dashboardData.overview.totalMonthlyRent)}
                  </Typography>
                  <Typography variant="body2">
                    الإيجار الشهري الإجمالي
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Month Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1 }} />
                حالة المدفوعات للشهر الحالي: {dashboardData.currentMonth.monthYear}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={1}>
                    <Typography variant="h4" color="success.dark">
                      {dashboardData.currentMonth.contracts.fullyPaid}
                    </Typography>
                    <Typography variant="body2" color="success.dark">
                      مدفوع بالكامل
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center" p={2} bgcolor="warning.light" borderRadius={1}>
                    <Typography variant="h4" color="warning.dark">
                      {dashboardData.currentMonth.contracts.partiallyPaid}
                    </Typography>
                    <Typography variant="body2" color="warning.dark">
                      مدفوع جزئياً
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center" p={2} bgcolor="error.light" borderRadius={1}>
                    <Typography variant="h4" color="error.dark">
                      {dashboardData.currentMonth.contracts.unpaid}
                    </Typography>
                    <Typography variant="body2" color="error.dark">
                      غير مدفوع
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      إجمالي المحصل:
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(dashboardData.currentMonth.collected)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      المتبقي:
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(dashboardData.currentMonth.outstanding)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      نسبة التحصيل:
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {dashboardData.currentMonth.collectionRate}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                الاستحقاقات القادمة
              </Typography>
              
              {dashboardData.upcomingDueDates.length > 0 ? (
                <Box>
                  {dashboardData.upcomingDueDates.slice(0, 5).map((due, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {formatDate(due.date)}
                      </Typography>
                      <Typography variant="body2">
                        {due.contracts} عقد - {formatCurrency(due.totalAmount)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  لا توجد استحقاقات قادمة
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Payments and Top Lists */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PaymentIcon sx={{ mr: 1 }} />
                آخر المدفوعات
              </Typography>
              
              {dashboardData.recentPayments.length > 0 ? (
                <Box>
                  {dashboardData.recentPayments.slice(0, 5).map((payment, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" color="primary.main" fontWeight="bold">
                            {payment.contract.unit?.unitNumber || 'غير محدد'} - {payment.contract.secretary?.name || 'غير محدد'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(payment.date)} - {payment.method}
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  لا توجد مدفوعات حديثة
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ mr: 1 }} />
                أفضل السكرتارية
              </Typography>
              
              {dashboardData.topSecretaries.length > 0 ? (
                <Box>
                  {dashboardData.topSecretaries.map((secretary, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {secretary.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {secretary.phone} - {secretary.email}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  لا توجد سكرتارية متاحة
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                إجراءات سريعة
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate('/renting/secretaries')}
                  >
                    إدارة السكرتارية
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={() => navigate('/renting/units')}
                  >
                    إدارة الوحدات
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PaymentIcon />}
                    onClick={() => navigate('/renting/payments')}
                  >
                    إدارة المدفوعات
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/renting/reports')}
                  >
                    التقارير
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RentingDashboard;
