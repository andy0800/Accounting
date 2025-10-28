import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Description,
  AccountBalance,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardData {
  totalVisas: number;
  activeVisas: number;
  availableVisas: number;
  soldVisas: number;
  cancelledVisas: number;
  totalExpenses: number;
  totalProfit: number;
  totalSecretaryEarnings: number;
  totalCompanyProfit: number;
  totalSecretaryDebt: number;
  secretaryCount: number;
  overdueVisas: number;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async (retryCount = 0) => {
    try {
      if (retryCount > 0) {
        setIsRetrying(true);
        setRetryAttempt(retryCount);
      }
      
      const response = await apiClient.get('/api/accounts/summary');
      setData(response.data);
      setRetryAttempt(0);
      setIsRetrying(false);
    } catch (error: any) {
      console.error('خطأ في جلب بيانات لوحة التحكم:', error);
      
      // Retry logic for timeout errors (Render free tier can be slow)
      if (error.code === 'ECONNABORTED' && retryCount < 2) {
        console.log(`🔄 Retrying request (attempt ${retryCount + 1}/2)...`);
        setTimeout(() => {
          fetchDashboardData(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Log error but don't set error state since it was removed
      console.error('فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.');
      setIsRetrying(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const pieData = useMemo(() => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    return data ? [
      { name: 'نشطة', value: data.activeVisas, color: COLORS[0] },
      { name: 'متاحة', value: data.availableVisas, color: COLORS[1] },
      { name: 'مباعة', value: data.soldVisas, color: COLORS[2] },
      { name: 'ملغاة', value: data.cancelledVisas, color: COLORS[3] },
    ] : [];
  }, [data]);

  const barData = useMemo(() => data ? [
    { name: 'إجمالي المصروفات', value: data.totalExpenses },
    { name: 'إجمالي الربح', value: data.totalProfit },
    { name: 'أرباح السكرتارية', value: data.totalSecretaryEarnings },
    { name: 'ربح الشركة', value: data.totalCompanyProfit },
  ] : [], [data]);

  if (loading || isRetrying) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>لوحة التحكم</Typography>
        
        {isRetrying && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
              🔄 إعادة المحاولة {retryAttempt}/2 - الخادم يستيقظ من النوم...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              هذا أمر طبيعي مع الخطة المجانية - قد يستغرق بضع ثوانٍ
            </Typography>
          </Box>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <LoadingSkeleton type="card" />
          </Grid>
          <Grid item xs={12} md={3}>
            <LoadingSkeleton type="card" />
          </Grid>
          <Grid item xs={12} md={3}>
            <LoadingSkeleton type="card" />
          </Grid>
          <Grid item xs={12} md={3}>
            <LoadingSkeleton type="card" />
          </Grid>
          <Grid item xs={12} md={6}>
            <LoadingSkeleton type="chart" />
          </Grid>
          <Grid item xs={12} md={6}>
            <LoadingSkeleton type="chart" />
          </Grid>
        </Grid>
      </Box>
    );
  }


  if (!data) {
    return <Typography>خطأ في تحميل بيانات لوحة التحكم</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        لوحة التحكم
      </Typography>

      {/* الإجراءات السريعة */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/visas/new')}
            sx={{ height: 60 }}
          >
            تأشيرة جديدة
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/secretaries')}
            sx={{ height: 60 }}
          >
            إدارة السكرتارية
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/visas')}
            sx={{ height: 60 }}
          >
            عرض جميع التأشيرات
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/accounts')}
            sx={{ height: 60 }}
          >
            عرض الحسابات
          </Button>
        </Grid>
      </Grid>

      {/* بطاقات الإحصائيات */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Description color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    إجمالي التأشيرات
                  </Typography>
                  <Typography variant="h4">
                    {data.totalVisas}
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
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    إجمالي الربح
                  </Typography>
                  <Typography variant="h4">
                    ${data.totalProfit.toLocaleString()}
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
                <People color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    السكرتارية
                  </Typography>
                  <Typography variant="h4">
                    {data.secretaryCount}
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
                <Warning color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    التأشيرات المتأخرة
                  </Typography>
                  <Typography variant="h4">
                    {data.overdueVisas || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* الرسوم البيانية والتفاصيل */}
      <Grid container spacing={3}>
        {/* رسم بياني لحالة التأشيرات */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              توزيع حالة التأشيرات
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* نظرة عامة مالية */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              النظرة العامة المالية
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* ملخص الحالة */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              ملخص الحالة
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Schedule color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="التأشيرات النشطة"
                  secondary={`${data.activeVisas} تأشيرة قيد الشراء`}
                />
                <Chip label={data.activeVisas} color="primary" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="متاحة للبيع"
                  secondary={`${data.availableVisas} تأشيرة جاهزة للبيع`}
                />
                <Chip label={data.availableVisas} color="success" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingUp color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="التأشيرات المباعة"
                  secondary={`${data.soldVisas} تأشيرة مكتملة`}
                />
                <Chip label={data.soldVisas} color="success" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingDown color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="التأشيرات الملغاة"
                  secondary={`${data.cancelledVisas} تأشيرة ملغاة`}
                />
                <Chip label={data.cancelledVisas} color="error" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* الملخص المالي */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              الملخص المالي
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <AccountBalance color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="إجمالي المصروفات"
                  secondary="جميع مصروفات التأشيرات مجتمعة"
                />
                <Typography variant="h6" color="error">
                  ${data.totalExpenses.toLocaleString()}
                </Typography>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingUp color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="إجمالي الربح"
                  secondary="الربح الإجمالي من جميع التأشيرات المباعة"
                />
                <Typography variant="h6" color="success">
                  ${data.totalProfit.toLocaleString()}
                </Typography>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <People color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="أرباح السكرتارية"
                  secondary="إجمالي أرباح جميع السكرتارية"
                />
                <Typography variant="h6" color="primary">
                  ${data.totalSecretaryEarnings.toLocaleString()}
                </Typography>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AccountBalance color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="ربح الشركة"
                  secondary="صافي ربح شركة فرصتكم"
                />
                <Typography variant="h6" color="success">
                  ${data.totalCompanyProfit.toLocaleString()}
                </Typography>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 