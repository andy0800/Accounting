import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Secretary {
  _id: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  totalEarnings: number;
  totalDebt: number;
  activeVisas: number;
  completedVisas: number;
}

interface Visa {
  _id: string;
  name: string;
  nationality: string;
  passportNumber: string;
  currentStage: string;
  status: string;
  totalExpenses: number;
  sellingPrice?: number;
  profit?: number;
  secretaryEarnings?: number;
  deadline: string;
}

const SecretaryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [secretary, setSecretary] = useState<Secretary | null>(null);
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSecretaryDetails();
      fetchSecretaryVisas();
    }
  }, [id]);

  const fetchSecretaryDetails = async () => {
    try {
      const response = await axios.get(`/api/secretaries/${id}`);
      setSecretary(response.data);
    } catch (error) {
      console.error('خطأ في جلب تفاصيل السكرتيرة:', error);
    }
  };

  const fetchSecretaryVisas = async () => {
    try {
      const response = await axios.get(`/api/visas?secretary=${id}`);
      setVisas(response.data);
      setLoading(false);
    } catch (error) {
      console.error('خطأ في جلب تأشيرات السكرتيرة:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشطة': return 'primary';
      case 'متاحة للبيع': return 'success';
      case 'مباعة': return 'info';
      case 'ملغاة': return 'error';
      case 'مستبدلة': return 'warning';
      default: return 'default';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'أ': return 'primary';
      case 'ب': return 'secondary';
      case 'ج': return 'info';
      case 'د': return 'warning';
      case 'هـ': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>جاري التحميل...</Typography>
      </Container>
    );
  }

  if (!secretary) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>لم يتم العثور على السكرتيرة</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        تفاصيل السكرتيرة
      </Typography>

      {/* معلومات السكرتيرة */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" component="h2">
                {secretary.name}
              </Typography>
              <Chip label={secretary.code} color="primary" sx={{ mt: 1 }} />
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography color="text.secondary">البريد الإلكتروني: {secretary.email}</Typography>
              <Typography color="text.secondary">رقم الهاتف: {secretary.phone}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* الإحصائيات */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" color="success.main">
                  {secretary.totalEarnings.toLocaleString()} دينار
                </Typography>
              </Box>
              <Typography color="text.secondary">الأرباح الإجمالية</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6" color="error.main">
                  {secretary.totalDebt.toLocaleString()} دينار
                </Typography>
              </Box>
              <Typography color="text.secondary">الديون</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="primary.main">
                  {secretary.activeVisas}
                </Typography>
              </Box>
              <Typography color="text.secondary">التأشيرات النشطة</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" color="success.main">
                  {secretary.completedVisas}
                </Typography>
              </Box>
              <Typography color="text.secondary">التأشيرات المكتملة</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* قائمة التأشيرات */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            تأشيرات السكرتيرة
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الاسم</TableCell>
                  <TableCell>الجنسية</TableCell>
                  <TableCell>رقم جواز السفر</TableCell>
                  <TableCell>المرحلة الحالية</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>إجمالي المصروفات</TableCell>
                  <TableCell>سعر البيع</TableCell>
                  <TableCell>الربح</TableCell>
                  <TableCell>أرباح السكرتيرة</TableCell>
                  <TableCell>الموعد النهائي</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visas.map((visa) => (
                  <TableRow key={visa._id}>
                    <TableCell>{visa.name}</TableCell>
                    <TableCell>{visa.nationality}</TableCell>
                    <TableCell>{visa.passportNumber}</TableCell>
                    <TableCell>
                      <Chip 
                        label={visa.currentStage} 
                        color={getStageColor(visa.currentStage) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={visa.status} 
                        color={getStatusColor(visa.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{visa.totalExpenses.toLocaleString()} دينار</TableCell>
                    <TableCell>
                      {visa.sellingPrice ? `${visa.sellingPrice.toLocaleString()} دينار` : '-'}
                    </TableCell>
                    <TableCell>
                      {visa.profit ? `${visa.profit.toLocaleString()} دينار` : '-'}
                    </TableCell>
                    <TableCell>
                      {visa.secretaryEarnings ? `${visa.secretaryEarnings.toLocaleString()} دينار` : '-'}
                    </TableCell>
                                            <TableCell>{new Date(visa.deadline).toLocaleDateString('en-US')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SecretaryDetail; 