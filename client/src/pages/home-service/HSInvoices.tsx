import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
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
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/axios';

interface Invoice {
  _id: string;
  referenceNumber: string;
  type: 'income' | 'spending';
  name: string;
  value: number;
  date: string;
  details?: string;
  document?: { name: string; filePath: string };
  status: 'active' | 'deleted';
  isEdited: boolean;
  createdBy?: { username: string };
  createdAt: string;
}

const HSInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'spending'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; invoice: Invoice | null }>({
    open: false,
    invoice: null,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = { page: page.toString(), limit: '20' };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (search) params.search = search;

      const response = await apiClient.get('/api/home-service/invoices', { params });
      setInvoices(response.data.invoices);
      setTotalPages(response.data.pagination.pages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب الفواتير');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async () => {
    if (!deleteDialog.invoice) return;
    try {
      setDeleting(true);
      await apiClient.delete(`/api/home-service/invoices/${deleteDialog.invoice._id}`);
      setDeleteDialog({ open: false, invoice: null });
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في حذف الفاتورة');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      
      const response = await apiClient.get('/api/exports/home-service/invoices', {
        params,
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `home-service-invoices-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('خطأ في تصدير الفواتير');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          الفواتير
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            تصدير Excel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => navigate('/home-service/invoices/new?type=income')}
          >
            فاتورة دخل
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<AddIcon />}
            onClick={() => navigate('/home-service/invoices/new?type=spending')}
          >
            إيصال صرف
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={typeFilter}
          onChange={(_, v) => { setTypeFilter(v); setPage(1); }}
          sx={{ mb: 2 }}
        >
          <Tab label="الكل" value="all" />
          <Tab label="فواتير الدخل" value="income" />
          <Tab label="إيصالات الصرف" value="spending" />
        </Tabs>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="بحث بالمرجع أو الاسم..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="small"
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={fetchInvoices}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="text"
            onClick={() => navigate('/home-service/deleted')}
          >
            عرض المحذوفات
          </Button>
        </Box>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>المرجع</TableCell>
                  <TableCell>النوع</TableCell>
                  <TableCell>الاسم</TableCell>
                  <TableCell>القيمة</TableCell>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>أنشأها</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      لا توجد فواتير
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice._id} hover>
                      <TableCell>
                        <Typography fontWeight="bold">{invoice.referenceNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.type === 'income' ? 'دخل' : 'صرف'}
                          color={invoice.type === 'income' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {invoice.name}
                        {invoice.isEdited && (
                          <Chip
                            label="تم التعديل"
                            size="small"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                            color="warning"
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {invoice.value.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.date).toLocaleDateString('ar-KW')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status === 'active' ? 'نشط' : 'محذوف'}
                          color={invoice.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{invoice.createdBy?.username || '-'}</TableCell>
                      <TableCell>
                        <Tooltip title="عرض">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/home-service/invoices/${invoice._id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="تعديل">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/home-service/invoices/${invoice._id}?edit=true`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, invoice })}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, invoice: null })}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف الفاتورة "{deleteDialog.invoice?.name}"؟
            <br />
            <strong>سيتم عكس المبلغ تلقائياً وتسجيل الفاتورة في قسم المحذوفات.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, invoice: null })} disabled={deleting}>
            إلغاء
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HSInvoices;

