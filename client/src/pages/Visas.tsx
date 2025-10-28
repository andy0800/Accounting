import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  FileDownload as ExportIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';

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
  visaDeadline: string;
  secretary: {
    name: string;
    code: string;
  };
  createdAt: string;
}

const Visas: React.FC = () => {
  const [visas, setVisas] = useState<Visa[]>([]);
  const [filteredVisas, setFilteredVisas] = useState<Visa[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [stageFilter, setStageFilter] = useState<string>('الكل');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVisas();
  }, []);

  const filterVisas = useCallback(() => {
    let filtered = visas;

    if (statusFilter !== 'الكل') {
      filtered = filtered.filter(visa => visa.status === statusFilter);
    }

    if (stageFilter !== 'الكل') {
      filtered = filtered.filter(visa => visa.currentStage === stageFilter);
    }

    setFilteredVisas(filtered);
  }, [visas, statusFilter, stageFilter]);

  useEffect(() => {
    filterVisas();
  }, [visas, statusFilter, stageFilter, filterVisas]);

  const fetchVisas = async (page = 1, limit = 15) => {
    try {
      console.log(`🔄 Fetching visas - page ${page}, limit ${limit}`);
      const response = await apiClient.get(`/api/visas?page=${page}&limit=${limit}`);
      const payload = response.data;
      const list = Array.isArray(payload) ? payload : (payload?.visas ?? []);
      setVisas(list);
      console.log(`✅ Loaded ${list.length} visas`);
    } catch (error) {
      console.error('خطأ في جلب التأشيرات:', error);
    }
  };

  const handleViewVisa = (id: string) => {
    navigate(`/visas/${id}`);
  };

  const handleExport = async (status?: string) => {
    try {
      const url = status ? `/api/exports/visas/${status}` : '/api/exports/visas/all';
      const response = await apiClient.get(url, { responseType: 'blob' });
      
      const url2 = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url2;
      link.setAttribute('download', `تأشيرات_${status || 'الكل'}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'قيد_الشراء': return 'primary';
      case 'معروضة_للبيع': return 'success';
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
      case 'مكتملة': return 'success';
      default: return 'default';
    }
  };

  const getStatusCount = (status: string) => {
    return visas.filter(visa => visa.status === status).length;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          إدارة التأشيرات
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/visas/new')}
          sx={{ borderRadius: 2, px: 3 }}
        >
          تأشيرة جديدة
        </Button>
      </Box>

      {/* إحصائيات سريعة */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary.main">
                {getStatusCount('قيد_الشراء')}
              </Typography>
              <Typography color="text.secondary">قيد الشراء</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {getStatusCount('معروضة_للبيع')}
              </Typography>
              <Typography color="text.secondary">معروضة للبيع</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {getStatusCount('مباعة')}
              </Typography>
              <Typography color="text.secondary">مباعة</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {getStatusCount('ملغاة')}
              </Typography>
              <Typography color="text.secondary">ملغاة</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* فلاتر */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">فلاتر</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="status-label">الحالة</InputLabel>
                <Select
                  labelId="status-label"
                  value={statusFilter}
                  label="الحالة"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="الكل">الكل</MenuItem>
                  <MenuItem value="قيد_الشراء">قيد الشراء</MenuItem>
                  <MenuItem value="معروضة_للبيع">معروضة للبيع</MenuItem>
                  <MenuItem value="مباعة">مباعة</MenuItem>
                  <MenuItem value="ملغاة">ملغاة</MenuItem>
                  <MenuItem value="مستبدلة">مستبدلة</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="stage-label">المرحلة</InputLabel>
                <Select
                  labelId="stage-label"
                  value={stageFilter}
                  label="المرحلة"
                  onChange={(e) => setStageFilter(e.target.value)}
                >
                  <MenuItem value="الكل">الكل</MenuItem>
                  <MenuItem value="أ">أ</MenuItem>
                  <MenuItem value="ب">ب</MenuItem>
                  <MenuItem value="ج">ج</MenuItem>
                  <MenuItem value="د">د</MenuItem>
                  <MenuItem value="مكتملة">مكتملة</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={() => handleExport()}
                fullWidth
              >
                تصدير الكل
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={() => handleExport(statusFilter !== 'الكل' ? statusFilter : undefined)}
                fullWidth
              >
                تصدير المفلترة
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* جدول التأشيرات */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            قائمة التأشيرات ({filteredVisas.length})
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الاسم</TableCell>
                  <TableCell>الجنسية</TableCell>
                  <TableCell>رقم جواز السفر</TableCell>
                  <TableCell>السكرتيرة</TableCell>
                  <TableCell>المرحلة الحالية</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>إجمالي المصروفات</TableCell>
                  <TableCell>سعر البيع</TableCell>
                  <TableCell>الربح</TableCell>
                  <TableCell>الموعد النهائي</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVisas.map((visa) => (
                  <TableRow key={visa._id}>
                    <TableCell>{visa.name}</TableCell>
                    <TableCell>{visa.nationality}</TableCell>
                    <TableCell>{visa.passportNumber}</TableCell>
                    <TableCell>
                      <Chip label={visa.secretary.code} size="small" />
                    </TableCell>
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
                      {visa.visaDeadline ? new Date(visa.visaDeadline).toLocaleDateString('en-US') : 'غير محدد'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton onClick={() => handleViewVisa(visa._id)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
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

export default Visas; 