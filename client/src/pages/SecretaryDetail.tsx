import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import apiClient from '../config/axios';

interface Secretary {
  _id: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  totalEarnings: number;
  totalDebt: number;
  activeVisas?: string[];
  completedVisas?: string[];
  cancelledVisas?: string[];
  createdAt: string;
}

const SecretaryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [secretary, setSecretary] = useState<Secretary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/secretaries/${id}`);
        setSecretary(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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

  if (!secretary) {
    return (
      <Alert severity="warning">
        السكرتيرة غير موجودة
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/secretaries')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          تفاصيل السكرتيرة: {secretary.name}
        </Typography>
      </Box>

      {/* Secretary Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>المعلومات الأساسية</Typography>
              <Typography><strong>الاسم:</strong> {secretary.name}</Typography>
              <Typography><strong>الرمز:</strong> <Chip label={secretary.code} color="primary" size="small" /></Typography>
              <Typography><strong>البريد الإلكتروني:</strong> {secretary.email || '-'}</Typography>
              <Typography><strong>رقم الهاتف:</strong> {secretary.phone || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>المعلومات المالية</Typography>
              <Typography><strong>إجمالي الأرباح:</strong> {secretary.totalEarnings.toLocaleString()} دينار</Typography>
              <Typography><strong>إجمالي الدين:</strong> {secretary.totalDebt.toLocaleString()} دينار</Typography>
              <Typography><strong>الحالة:</strong> 
                <Chip 
                  label={secretary.totalEarnings > secretary.totalDebt ? 'ربح' : 'خسارة'} 
                  color={secretary.totalEarnings > secretary.totalDebt ? 'success' : 'error'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>إحصائيات التأشيرات</Typography>
              <Typography><strong>التأشيرات النشطة:</strong> {secretary.activeVisas?.length || 0}</Typography>
              <Typography><strong>التأشيرات المكتملة:</strong> {secretary.completedVisas?.length || 0}</Typography>
              <Typography><strong>التأشيرات الملغاة:</strong> {secretary.cancelledVisas?.length || 0}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>معلومات النظام</Typography>
              <Typography><strong>تاريخ التسجيل:</strong> {formatDate(secretary.createdAt)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecretaryDetail;
