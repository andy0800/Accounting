import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/axios';

interface Invoice {
  _id: string;
  referenceNumber: string;
  type: 'income' | 'spending';
  ledger: 'cash' | 'bank';
  bankReference?: string;
  name: string;
  value: number;
  date: string;
  status: 'active' | 'deleted';
  isEdited?: boolean;
  createdBy?: { username: string };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ledgerLabels: Record<string, string> = {
  bank: 'حساب بنكي',
  cash: 'صندوق نقدي',
};

const typeLabels: Record<string, string> = {
  income: 'فاتورة دخل',
  spending: 'إيصال صرف',
};

const statusLabels: Record<string, string> = {
  active: 'نشط',
  deleted: 'محذوف',
};

const FursatkumInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const [filters, setFilters] = useState({
    type: 'all',
    ledger: 'all',
    status: 'active',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/fursatkum/invoices', { params: filters });
      setData(response.data.invoices || []);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب الفواتير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.type, filters.ledger, filters.status, filters.startDate, filters.endDate]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/exports/fursatkum/invoices', {
        params: { type: filters.type, ledger: filters.ledger, status: filters.status },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fursatkum-invoices-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('خطأ في تصدير الفواتير');
    }
  };

  const statusColor = useMemo(
    () => ({
      active: 'success',
      deleted: 'error',
    }) as const,
    []
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          فواتير فرصتكم
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
            تصدير Excel
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
            تحديث
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/fursatkum/invoices/new')}
          >
            فاتورة جديدة
          </Button>
        </Stack>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Card color="error">
            <CardContent>
              <Typography color="error">{error}</Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="النوع"
                value={filters.type}
                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value, page: 1 }))}
              >
                <MenuItem value="all">الكل</MenuItem>
                <MenuItem value="income">فاتورة دخل</MenuItem>
                <MenuItem value="spending">إيصال صرف</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="الدفة"
                value={filters.ledger}
                onChange={(e) => setFilters((prev) => ({ ...prev, ledger: e.target.value, page: 1 }))}
              >
                <MenuItem value="all">الكل</MenuItem>
                <MenuItem value="cash">صندوق نقدي</MenuItem>
                <MenuItem value="bank">حساب بنكي</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="الحالة"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
              >
                <MenuItem value="active">نشط</MenuItem>
                <MenuItem value="deleted">محذوف</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="بحث"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button size="small" onClick={handleSearch}>
                        بحث
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="من تاريخ"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value, page: 1 }))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="إلى تاريخ"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value, page: 1 }))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>الاسم</TableCell>
                      <TableCell>المرجع</TableCell>
                      <TableCell>النوع</TableCell>
                      <TableCell>الدفة</TableCell>
                      <TableCell>القيمة</TableCell>
                      <TableCell>أنشأها</TableCell>
                      <TableCell>التاريخ</TableCell>
                      <TableCell>الحالة</TableCell>
                      <TableCell>المحرر</TableCell>
                      <TableCell>إجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          لا توجد فواتير
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((inv) => (
                        <TableRow key={inv._id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{inv.name}</TableCell>
                          <TableCell>{inv.referenceNumber}</TableCell>
                          <TableCell>{typeLabels[inv.type]}</TableCell>
                          <TableCell>{ledgerLabels[inv.ledger]}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            {inv.value.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                          </TableCell>
                          <TableCell>{inv.createdBy?.username || '-'}</TableCell>
                          <TableCell>{new Date(inv.date).toLocaleDateString('ar-KW')}</TableCell>
                          <TableCell>
                            <Chip label={statusLabels[inv.status]} color={statusColor[inv.status]} size="small" />
                          </TableCell>
                          <TableCell>{inv.isEdited ? 'نعم' : 'لا'}</TableCell>
                          <TableCell>
                            <Tooltip title="عرض التفاصيل">
                              <IconButton size="small" onClick={() => navigate(`/fursatkum/invoices/${inv._id}`)}>
                                🔍
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {pagination && pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={pagination.pages}
                    page={filters.page}
                    onChange={(_, page) => setFilters((prev) => ({ ...prev, page }))}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FursatkumInvoices;


